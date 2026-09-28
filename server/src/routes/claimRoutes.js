import { Router } from 'express';
import { claimController } from '../controllers/claimController.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { mutationLimiter } from '../middleware/rateLimiter.js';
import { createClaimSchema, updateClaimStatusSchema } from '../validators/claimValidators.js';

export const claimRouter = Router();

claimRouter.use(auth);

claimRouter.post('/', mutationLimiter, validate(createClaimSchema, 'body'), claimController.createClaim);
claimRouter.get('/my', claimController.getMyClaims);
claimRouter.patch('/:id', validate(updateClaimStatusSchema, 'body'), claimController.updateClaimStatus);
