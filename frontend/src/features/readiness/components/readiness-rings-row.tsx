/**
 * ReadinessRingsRow / ReadinessRing — S23
 * C11 progress ring at 56px (lg). Six rings exactly, one row.
 * PRD 5b §3.1. [D §5, C11].
 *
 * AC-23-1: Exactly six rings in order.
 * AC-23-2: 56px, 3px stroke, track surface-sunken, value stroke #4F8F1A.
 *          Each ring is one link ≥44px with accessible name = label + valueText.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ReadinessRing } from '../api/types';

const RING_SIZE = 56;
const STROKE = 3;
/** Substitute roomId placeholder in destination paths from data */
function resolveDestination(dest: string, roomId: string): string {
  return dest.replace(':roomId', roomId);
}

interface ReadinessRingProps {
  ring: ReadinessRing;
  roomId: string;
  /** Whether the enter animation has already run this session */
  animationDone: boolean;
  onAnimationDone: () => void;
  index: number;
}

function ReadinessRingItem({
  ring,
  roomId,
  animationDone,
  onAnimationDone,
  index,
}: ReadinessRingProps) {
  const prefersReduced = useReducedMotion();
  const radius = RING_SIZE / 2 - STROKE * 2;
  const circumference = radius * 2 * Math.PI;
  const targetOffset = circumference - ring.progress * circumference;

  const [displayOffset, setDisplayOffset] = useState(
    animationDone || prefersReduced ? targetOffset : circumference,
  );

  // On first render (not done yet): animate all rings together after a short mount delay
  useEffect(() => {
    if (animationDone || prefersReduced) {
      setDisplayOffset(targetOffset);
      return;
    }
    // Delay slightly so all rings mount before animation starts
    const t = setTimeout(() => {
      setDisplayOffset(targetOffset);
      if (index === 0) {
        // Signal parent after the 480 ms fill duration
        setTimeout(onAnimationDone, 480);
      }
    }, 50);
    return () => clearTimeout(t);
  }, []);

  // Retarget when data changes after initial animation
  useEffect(() => {
    if (animationDone) {
      setDisplayOffset(targetOffset);
    }
  }, [ring.progress, animationDone]);

  const href = resolveDestination(ring.destination, roomId);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={href}
          className={cn(
            'flex flex-col items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
            'min-w-[44px] min-h-[44px] justify-center rounded-lg p-1',
          )}
          aria-label={`${ring.label}: ${ring.valueText}`}
        >
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            className="-rotate-90"
            aria-hidden="true"
          >
            {/* Track */}
            <circle
              stroke="var(--surface-sunken)"
              fill="transparent"
              strokeWidth={STROKE}
              r={radius}
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
            />
            {/* Value arc */}
            <circle
              stroke="#4F8F1A"
              fill="transparent"
              strokeWidth={STROKE}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={displayOffset}
              strokeLinecap="round"
              r={radius}
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              style={{
                transition: animationDone
                  ? 'stroke-dashoffset 500ms cubic-bezier(0.16, 1, 0.3, 1)'
                  : prefersReduced
                  ? 'none'
                  : 'stroke-dashoffset 480ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </svg>
          {/* Value text beside ring */}
          <span className="text-caption font-semibold text-ink tabular-nums text-center leading-tight">
            {ring.valueText}
          </span>
          {/* Label below */}
          <span className="text-[11px] font-semibold text-ink-muted text-center leading-tight max-w-[72px] line-clamp-2">
            {ring.label}
          </span>
        </Link>
      </TooltipTrigger>
      <TooltipContent>{ring.label}: {ring.valueText}</TooltipContent>
    </Tooltip>
  );
}

interface ReadinessRingsRowProps {
  rings: ReadinessRing[];
  roomId: string;
  /** Marks whether the enter animation ran this session (from parent store) */
  animationDone: boolean;
  onAnimationDone: () => void;
}

export function ReadinessRingsRow({ rings, roomId, animationDone, onAnimationDone }: ReadinessRingsRowProps) {
  // Exactly six rings per AC-23-1; slice defensively
  const sixRings = rings.slice(0, 6);

  return (
    <div
      className="flex flex-wrap gap-4 justify-start"
      role="list"
      aria-label="Readiness rings"
    >
      {sixRings.map((ring, i) => (
        <div key={ring.id} role="listitem">
          <ReadinessRingItem
            ring={ring}
            roomId={roomId}
            animationDone={animationDone}
            onAnimationDone={onAnimationDone}
            index={i}
          />
        </div>
      ))}
    </div>
  );
}
