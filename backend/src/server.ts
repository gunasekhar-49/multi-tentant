import express, { Express, Request, Response } from 'express';
import 'express-async-errors';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import logger from './utils/logger';

// Middleware
import requestIdMiddleware from './middleware/requestId';
import tenantResolverMiddleware from './middleware/tenantResolver';
import authMiddleware from './middleware/auth';
import { globalRateLimiter } from './middleware/rateLimiter';
import sanitizerMiddleware from './middleware/sanitizer';
import auditMiddleware from './middleware/audit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth';
import leadsRoutes from './routes/leads';

const app: Express = express();

// Trust proxy - important for rate limiting and IP detection
app.set('trust proxy', 1);

// Security: Helmet middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  xssFilter: true,
  frameguard: { action: 'deny' },
}));

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-request-id'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Middleware stack (in order)
app.use(requestIdMiddleware);                    // 1. Request ID tracking
app.use(globalRateLimiter);                      // 2. Rate limiting
app.use(sanitizerMiddleware);                    // 3. Input sanitization
app.use(tenantResolverMiddleware);               // 4. Tenant context extraction
app.use(authMiddleware);                         // 5. Authentication
app.use(auditMiddleware);                        // 6. Audit logging

// Health check endpoint (public)
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);

// TODO: Add more routes
// app.use('/api/contacts', contactsRoutes);
// app.use('/api/accounts', accountsRoutes);
// app.use('/api/deals', dealsRoutes);
// app.use('/api/tasks', tasksRoutes);
// app.use('/api/tickets', ticketsRoutes);
// app.use('/api/activities', activitiesRoutes);
// app.use('/api/users', usersRoutes);
// app.use('/api/tenants', tenantsRoutes);

// Not found handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = config.PORT;

const server = app.listen(PORT, () => {
  logger.info(`Server started`, {
    port: PORT,
    env: config.NODE_ENV,
    url: `http://localhost:${PORT}`,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
});

export default app;
