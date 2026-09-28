import { adminService } from '../services/adminService.js';
import { reportService } from '../services/reportService.js';
import { successResponse } from '../utils/response.js';

export const adminController = {
  getStats: async (req, res, next) => {
    try {
      const stats = await adminService.getStats();
      return successResponse(res, stats);
    } catch (err) {
      next(err);
    }
  },

  getUsers: async (req, res, next) => {
    try {
      const users = await adminService.getUsers(req.query);
      return successResponse(res, users);
    } catch (err) {
      next(err);
    }
  },

  updateUserStatus: async (req, res, next) => {
    try {
      const user = await adminService.updateUserStatus(
        req.params.id,
        req.body.status,
        req.user._id
      );
      return successResponse(res, user, 200, `User status updated to ${req.body.status}`);
    } catch (err) {
      next(err);
    }
  },

  deleteUser: async (req, res, next) => {
    try {
      const result = await adminService.deleteUser(req.params.id, req.user._id);
      return successResponse(res, result, 200, 'User and all associated data deleted successfully');
    } catch (err) {
      next(err);
    }
  },

  getItems: async (req, res, next) => {
    try {
      const items = await adminService.getItems(req.query);
      return successResponse(res, items);
    } catch (err) {
      next(err);
    }
  },

  updateItem: async (req, res, next) => {
    try {
      const item = await adminService.updateItem(req.params.id, req.body);
      return successResponse(res, item, 200, 'Item moderation flags updated');
    } catch (err) {
      next(err);
    }
  },

  getClaims: async (req, res, next) => {
    try {
      const claims = await adminService.getClaims(req.query);
      return successResponse(res, claims);
    } catch (err) {
      next(err);
    }
  },

  getReports: async (req, res, next) => {
    try {
      const reports = await reportService.getReports(req.query);
      return successResponse(res, reports);
    } catch (err) {
      next(err);
    }
  },

  updateReport: async (req, res, next) => {
    try {
      const report = await reportService.updateReport(req.params.id, req.body, req.user._id);
      return successResponse(res, report, 200, 'Report status updated');
    } catch (err) {
      next(err);
    }
  },
};
