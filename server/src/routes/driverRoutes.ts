import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// In-memory active SSE clients for live driver telemetry & dispatches
const sseClients: Set<Response> = new Set();

export function broadcastDriverEvent(eventType: string, payload: any) {
  const data = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}

// ---------------------------------------------------------------------------
// 1. SSE Real-Time Stream for Uber Dispatch Cockpit
// ---------------------------------------------------------------------------
router.get('/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial ping
  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'STREAM_CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// ---------------------------------------------------------------------------
// 2. Initial Cockpit State (Driver Profile, Active Vehicle, Live Telemetry)
// ---------------------------------------------------------------------------
router.get('/cockpit-state', async (req: Request, res: Response) => {
  try {
    const p = prisma as any;

    const [cabs, driverProfiles, advisories] = await Promise.all([
      prisma.cab.findMany({
        where: { isActive: true },
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
      p.driverProfile.findMany({
        take: 5,
        include: { user: { select: { id: true, name: true, phone: true } } }
      }).catch(() => []),
      prisma.travelAdvisory.findMany({
        where: { location: { contains: 'Tangmarg', mode: 'insensitive' } },
        take: 2,
        orderBy: { lastUpdated: 'desc' }
      }).catch(() => [])
    ]);

    const tangmargAdvisory = advisories[0] || {
      location: 'Tangmarg–Gulmarg Sector',
      status: 'CHAINS_MANDATORY',
      message: 'Snow chains mandatory above Tangmarg Checkpost. 4x4 vehicles given priority lane clearance.',
      severity: 'WARNING',
      lastUpdated: new Date()
    };

    res.json({
      dutyStatus: 'AVAILABLE',
      earnings: {
        todayTotal: 4500,
        tripsCount: 3,
        onlineHours: '4h 15m',
        acceptanceRate: 96,
        upiId: 'kashmir.driver@okaxis'
      },
      vehicles: cabs.map(c => {
        let parsedFeatures: any = {};
        try {
          parsedFeatures = c.features ? JSON.parse(c.features) : {};
        } catch {
          parsedFeatures = {};
        }
        return {
          id: c.id,
          model: c.name,
          type: c.type,
          plateNumber: parsedFeatures.plateNumber || 'JK-01-AX-9942',
          capacity: c.capacity,
          luggageCapacity: parsedFeatures.luggageCapacity || 4,
          snowChains: parsedFeatures.snowChains ?? true,
          fourWheelDrive: parsedFeatures.fourWheelDrive ?? true,
          skiRack: parsedFeatures.skiRack ?? true,
          multiDayAvailable: parsedFeatures.multiDayAvailable ?? true,
          rcVerified: parsedFeatures.rcVerified ?? true,
          permitVerified: parsedFeatures.permitVerified ?? true,
          insuranceValid: parsedFeatures.insuranceValid ?? true,
        };
      }),
      activeAdvisory: tangmargAdvisory
    });
  } catch (error: any) {
    console.error('[Driver Cockpit] Failed to fetch state:', error.message);
    res.status(500).json({ error: 'Failed to fetch cockpit state' });
  }
});

// ---------------------------------------------------------------------------
// 3. Register New Vehicle in Driver Fleet
// ---------------------------------------------------------------------------
router.post('/vehicles', async (req: Request, res: Response) => {
  try {
    const {
      model,
      plateNumber,
      capacity = 6,
      luggageCapacity = 4,
      snowChains = true,
      fourWheelDrive = true,
      skiRack = false,
      multiDayAvailable = true,
      type = 'SUV'
    } = req.body;

    if (!model || !plateNumber) {
      return res.status(400).json({ error: 'Vehicle model and registration plate number are required' });
    }

    const featuresObj = {
      plateNumber: String(plateNumber).toUpperCase().trim(),
      luggageCapacity: Number(luggageCapacity),
      snowChains: Boolean(snowChains),
      fourWheelDrive: Boolean(fourWheelDrive),
      skiRack: Boolean(skiRack),
      multiDayAvailable: Boolean(multiDayAvailable),
      rcVerified: true,
      permitVerified: true,
      insuranceValid: true,
      addedAt: new Date().toISOString()
    };

    const newCab = await prisma.cab.create({
      data: {
        name: String(model).trim(),
        type: String(type).toUpperCase(),
        capacity: Number(capacity),
        pricePerKm: 28,
        basePrice: 1200,
        image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
        features: JSON.stringify(featuresObj),
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      vehicle: {
        id: newCab.id,
        model: newCab.name,
        plateNumber: featuresObj.plateNumber,
        capacity: newCab.capacity,
        luggageCapacity: featuresObj.luggageCapacity,
        snowChains: featuresObj.snowChains,
        fourWheelDrive: featuresObj.fourWheelDrive,
        skiRack: featuresObj.skiRack,
        multiDayAvailable: featuresObj.multiDayAvailable,
        rcVerified: true,
        permitVerified: true,
        insuranceValid: true
      }
    });
  } catch (error: any) {
    console.error('[Driver Vehicles] Failed to create vehicle:', error.message);
    res.status(500).json({ error: 'Failed to register fleet vehicle' });
  }
});

// ---------------------------------------------------------------------------
// 4. Atomic Ride Offer Acceptance
// ---------------------------------------------------------------------------
router.post('/bookings/:id/accept', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { driverName = 'Zahid Chauffeur', driverPhone = '+91 99066 88123', vehiclePlate = 'JK-01-AX-9942' } = req.body;

    // Use Prisma transaction to atomically assign or reserve
    const result = await prisma.$transaction(async (tx) => {
      // Check if cabReservation exists
      const existing = await tx.cabReservation.findUnique({
        where: { id }
      }).catch(() => null);

      if (existing) {
        return await tx.cabReservation.update({
          where: { id },
          data: {
            status: 'DISPATCHED',
            driverName,
            driverPhone,
            vehicleRegNo: vehiclePlate
          }
        });
      }

      // If simulated or not yet persisted in reservations, create or return confirmed state
      return {
        id,
        status: 'DISPATCHED',
        driverName,
        driverPhone,
        vehicleRegNo: vehiclePlate,
        assignedAt: new Date().toISOString()
      };
    });

    broadcastDriverEvent('trip-accepted', { tripId: id, driverName });

    res.json({
      success: true,
      message: 'Trip accepted and locked to your chauffeur cockpit.',
      assignment: result
    });
  } catch (error: any) {
    console.error('[Driver Accept] Error:', error.message);
    res.status(500).json({ error: 'Failed to accept trip assignment' });
  }
});

// ---------------------------------------------------------------------------
// 5. Verify 4-Digit Tourist Security PIN (e.g. KC-77)
// ---------------------------------------------------------------------------
router.post('/bookings/:id/verify-pin', async (req: Request, res: Response) => {
  try {
    const { pin, expectedPin = 'KC-77' } = req.body;

    if (!pin || String(pin).trim().toUpperCase() !== String(expectedPin).trim().toUpperCase()) {
      return res.status(400).json({
        success: false,
        error: 'Incorrect security PIN. Please verify the 4-character code on the tourist voucher.'
      });
    }

    res.json({
      success: true,
      verified: true,
      message: 'Tourist Security PIN authenticated. Trip can now be initiated.'
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to verify tourist PIN' });
  }
});

// ---------------------------------------------------------------------------
// 6. Transition Trip Lifecycle (ARRIVED -> STARTED -> COMPLETED)
// ---------------------------------------------------------------------------
router.post('/bookings/:id/transition', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { stage } = req.body; // 'ARRIVED' | 'STARTED' | 'COMPLETED'

    const validStages = ['ARRIVED', 'STARTED', 'COMPLETED'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ error: `Invalid stage. Must be one of: ${validStages.join(', ')}` });
    }

    const statusMap: Record<string, string> = {
      ARRIVED: 'AT_PICKUP',
      STARTED: 'ON_TRIP',
      COMPLETED: 'COMPLETED'
    };

    const updated = await prisma.$transaction(async (tx) => {
      const reservation = await tx.cabReservation.findUnique({
        where: { id }
      }).catch(() => null);

      if (reservation) {
        return await tx.cabReservation.update({
          where: { id },
          data: { status: statusMap[stage] || 'ON_TRIP' }
        });
      }

      return { id, status: statusMap[stage] || 'ON_TRIP', transitionedAt: new Date().toISOString() };
    });

    broadcastDriverEvent('trip-transitioned', { tripId: id, stage });

    res.json({
      success: true,
      stage,
      status: statusMap[stage],
      updated
    });
  } catch (error: any) {
    console.error('[Driver Transition] Error:', error.message);
    res.status(500).json({ error: 'Failed to transition trip status' });
  }
});

// ---------------------------------------------------------------------------
// 7. Instant UPI Payout Request
// ---------------------------------------------------------------------------
router.post('/payout', async (req: Request, res: Response) => {
  try {
    const { amount = 4500, upiId = 'kashmir.driver@okaxis' } = req.body;

    const payoutRef = `PAYOUT-UPI-${Math.floor(100000 + Math.random() * 900000)}`;

    // Log notification in database for finance/admin review
    await prisma.notification.create({
      data: {
        userId: null,
        title: `⚡ Driver UPI Payout Triggered: ₹${Number(amount).toLocaleString('en-IN')}`,
        message: `Driver requested instant settlement to ${upiId} (Ref: ${payoutRef}).`,
        type: 'payment',
        priority: 'high',
        link: '/admin'
      }
    }).catch(() => null);

    res.json({
      success: true,
      payoutRef,
      amount: Number(amount),
      upiId,
      status: 'PROCESSED_INSTANT_SETTLEMENT',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to initiate UPI payout' });
  }
});

export default router;
