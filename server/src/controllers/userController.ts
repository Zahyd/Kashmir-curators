import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            bookings: true,
            inquiries: true, // TS cache refresh
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeTravelers = await prisma.user.count({
      where: {
        bookings: {
          some: {}
        }
      }
    });

    res.json({
      totalUsers,
      activeTravelers,
      newThisMonth: 12, // Mock for now or calculate from dates
      conversionRate: '24%' // Mock for now
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
};
