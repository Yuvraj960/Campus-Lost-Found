import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

export const devUserMiddleware = async (req, _res, next) => {
  // Only execute if running in dev/test and database is connected
  if ((env.NODE_ENV === 'development' || env.NODE_ENV === 'test') && mongoose.connection.readyState === 1) {
    const devUserId = req.headers['x-dev-user'];
    if (devUserId && mongoose.Types.ObjectId.isValid(devUserId)) {
      try {
        const user = await User.findById(devUserId);
        if (user) {
          req.user = user;
        }
      } catch {
        // Ignore
      }
    }
    // Fallback: pick active user if one exists
    if (!req.user) {
      try {
        const defaultUser = await User.findOne({ status: 'ACTIVE' });
        if (defaultUser) {
          req.user = defaultUser;
        }
      } catch {
        // Ignore
      }
    }
  }
  next();
};
