/**
 * PlaybookCard — simplified C10a for S01 landing.
 * Source: PRD §3.1 item 6, Q8.
 *
 * Shows only: title, event-type tag (C07), team size, phases meta.
 * Omits progress ring, participants, and author rows (Q8).
 * Links to /playbooks (Phase 1b).
 * Title truncates at 2 lines with tooltip (D§9).
 */
import { Link } from 'react-router-dom';
import { cn } from 'cn';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/primitives/chip';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { playbookPath } from '@/shared/constants/routes';
import { Users, Layers } from 'lucide-react';

interface PlaybookCardProps {
  id: string;
  slug: string;
  title: string;
  eventType: string;
  teamSize: number | null;
  phases: string;
  className?: string;
}

export function PlaybookCard({
  slug,
  title,
  eventType,
  teamSize,
  phases,
  className,
}: PlaybookCardProps) {
  return (
    <Link to={playbookPath(slug)} className="block group">
      <Card
        data-slot="playbook-card"
        className={cn(
          'flex flex-col rounded-card bg-surface border border-border/50 p-5',
          'transition-all hover:border-border-strong hover:shadow-e2 cursor-pointer',
          className,
        )}
      >
        {/* Top row: tag */}
        <div className="flex items-start justify-end mb-3">
          <Chip variant="soft">{eventType}</Chip>
        </div>

        {/* Title — 2-line clamp with tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <h3 className="text-h3 text-ink line-clamp-2 mb-4 min-h-[48px]">
              {title}
            </h3>
          </TooltipTrigger>
          <TooltipContent>{title}</TooltipContent>
        </Tooltip>

        {/* Meta row */}
        <div className="mt-auto flex items-center gap-4 text-caption text-ink-muted">
          {teamSize !== null && (
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5" strokeWidth={1.5} />
              {teamSize}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Layers className="size-3.5" strokeWidth={1.5} />
            {phases}
          </span>
        </div>
      </Card>
    </Link>
  );
}
