import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema, updateMeSchema } from '../validators/authValidators.js';
import { auth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { uploadProfileImage, processProfileImage } from '../middleware/upload.js';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate({ body: registerSchema }), authController.register);
authRouter.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
authRouter.get('/me', auth, authController.getMe);
authRouter.patch('/me', auth, uploadProfileImage, processProfileImage, validate({ body: updateMeSchema }), authController.updateMe);
authRouter.post('/logout', auth, authController.logout);
