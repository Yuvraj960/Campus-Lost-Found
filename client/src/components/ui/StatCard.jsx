export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className = '',
}) {
  return (
    <div className={`p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between ${className}`}>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <h4 className="mt-1 text-2xl font-extrabold text-slate-900 tracking-tight">{value}</h4>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
        {trend && (
          <p className="mt-1 text-xs font-semibold text-emerald-600 flex items-center gap-1">
            {trend}
          </p>
        )}
      </div>
      {Icon && (
        <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
}
