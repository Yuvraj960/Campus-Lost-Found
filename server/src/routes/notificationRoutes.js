import { Router } from 'express';
import { notificationController } from '../controllers/notificationController.js';
import { auth } from '../middleware/auth.js';

export const notificationRouter = Router();

notificationRouter.use(auth);

notificationRouter.get('/', notificationController.getNotifications);
notificationRouter.get('/unread-count', notificationController.getUnreadCount);
notificationRouter.patch('/read-all', notificationController.markAllAsRead);
notificationRouter.patch('/:id/read', notificationController.markAsRead);
