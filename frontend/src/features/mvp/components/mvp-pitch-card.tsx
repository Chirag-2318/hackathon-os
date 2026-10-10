import React, { useState } from 'react';
import { Pencil, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MvpPitchCardProps {
  identity: string;
  wow: string;
  onUpdate: (updates: { identity?: string; wow?: string }) => void;
}

export function MvpPitchCard({ identity, wow, onUpdate }: MvpPitchCardProps) {
  const [isEditingId, setIsEditingId] = useState(false);
  const [idText, setIdText] = useState(identity);

  const [isEditingWow, setIsEditingWow] = useState(false);
  const [wowText, setWowText] = useState(wow);

  const handleSaveId = () => {
    setIsEditingId(false);
    if (idText.trim() && idText !== identity) {
      onUpdate({ identity: idText.trim() });
    }
  };

  const handleSaveWow = () => {
    setIsEditingWow(false);
    if (wowText.trim() && wowText !== wow) {
      onUpdate({ wow: wowText.trim() });
    }
  };

  return (
    <div className="bg-card rounded-[24px] border border-border p-5 shadow-xs flex flex-col gap-4">
      {/* Identity sentence (20px/600) */}
      <div className="group relative flex flex-col gap-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground select-none">
          One-Sentence Identity
        </span>
        {isEditingId ? (
          <div className="flex flex-col gap-2 mt-1">
            <textarea
              value={idText}
              onChange={(e) => setIdText(e.target.value.slice(0, 140))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveId();
                } else if (e.key === 'Escape') {
                  setIsEditingId(false);
                  setIdText(identity);
                }
              }}
              rows={2}
              className="w-full text-[20px] font-semibold leading-snug bg-muted/40 p-2.5 rounded-xl border border-blue-500 focus:outline-none"
              autoFocus
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className={cn('font-mono', idText.length >= 130 && 'text-amber-500')}>
                {idText.length} / 140 chars
              </span>
              <button
                onClick={handleSaveId}
                className="h-7 px-3 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold text-xs flex items-center gap-1"
              >
                <Check className="size-3" />
                Save
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingId(true)}
            className="flex items-start justify-between gap-3 p-1.5 -ml-1.5 rounded-xl hover:bg-muted/40 cursor-pointer transition-colors"
          >
            <h2 className="text-[20px] font-semibold leading-snug text-foreground">
              {identity}
            </h2>
            <Pencil className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
          </div>
        )}
      </div>

      <div className="h-px bg-border/60" />

      {/* Wow moment row */}
      <div className="group relative flex flex-col gap-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground select-none">
          Wow moment
        </span>
        {isEditingWow ? (
          <div className="flex flex-col gap-2 mt-1">
            <textarea
              value={wowText}
              onChange={(e) => setWowText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveWow();
                } else if (e.key === 'Escape') {
                  setIsEditingWow(false);
                  setWowText(wow);
                }
              }}
              rows={2}
              className="w-full text-sm font-medium leading-relaxed bg-muted/40 p-2.5 rounded-xl border border-blue-500 focus:outline-none"
              autoFocus
            />
            <div className="flex items-center justify-end">
              <button
                onClick={handleSaveWow}
                className="h-7 px-3 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold text-xs flex items-center gap-1"
              >
                <Check className="size-3" />
                Save
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingWow(true)}
            className="flex items-start justify-between gap-3 p-1.5 -ml-1.5 rounded-xl hover:bg-muted/40 cursor-pointer transition-colors"
          >
            <p className="text-sm font-medium leading-relaxed text-muted-foreground">
              {wow}
            </p>
            <Pencil className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
          </div>
        )}
      </div>
    </div>
  );
}
