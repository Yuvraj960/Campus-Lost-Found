export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-2xs font-semibold',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  const variantStyles = {
    default: 'bg-slate-100 text-slate-700',
    primary: 'bg-indigo-50 text-indigo-700 border border-indigo-200/50',
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200/50',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200/50',
    red: 'bg-red-50 text-red-700 border border-red-200/50',
    slate: 'bg-slate-100 text-slate-600 border border-slate-200/50',
    lost: 'bg-rose-50 text-rose-700 border border-rose-200/50',
    found: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
    match: 'bg-purple-50 text-purple-700 border border-purple-200/50',
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full uppercase tracking-wider ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.default} ${className}`}
    >
      {children}
    </span>
  );
}
