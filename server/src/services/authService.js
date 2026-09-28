import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { generateToken } from '../utils/jwt.js';
import { env } from '../config/env.js';
import { ROLE, USER_STATUS } from '../constants/enums.js';

export const authService = {
  /**
   * Register a new student user.
   */
  register: async (userData) => {
    const { name, email, password, studentId, department, year, phone } = userData;

    // Optional email domain restriction
    if (env.ALLOWED_EMAIL_DOMAIN) {
      const allowedDomain = env.ALLOWED_EMAIL_DOMAIN.startsWith('@')
        ? env.ALLOWED_EMAIL_DOMAIN
        : `@${env.ALLOWED_EMAIL_DOMAIN}`;
      if (!email.endsWith(allowedDomain)) {
        throw ApiError.forbidden(`Registration is restricted to ${allowedDomain} email addresses`, 'FORBIDDEN');
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError.conflict('An account with this email already exists', 'CONFLICT');
    }

    const user = await User.create({
      name,
      email,
      password,
      role: ROLE.STUDENT,
      status: USER_STATUS.ACTIVE,
      studentId: studentId || undefined,
      department: department || undefined,
      year: year || undefined,
      phone: phone || undefined,
    });

    const token = generateToken(user);

    return {
      user,
      token,
    };
  },

  /**
   * Log in an existing user.
   */
  login: async ({ email, password }) => {
    // Select password because schema has select: false
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password', 'UNAUTHENTICATED');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password', 'UNAUTHENTICATED');
    }

    if (user.status === USER_STATUS.SUSPENDED) {
      throw ApiError.forbidden('Your account has been suspended. Please contact campus admin.', 'ACCOUNT_SUSPENDED');
    }

    const token = generateToken(user);

    return {
      user,
      token,
    };
  },

  /**
   * Get current authenticated user details.
   */
  getMe: async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', 'NOT_FOUND');
    }
    if (user.status === USER_STATUS.SUSPENDED) {
      throw ApiError.forbidden('Your account has been suspended', 'ACCOUNT_SUSPENDED');
    }
    return { user };
  },

  /**
   * Update profile fields of current authenticated user.
   */
  updateMe: async (userId, updates) => {
    const allowedUpdates = ['name', 'department', 'year', 'phone', 'studentId', 'profileImage'];
    const filteredUpdates = {};
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    const user = await User.findByIdAndUpdate(userId, { $set: filteredUpdates }, { new: true, runValidators: true });
    if (!user) {
      throw ApiError.notFound('User not found', 'NOT_FOUND');
    }

    return { user };
  },
};
