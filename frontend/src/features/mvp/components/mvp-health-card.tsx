import React from 'react';
import { cn } from '@/lib/utils';
import type { MvpState } from '@/services/types';

export interface MvpHealthCardProps {
  health: MvpState['health'];
  onToggleHealth: (key: keyof MvpState['health']) => void;
}

const HEALTH_ITEMS: { key: keyof MvpState['health']; label: string; helper: string }[] = [
  {
    key: 'runs',
    label: 'Runs end to end',
    helper: 'Walk the core flow once without errors',
  },
  {
    key: 'stable',
    label: 'Works without flaky external services',
    helper: 'Mock or cache third-party calls',
  },
  {
    key: 'clear30',
    label: 'A judge can understand it in 30 seconds',
    helper: 'Shorten the identity sentence',
  },
  {
    key: 'wow60',
    label: 'The wow moment lands in the first minute',
    helper: 'Move it earlier in the demo',
  },
];

export function MvpHealthCard({ health, onToggleHealth }: MvpHealthCardProps) {
  const passedCount = Object.values(health).filter(Boolean).length;
  const total = 4;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const progress = passedCount / total;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="bg-card rounded-[24px] border border-border p-5 shadow-xs flex flex-col gap-4">
      {/* Header with 56px Ring */}
      <div className="flex items-center gap-3">
        <div className="relative size-14 shrink-0">
          <svg className="size-14 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r={radius} stroke="#E5E7EB" strokeWidth="4" fill="none" />
            <circle
              cx="28" cy="28" r={radius}
              stroke={passedCount === total ? '#10B981' : '#F59E0B'}
              strokeWidth="4"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-foreground font-mono">
            {passedCount}/{total}
          </div>
        </div>

        <div className="flex flex-col">
          <h3 className="text-base font-semibold text-foreground">
            MVP Health
          </h3>
          <span className="text-xs text-muted-foreground">
            Pre-flight checklist before judging
          </span>
        </div>
      </div>

      {/* 4 Rows (40px) */}
      <div className="flex flex-col divide-y divide-border/40 text-xs">
        {HEALTH_ITEMS.map(item => {
          const isOn = health[item.key];

          return (
            <div key={item.key} className="py-2.5 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className={cn('font-medium text-foreground', !isOn && 'text-muted-foreground')}>
                  {item.label}
                </span>

                {/* 36x20 pill Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isOn}
                  onClick={() => onToggleHealth(item.key)}
                  className={cn(
                    'w-9 h-5 rounded-full transition-colors duration-200 relative shrink-0 p-0.5 focus:outline-none',
                    isOn ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'size-4 rounded-full bg-white block shadow-xs transition-transform duration-200',
                      isOn ? 'translate-x-4' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              {/* Amber helper line when off */}
              {!isOn && (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-normal">
                  {item.helper}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
