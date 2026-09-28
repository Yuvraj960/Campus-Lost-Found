import { Router } from 'express';
import { successResponse } from '../utils/response.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  return successResponse(res, {
    status: 'ok',
    uptime: process.uptime(),
  });
});
