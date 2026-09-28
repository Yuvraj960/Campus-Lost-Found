import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Sparkles, MapPin, Search } from 'lucide-react';

function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <header className="border-b border-slate-200 bg-white shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
              CL
            </div>
            <span className="font-heading font-bold text-lg text-slate-900 tracking-tight">
              Campus Lost &amp; Found
            </span>
          </div>
          <nav className="flex items-center space-x-4">
            <Link
              to="/lost"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Lost Items
            </Link>
            <Link
              to="/found"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Found Items
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          University Lost &amp; Found Portal
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight max-w-2xl">
          Reuniting students with what they’ve lost.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-xl">
          Report lost belongings, register found items, and let smart matching connect you with the rightful owner on campus.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Link
            to="/report/lost"
            className="flex-1 py-3 px-4 text-center rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold shadow-xs transition-colors"
          >
            I Lost Something
          </Link>
          <Link
            to="/report/found"
            className="flex-1 py-3 px-4 text-center rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-xs transition-colors"
          >
            I Found Something
          </Link>
        </div>

        <div className="mt-12 p-6 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-md w-full text-left">
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Search className="w-4 h-4 text-indigo-600" />
            Phase 0 Scaffold Active
          </h2>
          <p className="text-xs text-slate-500">
            Frontend shell, Tailwind CSS v4 design tokens, and API client initialized. Ready for Phase 1.
          </p>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 flex items-center justify-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          Campus Lost &amp; Found &bull; Built for university communities
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
