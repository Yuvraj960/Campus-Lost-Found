import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { format } from 'date-fns';

export default function AdminClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const data = await adminService.getClaims();
        setClaims(data.items || []);
      } catch {
        //
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-slate-900 tracking-tight">
          Claims Moderation
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review all submitted ownership claims across the campus platform.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Listing Item</th>
                <th className="px-5 py-3.5">Claimant</th>
                <th className="px-5 py-3.5">Verification Message</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Filed On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <Spinner size="md" />
                  </td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No claims filed yet.
                  </td>
                </tr>
              ) : (
                claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 font-semibold text-slate-900 max-w-xs truncate">
                      {claim.item?.title}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-800">{claim.claimant?.name}</div>
                      <div className="text-3xs text-slate-400">{claim.claimant?.department}</div>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="text-slate-700 truncate">{claim.message}</p>
                      <span className="text-3xs text-indigo-600 font-mono block mt-0.5 truncate">
                        Proof: {claim.proof}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={claim.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {claim.createdAt ? format(new Date(claim.createdAt), 'MMM d, yyyy') : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
