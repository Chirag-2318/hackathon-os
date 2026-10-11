import React from 'react';
import {
  CheckCircle2, AlertTriangle, ExternalLink, GitCommit, Link as LinkIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Branch, Commit } from '@/services/types';

interface BranchExpandedProps {
  branch: Branch;
  missingItems: string[];
  commits: Commit[];
  repoFullName: string;
  onOpenLinkTask: () => void;
}

export function BranchExpanded({
  branch,
  missingItems,
  commits,
  repoFullName,
  onOpenLinkTask,
}: BranchExpandedProps) {
  // Commits belonging to this branch (or fallback to latest 3)
  const branchCommits = commits
    .filter((c) => c.branch === branch.name)
    .slice(-3)
    .reverse();

  const displayCommits =
    branchCommits.length > 0
      ? branchCommits
      : [
          {
            sha: branch.lastCommitSha,
            message: branch.lastCommitMessage,
            authorId: branch.ownerId,
            at: branch.lastCommitAt,
            additions: 12,
            deletions: 3,
            branch: branch.name,
          },
        ];

  return (
    <div className="pt-3 pb-4 border-t border-border/50 text-xs font-[var(--font-inter)] space-y-4">
      {/* ── WHAT'S MISSING ── */}
      <div>
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          What's missing
        </div>
        {missingItems.length === 0 ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-medium">
            <CheckCircle2 className="size-3.5 stroke-[2.5]" />
            <span>Nothing missing</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {missingItems.map((item, idx) => {
              const isBehind = item.startsWith('Missing');
              const isNoTask = item === 'No linked task';
              const isConflicts = item === 'PR has conflicts';
              const isDraft = item.startsWith('Draft');
              const isNoReview = item === 'No review yet';

              return (
                <div
                  key={idx}
                  className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium border ${
                    isConflicts
                      ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                      : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                  }`}
                >
                  <AlertTriangle className="size-3.5 shrink-0" />
                  <span>{item}</span>

                  {/* Context Action */}
                  {isBehind && (
                    <a
                      href={`https://github.com/${repoFullName}/compare/${branch.name}...main`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="ml-1 underline font-semibold hover:text-amber-900 dark:hover:text-amber-100 flex items-center gap-0.5"
                    >
                      Update demo branch <ExternalLink className="size-2.5" />
                    </a>
                  )}

                  {isNoTask && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenLinkTask();
                      }}
                      className="ml-1 underline font-semibold hover:text-amber-900 dark:hover:text-amber-100 flex items-center gap-0.5 cursor-pointer"
                    >
                      Link a task <LinkIcon className="size-2.5" />
                    </button>
                  )}

                  {(isConflicts || isDraft || isNoReview) && branch.pr && (
                    <a
                      href={`https://github.com/${repoFullName}/pull/${branch.pr.number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="ml-1 underline font-semibold hover:text-rose-900 dark:hover:text-rose-100 flex items-center gap-0.5"
                    >
                      Open PR #{branch.pr.number} <ExternalLink className="size-2.5" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── RECENT COMMITS ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Recent commits
          </span>
          <a
            href={`https://github.com/${repoFullName}/commits/${branch.name}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            <span>View all on GitHub</span>
            <ExternalLink className="size-3" />
          </a>
        </div>

        <div className="space-y-1.5">
          {displayCommits.map((c, idx) => {
            const authorName = (c as any).authorName || 'Teammate';
            const author = {
              displayName: authorName,
              initials: authorName.slice(0, 2).toUpperCase(),
              avatarColor: '#5B6FF0',
            };

            return (
              <div
                key={c.sha || idx}
                className="flex items-center gap-2.5 py-1 px-2 rounded-md hover:bg-muted/40 transition-colors"
              >
                <GitCommit className="size-3.5 text-muted-foreground/60 shrink-0" />
                <span className="font-mono text-[11px] text-muted-foreground font-semibold">
                  {c.sha}
                </span>
                <span className="text-foreground truncate max-w-md">{c.message}</span>
                <div className="ml-auto flex items-center gap-2 shrink-0">
                  <div
                    className="size-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center shrink-0"
                    style={{ backgroundColor: author.avatarColor }}
                    title={author.displayName}
                  >
                    {author.initials}
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {formatDistanceToNow(new Date(c.at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
