import { authService } from '../services/authService.js';

export const authController = {
  register: async (req, res, next) => {
    try {
      const data = await authService.register(req.body);
      res.status(201).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const data = await authService.login(req.body);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  getMe: async (req, res, next) => {
    try {
      const data = await authService.getMe(req.user._id);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  updateMe: async (req, res, next) => {
    try {
      const data = await authService.updateMe(req.user._id, req.body);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  logout: async (req, res) => {
    // Stateless logout
    res.status(200).json({
      success: true,
      data: {},
      message: 'Logged out successfully',
    });
  },
};
