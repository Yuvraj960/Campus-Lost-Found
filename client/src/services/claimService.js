import api from './api.js';
import { mockClaims } from '../mocks/claims.js';
import { mockItems } from '../mocks/items.js';
import { mockDelay, checkMockError } from '../mocks/mockUtils.js';

// Claims calls real API by default in Phase 5+; falls back to mock if VITE_USE_MOCK_CLAIMS === 'true'
const isMock = import.meta.env.VITE_USE_MOCK_CLAIMS === 'true';

export const claimService = {
  createClaim: async ({ itemId, message, proof }) => {
    if (isMock) {
      checkMockError();
      await mockDelay(400);
      const currentUserId = localStorage.getItem('mock_user_id') || 'user-student-1';
      const item = mockItems.find((i) => i.id === itemId);
      if (!item) throw new Error('Item not found');

      const newClaim = {
        id: `claim-${Date.now()}`,
        item: {
          id: item.id,
          title: item.title,
          type: item.type,
          category: item.category,
          location: item.location,
          status: item.status,
          owner: item.owner,
        },
        claimant: {
          id: currentUserId,
          name: 'John Doe',
          department: 'Computer Science',
          year: 3,
        },
        message,
        proof,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      mockClaims.unshift(newClaim);
      return newClaim;
    }
    const res = await api.post('/claims', { itemId, message, proof });
    return res.data;
  },

  getMyClaims: async (params = {}) => {
    if (isMock) {
      checkMockError();
      await mockDelay(350);
      const currentUserId = localStorage.getItem('mock_user_id') || 'user-student-1';
      const filtered = mockClaims.filter((c) => c.claimant.id === currentUserId);
      return {
        items: filtered,
        page: 1,
        limit: 12,
        total: filtered.length,
        totalPages: 1,
      };
    }
    const res = await api.get('/claims/my', { params });
    return res.data;
  },

  updateClaimStatus: async (id, { status, decisionNote }) => {
    if (isMock) {
      checkMockError();
      await mockDelay(400);
      const idx = mockClaims.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error('Claim not found');
      mockClaims[idx].status = status;
      mockClaims[idx].decisionNote = decisionNote;
      mockClaims[idx].decidedAt = new Date().toISOString();

      if (status === 'APPROVED' && mockClaims[idx].item?.id) {
        const itemIdx = mockItems.findIndex((i) => i.id === mockClaims[idx].item.id);
        if (itemIdx !== -1) {
          mockItems[itemIdx].status = 'CLAIMED';
        }
      }
      return mockClaims[idx];
    }
    const res = await api.patch(`/claims/${id}`, { status, decisionNote });
    return res.data;
  },
};
