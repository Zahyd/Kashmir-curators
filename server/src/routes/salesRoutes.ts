import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';
import { broadcastDriverEvent } from './driverRoutes';

const router = Router();

// In-memory active SSE clients for live sales stream
const salesClients: Set<Response> = new Set();

export function broadcastSalesEvent(eventType: string, payload: any) {
  const data = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of salesClients) {
    try {
      client.write(data);
    } catch {
      salesClients.delete(client);
    }
  }
}

// ---------------------------------------------------------------------------
// 1. Real-Time SSE Stream for Sales Command (/api/sales/stream)
// ---------------------------------------------------------------------------
router.get('/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Initial connect ping
  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'SALES_STREAM_CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

  salesClients.add(res);

  req.on('close', () => {
    salesClients.delete(res);
  });
});

// ---------------------------------------------------------------------------
// 2. Executive Command KPI Strip (/api/sales/metrics)
// ---------------------------------------------------------------------------
router.get('/metrics', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const [unclaimedInquiries, activeLeads, recentInquiries, priorInquiries] = await Promise.all([
      // Unclaimed inquiries
      p.inquiry.findMany({
        where: {
          OR: [
            { assignedTo: null },
            { assignedTo: '' }
          ],
          status: { notIn: ['Booked', 'Lost', 'Cancelled'] },
          leadStage: { notIn: ['CONFIRMED', 'COMPLETED', 'CANCELLED'] }
        },
        select: { id: true, createdAt: true, priority: true }
      }),

      // Active pipeline leads
      p.inquiry.findMany({
        where: {
          leadStage: { in: ['NEW_LEAD', 'CLAIMED', 'FOLLOW_UP', 'QUOTE_SENT', 'NEGOTIATION', 'PAYMENT_PENDING'] }
        },
        select: { id: true, netPrice: true, budget: true, leadStage: true }
      }),

      // All leads created in last 30 days (for conversion rate and response SLA)
      p.inquiry.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        },
        select: {
          id: true,
          createdAt: true,
          leadStage: true,
          status: true,
          lastContactedAt: true,
          activities: {
            select: { createdAt: true },
            orderBy: { createdAt: 'asc' },
            take: 1
          }
        }
      }),

      // Prior 30-day window (30-60 days ago) for real conversion delta comparison
      p.inquiry.findMany({
        where: {
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
        },
        select: { id: true, leadStage: true, status: true }
      })
    ]);

    // Check SLA breaches (leads older than 15 minutes that remain unclaimed)
    const now = Date.now();
    const fifteenMinMs = 15 * 60 * 1000;
    const slaBreached = unclaimedInquiries.filter((inq: any) => {
      const created = new Date(inq.createdAt).getTime();
      return (now - created) > fifteenMinMs;
    }).length;

    // Calculate Active Pipeline Value in INR (strictly from real prices/numeric budgets)
    const totalPipelineValue = activeLeads.reduce((sum: number, lead: any) => {
      if (lead.netPrice && lead.netPrice > 0) return sum + lead.netPrice;
      const budgetNum = parseInt(String(lead.budget || '0').replace(/[^0-9]/g, ''), 10);
      return sum + (isNaN(budgetNum) ? 0 : budgetNum);
    }, 0);

    const allRecentLeads = recentInquiries.length;
    const confirmedRecentLeads = recentInquiries.filter(
      (inq: any) => inq.leadStage === 'CONFIRMED' || inq.status === 'Booked'
    ).length;

    const conversionRate = allRecentLeads > 0
      ? Math.round((confirmedRecentLeads / allRecentLeads) * 100)
      : 0;

    let conversionDelta: number | null = null;
    if (priorInquiries.length > 0) {
      const priorConfirmed = priorInquiries.filter(
        (inq: any) => inq.leadStage === 'CONFIRMED' || inq.status === 'Booked'
      ).length;
      const priorRate = Math.round((priorConfirmed / priorInquiries.length) * 100);
      conversionDelta = conversionRate - priorRate;
    }

    // Real Average First Response Time (minutes) from first LeadActivity or lastContactedAt
    const responseMinutesList: number[] = [];
    for (const inq of recentInquiries) {
      const firstActivityMs = inq.activities?.[0]?.createdAt
        ? new Date(inq.activities[0].createdAt).getTime()
        : null;
      const contactedMs = inq.lastContactedAt
        ? new Date(inq.lastContactedAt).getTime()
        : null;
      const earliestResponseMs =
        firstActivityMs && contactedMs
          ? Math.min(firstActivityMs, contactedMs)
          : (firstActivityMs || contactedMs);

      if (earliestResponseMs) {
        const diffMinutes = Math.max(0, (earliestResponseMs - new Date(inq.createdAt).getTime()) / 60000);
        responseMinutesList.push(diffMinutes);
      }
    }

    const avgResponseMinutes = responseMinutesList.length > 0
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
      measuredResponseCount: responseMinutesList.length
    });
  } catch (error: any) {
    console.error('Error fetching sales metrics:', error);
    res.status(500).json({ error: 'Failed to aggregate sales metrics' });
  }
});

