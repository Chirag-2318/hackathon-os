import React, { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import type { Commit } from '@/services/types';

interface ContributorsListProps {
  commits: Commit[];
}

export function ContributorsList({ commits }: ContributorsListProps) {
  const { contributors, maxCommits, busFactorWarning } = useMemo(() => {
    const stats: Record<
      string,
      {
        count: number;
        additions: number;
        deletions: number;
        lastActiveAt: string;
      }
    > = {};

    for (const c of commits) {
      if (!stats[c.authorId]) {
        stats[c.authorId] = {
          count: 0,
          additions: 0,
          deletions: 0,
          lastActiveAt: c.at,
        };
      }
      stats[c.authorId].count += 1;
      stats[c.authorId].additions += c.additions || 0;
      stats[c.authorId].deletions += c.deletions || 0;
      if (new Date(c.at).getTime() > new Date(stats[c.authorId].lastActiveAt).getTime()) {
        stats[c.authorId].lastActiveAt = c.at;
      }
    }

    const list = Object.entries(stats).map(([authorId, data]) => ({
      authorId,
      ...data,
      member: {
        displayName: authorId || 'Contributor',
        initials: (authorId || 'CT').slice(0, 2).toUpperCase(),
        avatarColor: '#5B6FF0',
      },
    }));

    list.sort((a, b) => b.count - a.count);

    const max = Math.max(...list.map((l) => l.count), 1);
    const total = commits.length;
    const hasBusFactor = list.some((l) => total > 0 && l.count / total >= 0.8);

    return {
      contributors: list,
      maxCommits: max,
      busFactorWarning: hasBusFactor,
    };
  }, [commits]);

  const formatK = (n: number) => {
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
  };

  return (
    <div className="space-y-3 font-[var(--font-inter)]">
      {/* Bus-factor warning chip if applicable */}
      {busFactorWarning && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs border border-amber-200 dark:border-amber-900">
          <AlertTriangle className="size-3.5 text-amber-600 shrink-0" />
          <span>
            <strong>High bus-factor:</strong> One teammate authored &gt;80% of total commits. Ensure knowledge is shared before judging.
          </span>
        </div>
      )}

      {/* Contributors Rows */}
      <div className="divide-y divide-border/40">
        {contributors.map((c) => {
          const barPct = Math.round((c.count / maxCommits) * 100);

          return (
            <div
              key={c.authorId}
              className="flex items-center gap-4 py-2 min-h-[44px] hover:bg-muted/20 transition-colors text-xs"
            >
              {/* Avatar 28px */}
              <div
                className="size-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs"
                style={{ backgroundColor: c.member.avatarColor }}
              >
                {c.member.initials}
              </div>

              {/* Name */}
              <div className="w-28 font-medium text-foreground truncate">
                {c.member.displayName}
              </div>

              {/* Horizontal Proportional Bar */}
              <div className="flex-1 max-w-xs h-2 bg-muted/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#3B5BFF] rounded-full transition-all duration-500"
                  style={{ width: `${barPct}%` }}
                />
              </div>

              {/* Commit Count */}
              <div className="w-20 text-muted-foreground tabular-nums font-medium">
                {c.count} commit{c.count !== 1 ? 's' : ''}
              </div>

              {/* Additions / Deletions */}
              <div className="w-28 text-muted-foreground tabular-nums text-[11px] flex items-center gap-1">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  +{formatK(c.additions)}
                </span>
                <span>/</span>
                <span className="text-rose-600 dark:text-rose-400 font-semibold">
                  -{formatK(c.deletions)}
                </span>
              </div>

              {/* Last Active Time */}
              <div className="ml-auto text-muted-foreground/70 tabular-nums text-[11px]">
                {formatDistanceToNow(new Date(c.lastActiveAt), { addSuffix: true })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
