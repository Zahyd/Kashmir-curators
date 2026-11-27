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
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { configureSocketServer } from './lib/socketSetup';
import { realtimeBus } from './lib/realtimeBus';
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
import prisma, { checkDatabaseHealth, warmUpDatabase } from './lib/prisma';

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
  pingInterval: 20000,
  pingTimeout: 10000,
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
  skip: (req) =>
    ['/health', '/health-check', '/db-check', '/api/health', '/api/health-check', '/api/db-check'].includes(req.path)
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

// Configure authenticated, tenant-scoped Socket.IO server (with heartbeat, ack, and presence)
configureSocketServer(io);

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

const healthCheckHandler = (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
};

const dbCheckHandler = async (_req: express.Request, res: express.Response) => {
  const report = await checkDatabaseHealth();
  if (!report.ok) {
    return res.status(503).json({
      status: 'error',
      message: report.error || 'Database connection failed',
      latencyMs: report.latencyMs,
      schemaReady: report.schemaReady,
    });
  }
  return res.json({
    status: 'ok',
    message: 'Database connected',
    latencyMs: report.latencyMs,
    schemaReady: report.schemaReady,
  });
};

// Mount health and database diagnostics BEFORE Express error handlers
app.get('/health', healthCheckHandler);
app.get('/health-check', healthCheckHandler);
app.get('/api/health', healthCheckHandler);
app.get('/api/health-check', healthCheckHandler);
app.get('/db-check', dbCheckHandler);
app.get('/api/db-check', dbCheckHandler);

// Clean JSON 404 handler for unknown /api routes
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    method: req.method,
    path: req.originalUrl || req.url,
  });
});

// The error handler must be before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);
app.use(centralizedErrorHandler);

import { cronService } from './services/cronService';
import { emailQueueService } from './services/emailQueueService';

// Warm up PostgreSQL connection & initialize background workers
warmUpDatabase()
  .then(() => ensureDefaultOrganization())
  .catch((err: any) => {
    console.warn('[ServerBoot] Database warm-up / default tenant notice:', err.message);
  });
cronService.initialize();
emailQueueService.initQueue().catch((err: any) => {
  console.warn('[ServerBoot] Email queue background worker notice:', err.message);
});

realtimeBus.initRedisPubSub().catch((err: any) => {
  console.warn('[ServerBoot] RealtimeBus init notice:', err.message);
});

httpServer.listen(PORT, () => {
  console.log(`Real-Time Server is running on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});

export { io };
