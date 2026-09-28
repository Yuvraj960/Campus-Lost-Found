import { ApiError } from '../utils/ApiError.js';
import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { USER_STATUS } from '../constants/enums.js';

/**
 * Authentication middleware.
 * Verifies JWT from Authorization header, loads fresh user, and enforces account status.
 */
export const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication required', 'UNAUTHENTICATED');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid or expired authentication token', 'UNAUTHENTICATED');
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      throw ApiError.unauthorized('User not found or session expired', 'UNAUTHENTICATED');
    }

    if (user.status === USER_STATUS.SUSPENDED) {
      throw ApiError.forbidden('Your account has been suspended', 'ACCOUNT_SUSPENDED');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware.
 * Attaches req.user if a valid token is provided, but does not block unauthenticated requests.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.sub);
      if (user && user.status !== USER_STATUS.SUSPENDED) {
        req.user = user;
      }
    } catch {
      // Ignored for optional auth
    }

    next();
  } catch (error) {
    next(error);
  }
};
