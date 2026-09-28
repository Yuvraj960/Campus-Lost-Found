import api from './api.js';

export const reportService = {
  /**
   * Submit an abuse/fraud report for a listing.
   *
   * @param {Object} data
   * @param {string} data.itemId
   * @param {string} data.reason
   * @param {string} [data.details]
   * @returns {Promise<Object>}
   */
  createReport: async (data) => {
    const res = await api.post('/reports', data);
    return res.data;
  },
};
