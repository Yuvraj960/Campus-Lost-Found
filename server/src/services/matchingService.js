import { Item } from '../models/Item.js';
import { Match } from '../models/Match.js';
import { matchScorer } from './ai/matchScorer.js';
import { notificationService } from './notificationService.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';
import { ITEM_TYPE, ITEM_STATUS, MATCH_STATUS, NOTIF_TYPE } from '../constants/enums.js';

export const matchingService = {
  /**
   * Runs the matching pipeline for a specific item against active opposite-type candidates.
   * Never throws errors to callers; catches and logs all failures.
   *
   * @param {string} itemId
   * @returns {Promise<{ created: number }>}
   */
  runForItem: async (itemId) => {
    const startTime = Date.now();
    try {
      const source = await Item.findById(itemId);
      if (!source || source.status !== ITEM_STATUS.ACTIVE || source.isRemoved) {
        return { created: 0 };
      }

      const oppositeType = source.type === ITEM_TYPE.LOST ? ITEM_TYPE.FOUND : ITEM_TYPE.LOST;

      // 1. Candidate prefilter query in Mongo
      const sourceDate = new Date(source.date);
      let dateQuery = {};
      if (source.type === ITEM_TYPE.LOST) {
        // Found item date: >= Lost - 1 day, <= Lost + 30 days
        const minFoundDate = new Date(sourceDate.getTime() - 1 * 24 * 60 * 60 * 1000);
        const maxFoundDate = new Date(sourceDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        dateQuery = { date: { $gte: minFoundDate, $lte: maxFoundDate } };
      } else {
        // Lost item date: <= Found + 1 day, >= Found - 30 days
        const minLostDate = new Date(sourceDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        const maxLostDate = new Date(sourceDate.getTime() + 1 * 24 * 60 * 60 * 1000);
        dateQuery = { date: { $gte: minLostDate, $lte: maxLostDate } };
      }

      const categoryFilter =
        source.category === 'OTHER'
          ? {}
          : { category: { $in: [source.category, 'OTHER'] } };

      const candidates = await Item.find({
        _id: { $ne: source._id },
        owner: { $ne: source.owner },
        type: oppositeType,
        status: ITEM_STATUS.ACTIVE,
        isRemoved: { $ne: true },
        ...categoryFilter,
        ...dateQuery,
      }).lean();

      if (candidates.length === 0) {
        logger.info(`Matching for item ${itemId}: 0 prefiltered candidates (${Date.now() - startTime}ms)`);
        return { created: 0 };
      }

      // 2. Rank by heuristic score; keep top 5 with heuristic >= 25
      const rankedCandidates = candidates
        .map((cand) => {
          const h = matchScorer.scoreHeuristic(source, cand);
          return { candidate: cand, heuristicScore: h.score };
        })
        .filter((entry) => entry.heuristicScore >= 25)
        .sort((a, b) => b.heuristicScore - a.heuristicScore)
        .slice(0, 5)
        .map((entry) => entry.candidate);

      if (rankedCandidates.length === 0) {
        logger.info(`Matching for item ${itemId}: ${candidates.length} prefiltered, 0 met heuristic threshold (${Date.now() - startTime}ms)`);
        return { created: 0 };
      }

      // 3. Score candidates with matchScorer (AI with heuristic fallback)
      const scoredResults = await matchScorer.scoreCandidates(source, rankedCandidates);

      let createdCount = 0;
      const candidateMap = new Map(rankedCandidates.map((c) => [c._id.toString(), c]));

      // 4. Persistence & notification
      for (const res of scoredResults) {
        const threshold =
          res.source === 'GEMINI' ? env.MATCH_THRESHOLD : env.FALLBACK_MATCH_THRESHOLD;

        if (res.score >= threshold) {
          const cand = candidateMap.get(res.candidateId);
          if (!cand) continue;

          const isSourceLost = source.type === ITEM_TYPE.LOST;
          const lostItem = isSourceLost ? source : cand;
          const foundItem = isSourceLost ? cand : source;

          const existingMatch = await Match.findOne({
            lostItem: lostItem._id,
            foundItem: foundItem._id,
          });

          await Match.findOneAndUpdate(
            { lostItem: lostItem._id, foundItem: foundItem._id },
            {
              $set: {
                score: res.score,
                reasoning: res.reasoning,
                matchingAttributes: res.matchingAttributes,
                source: res.source,
                status: existingMatch ? existingMatch.status : MATCH_STATUS.SUGGESTED,
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );

          // If this is a new match, notify both owners
          if (!existingMatch) {
            createdCount++;

            // Notify lost item owner
            await notificationService.createNotification({
              recipient: lostItem.owner,
              type: NOTIF_TYPE.MATCH_FOUND,
              message: `Possible match found for "${lostItem.title}"`,
              item: lostItem._id,
              link: `/items/${lostItem._id.toString()}`,
            });

            // Notify found item owner
            await notificationService.createNotification({
              recipient: foundItem.owner,
              type: NOTIF_TYPE.MATCH_FOUND,
              message: `Possible match found for "${foundItem.title}"`,
              item: foundItem._id,
              link: `/items/${foundItem._id.toString()}`,
            });
          }
        }
      }

      logger.info(
        `Matching for item ${itemId}: ${candidates.length} candidates, ${rankedCandidates.length} ranked, ${createdCount} new matches (${Date.now() - startTime}ms)`
      );

      return { created: createdCount };
    } catch (err) {
      logger.error(`Matching error for item ${itemId}: ${err.message}`, { stack: err.stack });
      return { created: 0 };
    }
  },

  /**
   * Retrieves active suggested matches for the authenticated user's items.
   *
   * @param {string} userId
   * @returns {Promise<Array<Object>>}
   */
  getMyMatches: async (userId) => {
    // Find all items owned by user
    const userItems = await Item.find({ owner: userId }).select('_id');
    const userItemIds = userItems.map((i) => i._id);

    if (userItemIds.length === 0) {
      return [];
    }

    const matches = await Match.find({
      $or: [
        { lostItem: { $in: userItemIds } },
        { foundItem: { $in: userItemIds } },
      ],
      status: MATCH_STATUS.SUGGESTED,
    })
      .populate('lostItem', 'title type category location date images status owner')
      .populate('foundItem', 'title type category location date images status owner')
      .sort({ score: -1, createdAt: -1 });

    return matches
      .filter((m) => m.lostItem && m.foundItem)
      .map((m) => {
        const isUserLostOwner = m.lostItem.owner?.toString() === userId.toString();
        const myItemDoc = isUserLostOwner ? m.lostItem : m.foundItem;
        const otherItemDoc = isUserLostOwner ? m.foundItem : m.lostItem;

        return {
          id: m._id.toString(),
          score: m.score,
          reasoning: m.reasoning,
          matchingAttributes: m.matchingAttributes,
          status: m.status,
          source: m.source,
          myItem: {
            id: myItemDoc._id.toString(),
            title: myItemDoc.title,
            type: myItemDoc.type,
            category: myItemDoc.category,
            location: myItemDoc.location,
            date: myItemDoc.date,
            images: myItemDoc.images,
            status: myItemDoc.status,
          },
          otherItem: {
            id: otherItemDoc._id.toString(),
            title: otherItemDoc.title,
            type: otherItemDoc.type,
            category: otherItemDoc.category,
            location: otherItemDoc.location,
            date: otherItemDoc.date,
            images: otherItemDoc.images,
            status: otherItemDoc.status,
          },
        };
      });
  },

  /**
   * Dismisses a suggested match.
   *
   * @param {string} matchId
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  dismissMatch: async (matchId, userId) => {
    const match = await Match.findById(matchId)
      .populate('lostItem', 'owner')
      .populate('foundItem', 'owner');

    if (!match) {
      throw ApiError.notFound('Match not found', 'NOT_FOUND');
    }

    const isOwner =
      match.lostItem?.owner?.toString() === userId.toString() ||
      match.foundItem?.owner?.toString() === userId.toString();

    if (!isOwner) {
      throw ApiError.forbidden('You are not authorized to dismiss this match', 'FORBIDDEN');
    }

    match.status = MATCH_STATUS.DISMISSED;
    await match.save();

    return { id: match._id.toString(), status: match.status };
  },

  /**
   * Re-run matching for a specific item by its owner.
   *
   * @param {string} itemId
   * @param {string} userId
   * @returns {Promise<{ created: number }>}
   */
  rematchItem: async (itemId, userId) => {
    const item = await Item.findById(itemId);
    if (!item) {
      throw ApiError.notFound('Item not found', 'NOT_FOUND');
    }

    if (item.owner.toString() !== userId.toString()) {
      throw ApiError.forbidden('Only the item owner can trigger rematching', 'FORBIDDEN');
    }

    return matchingService.runForItem(itemId);
  },
};
