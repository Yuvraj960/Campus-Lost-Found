import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/authRoutes.js';
import { itemRouter } from './routes/itemRoutes.js';
import { claimRouter } from './routes/claimRoutes.js';
import { notificationRouter } from './routes/notificationRoutes.js';
import matchRouter from './routes/matchRoutes.js';
import aiRouter from './routes/aiRoutes.js';
import reportRouter from './routes/reportRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/error.js';

const app = express();

// Disable x-powered-by
app.disable('x-powered-by');

// Security headers
app.use(helmet());

// CORS limited to CLIENT_URL
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Body parsing with 100kb limit
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Health route (public, independent of database)
app.use('/api', healthRouter);

// API routes
app.use('/api/auth', authRouter);
app.use('/api/items', itemRouter);
app.use('/api/claims', claimRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/matches', matchRouter);
app.use('/api/ai', aiRouter);
app.use('/api/reports', reportRouter);
app.use('/api/admin', adminRouter);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
