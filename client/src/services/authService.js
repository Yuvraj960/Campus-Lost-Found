import api from './api.js';
import { mockUsers } from '../mocks/users.js';
import { mockDelay, checkMockError } from '../mocks/mockUtils.js';
// Auth calls the real API by default in Phase 3+; falls back to mock if VITE_USE_MOCK_AUTH === 'true'
const isMock = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

export const authService = {
  login: async ({ email, password }) => {
    if (isMock) {
      checkMockError();
      await mockDelay(400);
      const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        const error = new Error('Invalid email or password');
        error.code = 'UNAUTHENTICATED';
        throw error;
      }
      const token = `mock-token-${user.id}-${Date.now()}`;
      localStorage.setItem('token', token);
      localStorage.setItem('mock_user_id', user.id);
      return { user, token };
    }
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.token) {
      localStorage.setItem('token', res.data.token);
    }
    return res.data;
  },

  register: async (data) => {
    if (isMock) {
      checkMockError();
      await mockDelay(450);
      const existing = mockUsers.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
      if (existing) {
        const error = new Error('User with this email already exists');
        error.code = 'CONFLICT';
        throw error;
      }
      const newUser = {
        id: `user-${Date.now()}`,
        name: data.name,
        email: data.email,
        studentId: data.studentId || '',
        department: data.department || '',
        year: data.year ? Number(data.year) : null,
        phone: '',
        role: 'STUDENT',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      mockUsers.push(newUser);
      const token = `mock-token-${newUser.id}-${Date.now()}`;
      localStorage.setItem('token', token);
      localStorage.setItem('mock_user_id', newUser.id);
      return { user: newUser, token };
    }
    const res = await api.post('/auth/register', data);
    if (res.data?.token) {
      localStorage.setItem('token', res.data.token);
    }
    return res.data;
  },

  getMe: async () => {
    if (isMock) {
      checkMockError();
      await mockDelay(250);
      const userId = localStorage.getItem('mock_user_id') || 'user-student-1';
      const user = mockUsers.find((u) => u.id === userId) || mockUsers[1];
      return { user };
    }
    const res = await api.get('/auth/me');
    return res.data;
  },

  updateMe: async (updates) => {
    if (isMock) {
      checkMockError();
      await mockDelay(350);
      const userId = localStorage.getItem('mock_user_id') || 'user-student-1';
      const userIdx = mockUsers.findIndex((u) => u.id === userId);
      if (userIdx !== -1) {
        const parsed = updates instanceof FormData ? Object.fromEntries(updates.entries()) : updates;
        mockUsers[userIdx] = { ...mockUsers[userIdx], ...parsed };
        return { user: mockUsers[userIdx] };
      }
      return { user: mockUsers[1] };
    }
    const headers = updates instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    const res = await api.patch('/auth/me', updates, { headers });
    return res.data;
  },

  logout: async () => {
    if (isMock) {
      localStorage.removeItem('token');
      localStorage.removeItem('mock_user_id');
      return {};
    }
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
    }
    return {};
  },
};
