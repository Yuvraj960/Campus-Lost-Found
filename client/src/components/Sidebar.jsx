import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  FolderOpen,
  FileCheck2,
  Sparkles,
  Bell,
  User,
  X,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Report Lost', path: '/report/lost', icon: PlusCircle, color: 'text-rose-500' },
    { name: 'Report Found', path: '/report/found', icon: PlusCircle, color: 'text-emerald-500' },
    { name: 'My Reports', path: '/my-reports', icon: FolderOpen },
    { name: 'My Claims', path: '/my-claims', icon: FileCheck2 },
    { name: 'Matches', path: '/matches', icon: Sparkles, color: 'text-purple-500' },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64 p-4">
      {/* Drawer close header for mobile */}
      <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100 lg:hidden">
        <span className="font-heading font-bold text-sm text-slate-900 uppercase tracking-wider">
          Navigation
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sidebar"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className={`w-4 h-4 shrink-0 ${item.color || ''}`} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* University banner in sidebar */}
      <div className="mt-auto p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-2xs text-slate-500">
        <p className="font-semibold text-slate-700">Campus Trust Network</p>
        <p className="mt-0.5">Contact details remain hidden until claims are approved.</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 max-w-full flex z-50 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
