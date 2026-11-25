import 'dotenv/config';
import './config/env'; // Strictly validate environment variables at server boot
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import packageRoutes from './routes/packageRoutes';
import hotelRoutes from './routes/hotelRoutes';
import cabRoutes from './routes/cabRoutes';
import inquiryRoutes from './routes/inquiryRoutes';
import testimonialRoutes from './routes/testimonialRoutes';
import authRoutes from './routes/authRoutes';
import bookingRoutes from './routes/bookingRoutes';
import faqRoutes from './routes/faqRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import mediaRoutes from './routes/mediaRoutes';
import userRoutes from './routes/userRoutes';
import whatsappRoutes from './routes/whatsappRoutes';
import weatherRoutes from './routes/weatherRoutes';
import seoRoutes from './routes/seoRoutes';
import paymentRoutes from './routes/paymentRoutes';
import flightRoutes from './routes/flightRoutes';
import blogRoutes from './routes/blogRoutes';
import siteContentRoutes from './routes/siteContentRoutes';
import curatorRoutes from './routes/curatorRoutes';
import advisoryRoutes from './routes/advisoryRoutes';
import hotelReservationRoutes from './routes/hotelReservationRoutes';
import crmRoutes from './routes/crmRoutes';
import agentRoutes from './routes/agentRoutes';
import financeRoutes from './routes/financeRoutes';
import notificationRoutes from './routes/notificationRoutes';
import disruptionRoutes from './routes/disruptionRoutes';
import vendorRoutes from './routes/vendorRoutes';
import walletRoutes from './routes/walletRoutes';
import safetyCardRoutes from './routes/safetyCardRoutes';
import aiRoutes from './routes/aiRoutes';
import vaultRoutes from './routes/vaultRoutes';
import portalAccessRoutes from './routes/portalAccessRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import driverRoutes from './routes/driverRoutes';
import salesRoutes from './routes/salesRoutes';
import metaLeadRoutes from './routes/metaLeadRoutes';
import auditRoutes from './routes/auditRoutes';
import organizationRoutes from './routes/organizationRoutes';
import { tenantMiddleware } from './middleware/tenantMiddleware';
import { requestCorrelationMiddleware } from './middleware/requestCorrelation';
import { centralizedErrorHandler } from './middleware/errorHandler';
import { ensureDefaultOrganization } from './lib/tenant';
import { handleStripeWebhook } from './controllers/paymentController';
import prisma from './lib/prisma';

const allowedOrigins = [
  'https://kashmir-curators.vercel.app',
  'https://www.kashmircurators.com',
  'https://thekashmircurators.com',
  'http://localhost:5173',
  'http://localhost:5000',
  'http://localhost:3000'
];

const isAllowedOrigin = (origin?: string): boolean => {
  if (!origin) return true;
  return (
    allowedOrigins.includes(origin) ||
    /^https:\/\/(kashmir-curators|kashmir-connect)(-[a-z0-9-]+)?\.vercel\.app$/i.test(origin) ||
    /^https:\/\/(www\.)?(the)?kashmircurators\.com$/i.test(origin)
  );
};

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'x-tenant-id', 'x-organization-id', 'x-portal-key']
};

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin not allowed by Socket.IO CORS'), false);
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    credentials: true
  }
});
app.set('io', io);

