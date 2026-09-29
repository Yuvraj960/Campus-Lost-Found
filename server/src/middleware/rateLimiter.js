import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const isRateLimitSkipped = () => !env.RATE_LIMIT_ENABLED || env.NODE_ENV === 'test';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.RATE_LIMIT_MAX, // Configurable limit per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skip: isRateLimitSkipped,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests, please try again later',
      },
    });
  },
});

export const mutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Math.max(1, Math.round(env.RATE_LIMIT_MAX * 0.2)), // 20% of window limit for mutations
  standardHeaders: true,
  legacyHeaders: false,
  skip: isRateLimitSkipped,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Submission limit reached. Please wait before submitting again.',
      },
    });
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Math.max(1, Math.round(env.RATE_LIMIT_MAX * 0.1)), // 10% of window limit for auth attempts
  standardHeaders: true,
  legacyHeaders: false,
  skip: isRateLimitSkipped,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests from this IP, please try again after 15 minutes',
      },
    });
  },
});

export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Math.max(1, Math.round(env.RATE_LIMIT_MAX * 0.2)), // 20% of window limit for AI requests
  standardHeaders: true,
  legacyHeaders: false,
  skip: isRateLimitSkipped,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'AI request limit reached. Please wait before asking for assistance again.',
      },
    });
  },
});

export const rematchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: Math.max(1, Math.round(env.RATE_LIMIT_MAX * 0.05)), // 5% of window limit for rematch triggers
  standardHeaders: true,
  legacyHeaders: false,
  skip: isRateLimitSkipped,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Rematch limit reached (max 5 per hour). Please try again later.',
      },
    });
  },
});
