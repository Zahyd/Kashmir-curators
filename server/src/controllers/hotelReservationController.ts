import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

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
      mealPlan,
      specialRequests,
      status,
      paymentStatus,
      holdUntil,
      contractRate,
      seasonalPricing,
      commissionRate,
      totalAmount
    } = req.body;

    const nights = calculateNights(checkIn, checkOut);
    const rooms = Number(roomsCount) || 1;
    const cRate = Number(contractRate) || 0;
    const sPrice = Number(seasonalPricing) || 0;
    const commRate = Number(commissionRate) || 0;
    const grossTotal = Number(totalAmount) || 0;

    // Net Cost calculation: (contractRate + seasonalPricing) * roomsCount * nights
    const netCost = (cRate + sPrice) * rooms * nights;
    
    // Profit margin calculation:
    // If commission structure is used, profit can be computed as: Gross * (commRate / 100)
    // Otherwise: grossTotal - netCost
    let profit = grossTotal - netCost;
    if (commRate > 0) {
      profit = grossTotal * (commRate / 100);
    }
    const hotelDues = netCost;

    const hasConflict = await checkDuplicateConflict(hotelId, guestName, checkIn, checkOut);

    // Initial audit log
    const auditLogs = JSON.stringify([
      {
        timestamp: new Date().toISOString(),
        action: 'Created',
        user: req.user?.name || req.user?.email || 'Operations Desk',
        details: `Reservation initialized at ${status} status.`
      }
    ]);

    const reservation = await p.hotelReservation.create({
      data: {
        inquiryId: inquiryId || null,
        hotelId,
        guestName,
        guestEmail: guestEmail || null,
        guestPhone: guestPhone || null,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        roomType,
        roomsCount: rooms,
        mealPlan: mealPlan || 'EP',
        specialRequests: specialRequests || null,
        status: status || 'Pending',
        paymentStatus: paymentStatus || 'Unpaid',
        holdUntil: holdUntil ? new Date(holdUntil) : null,
        contractRate: cRate,
        seasonalPricing: sPrice,
        commissionRate: commRate,
        totalAmount: grossTotal,
        profitMargin: profit,
        hotelDues: hotelDues,
        createdById: req.user?.id || null,
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
        message: `New reservation for ${guestName} created`,
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
