import api from './api.js';
import { mockAdminStats } from '../mocks/stats.js';
import { mockUsers } from '../mocks/users.js';
import { mockItems } from '../mocks/items.js';
import { mockClaims } from '../mocks/claims.js';
import { mockDelay, checkMockError } from '../mocks/mockUtils.js';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

export const adminService = {
  getStats: async () => {
    if (isMock) {
      checkMockError();
      await mockDelay(350);
      return mockAdminStats;
    }
    const res = await api.get('/admin/stats');
    return res.data;
  },

  getUsers: async (params = {}) => {
    if (isMock) {
      checkMockError();
      await mockDelay(300);
      let list = [...mockUsers];
      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
      }
      return { items: list, page: 1, limit: 10, total: list.length, totalPages: 1 };
    }
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  updateUserStatus: async (id, status) => {
    if (isMock) {
      await mockDelay(250);
      const user = mockUsers.find((u) => u.id === id);
      if (user) user.status = status;
      return user;
    }
    const res = await api.patch(`/admin/users/${id}/status`, { status });
    return res.data;
  },

  deleteUser: async (id) => {
    if (isMock) {
      await mockDelay(300);
      const idx = mockUsers.findIndex((u) => u.id === id);
      if (idx !== -1) mockUsers.splice(idx, 1);
      return {};
    }
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },

  getItems: async (params = {}) => {
    if (isMock) {
      await mockDelay(300);
      let list = [...mockItems];
      if (params.type) list = list.filter((i) => i.type === params.type);
      if (params.status) list = list.filter((i) => i.status === params.status);
      return { items: list, page: 1, limit: 10, total: list.length, totalPages: 1 };
    }
    const res = await api.get('/admin/items', { params });
    return res.data;
  },

  updateItem: async (id, updates) => {
    if (isMock) {
      await mockDelay(250);
      const item = mockItems.find((i) => i.id === id);
      if (item) Object.assign(item, updates);
      return item;
    }
    const res = await api.patch(`/admin/items/${id}`, updates);
    return res.data;
  },

  getClaims: async (params = {}) => {
    if (isMock) {
      await mockDelay(300);
      let list = [...mockClaims];
      if (params.status) list = list.filter((c) => c.status === params.status);
      return { items: list, page: 1, limit: 10, total: list.length, totalPages: 1 };
    }
    const res = await api.get('/admin/claims', { params });
    return res.data;
  },

  getReports: async () => {
    if (isMock) {
      await mockDelay(300);
      return {
        items: [
          {
            id: 'rep-1',
            item: mockItems[0],
            reporter: mockUsers[2],
            reason: 'SPAM',
            details: 'Suspected duplicate entry.',
            status: 'PENDING',
            createdAt: '2026-09-24T10:00:00.000Z',
          },
        ],
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      };
    }
    const res = await api.get('/admin/reports');
    return res.data;
  },

  updateReport: async (id, updates) => {
    if (isMock) {
      await mockDelay(250);
      return { id, ...updates };
    }
    const res = await api.patch(`/admin/reports/${id}`, updates);
    return res.data;
  },
};
