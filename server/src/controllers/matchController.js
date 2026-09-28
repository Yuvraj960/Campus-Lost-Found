import { matchingService } from '../services/matchingService.js';
import { successResponse } from '../utils/response.js';

export const matchController = {
  getMyMatches: async (req, res, next) => {
    try {
      const matches = await matchingService.getMyMatches(req.user._id);
      return successResponse(res, matches);
    } catch (err) {
      next(err);
    }
  },

  dismissMatch: async (req, res, next) => {
    try {
      const result = await matchingService.dismissMatch(req.params.id, req.user._id);
      return successResponse(res, result, 200, 'Match dismissed');
    } catch (err) {
      next(err);
    }
  },
};
