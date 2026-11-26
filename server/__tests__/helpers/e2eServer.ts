import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { resetTestState, inMemoryPrisma } from './testHarness';

const { configureSocketServer } = require('../../src/lib/socketSetup');
const { realtimeBus } = require('../../src/lib/realtimeBus');
const { tenantMiddleware } = require('../../src/middleware/tenantMiddleware');
const authRoutes = require('../../src/routes/authRoutes').default;
const salesRoutes = require('../../src/routes/salesRoutes').default;
const crmRoutes = require('../../src/routes/crmRoutes').default;
const inquiryRoutes = require('../../src/routes/inquiryRoutes').default;
const paymentRoutes = require('../../src/routes/paymentRoutes').default;
const notificationRoutes = require('../../src/routes/notificationRoutes').default;
const metaLeadRoutes = require('../../src/routes/metaLeadRoutes').default;
const attendanceRoutes = require('../../src/routes/attendanceRoutes').default;
const financeRoutes = require('../../src/routes/financeRoutes').default;
const userRoutes = require('../../src/routes/userRoutes').default;
const hotelRoutes = require('../../src/routes/hotelRoutes').default;
const siteContentRoutes = require('../../src/routes/siteContentRoutes').default;

async function seedBaselineData() {
  resetTestState();

  await inMemoryPrisma.organization.create({
    data: {
      id: 'kc-primary-dmc',
      name: 'Kashmir Curators Core Operating System',
      slug: 'kashmir-curators',
      type: 'DMC_PLATFORM',
      status: 'ACTIVE',
      tier: 'ENTERPRISE'
    }
  });

  await Promise.all([
    inMemoryPrisma.user.create({
      data: {
        id: 'u-admin-001',
        name: 'Director 001',
        email: 'admin001@thekashmircurators.com',
        role: 'admin',
        employeeCode: 'ADMIN001',
        isOnline: true,
        leadCapacity: 10,
        organizationId: 'kc-primary-dmc'
      }
    }),
    inMemoryPrisma.user.create({
      data: {
        id: 'u-sales-001',
        name: 'Executive 001',
        email: 'sales001@thekashmircurators.com',
        role: 'sales',
        employeeCode: 'SALES001',
        isOnline: true,
        leadCapacity: 8,
        organizationId: 'kc-primary-dmc'
      }
    }),
    inMemoryPrisma.user.create({
      data: {
        id: 'u-sales-002',
        name: 'Executive 002',
        email: 'sales002@thekashmircurators.com',
        role: 'sales',
        employeeCode: 'SALES002',
        isOnline: true,
        leadCapacity: 8,
        organizationId: 'kc-primary-dmc'
      }
    })
  ]);

  await inMemoryPrisma.hotel.create({
    data: {
      id: 'h-houseboat-1',
      name: 'Nigeen Royal Cedar Houseboat',
      location: 'Srinagar',
      category: 'Luxury Houseboat',
      pricePerNight: 12000,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1566837493203-d2d46e01a5d6?auto=format&fit=crop&q=80&w=800',
      description: 'Heritage cedar houseboat overlooking Nigeen Lake.'
    }
  });

  await inMemoryPrisma.inquiry.create({
    data: {
      id: 'e2e-lead-unclaimed',
      leadId: 'KC-E2E-101',
      customerName: 'Zoya Khan',
      phone: '+919900112201',
      email: 'zoya.khan@example.com',
      destination: 'Gulmarg & Dal Lake',
      duration: '5N / 6D',
      adultsCount: 2,
      childrenCount: 0,
      travelers: '2 Adults',
      budget: '₹95,000',
      netPrice: 95000,
      priority: 'HIGH',
      leadStage: 'NEW_LEAD',
      status: 'New',
      assignedTo: null,
      organizationId: 'kc-primary-dmc'
    }
  });

  await inMemoryPrisma.inquiry.create({
    data: {
      id: 'e2e-lead-claimed',
      leadId: 'KC-E2E-102',
      customerName: 'Rohan Kapoor',
      phone: '+919900112202',
      email: 'rohan.kapoor@example.com',
      destination: 'Pahalgam Valley',
      duration: '6 Days',
      adultsCount: 4,
      childrenCount: 0,
      travelers: '4 Adults',
      budget: '₹1,25,000',
      netPrice: 125000,
      priority: 'HIGH',
      leadStage: 'CLAIMED',
      status: 'Pending Curation',
      assignedTo: 'SALES001',
      organizationId: 'kc-primary-dmc'
    }
  });

  await inMemoryPrisma.inquiry.create({
    data: {
      id: 'e2e-lead-meta',
      leadId: 'KC-E2E-103',
      customerName: 'Amina Al-Fayed',
      phone: '+971501234567',
      email: 'amina@example.ae',
      destination: 'Srinagar Heritage & Sonamarg',
      duration: '7 Days',
      adultsCount: 2,
      childrenCount: 0,
      travelers: '2 Adults',
      budget: '₹1,85,000',
      netPrice: 185000,
      priority: 'HIGH',
      leadStage: 'QUOTE_SENT',
      status: 'Ready for Review',
      sourceCta: 'META_INSTAGRAM_AD',
      assignedTo: 'SALES001',
      organizationId: 'kc-primary-dmc'
    }
  });

  await inMemoryPrisma.notification.create({
    data: {
      id: 'e2e-notif-1',
      title: 'Priority E2E Inquiry',
      message: 'Zoya Khan awaiting immediate Gulmarg callback',
      type: 'inquiry',
      priority: 'high',
      link: '/sales/portal?tab=live-leads&inquiryId=e2e-lead-unclaimed',
      read: false
    }
  });
}

async function start() {
  const port = Number(process.env.E2E_API_PORT || 5099);
  const app = express();
  app.use(cors({ origin: '*', credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(tenantMiddleware);

  const server = http.createServer(app);
  const ioServer = new SocketIOServer(server, {
    pingInterval: 10000,
    pingTimeout: 5000,
    cors: { origin: '*' }
  });
  configureSocketServer(ioServer);
  realtimeBus.setIo(ioServer);

  app.use((req: any, _res, next) => {
    req.io = ioServer;
    next();
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/sales', salesRoutes);
  app.use('/api/crm', crmRoutes);
  app.use('/api/inquiries', inquiryRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/webhooks/meta-leads', metaLeadRoutes);
  app.use('/api/sales/meta-leads', metaLeadRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/finance', financeRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/hotels', hotelRoutes);
  app.use('/api/site-content', siteContentRoutes);

  app.get('/health-check', (_req, res) => {
    res.json({ status: 'ok', mode: 'e2e-in-memory' });
  });

  app.post('/api/e2e/reset', async (_req, res) => {
    await seedBaselineData();
    res.json({ ok: true });
  });

  await seedBaselineData();

  server.listen(port, '127.0.0.1', () => {
    console.log(`[E2E Server] Listening on http://127.0.0.1:${port}`);
  });
}

start().catch((err) => {
  console.error('[E2E Server] Fatal startup error:', err);
  process.exit(1);
});
