import prisma from '../lib/prisma';
import { Request, Response } from 'express';

export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true, // TS cache refresh
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const parsedBookings = bookings.map(b => ({
      ...b,
      details: b.details ? JSON.parse(b.details) : {}
    }));

    res.json(parsedBookings);
  } catch (error) {
    console.error('Failed to fetch all bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

const autoGenerateCabForPackageBooking = async (packageBooking: any) => {
  try {
    if (packageBooking.type !== 'package') return;

    // Check if cab booking already exists for this package booking
    const existingCabBooking = await prisma.booking.findFirst({
      where: {
        type: 'cab',
        details: {
          contains: `"parentPackageBookingId":"${packageBooking.id}"`
        }
      }
    });

    if (existingCabBooking) return;

    // Create the automatically generated cab booking
    const ref = `KC-CAB-AUTO-${Math.floor(100000 + Math.random() * 900000)}`;
    const bookingDateStr = packageBooking.bookingDate.toISOString().split('T')[0];

    // Find first active cab to pre-fill allocation details if possible, or just default to Ertiga/SUV
    const defaultCab = await prisma.cab.findFirst({
      where: { isActive: true },
      orderBy: { capacity: 'desc' } // Usually Innova/SUV is default for packages
    });

    const cabDetails = {
      pickupLocation: 'Srinagar Airport (SXR)',
      dropLocation: 'Srinagar Hotel / Resort',
      pickupDateTime: `${bookingDateStr}T10:00`,
      dropDateTime: `${bookingDateStr}T18:00`,
      tripType: 'package-automation',
      estimatedDistance: 120,
      paymentMethod: 'package-inclusive',
      bookingRef: ref,
      parentPackageBookingId: packageBooking.id,
      cabAllocation: defaultCab ? {
        cabId: defaultCab.id,
        cabName: defaultCab.name,
        cabType: defaultCab.type,
        ownership: 'company',
        registrationNo: '', 
        driverName: '',     
        driverPhone: '',    
        pickupDateTime: `${bookingDateStr}T10:00`,
        dropDateTime: `${bookingDateStr}T18:00`,
        pickupLocation: 'Srinagar Airport (SXR)',
        dropLocation: 'Srinagar Hotel / Resort',
        allocatedDates: [bookingDateStr],
        pricing: {
          pricePerKm: defaultCab.pricePerKm,
          estimatedKm: 120,
          baseCost: defaultCab.basePrice,
          driverAllowance: 1500,
          fuelExpenses: 3000,
          tollsExpenses: 500,
          vendorPayout: 0,
          otherExpenses: 0,
          totalCost: 5000,
          margin: 0,
          marginPercent: 0
        },
        voucherGenerated: false,
        whatsappSent: false
      } : undefined
    };

    await prisma.booking.create({
      data: {
        userId: packageBooking.userId,
        type: 'cab',
        itemName: `Package Chauffeur: ${packageBooking.itemName}`,
        bookingDate: packageBooking.bookingDate,
        totalAmount: 0, // Package-inclusive
        details: JSON.stringify(cabDetails),
        status: 'confirmed'
      }
    });

    console.log(`[Package-to-Cab Automation] Generated cab transfer for package booking ${packageBooking.id}`);
  } catch (error: any) {
    console.error('[Package-to-Cab Automation] Failed to generate cab booking:', error.message);
  }
};

export const createBooking = async (req: any, res: Response) => {
  const { type, itemName, bookingDate, totalAmount, details, clientEmail, clientName, clientPhone } = req.body;
  
  try {
    let targetUserId = req.user.id;
    
    // Check if creator is admin/ops/sales and provided client email
    if (['admin', 'operations', 'sales'].includes(req.user.role) && clientEmail) {
      let clientUser = await prisma.user.findUnique({
        where: { email: clientEmail }
      });
      
      if (!clientUser) {
        clientUser = await prisma.user.create({
          data: {
            email: clientEmail,
            name: clientName || 'Manual Client',
            phone: clientPhone || ''
          }
        });
      }
      targetUserId = clientUser.id;
    }

    const booking = await prisma.booking.create({
      data: {
        userId: targetUserId,
        type,
        itemName,
        bookingDate: new Date(bookingDate),
        totalAmount: Number(totalAmount) || 0,
        details: typeof details === 'string' ? details : JSON.stringify(details || {}),
        status: 'confirmed'
      }
    });

    // Auto-generate cab for confirmed package booking
    if (booking.type === 'package') {
      await autoGenerateCabForPackageBooking(booking);
    }

    // Emit real-time update
    if (req.io) {
      const payload = { type: 'CREATE', booking };
      req.io.to(`user-${targetUserId}`).emit('booking-updated', payload);
      req.io.to('admin-room').emit('new-system-event', {
        ...payload,
        message: `New manual booking: ${booking.itemName} for ${clientName || clientEmail || 'User'}`
      });
      
      // Emit to everyone for live social proof / curation updates
      let travelers = '2';
      try {
        const detailsParsed = typeof details === 'string' ? JSON.parse(details) : (details || {});
        travelers = detailsParsed.travelers || '2';
      } catch (e) {}
      req.io.emit('new-live-curation', {
        id: booking.id,
        message: `${booking.type === 'package' ? 'Luxury package' : booking.type === 'hotel' ? 'Premium hotel' : 'Chauffeur cab'} secured: ${booking.itemName}`,
        details: `${travelers} Guests from ${clientName || 'Explorer'}`,
        createdAt: booking.createdAt
      });
    }

    res.status(201).json(booking);
  } catch (error: any) {
    console.error('Failed to create booking:', error);
    res.status(500).json({ error: 'Failed to create booking: ' + error.message });
  }
};

export const getMyBookings = async (req: any, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    
    const parsedBookings = bookings.map(b => ({
      ...b,
      details: JSON.parse(b.details)
    }));

    res.json(parsedBookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

export const updateBookingStatus = async (req: any, res: Response) => {
  const { id } = req.params;
  const { status, details, totalAmount, bookingDate, itemName } = req.body;
  
  try {
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (details !== undefined) {
      updateData.details = typeof details === 'string' ? details : JSON.stringify(details);
    }
    if (totalAmount !== undefined) updateData.totalAmount = Number(totalAmount);
    if (bookingDate !== undefined) updateData.bookingDate = new Date(bookingDate);
    if (itemName !== undefined) updateData.itemName = itemName;

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    });

    // Auto-generate cab for confirmed package booking
    if (booking.type === 'package' && booking.status === 'confirmed') {
      await autoGenerateCabForPackageBooking(booking);
    }

    const parsedBooking = {
      ...booking,
      details: booking.details ? JSON.parse(booking.details) : {}
    };

    // Emit real-time update to the user
    if (req.io) {
      const payload = { type: 'UPDATE', booking: parsedBooking };
      req.io.to(`user-${booking.userId}`).emit('booking-updated', payload);
      req.io.to('admin-room').emit('new-system-event', {
        ...payload,
        message: `Booking ${booking.itemName} (Ref: ${booking.id.slice(0,8)}) updated`
      });

      // Emit to everyone for live social proof if confirmed
      if (booking.status === 'confirmed') {
        let travelers = '2';
        try {
          const detailsParsed = booking.details ? JSON.parse(booking.details) : {};
          travelers = detailsParsed.travelers || '2';
        } catch (e) {}
        req.io.emit('new-live-curation', {
          id: booking.id,
          message: `${booking.type === 'package' ? 'Luxury package' : booking.type === 'hotel' ? 'Premium hotel' : 'Chauffeur cab'} secured: ${booking.itemName}`,
          details: `${travelers} Guests from ${booking.user?.name || 'Explorer'}`,
          createdAt: booking.createdAt
        });
      }
    }

    res.json(parsedBooking);
  } catch (error) {
    console.error('Failed to update booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
};

export const deleteBooking = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const booking = await prisma.booking.delete({
      where: { id: id as string }
    });

    res.json({ message: 'Booking deleted successfully', booking });
  } catch (error) {
    console.error('Failed to delete booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
};

export const getRecentBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { status: 'confirmed' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    const inquiries = await prisma.inquiry.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    const formattedBookings = bookings.map(b => {
      let travelers = '2';
      try {
        const detailsParsed = b.details ? JSON.parse(b.details) : {};
        travelers = detailsParsed.travelers || '2';
      } catch (e) {}
      return {
        id: b.id,
        message: `${b.type === 'package' ? 'Luxury package' : b.type === 'hotel' ? 'Premium hotel' : 'Chauffeur cab'} secured: ${b.itemName}`,
        details: `${travelers} Guests from ${b.user?.name || 'Explorer'}`,
        createdAt: b.createdAt
      };
    });

    const formattedInquiries = inquiries.map(i => {
      return {
        id: i.id,
        message: `Expedition to ${i.destination} curated`,
        details: `${i.travelers} Travelers • for ${i.customerName}`,
        createdAt: i.createdAt
      };
    });

    const combined = [...formattedBookings, ...formattedInquiries]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);

    res.json(combined);
  } catch (error) {
    console.error('Failed to fetch recent bookings:', error);
    res.status(500).json({ error: 'Failed to fetch recent bookings' });
  }
};
