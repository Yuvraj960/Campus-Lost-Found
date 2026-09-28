import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { itemService } from '../services/itemService.js';
import StatusBadge from '../components/StatusBadge.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { format } from 'date-fns';
import { PlusCircle, MapPin, Calendar, FileText, ArrowRight } from 'lucide-react';

export default function MyReports() {
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await itemService.getItems({
        owner: 'me',
        status: tab === 'RESOLVED' ? 'RESOLVED' : undefined,
        type: tab === 'LOST' || tab === 'FOUND' ? tab : undefined,
      });
      setItems(data.items || []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900 tracking-tight">
            My Reported Items
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your listings, update statuses, and view ownership claims.
          </p>
        </div>

        <div className="flex gap-2">
          <Link to="/report/lost">
            <Button size="sm" variant="lost">
              <PlusCircle className="w-4 h-4 mr-1" />
              Report Lost
            </Button>
          </Link>
          <Link to="/report/found">
            <Button size="sm" variant="found">
              <PlusCircle className="w-4 h-4 mr-1" />
              Report Found
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        {['ALL', 'LOST', 'FOUND', 'RESOLVED'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`pb-3 transition-colors capitalize cursor-pointer ${
              tab === t
                ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.toLowerCase()} Items
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reported items"
          description={`You don't have any ${tab.toLowerCase()} listings right now.`}
          action={
            <Link to="/report/lost">
              <Button size="sm">Report an Item</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-300 transition"
            >
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                  <img
                    src={item.images?.[0]?.url || 'https://picsum.photos/seed/placeholder/200/200'}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={item.type === 'LOST' ? 'lost' : 'found'} size="sm">
                      {item.type}
                    </Badge>
                    <StatusBadge status={item.status} />
                  </div>
                  <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {item.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {format(new Date(item.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <Link to={`/items/${item.id}`}>
                  <Button variant="outline" size="sm">
                    View &amp; Review
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
