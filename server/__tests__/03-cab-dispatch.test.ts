import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { startTestServer, resetTestState, inMemoryPrisma, ioEvents, TestServerHandle } from './helpers/testHarness';

function makeToken(role = 'admin', id = 'fleet-admin-1') {
  return jwt.sign({ id, email: `${id}@kashmircurators.com`, role, name: 'Fleet Admin' }, process.env.JWT_SECRET!);
}

describe('Cab Registry, Union Verification & Chauffeur Dispatch Lifecycle', () => {
  let srv: TestServerHandle;
  let adminToken: string;

  before(async () => {
    srv = await startTestServer();
  });

  after(async () => {
    await srv.close();
  });

  beforeEach(() => {
    resetTestState();
    adminToken = makeToken('admin');
  });

  it('manages cab fleet CRUD, driver onboarding, date blocking, and operations data', async () => {
    // Create cab
    const cabRes = await srv.request('POST', '/api/cabs', {
      token: adminToken,
      body: {
        name: 'Toyota Innova Crysta 4x4',
        type: 'SUV',
        capacity: 6,
        pricePerKm: 24,
        basePrice: 3500,
        features: ['Snow Chains', 'Heated Cabin'],
      },
    });
    assert.equal(cabRes.status, 201);
    const cabId = cabRes.body.id;

    // Fetch active cabs
    const listRes = await srv.request('GET', '/api/cabs');
    assert.equal(listRes.status, 200);
    assert.equal(listRes.body.length, 1);
    assert.deepEqual(listRes.body[0].features, ['Snow Chains', 'Heated Cabin']);

    // Onboard driver
    const drvRes = await srv.request('POST', '/api/cabs/operations/drivers', {
      token: adminToken,
      body: {
        name: 'Bilal Sheikh',
        email: 'bilal@kashmircabs.com',
        phone: '+919906612345',
        licenseNumber: 'JK01-2020-8844',
        vehicleRegNo: 'JK-01-AX-4411',
      },
    });
    assert.equal(drvRes.status, 201);
    assert.equal(drvRes.body.role, 'driver');
    assert.equal(drvRes.body.driverProfile.vehicleRegNo, 'JK-01-AX-4411');

    // Duplicate driver email rejected
    const dupDrv = await srv.request('POST', '/api/cabs/operations/drivers', {
      token: adminToken,
      body: {
        name: 'Duplicate',
        email: 'bilal@kashmircabs.com',
        licenseNumber: 'JK01-9999',
        vehicleRegNo: 'JK-01-XX-0001',
      },
    });
    assert.equal(dupDrv.status, 400);

    // Block cab dates and unblock
    const blockRes = await srv.request('POST', '/api/cabs/operations/block', {
      token: adminToken,
      body: {
        cabId,
        startDate: '2026-12-01',
        endDate: '2026-12-03',
        reason: 'Winter snow chain fitting',
        status: 'Maintenance',
      },
    });
    assert.equal(blockRes.status, 201);
    assert.equal(blockRes.body.manualBlockings.length, 1);
    const blockId = blockRes.body.manualBlockings[0].id;

    const unblockRes = await srv.request('DELETE', `/api/cabs/operations/block/${blockId}`, {
      token: adminToken,
    });
    assert.equal(unblockRes.status, 200);
    assert.equal(unblockRes.body.manualBlockings.length, 0);

    // Operations command center aggregates data
    const opsData = await srv.request('GET', '/api/cabs/operations/data', { token: adminToken });
    assert.equal(opsData.status, 200);
    assert.equal(opsData.body.drivers.length, 1);
  });

  it('enforces Tourist Union vehicle registration & admin authentication pipeline', async () => {
    const driverToken = makeToken('driver', 'drv-test-1');

    // Unauthenticated registration rejected (401)
    const unauthReg = await srv.request('POST', '/api/driver/vehicles', {
      body: { model: 'Mahindra Scorpio N', plateNumber: 'JK-01-AT-1122', unionBadgeNumber: 'GTTU-1' },
    });
    assert.equal(unauthReg.status, 401);

    // Missing union badge rejected
    const badReg = await srv.request('POST', '/api/driver/vehicles', {
      token: driverToken,
      body: { model: 'Mahindra Scorpio N', plateNumber: 'JK-01-AT-1122' },
    });
    assert.equal(badReg.status, 400);

    // Valid registration creates inactive pending cab
    const regRes = await srv.request('POST', '/api/driver/vehicles', {
      token: driverToken,
      body: {
        model: 'Mahindra Scorpio N 4x4',
        plateNumber: 'jk-01-at-7788',
        unionName: 'Gulmarg Tourist Taxi Union',
        unionBadgeNumber: 'GTTU-445',
        snowChains: true,
        fourWheelDrive: true,
      },
    });
    assert.equal(regRes.status, 201);
    assert.equal(regRes.body.vehicle.verificationStatus, 'PENDING_APPROVAL');
    assert.equal(regRes.body.vehicle.plateNumber, 'JK-01-AT-7788');

    const dbCab = await inMemoryPrisma.cab.findUnique({ where: { id: regRes.body.vehicle.id } });
    assert.equal(dbCab.isActive, false, 'Unverified vehicle must start inactive');

    // Non-admin (driver) cannot inspect pending admin approval queue -> 403
    const forbidPending = await srv.request('GET', '/api/driver/vehicles/pending-verification', {
      token: driverToken,
    });
    assert.equal(forbidPending.status, 403);

    // Appears in pending verification queue for admin
    const pendingRes = await srv.request('GET', '/api/driver/vehicles/pending-verification', {
      token: adminToken,
    });
    assert.equal(pendingRes.status, 200);
    assert.equal(pendingRes.body.pending.length, 1);

    // Authentication requires valid JWT
    const unauthApprove = await srv.request('POST', `/api/driver/vehicles/${dbCab.id}/authenticate`, {
      body: { action: 'APPROVE' },
    });
    assert.equal(unauthApprove.status, 401);

    // Non-admin (driver) cannot approve vehicle -> 403
    const forbidApprove = await srv.request('POST', `/api/driver/vehicles/${dbCab.id}/authenticate`, {
      token: driverToken,
      body: { action: 'APPROVE' },
    });
    assert.equal(forbidApprove.status, 403);

    // Admin approves vehicle -> activates cab and broadcasts VEHICLE_VERIFIED
    const approveRes = await srv.request('POST', `/api/driver/vehicles/${dbCab.id}/authenticate`, {
      token: adminToken,
      body: { action: 'APPROVE' },
    });
    assert.equal(approveRes.status, 200);
    assert.equal(approveRes.body.vehicle.isActive, true);
    assert.equal(approveRes.body.vehicle.verificationStatus, 'APPROVED');
    assert.ok(ioEvents.some((e) => e.event === 'VEHICLE_VERIFIED' && e.payload.status === 'APPROVED'));
  });

  it('runs end-to-end cab dispatch, PIN check, counter-offer, and trip stage transitions', async () => {
    const driverToken = makeToken('driver', 'drv-001');
    const touristToken = makeToken('user', 'tourist-1');
    const cab = await inMemoryPrisma.cab.create({
      data: {
        name: 'Force Urbania',
        type: 'COACH',
        capacity: 12,
        pricePerKm: 35,
        basePrice: 5000,
        image: '/urbania.png',
        features: '{}',
        isActive: true,
      },
    });
    const reservation = await inMemoryPrisma.cabReservation.create({
      data: {
        cabId: cab.id,
        pickupLocation: 'Srinagar Airport (SXR)',
        dropLocation: 'Gulmarg Gondola Base',
        startDate: new Date('2026-12-15T09:00:00Z'),
        endDate: new Date('2026-12-15T18:00:00Z'),
        status: 'ALLOCATED',
        contractRate: 2800,
        totalCost: 3200,
        voucherReference: 'VCH-4921',
      },
    });

    // Tourist role cannot access driver cockpit or dispatch trips -> 403
    const touristCockpit = await srv.request('GET', '/api/driver/cockpit-state', { token: touristToken });
    assert.equal(touristCockpit.status, 403);

    // 1. Broadcast trip dispatch to driver & tenant rooms
    const dispatchRes = await srv.request('POST', '/api/driver/dispatch-trip', {
      token: adminToken,
      body: {
        tripId: reservation.id,
        pickup: 'Srinagar Airport (SXR)',
        drop: 'Gulmarg Gondola Base',
        fare: 2800,
        driverId: 'drv-001',
        tenantId: 'fleet-org-1',
      },
    });
    assert.equal(dispatchRes.status, 200);
    assert.ok(ioEvents.some((e) => e.room === 'driver-drv-001' && e.event === 'driver-trip-dispatched'));
    assert.ok(ioEvents.some((e) => e.room === 'tenant-fleet-org-1' && e.event === 'driver-trip-dispatched'));

    // 2. Active trip reflects real DB reservation with securityPin from voucherReference
    const activeRes = await srv.request('GET', '/api/driver/active-trip', { token: driverToken });
    assert.equal(activeRes.status, 200);
    assert.equal(activeRes.body.activeTrip.id, reservation.id);
    assert.equal(activeRes.body.activeTrip.securityPin, '4921');
    assert.equal(activeRes.body.activeTrip.arrivalTelemetry.type, 'FLIGHT');

    // 3. Driver counter-offer updates contractRate and totalCost (+15% platform markup)
    const counterRes = await srv.request('POST', `/api/driver/bookings/${reservation.id}/counter-offer`, {
      token: driverToken,
      body: { proposedFare: 3000, reason: 'Tangmarg snow chains mandatory' },
    });
    assert.equal(counterRes.status, 200);
    const afterCounter = await inMemoryPrisma.cabReservation.findUnique({ where: { id: reservation.id } });
    assert.equal(afterCounter.contractRate, 3000);
    assert.equal(afterCounter.totalCost, 3450);

    // 4. Atomic ride acceptance locks driver & transitions to DISPATCHED
    const acceptRes = await srv.request('POST', `/api/driver/bookings/${reservation.id}/accept`, {
      token: driverToken,
      body: { driverName: 'Imran Wani', driverPhone: '+919906600111', vehiclePlate: 'JK-01-DX-9001' },
    });
    assert.equal(acceptRes.status, 200);
    assert.equal(acceptRes.body.assignment.status, 'DISPATCHED');

    // 5. Security PIN validation rejects mismatch and accepts valid PIN
    const badPin = await srv.request('POST', `/api/driver/bookings/${reservation.id}/verify-pin`, {
      token: driverToken,
      body: { pin: '0000', expectedPin: '4921' },
    });
    assert.equal(badPin.status, 400);

    const okPin = await srv.request('POST', `/api/driver/bookings/${reservation.id}/verify-pin`, {
      token: driverToken,
      body: { pin: '4921', expectedPin: '4921' },
    });
    assert.equal(okPin.status, 200);
    assert.equal(okPin.body.verified, true);

    // 6. Trip lifecycle transitions (reject invalid, then ARRIVED -> STARTED -> COMPLETED)
    const invalidStage = await srv.request('POST', `/api/driver/bookings/${reservation.id}/transition`, {
      token: driverToken,
      body: { stage: 'TELEPORTED' },
    });
    assert.equal(invalidStage.status, 400);

    for (const [stage, expectedStatus] of [
      ['ARRIVED', 'AT_PICKUP'],
      ['STARTED', 'ON_TRIP'],
      ['COMPLETED', 'COMPLETED'],
    ] as const) {
      const trRes = await srv.request('POST', `/api/driver/bookings/${reservation.id}/transition`, {
        token: driverToken,
        body: { stage },
      });
      assert.equal(trRes.status, 200);
      assert.equal(trRes.body.status, expectedStatus);
      const dbRes = await inMemoryPrisma.cabReservation.findUnique({ where: { id: reservation.id } });
      assert.equal(dbRes.status, expectedStatus);
    }
  });
});
