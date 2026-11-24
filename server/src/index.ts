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

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, server-to-server, search bots)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('kashmir-curators')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
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

// Apply rate limiting to all requests (generous threshold with bot exemption)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Generous limit for modern interactive SPA browsing
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Exempt verified crawlers and health check routes from rate limits
    const ua = req.get('User-Agent') || '';
    return /Googlebot|Google-InspectionTool|bingbot|Baiduspider|DuckDuckBot|YandexBot|Lighthouse/i.test(ua) || req.path === '/health-check';
  }
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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(tenantMiddleware);

// Socket.io Connection Matrix for Real-Time Travel OS Operational Desks
io.on('connection', (socket) => {
  // Direct user personal channel
  socket.on('join-user', (userId: string) => {
    if (userId) socket.join(`user-${userId}`);
  });

  // Admin central oversight room
  socket.on('join-admin', () => {
    socket.join('admin-room');
  });

  // Tenant / Organization operational desk (B2B Agency, Hotel Operator, Fleet Provider)
  socket.on('join-tenant', (tenantId: string) => {
    if (tenantId) socket.join(`tenant-${tenantId}`);
  });

  socket.on('leave-tenant', (tenantId: string) => {
    if (tenantId) socket.leave(`tenant-${tenantId}`);
  });

  // Hotel CRS Reception Operational Desk
  socket.on('join-hotel', (hotelId: string) => {
    if (hotelId) socket.join(`hotel-${hotelId}`);
  });

  socket.on('leave-hotel', (hotelId: string) => {
    if (hotelId) socket.leave(`hotel-${hotelId}`);
  });

  // Chauffeur / Driver Cockpit & Fleet Dispatch Desk
  socket.on('join-driver', (driverId: string) => {
    if (driverId) socket.join(`driver-${driverId}`);
  });

  socket.on('leave-driver', (driverId: string) => {
    if (driverId) socket.leave(`driver-${driverId}`);
  });

  // Generic room join/leave (for backwards compatibility across client dashboards)
  socket.on('join-room', (room: string) => {
    if (room) socket.join(room);
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

// Dedicated Image Proxy Endpoint to bypass browser CORS limits when exporting PDFs
app.get('/api/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch image' });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
  } catch (error: any) {
    console.error('Image proxy error:', error.message);
    res.status(500).json({ error: 'Failed to proxy image: ' + error.message });
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
