import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                CL
              </div>
              <span className="font-heading font-extrabold text-base text-slate-900 tracking-tight">
                Campus Lost &amp; Found
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Official university portal helping students reunite with misplaced belongings through secure verified claims and smart AI matching.
            </p>
            <div className="flex items-center gap-2 text-2xs font-semibold text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Verified campus identification required for approvals
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/lost" className="text-slate-500 hover:text-indigo-600 transition-colors">
                  Lost Items Directory
                </Link>
              </li>
              <li>
                <Link to="/found" className="text-slate-500 hover:text-indigo-600 transition-colors">
                  Found Items Directory
                </Link>
              </li>
              <li>
                <Link to="/report/lost" className="text-slate-500 hover:text-indigo-600 transition-colors">
                  Report a Lost Item
                </Link>
              </li>
              <li>
                <Link to="/report/found" className="text-slate-500 hover:text-indigo-600 transition-colors">
                  Report a Found Item
                </Link>
              </li>
            </ul>
          </div>

          {/* Campus info */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Campus Security
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Central Security Desk, Ground Floor, Admin Block. Open 24/7 for safe item collection.
            </p>
            <div className="mt-2 text-2xs text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Main University Campus
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>&copy; {new Date().getFullYear()} Campus Lost &amp; Found. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for university communities
          </p>
        </div>
      </div>
    </footer>
  );
}
