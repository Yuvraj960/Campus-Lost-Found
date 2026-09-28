import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute, AdminRoute, GuestRoute } from '../guards.jsx';
import * as AuthContextModule from '../../context/AuthContext.jsx';

describe('Route Guards', () => {
  const mockUseAuth = (authValues) => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(authValues);
  };

  describe('ProtectedRoute', () => {
    it('redirects unauthenticated user to /login with redirect query', () => {
      mockUseAuth({ isAuthenticated: false, loading: false, user: null });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Secret Dashboard</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByText('Secret Dashboard')).not.toBeInTheDocument();
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('renders children when user is authenticated', () => {
      mockUseAuth({ isAuthenticated: true, loading: false, user: { name: 'Student' } });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Secret Dashboard</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Secret Dashboard')).toBeInTheDocument();
    });
  });

  describe('AdminRoute', () => {
    it('redirects unauthenticated user to /login', () => {
      mockUseAuth({ isAuthenticated: false, isAdmin: false, loading: false, user: null });

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <div>Admin Panel</div>
                </AdminRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('redirects non-admin authenticated student to /dashboard', () => {
      mockUseAuth({ isAuthenticated: true, isAdmin: false, loading: false, user: { role: 'STUDENT' } });

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <div>Admin Panel</div>
                </AdminRoute>
              }
            />
            <Route path="/dashboard" element={<div>Student Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
      expect(screen.getByText('Student Dashboard')).toBeInTheDocument();
    });

    it('renders children when user is an administrator', () => {
      mockUseAuth({ isAuthenticated: true, isAdmin: true, loading: false, user: { role: 'ADMIN' } });

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <div>Admin Panel</div>
                </AdminRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });
  });

  describe('GuestRoute', () => {
    it('redirects authenticated user to /dashboard', () => {
      mockUseAuth({ isAuthenticated: true, loading: false, user: { name: 'Student' } });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <div>Login Page</div>
                </GuestRoute>
              }
            />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders children when user is not authenticated', () => {
      mockUseAuth({ isAuthenticated: false, loading: false, user: null });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <div>Login Page</div>
                </GuestRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });
});
