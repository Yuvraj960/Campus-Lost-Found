import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Generate a JWT token containing sub and role in payload.
 * @param {object} user - Mongoose user document or user plain object with _id and role.
 * @returns {string} Signed JWT token.
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      sub: user._id ? user._id.toString() : user.id,
      role: user.role,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
      algorithm: 'HS256',
    }
  );
};

/**
 * Verify a JWT token and return the decoded payload.
 * @param {string} token
 * @returns {object} Decoded token payload.
 */
export const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET, {
    algorithms: ['HS256'],
  });
};
