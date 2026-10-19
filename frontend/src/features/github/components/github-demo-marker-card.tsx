import React, { useState } from 'react';
import { Bookmark, AlertCircle, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { githubService, type DemoMarker } from '@/services/githubService';
import type { Branch } from '@/services/types';

interface GithubDemoMarkerCardProps {
  roomId: string;
  demoMarker: DemoMarker | null;
  branches: Branch[];
  isLeader: boolean;
  onRefresh: () => void;
}

export function GithubDemoMarkerCard({
  roomId,
  demoMarker,
  branches,
  isLeader,
  onRefresh,
}: GithubDemoMarkerCardProps) {
  const [selectedBranch, setSelectedBranch] = useState(
    branches[0]?.name || 'main'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const handleMark = async () => {
    try {
      setIsSubmitting(true);
      await githubService.saveDemoMarker(roomId, selectedBranch);
      toast.success(`Marked demo commit on "${selectedBranch}"`);
      setIsChanging(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to mark demo commit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = async () => {
    try {
      setIsSubmitting(true);
      await githubService.deleteDemoMarker(roomId);
      toast.success('Cleared marked demo commit');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to clear marker');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!demoMarker || isChanging) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Bookmark className="size-4 text-primary" />
          <h2 className="text-xs font-semibold text-foreground">
            Mark the commit you will demo
          </h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Lock in your presentation build so judges and teammates know exactly which code is being presented.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-border bg-muted/20 text-foreground font-mono outline-none"
          >
            {branches.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={handleMark}
            disabled={isSubmitting || !isLeader}
            className="text-xs h-8 cursor-pointer"
          >
            {isSubmitting ? 'Marking...' : 'Mark commit'}
          </Button>
          {isChanging && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsChanging(false)}
              className="text-xs h-8 cursor-pointer"
            >
              Cancel
            </Button>
          )}
        </div>
        {!isLeader && (
          <p className="text-[11px] text-muted-foreground italic">
            Only the team leader can set or change the demo build marker.
          </p>
        )}
      </div>
    );
  }

  const sha7 = demoMarker.sha ? demoMarker.sha.substring(0, 7) : '';
  const hasMoved = demoMarker.commitsMoved > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="size-4 text-emerald-500" />
          <h2 className="text-xs font-semibold text-foreground">Demo build marker</h2>
        </div>
        <span
          className={`font-mono text-[10px] px-2 py-0.5 rounded border font-semibold ${
            hasMoved
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
          }`}
        >
          {demoMarker.commitsMoved} COMMITS MOVED
        </span>
      </div>

      <div className="p-3 rounded-lg bg-muted/20 border border-border/40 space-y-1.5 text-xs">
        <div className="flex items-center gap-2 font-mono">
          <span className="font-semibold text-foreground">{demoMarker.branch}</span>
          <span className="text-muted-foreground">@</span>
          <span className="px-1.5 py-0.5 rounded bg-muted text-foreground border border-border/40 font-semibold">
            {sha7}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Marked by {demoMarker.markedByName}
        </p>
      </div>

      {isLeader && (
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsChanging(true)}
            className="h-7 text-xs px-2.5 cursor-pointer"
          >
            Change commit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
            disabled={isSubmitting}
            className="h-7 text-xs px-2.5 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
          >
            <Trash2 className="size-3 mr-1" />
            Clear marker
          </Button>
        </div>
      )}
    </div>
  );
}
