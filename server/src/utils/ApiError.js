/**
 * Custom application error with HTTP status code, standardized error code, and optional details.
 */
export class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = null, code = 'VALIDATION_ERROR') {
    return new ApiError(400, code, message, details);
  }

  static unauthorized(message = 'Unauthenticated', code = 'UNAUTHENTICATED') {
    return new ApiError(401, code, message);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
    return new ApiError(403, code, message);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
    return new ApiError(404, code, message);
  }

  static conflict(message, code = 'CONFLICT') {
    return new ApiError(409, code, message);
  }

  static rateLimited(message = 'Too many requests, please try again later', code = 'RATE_LIMITED') {
    return new ApiError(429, code, message);
  }

  static internal(message = 'Internal server error', code = 'SERVER_ERROR') {
    return new ApiError(500, code, message);
  }
}
