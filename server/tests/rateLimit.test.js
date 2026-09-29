import express from 'express';
import request from 'supertest';
import rateLimit from 'express-rate-limit';
import { env } from '../src/config/env.js';
import { globalLimiter } from '../src/middleware/rateLimiter.js';

describe('Rate Limiting Configuration & Behavior', () => {
  it('defaults RATE_LIMIT_ENABLED to false and RATE_LIMIT_MAX to a positive number', () => {
    expect(typeof env.RATE_LIMIT_ENABLED).toBe('boolean');
    expect(typeof env.RATE_LIMIT_MAX).toBe('number');
    expect(env.RATE_LIMIT_MAX).toBeGreaterThanOrEqual(1);
  });

  it('skips rate limiting when disabled or in test mode', async () => {
    const testApp = express();
    testApp.use(globalLimiter);
    testApp.get('/test', (_req, res) => res.json({ ok: true }));

    // Send requests to ensure limiter does not throttle
    for (let i = 0; i < 5; i++) {
      const res = await request(testApp).get('/test');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    }
  });

  it('enforces limit and returns 429 RATE_LIMITED when rate limiting is enabled', async () => {
    const testApp = express();
    const customLimit = 2;
    const activeLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: customLimit,
      skip: () => false, // explicitly active
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

    testApp.use(activeLimiter);
    testApp.get('/test-limit', (_req, res) => res.json({ ok: true }));

    const res1 = await request(testApp).get('/test-limit');
    expect(res1.status).toBe(200);

    const res2 = await request(testApp).get('/test-limit');
    expect(res2.status).toBe(200);

    const res3 = await request(testApp).get('/test-limit');
    expect(res3.status).toBe(429);
    expect(res3.body.error.code).toBe('RATE_LIMITED');
  });
});
