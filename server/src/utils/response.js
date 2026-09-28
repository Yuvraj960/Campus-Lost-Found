/**
 * Standard API response envelope helpers
 */
export const successResponse = (res, data, statusCode = 200, message = undefined) => {
  const payload = { success: true, data };
  if (message) {
    payload.message = message;
  }
  return res.status(statusCode).json(payload);
};

export const errorResponse = (res, statusCode, code, message, details = undefined) => {
  const errorObj = { code, message };
  if (details !== undefined && details !== null) {
    errorObj.details = details;
  }
  return res.status(statusCode).json({
    success: false,
    error: errorObj,
  });
};
