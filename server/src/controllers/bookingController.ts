import { Request, Response } from 'express';
import prisma from '../lib/prisma';

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
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update booking' });
  }
};
