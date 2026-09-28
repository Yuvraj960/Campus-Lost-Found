import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, Calendar, Image as ImageIcon } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';
import Badge from './ui/Badge.jsx';

export default function ItemCard({ item }) {
  if (!item) return null;

  const isLost = item.type === 'LOST';
  const imageUrl = item.images?.[0]?.url;
  const formattedDate = item.date ? format(new Date(item.date), 'MMM d, yyyy') : '';

  return (
    <Link
      to={`/items/${item.id}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200"
    >
      {/* Image container 4:3 */}
      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
            <ImageIcon className="w-8 h-8 mb-1" />
            <span className="text-2xs font-medium">No photo provided</span>
          </div>
        )}

        {/* Type badge overlay */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge variant={isLost ? 'lost' : 'found'} size="sm">
            {isLost ? 'Lost' : 'Found'}
          </Badge>
        </div>

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <StatusBadge status={item.status} />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <span className="text-2xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
          {item.category?.replace(/_/g, ' ')}
        </span>

        <h3 className="font-heading text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
          {item.title}
        </h3>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-auto">
          <div className="flex items-center gap-1 truncate max-w-[55%]">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
