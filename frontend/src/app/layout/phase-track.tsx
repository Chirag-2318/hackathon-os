/**
 * C03 Phase Track — room pages only
 * Source: design.md §3.1, PRD §3.4
 *
 * 7 pills: Prep · Ideate · Plan · Build · Freeze · Ship · Retro
 * Current = black pill; completed = check; future = muted.
 * 6px phase-color dot on each pill.
 * Right: Rubric button + Decision-timer chip.
 * Click = filter state update, not navigation.
 */
import { cn } from 'cn';
import { Check, BookOpen, Timer } from 'lucide-react';
import { usePhaseFilterStore, type PhaseId } from './use-phase-filter';
import { useOverlay } from '@/app/providers/overlay-store';

interface PhaseConfig {
  id: PhaseId;
  label: string;
  dotColor: string;
}

/**
 * Phase colors from design.md §2.1 pastel table.
 * Retro uses pastel-pink (#FCC4E0) per resolved OQ-1 default.
 */
const phases: PhaseConfig[] = [
  { id: 'prep', label: 'Prep', dotColor: '#D7EDFB' },
  { id: 'ideate', label: 'Ideate', dotColor: '#C4C5FC' },
  { id: 'plan', label: 'Plan', dotColor: '#B7D9FF' },
  { id: 'build', label: 'Build', dotColor: '#C9EF84' },
  { id: 'freeze', label: 'Freeze', dotColor: '#FDD484' },
  { id: 'ship', label: 'Ship', dotColor: '#F9B672' },
  { id: 'retro', label: 'Retro', dotColor: '#FCC4E0' },
];

interface PhaseTrackProps {
  /** Index of the current phase (0-based) */
  currentPhaseIndex?: number;
  /** Whether a decision timer is active */
  showDecisionTimer?: boolean;
  className?: string;
}

export function PhaseTrack({
  currentPhaseIndex = 3, // Default: Build
  showDecisionTimer = false,
  className,
}: PhaseTrackProps) {
  const { selectedPhase, togglePhase } = usePhaseFilterStore();
  const rubricOverlay = useOverlay('rubric-drawer');

  return (
    <div
      className={cn(
        'flex items-center justify-between px-6 py-2 bg-canvas border-b border-border',
        className
      )}
    >
      {/* Phase pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {phases.map((phase, index) => {
          const isCurrent = index === currentPhaseIndex;
          const isCompleted = index < currentPhaseIndex;
          const isFuture = index > currentPhaseIndex;
          const isSelected = selectedPhase === phase.id;

          return (
            <button
              key={phase.id}
              onClick={() => togglePhase(phase.id)}
              className={cn(
                'flex items-center gap-1.5 h-8 px-3 rounded-pill text-caption font-semibold transition-colors',
                isCurrent && 'bg-[#0B0C0C] text-white',
                isCompleted && 'bg-surface-sunken text-ink hover:bg-border',
                isFuture && 'bg-transparent text-ink-muted hover:bg-surface-sunken',
                isSelected && !isCurrent && 'ring-2 ring-lav-600'
              )}
              aria-pressed={isSelected}
              aria-label={`${phase.label} phase${isCurrent ? ' (current)' : ''}${isCompleted ? ' (completed)' : ''}`}
            >
              {/* 6px phase-color dot */}
              <span
                className="size-1.5 rounded-full shrink-0"
                style={{ backgroundColor: phase.dotColor }}
              />

              {/* Check for completed phases */}
              {isCompleted && (
                <Check className="size-3.5 shrink-0" />
              )}

              <span>{phase.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right side: Rubric button + Decision timer */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={rubricOverlay.open}
          className="flex items-center gap-1.5 h-8 px-3 rounded-pill text-caption font-semibold text-ink-muted hover:text-ink hover:bg-surface-sunken transition-colors"
          aria-label="Open rubric"
        >
          <BookOpen className="size-4" />
          <span className="hidden lg:inline">Rubric</span>
        </button>

        {showDecisionTimer && (
          <div className="flex items-center gap-1.5 h-8 px-3 rounded-pill bg-pastel-peach text-ink text-caption font-semibold">
            <Timer className="size-3.5" />
            <span className="tabular-nums">Decide in 08:42</span>
          </div>
        )}
      </div>
    </div>
  );
}
