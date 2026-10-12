import React, { useEffect, useState, useContext } from 'react';
import { cn } from '@/lib/utils';
import { Calendar, CheckCircle2, Circle } from 'lucide-react';
import { TagChip, InlineHighlight } from './HomeDesignSystem';
import { HomeContext } from '../home-page';
import { useCountdown, formatTime, getServerNowMs } from '@/utils/time';

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

const JOURNEY_STEPS = [
  { name: 'Brief', key: 'brief' },
  { name: 'Ideate', key: 'ideate' },
  { name: 'Plan', key: 'plan' },
  { name: 'Build', key: 'build' },
];

function RollingDigit({ char }: { char: string }) {
  return (
    <span className="relative inline-flex flex-col overflow-hidden h-[54px] sm:h-[68px] leading-[54px] sm:leading-[68px]">
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
      className="flex items-baseline font-[600] text-[var(--color-home-text-primary)] tracking-[-0.03em] flex-wrap"
      style={{ fontSize: 48, fontVariantNumeric: 'tabular-nums' }}
    >
      {text.split('').map((char, i) => (
        <React.Fragment key={i}>
          {/\d/.test(char) ? <RollingDigit char={char} /> : <span>{char}</span>}
        </React.Fragment>
      ))}
      <span className="text-[18px] font-[500] text-[var(--color-home-text-secondary)] tracking-normal ml-3">
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
  const stage = (selected?.stage || '').toLowerCase();
  const isPlanning = selected?.variant === 'planning' || ['brief', 'ideate', 'plan'].includes(stage);

  const clock = selected?.clock;
  const userTimezone = homeData?.user?.timezone;

  // Planning countdown calculation
  const targetAt = clock?.targetAt || clock?.eventStart || selected?.eventStart || clock?.endsAt;
  const nowMs = getServerNowMs();
  const targetMs = targetAt ? new Date(targetAt).getTime() : 0;
  const diffSec = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
  const totalHours = Math.floor(diffSec / 3600);

  let planningRemainingText = '0h 00m';
  if (diffSec > 0) {
    if (totalHours > 48) {
      const days = Math.floor(totalHours / 24);
      const remHours = totalHours % 24;
      planningRemainingText = `${days}d ${remHours}h`;
    } else {
      const minutes = Math.floor((diffSec % 3600) / 60);
      planningRemainingText = `${totalHours}h ${minutes.toString().padStart(2, '0')}m`;
    }
  }

  // Build countdown
  const endsAt = clock?.endsAt;
  const countdown = useCountdown(endsAt);
  const buildRemainingText = countdown.secondsLeft > 0 ? countdown.formatted : '0h 00m';

  const remainingText = isPlanning ? planningRemainingText : buildRemainingText;
  const absoluteTime = targetAt
    ? formatTime(targetAt, userTimezone)
    : endsAt
    ? formatTime(endsAt, userTimezone)
    : 'Event time pending';

  // Planning 4-step journey
  const stageIndexMap: Record<string, number> = {
    brief: 0,
    ideate: 1,
    plan: 2,
    build: 3,
  };
  const currentStepIdx = stageIndexMap[stage] ?? 0;

  // Build 5-phase timeline
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
    <div className="bg-white rounded-[var(--radius-home-card)] p-6 sm:p-7 shadow-[var(--shadow-home-card)] font-[var(--font-inter)] flex flex-col w-full min-w-0">
      {/* Top Row */}
      <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
        <span className="text-[18px] sm:text-[20px] text-[var(--color-home-text-secondary)] font-[600]">
          {isPlanning ? (clock?.label || 'Event starts in') : (clock?.label || 'Submission closes')}
        </span>
        {isPlanning ? (
          <TagChip label="PLANNING" color="blue" />
        ) : (
          <TagChip label={statusLabel} color={tagColor} />
        )}
      </div>

      {/* Big Number */}
      <RollingTimeText text={remainingText} />

      {/* Absolute Time */}
      <div className="flex items-center gap-2 text-[15px] sm:text-[16px] text-[var(--color-home-text-secondary)] font-[500] mt-1 mb-6">
        <Calendar className="w-4 h-4 shrink-0" />
        <span>{absoluteTime}</span>
      </div>

      {/* Timeline Section */}
      {isPlanning ? (
        /* Planning 4 Journey Steps */
        <div className="relative mb-6">
          <div className="flex gap-2 h-[10px] w-full">
            {JOURNEY_STEPS.map((step, idx) => {
              const isDone = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              return (
                <div
                  key={step.key}
                  className="flex-1 h-full rounded-[6px] overflow-hidden"
                  style={{
                    backgroundColor: isDone
                      ? '#141414'
                      : isCurrent
                      ? 'var(--color-home-accent)'
                      : '#E8E8E8',
                  }}
                />
              );
            })}
          </div>

          {/* Labels below */}
          <div className="flex gap-2 mt-2.5 w-full">
            {JOURNEY_STEPS.map((step, idx) => {
              const isCurrent = idx === currentStepIdx;
              const isDone = idx < currentStepIdx;
              return (
                <div
                  key={step.key}
                  className={cn(
                    'flex-1 text-[13px] text-center truncate',
                    isCurrent
                      ? 'text-[var(--color-home-text-primary)] font-[600]'
                      : isDone
                      ? 'text-[var(--color-home-text-primary)] font-[500]'
                      : 'text-[var(--color-home-text-tertiary)] font-[400]'
                  )}
                >
                  {step.name}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Build 5-phase Timeline */
        <div className="relative mb-6">
          <div className="flex gap-1 h-[10px] w-full">
            {phases.map((phase, idx) => {
              const isPast = idx < activeIdx || phase.state === 'done';
              const isCurrent = idx === activeIdx || phase.state === 'current';

              return (
                <div
                  key={phase.name}
                  className="relative h-full rounded-[6px] overflow-hidden group"
                  style={{ width: `${phase.width}%`, backgroundColor: '#E8E8E8' }}
                >
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
                </div>
              );
            })}
          </div>

          <div className="flex gap-1 mt-2.5 w-full">
            {phases.map((phase, idx) => {
              const isCurrent = idx === activeIdx;
              return (
                <div
                  key={phase.name}
                  className={cn(
                    'text-[13px] text-center truncate',
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
      )}

      {/* Checkpoint Row */}
      {nextCheckpoint && (
        <>
          <div className="h-[1px] bg-[var(--color-home-hairline)] w-full mb-4" />
          <div className="flex items-center gap-3">
            {nextCheckpoint.passed ? (
              <CheckCircle2 className="w-5 h-5 text-[var(--color-home-chip-green-fg)] shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-[#E4E4E4] shrink-0" strokeWidth={2.5} />
            )}
            <span className="text-[15px] font-[500] text-[var(--color-home-text-primary)] truncate">
              {nextCheckpoint.label}
            </span>
            <TagChip
              label={`${nextCheckpoint.countPassed ?? 0} / ${nextCheckpoint.countTotal ?? 0}`}
              color="blue"
              className="ml-1 shrink-0"
            />
            {nextCheckpoint.linkHref && (
              <div className="ml-auto shrink-0">
                <InlineHighlight asLink href={nextCheckpoint.linkHref}>
                  {nextCheckpoint.linkText || 'View'}
                </InlineHighlight>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
