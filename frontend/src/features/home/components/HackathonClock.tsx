import React, { useEffect, useState, useContext } from 'react';
import { cn } from '@/lib/utils';
import { Calendar, CheckCircle2, Circle } from 'lucide-react';
import { TagChip, InlineHighlight } from './HomeDesignSystem';
import { HomeContext } from '../home-page';
import { useCountdown, formatTime } from '@/utils/time';

interface TimelinePhase {
  name: string;
  width: number;
  state?: string;
}

const defaultPhases: TimelinePhase[] = [
  { name: 'Plan', width: 25 },
  { name: 'Build', width: 35 },
  { name: 'Freeze', width: 10 },
  { name: 'Polish', width: 15 },
  { name: 'Submit', width: 15 },
];

function RollingDigit({ char }: { char: string }) {
  return (
    <span className="relative inline-flex flex-col overflow-hidden h-[76px] leading-[76px]">
      <span
        key={char}
        className="animate-slide-up inline-block"
        style={{ animation: 'slideUp 200ms var(--ease-home)' }}
      >
        {char}
      </span>
    </span>
  );
}

function RollingTimeText({ text }: { text: string }) {
  return (
    <div
      className="flex items-baseline font-[600] text-[var(--color-home-text-primary)] tracking-[-0.03em]"
      style={{ fontSize: 64, fontVariantNumeric: 'tabular-nums' }}
    >
      {text.split('').map((char, i) => (
        <React.Fragment key={i}>
          {/\d/.test(char) ? <RollingDigit char={char} /> : <span>{char}</span>}
        </React.Fragment>
      ))}
      <span className="text-[20px] font-[500] text-[var(--color-home-text-secondary)] tracking-normal ml-3">
        left
      </span>
    </div>
  );
}

