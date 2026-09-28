import { ApiError } from '../utils/ApiError.js';

/**
 * Role-based authorization middleware.
 * @param  {...string} roles - Allowed roles (e.g. 'ADMIN')
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required', 'UNAUTHENTICATED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Access denied. Insufficient permissions.', 'FORBIDDEN'));
    }

    next();
  };
};
