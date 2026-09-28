import { CATEGORY, CATEGORY_LABELS } from '../constants/enums.js';
import { CAMPUS_LOCATIONS } from '../constants/locations.js';
import Select from './ui/Select.jsx';
import Input from './ui/Input.jsx';
import Button from './ui/Button.jsx';
import { RotateCcw } from 'lucide-react';

export default function FilterPanel({
  values = {},
  onChange,
  onReset,
  showStatusFilter = true,
  className = '',
}) {
  const handleChange = (key, val) => {
    onChange({ ...values, [key]: val });
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="font-heading text-sm font-bold text-slate-900 tracking-tight">
          Filter Listings
        </h3>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* Category */}
      <Select
        label="Category"
        value={values.category || ''}
        onChange={(e) => handleChange('category', e.target.value)}
      >
        <option value="">All Categories</option>
        {Object.entries(CATEGORY).map(([key, val]) => (
          <option key={key} value={val}>
            {CATEGORY_LABELS[val] || val}
          </option>
        ))}
      </Select>

      {/* Location */}
      <Select
        label="Location"
        value={values.location || ''}
        onChange={(e) => handleChange('location', e.target.value)}
      >
        <option value="">All Locations</option>
        {CAMPUS_LOCATIONS.map((loc) => (
          <option key={loc} value={loc}>
            {loc}
          </option>
        ))}
      </Select>

      {/* Status */}
      {showStatusFilter && (
        <Select
          label="Status"
          value={values.status || ''}
          onChange={(e) => handleChange('status', e.target.value)}
        >
          <option value="ACTIVE">Active Only</option>
          <option value="CLAIMED">Claimed</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
          <option value="ALL">All Statuses</option>
        </Select>
      )}

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-2">
        <Input
          label="From"
          type="date"
          value={values.dateFrom || ''}
          onChange={(e) => handleChange('dateFrom', e.target.value)}
        />
        <Input
          label="To"
          type="date"
          value={values.dateTo || ''}
          onChange={(e) => handleChange('dateTo', e.target.value)}
        />
      </div>

      {onReset && (
        <Button variant="outline" size="sm" onClick={onReset} className="w-full mt-2">
          Clear All Filters
        </Button>
      )}
    </div>
  );
}
