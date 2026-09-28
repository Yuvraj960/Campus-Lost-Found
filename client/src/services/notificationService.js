import api from './api.js';
import { mockNotifications } from '../mocks/notifications.js';
import { mockDelay, checkMockError } from '../mocks/mockUtils.js';
// Notifications calls real API by default in Phase 5+; falls back to mock if VITE_USE_MOCK_NOTIFS === 'true'
const isMock = import.meta.env.VITE_USE_MOCK_NOTIFS === 'true';

export const notificationService = {
  getNotifications: async (params = {}) => {
    if (isMock) {
      checkMockError();
      await mockDelay(300);
      let list = [...mockNotifications];
      if (params.unread) {
        list = list.filter((n) => !n.read);
      }
      return {
        items: list,
        page: 1,
        limit: 20,
        total: list.length,
        totalPages: 1,
      };
    }
    const res = await api.get('/notifications', { params });
    return res.data;
  },

  getUnreadCount: async () => {
    if (isMock) {
      return { count: mockNotifications.filter((n) => !n.read).length };
    }
    const res = await api.get('/notifications/unread-count');
    return res.data;
  },

  markAsRead: async (id) => {
    if (isMock) {
      const notif = mockNotifications.find((n) => n.id === id);
      if (notif) notif.read = true;
      return notif;
    }
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    if (isMock) {
      mockNotifications.forEach((n) => {
        n.read = true;
      });
      return { count: mockNotifications.length };
    }
    const res = await api.patch('/notifications/read-all');
    return res.data;
  },
};
