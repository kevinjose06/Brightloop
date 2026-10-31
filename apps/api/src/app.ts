import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { prisma } from './lib/prisma.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRoutes } from './routes/authRoutes.js';
import { catalogRoutes } from './routes/catalogRoutes.js';
import { subscriptionRoutes } from './routes/subscriptionRoutes.js';
import { billingRoutes } from './routes/billingRoutes.js';
import { reportRoutes } from './routes/reportRoutes.js';
import { portalRoutes } from './routes/portalRoutes.js';

export const app = express();

// Security & Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // relaxed for Swagger UI and inline invoice printing
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// Request ID & High precision response timer (PRD §13)
app.use((req, res, next) => {
  const startHrTime = process.hrtime();
  req.requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);

  const originalWriteHead = res.writeHead;
  res.writeHead = function (...args: any[]) {
    if (!res.headersSent) {
      const elapsedHrTime = process.hrtime(startHrTime);
      const elapsedTimeInMs = (elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6).toFixed(2);
      res.setHeader('X-Response-Time', `${elapsedTimeInMs}ms`);
    }
    return (originalWriteHead as any).apply(this, args);
  };

  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const ms = (elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6).toFixed(1);
    const status = res.statusCode;

    const color =
      status >= 500
        ? '\x1b[31m' // Red
        : status >= 400
        ? '\x1b[33m' // Yellow
        : status >= 300
        ? '\x1b[36m' // Cyan
        : '\x1b[32m'; // Green

    const reset = '\x1b[0m';
    const bold = '\x1b[1m';
    const gray = '\x1b[90m';

    logger.info(
      `[HTTP] ${req.method.padEnd(6)} ${req.originalUrl.padEnd(32)} ${color}${bold}${status}${reset} ${gray}(${ms}ms)${reset}`
    );
  });

  next();
});

// Health check endpoint (PRD §12)
app.get('/healthz', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      database: 'connected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown database error',
    });
  }
});

// Swagger Documentation Setup
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Brightloop Subscription & Billing API',
      version: '1.0.0',
      description: 'Production B2B SaaS Subscription Management & Automated Billing Engine API',
    },
    servers: [
      {
        url: '/api/v1',
        description: 'V1 API Server',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/catalog', catalogRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1', billingRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/portal', portalRoutes);

// Global Error Handler
app.use(errorHandler);

