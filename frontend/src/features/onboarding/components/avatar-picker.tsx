import React, { useState, useRef, useEffect } from 'react';
import { PRESET_AVATARS, getPresetAvatarUrl } from '../preset-avatars';
import { Plus, Check, ZoomIn, RotateCcw, AlertCircle } from 'lucide-react';
import { onboardingApi } from '../api';

export interface AvatarSelection {
  type: 'PRESET' | 'CUSTOM';
  presetIndex?: number;
  customUrl?: string;
}

export interface AvatarPickerProps {
  selection: AvatarSelection;
  onChange: (selection: AvatarSelection) => void;
  className?: string;
}

export function AvatarPicker({
  selection,
  onChange,
  className = '',
}: AvatarPickerProps) {
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Crop manipulation state
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate and handle file input
  const processFile = (file: File) => {
    setUploadError(null);
    const validExtensions = ['png', 'jpg', 'jpeg', 'webp', 'jfif'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (!validExtensions.includes(ext) || file.type.includes('svg') || file.type.includes('gif')) {
      setUploadError('Only PNG, JPG, WebP, and JFIF photos allowed (SVG & GIF rejected)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Photo must be smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropFile(file);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Inline crop export to 256x256 WebP
  const handleApplyCrop = async () => {
    if (!cropImageSrc) return;
    setIsUploading(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (!ctx || !imageRef.current) return;

      const img = imageRef.current;
      const size = 256;

      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      const scale = zoom;
      const renderW = size * scale;
      const renderH = (img.naturalHeight / img.naturalWidth) * renderW;
      const drawX = (size - renderW) / 2 + offset.x;
      const drawY = (size - renderH) / 2 + offset.y;

      ctx.drawImage(img, drawX, drawY, renderW, renderH);
      ctx.restore();

      const webpDataUrl = canvas.toDataURL('image/webp', 0.92);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const uploadFile = new File([blob], 'avatar.webp', { type: 'image/webp' });
        try {
          const res = await onboardingApi.uploadAvatar(uploadFile);
          onChange({
            type: 'CUSTOM',
            customUrl: res.avatarUrl || webpDataUrl,
          });
        } catch {
          // Fallback to local data URL if backend offline
          onChange({
            type: 'CUSTOM',
            customUrl: webpDataUrl,
          });
        } finally {
          setIsUploading(false);
          setCropFile(null);
          setCropImageSrc(null);
        }
      }, 'image/webp', 0.92);
    } catch {
      setIsUploading(false);
      setUploadError('Failed to process image');
    }
  };

  // Canvas crop interactions
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className={`w-full flex flex-col gap-4 select-none ${className}`}>
      {/* ── INLINE CIRCULAR CROP MODE ── */}
      {cropImageSrc ? (
        <div className="flex flex-col items-center bg-neutral-50 rounded-2xl p-5 border border-neutral-200 gap-4">
          <p className="text-sm font-medium text-neutral-800">
            Drag photo to reposition and adjust zoom
          </p>

          {/* 220px Circular Viewport */}
          <div
            className="relative size-52 rounded-full overflow-hidden bg-neutral-900 border-4 border-neutral-800 cursor-grab active:cursor-grabbing shadow-inner flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={cropImageSrc}
              alt="Crop preview"
              className="max-w-none pointer-events-none select-none transition-transform duration-75"
              style={{
                width: `${100 * zoom}%`,
                transform: `translate(${offset.x}px, ${offset.y}px)`,
              }}
              draggable={false}
            />
            {/* Crosshair guidelines */}
            <div className="absolute inset-0 border border-white/20 rounded-full pointer-events-none" />
          </div>

          {/* Zoom Slider */}
          <div className="flex items-center gap-3 w-64 max-w-full text-xs text-neutral-600">
            <ZoomIn className="size-4 shrink-0 text-neutral-400" />
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
            />
            <span className="font-mono text-[11px] w-8">{zoom.toFixed(1)}x</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              disabled={isUploading}
              onClick={handleApplyCrop}
              className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isUploading ? 'Saving...' : 'Use this photo'}
            </button>
            <button
              type="button"
              onClick={() => {
                setCropImageSrc(null);
                setCropFile(null);
              }}
              className="px-3 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-700 text-xs font-medium hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* ── 5x2 GRID + UPLOAD TILE ── */
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 sm:gap-3.5">
            {/* 1. Upload Yours Tile */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`size-16 sm:size-[72px] rounded-full border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-150 ${
                selection.type === 'CUSTOM'
                  ? 'border-neutral-900 bg-neutral-50 ring-4 ring-neutral-900/10'
                  : 'border-neutral-300 hover:border-neutral-400 bg-white hover:bg-neutral-50/60'
              }`}
              title="Upload yours (drag & drop or click)"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,.jfif"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) processFile(e.target.files[0]);
                }}
              />
              <Plus className="size-4 text-neutral-600" />
              <span className="text-[9px] font-semibold text-neutral-600 text-center leading-tight px-1">
                Upload
              </span>
            </div>

            {/* 2. 10 Preset Avatars */}
            {PRESET_AVATARS.map((src, i) => {
              const presetNumber = i + 1;
              const isSelected = selection.type === 'PRESET' && selection.presetIndex === presetNumber;

              return (
                <div
                  key={presetNumber}
                  onClick={() => onChange({ type: 'PRESET', presetIndex: presetNumber })}
                  className={`relative size-16 sm:size-[72px] rounded-full p-0.5 cursor-pointer transition-all duration-150 hover:scale-108 hover:shadow-md ${
                    isSelected
                      ? 'ring-3 ring-neutral-900 shadow-sm'
                      : 'hover:border-neutral-300'
                  }`}
                >
                  <img
                    src={src}
                    alt={`Preset ${presetNumber}`}
                    className="w-full h-full rounded-full object-cover"
                    loading="lazy"
                  />
                  {isSelected && (
                    <div className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shadow-sm">
                      <Check className="size-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Error Message if Any */}
          {uploadError && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium pt-1">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
