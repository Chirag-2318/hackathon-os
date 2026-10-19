import React from 'react';
import { Crown } from 'lucide-react';
import type { PassportStampDto } from '../types';

interface PassportTimelineProps {
  stamps: PassportStampDto[];
  onSelectStamp: (stamp: PassportStampDto) => void;
}

export const PassportTimeline: React.FC<PassportTimelineProps> = ({ stamps, onSelectStamp }) => {
  if (!stamps || stamps.length === 0) return null;

  return (
    <section className="space-y-4 px-4 sm:px-6 pt-6">
      <div>
        <h2 className="text-[22px] font-display font-normal tracking-tight text-foreground flex items-center gap-2">
          <span>Hackathon Passport</span>
          <span className="font-mono text-xs text-muted-foreground">({stamps.length} stamps)</span>
        </h2>
        <p className="text-xs text-muted-foreground">Chronological passport records for every room joined</p>
      </div>

      {/* Grid of perforated ticket stubs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stamps.map((stamp) => (
          <PassportStampItem
            key={stamp.roomId}
            stamp={stamp}
            onClick={() => onSelectStamp(stamp)}
          />
        ))}
      </div>
    </section>
  );
};

interface PassportStampItemProps {
  stamp: PassportStampDto;
  onClick: () => void;
}

const PassportStampItem: React.FC<PassportStampItemProps> = ({ stamp, onClick }) => {
  const isLeader = stamp.role?.toUpperCase() === 'LEADER';
  const isShipped = stamp.isSubmitted;

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-[14px] border border-border bg-surface p-4 cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${
        isShipped ? 'hover:border-emerald-600/60' : 'hover:border-border-strong'
      }`}
    >
      {/* Ticket-stub perforated circular notches on left & right edge using PAGE background token */}
      <div className="absolute -left-2.5 top-1/2 -mt-2.5 h-5 w-5 rounded-full bg-page border border-border" />
      <div className="absolute -right-2.5 top-1/2 -mt-2.5 h-5 w-5 rounded-full bg-page border border-border" />

      {/* Top stub content */}
      <div className="flex items-start justify-between gap-3 px-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
              {stamp.eventName}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="font-mono text-[11px] text-muted-foreground">{stamp.dates}</span>
          </div>

          <h3 className="truncate text-base font-semibold text-foreground group-hover:text-emerald-500 transition-colors">
            {stamp.name}
          </h3>
        </div>

        {/* Stamp Badge: outlined mono label in semantic color */}
        <div className="shrink-0 text-right">
          {isShipped ? (
            <div className="inline-flex flex-col items-center justify-center rounded border border-emerald-500/80 bg-emerald-500/10 px-2 py-0.5 rotate-[-2deg]">
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                PASSPORT
              </span>
              <span className="font-mono text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                SHIPPED
              </span>
            </div>
          ) : (
            <div className="inline-flex flex-col items-center justify-center rounded border border-border bg-transparent px-2 py-0.5 rotate-[2deg]">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                PHASE
              </span>
              <span className="font-mono text-[10px] font-semibold uppercase text-muted-foreground">
                {stamp.furthestStage || 'BUILDING'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom stub metadata with dashed perforation line */}
      <div className="mt-4 pt-3 border-t border-dashed border-border flex items-center justify-between text-xs px-3">
        <div className="flex items-center gap-2">
          {isLeader ? (
            <span className="inline-flex items-center gap-1 font-mono text-xs text-amber-500 font-medium">
              <Crown className="h-3.5 w-3.5" />
              <span>Leader</span>
            </span>
          ) : stamp.role ? (
            <span className="font-mono text-xs text-muted-foreground uppercase">
              {stamp.role}
            </span>
          ) : null}

          {stamp.outcome && (
            <span className="truncate max-w-[180px] text-[11px] text-muted-foreground">
              {stamp.outcome}
            </span>
          )}
        </div>

        <span className="font-mono text-[11px] text-muted-foreground group-hover:text-foreground underline underline-offset-2 transition-colors">
          View case study →
        </span>
      </div>
    </div>
  );
};
