import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    // Run each query independently so one failure doesn't crash all stats
    const [totalBookings, totalRevenue, totalUsers, totalPackages, activeInquiries, pendingBookings, hotelNodes, newReviews, activeFaqs] = await Promise.all([
      p.booking.count().catch(() => 0),
      p.booking.aggregate({
        _sum: { totalAmount: true },
        where: { status: 'confirmed' }
      }).catch(() => ({ _sum: { totalAmount: 0 } })),
      p.user.count({ where: { role: 'user' } }).catch(() => 0),
      p.package.count({ where: { isActive: true } }).catch(() => 0),
      p.inquiry.count({ where: { status: { not: 'Lost' } } }).catch(() => 0),
      p.booking.count({ where: { status: 'pending' } }).catch(() => 0),
      p.hotel.count().catch(() => 0),
      p.testimonial.count().catch(() => 0),
      p.fAQ.count().catch(() => 0),
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
    const p = prisma as any;
    const agentCode = req.user.role === 'sales' ? req.user.email : null; // Mapping sales role to email for assignment
    
    // 1. Leads Received
    const leadsReceived = await p.inquiry.count({
      where: agentCode ? { assignedTo: agentCode } : {}
    });
    
    // 2. Converted (Booked)
    const convertedInquiries = await p.inquiry.findMany({
      where: {
        status: 'Booked',
        ...(agentCode ? { assignedTo: agentCode } : {})
      },
      select: { quoteData: true }
    });

    // 3. Active Pipeline (In progress)
    const activeQuotes = await p.inquiry.count({
      where: {
        status: { in: ['Pending Curation', 'Ready for Review'] },
        ...(agentCode ? { assignedTo: agentCode } : {})
      }
    });

    // Calculate Revenue
    let totalRevenue = 0;
    convertedInquiries.forEach((inq: any) => {
      if (inq.quoteData) {
        try {
          const days = JSON.parse(inq.quoteData);
          if (Array.isArray(days)) {
            days.forEach((day: any) => {
              totalRevenue += (day.hotelPrice || 0) + (day.transportPrice || 0) + (day.extraBedPrice || 0);
            });
          }
        } catch (e) {
          console.error("Error parsing quoteData for revenue:", e);
        }
      }
    });

    const conversionRate = leadsReceived > 0 ? `${Math.round((convertedInquiries.length / leadsReceived) * 100)}%` : '0%';

    res.json({
      leadsReceived,
      conversionRate,
      activeQuotes,
      totalRevenue: totalRevenue > 100000 ? `₹${(totalRevenue / 100000).toFixed(1)}L` : `₹${totalRevenue.toLocaleString()}`,
      revenueRaw: totalRevenue,
      targetProgress: Math.min(Math.round((totalRevenue / 1000000) * 100), 100).toString(), // Target of 10L for progress
      leadsConverted: convertedInquiries.length
    });
  } catch (error) {
    console.error('Sales stats error:', error);
    res.status(500).json({ error: 'Failed to fetch sales stats' });
  }
};
