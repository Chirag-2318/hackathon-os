import React, { useState, useRef, useEffect } from 'react';
import type { DemoAsset } from '../api/pitch-kit-api';
import { toast } from 'sonner';

interface DemoScreenshotsProps {
  roomId: string;
  screenshots: DemoAsset[];
  onUploadScreenshot: (file: File) => Promise<void>;
  onUpdateAsset: (assetId: string, req: { caption?: string; position?: number }) => Promise<void>;
  onDeleteAsset: (assetId: string) => Promise<void>;
}

export function DemoScreenshots({
  roomId,
  screenshots,
  onUploadScreenshot,
  onUpdateAsset,
  onDeleteAsset,
}: DemoScreenshotsProps) {
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (activeLightboxIndex === null) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setActiveLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setActiveLightboxIndex((prev) => (prev !== null ? (prev + 1) % screenshots.length : 0));
      } else if (e.key === 'ArrowLeft') {
        setActiveLightboxIndex((prev) => (prev !== null ? (prev - 1 + screenshots.length) % screenshots.length : 0));
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxIndex, screenshots.length]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (screenshots.length + files.length > 12) {
      toast.error('Maximum 12 screenshots allowed');
      return;
    }

    setUploading(true);
    try {
      for (const f of files) {
        if (f.size > 5 * 1024 * 1024) {
          toast.error(`${f.name} exceeds 5MB limit`);
          continue;
        }
        await onUploadScreenshot(f);
      }
      toast.success('Screenshot uploaded');
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const reordered = [...screenshots];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    // Save positions
    reordered.forEach((item, idx) => {
      onUpdateAsset(item.id, { position: idx });
    });
    setDraggedIndex(null);
  };

  const downloadZipUrl = `/api/v1/rooms/${roomId}/demo/assets/zip`;

  return (
    <div className="space-y-4 pt-4 border-t border-border/60">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider font-mono">
            Screenshots
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {screenshots.length} of 12 · 16:10 format for judging fallbacks
          </p>
        </div>

        {screenshots.length > 0 && (
          <a
            href={downloadZipUrl}
            download={`screenshots-${roomId}.zip`}
            className="text-xs font-mono text-accent hover:underline"
          >
            Download all (.zip)
          </a>
        )}
      </div>

      {/* Filmstrip grid (4 columns) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {screenshots.map((s, idx) => {
          const fileUrl = `/api/v1/rooms/${roomId}/demo/assets/${s.id}/file`;
          return (
            <div
              key={s.id}
              draggable
              onDragStart={() => setDraggedIndex(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, idx)}
              className="group relative flex flex-col space-y-1.5 cursor-pointer"
            >
              <div
                onClick={() => setActiveLightboxIndex(idx)}
                className="aspect-[16/10] bg-muted/40 rounded-md border border-border/80 overflow-hidden relative"
              >
                <img
                  src={fileUrl}
                  alt={s.caption || `Screenshot ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAsset(s.id);
                  }}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-black/60 text-white rounded p-1 text-[10px] hover:bg-black transition-opacity"
                  title="Remove screenshot"
                >
                  ✕
                </button>
              </div>

              <input
                type="text"
                defaultValue={s.caption}
                placeholder="Caption..."
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val !== s.caption) {
                    onUpdateAsset(s.id, { caption: val });
                  }
                }}
                className="text-[11px] font-mono px-1.5 py-0.5 border border-transparent hover:border-border focus:border-border rounded bg-transparent focus:bg-background text-foreground placeholder:text-muted-foreground/40 transition-colors truncate focus:outline-none"
              />
            </div>
          );
        })}

        {/* Upload box if < 12 */}
        {screenshots.length < 12 && (
          <label className="aspect-[16/10] border border-dashed border-border/80 rounded-md flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/30 transition-colors p-2 text-center">
            <span className="text-xs font-mono text-muted-foreground">
              {uploading ? 'Uploading...' : '+ Add screen'}
            </span>
            <span className="text-[10px] text-muted-foreground/60 font-mono">PNG, JPG, WebP</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              disabled={uploading}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Lightbox Modal */}
      {activeLightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveLightboxIndex(null)}
          className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-6 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-5xl max-h-[85vh] flex flex-col items-center gap-3 relative"
          >
            <img
              src={`/api/v1/rooms/${roomId}/demo/assets/${screenshots[activeLightboxIndex]?.id}/file`}
              alt="Screenshot preview"
              className="max-h-[75vh] w-auto object-contain rounded-md border border-white/10 shadow-2xl"
            />

            <div className="flex items-center justify-between w-full text-white/80 font-mono text-xs px-2">
              <span>
                {activeLightboxIndex + 1} / {screenshots.length}
                {screenshots[activeLightboxIndex]?.caption && (
                  <span className="ml-2 text-white">· {screenshots[activeLightboxIndex]?.caption}</span>
                )}
              </span>

              <div className="flex items-center gap-4 text-xs">
                <span>Use ← → to cycle, Esc to close</span>
                <button
                  type="button"
                  onClick={() => setActiveLightboxIndex(null)}
                  className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
