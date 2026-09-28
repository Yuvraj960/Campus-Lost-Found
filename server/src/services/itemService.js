import mongoose from 'mongoose';
import { Item } from '../models/Item.js';
import { Claim } from '../models/Claim.js';
import { Match } from '../models/Match.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { getPaginationParams, formatPaginatedResponse } from '../utils/pagination.js';
import { ITEM_STATUS, CLAIM_STATUS } from '../constants/enums.js';

export const itemService = {
  getItems: async (query = {}, currentUser = null) => {
    const { page, limit, skip } = getPaginationParams(query);
    const filter = { isRemoved: false };

    // Status filter
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    } else if (!query.status) {
      filter.status = ITEM_STATUS.ACTIVE;
    }

    // Type filter
    if (query.type) {
      filter.type = query.type;
    }

    // Category filter
    if (query.category && query.category !== 'ALL') {
      filter.category = query.category;
    }

    // Location filter (escaped case-insensitive regex)
    if (query.location) {
      filter.location = { $regex: escapeRegex(query.location), $options: 'i' };
    }

    // Date range
    if (query.dateFrom || query.dateTo) {
      filter.date = {};
      if (query.dateFrom) {
        filter.date.$gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        filter.date.$lte = new Date(query.dateTo);
      }
    }

    // Owner filter
    if (query.owner === 'me') {
      if (!currentUser) {
        throw ApiError.unauthorized('Authentication required to view your listings', 'UNAUTHENTICATED');
      }
      filter.owner = currentUser._id;
    }

    // Text search
    if (query.search && query.search.trim()) {
      const sanitized = query.search.trim();
      filter.$text = { $search: sanitized };
    }

    // Sort order
    const sort = query.sort === 'oldest' ? { createdAt: 1, _id: 1 } : { createdAt: -1, _id: -1 };

    let items;
    let total;

    try {
      [items, total] = await Promise.all([
        Item.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('owner', 'name department year profileImage')
          .lean(),
        Item.countDocuments(filter),
      ]);
    } catch (err) {
      // If $text index isn't ready or fails, fallback to regex search on title
      if (filter.$text) {
        delete filter.$text;
        filter.title = { $regex: escapeRegex(query.search.trim()), $options: 'i' };
        [items, total] = await Promise.all([
          Item.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('owner', 'name department year profileImage')
            .lean(),
          Item.countDocuments(filter),
        ]);
      } else {
        throw err;
      }
    }

    // Map _id to id in lean results
    const mapped = items.map((doc) => {
      const id = doc._id.toString();
      delete doc._id;
      delete doc.__v;
      if (doc.owner && doc.owner._id) {
        doc.owner.id = doc.owner._id.toString();
        delete doc.owner._id;
      }
      return { id, ...doc };
    });

    return formatPaginatedResponse(mapped, total, page, limit);
  },

  getItemById: async (id, currentUser = null) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.notFound('Item not found');
    }

    const item = await Item.findById(id).populate('owner', 'name department year profileImage email phone');
    if (!item) {
      throw ApiError.notFound('Item not found');
    }

    const isOwner = currentUser && item.owner._id.toString() === currentUser._id.toString();
    const isAdmin = currentUser && currentUser.role === 'ADMIN';

    // 404 if removed (except admin or owner)
    if (item.isRemoved && !isOwner && !isAdmin) {
      throw ApiError.notFound('Item not found');
    }

    // Check if current user has an approved claim to decide if contact info is revealed
    let hasApprovedClaim = false;
    let myClaimDoc = null;

    if (currentUser) {
      myClaimDoc = await Claim.findOne({ item: item._id, claimant: currentUser._id }).lean();
      if (myClaimDoc && myClaimDoc.status === CLAIM_STATUS.APPROVED) {
        hasApprovedClaim = true;
      }
    }

    const itemObj = item.toJSON();

    // Privacy rule: hide email & phone unless owner, admin, or claimant of approved claim
    if (!isOwner && !isAdmin && !hasApprovedClaim && itemObj.owner) {
      delete itemObj.owner.email;
      delete itemObj.owner.phone;
    }

    // Owner/Admin specific fields
    if (isOwner || isAdmin) {
      const [claimCount, matchCount] = await Promise.all([
        Claim.countDocuments({ item: item._id }),
        Match.countDocuments({
          $or: [{ lostItem: item._id }, { foundItem: item._id }],
          status: 'SUGGESTED',
        }),
      ]);
      itemObj.claimCount = claimCount;
      itemObj.possibleMatches = matchCount;
    }

    // Add myClaim summary if authed
    if (myClaimDoc) {
      myClaimDoc.id = myClaimDoc._id.toString();
      delete myClaimDoc._id;
      delete myClaimDoc.__v;
      itemObj.myClaim = myClaimDoc;
    } else {
      itemObj.myClaim = null;
    }

    return itemObj;
  },

  createItem: async (data, currentUser) => {
    if (!currentUser) {
      throw ApiError.unauthorized('Authentication required to create a listing');
    }

    const item = new Item({
      ...data,
      owner: currentUser._id,
      status: ITEM_STATUS.ACTIVE,
      isFlagged: false,
      isRemoved: false,
    });

    await item.save();
    return item.toJSON();
  },

  updateItem: async (id, data, currentUser) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.notFound('Item not found');
    }

    const item = await Item.findById(id);
    if (!item) {
      throw ApiError.notFound('Item not found');
    }

    const isOwner = currentUser && item.owner.toString() === currentUser._id.toString();
    const isAdmin = currentUser && currentUser.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw ApiError.notFound('Item not found');
    }

    if (item.status !== ITEM_STATUS.ACTIVE) {
      throw ApiError.conflict('Only ACTIVE items can be updated');
    }

    Object.assign(item, data);
    await item.save();

    return item.toJSON();
  },

  updateItemStatus: async (id, newStatus, currentUser) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.notFound('Item not found');
    }

    const item = await Item.findById(id);
    if (!item) {
      throw ApiError.notFound('Item not found');
    }

    const isOwner = currentUser && item.owner.toString() === currentUser._id.toString();
    const isAdmin = currentUser && currentUser.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw ApiError.notFound('Item not found');
    }

    // Legal status machine check per docs/TASKS.md and rules/10-backend.md:
    // ACTIVE -> RESOLVED | CLOSED
    // CLAIMED -> RESOLVED | CLOSED
    if (newStatus === ITEM_STATUS.RESOLVED) {
      if (item.status !== ITEM_STATUS.ACTIVE && item.status !== ITEM_STATUS.CLAIMED) {
        throw ApiError.conflict(`Cannot transition item from ${item.status} to RESOLVED`);
      }
      item.status = ITEM_STATUS.RESOLVED;
      item.resolvedAt = new Date();
    } else if (newStatus === ITEM_STATUS.CLOSED) {
      if (item.status !== ITEM_STATUS.ACTIVE && item.status !== ITEM_STATUS.CLAIMED) {
        throw ApiError.conflict(`Cannot transition item from ${item.status} to CLOSED`);
      }
      item.status = ITEM_STATUS.CLOSED;
    } else {
      throw ApiError.badRequest('Invalid status update transition');
    }

    await item.save();
    return item.toJSON();
  },

  deleteItem: async (id, currentUser) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.notFound('Item not found');
    }

    const item = await Item.findById(id);
    if (!item) {
      throw ApiError.notFound('Item not found');
    }

    const isOwner = currentUser && item.owner.toString() === currentUser._id.toString();
    const isAdmin = currentUser && currentUser.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw ApiError.notFound('Item not found');
    }

    // Check if there is an approved claim
    const hasApprovedClaim = await Claim.exists({
      item: item._id,
      status: CLAIM_STATUS.APPROVED,
    });

    if (hasApprovedClaim && !isAdmin) {
      throw ApiError.conflict('Cannot delete item with an approved claim');
    }

    // Hard delete item and associated claims/matches
    await Promise.all([
      Item.findByIdAndDelete(id),
      Claim.deleteMany({ item: id }),
      Match.deleteMany({ $or: [{ lostItem: id }, { foundItem: id }] }),
    ]);

    return { message: 'Item deleted successfully' };
  },

  getItemClaims: async (itemId, currentUser) => {
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      throw ApiError.notFound('Item not found');
    }

    const item = await Item.findById(itemId);
    if (!item) {
      throw ApiError.notFound('Item not found');
    }

    const isOwner = currentUser && item.owner.toString() === currentUser._id.toString();
    const isAdmin = currentUser && currentUser.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw ApiError.notFound('Item not found');
    }

    const claims = await Claim.find({ item: itemId })
      .populate('claimant', 'name department year profileImage email phone')
      .sort({ createdAt: -1 })
      .lean();

    const mapped = claims.map((c) => {
      const id = c._id.toString();
      delete c._id;
      delete c.__v;
      if (c.claimant) {
        c.claimant.id = c.claimant._id.toString();
        delete c.claimant._id;
        // Strip claimant contact details unless claim is APPROVED
        if (c.status !== CLAIM_STATUS.APPROVED) {
          delete c.claimant.email;
          delete c.claimant.phone;
        }
      }
      return { id, ...c };
    });

    return mapped;
  },
};
