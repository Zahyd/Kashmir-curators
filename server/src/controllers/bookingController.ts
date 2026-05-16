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

export const createBooking = async (req: any, res: Response) => {
  const { type, itemName, bookingDate, totalAmount, details } = req.body;
  
  try {
    const booking = await prisma.booking.create({
      data: {
        userId: req.user.id,
        type,
        itemName,
        bookingDate: new Date(bookingDate),
        totalAmount,
        details: JSON.stringify(details),
        status: 'confirmed'
      }
    });

    // Emit real-time update
    if (req.io) {
      const payload = { type: 'CREATE', booking };
      req.io.to(`user-${req.user.id}`).emit('booking-updated', payload);
      req.io.to('admin-room').emit('new-system-event', {
        ...payload,
        message: `New booking: ${booking.itemName} by ${req.user.name || 'User'}`
      });
    }

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create booking' });
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
  const { status } = req.body;
  
  try {
    const booking = await prisma.booking.update({
      where: { id },
      data: { status }
    });

    // Emit real-time update to the user
    if (req.io) {
      const payload = { type: 'UPDATE', booking };
      req.io.to(`user-${booking.userId}`).emit('booking-updated', payload);
      req.io.to('admin-room').emit('new-system-event', {
        ...payload,
        message: `Booking ${booking.id.slice(0,8)} status changed to ${booking.status}`
      });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update booking' });
  }
};
