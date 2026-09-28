import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationBell from './NotificationBell.jsx';
import { Menu, X, PlusCircle, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import Button from './ui/Button.jsx';

export default function Navbar({ onToggleSidebar }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Lost Items', path: '/lost' },
    { name: 'Found Items', path: '/found' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: Brand & Sidebar toggle (if provided) */}
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                aria-label="Toggle navigation drawer"
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <Link to="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold tracking-tight shadow-xs">
                CL
              </div>
              <span className="font-heading font-extrabold text-lg text-slate-900 tracking-tight hidden sm:inline-block">
                Campus <span className="text-indigo-600">Lost &amp; Found</span>
              </span>
            </Link>
          </div>

          {/* Center: Browse Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-semibold transition-colors ${
                  location.pathname === link.path
                    ? 'text-indigo-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/report/lost" className="hidden sm:inline-flex">
                  <Button size="sm" variant="lost" className="shadow-2xs">
                    <PlusCircle className="w-4 h-4" />
                    Report Lost
                  </Button>
                </Link>

                <Link to="/report/found" className="hidden sm:inline-flex">
                  <Button size="sm" variant="found" className="shadow-2xs">
                    <PlusCircle className="w-4 h-4" />
                    Report Found
                  </Button>
                </Link>

                <NotificationBell />

                {/* User menu */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                    title="Go to Dashboard"
                  >
                    <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs overflow-hidden">
                      {user?.profileImage?.url ? (
                        <img src={user.profileImage.url} alt={user.name} className="h-full w-full object-cover" />
                      ) : (
                        user?.name?.charAt(0) || 'U'
                      )}
                    </div>
                    <span className="hidden xl:inline-block text-xs font-semibold text-slate-700 truncate max-w-[100px]">
                      {user?.name?.split(' ')[0]}
                    </span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                      title="Admin Dashboard"
                    >
                      <Shield className="w-4 h-4" />
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    aria-label="Sign out"
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger (for public layout without sidebar) */}
            {!onToggleSidebar && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile dropdown menu (public pages) */}
        {!onToggleSidebar && mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 space-y-2 animate-in slide-in-from-top-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {link.name}
              </Link>
            ))}
            {isAuthenticated ? (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                  Dashboard
                </Link>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link to="/report/lost" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="lost" size="sm" className="w-full">
                      Lost Item
                    </Button>
                  </Link>
                  <Link to="/report/found" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="found" size="sm" className="w-full">
                      Found Item
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
