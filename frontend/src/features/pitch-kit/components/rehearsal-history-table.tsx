import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownRight, ArrowRight, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RehearsalSummary } from '../api/pitch-kit-api';

export interface RehearsalHistoryTableProps {
  roomId: string;
  rehearsals: RehearsalSummary[];
  members: any[];
  pitchLimitSec: number;
  onStartRehearsal: () => void;
}

function fmtSec(ms: number) {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function RehearsalHistoryTable({
  roomId,
  rehearsals,
  members,
  pitchLimitSec,
  onStartRehearsal,
}: RehearsalHistoryTableProps) {
  const navigate = useNavigate();

  const countingRuns = rehearsals.filter((r) => r.countsTowardReadiness).length;

  const memberMap = React.useMemo(() => {
    const map = new Map<string, any>();
    members.forEach((m) => {
      if (m.id) map.set(m.id, m);
      if (m.userId) map.set(m.userId, m);
    });
    return map;
  }, [members]);

  const targetStr = fmtSec(pitchLimitSec * 1000);

  return (
    <div className="border-t border-border pt-6 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-normal text-foreground">
            Rehearsals
          </h3>
          <p className="font-mono text-xs text-muted-foreground mt-0.5">
            {countingRuns} of 3 counting team runs
          </p>
        </div>

        <Button size="sm" onClick={onStartRehearsal} className="h-8 text-xs">
          <Play className="w-3.5 h-3.5 mr-1.5" /> Start rehearsal
        </Button>
      </div>

      {rehearsals.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center text-xs text-muted-foreground space-y-2">
          <p>No rehearsals recorded yet.</p>
          <p>Run a full timed or voice rehearsal to build readiness.</p>
        </div>
      ) : (
        <div className="divide-y divide-border border border-border rounded-lg bg-card overflow-hidden">
          {rehearsals.map((r) => {
            const user = memberMap.get(r.userId) || { name: r.userName };
            const dateStr = new Date(r.startedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={r.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 text-xs hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar user={user} size={24} className="w-6 h-6 text-[10px]" />
                  <div>
                    <span className="font-medium text-foreground block">
                      {user.displayName || user.name || r.userName || 'Member'}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{dateStr}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <span className="font-mono text-xs uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {r.mode}
                  </span>

                  <span className="font-mono text-xs tabular-nums text-foreground">
                    {fmtSec(r.durationMs)} of {targetStr}
                  </span>

                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {r.completionPct}%
                  </span>

                  {r.delta?.durationDeltaMs != null && (
                    <span
                      className={cn(
                        'font-mono text-[11px] flex items-center tabular-nums',
                        r.delta.durationDeltaMs <= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      )}
                    >
                      {r.delta.durationDeltaMs <= 0 ? (
                        <ArrowDownRight className="w-3 h-3 mr-0.5" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3 mr-0.5" />
                      )}
                      {Math.abs(Math.round(r.delta.durationDeltaMs / 1000))}s
                    </span>
                  )}

                  <span
                    className={cn(
                      'font-mono text-[11px] px-2 py-0.5 rounded font-medium',
                      r.countsTowardReadiness
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {r.countsTowardReadiness ? 'Counts' : 'Practice only'}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs font-mono text-muted-foreground hover:text-foreground"
                    onClick={() => navigate(`/app/room/${roomId}/pitch-kit/rehearsals/${r.id}`)}
                  >
                    Open result <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
