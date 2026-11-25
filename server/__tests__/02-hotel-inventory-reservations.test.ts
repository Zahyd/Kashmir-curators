import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { startTestServer, resetTestState, inMemoryPrisma, ioEvents, TestServerHandle } from './helpers/testHarness';

function makeToken(role = 'operations', id = 'ops-user-1') {
  return jwt.sign({ id, email: `${id}@kashmircurators.com`, role, name: 'Ops Manager' }, process.env.JWT_SECRET!);
}

describe('Hotel Inventory, Reservations, Reception Portal & Front-Desk Operations', () => {
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
    adminToken = makeToken('admin', 'admin-hotel-1');
  });

  it('creates hotels, room categories, physical rooms, and computes dashboard KPIs', async () => {
    const hotelRes = await srv.request('POST', '/api/hotels', {
      token: adminToken,
      body: {
        name: 'The Khyber Himalayan Resort & Spa',
        location: 'Gulmarg',
        starRating: 5,
        pricePerNight: 24000,
        description: 'Luxury alpine resort in Gulmarg',
        amenities: ['Heated Pool', 'Bukhari', 'Ski-In'],
        roomTypes: ['Premier Room', 'Luxury Cottage'],
        contactName: 'Feroz Lone',
        receptionEmail: 'frontdesk@khyber.test',
      },
    });
    assert.equal(hotelRes.status, 201);
    const hotelId = hotelRes.body.id;

    // Public listing parses JSON amenities/roomTypes
    const listRes = await srv.request('GET', '/api/hotels');
    assert.equal(listRes.status, 200);
    assert.equal(listRes.body.length, 1);
    assert.deepEqual(listRes.body[0].amenities, ['Heated Pool', 'Bukhari', 'Ski-In']);

    // Create room category & 2 rooms (one clean, one maintenance)
    const catRes = await srv.request('POST', '/api/hotels/operations/categories', {
      token: adminToken,
      body: { hotelId, name: 'Premier Valley View', basePrice: 24000, capacity: 2, maxOccupancy: 3 },
    });
    assert.equal(catRes.status, 201);

    const room101 = await srv.request('POST', '/api/hotels/operations/rooms', {
      token: adminToken,
      body: { hotelId, categoryId: catRes.body.id, roomNumber: '101', floor: '1', status: 'AVAILABLE', housekeeping: 'CLEAN' },
    });
    assert.equal(room101.status, 201);

    const room102 = await srv.request('POST', '/api/hotels/operations/rooms', {
      token: adminToken,
      body: { hotelId, categoryId: catRes.body.id, roomNumber: '102', floor: '1', status: 'MAINTENANCE', operationalStatus: 'UNDER_MAINTENANCE', housekeeping: 'DIRTY' },
    });
    assert.equal(room102.status, 201);

    const dashRes = await srv.request('GET', `/api/hotels/operations/dashboard?hotelId=${hotelId}`, {
      token: adminToken,
    });
    assert.equal(dashRes.status, 200);
    assert.equal(dashRes.body.totalRooms, 2);
    assert.equal(dashRes.body.maintenanceRooms, 1);
    assert.equal(dashRes.body.availableRooms, 1);
    assert.equal(dashRes.body.housekeeping.clean, 1);
    assert.equal(dashRes.body.housekeeping.dirty, 1);
  });

  it('computes net cost, profit margin, idempotency, and duplicate conflict detection on reservations', async () => {
    const hotel = await inMemoryPrisma.hotel.create({
      data: {
        name: 'Taj Dal View',
        location: 'Srinagar',
        starRating: 5,
        pricePerNight: 18000,
        image: '/hotel.png',
        description: 'Overlooking Dal Lake',
        amenities: '[]',
        roomTypes: '["Deluxe"]',
        receptionEmail: 'reservations@tajdal.test',
      },
    });

    // 3 nights, 2 rooms, contractRate 10000, seasonalPricing 1000 => netCost = 11000 * 2 * 3 = 66000
    // gross totalAmount = 80000 => profitMargin = 14000
    const createRes = await srv.request('POST', '/api/hospitality/reservations', {
      token: adminToken,
      body: {
        hotelId: hotel.id,
        guestName: 'Rohan Malhotra',
        guestEmail: 'rohan@example.com',
        checkIn: '2026-12-10T14:00:00.000Z',
        checkOut: '2026-12-13T11:00:00.000Z',
        roomType: 'Deluxe Lake View',
        roomsCount: 2,
        mealPlan: 'MAP',
        contractRate: 10000,
        seasonalPricing: 1000,
        totalAmount: 80000,
        idempotencyKey: 'idem-res-001',
      },
    });

    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.hotelDues, 66000);
    assert.equal(createRes.body.profitMargin, 14000);
    assert.equal(createRes.body.hasConflict, false);
    assert.equal(createRes.body.lifecycleStatus, 'SENT_TO_HOTEL');
    assert.ok(createRes.body.secureToken);

    // Socket.IO event emitted to admin-room & hotel room
    assert.ok(ioEvents.some((e) => e.room === `hotel-${hotel.id}` && e.event === 'hotel-crs-inquiry'));

    // Repeating with the same idempotencyKey returns existing 200 without creating a second row
    const replayRes = await srv.request('POST', '/api/hospitality/reservations', {
      token: adminToken,
      body: {
        hotelId: hotel.id,
        guestName: 'Rohan Malhotra',
        checkIn: '2026-12-10T14:00:00.000Z',
        checkOut: '2026-12-13T11:00:00.000Z',
        roomType: 'Deluxe Lake View',
        mealPlan: 'MAP',
        idempotencyKey: 'idem-res-001',
      },
    });
    assert.equal(replayRes.status, 200);
    assert.equal(replayRes.body.id, createRes.body.id);
    assert.equal(await inMemoryPrisma.hotelReservation.count(), 1);

    // Overlapping booking for same guest at same hotel triggers hasConflict: true
    const conflictRes = await srv.request('POST', '/api/hospitality/reservations', {
      token: adminToken,
      body: {
        hotelId: hotel.id,
        guestName: 'rohan malhotra',
        checkIn: '2026-12-11T14:00:00.000Z',
        checkOut: '2026-12-14T11:00:00.000Z',
        roomType: 'Deluxe Lake View',
        mealPlan: 'MAP',
        dispatchEmailImmediately: false,
      },
    });
    assert.equal(conflictRes.status, 201);
    assert.equal(conflictRes.body.hasConflict, true);
  });

  it('executes public reception portal confirmation workflow and rejects expired tokens', async () => {
    const hotel = await inMemoryPrisma.hotel.create({
      data: {
        name: 'Pine N Peak',
        location: 'Pahalgam',
        starRating: 5,
        pricePerNight: 15000,
        image: '/pnp.png',
        description: 'Pahalgam luxury',
        amenities: '[]',
        roomTypes: '[]',
      },
    });

    const resCreated = await srv.request('POST', '/api/hospitality/reservations', {
      token: adminToken,
      body: {
        hotelId: hotel.id,
        guestName: 'Meera Nair',
        guestEmail: 'meera@example.com',
        checkIn: '2026-12-20T14:00:00.000Z',
        checkOut: '2026-12-22T11:00:00.000Z',
        roomType: 'Suite',
        roomsCount: 1,
        mealPlan: 'MAP',
        contractRate: 12000,
        totalAmount: 30000,
        dispatchEmailImmediately: false,
      },
    });
    const { id: resId, secureToken } = resCreated.body;

    // 1. Public fetch via secureToken (no JWT required)
    const pubGet = await srv.request('GET', `/api/hospitality/public/${secureToken}`);
    assert.equal(pubGet.status, 200);
    assert.equal(pubGet.body.guestName, 'Meera Nair');
    assert.equal(pubGet.body.nights, 2);

    // 2. Reception confirms availability
    const availRes = await srv.request('POST', `/api/hospitality/public/${secureToken}/confirm-availability`, {
      body: { receptionistName: 'Tariq FrontDesk', notes: 'Suite blocked' },
    });
    assert.equal(availRes.status, 200);
    assert.equal(availRes.body.reservation.confirmationStage, 'AVAILABILITY_CONFIRMED');

    // 3. Final booking confirmation requires hotelConfirmationNumber
    const missingRef = await srv.request('POST', `/api/hospitality/public/${secureToken}/confirm-booking`, {
      body: { confirmedTariff: 11500 },
    });
    assert.equal(missingRef.status, 400);

    const confirmRes = await srv.request('POST', `/api/hospitality/public/${secureToken}/confirm-booking`, {
      body: {
        hotelConfirmationNumber: 'HTL-PNP-8841',
        confirmedTariff: 11500,
        confirmedRoomsCount: 1,
        confirmedMealPlan: 'MAP',
        respondedBy: 'Tariq FrontDesk',
      },
    });
    assert.equal(confirmRes.status, 200);
    assert.equal(confirmRes.body.reservation.status, 'Confirmed');
    assert.equal(confirmRes.body.reservation.confirmationStage, 'HOTEL_CONFIRMED');
    assert.equal(confirmRes.body.reservation.hotelDues, 23000); // 11500 * 1 * 2 nights

    // 4. Expired token returns 410 Gone
    await inMemoryPrisma.hotelReservation.update({
      where: { id: resId },
      data: { tokenExpiresAt: new Date(Date.now() - 3600_000) },
    });
    const expiredCall = await srv.request('POST', `/api/hospitality/public/${secureToken}/confirm-availability`, {
      body: { receptionistName: 'Late' },
    });
    assert.equal(expiredCall.status, 410);
  });

  it('enforces room readiness on check-in, automates housekeeping turnover on check-out, and supports voucher dispatch & override', async () => {
    const hotel = await inMemoryPrisma.hotel.create({
      data: {
        name: 'Nedous Hotel',
        location: 'Gulmarg',
        starRating: 4,
        pricePerNight: 11000,
        image: '/nedous.png',
        description: 'Heritage stay',
        amenities: '[]',
        roomTypes: '[]',
      },
    });
    const cat = await inMemoryPrisma.roomCategory.create({
      data: { hotelId: hotel.id, name: 'Heritage Room', basePrice: 11000, amenities: '[]' },
    });
    await inMemoryPrisma.hotelRoom.create({
      data: { hotelId: hotel.id, categoryId: cat.id, roomNumber: '201', status: 'MAINTENANCE', operationalStatus: 'UNDER_MAINTENANCE', housekeeping: 'CLEAN' },
    });
    await inMemoryPrisma.hotelRoom.create({
      data: { hotelId: hotel.id, categoryId: cat.id, roomNumber: '202', status: 'AVAILABLE', operationalStatus: 'AVAILABLE_DIRTY', housekeeping: 'DIRTY' },
    });
    const cleanRoom = await inMemoryPrisma.hotelRoom.create({
      data: { hotelId: hotel.id, categoryId: cat.id, roomNumber: '203', status: 'AVAILABLE', operationalStatus: 'AVAILABLE_CLEAN', housekeeping: 'CLEAN' },
    });

    const resCreate = await srv.request('POST', '/api/hospitality/reservations', {
      token: adminToken,
      body: {
        hotelId: hotel.id,
        guestName: 'Kabir Verma',
        guestEmail: 'kabir@example.com',
        checkIn: '2026-12-25T14:00:00.000Z',
        checkOut: '2026-12-27T11:00:00.000Z',
        roomType: 'Heritage Room',
        mealPlan: 'CP',
        dispatchEmailImmediately: false,
      },
    });
    const resId = resCreate.body.id;

    // Cannot check-in to MAINTENANCE room
    const maintCheckIn = await srv.request('POST', `/api/hospitality/${resId}/check-in`, {
      token: adminToken,
      body: { assignedRoomNumber: '201' },
    });
    assert.equal(maintCheckIn.status, 400);

    // Cannot check-in to DIRTY room
    const dirtyCheckIn = await srv.request('POST', `/api/hospitality/${resId}/check-in`, {
      token: adminToken,
      body: { assignedRoomNumber: '202' },
    });
    assert.equal(dirtyCheckIn.status, 400);

    // Check-in to CLEAN room succeeds and marks room OCCUPIED
    const okCheckIn = await srv.request('POST', `/api/hospitality/${resId}/check-in`, {
      token: adminToken,
      body: { assignedRoomNumber: '203', guestIdType: 'Passport', guestIdNumber: 'Z998877' },
    });
    assert.equal(okCheckIn.status, 200);
    assert.equal(okCheckIn.body.status, 'Checked-In');
    assert.equal(okCheckIn.body.guestIdVerified, true);

    const occupiedRoom = await inMemoryPrisma.hotelRoom.findUnique({ where: { id: cleanRoom.id } });
    assert.equal(occupiedRoom.status, 'OCCUPIED');
    assert.equal(occupiedRoom.currentReservationId, resId);

    // Check-out marks room AVAILABLE_DIRTY and creates a TURNOVER HousekeepingTask
    const checkOutRes = await srv.request('POST', `/api/hospitality/${resId}/check-out`, {
      token: adminToken,
    });
    assert.equal(checkOutRes.status, 200);
    assert.equal(checkOutRes.body.status, 'Checked-Out');

    const turnedRoom = await inMemoryPrisma.hotelRoom.findUnique({ where: { id: cleanRoom.id } });
    assert.equal(turnedRoom.housekeeping, 'DIRTY');
    assert.equal(turnedRoom.operationalStatus, 'AVAILABLE_DIRTY');
    assert.equal(turnedRoom.currentReservationId, null);

    const hkTasks = await inMemoryPrisma.housekeepingTask.findMany({ where: { hotelId: hotel.id } });
    assert.equal(hkTasks.length, 1);
    assert.equal(hkTasks[0].taskType, 'TURNOVER');
    assert.equal(hkTasks[0].roomNumber, '203');

    // Dispatch guest voucher
    const voucherRes = await srv.request('POST', `/api/hospitality/${resId}/dispatch-guest-voucher`, {
      token: adminToken,
      body: { customNotes: 'Early check-in requested' },
    });
    assert.equal(voucherRes.status, 200);
    assert.equal(voucherRes.body.reservation.guestVoucherDispatched, true);
    assert.equal(voucherRes.body.reservation.lifecycleStatus, 'VOUCHER_SENT');

    // Managerial override requires reason
    const noReason = await srv.request('POST', `/api/hospitality/${resId}/override-status`, {
      token: adminToken,
      body: { newStatus: 'Cancelled', reason: '  ' },
    });
    assert.equal(noReason.status, 400);

    const overrideRes = await srv.request('POST', `/api/hospitality/${resId}/override-status`, {
      token: adminToken,
      body: { newStatus: 'Completed', newLifecycleStatus: 'COMPLETED', reason: 'Settled manually with hotel GM' },
    });
    assert.equal(overrideRes.status, 200);
    assert.equal(overrideRes.body.status, 'Completed');
    assert.equal(overrideRes.body.lifecycleStatus, 'COMPLETED');
  });
});
