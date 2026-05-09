import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    // Run each query independently so one failure doesn't crash all stats
    const [totalBookings, totalRevenue, totalUsers, totalPackages, activeInquiries, pendingBookings, hotelNodes, newReviews, activeFaqs] = await Promise.all([
      prisma.booking.count().catch(() => 0),
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { status: 'confirmed' }
      }).catch(() => ({ _sum: { totalAmount: 0 } })),
      prisma.user.count({ where: { role: 'user' } }).catch(() => 0),
      prisma.package.count({ where: { isActive: true } }).catch(() => 0),
      prisma.inquiry.count({ where: { status: { not: 'Lost' } } }).catch(() => 0),
      prisma.booking.count({ where: { status: 'pending' } }).catch(() => 0),
      prisma.hotel.count().catch(() => 0),
      prisma.testimonial.count().catch(() => 0),
      prisma.fAQ.count().catch(() => 0),
    ]);

    res.json({
      totalBookings,
      totalRevenue: (totalRevenue as any)._sum?.totalAmount || 0,
      totalUsers,
      totalPackages,
      activeInquiries,
      pendingBookings,
      cabAvailability: '92%',
      hotelNodes,
      newReviews,
      activeFaqs,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
};


export const getSalesStats = async (req: any, res: Response) => {
  try {
    const agentCode = req.user.role === 'sales' ? req.user.email : null; // Simple mapping
    
    const leadsReceived = await prisma.inquiry.count({
      where: agentCode ? { assignedTo: agentCode } : {}
    });
    
    const converted = await prisma.inquiry.count({
      where: {
        status: 'Booked',
        ...(agentCode ? { assignedTo: agentCode } : {})
      }
    });

    const activeQuotes = await prisma.inquiry.count({
      where: {
        status: 'Pending Curation',
        ...(agentCode ? { assignedTo: agentCode } : {})
      }
    });

    const conversionRate = leadsReceived > 0 ? `${Math.round((converted / leadsReceived) * 100)}%` : '0%';

    res.json({
      leadsReceived,
      conversionRate,
      activeQuotes,
      targetProgress: '74%' // Target still mock for now
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sales stats' });
  }
};
