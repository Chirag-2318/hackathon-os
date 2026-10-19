import React, { useEffect, useState } from 'react';
import { GitCommit, GitPullRequest, GitBranch, ExternalLink } from 'lucide-react';
import { githubService, type TaskLinksItem } from '@/services/githubService';

interface TaskCommitsAndPrsSectionProps {
  taskKey: string;
  roomId: string;
}

export function TaskCommitsAndPrsSection({ taskKey, roomId }: TaskCommitsAndPrsSectionProps) {
  const [links, setLinks] = useState<TaskLinksItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId || !taskKey) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    githubService
      .getTaskLinks(roomId)
      .then((res) => {
        if (!isMounted) return;
        const found = res?.tasks?.find(
          (t) => t.taskKey.toUpperCase() === taskKey.toUpperCase()
        );
        setLinks(found || null);
      })
      .catch(() => {
        if (isMounted) setLinks(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [roomId, taskKey]);

  if (loading) {
    return (
      <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Commits and PRs
        </span>
        <div className="h-10 bg-muted/30 rounded-xl animate-pulse" />
      </div>
    );
  }

  const hasCommits = links && links.commits && links.commits.length > 0;
  const hasPrs = links && links.prs && links.prs.length > 0;
  const hasBranches = links && links.branches && links.branches.length > 0;
  const hasAny = hasCommits || hasPrs || hasBranches;

  return (
    <div className="flex flex-col gap-2.5 pt-2 border-t border-border/50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Commits and PRs
        </span>
        {hasAny && (
          <span className="text-[11px] font-mono text-muted-foreground">
            {(links?.commits?.length || 0) + (links?.prs?.length || 0)} linked
          </span>
        )}
      </div>

      {!hasAny ? (
        <div className="p-3 rounded-xl bg-muted/20 border border-border/40 text-xs text-muted-foreground">
          No commits or PRs mention <span className="font-mono font-semibold text-foreground">{taskKey}</span> yet.
          Include <span className="font-mono font-semibold text-foreground">{taskKey}</span> in commit messages or branch names to link them.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Commits */}
          {hasCommits && (
            <div className="space-y-1.5">
              {links.commits.map((c) => {
                const sha7 = c.sha ? c.sha.substring(0, 7) : '';
                const msg = c.message
                  ? c.message.length > 60
                    ? c.message.substring(0, 60) + '...'
                    : c.message
                  : 'Commit';
                return (
                  <div
                    key={c.sha}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/30 border border-border/40 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GitCommit className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="font-mono text-[11px] text-foreground font-semibold shrink-0">
                        {sha7}
                      </span>
                      <span className="truncate text-muted-foreground text-[11px]" title={c.message}>
                        {msg}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {c.author && (
                        <span className="text-[10px] text-muted-foreground">{c.author}</span>
                      )}
                      {c.url && (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                          title="Open on GitHub"
                        >
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pull Requests */}
          {hasPrs && (
            <div className="space-y-1.5">
              {links.prs.map((pr) => (
                <div
                  key={pr.number}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/30 border border-border/40 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GitPullRequest className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="font-mono text-[11px] font-semibold text-foreground">
                      #{pr.number}
                    </span>
                    <span className="truncate text-muted-foreground text-[11px]">
                      {pr.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono font-semibold bg-muted text-muted-foreground">
                      {pr.status || 'open'}
                    </span>
                    {pr.url && (
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Branches */}
          {hasBranches && (
            <div className="space-y-1">
              {links.branches.map((b) => (
                <div
                  key={b.name}
                  className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-muted/20 text-xs"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <GitBranch className="size-3 text-muted-foreground shrink-0" />
                    <span className="font-mono text-[11px] text-foreground truncate">{b.name}</span>
                  </div>
                  {b.url && (
                    <a
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
