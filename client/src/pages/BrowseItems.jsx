import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { itemService } from '../services/itemService.js';
import ItemCard from '../components/ItemCard.jsx';
import SearchBar from '../components/SearchBar.jsx';
import FilterPanel from '../components/FilterPanel.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import Select from '../components/ui/Select.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { SkeletonCard } from '../components/ui/Skeleton.jsx';
import { SlidersHorizontal, AlertCircle, RefreshCw } from 'lucide-react';

export default function BrowseItems({ defaultType = 'LOST' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Extract params from URL
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const location = searchParams.get('location') || '';
  const status = searchParams.get('status') || 'ACTIVE';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const updateFilters = useCallback(
    (newParams) => {
      const updated = new URLSearchParams(searchParams);
      Object.entries(newParams).forEach(([k, v]) => {
        if (v === '' || v === null || v === undefined || (k === 'page' && v === 1)) {
          updated.delete(k);
        } else {
          updated.set(k, v);
        }
      });
      setSearchParams(updated);
    },
    [searchParams, setSearchParams]
  );

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await itemService.getItems({
        type: defaultType,
        search,
        category,
        location,
        status,
        dateFrom,
        dateTo,
        sort,
        page,
        limit: 12,
      });
      setItems(data.items || []);
      setMeta({
        page: data.page || 1,
        total: data.total || 0,
        totalPages: data.totalPages || 1,
      });
    } catch (err) {
      setError(err.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [defaultType, search, category, location, status, dateFrom, dateTo, sort, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const isLost = defaultType === 'LOST';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isLost ? 'Lost Items Directory' : 'Found Items Directory'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isLost
              ? 'Browse reported lost items or search to verify if someone found yours.'
              : 'Items recovered on campus waiting to be claimed by their rightful owners.'}
          </p>
        </div>

        {/* Sort & Mobile filter trigger */}
        <div className="flex items-center gap-3">
          <div className="w-40">
            <Select
              value={sort}
              onChange={(e) => updateFilters({ sort: e.target.value, page: 1 })}
              className="py-1.5 text-xs"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </Select>
          </div>

          <button
            type="button"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="w-full">
        <SearchBar
          value={search}
          onChange={(newSearch) => updateFilters({ search: newSearch, page: 1 })}
          placeholder={`Search ${isLost ? 'lost' : 'found'} items by name, description, campus place...`}
        />
      </div>

      {/* Main Layout: Sidebar Filters + Item Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <div className="hidden lg:block lg:col-span-1 sticky top-20">
          <FilterPanel
            values={{ category, location, status, dateFrom, dateTo }}
            onChange={(vals) => updateFilters({ ...vals, page: 1 })}
            onReset={handleResetFilters}
          />
        </div>

        {/* Mobile Filters Drawer */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white p-6 shadow-xl z-50 overflow-y-auto">
              <FilterPanel
                values={{ category, location, status, dateFrom, dateTo }}
                onChange={(vals) => updateFilters({ ...vals, page: 1 })}
                onReset={() => {
                  handleResetFilters();
                  setMobileFiltersOpen(false);
                }}
              />
              <Button
                variant="primary"
                size="sm"
                className="w-full mt-4"
                onClick={() => setMobileFiltersOpen(false)}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        )}

        {/* Items Container */}
        <div className="lg:col-span-3 space-y-6">
          {error ? (
            <div className="p-8 rounded-2xl border border-red-200 bg-red-50 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
              <p className="text-sm font-semibold text-red-800">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchItems}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </Button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title={`No ${isLost ? 'lost' : 'found'} items found`}
              description="No listings match your search or filter criteria. Try resetting filters."
              action={
                <Button variant="outline" size="sm" onClick={handleResetFilters}>
                  Clear all filters
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>

              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                onChange={(p) => updateFilters({ page: p })}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
