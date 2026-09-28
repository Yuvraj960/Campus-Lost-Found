import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { itemService } from '../services/itemService.js';
import { claimService } from '../services/claimService.js';
import { matchService } from '../services/matchService.js';
import { notificationService } from '../services/notificationService.js';
import StatCard from '../components/ui/StatCard.jsx';
import MatchCard from '../components/MatchCard.jsx';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import {
  FileText,
  FileCheck2,
  Bell,
  Sparkles,
  PlusCircle,
  FolderOpen,
  ArrowRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    activeReports: 0,
    pendingClaims: 0,
    myClaims: 0,
    unreadNotifs: 0,
  });
  const [matches, setMatches] = useState([]);
  const [recentNotifs, setRecentNotifs] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [itemsData, claimsData, matchesData, notifsData, unreadData] =
          await Promise.all([
            itemService.getItems({ owner: 'me', status: 'ACTIVE' }),
            claimService.getMyClaims(),
            matchService.getMyMatches(),
            notificationService.getNotifications({ limit: 4 }),
            notificationService.getUnreadCount(),
          ]);

        setCounts({
          activeReports: itemsData.total || 0,
          pendingClaims: 1, // mock items pending claim
          myClaims: claimsData.total || 0,
          unreadNotifs: unreadData.count || 0,
        });

        setMatches(matchesData || []);
        setRecentNotifs(notifsData.items?.slice(0, 4) || []);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Greeting Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-3xl text-white shadow-sm">
        <div>
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">
            Student Dashboard
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Welcome back, {user?.name?.split(' ')[0] || 'Student'}!
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 mt-1">
            Track your reports, review ownership claims, and check AI-discovered matches.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link to="/report/lost">
            <Button size="sm" variant="lost" className="shadow-xs">
              <PlusCircle className="w-4 h-4 mr-1" />
              Report Lost
            </Button>
          </Link>
          <Link to="/report/found">
            <Button size="sm" variant="found" className="shadow-xs">
              <PlusCircle className="w-4 h-4 mr-1" />
              Report Found
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Reports"
          value={counts.activeReports}
          icon={FileText}
          description="Your live listings"
        />
        <StatCard
          title="Claims Pending"
          value={counts.pendingClaims}
          icon={FileCheck2}
          description="Awaiting review"
        />
        <StatCard
          title="My Claims"
          value={counts.myClaims}
          icon={FolderOpen}
          description="Submitted by you"
        />
        <StatCard
          title="Unread Alerts"
          value={counts.unreadNotifs}
          icon={Bell}
          description="Notifications"
        />
      </div>

      {/* Main Grid: AI Matches & Recent Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: AI Matches (7 cols) */}
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="font-heading text-lg font-bold text-slate-900 tracking-tight">
                AI Suggested Matches
              </h2>
            </div>
            <Link to="/matches" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              View all &rarr;
            </Link>
          </div>

          {matches.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No pending matches"
              description="Our AI continuously compares newly reported items and will notify you when a match is found."
            />
          ) : (
            <div className="space-y-4">
              {matches.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  onDismissed={(id) => setMatches((prev) => prev.filter((item) => item.id !== id))}
                />
              ))}
            </div>
          )}
        </section>

        {/* Right: Recent Notifications & Quick Links (5 cols) */}
        <section className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading text-sm font-bold text-slate-900 uppercase tracking-wider">
                Recent Notifications
              </h3>
              <Link to="/notifications" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                All Alerts
              </Link>
            </div>

            {recentNotifs.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No notifications</p>
            ) : (
              <div className="divide-y divide-slate-100 space-y-2">
                {recentNotifs.map((n) => (
                  <div key={n.id} className="pt-2 flex items-start gap-2.5">
                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!n.read ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-800 leading-snug">{n.message}</p>
                      <span className="text-3xs text-slate-400 mt-0.5 block">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Hub Links */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-heading text-xs font-bold text-slate-900 uppercase tracking-wider">
              Quick Shortcuts
            </h3>
            <div className="space-y-1 text-xs">
              <Link
                to="/my-reports"
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition"
              >
                <span>Manage My Reports</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                to="/my-claims"
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition"
              >
                <span>Track My Claims</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                to="/lost"
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition"
              >
                <span>Search Campus Listings</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
