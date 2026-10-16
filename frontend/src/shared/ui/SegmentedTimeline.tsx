import { cn } from '@/lib/utils';

export interface TimelineSegment {
  id: string;
  weight: number;
  label?: string;
}

export interface SegmentedTimelineProps {
  segments: TimelineSegment[];
  size?: 'sm' | 'lg';
  activeId?: string;
  onActiveChange?: (id?: string) => void;
  className?: string;
  'data-testid'?: string;
}

const SM_OPACITY_CLASSES = [
  'bg-ink/25',
  'bg-ink/30',
  'bg-ink/40',
  'bg-ink/50',
  'bg-ink/60',
  'bg-ink/70',
  'bg-ink/80',
  'bg-ink/85',
  'bg-ink/90',
  'bg-ink',
];

export function SegmentedTimeline({
  segments,
  size = 'sm',
  activeId,
  onActiveChange,
  className,
  'data-testid': testId,
}: SegmentedTimelineProps) {
  if (!segments || segments.length === 0) return null;

  const allZeroOrMissing = segments.every((s) => !s.weight || s.weight <= 0);

  if (size === 'sm') {
    return (
      <div
        className={cn('flex items-center gap-0.5 w-full h-1.5', className)}
        data-testid={testId}
      >
        {segments.map((seg, idx) => {
          const stepIdx =
            segments.length <= 1
              ? SM_OPACITY_CLASSES.length - 1
              : Math.min(
                  SM_OPACITY_CLASSES.length - 1,
                  Math.round(
                    (idx / (segments.length - 1)) *
                      (SM_OPACITY_CLASSES.length - 1)
                  )
                );
          const opacityClass = SM_OPACITY_CLASSES[stepIdx];
          const grow = allZeroOrMissing ? 1 : Math.max(0.1, seg.weight || 1);

          return (
            <div
              key={seg.id || idx}
              style={{ flexGrow: grow }}
              className={cn('h-1.5 min-w-[6px] rounded-full', opacityClass)}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn('flex items-center gap-0.5 w-full h-8', className)}
      data-testid={testId}
    >
      {segments.map((seg, idx) => {
        const grow = allZeroOrMissing ? 1 : Math.max(0.1, seg.weight || 1);
        const isActive = activeId !== undefined && activeId === seg.id;
        const phaseNumber = idx + 1;

        return (
          <button
            key={seg.id || idx}
            type="button"
            style={{ flexGrow: grow }}
            aria-label={`Phase ${phaseNumber}: ${seg.label || `Phase ${phaseNumber}`}`}
            onMouseEnter={() => onActiveChange?.(seg.id)}
            onMouseLeave={() => onActiveChange?.(undefined)}
            onFocus={() => onActiveChange?.(seg.id)}
            onBlur={() => onActiveChange?.(undefined)}
            className={cn(
              'h-8 min-w-[6px] rounded-[8px] flex items-center justify-center transition-colors duration-150 cursor-pointer overflow-hidden',
              'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
              isActive
                ? 'bg-selected text-on-selected border-transparent'
                : 'bg-active border border-border text-ink hover:border-border-strong'
            )}
          >
            <span className="text-xs font-medium tabular-nums px-1 truncate">
              {phaseNumber}
            </span>
          </button>
        );
      })}
    </div>
  );
}
