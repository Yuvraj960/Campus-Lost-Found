import { assistService } from '../services/ai/assistService.js';
import { successResponse } from '../utils/response.js';

export const aiController = {
  assist: async (req, res, next) => {
    try {
      const suggestions = await assistService.suggestFromDescription(req.body.text);
      return successResponse(res, suggestions);
    } catch (err) {
      next(err);
    }
  },
};
