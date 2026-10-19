import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { PitchKitReadinessResponse, PitchKitReadinessItem } from '../api/pitch-kit-api';

interface ReadinessPopoverProps {
  readiness: PitchKitReadinessResponse | null;
  isLoading: boolean;
  onNavigateTab: (tab: 'demo' | 'pitch' | 'qa') => void;
}

export function ReadinessPopover({ readiness, isLoading, onNavigateTab }: ReadinessPopoverProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const items = readiness?.items || [];
  const readyCount = readiness?.readyCount ?? 0;
  const totalCount = readiness?.totalCount ?? 10;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        id="pitchkit-readiness-trigger"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2.5 p-1 rounded-md hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-expanded={open}
        aria-label={`Readiness: ${readyCount} of ${totalCount} ready`}
      >
        <span className="font-mono text-xs tabular-nums text-muted-foreground whitespace-nowrap">
          {isLoading ? '... of 10 ready' : `${readyCount} of ${totalCount} ready`}
        </span>

        {/* 10-cell segmented bar */}
        <div className="flex items-center gap-1" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, idx) => {
            const item = items[idx];
            let fillClass = 'bg-border';
            if (item) {
              if (item.status === 'READY') fillClass = 'bg-emerald-600 dark:bg-emerald-400';
              else if (item.status === 'PARTIAL') fillClass = 'bg-amber-600 dark:bg-amber-400';
            }
            return (
              <span
                key={idx}
                className={cn('w-[14px] h-[6px] rounded-[2px] transition-colors', fillClass)}
              />
            );
          })}
        </div>
      </button>

      {/* Popover */}
      {open && (
        <div
          role="dialog"
          aria-label="Pitch readiness checklist"
          className="absolute right-0 top-full mt-2 w-[420px] max-w-[calc(100vw-32px)] bg-background border border-border rounded-lg shadow-lg z-50 p-4 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <p className="text-sm font-semibold text-foreground">Pitch readiness</p>
              <p className="font-mono text-xs text-muted-foreground tabular-nums">
                {readyCount} of {totalCount} ready for judges
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground p-1"
            >
              Close
            </button>
          </div>

          <div className="divide-y divide-border/60 max-h-[460px] overflow-y-auto mt-1">
            {items.map((item, idx) => {
              const targetTab = item.route.includes('pitch')
                ? 'pitch'
                : item.route.includes('qa')
                ? 'qa'
                : 'demo';

              return (
                <div key={item.id || idx} className="py-2.5 flex items-start justify-between gap-3 text-left">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <StatusGlyph status={item.status} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground leading-snug">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.detail}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigateTab(targetTab);
                      setOpen(false);
                    }}
                    className="text-[11px] font-mono text-accent hover:underline shrink-0 pt-0.5"
                  >
                    {item.status === 'READY' ? 'View' : 'Fix'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusGlyph({ status }: { status: 'READY' | 'PARTIAL' | 'MISSING' }) {
  if (status === 'READY') {
    return (
      <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" title="Ready">
        <svg className="w-2.5 h-2.5 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  }
  if (status === 'PARTIAL') {
    return (
      <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" title="Partial">
        <span className="w-1.5 h-0.5 bg-current rounded-full" />
      </span>
    );
  }
  return (
    <span className="w-3.5 h-3.5 rounded-full border border-border text-muted-foreground shrink-0 mt-0.5" title="Missing" />
  );
}
