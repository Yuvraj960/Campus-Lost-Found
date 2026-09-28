import { useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ImageUploader({
  files = [],
  existing = [],
  onChange,
  max = 5,
}) {
  const fileInputRef = useRef(null);
  const totalCount = files.length + existing.length;

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (totalCount + selected.length > max) {
      toast.error(`You can only upload up to ${max} photos in total.`);
      return;
    }

    const validFiles = selected.filter((file) => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error(`${file.name} is not a valid JPEG/PNG/WebP image.`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (> 5 MB).`);
        return false;
      }
      return true;
    });

    onChange([...files, ...validFiles]);
  };

  const removeNewFile = (idx) => {
    const updated = [...files];
    updated.splice(idx, 1);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Photos ({totalCount}/{max})
        </label>
        <span className="text-2xs text-slate-400">Up to 5 MB each (JPEG, PNG, WebP)</span>
      </div>

      {/* Previews grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {existing.map((img, idx) => (
          <div
            key={`existing-${idx}`}
            className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
          >
            <img src={img.url} alt="Existing item" className="h-full w-full object-cover" />
            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-3xs px-1.5 py-0.5 rounded">
              Saved
            </span>
          </div>
        ))}

        {files.map((file, idx) => (
          <div
            key={`new-${idx}`}
            className="relative aspect-square rounded-xl overflow-hidden border border-indigo-200 bg-indigo-50/20 group"
          >
            <img
              src={URL.createObjectURL(file)}
              alt="Upload preview"
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeNewFile(idx)}
              aria-label="Remove photo"
              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xs hover:bg-red-700 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Upload drop button */}
        {totalCount < max && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20 flex flex-col items-center justify-center p-2 text-slate-500 hover:text-indigo-600 transition cursor-pointer"
          >
            <UploadCloud className="w-6 h-6 mb-1" />
            <span className="text-2xs font-semibold">Add Photo</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
