import React from 'react';
import { CheckCircle2, Clock, ShieldAlert, Award } from 'lucide-react';
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
        <h2 className="text-base font-semibold tracking-tight text-neutral-100 flex items-center gap-2">
          <span>Hackathon Passport</span>
          <span className="font-mono text-xs text-neutral-400">({stamps.length} stamps)</span>
        </h2>
        <p className="text-xs text-neutral-400">Chronological passport records for every room joined</p>
      </div>

      {/* Vertical list of perforated ticket stubs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stamps.map((stamp, idx) => (
          <PassportStampItem
            key={stamp.roomId}
            stamp={stamp}
            index={idx}
            onClick={() => onSelectStamp(stamp)}
          />
        ))}
      </div>
    </section>
  );
};

interface PassportStampItemProps {
  stamp: PassportStampDto;
  index: number;
  onClick: () => void;
}

const PassportStampItem: React.FC<PassportStampItemProps> = ({ stamp, index, onClick }) => {
  const isLeader = stamp.role?.toUpperCase() === 'LEADER';
  const isShipped = stamp.isSubmitted;

  return (
    <div
      onClick={onClick}
      style={{ animationDelay: `${index * 60}ms` }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-md border p-4 cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md animate-in fade-in zoom-in-95 ${
        isShipped
          ? 'border-emerald-800/70 bg-neutral-900/80 hover:border-emerald-700 hover:shadow-emerald-950/20'
          : 'border-dashed border-neutral-700/80 bg-neutral-900/40 hover:border-neutral-600'
      }`}
    >
      {/* Ticket-stub perforated circular notches on left & right edge */}
      <div className="absolute -left-2.5 top-1/2 -mt-2.5 h-5 w-5 rounded-full bg-neutral-950 border border-neutral-800" />
      <div className="absolute -right-2.5 top-1/2 -mt-2.5 h-5 w-5 rounded-full bg-neutral-950 border border-neutral-800" />

      {/* Perforated dashed line down the center/sub-bar */}
      <div className="flex items-start justify-between gap-3 pl-2 pr-2">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-wider">
              {stamp.eventName}
            </span>
            <span className="text-neutral-600">•</span>
            <span className="font-mono text-[11px] text-neutral-400">{stamp.dates}</span>
          </div>

          <h3 className="truncate text-base font-semibold text-neutral-100 group-hover:text-emerald-400 transition-colors">
            {stamp.name}
          </h3>
        </div>

        {/* Ink Stamp Badge on the right */}
        <div className="shrink-0 text-right">
          {isShipped ? (
            <div className="inline-flex flex-col items-center justify-center rounded border border-emerald-500/70 bg-emerald-950/40 px-2 py-1 rotate-[-3deg] shadow-xs">
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-400">
                PASSPORT
              </span>
              <span className="font-mono text-[11px] font-black uppercase text-emerald-300">
                SHIPPED
              </span>
            </div>
          ) : (
            <div className="inline-flex flex-col items-center justify-center rounded border border-neutral-700 bg-neutral-800/50 px-2 py-1 rotate-[2deg]">
              <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400">
                PHASE
              </span>
              <span className="font-mono text-[10px] font-semibold uppercase text-neutral-300">
                {stamp.furthestStage || 'BUILDING'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom stub metadata */}
      <div className="mt-4 pt-3 border-t border-dashed border-neutral-800 flex items-center justify-between text-xs text-neutral-400 pl-2 pr-2">
        <div className="flex items-center gap-2">
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-mono uppercase ${
            isLeader ? 'bg-amber-950/40 text-amber-400 border border-amber-800/40' : 'bg-neutral-800 text-neutral-300'
          }`}>
            {stamp.role}
          </span>
          {stamp.outcome && (
            <span className="truncate max-w-[200px] text-[11px] text-neutral-300">
              {stamp.outcome}
            </span>
          )}
        </div>

        <span className="font-mono text-[11px] text-neutral-400 group-hover:text-neutral-200 transition-colors">
          View case study →
        </span>
      </div>
    </div>
  );
};
