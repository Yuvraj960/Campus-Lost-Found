import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

export default function ImageGallery({ images = [] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-16/10 rounded-2xl bg-slate-100 flex flex-col items-center justify-center text-slate-400 border border-slate-200">
        <ImageIcon className="w-12 h-12 mb-2 stroke-1" />
        <span className="text-xs font-medium">No photos attached</span>
      </div>
    );
  }

  const currentImage = images[selectedIndex] || images[0];

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative aspect-16/10 w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xs">
        <img
          src={currentImage.url}
          alt={`Item photo ${selectedIndex + 1}`}
          loading="lazy"
          className="h-full w-full object-contain"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Photo thumbnails">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={idx === selectedIndex}
              aria-label={`View photo ${idx + 1}`}
              onClick={() => setSelectedIndex(idx)}
              className={`relative h-16 w-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                idx === selectedIndex
                  ? 'border-indigo-600 ring-2 ring-indigo-600/30'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img.url} alt={`Thumbnail ${idx + 1}`} loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
