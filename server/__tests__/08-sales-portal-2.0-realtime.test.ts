import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import express from 'express';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';
import { resetTestState, inMemoryPrisma, ioSpy, ioEvents } from './helpers/testHarness';

const { io: ioClient } = require(path.resolve(__dirname, '../../node_modules/socket.io-client'));

const { configureSocketServer } = require('../src/lib/socketSetup');
const { realtimeBus } = require('../src/lib/realtimeBus');
const salesRoutes = require('../src/routes/salesRoutes').default;
const crmRoutes = require('../src/routes/crmRoutes').default;
const inquiryRoutes = require('../src/routes/inquiryRoutes').default;
const paymentRoutes = require('../src/routes/paymentRoutes').default;
const notificationRoutes = require('../src/routes/notificationRoutes').default;
const metaLeadRoutes = require('../src/routes/metaLeadRoutes').default;
const attendanceRoutes = require('../src/routes/attendanceRoutes').default;
const financeRoutes = require('../src/routes/financeRoutes').default;

function makeToken(role: string, id: string, extra: Record<string, any> = {}) {
  return jwt.sign(
    { id, email: `${id}@kashmircurators.com`, role, name: id, ...extra },
    process.env.JWT_SECRET!
  );
}

async function reqJson(
  baseUrl: string,
  method: string,
  urlPath: string,
  body?: any,
  token?: string,
  extraHeaders: Record<string, string> = {}
) {
  const res = await fetch(`${baseUrl}${urlPath}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders
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

function connectSocket(baseUrl: string, token?: string, reconnection = false) {
  return ioClient(baseUrl, {
    transports: ['websocket', 'polling'],
    reconnection,
    forceNew: true,
    ...(token ? { auth: { token } } : {})
  });
}

describe('Sales Portal 2.0 Real-Time, RBAC, Concurrency & Analytics', () => {
  let server: http.Server;
  let ioServer: SocketIOServer;
  let baseUrl = '';

  before(async () => {
    const app = express();
    app.use(express.json());
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

    app.use('/api/sales', salesRoutes);
    app.use('/api/crm', crmRoutes);
    app.use('/api/inquiries', inquiryRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/sales/meta-leads', metaLeadRoutes);
    app.use('/api/attendance', attendanceRoutes);
    app.use('/api/finance', financeRoutes);

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
        const timer = setTimeout(resolve, 1000);
        ioServer.close(() => {
          clearTimeout(timer);
          resolve();
        });
      });
    } else if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    (server as any)?.closeAllConnections?.();
  });

  beforeEach(() => {
    resetTestState();
  });

  it('enforces RBAC & strict authentication across Sales 2.0, CRM, Payments, Notifications, Meta & Attendance routes', async () => {
    const userToken = makeToken('user', 'public-user-1');
    const salesToken = makeToken('sales', 'sales001', { code: 'SALES001', employeeCode: 'SALES001' });

    const protectedGets = [
      '/api/sales/analytics',
      '/api/sales/activities',
      '/api/sales/search?q=Kashmir',
      '/api/sales/documents',
      '/api/sales/realtime/health',
      '/api/sales/stream',
      '/api/crm/leads',
      '/api/payments/ledger',
      '/api/notifications',
      '/api/sales/meta-leads/leads',
      '/api/attendance/live-presence',
      '/api/finance/overview'
    ];

    for (const endpoint of protectedGets) {
      const noAuth = await reqJson(baseUrl, 'GET', endpoint);
      assert.equal(noAuth.status, 401, `Expected 401 without token on ${endpoint}`);

      const publicAuth = await reqJson(baseUrl, 'GET', endpoint, undefined, userToken);
      assert.equal(publicAuth.status, 403, `Expected 403 for public user role on ${endpoint}`);
    }

    const okRes = await reqJson(baseUrl, 'GET', '/api/sales/realtime/health', undefined, salesToken);
    assert.equal(okRes.status, 200);
    assert.ok(okRes.body.instanceId);
    assert.equal(okRes.body.pubsubMode, 'IN_MEMORY_SINGLE_NODE');
  });

  it('blocks concurrent lead claim race conditions atomically and returns 409 on conflict', async () => {
    const sales1 = makeToken('sales', 's1', { employeeCode: 'SALES001', name: 'Ayaan' });
    const sales2 = makeToken('sales', 's2', { employeeCode: 'SALES002', name: 'Zara' });

    const created = await reqJson(
      baseUrl,
      'POST',
      '/api/sales/leads',
      {
        customerName: 'Mirza Tariq',
        phone: '+919900112233',
        email: 'mirza@example.com',
        destination: 'Gulmarg',
        duration: '5N/6D',
        netPrice: 120000
      },
      sales1
    );
    assert.equal(created.status, 201);
    const leadId = created.body.id;

    // Fire simultaneous claims concurrently
    const [res1, res2] = await Promise.all([
      reqJson(baseUrl, 'POST', `/api/sales/leads/${leadId}/claim`, { employeeCode: 'SALES001', employeeName: 'Ayaan' }, sales1),
      reqJson(baseUrl, 'POST', `/api/sales/leads/${leadId}/claim`, { employeeCode: 'SALES002', employeeName: 'Zara' }, sales2)
    ]);

    const statuses = [res1.status, res2.status].sort((a, b) => a - b);
    assert.deepEqual(statuses, [200, 409], 'Exactly one claim must succeed (200) and the second must get 409 conflict');

    const winner = res1.status === 200 ? 'SALES001' : 'SALES002';
    const stored = await inMemoryPrisma.inquiry.findUnique({ where: { id: leadId } });
    assert.equal(stored.assignedTo, winner);
  });

  it('enforces cross-tenant isolation across CRM reminders/notes, documents, payments ledger, and updates customPrice -> netPrice', async () => {
    const alphaSales = makeToken('sales', 'alpha-s', {
      employeeCode: 'ALPHA01',
      organizationId: 'org-alpha'
    });
    const betaSales = makeToken('sales', 'beta-s', {
      employeeCode: 'BETA01',
      organizationId: 'org-beta'
    });

    const leadAlphaRes = await reqJson(
      baseUrl,
      'POST',
      '/api/sales/leads',
      {
        customerName: 'Alpha Client',
        phone: '+919811111111',
        destination: 'Pahalgam',
        netPrice: 85000
      },
      alphaSales
    );
    assert.equal(leadAlphaRes.status, 201);
    const alphaId = leadAlphaRes.body.id;

    // Schedule reminder on Alpha lead and verify GET /crm/leads/:id/reminders returns reminders (not notes!)
    const remCreate = await reqJson(
      baseUrl,
      'POST',
      `/api/crm/leads/${alphaId}/reminders`,
      {
        title: 'Confirm Gulmarg Gondola tickets',
        dueDate: new Date(Date.now() + 3600000).toISOString(),
        priority: 'HIGH'
      },
      alphaSales
    );
    assert.equal(remCreate.status, 201);

    const remList = await reqJson(baseUrl, 'GET', `/api/crm/leads/${alphaId}/reminders`, undefined, alphaSales);
    assert.equal(remList.status, 200);
    assert.equal(remList.body.length, 1);
    assert.equal(remList.body[0].title, 'Confirm Gulmarg Gondola tickets');

    // Update inquiry price via ItineraryBuilder customPrice/estimatedBudget fallback
    const patchRes = await reqJson(
      baseUrl,
      'PATCH',
      `/api/inquiries/${alphaId}`,
      { customPrice: 99500, status: 'Ready for Review' },
      alphaSales
    );
    assert.equal(patchRes.status, 200);
    assert.equal(patchRes.body.netPrice, 99500);

    // Log manual payment UTR & check /api/payments/ledger + /api/sales/analytics + /api/sales/search
    const utrRes = await reqJson(
      baseUrl,
      'POST',
      `/api/payments/inquiry/${alphaId}/verify-manual`,
      { amount: 25000, utrNumber: 'UTR-ALPHA-001', markConfirmed: true },
      alphaSales
    );
    assert.equal(utrRes.status, 201);

    const alphaLedger = await reqJson(baseUrl, 'GET', '/api/payments/ledger', undefined, alphaSales);
    assert.equal(alphaLedger.status, 200);
    assert.equal(alphaLedger.body.summary.totalCollected, 25000);
    assert.equal(alphaLedger.body.items.length, 1);

    // Tenant B must NEVER see Tenant A ledger, search matches, documents, or reminders
    const crossRem = await reqJson(baseUrl, 'GET', `/api/crm/leads/${alphaId}/reminders`, undefined, betaSales);
    assert.equal(crossRem.status, 403);

    const crossNote = await reqJson(
      baseUrl,
      'POST',
      `/api/crm/leads/${alphaId}/notes`,
      { content: 'Cross-tenant intrusion attempt' },
      betaSales
    );
    assert.equal(crossNote.status, 403);

    const crossUtr = await reqJson(
      baseUrl,
      'POST',
      `/api/payments/inquiry/${alphaId}/verify-manual`,
      { amount: 1000, utrNumber: 'UTR-BETA-INTRUSION' },
      betaSales
    );
    assert.equal(crossUtr.status, 403);

    const betaLedger = await reqJson(baseUrl, 'GET', '/api/payments/ledger', undefined, betaSales);
    assert.equal(betaLedger.status, 200);
    assert.equal(betaLedger.body.items.length, 0);

    const betaSearch = await reqJson(baseUrl, 'GET', '/api/sales/search?q=Alpha', undefined, betaSales);
    assert.equal(betaSearch.status, 200);
    assert.equal(betaSearch.body.leads.length, 0);

    // Tenant A search & analytics reflect real DB totals
    const alphaSearch = await reqJson(baseUrl, 'GET', '/api/sales/search?q=Alpha', undefined, alphaSales);
    assert.equal(alphaSearch.status, 200);
    assert.equal(alphaSearch.body.leads.length, 1);
    assert.equal(alphaSearch.body.payments.length, 1);

    const alphaAnalytics = await reqJson(baseUrl, 'GET', '/api/sales/analytics', undefined, alphaSales);
    assert.equal(alphaAnalytics.status, 200);
    assert.equal(alphaAnalytics.body.summary.confirmedCount, 1);
    assert.equal(alphaAnalytics.body.summary.confirmedRevenueINR, 99500);
    assert.equal(alphaAnalytics.body.summary.totalCollectedINR, 25000);
  });

  it('authenticates WebSockets, isolates tenant events from anonymous sockets, supports heartbeat, notification ack & presence', async () => {
    const alphaToken = makeToken('sales', 'u-alpha-1', {
      employeeCode: 'SALES_A1',
      name: 'Alpha Exec',
      organizationId: 'org-alpha'
    });
    const betaToken = makeToken('sales', 'u-beta-1', {
      employeeCode: 'SALES_B1',
      name: 'Beta Exec',
      organizationId: 'org-beta'
    });

    // 1. Invalid JWT must be rejected on handshake
    const badClient = connectSocket(baseUrl, 'invalid.jwt.token');
    const badErr = await new Promise<Error>((resolve) => {
      badClient.once('connect_error', (err: Error) => resolve(err));
    });
    assert.match(badErr.message, /UNAUTHORIZED_SOCKET/);
    badClient.disconnect();

    // 2. Connect Alpha staff, Beta staff, and Anonymous public socket
    const alphaSock = connectSocket(baseUrl, alphaToken);
    const betaSock = connectSocket(baseUrl, betaToken);
    const anonSock = connectSocket(baseUrl);

    await Promise.all([
      new Promise<void>((resolve) => alphaSock.once('connect', () => resolve())),
      new Promise<void>((resolve) => betaSock.once('connect', () => resolve())),
      new Promise<void>((resolve) => anonSock.once('connect', () => resolve()))
    ]);

    try {
      // Join rooms + verify Beta joining sales/admin NEVER receives Alpha tenant broadcasts
      const joinAlphaRes = await new Promise<any>((resolve) => alphaSock.emit('join-sales', resolve));
      assert.equal(joinAlphaRes.ok, true);

      const betaJoinSales = await new Promise<any>((resolve) => betaSock.emit('join-sales', resolve));
      const betaJoinAdmin = await new Promise<any>((resolve) => betaSock.emit('join-admin', resolve));
      const betaJoinLegacyRoom = await new Promise<any>((resolve) => betaSock.emit('join-room', 'admin-room', resolve));
      assert.equal(betaJoinSales.ok, true);
      assert.equal(betaJoinAdmin.ok, true);
      assert.equal(betaJoinLegacyRoom.ok, true);

      const joinBetaCrossTenant = await new Promise<any>((resolve) =>
        betaSock.emit('join-tenant', 'org-alpha', resolve)
      );
      assert.equal(joinBetaCrossTenant.ok, false);

      // Anonymous socket trying to join admin-room must be denied
      const anonJoinAdmin = await new Promise<any>((resolve) =>
        anonSock.emit('join-room', 'admin-room', resolve)
      );
      assert.equal(anonJoinAdmin.ok, false);

      // Heartbeat ping/pong RTT check
      const hb = await new Promise<any>((resolve) => alphaSock.emit('heartbeat:ping', 123456, resolve));
      assert.equal(hb.clientTs, 123456);
      assert.equal(hb.authenticated, true);

      // Listen for NEW_INQUIRY / STAGE_UPDATED / PAYMENT_CONFIRMED / notification:acked / EMPLOYEE_STATUS_CHANGED on Beta & Anon
      let anonLeaked = false;
      anonSock.on('NEW_INQUIRY', () => {
        anonLeaked = true;
      });
      const betaLeakedEvents: string[] = [];
      for (const evtName of [
        'NEW_INQUIRY',
        'STAGE_UPDATED',
        'PAYMENT_CONFIRMED',
        'notification:acked',
        'EMPLOYEE_STATUS_CHANGED',
        'new-system-event'
      ]) {
        betaSock.on(evtName, () => betaLeakedEvents.push(evtName));
      }

      const alphaLeadPromise = new Promise<any>((resolve) => alphaSock.once('NEW_INQUIRY', resolve));

      const leadCreated = await reqJson(
        baseUrl,
        'POST',
        '/api/sales/leads',
        {
          customerName: 'Realtime VIP Traveler',
          phone: '+919988776655',
          destination: 'Dal Lake Houseboat',
          netPrice: 145000
        },
        alphaToken
      );
      assert.equal(leadCreated.status, 201);
      const alphaLeadId = leadCreated.body.id;

      const wsLead = await alphaLeadPromise;
      assert.equal(wsLead.customerName, 'Realtime VIP Traveler');

      // Stage transition + UTR confirmation for Alpha
      const alphaStagePromise = new Promise<any>((resolve) => alphaSock.once('STAGE_UPDATED', resolve));
      const stageUpdate = await reqJson(
        baseUrl,
        'PATCH',
        `/api/sales/leads/${alphaLeadId}/stage`,
        { stage: 'PAYMENT_PENDING', netPrice: 145000 },
        alphaToken
      );
      assert.equal(stageUpdate.status, 200);
      await alphaStagePromise;

      const alphaPaymentPromise = new Promise<any>((resolve) => alphaSock.once('PAYMENT_CONFIRMED', resolve));
      const utrRes = await reqJson(
        baseUrl,
        'POST',
        `/api/payments/inquiry/${alphaLeadId}/verify-manual`,
        { amount: 35000, utrNumber: 'UTR-ALPHA-WS-01', markConfirmed: true },
        alphaToken
      );
      assert.equal(utrRes.status, 201);
      await alphaPaymentPromise;

      // Give brief event loop tick to ensure anonymous & cross-tenant Beta sockets did not receive PII
      await new Promise((r) => setTimeout(r, 80));
      assert.equal(anonLeaked, false, 'Anonymous socket must NOT receive private CRM NEW_INQUIRY events');

      // Test notification DB/API tenant isolation + WebSocket notification acknowledgement
      const notifRec = await inMemoryPrisma.notification.findFirst({ where: { read: false } });
      assert.ok(notifRec, 'Creating a lead should persist a Notification row');

      const betaNotifList = await reqJson(baseUrl, 'GET', '/api/notifications', undefined, betaToken);
      assert.equal(betaNotifList.status, 200);
      assert.equal(betaNotifList.body.notifications.length, 0, 'Beta tenant must NOT read Alpha notifications');

      const betaNotifMark = await reqJson(baseUrl, 'PATCH', `/api/notifications/${notifRec.id}/read`, {}, betaToken);
      assert.equal(betaNotifMark.status, 403, 'Beta tenant must get 403 trying to ack Alpha notification via HTTP');

      const betaSockAck = await new Promise<any>((resolve) =>
        betaSock.emit('notification:ack', { notificationId: notifRec.id }, resolve)
      );
      assert.equal(betaSockAck.ok, false, 'Beta socket must be denied acknowledging Alpha notification');

      const ackedEventPromise = new Promise<any>((resolve) => alphaSock.once('notification:acked', resolve));
      const ackCallback = await new Promise<any>((resolve) =>
        alphaSock.emit('notification:ack', { notificationId: notifRec.id }, resolve)
      );
      assert.equal(ackCallback.ok, true);
      const ackEvent = await ackedEventPromise;
      assert.equal(ackEvent.notificationId, notifRec.id);

      const updatedNotif = await inMemoryPrisma.notification.findUnique({ where: { id: notifRec.id } });
      assert.equal(updatedNotif.read, true);

      // Test presence broadcast over WebSocket
      const presencePromise = new Promise<any>((resolve) => alphaSock.once('EMPLOYEE_STATUS_CHANGED', resolve));
      const presenceAck = await new Promise<any>((resolve) =>
        alphaSock.emit('sales:presence', { isOnline: false }, resolve)
      );
      assert.equal(presenceAck.ok, true);
      const presenceEvt = await presencePromise;
      assert.equal(presenceEvt.employeeCode, 'SALES_A1');
      assert.equal(presenceEvt.isOnline, false);

      await new Promise((r) => setTimeout(r, 80));
      assert.deepEqual(
        betaLeakedEvents,
        [],
        `Beta socket in join-sales + join-admin must NEVER receive Alpha events, got: ${betaLeakedEvents.join(', ')}`
      );
    } finally {
      alphaSock.disconnect();
      betaSock.disconnect();
      anonSock.disconnect();
    }
  });

  it('supports Socket.IO reconnection recovery, tenant-scoped SSE streams, pagination, activities, documents & attendance presence', async () => {
    const alphaToken = makeToken('sales', 'u-alpha-2', {
      code: 'SALES_A2',
      employeeCode: 'SALES_A2',
      name: 'Alpha Reconnect',
      organizationId: 'org-alpha'
    });
    const betaToken = makeToken('sales', 'u-beta-2', {
      code: 'SALES_B2',
      employeeCode: 'SALES_B2',
      name: 'Beta Isolated',
      organizationId: 'org-beta'
    });

    // 1. Seed leads for pagination & search
    for (let i = 1; i <= 3; i++) {
      const r = await reqJson(
        baseUrl,
        'POST',
        '/api/sales/leads',
        {
          customerName: `Saffron Guest ${i}`,
          phone: `+91982200000${i}`,
          destination: i === 2 ? 'Sonamarg' : 'Pahalgam',
          netPrice: 50000 * i
        },
        alphaToken
      );
      assert.equal(r.status, 201);
    }

    const page1 = await reqJson(baseUrl, 'GET', '/api/inquiries?paginated=true&page=1&limit=2&search=Saffron', undefined, alphaToken);
    assert.equal(page1.status, 200);
    assert.equal(page1.body.total, 3);
    assert.equal(page1.body.totalPages, 2);
    assert.equal(page1.body.items.length, 2);

    const leadToTest = page1.body.items[0].id;

    // Upload document & verify /api/sales/documents global hub + /api/sales/activities
    const docCreate = await reqJson(
      baseUrl,
      'POST',
      `/api/sales/leads/${leadToTest}/documents`,
      { name: 'Passport Front.pdf', category: 'PASSPORT', url: 'https://res.cloudinary.com/demo/passport.pdf', sizeBytes: 2048 },
      alphaToken
    );
    assert.equal(docCreate.status, 201);

    const globalDocsAlpha = await reqJson(baseUrl, 'GET', '/api/sales/documents?category=PASSPORT', undefined, alphaToken);
    assert.equal(globalDocsAlpha.status, 200);
    assert.equal(globalDocsAlpha.body.summary.pending, 1);
    assert.equal(globalDocsAlpha.body.documents.length, 1);

    const globalDocsBeta = await reqJson(baseUrl, 'GET', '/api/sales/documents', undefined, betaToken);
    assert.equal(globalDocsBeta.status, 200);
    assert.equal(globalDocsBeta.body.documents.length, 0);

    const activitiesRes = await reqJson(baseUrl, 'GET', '/api/sales/activities?limit=10', undefined, alphaToken);
    assert.equal(activitiesRes.status, 200);
    assert.ok(activitiesRes.body.activities.length >= 1);

    // 2. Attendance Clock-In -> Break -> Live Presence -> Clock-Out
    const clockInRes = await reqJson(baseUrl, 'POST', '/api/attendance/clock-in', { assignedDesk: 'Concierge Desk A' }, alphaToken);
    assert.equal(clockInRes.status, 200);

    const presenceRes = await reqJson(baseUrl, 'GET', '/api/attendance/live-presence', undefined, alphaToken);
    assert.equal(presenceRes.status, 200);
    assert.equal(presenceRes.body.totalOnline, 1);

    const breakRes = await reqJson(baseUrl, 'POST', '/api/attendance/break', {}, alphaToken);
    assert.equal(breakRes.status, 200);
    assert.equal(breakRes.body.isOnBreak, true);

    const clockOutRes = await reqJson(baseUrl, 'POST', '/api/attendance/clock-out', {}, alphaToken);
    assert.equal(clockOutRes.status, 200);

    // 3. Authenticated SSE Stream (/api/sales/stream) tenant isolation check
    const abortAlpha = new AbortController();
    const abortBeta = new AbortController();
    const sseAlpha = await fetch(`${baseUrl}/api/sales/stream?token=${encodeURIComponent(alphaToken)}`, { signal: abortAlpha.signal });
    const sseBeta = await fetch(`${baseUrl}/api/sales/stream?token=${encodeURIComponent(betaToken)}`, { signal: abortBeta.signal });
    assert.equal(sseAlpha.status, 200);
    assert.equal(sseBeta.status, 200);

    const readChunks = async (res: globalThis.Response) => {
      const reader = res.body!.getReader();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += Buffer.from(value).toString('utf8');
        if (buf.includes('SSE Alpha Exclusive')) break;
      }
      return buf;
    };

    const alphaReaderPromise = readChunks(sseAlpha);
    let betaGotAlphaData = false;
    const betaReader = sseBeta.body!.getReader();
    (async () => {
      while (true) {
        try {
          const { done, value } = await betaReader.read();
          if (done) break;
          if (Buffer.from(value).toString('utf8').includes('SSE Alpha Exclusive')) {
            betaGotAlphaData = true;
          }
        } catch {
          break;
        }
      }
    })();

    await reqJson(
      baseUrl,
      'POST',
      '/api/sales/leads',
      { customerName: 'SSE Alpha Exclusive', phone: '+919800001122', destination: 'Gulmarg' },
      alphaToken
    );

    const alphaSseText = await Promise.race([
      alphaReaderPromise,
      new Promise<string>((_r, rej) => setTimeout(() => rej(new Error('SSE timeout')), 3000))
    ]);
    assert.ok(alphaSseText.includes('SSE Alpha Exclusive'));
    await new Promise((r) => setTimeout(r, 60));
    assert.equal(betaGotAlphaData, false, 'Beta SSE stream must NEVER receive Alpha tenant event');

    abortAlpha.abort();
    abortBeta.abort();

    // 4. Socket.IO Disconnect & Manual Reconnect Recovery + Stage Transition Broadcast
    const sock = connectSocket(baseUrl, alphaToken, true);
    await new Promise<void>((resolve) => sock.once('connect', () => resolve()));
    await new Promise<any>((resolve) => sock.emit('join-sales', resolve));

    sock.disconnect();
    sock.connect();
    await new Promise<void>((resolve) => sock.once('connect', () => resolve()));
    await new Promise<any>((resolve) => sock.emit('join-sales', resolve));

    const stagePromise = new Promise<any>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('STAGE_UPDATED timeout')), 4000);
      sock.once('STAGE_UPDATED', (data: any) => {
        clearTimeout(t);
        resolve(data);
      });
    });
    const bookingStatusPromise = new Promise<any>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('BOOKING_STATUS_UPDATED timeout')), 4000);
      sock.once('BOOKING_STATUS_UPDATED', (data: any) => {
        clearTimeout(t);
        resolve(data);
      });
    });
    const stageRes = await reqJson(
      baseUrl,
      'PATCH',
      `/api/sales/leads/${leadToTest}/stage`,
      { stage: 'CONFIRMED', netPrice: 175000 },
      alphaToken
    );
    assert.equal(stageRes.status, 200);
    const [stageEvt, bookingEvt] = await Promise.all([stagePromise, bookingStatusPromise]);
    assert.equal(stageEvt.leadId, leadToTest);
    assert.equal(stageEvt.stage, 'CONFIRMED');
    assert.equal(bookingEvt.inquiryId, leadToTest);
    assert.equal(bookingEvt.status, 'Booked');
    sock.disconnect();
  });

  it('isolates live-presence across tenants, reconciles Booking-linked ledger/analytics, and supports stageGroup=ACTIVE', async () => {
    const alphaUser = await inMemoryPrisma.user.create({
      data: {
        name: 'Alpha Attendant',
        email: 'alpha-att@kashmircurators.com',
        role: 'sales',
        employeeCode: 'ATT_ALPHA_1',
        organizationId: 'org-alpha'
      }
    });
    const betaUser = await inMemoryPrisma.user.create({
      data: {
        name: 'Beta Attendant',
        email: 'beta-att@kashmircurators.com',
        role: 'sales',
        employeeCode: 'ATT_BETA_1',
        organizationId: 'org-beta'
      }
    });

    const alphaToken = makeToken('sales', alphaUser.id, {
      employeeCode: 'ATT_ALPHA_1',
      name: 'Alpha Attendant',
      organizationId: 'org-alpha'
    });
    const betaToken = makeToken('sales', betaUser.id, {
      employeeCode: 'ATT_BETA_1',
      name: 'Beta Attendant',
      organizationId: 'org-beta'
    });

    await reqJson(baseUrl, 'POST', '/api/attendance/clock-in', { assignedDesk: 'Alpha Desk' }, alphaToken);
    await reqJson(baseUrl, 'POST', '/api/attendance/clock-in', { assignedDesk: 'Beta Desk' }, betaToken);

    const alphaPresence = await reqJson(baseUrl, 'GET', '/api/attendance/live-presence', undefined, alphaToken);
    const betaPresence = await reqJson(baseUrl, 'GET', '/api/attendance/live-presence', undefined, betaToken);
    assert.equal(alphaPresence.status, 200);
    assert.equal(betaPresence.status, 200);
    assert.deepEqual(
      alphaPresence.body.presenceList.map((p: any) => p.employeeCode),
      ['ATT_ALPHA_1']
    );
    assert.deepEqual(
      betaPresence.body.presenceList.map((p: any) => p.employeeCode),
      ['ATT_BETA_1']
    );

    // Booking-linked Razorpay/Stripe ledger + analytics reconciliation
    const activeLead = await reqJson(
      baseUrl,
      'POST',
      '/api/sales/leads',
      { customerName: 'Active Prospect', phone: '+919855500001', destination: 'Gulmarg', netPrice: 80000 },
      alphaToken
    );
    const confirmedLead = await reqJson(
      baseUrl,
      'POST',
      '/api/sales/leads',
      {
        customerName: 'Razorpay Confirmed Guest',
        phone: '+919855500002',
        destination: 'Pahalgam',
        netPrice: 120000,
        leadStage: 'CONFIRMED'
      },
      alphaToken
    );
    const lostLead = await reqJson(
      baseUrl,
      'POST',
      '/api/sales/leads',
      {
        customerName: 'Lost Prospect',
        phone: '+919855500003',
        destination: 'Sonamarg',
        leadStage: 'LOST'
      },
      alphaToken
    );
    assert.equal(activeLead.status, 201);
    assert.equal(confirmedLead.status, 201);
    assert.equal(lostLead.status, 201);

    const booking = await inMemoryPrisma.booking.create({
      data: {
        userId: alphaUser.id,
        organizationId: 'org-alpha',
        type: 'package',
        itemName: 'Kashmir Tour Package - Pahalgam',
        bookingDate: new Date(),
        totalAmount: 45000,
        status: 'confirmed',
        details: JSON.stringify({ inquiryId: confirmedLead.body.id, paymentMethod: 'Razorpay' })
      }
    });
    await inMemoryPrisma.transactionLedger.create({
      data: {
        bookingId: booking.id,
        amount: 45000,
        type: 'CREDIT',
        paymentId: 'pay_rzp_reconcile_1',
        orderId: 'ord_rzp_1',
        description: 'Razorpay payment captured hook'
      }
    });

    const alphaLedger = await reqJson(baseUrl, 'GET', '/api/payments/ledger', undefined, alphaToken);
    assert.equal(alphaLedger.status, 200);
    assert.equal(alphaLedger.body.summary.totalCollected, 45000);
    assert.equal(alphaLedger.body.items[0].inquiry.id, confirmedLead.body.id);

    const betaLedger = await reqJson(baseUrl, 'GET', '/api/payments/ledger', undefined, betaToken);
    assert.equal(betaLedger.status, 200);
    assert.equal(betaLedger.body.summary.totalCollected, 0);
    assert.equal(betaLedger.body.items.length, 0);

    const alphaAnalytics = await reqJson(baseUrl, 'GET', '/api/sales/analytics', undefined, alphaToken);
    assert.equal(alphaAnalytics.status, 200);
    assert.equal(alphaAnalytics.body.summary.totalCollectedINR, 45000);

    const alphaSearch = await reqJson(baseUrl, 'GET', '/api/sales/search?q=pay_rzp', undefined, alphaToken);
    assert.equal(alphaSearch.status, 200);
    assert.equal(alphaSearch.body.payments.length, 1);

    const betaSearch = await reqJson(baseUrl, 'GET', '/api/sales/search?q=pay_rzp', undefined, betaToken);
    assert.equal(betaSearch.status, 200);
    assert.equal(betaSearch.body.payments.length, 0);

    // stageGroup=ACTIVE must exclude CONFIRMED and LOST
    const activePage = await reqJson(
      baseUrl,
      'GET',
      '/api/inquiries?stageGroup=ACTIVE&paginated=true&page=1&limit=10',
      undefined,
      alphaToken
    );
    assert.equal(activePage.status, 200);
    assert.deepEqual(
      activePage.body.items.map((i: any) => i.customerName),
      ['Active Prospect']
    );
  });
});
