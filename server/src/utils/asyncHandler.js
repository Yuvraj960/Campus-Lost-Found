/**
 * Wraps an async route handler to forward unhandled rejections to next()
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
