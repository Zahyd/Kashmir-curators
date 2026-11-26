import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import express from 'express';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';
import { resetTestState, inMemoryPrisma, ioSpy } from './helpers/testHarness';

const { io: ioClient } = require(path.resolve(__dirname, '../../node_modules/socket.io-client'));

const { configureSocketServer } = require('../src/lib/socketSetup');
const { realtimeBus } = require('../src/lib/realtimeBus');
const { tenantMiddleware } = require('../src/middleware/tenantMiddleware');
const agentRoutes = require('../src/routes/agentRoutes').default;
const crmRoutes = require('../src/routes/crmRoutes').default;
const paymentRoutes = require('../src/routes/paymentRoutes').default;
const authRoutes = require('../src/routes/authRoutes').default;

function makeToken(role: string, id: string, extra: Record<string, any> = {}) {
  return jwt.sign(
    { id, email: `${id}@agency.test`, role, name: id, ...extra },
    process.env.JWT_SECRET!,
    { algorithm: 'HS256' }
  );
}

async function reqJson(
  baseUrl: string,
  method: string,
  urlPath: string,
  body?: any,
  token?: string
) {
  const res = await fetch(`${baseUrl}${urlPath}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
  const text = await res.text();
  let parsed: any = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Plain text
  }
  return { status: res.status, body: parsed };
}

function connectSocket(baseUrl: string, token?: string) {
  return ioClient(baseUrl, {
    transports: ['websocket', 'polling'],
    reconnection: false,
    forceNew: true,
    ...(token ? { auth: { token } } : {})
  });
}

describe('Agent Command Desk Real-Time, Metrics Scoping & DB Endpoints', () => {
  let server: http.Server;
  let ioServer: SocketIOServer;
  let baseUrl = '';

  before(async () => {
    const app = express();
    app.use(express.json());
    app.use(tenantMiddleware);
    server = http.createServer(app);
    ioServer = new SocketIOServer(server, {
      pingInterval: 5000,
      pingTimeout: 3000,
      cors: { origin: '*' }
    });
    configureSocketServer(ioServer);

    app.use((req: any, _res, next) => {
      req.io = ioServer;
      next();
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/agents', agentRoutes);
    app.use('/api/crm', crmRoutes);
    app.use('/api/payments', paymentRoutes);

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    realtimeBus.setIo(ioSpy);
    if (ioServer) {
      ioServer.disconnectSockets(true);
      await new Promise<void>((resolve) => {
        const t = setTimeout(resolve, 1000);
        ioServer.close(() => {
          clearTimeout(t);
          resolve();
        });
      });
    } else if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    (server as any)?.closeAllConnections?.();
  });

  beforeEach(async () => {
    resetTestState();
    await inMemoryPrisma.user.create({
      data: { id: 'agent-a', name: 'Zahid Travels', email: 'agent-a@agency.test', role: 'agent' }
    });
    await inMemoryPrisma.user.create({
      data: { id: 'agent-b', name: 'Alpine Tours', email: 'agent-b@agency.test', role: 'agent' }
    });
    await inMemoryPrisma.hotel.create({
      data: {
        id: 'htl-real-1',
        name: 'Khyber Winter Lodge',
        location: 'Gulmarg',
        starRating: 5,
        pricePerNight: 20000,
        amenities: JSON.stringify(['Central Heating', 'Ski Concierge']),
        isActive: true
      }
    });
    await inMemoryPrisma.cab.create({
      data: {
        id: 'cab-real-1',
        name: 'Toyota Innova Crysta',
        type: 'SUV',
        capacity: 6,
        pricePerKm: 25,
        basePrice: 5000,
        features: JSON.stringify(['Snow Chains']),
        isActive: true
      }
    });
  });

  it('isolates /api/crm/bi/metrics per agent and reports full stageCounts including CLAIMED & LOST', async () => {
    const tokenA = makeToken('agent', 'agent-a');
    const tokenB = makeToken('agent', 'agent-b');

    await inMemoryPrisma.inquiry.create({
      data: {
        id: 'inq-a-1',
        leadId: 'KC-A-001',
        agentId: 'agent-a',
        customerName: 'Aarav Mehta',
        email: 'aarav@example.com',
        phone: '+919999000111',
        destination: 'Kashmir',
        duration: '6 Days',
        travelers: '2 Adults',
        budget: '₹80,000',
        netPrice: 80000,
        leadStage: 'CLAIMED',
        assignedTo: 'agent-a@agency.test'
      }
    });

    await inMemoryPrisma.inquiry.create({
      data: {
        id: 'inq-b-1',
        leadId: 'KC-B-001',
        agentId: 'agent-b',
        customerName: 'Secret Guest B',
        email: 'secret@example.com',
        phone: '+919999000222',
        destination: 'Pahalgam',
        duration: '4 Days',
        travelers: '2 Adults',
        budget: '₹1,20,000',
        netPrice: 120000,
        leadStage: 'CONFIRMED',
        assignedTo: 'agent-b@agency.test'
      }
    });

    const metricsA = await reqJson(baseUrl, 'GET', '/api/crm/bi/metrics', undefined, tokenA);
    assert.equal(metricsA.status, 200);
    assert.equal(metricsA.body.totalInquiries, 1);
    assert.equal(metricsA.body.totalPipelineValue, 80000);
    assert.equal(metricsA.body.confirmedRevenue, 0);
    assert.equal(metricsA.body.stageCounts.CLAIMED, 1);

    // Cross-agent lead detail and mutation must be blocked with 403
    const forbiddenDetail = await reqJson(baseUrl, 'GET', '/api/crm/leads/inq-b-1', undefined, tokenA);
    assert.equal(forbiddenDetail.status, 403);

    const forbiddenUpdate = await reqJson(baseUrl, 'PATCH', '/api/crm/leads/inq-b-1/stage', { leadStage: 'CANCELLED' }, tokenA);
    assert.equal(forbiddenUpdate.status, 403);

    // Agent B sees only its confirmed inquiry
    const metricsB = await reqJson(baseUrl, 'GET', '/api/crm/bi/metrics', undefined, tokenB);
    assert.equal(metricsB.status, 200);
    assert.equal(metricsB.body.totalInquiries, 1);
    assert.equal(metricsB.body.confirmedRevenue, 120000);
  });

  it('persists license, branding, team seats with quota, supply holds, XML/JSON feed, domain & zero-mock credit ledger', async () => {
    const tokenA = makeToken('agent', 'agent-a');

    // 1. Verify license provisions Organization + AgentProfile
    const licRes = await reqJson(
      baseUrl,
      'POST',
      '/api/agents/verify-license',
      { companyName: 'Zahid Travels', licenseNumber: 'JK-TRC-8647', association: 'TAAK', gstin: '01AAAAA0000A1Z5' },
      tokenA
    );
    assert.equal(licRes.status, 200);
    assert.equal(licRes.body.profile.licenseNumber, 'JK-TRC-8647');

    // 2. Branding persistence
    const brandRes = await reqJson(
      baseUrl,
      'PUT',
      '/api/agents/branding',
      { agencyName: 'Zahid Couture Kashmir', agencyTagline: 'Curated Luxury', logoUrl: '', primaryColor: '#059669', phone: '+919906000001', website: 'zahidtravels.in' },
      tokenA
    );
    assert.equal(brandRes.status, 200);
    assert.equal(brandRes.body.branding.agencyName, 'Zahid Couture Kashmir');

    const statsAfterBrand = await reqJson(baseUrl, 'GET', '/api/agents/stats', undefined, tokenA);
    assert.equal(statsAfterBrand.status, 200);
    assert.equal(statsAfterBrand.body.branding.agencyName, 'Zahid Couture Kashmir');
    assert.equal(statsAfterBrand.body.leadsLimit, 15);

    // 3. Team quota enforcement: Starter allows 1 primary owner -> creating a 2nd rejects with 403
    const starterSeatFail = await reqJson(
      baseUrl,
      'POST',
      '/api/agents/team',
      { name: 'Extra Rep', email: 'rep@agency.test', role: 'CONCIERGE' },
      tokenA
    );
    assert.equal(starterSeatFail.status, 403);

    // Upgrade profile to PRO_DMC and verify 2nd seat succeeds + 4th rejects
    await inMemoryPrisma.agentProfile.update({ where: { userId: 'agent-a' }, data: { plan: 'PRO_DMC' } });
    const seat2 = await reqJson(
      baseUrl,
      'POST',
      '/api/agents/team',
      { name: 'Asif Mir', email: 'asif@agency.test', role: 'CONCIERGE' },
      tokenA
    );
    assert.equal(seat2.status, 201);
    assert.equal(seat2.body.seats.length, 2);

    // 4. Supply from PostgreSQL + 48h Hold
    const supplyRes = await reqJson(baseUrl, 'GET', '/api/agents/supply', undefined, tokenA);
    assert.equal(supplyRes.status, 200);
    assert.ok(supplyRes.body.items.some((it: any) => it.title === 'Khyber Winter Lodge'));
    assert.ok(supplyRes.body.items.some((it: any) => it.title.includes('Toyota Innova Crysta')));

    const holdRes = await reqJson(
      baseUrl,
      'POST',
      '/api/agents/supply/hold',
      { itemId: 'htl-real-1', category: 'HOTEL', title: 'Khyber Winter Lodge', netRate: 18000 },
      tokenA
    );
    assert.equal(holdRes.status, 201);
    assert.ok(holdRes.body.hold.id.startsWith('HOLD-'));

    // 5. XML & JSON Feed from real DB
    const xmlRes = await reqJson(baseUrl, 'GET', '/api/agents/api-feed?category=hotels&format=xml', undefined, tokenA);
    assert.equal(xmlRes.status, 200);
    assert.ok(xmlRes.body.xml.includes('Khyber Winter Lodge'));

    // Enterprise key generation requires ENTERPRISE plan
    const keyDenied = await reqJson(baseUrl, 'POST', '/api/agents/api-keys/regenerate', {}, tokenA);
    assert.equal(keyDenied.status, 403);
    await inMemoryPrisma.agentProfile.update({ where: { userId: 'agent-a' }, data: { plan: 'ENTERPRISE' } });
    const keyAllowed = await reqJson(baseUrl, 'POST', '/api/agents/api-keys/regenerate', {}, tokenA);
    assert.equal(keyAllowed.status, 200);
    assert.ok(keyAllowed.body.apiKey.startsWith('kcb2b_live_'));

    // 6. Custom domain persistence
    const domRes = await reqJson(baseUrl, 'PUT', '/api/agents/domain', { domain: 'quotes.zahidtravels.com' }, tokenA);
    assert.equal(domRes.status, 200);
    assert.equal(domRes.body.domain, 'quotes.zahidtravels.com');
    assert.equal(domRes.body.status, 'PENDING');

    // 7. Credit ledger starts empty with zero mock sample rows
    const creditRes = await reqJson(baseUrl, 'GET', '/api/agents/credit', undefined, tokenA);
    assert.equal(creditRes.status, 200);
    assert.equal(creditRes.body.creditLimit, 250000);
    assert.deepEqual(creditRes.body.entries, []);
  });

  it('pushes real-time WebSocket and SSE updates to Agent A while isolating Agent B', async () => {
    const tokenA = makeToken('agent', 'agent-a');
    const tokenB = makeToken('agent', 'agent-b');

    const sockA = connectSocket(baseUrl, tokenA);
    const sockB = connectSocket(baseUrl, tokenB);

    await Promise.all([
      new Promise<void>((resolve) => sockA.on('connect', resolve)),
      new Promise<void>((resolve) => sockB.on('connect', resolve))
    ]);

    const joinRes: any = await new Promise((resolve) => sockA.emit('join-agent', resolve));
    assert.equal(joinRes.ok, true);
    assert.ok(joinRes.rooms.includes('agent-agent-a'));

    const pingRes: any = await new Promise((resolve) => sockA.emit('heartbeat:ping', Date.now(), resolve));
    assert.equal(pingRes.authenticated, true);

    const aEvents: Array<{ event: string; payload: any }> = [];
    const bEvents: Array<{ event: string; payload: any }> = [];

    for (const evt of ['NEW_INQUIRY', 'lead-updated', 'STAGE_UPDATED', 'lead-note-added', 'new-system-event']) {
      sockA.on(evt, (payload: any) => aEvents.push({ event: evt, payload }));
      sockB.on(evt, (payload: any) => bEvents.push({ event: evt, payload }));
    }

    const createRes = await reqJson(
      baseUrl,
      'POST',
      '/api/agents/leads',
      { customerName: 'Realtime Guest', phone: '+919988776655', destination: 'Gulmarg', duration: '5 Days', netPrice: 92000 },
      tokenA
    );
    assert.equal(createRes.status, 201);

    await reqJson(
      baseUrl,
      'PATCH',
      `/api/crm/leads/${createRes.body.id}/stage`,
      { leadStage: 'QUOTE_SENT' },
      tokenA
    );

    await reqJson(
      baseUrl,
      'POST',
      `/api/crm/leads/${createRes.body.id}/notes`,
      { content: 'Sent Gondola quotation' },
      tokenA
    );

    await new Promise((r) => setTimeout(r, 200));

    assert.ok(aEvents.some((e) => e.event === 'NEW_INQUIRY' && e.payload.customerName === 'Realtime Guest'));
    assert.ok(aEvents.some((e) => e.event === 'lead-updated' && e.payload.newStage === 'QUOTE_SENT'));
    assert.ok(aEvents.some((e) => e.event === 'lead-note-added'));
    assert.equal(bEvents.length, 0, 'Agent B must receive ZERO real-time events for Agent A leads');

    sockA.disconnect();
    sockB.disconnect();
  });
});
