import { Notification } from '../models/Notification.js';
import { logger } from '../utils/logger.js';
import { getPaginationParams, formatPaginatedResponse } from '../utils/pagination.js';
import { ApiError } from '../utils/ApiError.js';
import mongoose from 'mongoose';

export const notificationService = {
  /**
   * Create and persist a notification. Never throws errors so caller flows are not disrupted.
   */
  create: async ({ recipient, type, message, item = null, link = '' }) => {
    try {
      const notif = await Notification.create({
        recipient,
        type,
        message,
        item: item || undefined,
        link: link || undefined,
        read: false,
      });
      return notif;
    } catch (err) {
      logger.warn(`Failed to create notification for ${recipient}: ${err.message}`);
      return null;
    }
  },

  /**
   * Get paginated notifications for recipient, newest first.
   */
  getNotifications: async (recipientId, query = {}) => {
    const { page, limit, skip } = getPaginationParams(query);

    const filter = { recipient: recipientId };
    if (query.unread === 'true' || query.unread === true) {
      filter.read = false;
    }

    const [items, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate('item', 'title type status')
        .lean(),
      Notification.countDocuments(filter),
    ]);

    const mapped = items.map((doc) => {
      const id = doc._id.toString();
      delete doc._id;
      delete doc.__v;
      if (doc.item && doc.item._id) {
        doc.item.id = doc.item._id.toString();
        delete doc.item._id;
      }
      return { id, ...doc };
    });

    return formatPaginatedResponse(mapped, total, page, limit);
  },

  /**
   * Get unread notification count.
   */
  getUnreadCount: async (recipientId) => {
    const count = await Notification.countDocuments({
      recipient: recipientId,
      read: false,
    });
    return { count };
  },

  /**
   * Mark a single notification as read.
   */
  markAsRead: async (notificationId, recipientId) => {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw ApiError.notFound('Notification not found');
    }

    const notif = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: recipientId },
      { $set: { read: true } },
      { new: true }
    );

    if (!notif) {
      throw ApiError.notFound('Notification not found');
    }

    return notif.toJSON();
  },

  /**
   * Mark all notifications as read for current user.
   */
  markAllAsRead: async (recipientId) => {
    const res = await Notification.updateMany(
      { recipient: recipientId, read: false },
      { $set: { read: true } }
    );

    return { updated: res.modifiedCount };
  },
};
