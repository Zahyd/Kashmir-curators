import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';
import { LeadScoringService } from '../services/leadScoringService';
import { resolveWriteTenantId, withStrictTenantScope, canAccessTenantRecord, buildTenantNotificationUserId, buildNotificationTenantWhere } from '../lib/tenant';
import { broadcastDriverEvent } from './driverRoutes';
import { realtimeBus } from '../lib/realtimeBus';

const router = Router();

const SALES_PORTAL_ROLES = ['admin', 'operations', 'sales', 'marketing', 'finance'];
const SALES_MUTATION_ROLES = ['admin', 'operations', 'sales'];

const VALID_STAGES = new Set([
  'NEW_LEAD',
  'CLAIMED',
  'FOLLOW_UP',
  'QUOTE_SENT',
  'QUOTED',
  'NEGOTIATION',
  'PAYMENT_PENDING',
  'PAYMENT_RECEIVED',
  'CONFIRMED',
  'COMPLETED',
  'LOST',
  'CANCELLED'
]);

// Bridge query-string JWT for browser EventSource SSE connections (which cannot send Authorization headers)
const sseQueryTokenBridge = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.headers.authorization && typeof req.query.token === 'string' && req.query.token.trim()) {
    req.headers.authorization = `Bearer ${req.query.token.trim()}`;
  }
  next();
};

export function broadcastSalesEvent(eventType: string, payload: any, io?: any, tenantId?: string | null) {
  realtimeBus.publish(eventType, payload, {
    io,
    tenantId: tenantId !== undefined ? tenantId : payload?.organizationId || null,
  });
}

function normalizeStageInput(stage: string): string {
  const upper = String(stage || '').trim().toUpperCase();
  if (upper === 'QUOTED') return 'QUOTE_SENT';
  return upper;
}

function getValueINR(inq: { netPrice?: number | null; budget?: string | number | null }): number {
  if (inq.netPrice && inq.netPrice > 0) return Number(inq.netPrice);
  const parsed = parseInt(String(inq.budget || '0').replace(/[^0-9]/g, ''), 10);
  return isNaN(parsed) ? 0 : parsed;
}

