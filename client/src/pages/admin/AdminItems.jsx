import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { Flag, Trash2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminItems() {
  const [items, setItems] = useState([]);
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getItems({ type: type || undefined });
      setItems(data.items || []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const toggleFlag = async (item) => {
    try {
      await adminService.updateItem(item.id, { isFlagged: !item.isFlagged });
      toast.success(item.isFlagged ? 'Item unflagged' : 'Item flagged for review');
      fetchItems();
    } catch {
      toast.error('Failed to update flag');
    }
  };

  const toggleRemove = async (item) => {
    try {
      await adminService.updateItem(item.id, { isRemoved: !item.isRemoved });
      toast.success(item.isRemoved ? 'Listing restored' : 'Listing removed from public board');
      fetchItems();
    } catch {
      toast.error('Failed to update visibility');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900 tracking-tight">
            Item Listings Moderation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review public listings, flag suspicious entries, or remove prohibited items.
          </p>
        </div>

        <div className="flex gap-2">
          {['', 'LOST', 'FOUND'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                type === t
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {t === '' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Listing</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Flagged</th>
                <th className="px-5 py-3.5 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <Spinner size="md" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No items found.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Badge variant={item.type === 'LOST' ? 'lost' : 'found'} size="sm">
                          {item.type}
                        </Badge>
                        <span className="font-semibold text-slate-900 truncate max-w-xs block">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-3xs text-slate-400 mt-0.5 block">
                        Owner: {item.owner?.name}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {item.category?.replace(/_/g, ' ')}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{item.location}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      {item.isFlagged ? (
                        <span className="inline-flex items-center gap-1 text-red-600 font-bold text-2xs">
                          <Flag className="w-3 h-3 fill-red-600" />
                          Flagged
                        </span>
                      ) : (
                        <span className="text-slate-400 text-3xs">Clean</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleFlag(item)}
                        className={item.isFlagged ? 'text-emerald-600' : 'text-amber-600'}
                      >
                        {item.isFlagged ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Unflag
                          </>
                        ) : (
                          <>
                            <Flag className="w-3.5 h-3.5 mr-1" />
                            Flag
                          </>
                        )}
                      </Button>

                      <Button
                        variant={item.isRemoved ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => toggleRemove(item)}
                        className={!item.isRemoved ? 'text-red-600' : ''}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        {item.isRemoved ? 'Restore' : 'Hide'}
                      </Button>
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
