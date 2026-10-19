import { createElement } from 'react';
import { ChevronRight, Users, Layers, Clock } from 'lucide-react';
import type { PlaybookDetail } from '@/api/client';
import { getPlaybookIcon } from '../playbook-icons';
import { SegmentedTimeline } from '@/shared/ui';
import { cn } from '@/lib/utils';

export interface PlaybookCardProps {
  playbook?: PlaybookDetail;
  onClick?: () => void;
  id?: string;
  slug?: string;
  title?: string;
  eventType?: string;
  teamSize?: number | null;
  phases?: any;
}

export function PlaybookCard(props: PlaybookCardProps) {
  const { onClick } = props;
  const playbook = props.playbook || ({
    id: props.id || '',
    slug: props.slug || '',
    title: props.title || '',
    eventType: props.eventType || '',
    teamSize: props.teamSize ?? null,
    phases: props.phases || [],
  } as unknown as PlaybookDetail);

  const icon = getPlaybookIcon(playbook.eventType || playbook.title);
  const teamLabel =
    playbook.teamSizeLabel ||
    (playbook.teamSize !== null && playbook.teamSize !== undefined
      ? playbook.teamSize === 1
        ? '1 member'
        : `${playbook.teamSize} members`
      : '1-4 members');

  // Check if phase weights exist (per spec rule 8: omit if no phase data)
  const hasPhaseWeights =
    Array.isArray(playbook.phaseWeights) && playbook.phaseWeights.length > 0;

  // Check if duration field exists
  const duration = playbook.durationHours
    ? `${playbook.durationHours}h`
    : playbook.duration || null;

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={onClick}
      data-testid={`pb-card-${playbook.id}`}
      className={cn(
        'group w-full min-h-32 p-4 rounded-[var(--r-card)] bg-card border border-border text-left flex flex-col',
        'hover:border-border-strong transition-[transform,border-color] duration-150',
        'active:scale-[0.99] duration-80 cursor-pointer',
        'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2'
      )}
    >
      {/* Row 1: Icon tile + Text block + Chevron */}
      <div className="flex items-start gap-3 w-full">
        <div className="size-8 rounded-[var(--r-tile)] bg-shell border border-border flex items-center justify-center shrink-0 text-ink">
          {createElement(icon, { className: 'size-4', strokeWidth: 1.75 })}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] leading-[20px] font-semibold text-ink line-clamp-2">
            {playbook.title}
          </div>
          <div className="mt-0.5 text-xs leading-4 text-ink-2">
            {playbook.eventType}
          </div>
        </div>
        <ChevronRight
          className={cn(
            'size-4 text-ink-3 shrink-0 opacity-0 transition-[opacity,transform] duration-200',
            'group-hover:opacity-100 group-hover:translate-x-0.5',
            'group-focus-visible:opacity-100 group-focus-visible:translate-x-0.5',
            'motion-reduce:group-hover:translate-x-0 motion-reduce:group-focus-visible:translate-x-0'
          )}
          strokeWidth={1.75}
        />
      </div>

      {/* Row 2: Mini SegmentedTimeline (omitted if no phase data) */}
      {hasPhaseWeights && (
        <div className="mt-4 w-full">
          <SegmentedTimeline size="sm" segments={playbook.phaseWeights} />
        </div>
      )}

      {/* Row 3: Meta counters */}
      <div className="mt-auto pt-3 flex items-center gap-3 text-xs leading-4 text-ink-2 tabular-nums">
        <div className="flex items-center gap-1 shrink-0">
          <Users className="size-3.5" strokeWidth={1.75} />
          <span>{teamLabel}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Layers className="size-3.5" strokeWidth={1.75} />
          <span>{playbook.phaseCount || 7} phases</span>
        </div>
        {duration && (
          <div className="flex items-center gap-1 shrink-0">
            <Clock className="size-3.5" strokeWidth={1.75} />
            <span>{duration}</span>
          </div>
        )}
      </div>
    </button>
  );
}
