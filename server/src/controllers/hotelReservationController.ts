import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { notificationService } from '../services/notificationService';

// Helper to compute nights between check-in and check-out
const calculateNights = (checkInStr: string, checkOutStr: string): number => {
  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);
  const diffTime = checkOut.getTime() - checkIn.getTime();
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

// Helper to detect conflicts (overlapping bookings for the same guest at the same hotel)
const checkDuplicateConflict = async (hotelId: string, guestName: string, checkInStr: string, checkOutStr: string, excludeId?: string) => {
  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);
  const p = prisma as any;

  const overlapping = await p.hotelReservation.findFirst({
    where: {
      hotelId,
      guestName: { equals: guestName, mode: 'insensitive' },
      status: { notIn: ['Cancelled', 'Rejected'] },
      id: excludeId ? { not: excludeId } : undefined,
      OR: [
        {
          checkIn: { lte: checkIn },
          checkOut: { gt: checkIn }
        },
        {
          checkIn: { lt: checkOut },
          checkOut: { gte: checkOut }
        },
        {
          checkIn: { gte: checkIn },
          checkOut: { lte: checkOut }
        }
      ]
    }
  });

  return !!overlapping;
};

// Retrieve all reservations
export const getReservations = async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const { status, hotelId, checkInStart, checkInEnd, search } = req.query;

    const where: any = {};
    if (status) where.status = status as string;
    if (hotelId) where.hotelId = hotelId as string;
    
    if (checkInStart || checkInEnd) {
      where.checkIn = {};
      if (checkInStart) where.checkIn.gte = new Date(checkInStart as string);
      if (checkInEnd) where.checkIn.lte = new Date(checkInEnd as string);
    }

    if (search) {
      where.OR = [
        { guestName: { contains: search as string, mode: 'insensitive' } },
        { guestEmail: { contains: search as string, mode: 'insensitive' } },
        { bookingReference: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const reservations = await p.hotelReservation.findMany({
      where,
      include: {
        hotel: true,
        inquiry: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Check conflicts dynamically for each reservation
    const reservationsWithConflictFlag = await Promise.all(
      reservations.map(async (resItem: any) => {
        const isConflicting = await checkDuplicateConflict(
          resItem.hotelId,
          resItem.guestName,
          resItem.checkIn,
          resItem.checkOut,
          resItem.id
        );
        return {
          ...resItem,
          hasConflict: isConflicting
        };
      })
    );

    res.json(reservationsWithConflictFlag);
  } catch (error: any) {
    console.error('[ReservationsController] Fetch error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve hotel reservations' });
  }
};

// Retrieve single reservation details
export const getReservationById = async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const reservation = await p.hotelReservation.findUnique({
      where: { id: req.params.id },
      include: {
        hotel: true,
        inquiry: true
      }
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const hasConflict = await checkDuplicateConflict(
      reservation.hotelId,
      reservation.guestName,
      reservation.checkIn,
      reservation.checkOut,
      reservation.id
    );

    res.json({
      ...reservation,
      hasConflict
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch reservation' });
  }
};

// Create a new B2B reservation
export const createReservation = async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const {
      inquiryId,
      hotelId,
      guestName,
      guestEmail,
      guestPhone,
      checkIn,
      checkOut,
      roomType,
      roomsCount,
      adults,
      children,
      mealPlan,
      specialRequests,
      status,
      paymentStatus,
      holdUntil,
      contractRate,
      seasonalPricing,
      commissionRate,
      totalAmount,
      bookingReference,
      agentName,
      internalNotes,
      confirmationDeadline,
      tokenExpiresInHours
    } = req.body;

    const nights = calculateNights(checkIn, checkOut);
    const rooms = Number(roomsCount) || 1;
    const cRate = Number(contractRate) || 0;
    const sPrice = Number(seasonalPricing) || 0;
    const commRate = Number(commissionRate) || 0;
    const grossTotal = Number(totalAmount) || 0;

    // Fetch hotel partner details for reception contact autofill
    const hotelRecord = await p.hotel.findUnique({ where: { id: hotelId } });
    const receptionEmail = req.body.receptionEmail || hotelRecord?.contactEmail || null;
    const receptionPhone = req.body.receptionPhone || hotelRecord?.contactPhone || null;
    const receptionContact = req.body.receptionContact || hotelRecord?.contactName || 'Front Desk / Reservations';

    // Net Cost calculation: (contractRate + seasonalPricing) * roomsCount * nights
    const netCost = (cRate + sPrice) * rooms * nights;
    
    let profit = grossTotal - netCost;
    if (commRate > 0) {
      profit = grossTotal * (commRate / 100);
    }
    const hotelDues = netCost;

    const hasConflict = await checkDuplicateConflict(hotelId, guestName, checkIn, checkOut);

    // Cryptographically secure token for account-free reception link
    const secureToken = crypto.randomBytes(32).toString('hex');
    const expiryHours = Number(tokenExpiresInHours) || 48;
    const tokenExpiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    const deadline = confirmationDeadline ? new Date(confirmationDeadline) : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const generatedRef = bookingReference || `KC-HTL-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Initial audit log
    const auditLogs = JSON.stringify([
      {
        timestamp: new Date().toISOString(),
        action: 'Reservation Dispatched to Hotel',
        user: req.user?.name || req.user?.email || 'Operations Desk',
        details: `Voucher reference ${generatedRef} dispatched to ${hotelRecord?.name || 'Hotel'} (${receptionContact}). Deadline: ${deadline.toLocaleString()}.`
      }
    ]);

    // Validate createdById relation safety
    let validUserId: string | null = null;
    if (req.user?.id && req.user?.role !== 'hospitality') {
      try {
        const u = await p.user.findUnique({ where: { id: req.user.id } });
        if (u) validUserId = req.user.id;
      } catch {}
    }

    const reservation = await p.hotelReservation.create({
      data: {
        inquiryId: inquiryId || null,
        hotelId,
        guestName,
        guestEmail: guestEmail || null,
        guestPhone: guestPhone || null,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        roomType: roomType || 'Standard Category',
        roomsCount: rooms,
        adults: Number(adults) || 2,
        children: Number(children) || 0,
        mealPlan: mealPlan || 'EP',
        specialRequests: specialRequests || null,
        status: status || 'Pending',
        confirmationStage: 'PENDING_RESPONSE',
        paymentStatus: paymentStatus || 'Unpaid',
        bookingReference: generatedRef,
        holdUntil: holdUntil ? new Date(holdUntil) : null,
        contractRate: cRate,
        seasonalPricing: sPrice,
        commissionRate: commRate,
        totalAmount: grossTotal,
        profitMargin: profit,
        hotelDues: hotelDues,
        createdById: validUserId,
        agentName: agentName || (req.user?.name ? `${req.user.name} (B2B Desk)` : 'Kashmir Curators Desk'),
        internalNotes: internalNotes || null,
        secureToken,
        tokenExpiresAt,
        confirmationDeadline: deadline,
        receptionContact,
        receptionEmail,
        receptionPhone,
        auditLogs
      },
      include: {
        hotel: true,
        inquiry: true
      }
    });

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'CREATE',
        message: `New reservation voucher ${generatedRef} for ${guestName} dispatched to ${hotelRecord?.name || 'hotel'}`,
        booking: { ...reservation, entityType: 'reservation' }
      });
    }

    res.status(201).json({
      ...reservation,
      hasConflict
    });
  } catch (error: any) {
    console.error('[ReservationsController] Creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create reservation' });
  }
};

// Update reservation status, hold timers, references, and record audit logs
export const updateReservation = async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const { id } = req.params;
    const { status, paymentStatus, bookingReference, holdUntil, specialRequests, roomsCount, roomType, mealPlan } = req.body;

    const existing = await p.hotelReservation.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Reservation not found' });

    const updateData: any = {};
    const logEntries = [];
    const username = req.user?.name || req.user?.email || 'Operations Desk';

    if (status && status !== existing.status) {
      updateData.status = status;
      logEntries.push({
        timestamp: new Date().toISOString(),
        action: `Status: ${existing.status} -> ${status}`,
        user: username,
        details: `Reservation status transitioned.`
      });
    }

    if (paymentStatus && paymentStatus !== existing.paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      logEntries.push({
        timestamp: new Date().toISOString(),
        action: `Payment Status: ${existing.paymentStatus} -> ${paymentStatus}`,
        user: username,
        details: `Payment status updated.`
      });
    }

    if (bookingReference !== undefined && bookingReference !== existing.bookingReference) {
      updateData.bookingReference = bookingReference;
      logEntries.push({
        timestamp: new Date().toISOString(),
        action: 'Ref Code Updated',
        user: username,
        details: `Hotel booking reference updated to: ${bookingReference}`
      });
    }

    if (holdUntil !== undefined) {
      updateData.holdUntil = holdUntil ? new Date(holdUntil) : null;
    }
    if (specialRequests !== undefined) updateData.specialRequests = specialRequests;
    if (roomsCount !== undefined) updateData.roomsCount = Number(roomsCount) || 1;
    if (roomType !== undefined) updateData.roomType = roomType;
    if (mealPlan !== undefined) updateData.mealPlan = mealPlan;

    // Recalculate profit and dues if rooms count or dates changed
    if (roomsCount !== undefined || req.body.checkIn || req.body.checkOut) {
      const checkIn = req.body.checkIn ? new Date(req.body.checkIn) : existing.checkIn;
      const checkOut = req.body.checkOut ? new Date(req.body.checkOut) : existing.checkOut;
      updateData.checkIn = checkIn;
      updateData.checkOut = checkOut;
      
      const nights = calculateNights(checkIn.toISOString(), checkOut.toISOString());
      const rooms = Number(roomsCount !== undefined ? roomsCount : existing.roomsCount) || 1;
      const netCost = (existing.contractRate + (existing.seasonalPricing || 0)) * rooms * nights;
      
      let profit = existing.totalAmount - netCost;
      if (existing.commissionRate > 0) {
        profit = existing.totalAmount * (existing.commissionRate / 100);
      }
      updateData.profitMargin = profit;
      updateData.hotelDues = netCost;
    }

    // Append history to auditLogs
    let history = [];
    try {
      history = JSON.parse(existing.auditLogs || '[]');
    } catch (e) {
      history = [];
    }
    const updatedHistory = [...history, ...logEntries];
    updateData.auditLogs = JSON.stringify(updatedHistory);

    const updated = await p.hotelReservation.update({
      where: { id },
      data: updateData,
      include: {
        hotel: true,
        inquiry: true
      }
    });

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: `Reservation for ${updated.guestName} updated to ${updated.status}`,
        booking: { ...updated, entityType: 'reservation' }
      });
    }

    res.json(updated);
  } catch (error: any) {
    console.error('[ReservationsController] Update error:', error);
    res.status(500).json({ error: 'Failed to update reservation' });
  }
};

// Confirm hotel booking and lock dues/margins
export const confirmReservation = async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const { id } = req.params;
    const { bookingReference } = req.body;

    const existing = await p.hotelReservation.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Reservation not found' });

    let history = [];
    try {
      history = JSON.parse(existing.auditLogs || '[]');
    } catch (e) {
      history = [];
    }

    const username = req.user?.name || req.user?.email || 'Operations Desk';
    history.push({
      timestamp: new Date().toISOString(),
      action: 'Confirmed',
      user: username,
      details: `Reservation confirmed by Hotel. Reference: ${bookingReference || 'N/A'}`
    });

    const updated = await p.hotelReservation.update({
      where: { id },
      data: {
        status: 'Confirmed',
        bookingReference: bookingReference || existing.bookingReference,
        auditLogs: JSON.stringify(history)
      },
      include: {
        hotel: true,
        inquiry: true
      }
    });

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: `Hotel Reservation CONFIRMED for ${updated.guestName}`,
        booking: { ...updated, entityType: 'reservation' }
      });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to confirm reservation' });
  }
};

// Simulate quote dispatch to hotel partner (via email or WhatsApp)
export const simulateSendQuote = async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const { id } = req.params;
    const { channel } = req.body; // 'email' | 'whatsapp'

    const existing = await p.hotelReservation.findUnique({
      where: { id },
      include: { hotel: true }
    });
    if (!existing) return res.status(404).json({ error: 'Reservation not found' });

    let history = [];
    try {
      history = JSON.parse(existing.auditLogs || '[]');
    } catch (e) {
      history = [];
    }

    const username = req.user?.name || req.user?.email || 'Operations Desk';
    history.push({
      timestamp: new Date().toISOString(),
      action: 'Request Dispatched',
      user: username,
      details: `Reservation quote request transmitted to ${existing.hotel.name} via ${channel || 'Operations Link'}.`
    });

    const updated = await p.hotelReservation.update({
      where: { id },
      data: {
        status: 'Sent',
        auditLogs: JSON.stringify(history)
      },
      include: {
        hotel: true,
        inquiry: true
      }
    });

    // Send actual email if channel is email
    if (channel === 'email') {
      const referer = req.headers.referer || req.headers.origin || 'https://kashmir-connect-main.vercel.app';
      let cleanOrigin = 'https://kashmir-connect-main.vercel.app';
      try {
        const urlObj = new URL(referer);
        cleanOrigin = urlObj.origin;
      } catch (e) {
        if (referer.startsWith('http')) {
          cleanOrigin = referer;
        }
      }
      const publicUrl = `${cleanOrigin}/hotel/confirm/${existing.id}`;
      console.log(`[Hotel Automation] Dispatching actual request email for reservation ${existing.id} to URL: ${publicUrl}`);
      await notificationService.sendHotelReservationRequest(updated, publicUrl);
    }

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: `Quote request sent to hotel: ${existing.hotel.name} for ${updated.guestName}`,
        booking: { ...updated, entityType: 'reservation' }
      });
    }

    res.json({
      success: true,
      message: `Quote successfully dispatched via ${channel || 'email'}.`,
      reservation: updated
    });
  } catch (error: any) {
    console.error('[ReservationsController] Send request error:', error);
    res.status(500).json({ error: 'Failed to dispatch quote' });
  }
};

// Delete a B2B reservation
export const deleteReservation = async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const { id } = req.params;

    const existing = await p.hotelReservation.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Reservation not found' });

    await p.hotelReservation.delete({ where: { id } });

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'DELETE',
        message: `Reservation for ${existing.guestName} deleted`,
        booking: { id, entityType: 'reservation' }
      });
    }

    res.json({ success: true, message: 'Reservation successfully deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete reservation' });
  }
};

// Retrieve reservation details for secure public web confirmations
export const getPublicReservation = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const lookupKey = req.params.tokenOrId || req.params.id;

    if (!lookupKey) {
      return res.status(400).json({ error: 'Missing reservation identifier or token' });
    }

    const reservation = await p.hotelReservation.findFirst({
      where: {
        OR: [
          { secureToken: lookupKey },
          { id: lookupKey }
        ]
      },
      include: { hotel: true }
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation details not found or link is invalid' });
    }

    const isExpired = reservation.tokenExpiresAt ? new Date() > new Date(reservation.tokenExpiresAt) : false;

    // Return non-sensitive particulars for public reception view
    res.json({
      isExpired,
      id: reservation.id,
      secureToken: reservation.secureToken,
      bookingReference: reservation.bookingReference,
      hotelName: reservation.hotel.name,
      hotelLocation: reservation.hotel.location,
      hotelImage: reservation.hotel.image,
      hotelContactName: reservation.hotel.contactName,
      hotelContactEmail: reservation.hotel.contactEmail,
      hotelContactPhone: reservation.hotel.contactPhone,
      guestName: reservation.guestName,
      guestPhone: reservation.guestPhone,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      nights: calculateNights(reservation.checkIn, reservation.checkOut),
      roomType: reservation.roomType,
      roomsCount: reservation.roomsCount,
      adults: reservation.adults,
      children: reservation.children,
      mealPlan: reservation.mealPlan,
      specialRequests: reservation.specialRequests,
      contractRate: reservation.contractRate,
      estimatedNetTotal: (reservation.contractRate || 0) * (reservation.roomsCount || 1) * calculateNights(reservation.checkIn, reservation.checkOut),
      status: reservation.status,
      confirmationStage: reservation.confirmationStage || 'PENDING_RESPONSE',
      confirmationDeadline: reservation.confirmationDeadline,
      tokenExpiresAt: reservation.tokenExpiresAt,
      receptionContact: reservation.receptionContact,
      receptionEmail: reservation.receptionEmail,
      receptionPhone: reservation.receptionPhone,
      hotelConfirmationNumber: reservation.hotelConfirmationNumber,
      confirmedRoomType: reservation.confirmedRoomType,
      confirmedRoomsCount: reservation.confirmedRoomsCount,
      confirmedTariff: reservation.confirmedTariff,
      confirmedTaxes: reservation.confirmedTaxes,
      confirmedMealPlan: reservation.confirmedMealPlan,
      confirmationVoucherUrl: reservation.confirmationVoucherUrl,
      receptionNotes: reservation.receptionNotes,
      rejectionReason: reservation.rejectionReason,
      alternativeRoomType: reservation.alternativeRoomType,
      alternativeTariff: reservation.alternativeTariff,
      alternativeDates: reservation.alternativeDates,
      alternativeNotes: reservation.alternativeNotes,
      clarificationRequest: reservation.clarificationRequest,
      clarificationResponse: reservation.clarificationResponse,
      respondedAt: reservation.respondedAt,
      respondedBy: reservation.respondedBy,
      agentName: reservation.agentName
    });
  } catch (error: any) {
    console.error('[ReservationsController] Public fetch error:', error);
    res.status(500).json({ error: 'Failed to retrieve reservation details' });
  }
};

// 1. Reception confirms room availability (stage: AVAILABILITY_CONFIRMED)
export const receptionConfirmAvailability = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const lookupKey = req.params.tokenOrId || req.params.id;
    const { receptionistName, notes } = req.body;

    const existing = await p.hotelReservation.findFirst({
      where: { OR: [{ secureToken: lookupKey }, { id: lookupKey }] },
      include: { hotel: true }
    });

    if (!existing) return res.status(404).json({ error: 'Reservation not found' });
    if (existing.tokenExpiresAt && new Date() > new Date(existing.tokenExpiresAt)) {
      return res.status(410).json({ error: 'Confirmation link has expired. Please contact Kashmir Curators.' });
    }

    let history = [];
    try { history = JSON.parse(existing.auditLogs || '[]'); } catch (e) { history = []; }

    history.push({
      timestamp: new Date().toISOString(),
      action: 'Availability Confirmed by Hotel Reception',
      user: receptionistName || existing.hotel.contactName || 'Hotel Reception Staff',
      details: `Availability verified and reserved. Notes: ${notes || 'Rooms blocked awaiting final confirmation.'}`
    });

    const updated = await p.hotelReservation.update({
      where: { id: existing.id },
      data: {
        confirmationStage: 'AVAILABILITY_CONFIRMED',
        respondedAt: new Date(),
        respondedBy: receptionistName || existing.receptionContact || 'Hotel Reception',
        receptionNotes: notes || existing.receptionNotes,
        auditLogs: JSON.stringify(history)
      },
      include: { hotel: true, inquiry: true }
    });

    if ((req as any).io) {
      (req as any).io.to('admin-room').emit('new-system-event', {
        type: 'AVAILABILITY_CONFIRMED',
        message: `Hotel ${updated.hotel.name} confirmed room availability for ${updated.guestName}`,
        booking: { ...updated, entityType: 'reservation' }
      });
    }

    res.json({
      success: true,
      message: 'Room availability confirmed successfully.',
      reservation: updated
    });
  } catch (error: any) {
    console.error('[ReservationsController] Confirm availability error:', error);
    res.status(500).json({ error: 'Failed to record availability confirmation' });
  }
};

// 2. Reception confirms final booking (stage: HOTEL_CONFIRMED, status: Confirmed)
export const receptionConfirmBooking = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const lookupKey = req.params.tokenOrId || req.params.id;
    const {
      hotelConfirmationNumber,
      confirmedRoomType,
      confirmedRoomsCount,
      confirmedTariff,
      confirmedTaxes,
      confirmedMealPlan,
      confirmationVoucherUrl,
      receptionNotes,
      respondedBy
    } = req.body;

    if (!hotelConfirmationNumber) {
      return res.status(400).json({ error: 'Hotel Booking Confirmation Reference is required' });
    }

    const existing = await p.hotelReservation.findFirst({
      where: { OR: [{ secureToken: lookupKey }, { id: lookupKey }] },
      include: { hotel: true }
    });

    if (!existing) return res.status(404).json({ error: 'Reservation not found' });
    if (existing.tokenExpiresAt && new Date() > new Date(existing.tokenExpiresAt)) {
      return res.status(410).json({ error: 'Confirmation link has expired. Please contact Kashmir Curators.' });
    }

    const nights = calculateNights(existing.checkIn, existing.checkOut);
    const rooms = Number(confirmedRoomsCount) || existing.roomsCount || 1;
    const tariff = Number(confirmedTariff) || existing.contractRate || 0;
    const recalculatedDues = tariff * rooms * nights;

    let history = [];
    try { history = JSON.parse(existing.auditLogs || '[]'); } catch (e) { history = []; }

    const responder = respondedBy || existing.receptionContact || 'Hotel Reception Manager';

    history.push({
      timestamp: new Date().toISOString(),
      action: 'Final Hotel Booking Confirmed',
      user: responder,
      details: `Guaranteed booking confirmed by hotel reception. Hotel Ref: ${hotelConfirmationNumber}. Rate: ₹${tariff}/night. Meal Plan: ${confirmedMealPlan || existing.mealPlan}. Notes: ${receptionNotes || 'Confirmed as requested.'}`
    });

    const updated = await p.hotelReservation.update({
      where: { id: existing.id },
      data: {
        status: 'Confirmed',
        confirmationStage: 'HOTEL_CONFIRMED',
        hotelConfirmationNumber,
        bookingReference: hotelConfirmationNumber,
        confirmedRoomType: confirmedRoomType || existing.roomType,
        confirmedRoomsCount: rooms,
        confirmedTariff: tariff,
        confirmedTaxes: confirmedTaxes ? Number(confirmedTaxes) : undefined,
        confirmedMealPlan: confirmedMealPlan || existing.mealPlan,
        confirmationVoucherUrl: confirmationVoucherUrl || existing.confirmationVoucherUrl,
        receptionNotes: receptionNotes || existing.receptionNotes,
        respondedAt: new Date(),
        respondedBy: responder,
        contractRate: tariff > 0 ? tariff : existing.contractRate,
        hotelDues: recalculatedDues > 0 ? recalculatedDues : existing.hotelDues,
        auditLogs: JSON.stringify(history)
      },
      include: { hotel: true, inquiry: true }
    });

    if ((req as any).io) {
      (req as any).io.to('admin-room').emit('new-system-event', {
        type: 'HOTEL_CONFIRMED',
        message: `Hotel ${updated.hotel.name} confirmed reservation ${hotelConfirmationNumber} for ${updated.guestName}!`,
        booking: { ...updated, entityType: 'reservation' }
      });
    }

    res.json({
      success: true,
      message: 'Reservation booking successfully confirmed and guaranteed.',
      reservation: updated
    });
  } catch (error: any) {
    console.error('[ReservationsController] Public confirm booking error:', error);
    res.status(500).json({ error: 'Failed to submit hotel booking confirmation' });
  }
};

// Backward-compatible confirm endpoint
export const confirmPublicReservation = async (req: Request, res: Response) => {
  const { bookingReference, hotelConfirmationNumber } = req.body;
  req.body.hotelConfirmationNumber = hotelConfirmationNumber || bookingReference || 'HOTEL-CONFIRMED';
  return receptionConfirmBooking(req, res);
};

// 3. Reception proposes alternative room category, rates, or dates (stage: ALTERNATIVE_OFFERED)
export const receptionOfferAlternative = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const lookupKey = req.params.tokenOrId || req.params.id;
    const {
      alternativeRoomType,
      alternativeTariff,
      alternativeDates,
      alternativeNotes,
      respondedBy
    } = req.body;

    const existing = await p.hotelReservation.findFirst({
      where: { OR: [{ secureToken: lookupKey }, { id: lookupKey }] },
      include: { hotel: true }
    });

    if (!existing) return res.status(404).json({ error: 'Reservation not found' });
    if (existing.tokenExpiresAt && new Date() > new Date(existing.tokenExpiresAt)) {
      return res.status(410).json({ error: 'Confirmation link has expired. Please contact Kashmir Curators.' });
    }

    let history = [];
    try { history = JSON.parse(existing.auditLogs || '[]'); } catch (e) { history = []; }

    const responder = respondedBy || existing.receptionContact || 'Hotel Reception Desk';

    history.push({
      timestamp: new Date().toISOString(),
      action: 'Alternative Proposed by Hotel',
      user: responder,
      details: `Hotel proposed alternative: Category: ${alternativeRoomType || 'Same'} | Tariff: ₹${alternativeTariff || 'N/A'}/night | Dates: ${alternativeDates || 'Same'}. Note: ${alternativeNotes || 'Awaiting Kashmir Curators approval.'}`
    });

    const updated = await p.hotelReservation.update({
      where: { id: existing.id },
      data: {
        confirmationStage: 'ALTERNATIVE_OFFERED',
        alternativeRoomType: alternativeRoomType || null,
        alternativeTariff: alternativeTariff ? Number(alternativeTariff) : null,
        alternativeDates: alternativeDates || null,
        alternativeNotes: alternativeNotes || null,
        respondedAt: new Date(),
        respondedBy: responder,
        auditLogs: JSON.stringify(history)
      },
      include: { hotel: true, inquiry: true }
    });

    if ((req as any).io) {
      (req as any).io.to('admin-room').emit('new-system-event', {
        type: 'ALTERNATIVE_OFFERED',
        message: `Hotel ${updated.hotel.name} proposed an alternative for ${updated.guestName}`,
        booking: { ...updated, entityType: 'reservation' }
      });
    }

    res.json({
      success: true,
      message: 'Alternative proposal transmitted to Kashmir Curators desk.',
      reservation: updated
    });
  } catch (error: any) {
    console.error('[ReservationsController] Propose alternative error:', error);
    res.status(500).json({ error: 'Failed to record alternative proposal' });
  }
};

// 4. Reception rejects request as unavailable (stage: REJECTED_UNAVAILABLE, status: Rejected)
export const rejectPublicReservation = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const lookupKey = req.params.tokenOrId || req.params.id;
    const { reason, respondedBy } = req.body;

    const existing = await p.hotelReservation.findFirst({
      where: { OR: [{ secureToken: lookupKey }, { id: lookupKey }] },
      include: { hotel: true }
    });

    if (!existing) return res.status(404).json({ error: 'Reservation not found' });

    let history = [];
    try { history = JSON.parse(existing.auditLogs || '[]'); } catch (e) { history = []; }

    const responder = respondedBy || existing.receptionContact || 'Hotel Partner';

    history.push({
      timestamp: new Date().toISOString(),
      action: 'Declined as Unavailable by Hotel',
      user: responder,
      details: `Reservation declined by hotel. Reason: ${reason || 'Sold Out / Unavailable'}`
    });

    const updated = await p.hotelReservation.update({
      where: { id: existing.id },
      data: {
        status: 'Rejected',
        confirmationStage: 'REJECTED_UNAVAILABLE',
        rejectionReason: reason || 'Rooms unavailable for requested dates',
        respondedAt: new Date(),
        respondedBy: responder,
        auditLogs: JSON.stringify(history)
      },
      include: { hotel: true, inquiry: true }
    });

    if ((req as any).io) {
      (req as any).io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: `Hotel ${updated.hotel.name} DECLINED reservation for ${updated.guestName}: ${reason || 'Sold Out'}`,
        booking: { ...updated, entityType: 'reservation' }
      });
    }

    res.json({ success: true, message: 'Reservation decline recorded successfully', reservation: updated });
  } catch (error: any) {
    console.error('[ReservationsController] Public decline error:', error);
    res.status(500).json({ error: 'Failed to decline reservation' });
  }
};

// 5. Reception requests clarification
export const receptionRequestClarification = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const lookupKey = req.params.tokenOrId || req.params.id;
    const { question, respondedBy } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question or query is required' });
    }

    const existing = await p.hotelReservation.findFirst({
      where: { OR: [{ secureToken: lookupKey }, { id: lookupKey }] },
      include: { hotel: true }
    });

    if (!existing) return res.status(404).json({ error: 'Reservation not found' });

    let history = [];
    try { history = JSON.parse(existing.auditLogs || '[]'); } catch (e) { history = []; }

    const responder = respondedBy || existing.receptionContact || 'Hotel Reception Staff';

    history.push({
      timestamp: new Date().toISOString(),
      action: 'Clarification Requested by Hotel Reception',
      user: responder,
      details: `Hotel inquiry: "${question}"`
    });

    const updated = await p.hotelReservation.update({
      where: { id: existing.id },
      data: {
        clarificationRequest: question,
        respondedAt: new Date(),
        respondedBy: responder,
        auditLogs: JSON.stringify(history)
      },
      include: { hotel: true, inquiry: true }
    });

    if ((req as any).io) {
      (req as any).io.to('admin-room').emit('new-system-event', {
        type: 'CLARIFICATION_REQUESTED',
        message: `Hotel ${updated.hotel.name} requested clarification for ${updated.guestName}: "${question}"`,
        booking: { ...updated, entityType: 'reservation' }
      });
    }

    res.json({
      success: true,
      message: 'Question sent to Kashmir Curators Operations Desk.',
      reservation: updated
    });
  } catch (error: any) {
    console.error('[ReservationsController] Request clarification error:', error);
    res.status(500).json({ error: 'Failed to submit clarification request' });
  }
};

// 6. Employee accepts hotel's proposed alternative (Authenticated)
export const employeeAcceptAlternative = async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const { id } = req.params;

    const existing = await p.hotelReservation.findUnique({
      where: { id },
      include: { hotel: true }
    });

    if (!existing) return res.status(404).json({ error: 'Reservation not found' });
    if (!existing.alternativeRoomType && !existing.alternativeTariff && !existing.alternativeDates) {
      return res.status(400).json({ error: 'No alternative proposal found on this reservation' });
    }

    const nights = calculateNights(existing.checkIn, existing.checkOut);
    const rooms = existing.roomsCount || 1;
    const newRate = existing.alternativeTariff || existing.contractRate;
    const newRoomType = existing.alternativeRoomType || existing.roomType;
    const recalculatedDues = newRate * rooms * nights;

    let history = [];
    try { history = JSON.parse(existing.auditLogs || '[]'); } catch (e) { history = []; }

    const employeeName = req.user?.name || req.user?.email || 'Operations Desk';

    history.push({
      timestamp: new Date().toISOString(),
      action: 'Alternative Proposal Accepted by Kashmir Curators',
      user: employeeName,
      details: `Accepted hotel proposal: Room Category -> ${newRoomType}, Contract Rate -> ₹${newRate}/night. Booking confirmed.`
    });

    const updated = await p.hotelReservation.update({
      where: { id },
      data: {
        status: 'Confirmed',
        confirmationStage: 'HOTEL_CONFIRMED',
        roomType: newRoomType,
        contractRate: newRate,
        hotelDues: recalculatedDues,
        auditLogs: JSON.stringify(history)
      },
      include: { hotel: true, inquiry: true }
    });

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: `Alternative for ${updated.guestName} at ${updated.hotel.name} accepted by ${employeeName}`,
        booking: { ...updated, entityType: 'reservation' }
      });
    }

    res.json({
      success: true,
      message: 'Hotel proposal accepted and reservation confirmed!',
      reservation: updated
    });
  } catch (error: any) {
    console.error('[ReservationsController] Accept alternative error:', error);
    res.status(500).json({ error: 'Failed to accept alternative proposal' });
  }
};

// 7. Regenerate secure token and extend deadline (Authenticated)
export const regenerateSecureToken = async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const { id } = req.params;
    const { extendHours } = req.body;

    const existing = await p.hotelReservation.findUnique({
      where: { id },
      include: { hotel: true }
    });

    if (!existing) return res.status(404).json({ error: 'Reservation not found' });

    const newToken = crypto.randomBytes(32).toString('hex');
    const hours = Number(extendHours) || 48;
    const newExpiry = new Date(Date.now() + hours * 60 * 60 * 1000);
    const newDeadline = new Date(Date.now() + Math.min(hours, 24) * 60 * 60 * 1000);

    let history = [];
    try { history = JSON.parse(existing.auditLogs || '[]'); } catch (e) { history = []; }

    const employeeName = req.user?.name || req.user?.email || 'Operations Desk';

    history.push({
      timestamp: new Date().toISOString(),
      action: 'Secure Token Regenerated',
      user: employeeName,
      details: `Generated new reception confirmation link. Extended deadline to ${newDeadline.toLocaleString()}.`
    });

    const updated = await p.hotelReservation.update({
      where: { id },
      data: {
        secureToken: newToken,
        tokenExpiresAt: newExpiry,
        confirmationDeadline: newDeadline,
        confirmationStage: existing.confirmationStage === 'EXPIRED' ? 'PENDING_RESPONSE' : existing.confirmationStage,
        auditLogs: JSON.stringify(history)
      },
      include: { hotel: true, inquiry: true }
    });

    res.json({
      success: true,
      message: 'Secure link successfully regenerated with fresh expiry.',
      reservation: updated
    });
  } catch (error: any) {
    console.error('[ReservationsController] Regenerate token error:', error);
    res.status(500).json({ error: 'Failed to regenerate secure link' });
  }
};

// 8. Send / Resend Reception Portal Email (Authenticated)
export const sendReceptionEmail = async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const { id } = req.params;
    const { recipientEmail } = req.body;

    const reservation = await p.hotelReservation.findUnique({
      where: { id },
      include: { hotel: true }
    });

    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

    const targetEmail = recipientEmail || reservation.receptionEmail || reservation.hotel.contactEmail;
    if (!targetEmail) {
      return res.status(400).json({ error: 'No reception email found. Please provide an email address.' });
    }

    const referer = req.headers.referer || req.headers.origin || 'https://kashmir-connect-main.vercel.app';
    let cleanOrigin = 'https://kashmir-connect-main.vercel.app';
    try {
      const urlObj = new URL(referer);
      cleanOrigin = urlObj.origin;
    } catch (e) {
      if (referer.startsWith('http')) cleanOrigin = referer;
    }

    const tokenOrId = reservation.secureToken || reservation.id;
    const publicUrl = `${cleanOrigin}/hotel/confirm/${tokenOrId}`;

    await notificationService.sendHotelReservationRequest(reservation, publicUrl);

    let history = [];
    try { history = JSON.parse(reservation.auditLogs || '[]'); } catch (e) { history = []; }

    const employeeName = req.user?.name || req.user?.email || 'Operations Desk';

    history.push({
      timestamp: new Date().toISOString(),
      action: 'Reception Email Dispatched',
      user: employeeName,
      details: `Confirmation portal link emailed to ${targetEmail}.`
    });

    await p.hotelReservation.update({
      where: { id },
      data: {
        receptionEmail: targetEmail,
        status: reservation.status === 'Pending' ? 'Sent' : reservation.status,
        auditLogs: JSON.stringify(history)
      }
    });

    res.json({
      success: true,
      message: `Reservation portal email successfully dispatched to ${targetEmail}`,
      publicUrl
    });
  } catch (error: any) {
    console.error('[ReservationsController] Send reception email error:', error);
    res.status(500).json({ error: 'Failed to send reception portal email' });
  }
};

// Check-In Guest with identity verification and room occupancy transition
export const checkInGuest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedRoomNumber, guestIdType, guestIdNumber } = req.body;
    const p = prisma as any;

    const reservation = await p.hotelReservation.findUnique({ where: { id } });
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

    let roomRecord = null;
    if (assignedRoomNumber) {
      roomRecord = await p.hotelRoom.findFirst({
        where: { hotelId: reservation.hotelId, roomNumber: assignedRoomNumber }
      });

      if (roomRecord) {
        if (roomRecord.status === 'MAINTENANCE' || roomRecord.operationalStatus === 'UNDER_MAINTENANCE') {
          return res.status(400).json({ error: `Room ${assignedRoomNumber} is currently under maintenance. Please assign an available clean room.` });
        }
        if (roomRecord.housekeeping === 'DIRTY') {
          return res.status(400).json({ error: `Room ${assignedRoomNumber} is dirty. Housekeeping must clean the room before check-in.` });
        }
      }
    }

    let history = [];
    try { history = JSON.parse(reservation.auditLogs || '[]'); } catch (e) { history = []; }
    history.push({
      timestamp: new Date().toISOString(),
      action: 'Guest Checked-In',
      user: req.user?.name || req.user?.email || 'Front Desk',
      details: `Checked-in to Room ${assignedRoomNumber || 'Allocated'}. ID: ${guestIdType || 'Verified'} - ${guestIdNumber || 'Verified'}`
    });

    const updated = await p.hotelReservation.update({
      where: { id },
      data: {
        status: 'Checked-In',
        checkInTime: new Date(),
        assignedRoomId: roomRecord ? roomRecord.id : undefined,
        assignedRoomNumber: assignedRoomNumber || reservation.assignedRoomNumber,
        guestIdType: guestIdType || reservation.guestIdType,
        guestIdNumber: guestIdNumber || reservation.guestIdNumber,
        guestIdVerified: true,
        auditLogs: JSON.stringify(history)
      },
      include: { hotel: true, inquiry: true }
    });

    if (roomRecord) {
      await p.hotelRoom.update({
        where: { id: roomRecord.id },
        data: {
          status: 'OCCUPIED',
          operationalStatus: 'OCCUPIED',
          currentReservationId: id
        }
      });
    }

    if ((req as any).io) {
      (req as any).io.to('admin-room').emit('new-system-event', {
        type: 'GUEST_CHECKED_IN',
        message: `${reservation.guestName} checked in to Room ${assignedRoomNumber || ''}`
      });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to check in guest' });
  }
};

// Check-Out Guest with automatic housekeeping turnover task
export const checkOutGuest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const p = prisma as any;

    const reservation = await p.hotelReservation.findUnique({ where: { id } });
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

    let history = [];
    try { history = JSON.parse(reservation.auditLogs || '[]'); } catch (e) { history = []; }
    history.push({
      timestamp: new Date().toISOString(),
      action: 'Guest Checked-Out',
      user: req.user?.name || req.user?.email || 'Front Desk',
      details: `Checked-out from Room ${reservation.assignedRoomNumber || 'assigned'}. Turnover cleaning scheduled.`
    });

    const updated = await p.hotelReservation.update({
      where: { id },
      data: {
        status: 'Checked-Out',
        checkOutTime: new Date(),
        auditLogs: JSON.stringify(history)
      },
      include: { hotel: true, inquiry: true }
    });

    if (reservation.assignedRoomNumber) {
      const room = await p.hotelRoom.findFirst({
        where: { hotelId: reservation.hotelId, roomNumber: reservation.assignedRoomNumber }
      });
      if (room) {
        await p.hotelRoom.update({
          where: { id: room.id },
          data: {
            status: 'AVAILABLE',
            operationalStatus: 'AVAILABLE_DIRTY',
            housekeeping: 'DIRTY',
            currentReservationId: null
          }
        });

        await p.housekeepingTask.create({
          data: {
            hotelId: reservation.hotelId,
            roomNumber: reservation.assignedRoomNumber,
            taskType: 'TURNOVER',
            priority: 'HIGH',
            status: 'DIRTY',
            notes: `Turnover cleaning post checkout for ${reservation.guestName}`
          }
        });
      }
    }

    if ((req as any).io) {
      (req as any).io.to('admin-room').emit('new-system-event', {
        type: 'GUEST_CHECKED_OUT',
        message: `${reservation.guestName} checked out`
      });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to check out guest' });
  }
};

// Reassign Room
export const assignRoom = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { roomNumber } = req.body;
    const p = prisma as any;

    const reservation = await p.hotelReservation.findUnique({ where: { id } });
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

    const roomRecord = await p.hotelRoom.findFirst({
      where: { hotelId: reservation.hotelId, roomNumber }
    });

    if (!roomRecord) {
      return res.status(404).json({ error: `Room ${roomNumber} does not exist at this property.` });
    }

    let history = [];
    try { history = JSON.parse(reservation.auditLogs || '[]'); } catch (e) { history = []; }
    history.push({
      timestamp: new Date().toISOString(),
      action: 'Room Assigned / Changed',
      user: req.user?.name || req.user?.email || 'Front Desk',
      details: `Room changed to ${roomNumber}`
    });

    const updated = await p.hotelReservation.update({
      where: { id },
      data: {
        assignedRoomId: roomRecord.id,
        assignedRoomNumber: roomNumber,
        auditLogs: JSON.stringify(history)
      },
      include: { hotel: true, inquiry: true }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
