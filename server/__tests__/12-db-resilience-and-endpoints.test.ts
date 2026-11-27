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
  buildPgBossConnectionOptions,
  isTransientDbError,
  normalizeRawPostgresUrl,
  parseValidPostgresUrl,
  resolvePostgresConnectionCandidates,
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
    assert.equal(parsed.searchParams.get('pgbouncer'), 'true');
    assert.equal(parsed.searchParams.get('connection_limit'), '5');

    assert.equal(
      normalizeRawPostgresUrl(`psql 'postgresql://user:pass@localhost:5432/localdb'`),
      'postgresql://user:pass@localhost:5432/localdb'
    );

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

  it('rejects malformed or placeholder database hosts like "base" and falls back cleanly for pg-boss', () => {
    assert.equal(parseValidPostgresUrl('base'), null);
    assert.equal(parseValidPostgresUrl('postgresql://user:secret@base/neondb'), null);
    assert.ok(
      parseValidPostgresUrl('postgresql://neondb_owner:pw@ep-demo.aws.neon.tech/neondb?sslmode=require')
    );

    const resolved = resolvePostgresConnectionCandidates([
      { label: 'DATABASE_URL_UNPOOLED', value: 'postgresql://user:supersecret@base/neondb' },
      { label: 'DATABASE_URL', value: 'postgresql://user:pw@ep-demo-pooler.aws.neon.tech/neondb' },
    ]);

    assert.equal(resolved.skipped.length, 1);
    assert.equal(resolved.skipped[0].label, 'DATABASE_URL_UNPOOLED');
    assert.equal(resolved.skipped[0].reason.includes('supersecret'), false);
    assert.equal(resolved.candidates.length, 1);
    assert.equal(resolved.candidates[0].label, 'DATABASE_URL');

    const bossOpts = buildPgBossConnectionOptions(
      'postgresql://user%40mail:p%40ss%231@ep-demo-pooler.aws.neon.tech:5432/neondb?sslmode=require'
    );
    assert.equal(bossOpts.host, 'ep-demo-pooler.aws.neon.tech');
    assert.equal(bossOpts.port, 5432);
    assert.equal(bossOpts.database, 'neondb');
    assert.equal(bossOpts.user, 'user@mail');
    assert.equal(bossOpts.password, 'p@ss#1');
    assert.deepEqual(bossOpts.ssl, { rejectUnauthorized: false });

    const localOpts = buildPgBossConnectionOptions('postgresql://postgres:pw@localhost:5432/kashmir_local');
    assert.equal(localOpts.ssl, false);

    assert.equal(
      isTransientDbError(new Error('Error in PostgreSQL connection: Error { kind: Closed, cause: None }')),
      true
    );
    assert.equal(isTransientDbError(new Error('Booking status is closed')), false);
  });
});
