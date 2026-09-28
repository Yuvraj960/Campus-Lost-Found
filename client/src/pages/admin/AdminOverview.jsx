import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService.js';
import StatCard from '../../components/ui/StatCard.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import {
  Users,
  Search,
  PackageCheck,
  FileCheck2,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getStats();
        setStats(data);
      } catch {
        //
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const { totals = {}, resolutionRate, lostVsFound = [], byCategory = [], byLocation = [], reportsPerWeek = [] } = stats || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Campus Analytics &amp; Moderation
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          High-level overview of lost/found listing activity, resolution efficiency, and abuse reports.
        </p>
      </div>

      {/* Totals Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard title="Total Users" value={totals.users || 0} icon={Users} />
        <StatCard title="Lost Items" value={totals.lost || 0} icon={Search} />
        <StatCard title="Found Items" value={totals.found || 0} icon={Search} />
        <StatCard title="Resolved" value={totals.resolved || 0} icon={PackageCheck} />
        <StatCard title="Pending Claims" value={totals.pendingClaims || 0} icon={FileCheck2} />
        <StatCard title="Abuse Reports" value={totals.openReports || 0} icon={AlertTriangle} />
      </div>

      {/* Resolution rate callout */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Overall Recovery Rate
          </span>
          <h3 className="text-3xl font-extrabold text-indigo-600 tracking-tight mt-0.5">
            {resolutionRate}%
          </h3>
          <p className="text-xs text-slate-500">
            Percentage of campus listings successfully resolved and returned.
          </p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <TrendingUp className="w-6 h-6" />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lost vs Found Activity Bar Chart */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-heading text-sm font-bold text-slate-900 uppercase tracking-wider">
            Lost vs. Found Reports (Weekly Trend)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lostVsFound}>
                <XAxis dataKey="name" fontSize={11} stroke="#64748b" />
                <YAxis fontSize={11} stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="lost" fill="#f43f5e" name="Lost Items" radius={[4, 4, 0, 0]} />
                <Bar dataKey="found" fill="#10b981" name="Found Items" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* By Category Donut */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-heading text-sm font-bold text-slate-900 uppercase tracking-wider">
            Reports by Item Category
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {byCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Campus Locations (Horizontal Bar) */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-heading text-sm font-bold text-slate-900 uppercase tracking-wider">
            Top Misplaced Locations on Campus
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byLocation} layout="vertical">
                <XAxis type="number" fontSize={11} stroke="#64748b" />
                <YAxis dataKey="name" type="category" width={95} fontSize={11} stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} name="Reports" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reports per week Line Chart */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-heading text-sm font-bold text-slate-900 uppercase tracking-wider">
            Abuse Flags &amp; Inquiries (8 Weeks)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportsPerWeek}>
                <XAxis dataKey="week" fontSize={11} stroke="#64748b" />
                <YAxis fontSize={11} stroke="#64748b" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="reports"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Abuse Reports"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
