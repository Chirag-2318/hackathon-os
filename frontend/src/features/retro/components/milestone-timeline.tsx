/**
 * MilestoneTimeline — S24 vertical timeline
 * PRD 5b §3.2. [D S24].
 *
 * Vertical list, sorted by hour ascending.
 * Dot fill = the pastel of the milestone's phase [D §2.1].
 * Phase name shown as text (color is never the only encoding [D §10]).
 * Built from data — no hard-coded items.
 *
 * AC-24-2: Vertical, sorted by hour, data-driven (fourth/fifth milestone renders).
 */
import { motion, useReducedMotion } from 'framer-motion';
import { EmptyState } from '@/components/primitives/empty-state';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Milestone, PhaseId } from '../api/types';
import { MapPin } from 'lucide-react';

/** Phase pastels from design.md §2.1 */
const PHASE_PASTELS: Record<PhaseId, string> = {
  prep:   '#D7EDFB',
  ideate: '#C4C5FC',
  plan:   '#B7D9FF',
  build:  '#C9EF84',
  freeze: '#FDD484',
  ship:   '#F9B672',
  retro:  '#FCC4E0',
};

/** Human-readable phase labels */
const PHASE_LABELS: Record<PhaseId, string> = {
  prep:   'Prep',
  ideate: 'Ideate',
  plan:   'Plan',
  build:  'Build',
  freeze: 'Freeze',
  ship:   'Ship',
  retro:  'Retro',
};

interface MilestoneItemProps {
  milestone: Milestone;
  index: number;
  /** Whether timeline enter animation has run yet [A §6.2] */
  animationDone: boolean;
}

function MilestoneItem({ milestone, index, animationDone }: MilestoneItemProps) {
  const prefersReduced = useReducedMotion();
  const phaseColor = PHASE_PASTELS[milestone.phase] ?? '#E3E5DA';
  const phaseLabel = PHASE_LABELS[milestone.phase] ?? milestone.phase;

  // 60 ms stagger, max 8 items then all together [A §6.2]
  const staggerDelay = animationDone ? 0 : Math.min(index, 8) * 0.06;

  return (
    <motion.li
      initial={animationDone || prefersReduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReduced
        ? { duration: 0 }
        : { delay: staggerDelay, duration: 0.22, ease: [0.16, 1, 0.3, 1] }
      }
      className="flex items-start gap-3 relative"
    >
      {/* Phase-colored dot — color redundant with phase text [D §10] */}
      <div className="flex flex-col items-center shrink-0 mt-1">
        <div
          className="size-3 rounded-full border border-border shrink-0"
          style={{ backgroundColor: phaseColor }}
          aria-hidden="true"
        />
        {/* Connector line */}
        <div className="w-px flex-1 bg-border min-h-[20px] mt-1" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-body-strong text-ink line-clamp-2 leading-snug">
              {milestone.title}
            </p>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">{milestone.title}</TooltipContent>
        </Tooltip>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-caption tabular-nums text-ink-muted">
            Hour {milestone.hour}
          </span>
          <span className="text-caption text-ink-muted" aria-hidden="true">·</span>
          {/* Phase label: redundant non-color encoding for the dot */}
          <span
            className="text-caption px-1.5 rounded font-semibold text-ink"
            style={{ backgroundColor: phaseColor }}
          >
            {phaseLabel}
          </span>
        </div>
      </div>
    </motion.li>
  );
}

interface MilestoneTimelineProps {
  milestones: Milestone[];
  /** Whether the enter animation has run this session */
  animationDone: boolean;
}

export function MilestoneTimeline({ milestones, animationDone }: MilestoneTimelineProps) {
  if (milestones.length === 0) {
    return (
      <EmptyState
        icon={<MapPin />}
        title="No milestones yet"
        description="Milestones will appear here as your team hits key moments."
        dashed
      />
    );
  }

  // Sort by hour ascending
  const sorted = [...milestones].sort((a, b) => a.hour - b.hour);

  return (
    <ol
      className="flex flex-col"
      aria-label="Milestone timeline"
    >
      {sorted.map((m, i) => (
        <MilestoneItem
          key={m.id}
          milestone={m}
          index={i}
          animationDone={animationDone}
        />
      ))}
    </ol>
  );
}
