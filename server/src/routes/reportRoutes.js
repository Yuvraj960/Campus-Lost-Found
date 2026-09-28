import { Router } from 'express';
import { reportController } from '../controllers/reportController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { mutationLimiter } from '../middleware/rateLimiter.js';
import { createReportSchema } from '../validators/reportValidators.js';

const router = Router();

router.use(requireAuth);

router.post('/', mutationLimiter, validateBody(createReportSchema), reportController.createReport);

export default router;
