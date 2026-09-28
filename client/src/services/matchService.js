import api from './api.js';
import { mockMatches } from '../mocks/matches.js';
import { mockDelay, checkMockError } from '../mocks/mockUtils.js';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

export const matchService = {
  getMyMatches: async () => {
    if (isMock) {
      checkMockError();
      await mockDelay(300);
      return mockMatches.filter((m) => m.status === 'SUGGESTED');
    }
    const res = await api.get('/matches/my');
    return res.data;
  },

  dismissMatch: async (id) => {
    if (isMock) {
      checkMockError();
      await mockDelay(250);
      const match = mockMatches.find((m) => m.id === id);
      if (match) match.status = 'DISMISSED';
      return match;
    }
    const res = await api.patch(`/matches/${id}`, { status: 'DISMISSED' });
    return res.data;
  },

  rematchItem: async (itemId) => {
    if (isMock) {
      checkMockError();
      await mockDelay(350);
      return { created: 1 };
    }
    const res = await api.post(`/items/${itemId}/rematch`);
    return res.data;
  },
};
