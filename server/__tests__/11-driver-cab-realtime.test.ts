import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {
  startTestServer,
  resetTestState,
  inMemoryPrisma,
  ioEvents,
  TestServerHandle,
} from './helpers/testHarness';
import { backfillLegacyCabFeatures } from '../src/lib/cabBackfill';

function makeToken(role = 'admin', id = 'admin-e2e-1', extra: Record<string, any> = {}) {
  return jwt.sign(
    { id, email: `${id}@kashmircurators.com`, role, name: `Test ${role}`, ...extra },
    process.env.JWT_SECRET!
  );
}

describe('Real-Time Driver Cockpit, KYC RBAC, Backfill & Tourist Auto-Popup Cab Matching', () => {
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
    adminToken = makeToken('admin', 'admin-ops-1');
  });

  it('idempotently backfills legacy JSON-object Cab.features into structured columns', async () => {
    const legacyCab = await inMemoryPrisma.cab.create({
      data: {
        name: 'Legacy Scorpio 4x4',
        type: 'SUV_SNOW_CHAINS',
        capacity: 6,
        pricePerKm: 24,
        basePrice: 3200,
        image: '/scorpio.jpg',
        features: JSON.stringify({
          plateNumber: 'jk-01-leg-4411',
          verificationStatus: 'APPROVED',
          unionName: 'Gulmarg Alpine Taxi Union',
          unionBadgeNumber: 'GATU-701',
          snowChains: true,
          fourWheelDrive: true,
          skiRack: true,
          luggageCapacity: 5,
          touristPermitNo: 'JK-PERMIT-77',
          commercialRcNumber: 'RC-JK01-4411',
          complianceDocs: { rcDocUrl: 'https://cdn.test/rc.pdf' },
          rateCard: { airportTransfer: 1650, gulmargTransfer: 3900 },
        }),
        isActive: true,
      },
    });

    const modernCab = await inMemoryPrisma.cab.create({
      data: {
        name: 'Modern Innova Crysta',
        type: 'SUV',
        capacity: 6,
        pricePerKm: 22,
        basePrice: 3000,
        image: '/innova.jpg',
        features: JSON.stringify(['Snow Chains Equipped', 'Heated Cabin']),
        isActive: true,
      },
    });

    const messyCab = await inMemoryPrisma.cab.create({
      data: {
        name: 'Messy Sedan',
        type: 'SEDAN',
        capacity: 4,
        pricePerKm: 16,
        basePrice: 1800,
        image: '/dzire.jpg',
        features: 'Heater, Music System',
        isActive: true,
      },
    });

    // First backfill pass migrates only legacy object row
    const pass1 = await backfillLegacyCabFeatures(inMemoryPrisma);
    assert.equal(pass1.scanned, 3);
    assert.equal(pass1.migrated, 1);
    assert.equal(pass1.skipped, 2);
    assert.equal(pass1.errors, 0);
    assert.deepEqual(pass1.migratedIds, [legacyCab.id]);

    const updatedLegacy = await inMemoryPrisma.cab.findUnique({ where: { id: legacyCab.id } });
    assert.equal(updatedLegacy.plateNumber, 'JK-01-LEG-4411');
    assert.equal(updatedLegacy.unionName, 'Gulmarg Alpine Taxi Union');
    assert.equal(updatedLegacy.unionBadgeNumber, 'GATU-701');
    assert.equal(updatedLegacy.fourWheelDrive, true);
    assert.equal(updatedLegacy.skiRack, true);
    assert.equal(updatedLegacy.luggageCapacity, 5);
    assert.equal(updatedLegacy.unionVerified, true);
    const normalizedFeatures = JSON.parse(updatedLegacy.features);
    assert.ok(Array.isArray(normalizedFeatures));
    assert.ok(normalizedFeatures.includes('4x4 Winter Drivetrain'));
    const parsedRateCard = JSON.parse(updatedLegacy.rateCard);
    assert.equal(parsedRateCard.gulmargTransfer, 3900);

    // Second pass must be a no-op (idempotent)
    const pass2 = await backfillLegacyCabFeatures(inMemoryPrisma);
    assert.equal(pass2.scanned, 3);
    assert.equal(pass2.migrated, 0);
    assert.equal(pass2.skipped, 3);

    // GET /api/cabs returns clean string[] features for all cabs
    const cabsRes = await srv.request('GET', '/api/cabs');
    assert.equal(cabsRes.status, 200);
    const fetchedLegacy = cabsRes.body.find((c: any) => c.id === legacyCab.id);
    const fetchedModern = cabsRes.body.find((c: any) => c.id === modernCab.id);
    const fetchedMessy = cabsRes.body.find((c: any) => c.id === messyCab.id);
    assert.ok(Array.isArray(fetchedLegacy.features));
    assert.deepEqual(fetchedModern.features, ['Snow Chains Equipped', 'Heated Cabin']);
    assert.deepEqual(fetchedMessy.features, ['Heater', 'Music System']);
  });

  it('enforces Driver Self-Onboarding KYC RBAC gate until Admin approves and preserves staff roles', async () => {
    const onboardRes = await srv.request('POST', '/api/driver/onboard', {
      body: {
        name: 'Bilal Ahmad Rather',
        email: 'bilal.driver@test.in',
        password: 'DriverPassword1!',
        phone: '+919906554433',
        licenseNumber: 'JK01-2023-554433',
        vehicleRegNo: 'jk01z-8899',
        vehicleModel: 'Toyota Fortuner 4x4',
        unionName: 'All Kashmir Taxi Federation',
        unionBadgeNumber: 'AKTF-554',
        snowChains: true,
        fourWheelDrive: true,
      },
    });
    assert.equal(onboardRes.status, 201);
    assert.ok(onboardRes.body.token);
    assert.equal(onboardRes.body.driverProfile.approvalStatus, 'PENDING_APPROVAL');
    assert.equal(onboardRes.body.vehicle.verificationStatus, 'PENDING_APPROVAL');
    assert.equal(onboardRes.body.vehicle.isActive, false);

    const driverToken = onboardRes.body.token;
    const driverProfileId = onboardRes.body.driverProfile.id;

    // Pending driver cannot toggle AVAILABLE before Admin approval
    const blockedDuty = await srv.request('POST', '/api/driver/duty', {
      token: driverToken,
      body: { status: 'AVAILABLE' },
    });
    assert.equal(blockedDuty.status, 403);
    assert.match(blockedDuty.body.error, /KYC_APPROVAL_REQUIRED/);

    // Public live matches must NOT include unapproved pending driver/vehicle
    const matchesBefore = await srv.request('GET', '/api/cabs/live-matches?pickup=Airport&drop=Gulmarg');
    assert.equal(matchesBefore.status, 200);
    assert.equal(matchesBefore.body.matches.length, 0);

    // Admin approves KYC + vehicle + issues KC-DRV portal key
    const reviewRes = await srv.request('POST', `/api/cabs/operations/drivers/${driverProfileId}/review`, {
      token: adminToken,
      body: {
        action: 'APPROVE',
        approvePendingVehicles: true,
        issuePortalKey: true,
      },
    });
    assert.equal(reviewRes.status, 200);
    assert.equal(reviewRes.body.driverProfile.approvalStatus, 'APPROVED');
    assert.equal(reviewRes.body.approvedVehiclesCount, 1);
    assert.ok(reviewRes.body.portalKey?.startsWith('KC-DRV-'));

    // Now driver can go ONLINE!
    const okDuty = await srv.request('POST', '/api/driver/duty', {
      token: driverToken,
      body: { status: 'AVAILABLE', sector: 'Srinagar SXR Airport' },
    });
    assert.equal(okDuty.status, 200);
    assert.equal(okDuty.body.driverProfile.status, 'AVAILABLE');

    // Public live matches now shows the approved online cab cleanly
    const matchesAfter = await srv.request('GET', '/api/cabs/live-matches?pickup=Airport&drop=Gulmarg');
    assert.equal(matchesAfter.status, 200);
    assert.equal(matchesAfter.body.matches.length, 1);
    assert.equal(matchesAfter.body.matches[0].isDriverOnline, true);

    // Staff account submitting /api/driver/apply MUST keep admin role intact
    const staffUser = await inMemoryPrisma.user.create({
      data: {
        id: 'u-staff-admin-check',
        name: 'Staff Operator',
        email: 'staff.ops@kashmir.test',
        password: await bcrypt.hash('StaffPass1!', 10),
        role: 'admin',
      },
    });
    const staffToken = makeToken('admin', staffUser.id);
    const applyRes = await srv.request('POST', '/api/driver/apply', {
      token: staffToken,
      body: { licenseNumber: 'JK01-ADMIN-1', vehicleRegNo: 'JK01A-0001' },
    });
    assert.equal(applyRes.status, 201);
    const dbStaff = await inMemoryPrisma.user.findUnique({ where: { id: staffUser.id } });
    assert.equal(dbStaff.role, 'admin', 'Staff role must never be overwritten to driver');
  });

  it('auto-provisions User & DriverProfile when logging in with a KC-DRV-* Portal Access Key', async () => {
    const genRes = await srv.request('POST', '/api/portal-keys', {
      token: adminToken,
      body: {
        portalType: 'DRIVER',
        assignedName: 'Shabir Alpine Pilot',
        assignedContact: '+919906112233',
        designation: 'Winter 4x4 Pilot',
      },
    });
    assert.equal(genRes.status, 201);
    const accessKey = genRes.body.keys[0].accessKey;
    assert.ok(accessKey.startsWith('KC-DRV-'));

    const verifyRes = await srv.request('POST', '/api/portal-keys/verify', {
      body: { accessKey, portalType: 'DRIVER' },
    });
    assert.equal(verifyRes.status, 200);
    assert.ok(verifyRes.body.token);
    assert.ok(verifyRes.body.session.driverProfileId);
    assert.equal(verifyRes.body.session.approvalStatus, 'APPROVED');

    // Can authenticate cockpit state directly via x-portal-key header
    const cockpitRes = await srv.request('GET', '/api/driver/cockpit-state', {
      headers: { 'x-portal-key': accessKey },
    });
    assert.equal(cockpitRes.status, 200);
    assert.equal(cockpitRes.body.driverProfile.name, 'Shabir Alpine Pilot');
  });

  it('enforces vehicle ownership CRUD isolation between drivers', async () => {
    const driverA = await srv.request('POST', '/api/driver/onboard', {
      body: {
        name: 'Driver Alpha',
        email: 'alpha@test.in',
        password: 'Password1!',
        licenseNumber: 'JK01-AAA-111',
      },
    });
    const driverB = await srv.request('POST', '/api/driver/onboard', {
      body: {
        name: 'Driver Beta',
        email: 'beta@test.in',
        password: 'Password1!',
        licenseNumber: 'JK01-BBB-222',
      },
    });

    const createVeh = await srv.request('POST', '/api/driver/vehicles', {
      token: driverA.body.token,
      body: {
        model: 'Mahindra Thar 4x4',
        plateNumber: 'JK01T-1234',
        unionBadgeNumber: 'AKTF-901',
        fourWheelDrive: true,
      },
    });
    assert.equal(createVeh.status, 201);
    const vehicleId = createVeh.body.vehicle.id;

    // Driver B cannot edit or delete Driver A's vehicle
    const hijackEdit = await srv.request('PATCH', `/api/driver/vehicles/${vehicleId}`, {
      token: driverB.body.token,
      body: { capacity: 8 },
    });
    assert.equal(hijackEdit.status, 403);

    const hijackDelete = await srv.request('DELETE', `/api/driver/vehicles/${vehicleId}`, {
      token: driverB.body.token,
    });
    assert.equal(hijackDelete.status, 403);

    // Driver A can edit and delete own vehicle
    const ownEdit = await srv.request('PATCH', `/api/driver/vehicles/${vehicleId}`, {
      token: driverA.body.token,
      body: { capacity: 7, luggageCapacity: 6 },
    });
    assert.equal(ownEdit.status, 200);
    assert.equal(ownEdit.body.vehicle.capacity, 7);

    const ownDel = await srv.request('DELETE', `/api/driver/vehicles/${vehicleId}`, {
      token: driverA.body.token,
    });
    assert.equal(ownDel.status, 204);
  });

  it('runs real-time tourist booking, driver counter-offer, atomic confirmation, completion, payout & SOS', async () => {
    // Seed tourist & approved driver with approved 4x4 cab
    const tourist = await inMemoryPrisma.user.create({
      data: {
        id: 'u-tourist-rt-1',
        name: 'Sana Mir Tourist',
        email: 'sana.tourist@example.com',
        password: await bcrypt.hash('Tourist123!', 10),
        role: 'user',
        phone: '+919811223344',
      },
    });
    const touristToken = makeToken('user', tourist.id);

    const drvUser = await inMemoryPrisma.user.create({
      data: {
        id: 'u-driver-rt-1',
        name: 'Showkat Ali Lone',
        email: 'showkat@driver.test',
        password: await bcrypt.hash('Driver123!', 10),
        role: 'driver',
        phone: '+919906887766',
        employeeCode: 'DRV-RT-01',
      },
    });
    const drvToken = makeToken('driver', drvUser.id, { employeeCode: drvUser.employeeCode });

    const dp = await inMemoryPrisma.driverProfile.create({
      data: {
        id: 'dp-rt-1',
        userId: drvUser.id,
        licenseNumber: 'JK01-RT-9900',
        vehicleRegNo: 'JK01C-7788',
        status: 'AVAILABLE',
        approvalStatus: 'APPROVED',
        availableBalance: 1000,
        earnings: 1000,
        upiId: 'showkat@okaxis',
        currentSector: 'Srinagar SXR Airport',
      },
    });

    const cab = await inMemoryPrisma.cab.create({
      data: {
        id: 'cab-rt-1',
        name: 'Toyota Innova Hycross 4x4',
        type: 'SUV_SNOW_CHAINS',
        capacity: 6,
        luggageCapacity: 5,
        pricePerKm: 24,
        basePrice: 2500,
        image: '/hycross.jpg',
        features: JSON.stringify(['Snow Chains Equipped', '4x4 Winter Drivetrain']),
        isActive: true,
        verificationStatus: 'APPROVED',
        plateNumber: 'JK01C-7788',
        snowChains: true,
        fourWheelDrive: true,
        unionVerified: true,
        driverProfileId: dp.id,
        rateCard: JSON.stringify({
          airportTransfer: 1800,
          gulmargTransfer: 4200,
          snowChainSurcharge: 600,
          snowChainActive: true,
        }),
      },
    });

    // 1. Live matches mask sensitive PII while surfacing rate-card pricing & online state
    const liveRes = await srv.request(
      'GET',
      '/api/cabs/live-matches?pickup=Srinagar+Airport+(SXR)&drop=Gulmarg+Gondola&pax=3'
    );
    assert.equal(liveRes.status, 200);
    assert.equal(liveRes.body.onlineDriversCount, 1);
    assert.equal(liveRes.body.matches[0].cabId, cab.id);
    assert.equal(liveRes.body.matches[0].estimatedFare, 4800); // 4200 + 600 snow chains
    assert.equal(liveRes.body.matches[0].driverDisplayName, 'Showkat L.');
    assert.equal(liveRes.body.matches[0].driverPhone, undefined);

    // 2. Tourist submits real ride request -> pushes dispatch offer to online driver
    const reqRes = await srv.request('POST', '/api/cabs/ride-requests', {
      token: touristToken,
      body: {
        pickupLocation: 'Srinagar Airport (SXR)',
        dropLocation: 'Gulmarg Gondola Base',
        tripType: 'outstation',
        preferredCabId: cab.id,
        offeredFare: 4400,
        travelersCount: 3,
      },
    });
    assert.equal(reqRes.status, 201);
    const reservationId = reqRes.body.rideRequest.id;
    assert.equal(reqRes.body.offers.length, 1);
    const offerId = reqRes.body.offers[0].id;
    assert.equal(reqRes.body.offers[0].driverPhone, null); // Hidden pre-confirm
    assert.ok(ioEvents.some((e) => e.room === `driver-${drvUser.id}` && e.event === 'driver-trip-dispatched'));

    // 3. Driver sends counter-offer ₹4,650
    const drvCounter = await srv.request('POST', `/api/driver/bookings/${reservationId}/counter-offer`, {
      token: drvToken,
      body: { proposedFare: 4650, reason: 'Tangmarg heavy snow chain fitting' },
    });
    assert.equal(drvCounter.status, 200);
    assert.equal(drvCounter.body.offer.driverFare, 4650);

    // 4. Tourist counters back ₹4,550 -> cannot confirm before driver agrees
    const touristCounter = await srv.request(
      'POST',
      `/api/cabs/ride-requests/${reservationId}/offers/${offerId}/counter`,
      { token: touristToken, body: { counterFare: 4550 } }
    );
    assert.equal(touristCounter.status, 200);

    const prematureConfirm = await srv.request(
      'POST',
      `/api/cabs/ride-requests/${reservationId}/offers/${offerId}/confirm`,
      { token: touristToken }
    );
    assert.equal(prematureConfirm.status, 400);

    // 5. Driver accepts tourist counter ₹4,550 -> tourist confirms atomically
    const drvAccept = await srv.request('POST', `/api/driver/bookings/${reservationId}/accept`, {
      token: drvToken,
    });
    assert.equal(drvAccept.status, 200);
    assert.equal(drvAccept.body.offer.status, 'DRIVER_ACCEPTED');
    assert.equal(drvAccept.body.offer.driverFare, 4550);

    const confirmRes = await srv.request(
      'POST',
      `/api/cabs/ride-requests/${reservationId}/offers/${offerId}/confirm`,
      { token: touristToken }
    );
    assert.equal(confirmRes.status, 200);
    assert.equal(confirmRes.body.booking.totalAmount, 4550);
    assert.equal(confirmRes.body.reservation.status, 'DISPATCHED');
    assert.ok(confirmRes.body.reservation.securityPin);
    assert.equal(confirmRes.body.confirmedOffer.driverPhone, '+919906887766');

    const dpDuringTrip = await inMemoryPrisma.driverProfile.findUnique({ where: { id: dp.id } });
    assert.equal(dpDuringTrip.status, 'ON_TRIP');

    // 6. PIN check + trip completion credits PostgreSQL DriverProfile balance & stats
    const pin = confirmRes.body.reservation.securityPin;
    const pinOk = await srv.request('POST', `/api/driver/bookings/${reservationId}/verify-pin`, {
      token: drvToken,
      body: { pin },
    });
    assert.equal(pinOk.status, 200);

    for (const stage of ['ARRIVED', 'STARTED', 'COMPLETED']) {
      const tr = await srv.request('POST', `/api/driver/bookings/${reservationId}/transition`, {
        token: drvToken,
        body: { stage },
      });
      assert.equal(tr.status, 200);
    }

    const dpAfterTrip = await inMemoryPrisma.driverProfile.findUnique({ where: { id: dp.id } });
    assert.equal(dpAfterTrip.status, 'AVAILABLE');
    assert.equal(dpAfterTrip.tripsCompleted, 1);
    assert.equal(dpAfterTrip.availableBalance, 5550); // 1000 + 4550
    assert.equal(dpAfterTrip.earnings, 5550);

    // 7. Over-balance payout rejected; valid payout creates DriverPayout & decrements wallet
    const badPayout = await srv.request('POST', '/api/driver/payout', {
      token: drvToken,
      body: { amount: 9000 },
    });
    assert.equal(badPayout.status, 400);

    const okPayout = await srv.request('POST', '/api/driver/payout', {
      token: drvToken,
      body: { amount: 3000, upiId: 'showkat@okaxis' },
    });
    assert.equal(okPayout.status, 200);
    assert.equal(okPayout.body.availableBalance, 2550);

    const payoutsRes = await srv.request('GET', '/api/driver/payouts', { token: drvToken });
    assert.equal(payoutsRes.status, 200);
    assert.equal(payoutsRes.body.payouts.length, 1);

    // 8. Driver SOS alert creation & Admin resolution
    const sosRes = await srv.request('POST', '/api/driver/sos', {
      token: drvToken,
      body: {
        incidentType: 'Snowdrift Stranded',
        location: 'Tangmarg KM 38',
        severity: 'CRITICAL',
      },
    });
    assert.equal(sosRes.status, 201);
    const alertId = sosRes.body.alert.id;

    const resolveRes = await srv.request('PATCH', `/api/driver/sos/${alertId}/resolve`, {
      token: adminToken,
      body: { status: 'RESOLVED', notes: 'Rescue 4x4 dispatched' },
    });
    assert.equal(resolveRes.status, 200);
    assert.equal(resolveRes.body.alert.status, 'RESOLVED');
  });
});
