import { Router } from 'express';
import { aiController } from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { assistSchema } from '../validators/aiValidators.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(requireAuth);

router.post('/assist', aiLimiter, validateBody(assistSchema), aiController.assist);

export default router;
