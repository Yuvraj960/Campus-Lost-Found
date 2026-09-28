import { forwardRef } from 'react';

const Select = forwardRef(function Select(
  { label, error, helperText, id, children, className = '', ...props },
  ref
) {
  const selectId = id || props.name || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`w-full rounded-xl border ${
          error ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-primary/30'
        } bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs transition focus:outline-hidden focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500 ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
});

export default Select;
