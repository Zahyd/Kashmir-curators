import http from 'node:http';
import path from 'node:path';
import Module from 'node:module';
import { createInMemoryPrisma } from './inMemoryPrisma';

// 1. Configure isolated test environment BEFORE loading any application modules
process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:5432/kashmir_test';
process.env.JWT_SECRET = 'kashmir_curators_test_jwt_secret_2026';
process.env.BETTER_AUTH_SECRET = 'kashmir_curators_test_better_auth_secret_2026';
process.env.BETTER_AUTH_URL = 'http://127.0.0.1:5000';
process.env.WHATSAPP_VERIFY_TOKEN = 'test_verify_token';
// Disable outbound email / sheets / external sync side-effects during tests
delete process.env.GMAIL_USER;
delete process.env.GMAIL_APP_PASSWORD;
delete process.env.RESEND_API_KEY;
delete process.env.GOOGLE_SPREADSHEET_ID;
delete process.env.GOOGLE_CREDS_JSON;
delete process.env.TWILIO_ACCOUNT_SID;
delete process.env.TWILIO_AUTH_TOKEN;

export interface CapturedIoEvent {
  room: string;
  event: string;
  payload: any;
}

export const ioEvents: CapturedIoEvent[] = [];

export const ioSpy = {
  emit(event: string, payload: any) {
    ioEvents.push({ room: 'GLOBAL', event, payload });
  },
  to(room: string) {
    return {
      emit(event: string, payload: any) {
        ioEvents.push({ room, event, payload });
      },
    };
  },
};

export const inMemoryPrisma = createInMemoryPrisma();
export const queuedSearchNudges: any[] = [];
export const sheetAppends: any[] = [];

// 2. Intercept external fetch calls (e.g. Neon Better Auth sync on /register) while allowing localhost HTTP tests
const realFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  if (url.startsWith('http://127.0.0.1:') || url.startsWith('http://localhost:')) {
    return realFetch(input, init);
  }
  return new Response(JSON.stringify({ ok: true, mockedExternalFetch: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}) as typeof fetch;

// 3. Inject in-memory Prisma & non-booting stubs into Node CJS require.cache BEFORE loading routes/controllers
const serverSrcDir = path.resolve(__dirname, '../../src');

function registerModuleOverride(relPathFromSrc: string, exportsObj: any) {
  const resolved = require.resolve(path.join(serverSrcDir, relPathFromSrc));
  const mod = new Module(resolved);
  mod.filename = resolved;
  mod.loaded = true;
  mod.exports = exportsObj;
  require.cache[resolved] = mod;
}

registerModuleOverride('lib/prisma.ts', {
  __esModule: true,
  prisma: inMemoryPrisma,
  default: inMemoryPrisma,
});

registerModuleOverride('index.ts', {
  __esModule: true,
  io: ioSpy,
});

registerModuleOverride('services/emailQueueService.ts', {
  __esModule: true,
  emailQueueService: {
    async initQueue() {
      return null;
    },
    async enqueueSearchNudge(payload: any) {
      queuedSearchNudges.push(payload);
      return { enqueued: true, jobId: `test-nudge-${queuedSearchNudges.length}` };
    },
    async processCustomerSearchNudge(payload: any) {
      queuedSearchNudges.push({ direct: true, ...payload });
      return { success: true, channel: 'SIMULATED' };
    },
    async sendTrackedEmail(payload: any) {
      return { queued: true, payload };
    },
  },
});

registerModuleOverride('services/googleSheetsService.ts', {
  __esModule: true,
  googleSheetsService: {
    async appendLeadToSheet(inquiry: any) {
      sheetAppends.push(inquiry);
      return false;
    },
  },
});

registerModuleOverride('lib/auth.ts', {
  __esModule: true,
  auth: {},
});

// Avoid loading pure-ESM better-auth/dist/integrations/node.mjs under ts-node worker pools
try {
  const betterAuthNodePath = require.resolve('better-auth/node');
  const baMod = new Module(betterAuthNodePath);
  baMod.filename = betterAuthNodePath;
  baMod.loaded = true;
  baMod.exports = {
    __esModule: true,
    toNodeHandler: () => (_req: any, _res: any, next: any) => next(),
  };
  require.cache[betterAuthNodePath] = baMod;
} catch {
  // Ignore if better-auth/node is not resolvable
}

// 4. Import real Express middlewares & routers via require() AFTER overrides are registered
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('../../src/routes/authRoutes').default;
const hotelRoutes = require('../../src/routes/hotelRoutes').default;
const hotelReservationRoutes = require('../../src/routes/hotelReservationRoutes').default;
const cabRoutes = require('../../src/routes/cabRoutes').default;
const driverRoutes = require('../../src/routes/driverRoutes').default;
const bookingRoutes = require('../../src/routes/bookingRoutes').default;
const inquiryRoutes = require('../../src/routes/inquiryRoutes').default;
const crmRoutes = require('../../src/routes/crmRoutes').default;
const organizationRoutes = require('../../src/routes/organizationRoutes').default;
const portalAccessRoutes = require('../../src/routes/portalAccessRoutes').default;
const { tenantMiddleware } = require('../../src/middleware/tenantMiddleware');
const { requestCorrelationMiddleware } = require('../../src/middleware/requestCorrelation');
const { centralizedErrorHandler } = require('../../src/middleware/errorHandler');
const { appCache } = require('../../src/lib/cache');

export function createTestApp() {
  const app = express();
  app.set('io', ioSpy);
  app.use(cors());
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestCorrelationMiddleware);
  app.use(tenantMiddleware);
  app.use((req: any, _res, next) => {
    req.io = ioSpy;
    next();
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/hotels', hotelRoutes);
  app.use('/api/hospitality', hotelReservationRoutes);
  app.use('/api/cabs', cabRoutes);
  app.use('/api/driver', driverRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/inquiries', inquiryRoutes);
  app.use('/api/crm', crmRoutes);
  app.use('/api/organizations', organizationRoutes);
  app.use('/api/portal-keys', portalAccessRoutes);

  app.get('/health-check', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(centralizedErrorHandler);
  return app;
}

export interface TestServerHandle {
  baseUrl: string;
  server: http.Server;
  request: (
    method: string,
    urlPath: string,
    options?: { body?: any; token?: string; headers?: Record<string, string> }
  ) => Promise<{ status: number; headers: Headers; body: any }>;
  close: () => Promise<void>;
}

export async function startTestServer(): Promise<TestServerHandle> {
  const app = createTestApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const addr = server.address();
  if (!addr || typeof addr === 'string') {
    throw new Error('Failed to bind ephemeral test port');
  }
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  return {
    baseUrl,
    server,
    async request(method, urlPath, options = {}) {
      const headers: Record<string, string> = {
        ...(options.headers || {}),
      };
      if (options.token) {
        headers['Authorization'] = `Bearer ${options.token}`;
      }
      if (options.body !== undefined && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      const res = await realFetch(`${baseUrl}${urlPath}`, {
        method,
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });

      const text = await res.text();
      let parsed: any = text;
      if (text) {
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = text;
        }
      } else {
        parsed = null;
      }

      return { status: res.status, headers: res.headers, body: parsed };
    },
    async close() {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    },
  };
}

export function resetTestState() {
  inMemoryPrisma.reset();
  appCache.clear();
  ioEvents.length = 0;
  queuedSearchNudges.length = 0;
  sheetAppends.length = 0;
}
