import { reportService } from '../services/reportService.js';
import { successResponse } from '../utils/response.js';

export const reportController = {
  createReport: async (req, res, next) => {
    try {
      const report = await reportService.createReport(req.body, req.user._id);
      return successResponse(res, report, 201, 'Listing reported for moderation review');
    } catch (err) {
      next(err);
    }
  },
};
