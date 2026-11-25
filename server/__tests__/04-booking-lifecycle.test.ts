import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { startTestServer, resetTestState, inMemoryPrisma, ioEvents, TestServerHandle } from './helpers/testHarness';

function makeToken(role: string, id: string, extra: Record<string, any> = {}) {
  return jwt.sign({ id, email: `${id}@kashmircurators.com`, role, name: id, ...extra }, process.env.JWT_SECRET!);
}

describe('Booking Lifecycle, Package-to-Cab Automation & Pricing Engine', () => {
  let srv: TestServerHandle;

  before(async () => {
    srv = await startTestServer();
  });

  after(async () => {
    await srv.close();
  });

  beforeEach(() => {
    resetTestState();
  });

  it('creates user bookings, retrieves /api/bookings/my, updates status, and deletes booking', async () => {
    const user = await inMemoryPrisma.user.create({
      data: { email: 'traveler@kashmir.com', name: 'Aisha Bhat', role: 'user' },
    });
    const userToken = makeToken('user', user.id);

    const createRes = await srv.request('POST', '/api/bookings', {
      token: userToken,
      body: {
        type: 'hotel',
        itemName: 'Lalita Grand Palace Srinagar',
        bookingDate: '2026-12-18T10:00:00.000Z',
        totalAmount: 42000,
        details: { travelers: '2', checkIn: '2026-12-18', checkOut: '2026-12-21' },
      },
    });
    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.userId, user.id);
    assert.equal(createRes.body.status, 'confirmed');
    assert.ok(ioEvents.some((e) => e.room === `user-${user.id}` && e.event === 'booking-updated'));
    assert.ok(ioEvents.some((e) => e.room === 'GLOBAL' && e.event === 'new-live-curation'));

    // /my returns parsed JSON details for authenticated user only
    const otherUser = await inMemoryPrisma.user.create({
      data: { email: 'other@kashmir.com', name: 'Other', role: 'user' },
    });
    await inMemoryPrisma.booking.create({
      data: {
        userId: otherUser.id,
        type: 'cab',
        itemName: 'Private Sedan',
        bookingDate: new Date(),
        totalAmount: 5000,
        details: JSON.stringify({ travelers: '1' }),
      },
    });

    const myRes = await srv.request('GET', '/api/bookings/my', { token: userToken });
    assert.equal(myRes.status, 200);
    assert.equal(myRes.body.length, 1);
    assert.equal(myRes.body[0].details.checkIn, '2026-12-18');

    // Update booking status & amount
    const patchRes = await srv.request('PATCH', `/api/bookings/${createRes.body.id}`, {
      token: userToken,
      body: { status: 'completed', totalAmount: 45000 },
    });
    assert.equal(patchRes.status, 200);
    assert.equal(patchRes.body.status, 'completed');
    assert.equal(patchRes.body.totalAmount, 45000);

    // Recent bookings feed returns confirmed bookings
    const recentRes = await srv.request('GET', '/api/bookings/recent');
    assert.equal(recentRes.status, 200);
    assert.ok(Array.isArray(recentRes.body));

    // Delete booking
    const delRes = await srv.request('DELETE', `/api/bookings/${createRes.body.id}`, {
      token: userToken,
    });
    assert.equal(delRes.status, 200);
    assert.equal(await inMemoryPrisma.booking.findUnique({ where: { id: createRes.body.id } }), null);
  });

  it('auto-creates client account for admin manual booking and auto-generates linked cab booking for packages without duplicating', async () => {
    const adminToken = makeToken('admin', 'admin-booking-1');

    // Seed an active SUV cab so package-to-cab automation picks it up
    const suv = await inMemoryPrisma.cab.create({
      data: {
        name: 'Innova Crysta VIP',
        type: 'SUV',
        capacity: 7,
        pricePerKm: 22,
        basePrice: 3200,
        image: '/innova.png',
        features: '[]',
        isActive: true,
      },
    });

    const pkgRes = await srv.request('POST', '/api/bookings', {
      token: adminToken,
      body: {
        type: 'package',
        itemName: '6D/5N Winter Wonderland Gulmarg & Pahalgam',
        bookingDate: '2026-12-22T09:00:00.000Z',
        totalAmount: 95000,
        details: { travelers: '4', nights: 5 },
        clientEmail: 'vip-client@example.com',
        clientName: 'Vikramaditya Singh',
        clientPhone: '+919811199999',
      },
    });
    assert.equal(pkgRes.status, 201);

    // Client user should have been auto-provisioned
    const clientUser = await inMemoryPrisma.user.findUnique({ where: { email: 'vip-client@example.com' } });
    assert.ok(clientUser);
    assert.equal(pkgRes.body.userId, clientUser.id);

    // Linked auto-generated cab booking must exist
    const allBookings = await inMemoryPrisma.booking.findMany();
    assert.equal(allBookings.length, 2);
    const autoCab = allBookings.find((b: any) => b.type === 'cab');
    assert.ok(autoCab, 'Package booking must auto-generate a cab transfer booking');
    const cabDetails = JSON.parse(autoCab.details);
    assert.equal(cabDetails.parentPackageBookingId, pkgRes.body.id);
    assert.equal(cabDetails.tripType, 'package-automation');
    assert.equal(cabDetails.cabAllocation.cabId, suv.id);
    assert.equal(cabDetails.cabAllocation.cabName, 'Innova Crysta VIP');

    // Updating package booking status to 'confirmed' again must NOT create a duplicate cab booking
    await srv.request('PATCH', `/api/bookings/${pkgRes.body.id}`, {
      token: adminToken,
      body: { status: 'confirmed' },
    });
    const cabCount = await inMemoryPrisma.booking.count({ where: { type: 'cab' } });
    assert.equal(cabCount, 1, 'Auto-generated cab booking must remain idempotent across status updates');
  });

  it('computes accurate itemized travel quotes across hotel tiers and cab options via PricingService', async () => {
    // 6 days => 5 nights; 3 travelers => ceil(3/2) = 2 rooms
    // ELITE hotel = 18000 * 5 * 2 = 180000
    // SUV_PREMIUM cab = 7500 * 6 = 45000
    // activities = 1500 * 3 = 4500
    // baseCost = 229500; gst (5%) = 11475; total = 240975
    const eliteRes = await srv.request('POST', '/api/inquiries/quote', {
      body: {
        destination: 'Gulmarg',
        durationDays: 6,
        travelers: 3,
        hotelTier: 'ELITE',
        hasCab: true,
        cabType: 'SUV_PREMIUM',
      },
    });
    assert.equal(eliteRes.status, 200);
    assert.equal(eliteRes.body.nights, 5);
    assert.equal(eliteRes.body.roomsCount, 2);
    assert.equal(eliteRes.body.totalHotelCost, 180000);
    assert.equal(eliteRes.body.totalCabCost, 45000);
    assert.equal(eliteRes.body.activitiesCost, 4500);
    assert.equal(eliteRes.body.baseCost, 229500);
    assert.equal(eliteRes.body.gst, 11475);
    assert.equal(eliteRes.body.total, 240975);
    assert.equal(eliteRes.body.currency, 'INR');
    assert.equal(eliteRes.body.dynamicItinerary.length, 6);

    // Without cab: STANDARD = 3500 * 1 night (2 days) * 1 room (2 pax) = 3500 + 0 cab + 3000 activities = 6500; gst = 325; total = 6825
    const noCabRes = await srv.request('POST', '/api/inquiries/quote', {
      body: {
        destination: 'Pahalgam',
        durationDays: 2,
        travelers: 2,
        hotelTier: 'STANDARD',
        hasCab: false,
      },
    });
    assert.equal(noCabRes.status, 200);
    assert.equal(noCabRes.body.totalCabCost, 0);
    assert.equal(noCabRes.body.baseCost, 6500);
    assert.equal(noCabRes.body.gst, 325);
    assert.equal(noCabRes.body.total, 6825);
  });
});
