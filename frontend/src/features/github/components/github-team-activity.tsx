import React, { useMemo } from 'react';
import { Users, GitCommit, GitPullRequest } from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import type { GithubContributorsResponse } from '@/services/githubService';
import type { Commit } from '@/services/types';

interface GithubTeamActivityProps {
  contributors: GithubContributorsResponse | null;
  commits: Commit[];
  eventStart?: string;
  loading: boolean;
}

export function GithubTeamActivity({
  contributors,
  commits,
  eventStart,
  loading,
}: GithubTeamActivityProps) {
  // Compute 14-day commit buckets
  const chartData = useMemo(() => {
    const buckets: { dateStr: string; label: string; count: number }[] = [];
    const now = new Date();

    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString(undefined, { weekday: 'narrow' });
      buckets.push({ dateStr, label, count: 0 });
    }

    const bucketMap = new Map(buckets.map((b) => [b.dateStr, b]));
    commits.forEach((c) => {
      const dateStr = (c.at || (c as any).committedAt || '').split('T')[0];
      const b = bucketMap.get(dateStr);
      if (b) {
        b.count += 1;
      }
    });

    const maxCount = Math.max(1, ...buckets.map((b) => b.count));
    return { buckets, maxCount };
  }, [commits]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="h-5 w-32 bg-muted/40 rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-10 bg-muted/20 rounded animate-pulse" />
          <div className="h-10 bg-muted/20 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const members = contributors?.members || [];
  const otherAuthors = contributors?.otherAuthors || [];

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      {/* 14-Day Commit Activity Chart */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-foreground">14-day commit activity</h2>
          <span className="font-mono text-[11px] text-muted-foreground">
            {commits.length} commits
          </span>
        </div>

        <div className="h-20 flex items-end gap-1.5 pt-2 pb-1 px-1 border-b border-border/40">
          {chartData.buckets.map((b, i) => {
            const heightPct = Math.max(8, Math.round((b.count / chartData.maxCount) * 100));

            return (
              <div
                key={b.dateStr}
                className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-popover border border-border text-[10px] px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-20 font-mono">
                  {b.count} on {b.dateStr}
                </div>

                <div
                  className="w-full bg-primary/80 hover:bg-primary transition-all rounded-t-sm"
                  style={{ height: `${heightPct}%` }}
                />
                <span className="text-[9px] text-muted-foreground font-mono select-none">
                  {b.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Activity Hairline List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between pb-1 border-b border-border/40">
          <h2 className="text-xs font-semibold text-foreground">Team activity</h2>
          <span className="font-mono text-[11px] text-muted-foreground">
            {members.length} members
          </span>
        </div>

        <div className="divide-y divide-border/30">
          {members.map((m) => {
            const hasCommits = m.commitsLast7Days > 0;

            return (
              <div
                key={m.userId || m.displayName || m.githubLogin || 'anon'}
                className="py-2.5 flex items-center justify-between gap-2.5 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-6 rounded-full overflow-hidden shrink-0 border border-border/40">
                    <UserAvatar
                      user={{ name: m.displayName || 'Member', avatarUrl: m.avatarUrl || undefined }}
                      size={24}
                    />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-medium text-foreground truncate">
                      {m.displayName || m.username || 'Member'}
                    </p>
                    {m.githubLogin ? (
                      <p className="font-mono text-[10px] text-muted-foreground truncate">
                        @{m.githubLogin}
                      </p>
                    ) : (
                      <p className="text-[10px] text-amber-500">
                        Not connected in Settings
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {hasCommits ? (
                    <span className="font-mono text-[11px] text-foreground font-medium">
                      {m.commitsLast7Days} commits this week
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground italic">
                      No commits yet
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Other repository authors if any */}
          {otherAuthors.length > 0 && (
            <div className="pt-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                Other contributors ({otherAuthors.length})
              </span>
              {otherAuthors.slice(0, 3).map((a) => (
                <div
                  key={a.githubLogin || 'author'}
                  className="py-2 flex items-center justify-between text-xs"
                >
                  <span className="font-mono text-[11px] text-muted-foreground truncate">
                    @{a.githubLogin}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {a.commitsLast7Days} commits
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
