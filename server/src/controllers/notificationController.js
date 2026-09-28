import { notificationService } from '../services/notificationService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';

export const notificationController = {
  getNotifications: asyncHandler(async (req, res) => {
    const data = await notificationService.getNotifications(req.user._id, req.query);
    return successResponse(res, data);
  }),

  getUnreadCount: asyncHandler(async (req, res) => {
    const data = await notificationService.getUnreadCount(req.user._id);
    return successResponse(res, data);
  }),

  markAsRead: asyncHandler(async (req, res) => {
    const data = await notificationService.markAsRead(req.params.id, req.user._id);
    return successResponse(res, data, 200, 'Notification marked as read');
  }),

  markAllAsRead: asyncHandler(async (req, res) => {
    const data = await notificationService.markAllAsRead(req.user._id);
    return successResponse(res, data, 200, 'All notifications marked as read');
  }),
};
