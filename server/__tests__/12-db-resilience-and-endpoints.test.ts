import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import {
  startTestServer,
  resetTestState,
  inMemoryPrisma,
  TestServerHandle,
} from './helpers/testHarness';
import {
  buildResilientDatabaseUrl,
  isTransientDbError,
  withDbRetry,
  checkDatabaseHealthWithClient,
} from '../src/lib/dbResilience';

function makeToken(role = 'user', id = 'tourist-resilience-1') {
  return jwt.sign(
    { id, email: `${id}@kashmircurators.com`, role, name: 'Test Traveler' },
    process.env.JWT_SECRET!
  );
}

describe('DB Connection Resilience & API Endpoint Robustness', () => {
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

  it('tunes Neon PostgreSQL connection strings with connect_timeout, pool_timeout, and sslmode', () => {
    const tunedNeon = buildResilientDatabaseUrl(
      'postgresql://neondb_owner:pass@ep-demo-pooler.ap-southeast-1.aws.neon.tech/neondb'
    );
    assert.ok(tunedNeon);
    const parsed = new URL(tunedNeon!);
    assert.equal(parsed.searchParams.get('connect_timeout'), '30');
    assert.equal(parsed.searchParams.get('pool_timeout'), '30');
    assert.equal(parsed.searchParams.get('sslmode'), 'require');

    const explicitUrl = buildResilientDatabaseUrl(
      'postgresql://user:pass@localhost:5432/localdb?connect_timeout=10&pool_timeout=15'
    );
    const parsedExplicit = new URL(explicitUrl!);
    assert.equal(parsedExplicit.searchParams.get('connect_timeout'), '10');
    assert.equal(parsedExplicit.searchParams.get('pool_timeout'), '15');
    assert.equal(parsedExplicit.searchParams.get('sslmode'), null);
  });

  it('retries transient P1001/ECONNRESET wake-up failures but rethrows non-transient errors immediately', async () => {
    assert.equal(isTransientDbError({ code: 'P1001' }), true);
    assert.equal(isTransientDbError({ code: 'P1017' }), true);
    assert.equal(isTransientDbError(new Error("Can't reach database server at neon.tech:5432")), true);
    assert.equal(isTransientDbError({ code: 'P2002', message: 'Unique constraint' }), false);

    let attempts = 0;
    const recovered = await withDbRetry(async () => {
      attempts += 1;
      if (attempts < 3) {
        const err = new Error('Server has closed the connection') as Error & { code: string };
        err.code = 'P1017';
        throw err;
      }
      return 'connected';
    }, 3, 5);
    assert.equal(recovered, 'connected');
    assert.equal(attempts, 3);

    let nonTransientAttempts = 0;
    await assert.rejects(async () => {
      await withDbRetry(async () => {
        nonTransientAttempts += 1;
        const err = new Error('Unique constraint failed') as Error & { code: string };
        err.code = 'P2002';
        throw err;
      }, 3, 5);
    }, /Unique constraint/);
    assert.equal(nonTransientAttempts, 1);
  });

  it('reports accurate health and schema readiness from checkDatabaseHealthWithClient', async () => {
    const healthy = await checkDatabaseHealthWithClient({
      $queryRaw: async () => [{ '?column?': 1 }],
      $queryRawUnsafe: async () => [{ cnt: 6 }],
    });
    assert.equal(healthy.ok, true);
    assert.equal(healthy.schemaReady, true);

    const unhealthy = await checkDatabaseHealthWithClient({
      $queryRaw: async () => {
        const err = new Error("Can't reach database server") as Error & { code: string };
        err.code = 'P1001';
        throw err;
      },
      $queryRawUnsafe: async () => [],
    });
    assert.equal(unhealthy.ok, false);
    assert.equal(unhealthy.schemaReady, false);
    assert.equal(unhealthy.error, 'Database unavailable (P1001)');
  });

  it('serves /api/bookings/my-trips alias and tolerates malformed legacy JSON booking details', async () => {
    const user = await inMemoryPrisma.user.create({
      data: {
        email: 'legacy-details@example.com',
        name: 'Legacy Traveler',
        role: 'user',
      },
    });
    await inMemoryPrisma.booking.create({
      data: {
        userId: user.id,
        type: 'cab',
        itemName: 'Srinagar Airport Transfer',
        bookingDate: new Date(),
        totalAmount: 1800,
        details: '{not-valid-json',
        status: 'confirmed',
      },
    });

    const userToken = makeToken('user', user.id);
    const myTripsRes = await srv.request('GET', '/api/bookings/my-trips', { token: userToken });
    assert.equal(myTripsRes.status, 200);
    assert.equal(Array.isArray(myTripsRes.body), true);
    assert.equal(myTripsRes.body.length, 1);
    assert.deepEqual(myTripsRes.body[0].details, {});

    const myRes = await srv.request('GET', '/api/bookings/my', { token: userToken });
    assert.equal(myRes.status, 200);
    assert.deepEqual(myRes.body[0].details, {});
  });
});
