import api from './api.js';

export const aiService = {
  /**
   * Request AI description assistance to extract title, category, keywords, etc.
   *
   * @param {{ text: string }} payload
   * @returns {Promise<{ suggestedTitle: string, category: string, keywords: string[], likelyLocations: string[], clarifyingQuestions: string[] }>}
   */
  getAssist: async ({ text }) => {
    const res = await api.post('/ai/assist', { text });
    return res.data;
  },
};
