import mongoose from 'mongoose';
import { Claim } from '../models/Claim.js';
import { Item } from '../models/Item.js';
import { ApiError } from '../utils/ApiError.js';
import { notificationService } from './notificationService.js';
import { getPaginationParams, formatPaginatedResponse } from '../utils/pagination.js';
import { CLAIM_STATUS, ITEM_STATUS, NOTIF_TYPE } from '../constants/enums.js';

export const claimService = {
  /**
   * Submit an ownership claim for an item.
   */
  createClaim: async ({ itemId, message, proof }, currentUser) => {
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      throw ApiError.notFound('Item not found');
    }

    const item = await Item.findById(itemId);
    if (!item) {
      throw ApiError.notFound('Item not found');
    }

    // Cannot claim own item
    if (item.owner.toString() === currentUser._id.toString()) {
      throw ApiError.conflict('You cannot submit an ownership claim on your own listing', 'CONFLICT');
    }

    // Only ACTIVE items can accept claims
    if (item.status !== ITEM_STATUS.ACTIVE) {
      throw ApiError.conflict('Claims can only be submitted for ACTIVE listings', 'CONFLICT');
    }

    // Check if user already has a pending claim on this item
    const existingPending = await Claim.findOne({
      item: itemId,
      claimant: currentUser._id,
      status: CLAIM_STATUS.PENDING,
    });
    if (existingPending) {
      throw ApiError.conflict('You already have a pending claim on this item', 'CONFLICT');
    }

    const claim = await Claim.create({
      item: itemId,
      claimant: currentUser._id,
      message,
      proof,
      status: CLAIM_STATUS.PENDING,
    });

    // Notify item owner
    await notificationService.create({
      recipient: item.owner,
      type: NOTIF_TYPE.CLAIM_RECEIVED,
      message: `New ownership claim submitted for "${item.title}".`,
      item: item._id,
      link: `/items/${item._id}`,
    });

    return claim.toJSON();
  },

  /**
   * Get claims submitted by the current user.
   * If claim is APPROVED, exposes owner contact info.
   */
  getMyClaims: async (currentUser, query = {}) => {
    const { page, limit, skip } = getPaginationParams(query);

    const filter = { claimant: currentUser._id };
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    const [claims, total] = await Promise.all([
      Claim.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'item',
          select: 'title type category location status images owner',
          populate: {
            path: 'owner',
            select: 'name department year profileImage email phone',
          },
        })
        .lean(),
      Claim.countDocuments(filter),
    ]);

    const mapped = claims.map((c) => {
      const id = c._id.toString();
      delete c._id;
      delete c.__v;

      if (c.item && c.item._id) {
        c.item.id = c.item._id.toString();
        delete c.item._id;

        if (c.item.owner && c.item.owner._id) {
          c.item.owner.id = c.item.owner._id.toString();
          delete c.item.owner._id;

          // Privacy rule: reveal contact only if claim is APPROVED
          if (c.status === CLAIM_STATUS.APPROVED) {
            c.contact = {
              name: c.item.owner.name,
              email: c.item.owner.email,
              phone: c.item.owner.phone,
            };
          } else {
            delete c.item.owner.email;
            delete c.item.owner.phone;
            c.contact = null;
          }
        }
      }

      return { id, ...c };
    });

    return formatPaginatedResponse(mapped, total, page, limit);
  },

  /**
   * Update claim status:
   * - Claimant: WITHDRAWN
   * - Item owner / Admin: APPROVED | REJECTED
   */
  updateClaimStatus: async (claimId, { status: newStatus, decisionNote }, currentUser) => {
    if (!mongoose.Types.ObjectId.isValid(claimId)) {
      throw ApiError.notFound('Claim not found');
    }

    const claim = await Claim.findById(claimId).populate('item');
    if (!claim) {
      throw ApiError.notFound('Claim not found');
    }

    // Only PENDING claims can transition. Terminal states are final.
    if (claim.status !== CLAIM_STATUS.PENDING) {
      throw ApiError.conflict(`Cannot transition claim from ${claim.status}. Terminal states are final.`, 'CONFLICT');
    }

    const isClaimant = claim.claimant.toString() === currentUser._id.toString();
    const isOwner = claim.item && claim.item.owner.toString() === currentUser._id.toString();
    const isAdmin = currentUser.role === 'ADMIN';

    // Claimant withdrawal
    if (newStatus === CLAIM_STATUS.WITHDRAWN) {
      if (!isClaimant) {
        throw ApiError.forbidden('Only the claimant can withdraw this claim', 'FORBIDDEN');
      }

      claim.status = CLAIM_STATUS.WITHDRAWN;
      claim.decidedAt = new Date();
      if (decisionNote) claim.decisionNote = decisionNote;
      await claim.save();

      // Notify item owner of withdrawal
      await notificationService.create({
        recipient: claim.item.owner,
        type: NOTIF_TYPE.CLAIM_WITHDRAWN,
        message: `A claim on "${claim.item.title}" was withdrawn by the claimant.`,
        item: claim.item._id,
        link: `/items/${claim.item._id}`,
      });

      return claim.toJSON();
    }

    // Owner / Admin decisions: APPROVED or REJECTED
    if (newStatus === CLAIM_STATUS.APPROVED || newStatus === CLAIM_STATUS.REJECTED) {
      if (!isOwner && !isAdmin) {
        throw ApiError.forbidden('Only the item owner or an admin can decide on claims', 'FORBIDDEN');
      }

      if (newStatus === CLAIM_STATUS.APPROVED) {
        claim.status = CLAIM_STATUS.APPROVED;
        claim.decidedAt = new Date();
        if (decisionNote) claim.decisionNote = decisionNote;
        await claim.save();

        // Approval side effects: item status -> CLAIMED
        await Item.findByIdAndUpdate(claim.item._id, { status: ITEM_STATUS.CLAIMED });

        // Reject all other pending claims on this item
        const otherPendingClaims = await Claim.find({
          item: claim.item._id,
          _id: { $ne: claim._id },
          status: CLAIM_STATUS.PENDING,
        });

        for (const other of otherPendingClaims) {
          other.status = CLAIM_STATUS.REJECTED;
          other.decisionNote = 'Item was claimed by another party';
          other.decidedAt = new Date();
          await other.save();

          await notificationService.create({
            recipient: other.claimant,
            type: NOTIF_TYPE.CLAIM_REJECTED,
            message: `Your claim for "${claim.item.title}" was not accepted. The item has been claimed.`,
            item: claim.item._id,
            link: `/my-claims`,
          });
        }

        // Notify approved claimant
        await notificationService.create({
          recipient: claim.claimant,
          type: NOTIF_TYPE.CLAIM_APPROVED,
          message: `Your claim for "${claim.item.title}" was approved! Contact the finder to coordinate handover.`,
          item: claim.item._id,
          link: `/my-claims`,
        });

        return claim.toJSON();
      }

      if (newStatus === CLAIM_STATUS.REJECTED) {
        claim.status = CLAIM_STATUS.REJECTED;
        claim.decidedAt = new Date();
        if (decisionNote) claim.decisionNote = decisionNote;
        await claim.save();

        // Notify rejected claimant
        await notificationService.create({
          recipient: claim.claimant,
          type: NOTIF_TYPE.CLAIM_REJECTED,
          message: `Your claim for "${claim.item.title}" was not accepted.${decisionNote ? ' Note: ' + decisionNote : ''}`,
          item: claim.item._id,
          link: `/my-claims`,
        });

        return claim.toJSON();
      }
    }

    throw ApiError.badRequest('Invalid claim status transition');
  },
};
