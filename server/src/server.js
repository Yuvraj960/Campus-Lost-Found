import mongoose from 'mongoose';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

import { resolveMongoUri } from './utils/resolveMongoUri.js';

const startServer = async () => {
  try {
    if (env.MONGODB_URI) {
      const activeMongoUri = resolveMongoUri(env.MONGODB_URI);
      const maskedUri = activeMongoUri.replace(/:([^:@]{3,})@/, ':****@');
      mongoose
        .connect(activeMongoUri)
        .then(() => {
          logger.info(`Connected to MongoDB at ${maskedUri}`);
        })
        .catch((err) => {
          logger.warn(`MongoDB connection failed: ${err.message}. Running without DB for now.`);
        });
    }

    const server = app.listen(env.PORT, () => {
      logger.info(`Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`Health check available at http://localhost:${env.PORT}/api/health`);
    });

    const shutdown = async () => {
      logger.info('Shutting down server gracefully...');
      server.close(async () => {
        if (mongoose.connection.readyState !== 0) {
          await mongoose.connection.close();
        }
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
