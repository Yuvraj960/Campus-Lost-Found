import { User } from '../models/User.js';
import { Item } from '../models/Item.js';
import { Claim } from '../models/Claim.js';
import { Report } from '../models/Report.js';
import { Match } from '../models/Match.js';
import { Notification } from '../models/Notification.js';
import { notificationService } from './notificationService.js';
import { imageService } from './imageService.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { getPaginationParams, formatPaginatedResponse } from '../utils/pagination.js';
import { ApiError } from '../utils/ApiError.js';
import {
  ROLE,
  USER_STATUS,
  ITEM_TYPE,
  ITEM_STATUS,
  CLAIM_STATUS,
  REPORT_STATUS,
  NOTIF_TYPE,
  CATEGORY,
} from '../constants/enums.js';

const CATEGORY_COLORS = {
  [CATEGORY.ELECTRONICS]: '#6366f1',
  [CATEGORY.WALLET_BAGS]: '#3b82f6',
  [CATEGORY.KEYS]: '#10b981',
  [CATEGORY.ID_DOCUMENTS]: '#f59e0b',
  [CATEGORY.CLOTHING]: '#8b5cf6',
  [CATEGORY.BOOKS_STATIONERY]: '#14b8a6',
  [CATEGORY.ACCESSORIES]: '#f43f5e',
  [CATEGORY.SPORTS]: '#ec4899',
  [CATEGORY.OTHER]: '#64748b',
};

const CATEGORY_LABELS = {
  [CATEGORY.ELECTRONICS]: 'Electronics',
  [CATEGORY.WALLET_BAGS]: 'Wallet & Bags',
  [CATEGORY.KEYS]: 'Keys',
  [CATEGORY.ID_DOCUMENTS]: 'ID & Docs',
  [CATEGORY.CLOTHING]: 'Clothing',
  [CATEGORY.BOOKS_STATIONERY]: 'Books & Stationery',
  [CATEGORY.ACCESSORIES]: 'Accessories',
  [CATEGORY.SPORTS]: 'Sports',
  [CATEGORY.OTHER]: 'Other',
};

