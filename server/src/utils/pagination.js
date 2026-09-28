/**
 * Standard pagination helper capping limit to 50 and formatting page parameters.
 */
export const getPaginationParams = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 12));
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};

export const formatPaginatedResponse = (items, total, page, limit) => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    items,
    page,
    limit,
    total,
    totalPages,
  };
};
