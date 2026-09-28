import { Router } from 'express';
import { matchController } from '../controllers/matchController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/my', matchController.getMyMatches);
router.patch('/:id', matchController.dismissMatch);

export default router;
