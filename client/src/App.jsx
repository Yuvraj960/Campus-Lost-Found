import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';

// Layouts
import PublicLayout from './layouts/PublicLayout.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';

// Guards
import { ProtectedRoute, AdminRoute, GuestRoute } from './routes/guards.jsx';

// Public & Student Pages
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import BrowseItems from './pages/BrowseItems.jsx';
import ItemDetails from './pages/ItemDetails.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ReportItem from './pages/ReportItem.jsx';
import EditItem from './pages/EditItem.jsx';
import MyReports from './pages/MyReports.jsx';
import MyClaims from './pages/MyClaims.jsx';
import Matches from './pages/Matches.jsx';
import Notifications from './pages/Notifications.jsx';
import Profile from './pages/Profile.jsx';
import NotFound from './pages/NotFound.jsx';

// Admin Pages
import AdminOverview from './pages/admin/AdminOverview.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminItems from './pages/admin/AdminItems.jsx';
import AdminClaims from './pages/admin/AdminClaims.jsx';
import AdminReports from './pages/admin/AdminReports.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: '1rem',
              background: '#0f172a',
              color: '#fff',
              fontSize: '0.875rem',
            },
          }}
        />
        <Routes>
          {/* Public Routes with Navbar & Footer */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/lost" element={<BrowseItems defaultType="LOST" />} />
            <Route path="/found" element={<BrowseItems defaultType="FOUND" />} />
            <Route path="/items/:id" element={<ItemDetails />} />
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <Login />
                </GuestRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestRoute>
                  <Register />
                </GuestRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Student App Routes with Sidebar */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/report/lost" element={<ReportItem forcedType="LOST" />} />
            <Route path="/report/found" element={<ReportItem forcedType="FOUND" />} />
            <Route path="/items/:id/edit" element={<EditItem />} />
            <Route path="/my-reports" element={<MyReports />} />
            <Route path="/my-claims" element={<MyClaims />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Admin Routes with Dark Admin Sidebar */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="items" element={<AdminItems />} />
            <Route path="claims" element={<AdminClaims />} />
            <Route path="reports" element={<AdminReports />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
