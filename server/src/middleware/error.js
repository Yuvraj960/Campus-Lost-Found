import { ZodError } from 'zod';
import { errorResponse } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'SERVER_ERROR';
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  // Zod validation error handling
  if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
  }
  // Mongoose CastError (e.g. invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 404;
    code = 'NOT_FOUND';
    message = 'Resource not found';
  }
  // Mongoose validation error
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Object.values(err.errors || {}).map((e) => ({
      path: e.path,
      message: e.message,
    }));
  }
  // Mongoose duplicate key error
  else if (err.code === 11000) {
    statusCode = 409;
    code = 'CONFLICT';
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `A record with that ${field} already exists`;
  }
  // Multer errors
  else if (err.name === 'MulterError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds allowed limit (5 MB)';
    } else if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Too many files uploaded (max 5)';
    } else {
      message = err.message;
    }
  }
  // JWT errors
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'UNAUTHENTICATED';
    message = 'Invalid or expired authentication token';
  }

  // Hide 500 internal details in production
  if (statusCode === 500 && env.NODE_ENV === 'production') {
    message = 'Internal server error';
    details = null;
  }

  logger.error(`${req.method} ${req.originalUrl} - ${statusCode} [${code}]: ${message}`, {
    stack: err.stack,
    details,
  });

  return errorResponse(res, statusCode, code, message, details);
};