function isSafeDocumentUrl(rawUrl: string): boolean {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

const createLeadSchema = z.object({
  customerName: z.string().trim().min(1, 'Customer name is required').max(150),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().max(150).optional().nullable(),
  destination: z.string().trim().max(200).optional(),
  duration: z.string().trim().max(80).optional(),
  adultsCount: z.coerce.number().int().min(1).max(100).optional(),
  childrenCount: z.coerce.number().int().min(0).max(100).optional(),
  budget: z.union([z.string(), z.number()]).optional().nullable(),
  netPrice: z.coerce.number().min(0).max(100000000).optional(),
  accommodation: z.string().trim().max(200).optional().nullable(),
  transportPreference: z.string().trim().max(150).optional().nullable(),
  arrivalCity: z.string().trim().max(120).optional().nullable(),
  priority: z.string().trim().max(40).optional().nullable(),
  assignedTo: z.string().trim().max(150).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  sourceCta: z.string().trim().max(100).optional().nullable(),
  leadStage: z.string().trim().max(50).optional().nullable(),
});

// ---------------------------------------------------------------------------
// 1. Authenticated, Tenant-Scoped Real-Time SSE Stream (/api/sales/stream)
// ---------------------------------------------------------------------------
router.get(
  '/stream',
  sseQueryTokenBridge,
  authenticateToken,
  authorizeRoles(...SALES_PORTAL_ROLES),
  (req: AuthRequest, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const clientId = `sse-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    realtimeBus.addSseClient({
      id: clientId,
      res,
      userId: String(req.user?.id || ''),
      employeeCode: req.user?.employeeCode || req.user?.code,
      role: String(req.user?.role || 'sales'),
      tenantId: req.tenantId ?? null,
    });

    res.write(
      `event: connected\ndata: ${JSON.stringify({
        status: 'SALES_STREAM_CONNECTED',
        clientId,
        tenantId: req.tenantId ?? null,
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    const heartbeat = setInterval(() => {
      try {
        res.write(`event: heartbeat\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);
      } catch {
        clearInterval(heartbeat);
        realtimeBus.removeSseClient(clientId);
      }
    }, 20000);
    if (typeof heartbeat.unref === 'function') heartbeat.unref();

    req.on('close', () => {
      clearInterval(heartbeat);
      realtimeBus.removeSseClient(clientId);
    });
  }
);

// ---------------------------------------------------------------------------
// 1b. Real-Time Health & Live Presence Snapshot (/api/sales/realtime/health)
// ---------------------------------------------------------------------------
router.get('/realtime/health', authenticateToken, authorizeRoles(...SALES_PORTAL_ROLES), (req: AuthRequest, res: Response) => {
  res.json({
    ...realtimeBus.getHealth(),
    onlineStaff: realtimeBus.getOnlinePresence(req.tenantId),
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// 2. Executive Command KPI Strip (/api/sales/metrics)
// ---------------------------------------------------------------------------
router.get('/metrics', authenticateToken, authorizeRoles(...SALES_PORTAL_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const tenantWhere = withStrictTenantScope({}, req.tenantId);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const [unclaimedInquiries, activeLeads, recentInquiries, priorInquiries, confirmedLeads, totalLeadsCount, onlineAgentsCount, unreadNotificationsCount] =
      await Promise.all([
        p.inquiry.findMany({
          where: withStrictTenantScope(
            {
              OR: [{ assignedTo: null }, { assignedTo: '' }],
              status: { notIn: ['Booked', 'Lost', 'Cancelled'] },
              leadStage: { notIn: ['CONFIRMED', 'COMPLETED', 'CANCELLED', 'LOST'] },
            },
            req.tenantId
          ),
          select: { id: true, createdAt: true, priority: true },
        }),

        p.inquiry.findMany({
          where: withStrictTenantScope(
            {
              leadStage: { in: ['NEW_LEAD', 'CLAIMED', 'FOLLOW_UP', 'QUOTE_SENT', 'QUOTED', 'NEGOTIATION', 'PAYMENT_PENDING'] },
            },
            req.tenantId
          ),
          select: { id: true, netPrice: true, budget: true, leadStage: true },
        }),

        p.inquiry.findMany({
          where: withStrictTenantScope({ createdAt: { gte: thirtyDaysAgo } }, req.tenantId),
          select: {
            id: true,
            createdAt: true,
            leadStage: true,
            status: true,
            lastContactedAt: true,
            activities: {
              select: { createdAt: true },
              orderBy: { createdAt: 'asc' },
              take: 1,
            },
          },
        }),

        p.inquiry.findMany({
          where: withStrictTenantScope({ createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }, req.tenantId),
          select: { id: true, leadStage: true, status: true },
        }),

        p.inquiry.findMany({
          where: withStrictTenantScope(
            {
              OR: [{ leadStage: { in: ['CONFIRMED', 'COMPLETED'] } }, { status: 'Booked' }],
            },
            req.tenantId
          ),
          select: { id: true, netPrice: true, budget: true },
        }),

        p.inquiry.count({ where: tenantWhere }),

        p.user
          .count({
            where: withStrictTenantScope(
              {
                role: { in: ['admin', 'sales', 'operations', 'finance', 'DIRECTOR', 'SALES_MANAGER', 'SALES_EXECUTIVE'] },
                isOnline: true,
              },
              req.tenantId
            ),
          })
          .catch(() => 0),

        p.notification.count({ where: { ...buildNotificationTenantWhere(req), read: false } }).catch(() => 0),
      ]);

    const now = Date.now();
    const fifteenMinMs = 15 * 60 * 1000;
    const slaBreached = unclaimedInquiries.filter((inq: any) => now - new Date(inq.createdAt).getTime() > fifteenMinMs).length;

    const totalPipelineValue = activeLeads.reduce((sum: number, lead: any) => sum + getValueINR(lead), 0);
    const confirmedRevenue = confirmedLeads.reduce((sum: number, lead: any) => sum + getValueINR(lead), 0);

    const allRecentLeads = recentInquiries.length;
    const confirmedRecentLeads = recentInquiries.filter((inq: any) => inq.leadStage === 'CONFIRMED' || inq.status === 'Booked').length;
    const conversionRate = allRecentLeads > 0 ? Math.round((confirmedRecentLeads / allRecentLeads) * 100) : 0;

    let conversionDelta: number | null = null;
    if (priorInquiries.length > 0) {
      const priorConfirmed = priorInquiries.filter((inq: any) => inq.leadStage === 'CONFIRMED' || inq.status === 'Booked').length;
      const priorRate = Math.round((priorConfirmed / priorInquiries.length) * 100);
      conversionDelta = conversionRate - priorRate;
    }

    const responseMinutesList: number[] = [];
    for (const inq of recentInquiries) {
      const firstActivityMs = inq.activities?.[0]?.createdAt ? new Date(inq.activities[0].createdAt).getTime() : null;
      const contactedMs = inq.lastContactedAt ? new Date(inq.lastContactedAt).getTime() : null;
      const earliestResponseMs = firstActivityMs && contactedMs ? Math.min(firstActivityMs, contactedMs) : firstActivityMs || contactedMs;

      if (earliestResponseMs) {
        const diffMinutes = Math.max(0, (earliestResponseMs - new Date(inq.createdAt).getTime()) / 60000);
        responseMinutesList.push(diffMinutes);
      }
    }

    const avgResponseMinutes =
      responseMinutesList.length > 0
        ? Math.round((responseMinutesList.reduce((acc, m) => acc + m, 0) / responseMinutesList.length) * 10) / 10
        : null;

    res.json({
      unclaimedCount: unclaimedInquiries.length,
      slaBreachedCount: slaBreached,
      activePipelineCount: activeLeads.length,
      activePipelineValue: totalPipelineValue,
      monthlyConversionRate: conversionRate,
      conversionDelta,
      avgResponseMinutes,
      measuredResponseCount: responseMinutesList.length,
      confirmedRevenue,
      confirmedCount: confirmedLeads.length,
      totalLeadsCount,
      onlineAgentsCount,
      unreadNotificationsCount,
    });
  } catch (error: any) {
    console.error('Error fetching sales metrics:', error);
    res.status(500).json({ error: 'Failed to aggregate sales metrics' });
  }
});

// ---------------------------------------------------------------------------
// 2b. Revenue & Conversion Analytics (/api/sales/analytics)
// ---------------------------------------------------------------------------
router.get('/analytics', authenticateToken, authorizeRoles(...SALES_PORTAL_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const [inquiries, bookings, teamUsers] = await Promise.all([
      p.inquiry.findMany({
        where: withStrictTenantScope({}, req.tenantId),
        select: {
          id: true,
          destination: true,
          netPrice: true,
          budget: true,
          leadStage: true,
          status: true,
          sourceCta: true,
          assignedTo: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      p.booking
        .findMany({
          where: withStrictTenantScope({}, req.tenantId),
          select: { id: true },
        })
        .catch(() => []),
      p.user
        .findMany({
          where: withStrictTenantScope(
            { role: { in: ['admin', 'sales', 'operations', 'finance', 'DIRECTOR', 'SALES_MANAGER', 'SALES_EXECUTIVE'] } },
            req.tenantId
          ),
          select: { name: true, email: true, employeeCode: true, isOnline: true },
        })
        .catch(() => []),
    ]);

    const refIds = Array.from(new Set([...inquiries.map((i: any) => i.id), ...bookings.map((b: any) => b.id)]));
    const ledgerEntries =
      refIds.length > 0
        ? await p.transactionLedger
            .findMany({
              where: { bookingId: { in: refIds } },
              select: { amount: true, description: true, createdAt: true, type: true },
            })
            .catch(() => [])
        : [];

    // 6-month time series from real DB data
    const now = new Date();
    const monthBuckets: Array<{ key: string; month: string; leads: number; confirmed: number; revenue: number; collected: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      monthBuckets.push({ key, month, leads: 0, confirmed: 0, revenue: 0, collected: 0 });
    }

    const stageMap: Record<string, { stage: string; count: number; valueINR: number }> = {
      NEW_LEAD: { stage: 'New Lead', count: 0, valueINR: 0 },
      CLAIMED: { stage: 'Claimed', count: 0, valueINR: 0 },
      FOLLOW_UP: { stage: 'Follow-Up', count: 0, valueINR: 0 },
      QUOTE_SENT: { stage: 'Quote Sent', count: 0, valueINR: 0 },
      NEGOTIATION: { stage: 'Negotiation', count: 0, valueINR: 0 },
      PAYMENT_PENDING: { stage: 'Payment Pending', count: 0, valueINR: 0 },
      CONFIRMED: { stage: 'Confirmed', count: 0, valueINR: 0 },
      LOST: { stage: 'Lost', count: 0, valueINR: 0 },
    };

    const destMap = new Map<string, { destination: string; count: number; valueINR: number }>();
    const sourceMap = new Map<string, number>();
    const agentPerfMap = new Map<string, { code: string; name: string; totalLeads: number; confirmed: number; revenueINR: number; isOnline: boolean }>();

    const userLookup = new Map<string, any>();
    for (const u of teamUsers) {
      if (u.employeeCode) userLookup.set(String(u.employeeCode).toUpperCase(), u);
      if (u.email) userLookup.set(String(u.email).toLowerCase(), u);
    }

    let confirmedCount = 0;
    let confirmedRevenueINR = 0;
    let activePipelineValueINR = 0;

    for (const inq of inquiries) {
      const dt = new Date(inq.createdAt);
      const mKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      const val = getValueINR(inq);
      let stage = String(inq.leadStage || '').toUpperCase();
      if (stage === 'QUOTED') stage = 'QUOTE_SENT';
      if (stage === 'CANCELLED') stage = 'LOST';
      if (stage === 'COMPLETED') stage = 'CONFIRMED';
      if (!stage) stage = inq.status === 'Booked' ? 'CONFIRMED' : inq.status === 'Lost' ? 'LOST' : 'NEW_LEAD';

      const isConfirmed = stage === 'CONFIRMED' || inq.status === 'Booked';
      if (isConfirmed) {
        confirmedCount++;
        confirmedRevenueINR += val;
      } else if (stage !== 'LOST') {
        activePipelineValueINR += val;
      }

      const bucket = monthBuckets.find((b) => b.key === mKey);
      if (bucket) {
        bucket.leads++;
        if (isConfirmed) {
          bucket.confirmed++;
          bucket.revenue += val;
        }
      }

      if (stageMap[stage]) {
        stageMap[stage].count++;
        stageMap[stage].valueINR += val;
      }

      const dest = (inq.destination || 'Kashmir Circuit').split(',')[0].trim() || 'Kashmir';
      const prevDest = destMap.get(dest) || { destination: dest, count: 0, valueINR: 0 };
      prevDest.count++;
      prevDest.valueINR += val;
      destMap.set(dest, prevDest);

      const src = inq.sourceCta || 'DIRECT_INQUIRY';
      sourceMap.set(src, (sourceMap.get(src) || 0) + 1);

      const assignee = String(inq.assignedTo || 'Unassigned').trim() || 'Unassigned';
      const matchedUser = userLookup.get(assignee.toUpperCase()) || userLookup.get(assignee.toLowerCase());
      const perf = agentPerfMap.get(assignee) || {
        code: matchedUser?.employeeCode || assignee,
        name: matchedUser?.name || assignee,
        totalLeads: 0,
        confirmed: 0,
        revenueINR: 0,
        isOnline: Boolean(matchedUser?.isOnline),
      };
      perf.totalLeads++;
      if (isConfirmed) {
        perf.confirmed++;
        perf.revenueINR += val;
      }
      agentPerfMap.set(assignee, perf);
    }

    let totalCollectedINR = 0;
    for (const tx of ledgerEntries) {
      if (tx.type === 'CREDIT' && !String(tx.description || '').startsWith('Pending WhatsApp')) {
        const amt = Number(tx.amount || 0);
        totalCollectedINR += amt;
        const dt = new Date(tx.createdAt);
        const mKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
        const bucket = monthBuckets.find((b) => b.key === mKey);
        if (bucket) bucket.collected += amt;
      }
    }

    const totalLeads = inquiries.length;
    const conversionRatePct = totalLeads > 0 ? Number(((confirmedCount / totalLeads) * 100).toFixed(1)) : 0;
    const avgDealValueINR = confirmedCount > 0 ? Math.round(confirmedRevenueINR / confirmedCount) : 0;

    res.json({
      summary: {
        totalLeads,
        confirmedCount,
        confirmedRevenueINR,
        activePipelineValueINR,
        totalCollectedINR,
        avgDealValueINR,
        conversionRatePct,
      },
      monthlySeries: monthBuckets,
      stageDistribution: Object.values(stageMap),
      topDestinations: Array.from(destMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
      sourceBreakdown: Array.from(sourceMap.entries())
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count),
      conciergeLeaderboard: Array.from(agentPerfMap.values())
        .filter((a) => a.code !== 'Unassigned')
        .map((a) => ({
          ...a,
          conversionRatePct: a.totalLeads > 0 ? Number(((a.confirmed / a.totalLeads) * 100).toFixed(1)) : 0,
        }))
        .sort((a, b) => b.revenueINR - a.revenueINR || b.confirmed - a.confirmed),
    });
  } catch (error: any) {
    console.error('Error computing sales analytics:', error);
    res.status(500).json({ error: 'Failed to compute analytics' });
  }
});

// ---------------------------------------------------------------------------
// 2c. Recent Activity Timeline (/api/sales/activities)
// ---------------------------------------------------------------------------
router.get('/activities', authenticateToken, authorizeRoles(...SALES_PORTAL_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
    const type = req.query.type ? String(req.query.type).trim() : '';
    const inquiryId = req.query.inquiryId ? String(req.query.inquiryId).trim() : '';

    // Resolve tenant-scoped inquiry IDs so activities never leak across tenants
    const scopedInquiries = await p.inquiry.findMany({
      where: withStrictTenantScope(inquiryId ? { id: inquiryId } : {}, req.tenantId),
      select: { id: true, leadId: true, customerName: true, destination: true, leadStage: true },
    });

    const inquiryMap = new Map<string, any>();
    for (const inq of scopedInquiries) {
      inquiryMap.set(inq.id, inq);
    }

    const scopedIds = Array.from(inquiryMap.keys());
    if (scopedIds.length === 0) {
      return res.json({
        activities: [],
        pagination: { total: 0, page, limit, totalPages: 1 },
      });
    }

    const where: any = {
      inquiryId: { in: scopedIds },
    };
    if (type && type !== 'ALL') {
      where.type = type;
    }

    const [rows, total] = await Promise.all([
      p.leadActivity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      p.leadActivity.count({ where }),
    ]);

    const enriched = rows.map((act: any) => ({
      ...act,
      inquiry: inquiryMap.get(act.inquiryId) || null,
    }));

    res.json({
      activities: enriched,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching sales activities:', error);
    res.status(500).json({ error: 'Failed to fetch activity timeline' });
  }
});

// ---------------------------------------------------------------------------
// 2d. Global Command Search (/api/sales/search)
// ---------------------------------------------------------------------------
router.get('/search', authenticateToken, authorizeRoles(...SALES_PORTAL_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const q = String(req.query.q || '').trim();
    if (!q) {
      return res.json({ leads: [], documents: [], payments: [] });
    }

    const leadWhere = withStrictTenantScope(
      {
        OR: [
          { customerName: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { email: { contains: q, mode: 'insensitive' } },
          { destination: { contains: q, mode: 'insensitive' } },
          { leadId: { contains: q, mode: 'insensitive' } },
        ],
      },
      req.tenantId
    );

    const [tenantInquiries, tenantBookings] = await Promise.all([
      p.inquiry.findMany({
        where: withStrictTenantScope({}, req.tenantId),
        select: { id: true, customerName: true, leadId: true },
      }),
      p.booking
        .findMany({
          where: withStrictTenantScope({}, req.tenantId),
          select: { id: true, details: true },
        })
        .catch(() => []),
    ]);
    const tenantInquiryIds = tenantInquiries.map((i: any) => i.id);
    const inqLookup = new Map<string, any>();
    for (const i of tenantInquiries) inqLookup.set(i.id, i);

    const bookingToInquiryLookup = new Map<string, any>();
    const ledgerRefIds = new Set<string>(tenantInquiryIds);
    for (const b of tenantBookings) {
      ledgerRefIds.add(b.id);
      if (b.details) {
        try {
          const parsed = typeof b.details === 'string' ? JSON.parse(b.details) : b.details;
          if (parsed?.inquiryId && inqLookup.has(parsed.inquiryId)) {
            bookingToInquiryLookup.set(b.id, inqLookup.get(parsed.inquiryId));
          }
        } catch {
          // ignore invalid JSON
        }
      }
    }
    const allLedgerIds = Array.from(ledgerRefIds);

    const [leads, documents, payments] = await Promise.all([
      p.inquiry.findMany({
        where: leadWhere,
        take: 10,
        orderBy: { updatedAt: 'desc' },
      }),
      tenantInquiryIds.length > 0
        ? p.inquiryDocument
            .findMany({
              where: {
                inquiryId: { in: tenantInquiryIds },
                OR: [{ name: { contains: q, mode: 'insensitive' } }, { category: { contains: q, mode: 'insensitive' } }],
              },
              take: 8,
              orderBy: { createdAt: 'desc' },
            })
            .catch(() => [])
        : Promise.resolve([]),
      allLedgerIds.length > 0
        ? p.transactionLedger
            .findMany({
              where: {
                bookingId: { in: allLedgerIds },
                OR: [
                  { paymentId: { contains: q, mode: 'insensitive' } },
                  { orderId: { contains: q, mode: 'insensitive' } },
                  { description: { contains: q, mode: 'insensitive' } },
                ],
              },
              take: 8,
              orderBy: { createdAt: 'desc' },
            })
            .catch(() => [])
        : Promise.resolve([]),
    ]);

    res.json({
      leads,
      documents: documents.map((d: any) => ({ ...d, inquiry: inqLookup.get(d.inquiryId) || null })),
      payments: payments.map((tx: any) => ({
        ...tx,
        inquiry: inqLookup.get(tx.bookingId) || bookingToInquiryLookup.get(tx.bookingId) || null,
      })),
    });
  } catch (error: any) {
    console.error('Error executing global sales search:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ---------------------------------------------------------------------------
// 3. Atomic Lead Claiming Transaction (POST /api/sales/leads/:id/claim)
// ---------------------------------------------------------------------------
router.post('/leads/:id/claim', authenticateToken, authorizeRoles(...SALES_MUTATION_ROLES), async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const executive = req.user;
  const executiveCode = req.body.employeeCode || executive?.employeeCode || executive?.code || executive?.email || 'SALES_EXEC';
  const executiveName = req.body.employeeName || executive?.name || 'Sales Executive';

  try {
    const p = prisma as any;

    const existing = await p.inquiry.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    if (!canAccessTenantRecord(req, existing.organizationId)) {
      return res.status(403).json({ error: 'Forbidden: Cross-tenant lead claim denied' });
    }

    const result = await p.$transaction(async (tx: any) => {
      // Atomic conditional update to prevent concurrent race conditions
      const claimRes = await tx.inquiry.updateMany({
        where: {
          id,
          OR: [{ assignedTo: null }, { assignedTo: '' }, { assignedTo: executiveCode }],
        },
        data: {
          assignedTo: executiveCode,
          leadStage: 'CLAIMED',
          status: 'Pending Curation',
          lastContactedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      if (!claimRes || claimRes.count === 0) {
        throw new Error('ALREADY_CLAIMED');
      }

      const updatedLead = await tx.inquiry.findUnique({ where: { id } });

      const activity = await tx.leadActivity.create({
        data: {
          inquiryId: id,
          type: 'STAGE_CHANGE',
          title: 'Lead Claimed by Executive',
          description: `Lead claimed by ${executiveName} (${executiveCode}). Moved to Active Pipeline.`,
          performedBy: executiveCode,
        },
      });

      const notification = await tx.notification
        .create({
          data: {
            userId: buildTenantNotificationUserId(updatedLead.organizationId || req.tenantId),
            title: 'Lead Claimed',
            message: `${executiveName} (${executiveCode}) claimed ${updatedLead.customerName} (${updatedLead.destination})`,
            type: 'inquiry',
            priority: 'medium',
            link: `/sales/portal?tab=active-pipeline&inquiryId=${id}`,
            read: false,
          },
        })
        .catch(() => null);

      return { updatedLead, activity, notification };
    });

    const tenantId = result.updatedLead?.organizationId || req.tenantId || null;

    realtimeBus.publish(
      'LEAD_CLAIMED',
      {
        leadId: id,
        claimedBy: executiveCode,
        claimedByName: executiveName,
        lead: result.updatedLead,
      },
      { io: req.io, tenantId }
    );

    realtimeBus.publish(
      'ACTIVITY_LOGGED',
      { ...result.activity, inquiry: result.updatedLead },
      { io: req.io, tenantId }
    );

    realtimeBus.publish(
      'new-system-event',
      {
        type: 'LEAD_CLAIMED',
        message: `${executiveName} claimed ${result.updatedLead.customerName}`,
        booking: { ...result.updatedLead, entityType: 'inquiry' },
        notification: result.notification,
        timestamp: new Date().toISOString(),
      },
      { io: req.io, tenantId }
    );

    res.json({
      success: true,
      message: 'Lead claimed successfully',
      lead: result.updatedLead,
    });
  } catch (error: any) {
    if (error.message === 'ALREADY_CLAIMED') {
      return res.status(409).json({
        error: 'Conflict: This lead has already been claimed by another sales executive.',
        code: 'RACE_CONDITION_BLOCKED',
      });
    }
    console.error('Lead claim transaction error:', error);
    res.status(500).json({ error: 'Failed to execute atomic claim transaction' });
  }
});

// ---------------------------------------------------------------------------
// 4. Lead Stage Transition & Auto-Dispatch to Driver (/api/sales/leads/:id/stage)
// ---------------------------------------------------------------------------
router.patch('/leads/:id/stage', authenticateToken, authorizeRoles(...SALES_MUTATION_ROLES), async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const { stage, notes, netPrice, budget, priority } = req.body;
  const user = req.user;
  const performer = user?.employeeCode || user?.code || user?.name || 'Sales Staff';

  if (!stage) {
    return res.status(400).json({ error: 'New stage is required' });
  }

  const rawStageUpper = String(stage).trim().toUpperCase();
  if (!VALID_STAGES.has(rawStageUpper)) {
    return res.status(400).json({ error: `Invalid pipeline stage '${stage}'` });
  }

  try {
    const p = prisma as any;

    const lead = await p.inquiry.findUnique({ where: { id } });
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    if (!canAccessTenantRecord(req, lead.organizationId)) {
      return res.status(403).json({ error: 'Forbidden: Cross-tenant lead update denied' });
    }

    const normalizedStage = normalizeStageInput(rawStageUpper);
    let statusToSet = lead.status;
    if (normalizedStage === 'CONFIRMED' || normalizedStage === 'COMPLETED') statusToSet = 'Booked';
    else if (normalizedStage === 'LOST' || normalizedStage === 'CANCELLED') statusToSet = 'Lost';
    else if (normalizedStage === 'QUOTE_SENT' || normalizedStage === 'NEGOTIATION' || normalizedStage === 'PAYMENT_PENDING')
      statusToSet = 'Ready for Review';
    else if (normalizedStage === 'CLAIMED' || normalizedStage === 'FOLLOW_UP') statusToSet = 'Pending Curation';

    const updateData: any = {
      leadStage: normalizedStage,
      status: statusToSet,
      lastContactedAt: new Date(),
      updatedAt: new Date(),
    };
    if (netPrice !== undefined && !isNaN(Number(netPrice))) updateData.netPrice = Number(netPrice);
    if (budget !== undefined) updateData.budget = String(budget);
    if (priority !== undefined) updateData.priority = String(priority);

    const [updated, activity, notification] = await p.$transaction(async (tx: any) => {
      const updatedLead = await tx.inquiry.update({
        where: { id },
        data: updateData,
      });

      const act = await tx.leadActivity.create({
        data: {
          inquiryId: id,
          type: 'STAGE_CHANGE',
          title: `Pipeline Transition: ${normalizedStage}`,
          description: notes || `Lead transitioned from ${lead.leadStage} to ${normalizedStage} by ${performer}`,
          performedBy: performer,
        },
      });

      await tx.auditLog
        .create({
          data: {
            userId: String(user?.id || performer),
            action: 'UPDATE_LEAD_STAGE',
            details: JSON.stringify({
              inquiryId: id,
              oldStage: lead.leadStage,
              newStage: normalizedStage,
            }),
          },
        })
        .catch(() => null);

      let notif = null;
      if (['CONFIRMED', 'PAYMENT_PENDING', 'LOST'].includes(normalizedStage)) {
        notif = await tx.notification
          .create({
            data: {
              userId: buildTenantNotificationUserId(updatedLead.organizationId || req.tenantId || null),
              title: normalizedStage === 'CONFIRMED' ? 'Booking Confirmed' : `Stage: ${normalizedStage.replace(/_/g, ' ')}`,
              message: `${updatedLead.customerName} (${updatedLead.destination}) moved to ${normalizedStage.replace(/_/g, ' ')} by ${performer}`,
              type: normalizedStage === 'CONFIRMED' ? 'booking' : 'inquiry',
              priority: normalizedStage === 'CONFIRMED' ? 'high' : 'medium',
              link: `/sales/portal?tab=active-pipeline&inquiryId=${id}`,
              read: false,
            },
          })
          .catch(() => null);
      }

      return [updatedLead, act, notif];
    });

    if (normalizedStage === 'CONFIRMED') {
      const pinCode = `KC-${Math.floor(10 + Math.random() * 89)}`;
      const fare = updated.netPrice > 0 ? Math.round(updated.netPrice * 0.15) : 2850;

      broadcastDriverEvent('NEW_DISPATCH_OFFER', {
        type: 'NEW_DISPATCH_OFFER',
        tenantId: updated.organizationId || req.tenantId || undefined,
        trip: {
          id: `trip-deal-${id.slice(0, 8)}`,
          passengerName: updated.customerName,
          passengerPhone: updated.phone,
          travelerCount: updated.adultsCount || 2,
          luggageCount: 3,
          pickupLocation: updated.arrivalCity || 'Srinagar Airport SXR (Arrival Terminal Gate 2)',
          dropLocation: `${updated.destination || 'Gulmarg Gondola Resort'}`,
          distanceKm: 52,
          estimatedDuration: '1 hr 30 min',
          fareAmount: fare,
          securityPin: pinCode,
          arrivalTelemetry: {
            type: updated.arrivalCity?.toLowerCase().includes('train') ? 'TRAIN' : 'FLIGHT',
            flightNumber: '6E-502',
            airline: 'IndiGo Airlines',
            status: 'Confirmed Guest Arrival',
            terminal: 'SXR Arrival Bay Gate 2',
          },
          stage: 'ACCEPTED',
          nextTurnInstruction: 'Proceed to Srinagar Airport Gate 2 Pickup Bay',
        },
      });
    }

    const tenantId = updated.organizationId || req.tenantId || null;

    realtimeBus.publish(
      'LEAD_STAGE_UPDATED',
      {
        leadId: id,
        stage: normalizedStage,
        newStage: normalizedStage,
        previousStage: lead.leadStage,
        performer,
        lead: updated,
      },
      { io: req.io, tenantId }
    );

    realtimeBus.publish(
      'STAGE_UPDATED',
      {
        leadId: id,
        stage: normalizedStage,
        newStage: normalizedStage,
        previousStage: lead.leadStage,
        performer,
        lead: updated,
      },
      { io: req.io, tenantId }
    );

    realtimeBus.publish('ACTIVITY_LOGGED', { ...activity, inquiry: updated }, { io: req.io, tenantId });

    if (normalizedStage === 'CONFIRMED') {
      realtimeBus.publish(
        'BOOKING_STATUS_UPDATED',
        { inquiryId: id, status: 'Booked', leadStage: 'CONFIRMED', lead: updated },
        { io: req.io, tenantId }
      );
    }

    realtimeBus.publish(
      'new-system-event',
      {
        type: 'UPDATE',
        message: `${updated.customerName} moved to ${normalizedStage.replace(/_/g, ' ')}`,
        booking: { ...updated, entityType: 'inquiry' },
        notification,
        timestamp: new Date().toISOString(),
      },
      { io: req.io, tenantId }
    );

    res.json({
      success: true,
      lead: updated,
    });
  } catch (error: any) {
    console.error('Error updating lead stage:', error);
    res.status(500).json({ error: 'Failed to update lead stage' });
  }
});

// ---------------------------------------------------------------------------
// 5. Employee Live Availability Toggle (/api/sales/availability)
// ---------------------------------------------------------------------------
router.post('/availability', authenticateToken, authorizeRoles(...SALES_PORTAL_ROLES), async (req: AuthRequest, res: Response) => {
  const { isOnline } = req.body;
  const user = req.user;

  if (typeof isOnline !== 'boolean') {
    return res.status(400).json({ error: 'isOnline boolean is required' });
  }

  try {
    const p = prisma as any;
    if (user?.id) {
      await p.user
        .update({
          where: { id: user.id },
          data: { isOnline },
        })
        .catch(() => {});
    }

    const empCode = user?.employeeCode || user?.code;
    realtimeBus.publish(
      'EMPLOYEE_STATUS_CHANGED',
      {
        employeeCode: empCode,
        name: user?.name,
        isOnline,
        source: 'availability_api',
        timestamp: new Date().toISOString(),
      },
      { io: req.io, tenantId: req.tenantId ?? null }
    );

    res.json({ success: true, isOnline });
  } catch {
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// ---------------------------------------------------------------------------
// 6. Role-Gated Team & RBAC Management (/api/sales/team)
// ---------------------------------------------------------------------------
router.get('/team', authenticateToken, authorizeRoles(...SALES_PORTAL_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const [users, activeCounts, activeSessions] = await Promise.all([
      p.user.findMany({
        where: withStrictTenantScope(
          {
            role: { in: ['admin', 'sales', 'operations', 'finance', 'DIRECTOR', 'SALES_MANAGER', 'SALES_EXECUTIVE'] },
          },
          req.tenantId
        ),
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          employeeCode: true,
          isOnline: true,
          leadCapacity: true,
          phone: true,
          createdAt: true,
        },
      }),
      p.inquiry.findMany({
        where: withStrictTenantScope(
          {
            assignedTo: { not: null },
            leadStage: { notIn: ['CONFIRMED', 'COMPLETED', 'CANCELLED', 'LOST'] },
            status: { notIn: ['Booked', 'Lost', 'Cancelled'] },
          },
          req.tenantId
        ),
        select: { assignedTo: true },
      }),
      p.employeeSession
        .findMany({
          where: { isActive: true },
          select: { employeeCode: true, isOnBreak: true, assignedDesk: true, lastActivityAt: true },
        })
        .catch(() => []),
    ]);

    const userCodes = new Set(users.map((u: any) => String(u.employeeCode || '').toUpperCase()).filter(Boolean));
    const liveSocketUsers = realtimeBus.getOnlinePresence(req.tenantId);
    const liveCodes = new Set(liveSocketUsers.map((u) => String(u.employeeCode || '').toUpperCase()).filter(Boolean));
    const sessionMap = new Map<string, any>();
    for (const s of activeSessions) {
      const code = String(s.employeeCode || '').toUpperCase();
      if (code && (!req.tenantId || userCodes.has(code))) {
        sessionMap.set(code, s);
      }
    }

    const enriched = users.map((u: any) => {
      const codeUpper = (u.employeeCode || '').toUpperCase();
      const emailLower = (u.email || '').toLowerCase();
      const activeLeadCount = activeCounts.filter((row: any) => {
        const assignee = String(row.assignedTo || '').trim();
        return (codeUpper && assignee.toUpperCase() === codeUpper) || (emailLower && assignee.toLowerCase() === emailLower);
      }).length;
      const session = codeUpper ? sessionMap.get(codeUpper) : null;
      return {
        ...u,
        isOnline: Boolean(u.isOnline || (codeUpper && liveCodes.has(codeUpper))),
        activeLeadCount,
        isOnBreak: Boolean(session?.isOnBreak),
        assignedDesk: session?.assignedDesk || null,
        lastActivityAt: session?.lastActivityAt || null,
      };
    });

    res.json(enriched);
  } catch {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// ---------------------------------------------------------------------------
// 7. Manual Sales Lead Creation (POST /api/sales/leads)
// ---------------------------------------------------------------------------
router.post('/leads', authenticateToken, authorizeRoles('admin', 'operations', 'sales', 'marketing'), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid lead payload',
        errors: parsed.error.issues,
      });
    }

    const p = prisma as any;
    const {
      customerName,
      phone,
      email,
      destination,
      duration,
      adultsCount,
      childrenCount,
      budget,
      netPrice,
      accommodation,
      transportPreference,
      arrivalCity,
      priority,
      assignedTo,
      notes,
      sourceCta,
      leadStage,
    } = parsed.data;

    if (!phone && !email) {
      return res.status(400).json({ error: 'Phone or email is required' });
    }

    const adults = Math.max(1, Number(adultsCount || 2));
    const children = Math.max(0, Number(childrenCount || 0));
    const parsedNetPrice = netPrice !== undefined && !isNaN(Number(netPrice)) ? Number(netPrice) : 0;
    const leadId = await LeadScoringService.generateLeadId();
    const scoreResult = LeadScoringService.calculateScore({
      destination: destination || 'Kashmir Valley',
      budgetRange: budget ? String(budget) : undefined,
      preferredAccommodation: accommodation || undefined,
      adultsCount: adults,
      childrenCount: children,
      arrivalCity: arrivalCity || undefined,
      transportPreference: transportPreference || undefined,
      sourceCta: sourceCta || 'SALES_PORTAL_MANUAL',
      profileCompleteness: 75,
    });

    const assignee = assignedTo !== undefined ? (assignedTo ? String(assignedTo).trim() : null) : null;
    const initialStage = leadStage ? normalizeStageInput(leadStage) : assignee ? 'CLAIMED' : 'NEW_LEAD';
    const initialStatus = assignee ? 'Pending Curation' : 'New';
    const organizationId = resolveWriteTenantId(req);

    const created = await p.inquiry.create({
      data: {
        leadId,
        customerName: String(customerName).trim(),
        phone: phone ? String(phone).trim() : 'Not Provided',
        email: email ? String(email).trim() : `${leadId.toLowerCase()}@guest.kashmirconnect.com`,
        destination: destination || 'Kashmir Valley',
        duration: duration || '5 Nights / 6 Days',
        travelers: `${adults} Adults${children > 0 ? `, ${children} Kids` : ''}`,
        adultsCount: adults,
        childrenCount: children,
        budget: budget ? String(budget) : parsedNetPrice > 0 ? `₹${parsedNetPrice.toLocaleString('en-IN')}` : 'Flexible',
        netPrice: parsedNetPrice,
        accommodation: accommodation || '4-Star Boutique',
        preferredAccommodation: accommodation || '4-Star Boutique',
        transportPreference: transportPreference || null,
        arrivalCity: arrivalCity || null,
        priority: priority || scoreResult.priority,
        sentiment: scoreResult.sentiment,
        leadScore: scoreResult.totalScore,
        leadCategory: scoreResult.category,
        scoringBreakdown: JSON.stringify(scoreResult.scoringBreakdown),
        profileCompleteness: 75,
        sourceCta: sourceCta || 'SALES_PORTAL_MANUAL',
        leadStage: initialStage,
        status: initialStatus,
        assignedTo: assignee,
        notes: notes ? String(notes).trim() : null,
        organizationId,
      },
    });

    const activity = await p.leadActivity.create({
      data: {
        inquiryId: created.id,
        type: 'LEAD_CREATED',
        title: 'Lead registered in Sales OS',
        description: `Created by ${req.user?.name || req.user?.employeeCode || req.user?.code || 'Sales Staff'}${assignee ? ` and assigned to ${assignee}` : ''}.`,
        performedBy: req.user?.employeeCode || req.user?.code || req.user?.name || 'Sales Staff',
      },
    });

    const notification = await p.notification
      .create({
        data: {
          userId: buildTenantNotificationUserId(organizationId),
          title: 'New Lead Registered',
          message: `${created.customerName} (${created.destination}) added to ${assignee ? `assignee ${assignee}` : 'Live Inbound Queue'}`,
          type: 'inquiry',
          priority: 'high',
          link: `/sales/portal?tab=live-leads&inquiryId=${created.id}`,
          read: false,
        },
      })
      .catch(() => null);

    realtimeBus.publish('NEW_INQUIRY', created, { io: req.io, tenantId: organizationId });
    realtimeBus.publish('ACTIVITY_LOGGED', { ...activity, inquiry: created }, { io: req.io, tenantId: organizationId });
    realtimeBus.publish(
      'new-system-event',
      {
        type: 'CREATE',
        message: `New Lead: ${created.customerName} (${created.destination})`,
        booking: { ...created, entityType: 'inquiry' },
        notification,
        timestamp: new Date().toISOString(),
      },
      { io: req.io, tenantId: organizationId }
    );

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating sales lead:', error);
    res.status(500).json({ error: error.message || 'Failed to create sales lead' });
  }
});

// ---------------------------------------------------------------------------
// 8. Global + Per-Inquiry Document Vault CRUD (/api/sales/documents & /api/sales/leads/:id/documents)
// ---------------------------------------------------------------------------
router.get('/documents', authenticateToken, authorizeRoles(...SALES_PORTAL_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
    const status = req.query.status ? String(req.query.status).toUpperCase() : '';
    const category = req.query.category ? String(req.query.category).toUpperCase() : '';
    const search = req.query.search ? String(req.query.search).trim() : '';

    const scopedInquiries = await p.inquiry.findMany({
      where: withStrictTenantScope({}, req.tenantId),
      select: { id: true, leadId: true, customerName: true, destination: true, leadStage: true },
    });

    const inquiryMap = new Map<string, any>();
    for (const inq of scopedInquiries) inquiryMap.set(inq.id, inq);
    const scopedIds = Array.from(inquiryMap.keys());

    if (scopedIds.length === 0) {
      return res.json({
        documents: [],
        summary: { total: 0, verified: 0, pending: 0, rejected: 0, totalBytes: 0 },
        pagination: { total: 0, page, limit, totalPages: 1 },
      });
    }

    const where: any = { inquiryId: { in: scopedIds } };
    if (status && status !== 'ALL') where.status = status;
    if (category && category !== 'ALL') where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [docs, total, allScopedDocs] = await Promise.all([
      p.inquiryDocument.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      p.inquiryDocument.count({ where }),
      p.inquiryDocument.findMany({
        where: { inquiryId: { in: scopedIds } },
        select: { status: true, sizeBytes: true },
      }),
    ]);

    const summary = {
      total: allScopedDocs.length,
      verified: allScopedDocs.filter((d: any) => d.status === 'VERIFIED').length,
      pending: allScopedDocs.filter((d: any) => d.status === 'PENDING').length,
      rejected: allScopedDocs.filter((d: any) => d.status === 'REJECTED').length,
      totalBytes: allScopedDocs.reduce((sum: number, d: any) => sum + (Number(d.sizeBytes) || 0), 0),
    };

    res.json({
      documents: docs.map((d: any) => ({ ...d, inquiry: inquiryMap.get(d.inquiryId) || null })),
      summary,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error: any) {
    console.error('Error listing global vault documents:', error);
    res.status(500).json({ error: 'Failed to load vault documents' });
  }
});

router.get('/leads/:id/documents', authenticateToken, authorizeRoles(...SALES_PORTAL_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const inquiry = await p.inquiry.findUnique({ where: { id: req.params.id }, select: { id: true, organizationId: true } });
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    if (!canAccessTenantRecord(req, inquiry.organizationId)) {
      return res.status(403).json({ error: 'Forbidden: Cross-tenant vault access denied' });
    }

    const docs = await p.inquiryDocument.findMany({
      where: { inquiryId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(docs);
  } catch (error: any) {
    console.error('Error fetching inquiry documents:', error);
    res.status(500).json({ error: 'Failed to fetch inquiry documents' });
  }
});

router.post('/leads/:id/documents', authenticateToken, authorizeRoles(...SALES_PORTAL_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const { id } = req.params;
    const { name, category = 'ID_PROOF', url, publicId, mimeType, sizeBytes = 0 } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: 'Document name and url are required' });
    }
    if (!isSafeDocumentUrl(url)) {
      return res.status(400).json({ error: 'Invalid or unsafe document URL' });
    }

    const inquiry = await p.inquiry.findUnique({ where: { id } });
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    if (!canAccessTenantRecord(req, inquiry.organizationId)) {
      return res.status(403).json({ error: 'Forbidden: Cross-tenant document upload denied' });
    }

    const doc = await p.inquiryDocument.create({
      data: {
        inquiryId: id,
        name: String(name).trim().slice(0, 200),
        category: String(category).toUpperCase(),
        url: String(url).trim(),
        publicId: publicId ? String(publicId) : null,
        mimeType: mimeType ? String(mimeType) : null,
        sizeBytes: Math.max(0, Number(sizeBytes) || 0),
        status: 'PENDING',
        uploadedBy: req.user?.name || req.user?.employeeCode || req.user?.code || req.user?.email || 'Sales Staff',
      },
    });

    const activity = await p.leadActivity.create({
      data: {
        inquiryId: id,
        type: 'DOCUMENT_UPLOADED',
        title: `Document uploaded: ${doc.name}`,
        description: `Category: ${doc.category}`,
        performedBy: req.user?.employeeCode || req.user?.code || req.user?.name || 'Sales Staff',
      },
    });

    realtimeBus.publish('ACTIVITY_LOGGED', { ...activity, inquiry }, { io: req.io, tenantId: inquiry.organizationId || req.tenantId });

    res.status(201).json(doc);
  } catch (error: any) {
    console.error('Error saving inquiry document:', error);
    res.status(500).json({ error: 'Failed to save inquiry document' });
  }
});

router.patch('/documents/:docId', authenticateToken, authorizeRoles(...SALES_PORTAL_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const { docId } = req.params;
    const { status, category, name } = req.body;

    const existing = await p.inquiryDocument.findUnique({ where: { id: docId } });
    if (!existing) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const inquiry = await p.inquiry.findUnique({ where: { id: existing.inquiryId } });
    if (inquiry && !canAccessTenantRecord(req, inquiry.organizationId)) {
      return res.status(403).json({ error: 'Forbidden: Cross-tenant document update denied' });
    }

    const normalizedStatus = status ? String(status).toUpperCase() : undefined;
    if (normalizedStatus && !['PENDING', 'VERIFIED', 'REJECTED'].includes(normalizedStatus)) {
      return res.status(400).json({ error: 'Invalid document status' });
    }

    const updated = await p.inquiryDocument.update({
      where: { id: docId },
      data: {
        ...(normalizedStatus && { status: normalizedStatus }),
        ...(category && { category: String(category).toUpperCase() }),
        ...(name && { name: String(name).trim() }),
        ...(normalizedStatus === 'VERIFIED' ? { verifiedBy: req.user?.name || req.user?.employeeCode || req.user?.code || 'Staff' } : {}),
      },
    });

    if (normalizedStatus) {
      const activity = await p.leadActivity.create({
        data: {
          inquiryId: existing.inquiryId,
          type: 'DOCUMENT_VERIFIED',
          title: `Document ${updated.status.toLowerCase()}: ${updated.name}`,
          description: `Marked ${updated.status} by ${req.user?.name || req.user?.employeeCode || req.user?.code || 'Staff'}`,
          performedBy: req.user?.employeeCode || req.user?.code || req.user?.name || 'Staff',
        },
      });
      realtimeBus.publish('ACTIVITY_LOGGED', { ...activity, inquiry }, { io: req.io, tenantId: inquiry?.organizationId || req.tenantId });
    }

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating inquiry document:', error);
    res.status(500).json({ error: 'Failed to update inquiry document' });
  }
});

router.delete('/documents/:docId', authenticateToken, authorizeRoles(...SALES_PORTAL_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const { docId } = req.params;
    const existing = await p.inquiryDocument.findUnique({ where: { id: docId } });
    if (!existing) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const inquiry = await p.inquiry.findUnique({ where: { id: existing.inquiryId } });
    if (inquiry && !canAccessTenantRecord(req, inquiry.organizationId)) {
      return res.status(403).json({ error: 'Forbidden: Cross-tenant document deletion denied' });
    }

    await p.inquiryDocument.delete({ where: { id: docId } });

    const activity = await p.leadActivity.create({
      data: {
        inquiryId: existing.inquiryId,
        type: 'DOCUMENT_DELETED',
        title: `Document removed: ${existing.name}`,
        description: `Deleted from Vault by ${req.user?.name || req.user?.employeeCode || req.user?.code || 'Staff'}`,
        performedBy: req.user?.employeeCode || req.user?.code || req.user?.name || 'Staff',
      },
    });
    realtimeBus.publish('ACTIVITY_LOGGED', { ...activity, inquiry }, { io: req.io, tenantId: inquiry?.organizationId || req.tenantId });

    res.json({ success: true, id: docId });
  } catch (error: any) {
    console.error('Error deleting inquiry document:', error);
    res.status(500).json({ error: 'Failed to delete inquiry document' });
  }
});

export default router;
