import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { BarChart3, Users, Package, FileCheck2, AlertTriangle, ArrowLeft, X } from 'lucide-react';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const adminNav = [
    { name: 'Overview', path: '/admin', icon: BarChart3, end: true },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Item Listings', path: '/admin/items', icon: Package },
    { name: 'Claims Moderation', path: '/admin/claims', icon: FileCheck2 },
    { name: 'Abuse Reports', path: '/admin/reports', icon: AlertTriangle },
  ];

  const adminSidebar = (
    <div className="flex flex-col h-full bg-slate-900 text-white w-64 p-4">
      <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-800">
        <span className="font-heading font-extrabold text-xs text-indigo-400 uppercase tracking-widest">
          Admin Portal
        </span>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="space-y-1.5 flex-1">
        {adminNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-slate-800">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Student App
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
          {adminSidebar}
        </aside>

        {/* Mobile Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 max-w-full flex z-50">{adminSidebar}</div>
          </div>
        )}

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