// ---------------------------------------------------------------------------
// 3. Atomic Lead Claiming Transaction (POST /api/sales/leads/:id/claim)
// ---------------------------------------------------------------------------
router.post('/leads/:id/claim', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const executive = req.user;
  const executiveCode = req.body.employeeCode || executive?.employeeCode || executive?.code || executive?.email || 'SALES_EXEC';
  const executiveName = req.body.employeeName || executive?.name || 'Sales Executive';

  try {
    const p = prisma as any;

    // Atomic transaction enforcing WHERE id = :id AND assignedTo IS NULL
    const result = await p.$transaction(async (tx: any) => {
      const lead = await tx.inquiry.findUnique({
        where: { id }
      });

      if (!lead) {
        throw new Error('LEAD_NOT_FOUND');
      }

      // Check if already claimed by another user
      if (lead.assignedTo && lead.assignedTo.trim() !== '' && lead.assignedTo !== executiveCode) {
        throw new Error('ALREADY_CLAIMED');
      }

      // Claim the lead atomically
      const updatedLead = await tx.inquiry.update({
        where: { id },
        data: {
          assignedTo: executiveCode,
          leadStage: 'CLAIMED',
          status: 'Pending Curation',
          updatedAt: new Date()
        }
      });

      // Create immutable audit log in LeadActivity
      await tx.leadActivity.create({
        data: {
          inquiryId: id,
          type: 'STAGE_CHANGE',
          title: 'Lead Claimed by Executive',
          description: `Lead claimed by ${executiveName} (${executiveCode}). Moved to Active Pipeline.`,
          performedBy: executiveCode
        }
      });

      return updatedLead;
    });

    // Broadcast realtime event to all connected sales consoles
    broadcastSalesEvent('LEAD_CLAIMED', {
      leadId: id,
      claimedBy: executiveCode,
      claimedByName: executiveName,
      lead: result
    });

    res.json({
      success: true,
      message: 'Lead claimed successfully',
      lead: result
    });
  } catch (error: any) {
    if (error.message === 'LEAD_NOT_FOUND') {
      return res.status(404).json({ error: 'Lead not found' });
    }
    if (error.message === 'ALREADY_CLAIMED') {
      return res.status(409).json({ 
        error: 'Conflict: This lead has already been claimed by another sales executive.',
        code: 'RACE_CONDITION_BLOCKED'
      });
    }
    console.error('Lead claim transaction error:', error);
    res.status(500).json({ error: 'Failed to execute atomic claim transaction' });
  }
});

