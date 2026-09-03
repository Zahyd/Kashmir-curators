import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { disruptionService } from '../services/disruptionService';

export const getDisruptionStatus = async (req: Request, res: Response) => {
  try {
    const status = await disruptionService.getCorridorStatusOverview();
    res.json(status);
  } catch (error: any) {
    console.error('getDisruptionStatus error:', error.message);
    res.status(500).json({ error: 'Failed to fetch disruption status' });
  }
};

export const getAffectedBookings = async (req: Request, res: Response) => {
  try {
    const statusFilter = (req.query.status as string) || undefined;
    const impacts = await prisma.disruptionImpact.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      include: {
        advisory: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Enrich with booking and customer details
    const enriched = await Promise.all(
      impacts.map(async (impact) => {
        let bookingData = null;
        let customerData = null;
        if (impact.bookingId) {
          bookingData = await prisma.booking.findUnique({
            where: { id: impact.bookingId },
            include: { user: { select: { id: true, name: true, email: true, phone: true } } }
          });
          if (bookingData?.user) {
            customerData = bookingData.user;
          }
        }
        return {
          ...impact,
          booking: bookingData,
          customer: customerData,
          alternatives: impact.suggestedAlternative ? JSON.parse(impact.suggestedAlternative) : []
        };
      })
    );

    res.json(enriched);
  } catch (error: any) {
    console.error('getAffectedBookings error:', error.message);
    res.status(500).json({ error: 'Failed to fetch affected bookings' });
  }
};

export const triggerDisruptionEvaluation = async (req: Request, res: Response) => {
  try {
    const { advisoryId } = req.body;
    if (!advisoryId) {
      return res.status(400).json({ error: 'advisoryId is required' });
    }

    const result = await disruptionService.evaluateAdvisoryDisruption(advisoryId);
    res.json(result);
  } catch (error: any) {
    console.error('triggerDisruptionEvaluation error:', error.message);
    res.status(500).json({ error: 'Failed to trigger disruption evaluation: ' + error.message });
  }
};

export const resolveDisruption = async (req: any, res: Response) => {
  try {
    const { impactId, resolutionType, selectedAlternative, actionNotes } = req.body;
    if (!impactId || !resolutionType) {
      return res.status(400).json({ error: 'impactId and resolutionType are required' });
    }

    const resolved = await disruptionService.resolveDisruptionImpact({
      impactId,
      resolutionType,
      selectedAlternative,
      actionNotes,
      performedByUserId: req.user?.id || 'admin'
    });

    res.json({ success: true, impact: resolved });
  } catch (error: any) {
    console.error('resolveDisruption error:', error.message);
    res.status(500).json({ error: 'Failed to resolve disruption: ' + error.message });
  }
};

export const getKashmirFlexPolicies = async (req: Request, res: Response) => {
  try {
    let policies = await prisma.bookingProtectionPolicy.findMany({
      where: { isActive: true }
    });

    if (policies.length === 0) {
      // Seed default policy if none exist
      const defaultPolicy = await prisma.bookingProtectionPolicy.create({
        data: {
          name: 'Kashmir Flex Booking Protection',
          code: 'KASHMIR_FLEX_STANDARD',
          description: '100% platform credit or free rerouting in case of verified destination, highway or weather closures.',
          feePercentage: 5.0,
          freeRescheduleDays: 45,
          cancellationRefundPct: 100.0,
          disruptionAutoCredit: true,
          isActive: true
        }
      });
      policies = [defaultPolicy];
    }

    res.json(policies);
  } catch (error: any) {
    console.error('getKashmirFlexPolicies error:', error.message);
    res.status(500).json({ error: 'Failed to fetch booking protection policies' });
  }
};
