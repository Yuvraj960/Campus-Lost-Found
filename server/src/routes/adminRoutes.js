import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate, validateBody } from '../middleware/validate.js';
import { ROLE } from '../constants/enums.js';
import {
  updateUserStatusSchema,
  adminUpdateItemSchema,
  adminUserQuerySchema,
  adminItemQuerySchema,
  adminClaimQuerySchema,
  adminReportQuerySchema,
} from '../validators/adminValidators.js';
import { updateReportSchema } from '../validators/reportValidators.js';

const router = Router();

// Enforce authentication and ADMIN role on all admin routes
router.use(requireAuth, requireRole(ROLE.ADMIN));

router.get('/stats', adminController.getStats);

router.get('/users', validate(adminUserQuerySchema, 'query'), adminController.getUsers);
router.patch('/users/:id/status', validateBody(updateUserStatusSchema), adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);

router.get('/items', validate(adminItemQuerySchema, 'query'), adminController.getItems);
router.patch('/items/:id', validateBody(adminUpdateItemSchema), adminController.updateItem);

router.get('/claims', validate(adminClaimQuerySchema, 'query'), adminController.getClaims);

router.get('/reports', validate(adminReportQuerySchema, 'query'), adminController.getReports);
router.patch('/reports/:id', validateBody(updateReportSchema), adminController.updateReport);

export default router;
