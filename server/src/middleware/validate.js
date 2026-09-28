/**
 * Validation middleware factory for Zod schemas
 * Validates request body, query, or params.
 */
export const validate = (schema, property = 'body') => (req, res, next) => {
  try {
    const parsed = schema.parse(req[property]);
    req[property] = parsed;
    next();
  } catch (err) {
    next(err);
  }
};