export function HackathonClock() {
  const [mounted, setMounted] = useState(false);
  const { homeData } = useContext(HomeContext);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selected = homeData?.selected;
  const clock = selected?.clock;
  const endsAt = clock?.endsAt;
  const countdown = useCountdown(endsAt);
  const remainingText = countdown.secondsLeft > 0 ? countdown.formatted : '0h 00m';

  const userTimezone = homeData?.user?.timezone;
  const absoluteTime = endsAt ? formatTime(endsAt, userTimezone) : 'Event end pending';

  const rawTimeline = selected?.timeline || [];
  const phases: TimelinePhase[] = rawTimeline.length > 0
    ? rawTimeline.map((t: any) => ({
        name: t.name,
        width: Math.max(5, (t.endPct ?? 100) - (t.startPct ?? 0)),
        state: t.state,
      }))
    : defaultPhases;

  const currentPhaseIndex = phases.findIndex((p) => p.state === 'current');
  const activeIdx = currentPhaseIndex >= 0 ? currentPhaseIndex : 1;

  let elapsedWidth = 0;
  for (let i = 0; i < activeIdx; i++) {
    elapsedWidth += phases[i].width;
  }
  elapsedWidth += phases[activeIdx]?.width ? phases[activeIdx].width * 0.5 : 0;

  const statusLabel = clock?.status ? clock.status.replace('_', ' ') : 'ON TRACK';
  const tagColor = clock?.status === 'DUE_SOON' ? 'amber' : clock?.status === 'FINAL_STRETCH' ? 'red' : 'blue';

  const nextCheckpoint = selected?.nextCheckpoint;

  return (
    <div
      className="bg-white rounded-[var(--radius-home-card)] p-8 shadow-[var(--shadow-home-card)] font-[var(--font-inter)] relative flex flex-col"
      style={{
        transform: 'scale(0.7)',
        transformOrigin: 'top left',
        marginTop: '-24px',
        marginBottom: '-90px',
        width: '118%',
      }}
    >
      {/* Top Row */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-[24px] text-[var(--color-home-text-secondary)] font-[600]">
          {clock?.label || 'Submission closes'}
        </span>
        <TagChip label={statusLabel} color={tagColor} />
      </div>

      {/* Big Number */}
      <RollingTimeText text={remainingText} />

      {/* Absolute Time */}
      <div className="flex items-center gap-1.5 text-[20px] text-[var(--color-home-text-secondary)] font-[500] mt-1 mb-10">
        <Calendar className="w-6 h-6" />
        <span>{absoluteTime}</span>
      </div>

      {/* Phase Timeline */}
      <div className="relative mb-8">
        <div className="flex gap-1 h-[12px] w-full">
          {phases.map((phase, idx) => {
            const isPast = idx < activeIdx || phase.state === 'done';
            const isCurrent = idx === activeIdx || phase.state === 'current';

            return (
              <div
                key={phase.name}
                className="relative h-full rounded-[6px] overflow-hidden group"
                style={{ width: `${phase.width}%`, backgroundColor: '#E8E8E8' }}
              >
                {/* Fill */}
                <div
                  className="absolute left-0 top-0 h-full rounded-[6px] transition-all duration-[var(--dur-chart)] ease-[var(--ease-home)]"
                  style={{
                    width: mounted ? (isPast ? '100%' : isCurrent ? '50%' : '0%') : '0%',
                    backgroundColor: isPast
                      ? '#141414'
                      : isCurrent
                      ? 'var(--color-home-accent)'
                      : 'transparent',
                  }}
                />

                {/* Tooltip on hover */}
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-150 bottom-full left-1/2 -translate-x-1/2 mb-3 bg-[var(--color-home-tooltip-bg)] text-[var(--color-home-tooltip-fg)] text-[14px] p-3 rounded-[12px] shadow-[var(--shadow-home-tooltip)] w-max max-w-[220px] pointer-events-none z-50">
                  <div className="font-[600] mb-1">{phase.name}</div>
                  <div className="text-[var(--color-home-tooltip-lbl)] leading-tight text-[13px]">
                    Phase details and exit checkpoint info.
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* You Are Here Marker */}
        <div
          className="absolute top-[6px] -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-[3px] border-[var(--color-home-accent)] z-10 transition-all duration-[var(--dur-chart)] ease-[var(--ease-home)]"
          style={{
            left: mounted ? `${Math.min(100, elapsedWidth)}%` : '0%',
            boxShadow: '0 0 0 0 rgba(47, 155, 234, 0.4)',
            animation: 'pulse-glow 2.4s infinite cubic-bezier(0.66, 0, 0, 1)',
          }}
        />

        {/* Labels below timeline */}
        <div className="flex gap-1 mt-3 w-full">
          {phases.map((phase, idx) => {
            const isCurrent = idx === activeIdx;
            return (
              <div
                key={phase.name}
                className={cn(
                  'text-[17px] text-center truncate',
                  isCurrent
                    ? 'text-[var(--color-home-text-primary)] font-[600]'
                    : 'text-[var(--color-home-text-tertiary)] font-[500]'
                )}
                style={{ width: `${phase.width}%` }}
              >
                {phase.name}
              </div>
            );
          })}
        </div>
      </div>

      <div className="h-[1px] bg-[var(--color-home-hairline)] w-full mb-6" />

      {/* Checkpoint Row */}
      {nextCheckpoint && (
        <div className="flex items-center gap-3">
          {nextCheckpoint.passed ? (
            <CheckCircle2 className="w-6 h-6 text-[var(--color-home-chip-green-fg)]" />
          ) : (
            <Circle className="w-6 h-6 text-[#E4E4E4]" strokeWidth={2.5} />
          )}
          <span className="text-[20px] font-[500] text-[var(--color-home-text-primary)]">
            {nextCheckpoint.label}
          </span>
          <TagChip
            label={`${nextCheckpoint.countPassed ?? 0} / ${nextCheckpoint.countTotal ?? 0}`}
            color="blue"
            className="ml-1"
          />
          {nextCheckpoint.linkHref && (
            <div className="ml-auto">
              <InlineHighlight asLink href={nextCheckpoint.linkHref}>
                {nextCheckpoint.linkText || 'View'}
              </InlineHighlight>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(47, 155, 234, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(47, 155, 234, 0); }
          100% { box-shadow: 0 0 0 0 rgba(47, 155, 234, 0); }
        }
      `}</style>
    </div>
  );
}
