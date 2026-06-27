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
import prisma from './lib/prisma';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

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
app.use(cors());

// Apply HTTP security headers
app.use(helmet());

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json());

// Socket.io Connection
io.on('connection', (socket) => {
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
  });

  socket.on('join-admin', () => {
    socket.join('admin-room');
  });
});

// Middleware to attach io to request
app.use((req: any, res, next) => {
  req.io = io;
  next();
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
app.use('/api/reservations', hotelReservationRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/content', blogRoutes);
app.use('/api/site-content', siteContentRoutes);
app.use('/api/curators', curatorRoutes);
app.use('/api/advisories', advisoryRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/finance', financeRoutes);
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

// Initialize background cron workers
cronService.initialize();

httpServer.listen(PORT, () => {
  console.log(`Real-Time Server is running on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});

export { io };