const PORT = process.env.PORT || 5000;

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kashmir Curators API',
      version: '1.0.0',
      description: 'API Documentation for Kashmir Curators Platform',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
      {
        url: 'https://kashmir-curators-api.onrender.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [path.join(__dirname, './routes/*.ts'), path.join(__dirname, './index.ts')],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(cors(corsOptions));

// Apply HTTP security headers with cross-origin resource sharing support
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

// Apply rate limiting to all requests (only health check exempted; no User-Agent spoofing bypass)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Generous limit for modern interactive SPA browsing
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health-check'
});
app.use(limiter);

// Defense-in-depth: automatically normalize duplicate /api/api to /api
app.use((req, res, next) => {
  if (req.url.startsWith('/api/api/')) {
    req.url = req.url.replace('/api/api/', '/api/');
  }
  next();
});

// Stripe webhook needs raw body parser
app.post('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json({
  limit: '50mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(requestCorrelationMiddleware);
app.use(tenantMiddleware);

// Socket.IO Authentication Handshake Middleware
io.use(async (socket, next) => {
  try {
    const authToken = socket.handshake.auth?.token as string | undefined;
    const authHeader = (socket.handshake.headers?.authorization as string | undefined) || '';
    const portalKey = (socket.handshake.headers?.['x-portal-key'] as string | undefined) || '';
    let token = authToken || (authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : authHeader.trim());

    if (token === 'null' || token === 'undefined') token = '';

    if (token) {
      const secrets = [process.env.JWT_SECRET, process.env.BETTER_AUTH_SECRET].filter(Boolean) as string[];
      for (const secret of secrets) {
        try {
          const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as any;
          if (decoded) {
            socket.data.user = decoded;
            return next();
          }
        } catch {}
      }

      // Check Better Auth session token
      const session = await (prisma as any).session.findUnique({
        where: { token },
        include: { user: true }
      }).catch(() => null);
      if (session?.user && new Date(session.expiresAt) > new Date()) {
        socket.data.user = {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
          organizationId: session.user.organizationId
        };
        return next();
      }
    }

    if (portalKey && portalKey.toUpperCase().startsWith('KC-')) {
      const keyRec = await (prisma as any).portalAccessKey.findUnique({
        where: { accessKey: portalKey.trim().toUpperCase() }
      }).catch(() => null);
      if (keyRec && keyRec.status === 'ACTIVE') {
        socket.data.user = {
          id: keyRec.id,
          role: 'hospitality',
          portalType: keyRec.portalType
        };
        return next();
      }
    }

    // Public anonymous sockets may connect ONLY for public broadcasts; privileged rooms require socket.data.user
    return next();
  } catch (err) {
    return next();
  }
});

// Socket.io Connection Matrix for Real-Time Travel OS Operational Desks
io.on('connection', (socket) => {
  const socketUser = socket.data.user;
  const userRole = String(socketUser?.role || '').toLowerCase();
  const isStaff = ['admin', 'operations', 'sales', 'finance', 'marketing'].includes(userRole);

  // Direct user personal channel
  socket.on('join-user', (userId: string) => {
    if (userId && socketUser && (socketUser.id === userId || isStaff)) {
      socket.join(`user-${userId}`);
    }
  });

  // Admin central oversight room (staff only)
  socket.on('join-admin', () => {
    if (socketUser && isStaff) {
      socket.join('admin-room');
    }
  });

  // Tenant / Organization operational desk (tenant member or platform admin/ops only)
  socket.on('join-tenant', (tenantId: string) => {
    if (tenantId && socketUser && (socketUser.organizationId === tenantId || ['admin', 'operations'].includes(userRole))) {
      socket.join(`tenant-${tenantId}`);
    }
  });

  socket.on('leave-tenant', (tenantId: string) => {
    if (tenantId) socket.leave(`tenant-${tenantId}`);
  });

  // Hotel CRS Reception Operational Desk
  socket.on('join-hotel', (hotelId: string) => {
    if (hotelId && socketUser && ['admin', 'operations', 'hospitality', 'supplier'].includes(userRole)) {
      socket.join(`hotel-${hotelId}`);
    }
  });

  socket.on('leave-hotel', (hotelId: string) => {
    if (hotelId) socket.leave(`hotel-${hotelId}`);
  });

  // Chauffeur / Driver Cockpit & Fleet Dispatch Desk
  socket.on('join-driver', (driverId: string) => {
    if (driverId && socketUser && ['admin', 'operations', 'driver'].includes(userRole)) {
      socket.join(`driver-${driverId}`);
    }
  });

  socket.on('leave-driver', (driverId: string) => {
    if (driverId) socket.leave(`driver-${driverId}`);
  });

  // Generic room join/leave with authorization boundaries
  socket.on('join-room', (room: string) => {
    if (!room || typeof room !== 'string') return;
    if (room.startsWith('payment-')) {
      socket.join(room);
    } else if (room === 'admin-room') {
      if (socketUser && isStaff) socket.join(room);
    } else if (room.startsWith('tenant-')) {
      const tId = room.slice(7);
      if (socketUser && (socketUser.organizationId === tId || ['admin', 'operations'].includes(userRole))) socket.join(room);
    } else if (room.startsWith('user-')) {
      const uId = room.slice(5);
      if (socketUser && (socketUser.id === uId || isStaff)) socket.join(room);
    } else if (socketUser) {
      socket.join(room);
    }
  });

  socket.on('leave-room', (room: string) => {
    if (room) socket.leave(room);
  });

  // Payment synchronization
  socket.on('join-payment', (paymentId: string) => {
    if (paymentId) socket.join(`payment-${paymentId}`);
  });
});

// Middleware to attach io to request
app.use((req: any, res, next) => {
  req.io = io;
  next();
});

const ALLOWED_IMAGE_PROXY_HOSTS = new Set([
  'res.cloudinary.com',
  'images.unsplash.com',
  'api.qrserver.com',
  'lh3.googleusercontent.com',
  'images.pexels.com'
]);

const isPrivateOrLocalHost = (hostname: string): boolean => {
  const lower = hostname.toLowerCase();
  if (lower === 'localhost' || lower.endsWith('.local') || lower.endsWith('.internal')) return true;
  if (lower.startsWith('[') || /^::1$/.test(lower)) return true;
  // Reject IPv4 literals altogether on proxy allowlist
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(lower)) return true;
  return false;
};

// Dedicated Image Proxy Endpoint (SSRF-hardened with strict HTTPS host allowlist)
app.get('/api/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    if (parsedUrl.protocol !== 'https:' || isPrivateOrLocalHost(parsedUrl.hostname) || !ALLOWED_IMAGE_PROXY_HOSTS.has(parsedUrl.hostname.toLowerCase())) {
      return res.status(403).json({ error: 'Image host is not in the permitted allowlist' });
    }

    const response = await fetch(parsedUrl.toString(), {
      redirect: 'error',
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch image' });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('image/')) {
      return res.status(415).json({ error: 'Target resource is not a valid image' });
    }

    res.setHeader('Content-Type', contentType);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
  } catch (error: any) {
    console.error('Image proxy error:', error.message);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
});

// Routes
app.use('/api/packages', packageRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/cabs', cabRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/users', userRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/hospitality', hotelReservationRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/content', blogRoutes);
app.use('/api/site-content', siteContentRoutes);
app.use('/api/curators', curatorRoutes);
app.use('/api/advisories', advisoryRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/disruptions', disruptionRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/wallet', walletRoutes); // Backward-compatible singular alias
app.use('/api/safety-card', safetyCardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/portal-keys', portalAccessRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/sales/meta-leads', metaLeadRoutes);
app.use('/api/webhooks/meta-leads', metaLeadRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/', seoRoutes);

// The error handler must be before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);
app.use(centralizedErrorHandler);

app.get('/health-check', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/db-check', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', message: 'Database connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

import { cronService } from './services/cronService';
import { emailQueueService } from './services/emailQueueService';

// Initialize background cron workers & asynchronous email queue
cronService.initialize();
emailQueueService.initQueue().catch((err: any) => {
  console.warn('[ServerBoot] Email queue background worker notice:', err.message);
});

// Ensure default multi-tenant organization foundation is provisioned
ensureDefaultOrganization().catch((err: any) => {
  console.warn('[ServerBoot] Default tenant initialization notice:', err.message);
});

httpServer.listen(PORT, () => {
  console.log(`Real-Time Server is running on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});

export { io };
