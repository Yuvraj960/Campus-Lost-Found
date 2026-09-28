import api from './api.js';
import { mockItems } from '../mocks/items.js';
import { mockClaims } from '../mocks/claims.js';
import { mockDelay, checkMockError } from '../mocks/mockUtils.js';

// Items calls the real backend API by default in Phase 4+; falls back to mock if VITE_USE_MOCK_ITEMS === 'true'
const isMock = import.meta.env.VITE_USE_MOCK_ITEMS === 'true';

export const itemService = {
  getItems: async (params = {}) => {
    if (isMock) {
      checkMockError();
      await mockDelay(350);

      const {
        search = '',
        type,
        category,
        location,
        status = 'ACTIVE',
        dateFrom,
        dateTo,
        owner,
        sort = 'newest',
        page = 1,
        limit = 12,
      } = params;

      let filtered = [...mockItems];

      if (status && status !== 'ALL') {
        filtered = filtered.filter((i) => i.status === status);
      }

      if (type) {
        filtered = filtered.filter((i) => i.type.toUpperCase() === type.toUpperCase());
      }

      if (category && category !== 'ALL') {
        filtered = filtered.filter((i) => i.category === category);
      }

      if (location) {
        filtered = filtered.filter((i) =>
          i.location.toLowerCase().includes(location.toLowerCase())
        );
      }

      if (search) {
        const query = search.toLowerCase();
        filtered = filtered.filter(
          (i) =>
            i.title.toLowerCase().includes(query) ||
            i.description.toLowerCase().includes(query) ||
            i.location.toLowerCase().includes(query)
        );
      }

      if (dateFrom) {
        filtered = filtered.filter((i) => new Date(i.date) >= new Date(dateFrom));
      }
      if (dateTo) {
        filtered = filtered.filter((i) => new Date(i.date) <= new Date(dateTo));
      }

      if (owner === 'me') {
        const currentUserId = localStorage.getItem('mock_user_id') || 'user-student-1';
        filtered = filtered.filter((i) => i.owner.id === currentUserId);
      }

      // Sort
      filtered.sort((a, b) => {
        const diff = new Date(b.createdAt) - new Date(a.createdAt);
        return sort === 'oldest' ? -diff : diff;
      });

      const total = filtered.length;
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const totalPages = Math.ceil(total / limitNum) || 1;
      const start = (pageNum - 1) * limitNum;
      const items = filtered.slice(start, start + limitNum);

      return {
        items,
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      };
    }

    const res = await api.get('/items', { params });
    return res.data;
  },

  getItemById: async (id) => {
    if (isMock) {
      checkMockError();
      await mockDelay(300);
      const item = mockItems.find((i) => i.id === id);
      if (!item) {
        const err = new Error('Item not found');
        err.code = 'NOT_FOUND';
        throw err;
      }

      const currentUserId = localStorage.getItem('mock_user_id') || 'user-student-1';
      const isOwner = item.owner.id === currentUserId;
      const myClaim = mockClaims.find((c) => c.item?.id === id && c.claimant?.id === currentUserId);

      return {
        ...item,
        claimCount: isOwner ? mockClaims.filter((c) => c.item?.id === id).length : undefined,
        myClaim: myClaim || null,
        possibleMatches: isOwner ? 1 : 0,
      };
    }

    const res = await api.get(`/items/${id}`);
    return res.data;
  },

  createItem: async (itemData) => {
    if (isMock) {
      checkMockError();
      await mockDelay(500);
      const currentUserId = localStorage.getItem('mock_user_id') || 'user-student-1';
      const newItem = {
        id: `item-${Date.now()}`,
        title: itemData.get ? itemData.get('title') : itemData.title,
        description: itemData.get ? itemData.get('description') : itemData.description,
        category: itemData.get ? itemData.get('category') : itemData.category,
        type: itemData.get ? itemData.get('type') : itemData.type,
        location: itemData.get ? itemData.get('location') : itemData.location,
        date: itemData.get ? itemData.get('date') : itemData.date,
        contactPreference: (itemData.get ? itemData.get('contactPreference') : itemData.contactPreference) || 'IN_APP',
        images: [
          { url: 'https://picsum.photos/seed/newmock/600/400', publicId: 'mock/new' }
        ],
        status: 'ACTIVE',
        owner: {
          id: currentUserId,
          name: 'John Doe',
          department: 'Computer Science',
          year: 3,
        },
        isFlagged: false,
        isRemoved: false,
        createdAt: new Date().toISOString(),
      };
      mockItems.unshift(newItem);
      return newItem;
    }

    const res = await api.post('/items', itemData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  updateItem: async (id, itemData) => {
    if (isMock) {
      checkMockError();
      await mockDelay(400);
      const idx = mockItems.findIndex((i) => i.id === id);
      if (idx === -1) throw new Error('Item not found');
      mockItems[idx] = { ...mockItems[idx], ...itemData };
      return mockItems[idx];
    }
    const res = await api.put(`/items/${id}`, itemData);
    return res.data;
  },

  updateItemStatus: async (id, status) => {
    if (isMock) {
      checkMockError();
      await mockDelay(350);
      const idx = mockItems.findIndex((i) => i.id === id);
      if (idx === -1) throw new Error('Item not found');
      mockItems[idx].status = status;
      if (status === 'RESOLVED') {
        mockItems[idx].resolvedAt = new Date().toISOString();
      }
      return mockItems[idx];
    }
    const res = await api.patch(`/items/${id}/status`, { status });
    return res.data;
  },

  deleteItem: async (id) => {
    if (isMock) {
      checkMockError();
      await mockDelay(300);
      const idx = mockItems.findIndex((i) => i.id === id);
      if (idx !== -1) mockItems.splice(idx, 1);
      return {};
    }
    const res = await api.delete(`/items/${id}`);
    return res.data;
  },

  getItemClaims: async (id) => {
    if (isMock) {
      checkMockError();
      await mockDelay(300);
      return mockClaims.filter((c) => c.item?.id === id);
    }
    const res = await api.get(`/items/${id}/claims`);
    return res.data;
  },

  rematchItem: async (id) => {
    if (isMock) {
      await mockDelay(600);
      return { created: 1 };
    }
    const res = await api.post(`/items/${id}/rematch`);
    return res.data;
  },
};
