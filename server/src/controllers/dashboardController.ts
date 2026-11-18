import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000);

    // Run each query independently so one failure never crashes the executive deck
    const [
      totalBookings,
      totalRevenue,
      totalUsers,
      totalPackages,
      activeInquiries,
      pendingBookings,
      hotelNodes,
      newReviews,
      activeFaqs,
      pendingReservations,
      confirmedReservations,
      dailyCheckIns,
      dailyCheckOuts,
      totalHotelDues,
      totalProfitMargin,
      totalCabs,
      activeCabs,
      pendingAgents,
      totalWallets,
      liveAdvisories,
      allNonCancelledBookings,
      recentInquiries,
      unassignedLeadsCount
    ] = await Promise.all([
      p.booking.count().catch(() => 0),
      p.booking.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ['confirmed', 'completed'] } }
      }).catch(() => ({ _sum: { totalAmount: 0 } })),
      p.user.count({ where: { role: 'user' } }).catch(() => 0),
      p.package.count({ where: { isActive: true } }).catch(() => 0),
      p.inquiry.count({ where: { status: { not: 'Lost' } } }).catch(() => 0),
      p.booking.count({ where: { status: 'pending' } }).catch(() => 0),
      p.hotel.count().catch(() => 0),
      p.testimonial.count().catch(() => 0),
      p.fAQ.count().catch(() => 0),
      p.hotelReservation.count({ where: { status: { in: ['Pending', 'Sent'] } } }).catch(() => 0),
      p.hotelReservation.count({ where: { status: 'Confirmed' } }).catch(() => 0),
      p.hotelReservation.count({ where: { checkIn: { gte: todayStart, lte: todayEnd } } }).catch(() => 0),
      p.hotelReservation.count({ where: { checkOut: { gte: todayStart, lte: todayEnd } } }).catch(() => 0),
      p.hotelReservation.aggregate({ _sum: { hotelDues: true } }).catch(() => ({ _sum: { hotelDues: 0 } })),
      p.hotelReservation.aggregate({ _sum: { profitMargin: true } }).catch(() => ({ _sum: { profitMargin: 0 } })),
      p.cab.count().catch(() => 0),
      p.cab.count({ where: { isActive: true } }).catch(() => 0),
      p.agentProfile.count({ where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } } }).catch(() => 0),
      p.wallet.aggregate({ _sum: { balance: true } }).catch(() => ({ _sum: { balance: 0 } })),
      p.travelAdvisory.findMany({
        take: 4,
        orderBy: [{ emergencyModeActive: 'desc' }, { lastUpdated: 'desc' }],
        select: { id: true, location: true, status: true, severity: true, emergencyModeActive: true, message: true, lastUpdated: true }
      }).catch(() => []),
      p.booking.findMany({
        where: { status: { not: 'cancelled' } },
        select: { totalAmount: true, createdAt: true }
      }).catch(() => []),
      p.inquiry.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' }
      }).catch(() => []),
      p.inquiry.count({
        where: {
          OR: [{ assignedTo: null }, { assignedTo: '' }],
          status: { not: 'Lost' }
        }
      }).catch(() => 0)
    ]);

    const revenueTotalNum = Number((totalRevenue as any)._sum?.totalAmount || 0);
    const profitTotalNum = Number((totalProfitMargin as any)._sum?.profitMargin || 0);
    const cabAvailabilityPct = totalCabs > 0 ? `${Math.round((activeCabs / totalCabs) * 100)}%` : '0%';
    const grossMarginPercent = revenueTotalNum > 0
      ? `${Math.min(100, Math.round((profitTotalNum / revenueTotalNum) * 1000) / 10)}%`
      : '0%';

    // Real 30d vs prior 30d revenue growth
    let last30Rev = 0;
    let prev30Rev = 0;

    // Build REAL Daily (7d), Weekly (8w), and Monthly (12m) Neon revenue series
    const dayLabels: Array<{ label: string; key: string; value: number; isCurrent: boolean }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dayLabels.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        key: d.toISOString().slice(0, 10),
        value: 0,
        isCurrent: i === 0
      });
    }

    const weekLabels: Array<{ label: string; startMs: number; endMs: number; value: number; isCurrent: boolean }> = [];
    for (let i = 7; i >= 0; i--) {
      const end = new Date(now.getTime() - i * 7 * 86400000);
      const start = new Date(end.getTime() - 7 * 86400000);
      weekLabels.push({
        label: i === 0 ? 'This Wk' : `W-${i}`,
        startMs: start.getTime(),
        endMs: end.getTime(),
        value: 0,
        isCurrent: i === 0
      });
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();
    const monthSeries = monthNames.map((label, idx) => ({
      label,
      value: 0,
      isCurrent: idx === currentMonthIdx
    }));

    for (const b of allNonCancelledBookings as Array<{ totalAmount: number; createdAt: Date }>) {
      const dt = new Date(b.createdAt);
      const ms = dt.getTime();
      const amt = Number(b.totalAmount || 0);

      if (ms >= thirtyDaysAgo.getTime()) last30Rev += amt;
      else if (ms >= sixtyDaysAgo.getTime()) prev30Rev += amt;

      const dayKey = dt.toISOString().slice(0, 10);
      const dayBucket = dayLabels.find(d => d.key === dayKey);
      if (dayBucket) dayBucket.value += amt;

      const weekBucket = weekLabels.find(w => ms >= w.startMs && ms <= w.endMs);
      if (weekBucket) weekBucket.value += amt;

      if (dt.getFullYear() === currentYear) {
        monthSeries[dt.getMonth()].value += amt;
      }
    }

    const revenueGrowthPct = prev30Rev > 0
      ? `${last30Rev >= prev30Rev ? '+' : ''}${Math.round(((last30Rev - prev30Rev) / prev30Rev) * 100)}%`
      : last30Rev > 0
        ? 'Active'
        : '0%';

    res.json({
      totalBookings,
      totalRevenue: revenueTotalNum,
      totalUsers,
      totalPackages,
      activeInquiries,
      unassignedLeads: unassignedLeadsCount,
      pendingBookings,
      totalCabs,
      activeCabs,
      cabAvailability: cabAvailabilityPct,
      hotelNodes,
      newReviews,
      activeFaqs,
      pendingReservations,
      confirmedReservations,
      dailyCheckIns,
      dailyCheckOuts,
      hotelDues: (totalHotelDues as any)._sum?.hotelDues || 0,
      profitMargins: profitTotalNum,
      grossMarginPercent,
      revenueGrowthPct,
      pendingAgents,
      totalWalletLiability: Number((totalWallets as any)._sum?.balance || 0),
      liveAdvisories,
      revenueSeries: {
        Daily: dayLabels.map(({ label, value, isCurrent }) => ({ label, value, isCurrent })),
        Weekly: weekLabels.map(({ label, value, isCurrent }) => ({ label, value, isCurrent })),
        Monthly: monthSeries
      },
      recentInquiries,
      syncedAt: new Date().toISOString()
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
