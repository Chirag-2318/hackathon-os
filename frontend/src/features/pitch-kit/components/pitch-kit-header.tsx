import React, { useState, useRef, useEffect } from 'react';
import type { PitchSettings, PitchKitReadinessResponse } from '../api/pitch-kit-api';
import { ReadinessPopover } from './readiness-popover';

interface PitchKitHeaderProps {
  settings: PitchSettings | null;
  readiness: PitchKitReadinessResponse | null;
  isLoadingReadiness: boolean;
  onUpdateSettings: (patch: { format?: 'LIVE' | 'VIDEO' | 'BOTH'; pitchLimitSec?: number; qaLimitSec?: number }) => Promise<void>;
  onNavigateTab: (tab: 'demo' | 'pitch' | 'qa') => void;
}

function formatSecToMmSs(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function parseMmSsToSec(str: string): number {
  const clean = str.trim();
  if (clean.includes(':')) {
    const [m, s] = clean.split(':').map((x) => parseInt(x, 10) || 0);
    return m * 60 + s;
  }
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? 180 : parsed;
}

export function PitchKitHeader({
  settings,
  readiness,
  isLoadingReadiness,
  onUpdateSettings,
  onNavigateTab,
}: PitchKitHeaderProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [format, setFormat] = useState<'LIVE' | 'VIDEO' | 'BOTH'>(settings?.format || 'LIVE');
  const [pitchMmSs, setPitchMmSs] = useState(formatSecToMmSs(settings?.pitchLimitSec || 180));
  const [qaMmSs, setQaMmSs] = useState(formatSecToMmSs(settings?.qaLimitSec || 120));
  const [saving, setSaving] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (settings) {
      setFormat(settings.format || 'LIVE');
      setPitchMmSs(formatSecToMmSs(settings.pitchLimitSec || 180));
      setQaMmSs(formatSecToMmSs(settings.qaLimitSec || 120));
    }
  }, [settings]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setPopoverOpen(false);
      }
    }
    if (popoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [popoverOpen]);

  const handleSaveFormat = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateSettings({
        format,
        pitchLimitSec: parseMmSsToSec(pitchMmSs),
        qaLimitSec: parseMmSsToSec(qaMmSs),
      });
      setPopoverOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const formatLabel = settings?.format === 'VIDEO' ? 'Video demo' : settings?.format === 'BOTH' ? 'Live + video demo' : 'Live demo';
  const pitchTime = formatSecToMmSs(settings?.pitchLimitSec || 180);
  const qaTime = formatSecToMmSs(settings?.qaLimitSec || 120);

  return (
    <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-border/80">
      <div className="space-y-1">
        <h1
          className="text-[40px] leading-tight font-normal text-foreground tracking-tight"
          style={{ fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)' }}
        >
          Pitch kit
        </h1>

        <div className="flex items-center gap-2 text-xs text-muted-foreground font-normal">
          <span>
            {formatLabel} · {pitchTime} pitch · {qaTime} Q&amp;A
          </span>
          <span className="text-muted-foreground/40">·</span>
          <div className="relative inline-block" ref={popoverRef}>
            <button
              type="button"
              onClick={() => setPopoverOpen((p) => !p)}
              className="text-xs text-accent hover:underline focus-visible:outline-none"
            >
              Set format
            </button>

            {popoverOpen && (
              <form
                onSubmit={handleSaveFormat}
                className="absolute left-0 top-full mt-2 w-72 bg-background border border-border rounded-lg shadow-lg z-50 p-4 space-y-3.5 text-left animate-in fade-in zoom-in-95 duration-140"
              >
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                    Demo format
                  </label>
                  <div className="flex rounded-md border border-border overflow-hidden text-xs">
                    {(['LIVE', 'VIDEO', 'BOTH'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setFormat(mode)}
                        className={`flex-1 py-1.5 font-medium transition-colors ${
                          format === mode ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/40'
                        }`}
                      >
                        {mode === 'LIVE' ? 'Live' : mode === 'VIDEO' ? 'Video' : 'Both'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                      Pitch limit
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                      placeholder="3:00"
                      value={pitchMmSs}
                      onChange={(e) => setPitchMmSs(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                      Q&amp;A limit
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs font-mono tabular-nums px-2.5 py-1.5 border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                      placeholder="2:00"
                      value={qaMmSs}
                      onChange={(e) => setQaMmSs(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setPopoverOpen(false)}
                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="text-xs font-medium bg-foreground text-background px-3 py-1 rounded-md hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center sm:self-center">
        <ReadinessPopover
          readiness={readiness}
          isLoading={isLoadingReadiness}
          onNavigateTab={onNavigateTab}
        />
      </div>
    </header>
  );
}
