import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, MoreHorizontal, Sparkles, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface IdeateHeaderProps {
  roomId: string;
  isLocked: boolean;
  problemStatement?: string;
  onDownloadMarkdown: () => void;
  onSeedIdeas: () => void;
  canSeed?: boolean;
}

export function IdeateHeader({
  roomId,
  isLocked,
  problemStatement,
  onDownloadMarkdown,
  onSeedIdeas,
  canSeed = true,
}: IdeateHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const cleanProblemStatement = problemStatement?.trim() || 'No problem statement found in the brief yet.';

  return (
    <header className="flex flex-col gap-2.5 pb-4 border-b border-border/60">
      <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
        {/* Left: Title + Status Chip */}
        <div className="flex items-center gap-3 min-w-0">
          <h1
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-3xl sm:text-4xl text-foreground font-normal tracking-tight leading-none"
          >
            Ideate
          </h1>
          <span
            className={cn(
              'px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold border shrink-0',
              isLocked
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : 'bg-muted/80 text-muted-foreground border-border/60'
            )}
          >
            {isLocked ? 'Locked' : 'Open'}
          </span>
        </div>

        {/* Right: Primary-quiet Download button + "..." menu */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadMarkdown}
            className="h-8 text-xs font-medium gap-1.5 border-border/80 hover:bg-muted/60"
            title="Download team ideas as markdown"
          >
            <Download className="size-3.5" />
            <span>Download ideas.md</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                aria-label="More actions"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {canSeed && (
                <DropdownMenuItem
                  onClick={onSeedIdeas}
                  className="text-xs cursor-pointer gap-2"
                >
                  <Sparkles className="size-3.5 text-blue-500" />
                  <span>Seed ideas</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link
                  to={`/app/room/${roomId}/brief`}
                  className="text-xs cursor-pointer gap-2 flex items-center"
                >
                  <FileText className="size-3.5 text-muted-foreground" />
                  <span>Open brief</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Brief problem statement line (expandable inline) */}
      <div className="text-xs text-muted-foreground flex items-baseline gap-1.5 flex-wrap">
        <span
          className={cn(
            'text-muted-foreground leading-relaxed',
            !isExpanded && 'line-clamp-2'
          )}
        >
          {cleanProblemStatement}
        </span>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-primary hover:underline font-medium inline-flex items-center gap-0.5 shrink-0 cursor-pointer"
        >
          {isExpanded ? (
            <>
              <span>Collapse</span>
              <ChevronUp className="size-3" />
            </>
          ) : (
            <>
              <span>Read full brief</span>
              <ChevronDown className="size-3" />
            </>
          )}
        </button>
      </div>
    </header>
  );
}
