import React from 'react';
import {
  Play, Eye, MoreHorizontal, Download, Printer,
  GitPullRequest, ArrowUpFromLine, History, Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { PitchBeat } from '../api/pitch-kit-api';

export interface PitchStationHeaderProps {
  beats: PitchBeat[];
  selectedBeatId: string | null;
  timeLimitSec: number;
  onStartRehearsal: () => void;
  onOpenReadMode: () => void;
  onPullFromDoc: () => void;
  onPushToDoc: () => void;
  onOpenHistory: () => void;
  onFitToLimit: () => void;
  onDownloadMarkdown: () => void;
}

function fmtSec(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PitchStationHeader({
  beats,
  selectedBeatId,
  timeLimitSec,
  onStartRehearsal,
  onOpenReadMode,
  onPullFromDoc,
  onPushToDoc,
  onOpenHistory,
  onFitToLimit,
  onDownloadMarkdown,
}: PitchStationHeaderProps) {
  const totalPlannedSec = beats.reduce((s, b) => s + b.durationSec, 0);
  const isOvertime = totalPlannedSec > timeLimitSec;
  const overtimeSec = totalPlannedSec - timeLimitSec;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
      <div className="flex items-center gap-4 flex-1 max-w-2xl">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold shrink-0">
          Live · {fmtSec(timeLimitSec)} limit
        </span>

        {/* Time budget bar */}
        <div className="flex-1 space-y-1">
          <div className="relative h-2 w-full bg-muted/60 rounded-full overflow-hidden flex border border-border/70">
            {beats.map((b) => {
              const widthPct = Math.min(
                100,
                (b.durationSec / Math.max(totalPlannedSec, timeLimitSec)) * 100
              );
              return (
                <div
                  key={b.id}
                  style={{ width: `${widthPct}%` }}
                  className={cn(
                    'h-full border-r border-background/60 transition-all',
                    b.id === selectedBeatId ? 'bg-foreground' : 'bg-foreground/50'
                  )}
                  title={`${b.title}: ${fmtSec(b.durationSec)}`}
                />
              );
            })}
          </div>
        </div>

        {isOvertime && (
          <span className="font-mono text-xs text-destructive font-semibold shrink-0">
            +{fmtSec(overtimeSec)} over
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" onClick={onStartRehearsal} className="h-8 text-xs font-medium">
          <Play className="w-3.5 h-3.5 mr-1.5" /> Start rehearsal
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenReadMode}
          className="h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          <Eye className="w-3.5 h-3.5 mr-1.5" /> Read mode
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 text-xs">
            <DropdownMenuItem onClick={onPullFromDoc}>
              <GitPullRequest className="w-3.5 h-3.5 mr-2" /> Pull from doc
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPushToDoc}>
              <ArrowUpFromLine className="w-3.5 h-3.5 mr-2" /> Push to doc
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenHistory}>
              <History className="w-3.5 h-3.5 mr-2" /> Version history
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onFitToLimit}>
              <Scale className="w-3.5 h-3.5 mr-2" /> Fit to limit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.print()}>
              <Printer className="w-3.5 h-3.5 mr-2" /> Print cue cards
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDownloadMarkdown}>
              <Download className="w-3.5 h-3.5 mr-2" /> Download .md
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