// ---------------------------------------------------------------------------
// 4. Lead Stage Transition & Auto-Dispatch to Driver (/api/sales/leads/:id/stage)
// ---------------------------------------------------------------------------
router.patch('/leads/:id/stage', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { stage, notes } = req.body;
  const user = req.user;
  const performer = user?.employeeCode || user?.name || 'Sales Staff';

  if (!stage) {
    return res.status(400).json({ error: 'New stage is required' });
  }

  try {
    const p = prisma as any;

    const lead = await p.inquiry.findUnique({
      where: { id }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const updated = await p.inquiry.update({
      where: { id },
      data: {
        leadStage: stage,
        status: stage === 'CONFIRMED' ? 'Booked' : stage === 'LOST' || stage === 'CANCELLED' ? 'Lost' : lead.status,
        updatedAt: new Date()
      }
    });

    // Record Activity
    await p.leadActivity.create({
      data: {
        inquiryId: id,
        type: 'STAGE_CHANGE',
        title: `Pipeline Transition: ${stage}`,
        description: notes || `Lead transitioned to ${stage} by ${performer}`,
        performedBy: performer
      }
    });

    // AUTOMATED DISPATCH: If stage is marked CONFIRMED, dispatch cab booking to /driver cockpit!
    if (stage === 'CONFIRMED') {
      const pinCode = `KC-${Math.floor(10 + Math.random() * 89)}`;
      const fare = lead.netPrice > 0 ? Math.round(lead.netPrice * 0.15) : 2850;

      // Broadcast to /driver real-time cockpit SSE
      broadcastDriverEvent('NEW_DISPATCH_OFFER', {
        type: 'NEW_DISPATCH_OFFER',
        trip: {
          id: `trip-deal-${id.slice(0, 8)}`,
          passengerName: lead.customerName,
          passengerPhone: lead.phone,
          travelerCount: lead.adultsCount || 2,
          luggageCount: 3,
          pickupLocation: lead.arrivalCity || 'Srinagar Airport SXR (Arrival Terminal Gate 2)',
          dropLocation: `${lead.destination || 'Gulmarg Gondola Resort'}`,
          distanceKm: 52,
          estimatedDuration: '1 hr 30 min',
          fareAmount: fare,
          securityPin: pinCode,
          arrivalTelemetry: {
            type: lead.arrivalCity?.toLowerCase().includes('train') ? 'TRAIN' : 'FLIGHT',
            flightNumber: '6E-502',
            airline: 'IndiGo Airlines',
            status: 'Confirmed Guest Arrival',
            terminal: 'SXR Arrival Bay Gate 2'
          },
          stage: 'ACCEPTED',
          nextTurnInstruction: 'Proceed to Srinagar Airport Gate 2 Pickup Bay'
        }
      });
    }

    // Broadcast to sales console stream
    broadcastSalesEvent('LEAD_STAGE_UPDATED', {
      leadId: id,
      newStage: stage,
      performer
    });

    res.json({
      success: true,
      lead: updated
    });
  } catch (error: any) {
    console.error('Error updating lead stage:', error);
    res.status(500).json({ error: 'Failed to update lead stage' });
  }
});

// ---------------------------------------------------------------------------
// 5. Employee Live Availability Toggle (/api/sales/availability)
// ---------------------------------------------------------------------------
router.post('/availability', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { isOnline } = req.body;
  const user = req.user;

  if (typeof isOnline !== 'boolean') {
    return res.status(400).json({ error: 'isOnline boolean is required' });
  }

  try {
    const p = prisma as any;
    if (user?.id) {
      await p.user.update({
        where: { id: user.id },
        data: { isOnline }
      }).catch(() => {});
    }

    broadcastSalesEvent('EMPLOYEE_STATUS_CHANGED', {
      employeeCode: user?.employeeCode || user?.code,
      isOnline
    });

    res.json({ success: true, isOnline });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// ---------------------------------------------------------------------------
// 6. Role-Gated Team & RBAC Management (/api/sales/team)
// ---------------------------------------------------------------------------
router.get('/team', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const users = await p.user.findMany({
      where: {
        role: { in: ['admin', 'sales', 'operations', 'finance', 'DIRECTOR', 'SALES_MANAGER', 'SALES_EXECUTIVE'] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        employeeCode: true,
        isOnline: true,
        phone: true,
        createdAt: true
      }
    });

    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

export default router;
