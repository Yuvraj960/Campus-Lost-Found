import { ZodSchema } from 'zod';

/**
 * Validation middleware factory for Zod schemas.
 * Supports:
 * - validate(schema, 'body' | 'query' | 'params')
 * - validate({ body?: schema, query?: schema, params?: schema })
 */
export const validate = (schemaOrConfig, defaultProperty = 'body') => (req, res, next) => {
  try {
    if (schemaOrConfig instanceof ZodSchema || (schemaOrConfig && typeof schemaOrConfig.parse === 'function')) {
      req[defaultProperty] = schemaOrConfig.parse(req[defaultProperty]);
      return next();
    }

    if (schemaOrConfig && typeof schemaOrConfig === 'object') {
      const targets = ['body', 'query', 'params'];
      for (const target of targets) {
        if (schemaOrConfig[target]) {
          req[target] = schemaOrConfig[target].parse(req[target]);
        }
      }
      return next();
    }

    next();
  } catch (err) {
    next(err);
  }
};

export const validateBody = (schema) => validate(schema, 'body');
