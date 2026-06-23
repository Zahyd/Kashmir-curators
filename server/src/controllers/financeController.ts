import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../lib/prisma';

export const getFinanceTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (error) {
    console.error('getFinanceTransactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFinanceOverview = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { NOT: { status: 'cancelled' } }
    });

    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const advancePaid = totalRevenue * 0.25; // mock 25% advances
    const balanceDues = totalRevenue * 0.75;  // remaining dues

    // hotel reserves wholesale costs summing
    const hotelReservations = await prisma.hotelReservation.findMany();
    const hotelCost = hotelReservations.reduce((sum, r) => sum + r.totalAmount, 0);

    res.json({
      totalRevenue,
      advancePaid,
      balanceDues,
      hotelCost,
      netProfit: totalRevenue - hotelCost
    });
  } catch (error) {
    console.error('getFinanceOverview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
