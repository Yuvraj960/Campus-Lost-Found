import { Report } from '../models/Report.js';
import { Item } from '../models/Item.js';
import { ApiError } from '../utils/ApiError.js';
import { getPaginationParams, formatPaginatedResponse } from '../utils/pagination.js';

export const reportService = {
  /**
   * Submit an abuse report for an item listing.
   *
   * @param {Object} reportData
   * @param {string} reportData.itemId
   * @param {string} reportData.reason
   * @param {string} [reportData.details]
   * @param {string} reporterId
   * @returns {Promise<Object>}
   */
  createReport: async ({ itemId, reason, details }, reporterId) => {
    const item = await Item.findById(itemId);
    if (!item) {
      throw ApiError.notFound('Item not found', 'NOT_FOUND');
    }

    const existingReport = await Report.findOne({ item: itemId, reporter: reporterId });
    if (existingReport) {
      throw ApiError.conflict('You have already reported this listing', 'CONFLICT');
    }

    const report = await Report.create({
      item: itemId,
      reporter: reporterId,
      reason,
      details,
    });

    // Automatically flag item for moderation review
    await Item.findByIdAndUpdate(itemId, { $set: { isFlagged: true } });

    return report;
  },

  /**
   * Get paginated reports for admin review.
   *
   * @param {Object} query
   * @returns {Promise<Object>}
   */
  getReports: async (query = {}) => {
    const { page, limit, skip } = getPaginationParams(query);
    const filter = {};

    if (query.status) {
      filter.status = query.status;
    }

    const [items, total] = await Promise.all([
      Report.find(filter)
        .populate('item', 'title type category location status isFlagged isRemoved images owner')
        .populate('reporter', 'name email department year studentId')
        .populate('resolvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Report.countDocuments(filter),
    ]);

    return formatPaginatedResponse(items, total, page, limit);
  },

  /**
   * Update report status and resolution note.
   *
   * @param {string} reportId
   * @param {Object} updates
   * @param {string} adminId
   * @returns {Promise<Object>}
   */
  updateReport: async (reportId, updates, adminId) => {
    const report = await Report.findById(reportId);
    if (!report) {
      throw ApiError.notFound('Report not found', 'NOT_FOUND');
    }

    if (updates.status !== undefined) {
      report.status = updates.status;
    }
    if (updates.resolutionNote !== undefined) {
      report.resolutionNote = updates.resolutionNote;
    }
    report.resolvedBy = adminId;

    await report.save();
    return report;
  },
};
