import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService.js';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getReports();
      setReports(data.items || []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleUpdateReport = async (reportId, status) => {
    try {
      await adminService.updateReport(reportId, { status });
      toast.success(`Report marked as ${status.toLowerCase()}`);
      fetchReports();
    } catch {
      toast.error('Failed to update report');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-slate-900 tracking-tight">
          Abuse &amp; Fraud Reports
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review community reports regarding suspicious listings or spam.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Reported Listing</th>
                <th className="px-5 py-3.5">Reason</th>
                <th className="px-5 py-3.5">Details</th>
                <th className="px-5 py-3.5">Reported By</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Resolve</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <Spinner size="md" />
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No open reports.
                  </td>
                </tr>
              ) : (
                reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {rep.item?.title || 'Campus Item'}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="red" size="sm">
                        {rep.reason}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 max-w-xs">{rep.details}</td>
                    <td className="px-5 py-3.5 text-slate-700">
                      {rep.reporter?.name || 'Anonymous'}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={rep.status === 'RESOLVED' ? 'green' : 'amber'} size="sm">
                        {rep.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5">
                      {rep.status === 'PENDING' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateReport(rep.id, 'DISMISSED')}
                            className="text-slate-500"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Dismiss
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleUpdateReport(rep.id, 'RESOLVED')}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Resolve
                          </Button>
                        </>
                      )}
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
