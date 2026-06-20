import React, { useRef, useState } from 'react';
import { ImagePlus, X, AlertCircle } from 'lucide-react';
import { MAX_IMAGES, MAX_IMAGE_SIZE_MB } from '../constants';

interface ImageUploaderProps {
  images: File[];
  onChange: (files: File[]) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ images, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    setError(null);
    const next = [...images];
    for (const file of Array.from(incoming)) {
      if (next.length >= MAX_IMAGES) {
        setError(`You can upload up to ${MAX_IMAGES} images.`);
        break;
      }
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed.');
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        setError(`Each image must be under ${MAX_IMAGE_SIZE_MB}MB.`);
        continue;
      }
      next.push(file);
    }
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
    setError(null);
  };

  const slotsLeft = MAX_IMAGES - images.length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {images.map((file, i) => (
          <div
            key={`${file.name}-${i}`}
            className="relative aspect-square rounded-xl overflow-hidden border border-gray-700 bg-gray-900 group"
          >
            <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
              aria-label="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {slotsLeft > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 text-gray-500 transition-colors ${
              isDragging ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-gray-700 hover:border-indigo-500 hover:text-indigo-300'
            }`}
          >
            <ImagePlus size={22} />
            <span className="text-[11px] font-medium">Add photo</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">
          {images.length}/{MAX_IMAGES} images • up to {MAX_IMAGE_SIZE_MB}MB each
        </span>
        {error && (
          <span className="flex items-center gap-1 text-red-400">
            <AlertCircle size={13} /> {error}
          </span>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