export const adminService = {
  /**
   * Aggregate campus-wide statistics for the admin dashboard.
   */
  getStats: async () => {
    const [
      userCount,
      lostCount,
      foundCount,
      resolvedCount,
      pendingClaimCount,
      openReportCount,
      categoryAgg,
      locationAgg,
    ] = await Promise.all([
      User.countDocuments(),
      Item.countDocuments({ type: ITEM_TYPE.LOST, isRemoved: { $ne: true } }),
      Item.countDocuments({ type: ITEM_TYPE.FOUND, isRemoved: { $ne: true } }),
      Item.countDocuments({ status: ITEM_STATUS.RESOLVED }),
      Claim.countDocuments({ status: CLAIM_STATUS.PENDING }),
      Report.countDocuments({ status: REPORT_STATUS.PENDING }),
      Item.aggregate([
        { $match: { isRemoved: { $ne: true } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Item.aggregate([
        { $match: { isRemoved: { $ne: true } } },
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
    ]);

    const totalActiveOrResolved = lostCount + foundCount;
    const resolutionRate =
      totalActiveOrResolved > 0
        ? Number(((resolvedCount / totalActiveOrResolved) * 100).toFixed(1))
        : 0;

    const byCategory = categoryAgg.map((cat) => ({
      name: CATEGORY_LABELS[cat._id] || cat._id,
      count: cat.count,
      fill: CATEGORY_COLORS[cat._id] || '#64748b',
    }));

    const byLocation = locationAgg.map((loc) => ({
      name: loc._id || 'Unknown',
      count: loc.count,
    }));

    // Weekly trend aggregations for the last 8 weeks
    const now = new Date();
    const lostVsFound = [];
    const reportsPerWeek = [];

    for (let i = 7; i >= 0; i--) {
      const start = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekName = `W${8 - i}`;

      const [wLost, wFound, wReports] = await Promise.all([
        Item.countDocuments({
          type: ITEM_TYPE.LOST,
          createdAt: { $gte: start, $lt: end },
        }),
        Item.countDocuments({
          type: ITEM_TYPE.FOUND,
          createdAt: { $gte: start, $lt: end },
        }),
        Report.countDocuments({
          createdAt: { $gte: start, $lt: end },
        }),
      ]);

      lostVsFound.push({ name: weekName, lost: wLost, found: wFound });
      reportsPerWeek.push({ week: weekName, reports: wReports });
    }

    return {
      totals: {
        users: userCount,
        lost: lostCount,
        found: foundCount,
        resolved: resolvedCount,
        pendingClaims: pendingClaimCount,
        openReports: openReportCount,
      },
      resolutionRate,
      lostVsFound,
      byCategory,
      byLocation,
      reportsPerWeek,
    };
  },

  /**
   * List users with search, status filtering, and pagination.
   */
  getUsers: async (query = {}) => {
    const { page, limit, skip } = getPaginationParams(query);
    const filter = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search && query.search.trim()) {
      const escaped = escapeRegex(query.search.trim());
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
        { studentId: { $regex: escaped, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return formatPaginatedResponse(items, total, page, limit);
  },

  /**
   * Update user status (ACTIVE / SUSPENDED). Prevents self-suspension and last admin suspension.
   */
  updateUserStatus: async (targetUserId, newStatus, currentAdminId) => {
    if (targetUserId.toString() === currentAdminId.toString()) {
      throw ApiError.badRequest('You cannot change your own account status', null, 'ADMIN_SELF_ACTION');
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.role === ROLE.ADMIN && newStatus === USER_STATUS.SUSPENDED) {
      const activeAdmins = await User.countDocuments({
        role: ROLE.ADMIN,
        status: USER_STATUS.ACTIVE,
      });
      if (activeAdmins <= 1) {
        throw ApiError.badRequest('Cannot suspend the last active administrator', null, 'FORBIDDEN');
      }
    }

    user.status = newStatus;
    await user.save();

    return user;
  },

  /**
   * Cascade-delete a user and all their listings, claims, matches, and notifications.
   */
  deleteUser: async (targetUserId, currentAdminId) => {
    if (targetUserId.toString() === currentAdminId.toString()) {
      throw ApiError.badRequest('You cannot delete your own administrator account', null, 'ADMIN_SELF_ACTION');
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.role === ROLE.ADMIN) {
      const adminCount = await User.countDocuments({ role: ROLE.ADMIN });
      if (adminCount <= 1) {
        throw ApiError.badRequest('Cannot delete the last administrator', null, 'FORBIDDEN');
      }
    }

    // 1. Find user's items and clean up images
    const userItems = await Item.find({ owner: targetUserId });
    const itemIds = userItems.map((i) => i._id);

    for (const item of userItems) {
      if (item.images && item.images.length > 0) {
        const publicIds = item.images.map((img) => img.publicId).filter(Boolean);
        if (publicIds.length > 0) {
          await imageService.deleteMany(publicIds).catch(() => {});
        }
      }
    }

    // 2. Cascade delete dependent data
    await Promise.all([
      Item.deleteMany({ owner: targetUserId }),
      Claim.deleteMany({ claimant: targetUserId }),
      Notification.deleteMany({ recipient: targetUserId }),
      Report.deleteMany({ reporter: targetUserId }),
      Match.deleteMany({
        $or: [{ lostItem: { $in: itemIds } }, { foundItem: { $in: itemIds } }],
      }),
      User.findByIdAndDelete(targetUserId),
    ]);

    return { success: true };
  },

  /**
   * Moderation list for items with filters (type, status, isFlagged, isRemoved, search).
   */
  getItems: async (query = {}) => {
    const { page, limit, skip } = getPaginationParams(query);
    const filter = {};

    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.isFlagged !== undefined) {
      filter.isFlagged = query.isFlagged === 'true' || query.isFlagged === true;
    }
    if (query.isRemoved !== undefined) {
      filter.isRemoved = query.isRemoved === 'true' || query.isRemoved === true;
    }

    if (query.search && query.search.trim()) {
      const escaped = escapeRegex(query.search.trim());
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { location: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      Item.find(filter)
        .populate('owner', 'name email department year studentId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Item.countDocuments(filter),
    ]);

    return formatPaginatedResponse(items, total, page, limit);
  },

  /**
   * Update item moderation flags (isFlagged, isRemoved). Notifies owner on removal.
   */
  updateItem: async (itemId, updates) => {
    const item = await Item.findById(itemId);
    if (!item) {
      throw ApiError.notFound('Item not found', 'NOT_FOUND');
    }

    const isBeingRemoved = updates.isRemoved === true && !item.isRemoved;

    if (updates.isFlagged !== undefined) {
      item.isFlagged = Boolean(updates.isFlagged);
    }
    if (updates.isRemoved !== undefined) {
      item.isRemoved = Boolean(updates.isRemoved);
    }

    await item.save();

    // Notify item owner if their item was removed by an administrator
    if (isBeingRemoved) {
      await notificationService.createNotification({
        recipient: item.owner,
        type: NOTIF_TYPE.ITEM_REMOVED,
        message: `Your listing "${item.title}" was removed by a campus moderator`,
        item: item._id,
        link: '/my-reports',
      });
    }

    return item;
  },

  /**
   * List claims across campus with status filter and claimant details.
   */
  getClaims: async (query = {}) => {
    const { page, limit, skip } = getPaginationParams(query);
    const filter = {};

    if (query.status) {
      filter.status = query.status;
    }

    const [items, total] = await Promise.all([
      Claim.find(filter)
        .populate('item', 'title type category location status images')
        .populate('claimant', 'name email department year phone studentId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Claim.countDocuments(filter),
    ]);

    return formatPaginatedResponse(items, total, page, limit);
  },
};
