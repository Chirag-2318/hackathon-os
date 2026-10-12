import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, AlertTriangle, AlertCircle, Pin, ExternalLink, HelpCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { InlineHighlight } from '@/features/home/components/HomeDesignSystem';
import { VitalCard } from './vital-card';
import type { GithubDataComputed } from '@/services/types';

interface ReadinessBandProps {
  data: GithubDataComputed;
  onScrollToSection: (sectionId: string) => void;
  onOpenFreeze: () => void;
}

export function ReadinessBand({
  data,
  onScrollToSection,
  onOpenFreeze,
}: ReadinessBandProps) {
  const { ruleCheck, historyHealth, frozenDemo, commitsSinceFreeze } = data;
  const health = data.health || [];
  const commits = data.commits || [];
  const passedCount = health.filter((h) => h.status === 'pass').length;
  const totalCount = health.length;
  const missingItems = health.filter((h) => h.status === 'fail');
  const missingCount = missingItems.length;

  // Animated ring & number
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const targetPct = Math.round((passedCount / Math.max(1, totalCount)) * 100);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(targetPct);
    }, 100);
    return () => clearTimeout(timer);
  }, [targetPct]);

  // Headline determination
  let headline = 'Judge-ready';
  let headlineClass = 'text-emerald-600 dark:text-emerald-400';
  let headlineIcon = <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />;
  let subtitle = 'All automated checks pass. Ready for evaluation.';

  if (missingCount >= 3) {
    headline = 'Needs work';
    headlineClass = 'text-rose-600 dark:text-rose-400';
    headlineIcon = <AlertCircle className="size-5 text-rose-600 dark:text-rose-400" />;
    subtitle = `${missingCount} items missing. Fix them before you submit.`;
  } else if (missingCount > 0) {
    headline = 'Almost judge-ready';
    headlineClass = 'text-amber-600 dark:text-amber-400';
    headlineIcon = <AlertTriangle className="size-5 text-amber-500" />;
    subtitle = `${missingCount} item${missingCount > 1 ? 's' : ''} missing. Fix before you submit.`;
  }

  // Mini Sparkline for commits
  // 12 buckets across commits
  const sparklineBuckets = [2, 3, 5, 8, 12, 10, 6, 7, 14, 11, 4, 3];
  const maxBucket = Math.max(...sparklineBuckets, 1);

  return (
    <div
      data-testid="readiness-band"
      className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden font-[var(--font-inter)]"
    >
      {/* ── Section 1: Header Row (56px) ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 min-h-[56px]">
        {/* Left: ProgressRing + Headline + Subtitle */}
        <div className="flex items-center gap-3.5">
          <div className="relative size-10 shrink-0 flex items-center justify-center">
            <ProgressRing
              value={animatedProgress}
              size={40}
              strokeWidth={4}
              className="text-primary transition-all duration-900 ease-out"
            />
            <span className="absolute text-[11px] font-bold text-foreground tabular-nums">
              {passedCount}/{totalCount}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              {headlineIcon}
              <h2 className={`text-[17px] font-semibold leading-tight ${headlineClass}`}>
                {headline}
              </h2>
            </div>
            <p className="text-[13px] text-muted-foreground leading-tight mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right: How judges see your repo popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <HelpCircle className="size-3.5" />
              <span>How judges see your repo</span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="bottom"
            align="end"
            className="w-80 p-4 rounded-xl text-xs space-y-2.5 font-[var(--font-inter)] shadow-md"
          >
            <div className="font-semibold text-foreground text-sm border-b border-border/50 pb-1.5">
              Judge Evaluation Criteria
            </div>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground">1. Visibility:</strong> Public repo accessible without permission walls.
              </p>
              <p>
                <strong className="text-foreground">2. Run instructions:</strong> Step-by-step installation with prerequisites in README.
              </p>
              <p>
                <strong className="text-foreground">3. Security hygiene:</strong> No committed API secrets or private tokens in git history.
              </p>
              <p>
                <strong className="text-foreground">4. Live artifact:</strong> Valid deployed preview URL with demo screenshots.
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Hairline Divider */}
      <div className="border-t border-border/60" />

      {/* ── Section 2: 4 Vitals Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
        {/* Vital 1: Rules */}
        <VitalCard
          label="Rules"
          tooltip="Hackathons disqualify teams for commits authored before official kickoff."
          value={
            ruleCheck.status === 'pass' ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-5 stroke-[2.5]" />
                <span>PASS</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <AlertCircle className="size-5 stroke-[2.5]" />
                <span>FAIL</span>
              </span>
            )
          }
          visual={
            ruleCheck.status === 'pass' ? (
              <span>All {commits.length} commits are after kickoff</span>
            ) : (
              <span className="flex items-center gap-1">
                <span>{ruleCheck.count} commits before kickoff</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onScrollToSection('commit-activity');
                  }}
                >
                  <InlineHighlight>View</InlineHighlight>
                </span>
              </span>
            )
          }
          onClick={() => onScrollToSection('commit-activity')}
        />

        {/* Vital 2: History */}
        <VitalCard
          label="History"
          tooltip="Detects thin history (<10 commits after 24h), single giant commits, or skewed solo authorship."
          value={
            <span
              className={
                historyHealth.status === 'HEALTHY'
                  ? 'text-foreground'
                  : 'text-amber-600 dark:text-amber-400 text-lg'
              }
            >
              {historyHealth.status}
            </span>
          }
          visual={
            <div className="flex items-center gap-2">
              <svg width="60" height="18" className="overflow-visible shrink-0">
                {sparklineBuckets.map((val, idx) => {
                  const barH = Math.max(3, (val / maxBucket) * 16);
                  return (
                    <rect
                      key={idx}
                      x={idx * 5}
                      y={18 - barH}
                      width="3.5"
                      height={barH}
                      rx="1"
                      className="fill-[#3B5BFF] hover:fill-[#5B7BFF] transition-all"
                    />
                  );
                })}
              </svg>
              <span className="tabular-nums">
                {historyHealth.commitsCount} commits, {historyHealth.contributorsCount} authors
              </span>
            </div>
          }
          onClick={() => onScrollToSection('commit-activity')}
        />

        {/* Vital 3: Demo */}
        <VitalCard
          label="Demo"
          tooltip="A frozen demo commit and safe branch protects your live presentation from last-minute breaks."
          value={
            frozenDemo ? (
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <Pin className="size-5 fill-current" />
                <span>Frozen</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-5" />
                <span>Not frozen</span>
              </span>
            )
          }
          visual={
            frozenDemo ? (
              commitsSinceFreeze > 0 ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  {commitsSinceFreeze} commit{commitsSinceFreeze > 1 ? 's' : ''} since freeze
                </span>
              ) : (
                <span className="font-mono text-[12px] truncate">
                  {frozenDemo.tag} @ {frozenDemo.sha} · {formatDistanceToNow(new Date(frozenDemo.frozenAt), { addSuffix: true })}
                </span>
              )
            ) : (
              <span className="flex items-center gap-1">
                <span>Freeze safe commit for demo</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenFreeze();
                  }}
                >
                  <InlineHighlight>Freeze now</InlineHighlight>
                </span>
              </span>
            )
          }
          onClick={onOpenFreeze}
        />

        {/* Vital 4: Repo Health */}
        <VitalCard
          label="Repo health"
          tooltip="Evaluates judge readiness checklist items including README, .env.example, license, and screenshots."
          value={
            <div className="flex items-center gap-2">
              <span className="tabular-nums">
                {passedCount} / {totalCount}
              </span>
              {/* Mini 7-tick row */}
              <div className="flex items-center gap-1 ml-1">
                {health.map((h) => (
                  <span
                    key={h.id}
                    title={`${h.label}: ${h.status}`}
                    className={`h-3 w-1.5 rounded-[1px] ${
                      h.status === 'pass'
                        ? 'bg-neutral-800 dark:bg-neutral-200'
                        : 'bg-rose-500/80'
                    }`}
                  />
                ))}
              </div>
            </div>
          }
          visual={
            missingCount === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                All 7 checks passing
              </span>
            ) : (
              <span className="truncate">
                {missingCount} missing:{' '}
                {missingItems.map((m) => m.label.replace(' added', '').replace(' in repo', '')).join(', ')}
              </span>
            )
          }
          onClick={() => onScrollToSection('repo-health')}
        />
      </div>
    </div>
  );
}
