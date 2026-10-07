/**
 * WeakSpotList / WeakSpotRow — S23
 * C10b list row: 64px, 40px identity tile, ordered by severity.
 * PRD 5b §3.1. [D C10b].
 *
 * AC-23-3: C10b rows 64px, 40px tile, most severe first, truncate at 2 lines with tooltip.
 */
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { WeakSpot, WeakSpotSeverity } from '../api/types';

/** Severity visual encoding — icon + label (not color only) */
const SEVERITY_CONFIG: Record<WeakSpotSeverity, { label: string; icon: string; badgeClass: string }> = {
  high:   { label: 'High',   icon: '⚠', badgeClass: 'bg-pastel-peach text-ink' },
  medium: { label: 'Medium', icon: '●', badgeClass: 'bg-pastel-amber text-ink' },
  low:    { label: 'Low',    icon: '○', badgeClass: 'bg-surface-sunken text-ink-muted' },
};

/** Pastel fills for the 2-letter code tile (cycle through pastels, never color-as-meaning) */
const TILE_PASTELS = [
  'var(--pastel-lavender)',
  'var(--pastel-sky)',
  'var(--pastel-lime)',
  'var(--pastel-cream)',
  'var(--pastel-ice)',
  'var(--pastel-blush)',
];

function tileColor(index: number): string {
  return TILE_PASTELS[index % TILE_PASTELS.length];
}

interface WeakSpotRowProps {
  spot: WeakSpot;
  index: number;
}

function WeakSpotRow({ spot, index }: WeakSpotRowProps) {
  const sev = SEVERITY_CONFIG[spot.severity];

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 bg-surface hover:bg-hover-row transition-colors cursor-default',
        'min-h-[64px] border-b border-border last:border-b-0',
      )}
      role="listitem"
    >
      {/* 40px identity tile */}
      <div
        className="size-10 rounded-lg flex items-center justify-center shrink-0 text-caption font-bold text-ink"
        style={{ backgroundColor: tileColor(index) }}
        aria-hidden="true"
      >
        {spot.code}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-body-strong text-ink line-clamp-2 leading-snug">
              {spot.title}
            </p>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">{spot.title}</TooltipContent>
        </Tooltip>
        <p className="text-caption text-ink-muted mt-0.5 truncate">
          {spot.owner}
        </p>
      </div>

      {/* Trailing: severity badge + percent */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span
          className={cn(
            'inline-flex items-center gap-1 text-caption px-2 h-5 rounded-chip font-semibold',
            sev.badgeClass,
          )}
          aria-label={`Severity: ${sev.label}`}
        >
          <span aria-hidden="true">{sev.icon}</span>
          {sev.label}
        </span>
        {spot.percent > 0 && (
          <span className="text-caption tabular-nums text-ink-muted">
            {spot.percent}%
          </span>
        )}
      </div>
    </div>
  );
}

interface WeakSpotListProps {
  spots: WeakSpot[];
}

export function WeakSpotList({ spots }: WeakSpotListProps) {
  if (spots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-ink-muted">
        <span className="text-2xl mb-2" aria-hidden="true">✓</span>
        <p className="text-body font-semibold text-ink">No weak spots found</p>
        <p className="text-caption">Run the simulator to identify areas to improve.</p>
      </div>
    );
  }

  return (
    <div role="list" aria-label="Weak spots, ordered by severity">
      {/* Virtualization: render all items; for >50 a virtual list would replace this div [AC-23-3] */}
      {spots.map((spot, i) => (
        <WeakSpotRow key={spot.id} spot={spot} index={i} />
      ))}
    </div>
  );
}
