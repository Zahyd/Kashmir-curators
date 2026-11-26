import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../lib/prisma';
import { withStrictTenantScope } from '../lib/tenant';

export const getFinanceTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: withStrictTenantScope({}, req.tenantId),
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
    const p = prisma as any;
    const [bookings, inquiries, hotelReservations] = await Promise.all([
      prisma.booking.findMany({
        where: withStrictTenantScope({ NOT: { status: 'cancelled' } }, req.tenantId),
        select: { id: true, totalAmount: true }
      }),
      p.inquiry.findMany({
        where: withStrictTenantScope({}, req.tenantId),
        select: { id: true }
      }),
      prisma.hotelReservation.findMany({
        where: withStrictTenantScope({}, req.tenantId),
        select: { totalAmount: true }
      })
    ]);

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const refIds = Array.from(new Set([
      ...bookings.map((b) => b.id),
      ...inquiries.map((i: any) => i.id)
    ]));

    const creditEntries = refIds.length > 0
      ? await p.transactionLedger.findMany({
          where: { bookingId: { in: refIds }, type: 'CREDIT' },
          select: { amount: true, description: true }
        }).catch(() => [])
      : [];

    const advancePaid = (creditEntries as any[])
      .filter((e) => !String(e.description || '').toLowerCase().startsWith('pending'))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const balanceDues = Math.max(0, totalRevenue - advancePaid);
    const hotelCost = hotelReservations.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

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
