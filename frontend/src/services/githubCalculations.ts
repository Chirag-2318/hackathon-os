/**
 * githubCalculations.ts — Pure calculation functions for GitHub metrics.
 * Unit-testable, rule-check, history-health, missing-chips, attention-items, readiness.
 */
import type {
  Commit, Branch, HealthItem, FrozenDemo, Repo,
  RuleCheckResult, HistoryHealthResult, AttentionItem
} from './types';

// ── 1. Rule Check: commits before eventStart ─────────────────────────────────
export function computeRuleCheck(commits: Commit[], eventStart: string): RuleCheckResult {
  const startMs = new Date(eventStart).getTime();
  const preKickoff = commits.filter((c) => {
    const commitMs = new Date(c.at).getTime();
    return !isNaN(commitMs) && commitMs < startMs;
  });

  if (preKickoff.length === 0) {
    return {
      status: 'pass',
      count: 0,
      commits: [],
    };
  }

  return {
    status: 'fail',
    count: preKickoff.length,
    commits: preKickoff,
  };
}

// ── 2. History Health: thin history, giant commit, author dominant ───────────
export function computeHistoryHealth(
  commits: Commit[],
  eventStart: string,
  nowMs: number = Date.now()
): HistoryHealthResult {
  const startMs = new Date(eventStart).getTime();
  const elapsedHours = Math.max(0, (nowMs - startMs) / (3600 * 1000));
  const uniqueAuthors = new Set(commits.map((c) => c.authorId));
  const contributorsCount = uniqueAuthors.size;
  const totalCommits = commits.length;

  if (elapsedHours >= 24 && totalCommits < 10) {
    return {
      status: 'THIN HISTORY',
      message: 'Thin history: fewer than 10 commits after 24h of the event',
      commitsCount: totalCommits,
      contributorsCount,
    };
  }

  const totalAdditions = commits.reduce((sum, c) => sum + (c.additions || 0), 0);
  if (totalAdditions > 0) {
    const giantCommit = commits.find((c) => (c.additions || 0) > totalAdditions * 0.6);
    if (giantCommit) {
      return {
        status: 'ONE GIANT COMMIT',
        message: 'One giant commit holds >60% of total additions',
        commitsCount: totalCommits,
        contributorsCount,
      };
    }
  }

  if (totalCommits > 0) {
    const authorCounts: Record<string, number> = {};
    for (const c of commits) {
      authorCounts[c.authorId] = (authorCounts[c.authorId] || 0) + 1;
    }
    const dominantAuthor = Object.values(authorCounts).find((count) => count >= totalCommits * 0.8);
    if (dominantAuthor) {
      return {
        status: 'ONE AUTHOR DOMINANT',
        message: 'One person wrote 80%+ of commits',
        commitsCount: totalCommits,
        contributorsCount,
      };
    }
  }

  return {
    status: 'HEALTHY',
    message: 'Healthy commit activity across the squad',
    commitsCount: totalCommits,
    contributorsCount,
  };
}

// ── 3. Branch Missing Chips ──────────────────────────────────────────────────
export function computeBranchMissing(branch: Branch, nowMs: number = Date.now()): string[] {
  const missing: string[] = [];
  const lastCommitMs = new Date(branch.lastCommitAt).getTime();
  const hoursSinceLastCommit = (nowMs - lastCommitMs) / (3600 * 1000);

  if (branch.role === 'experiment' && (branch.linkedTaskKeys?.length ?? 0) === 0) {
    missing.push('No linked task');
  }

  if (!branch.pr && branch.ahead >= 8 && hoursSinceLastCommit > 6) {
    missing.push('Not in a PR yet');
  }

  if (branch.pr?.status === 'draft') {
    const prOpenedMs = new Date(branch.pr.openedAt).getTime();
    if ((nowMs - prOpenedMs) / (3600 * 1000) >= 24) {
      missing.push('Draft for 2 days');
    }
  }

  if (branch.pr?.conflicts) {
    missing.push('PR has conflicts');
  }

  if (branch.pr?.status === 'open' && (!branch.pr.reviewers || branch.pr.reviewers.length === 0)) {
    const prOpenedMs = new Date(branch.pr.openedAt).getTime();
    if ((nowMs - prOpenedMs) / (3600 * 1000) >= 12) {
      missing.push('No review yet');
    }
  }

  if (branch.role === 'demo-safe' && branch.behind > 0) {
    missing.push(`Missing ${branch.behind} commits from main`);
  }

  if (
    (branch.role === 'stale' || hoursSinceLastCommit > 24) &&
    branch.pr?.status !== 'merged' &&
    branch.role !== 'main'
  ) {
    missing.push('Stale, no commits in 24h');
  }

  return missing;
}

// ── 4. Attention Items ───────────────────────────────────────────────────────
export function computeAttentionItems(
  repo: Repo,
  branches: Branch[],
  commits: Commit[],
  health: HealthItem[],
  frozenDemo?: FrozenDemo,
  dismissedIds: string[] = [],
  eventStart: string = '2026-10-07T07:00:00+05:30',
  _nowMs: number = Date.now()
): AttentionItem[] {
  const items: AttentionItem[] = [];

  // 1. Rule failures
  const rule = computeRuleCheck(commits, eventStart);
  if (rule.status === 'fail') {
    items.push({
      id: 'att-rule-kickoff',
      severity: 'rule',
      title: `${rule.count} commit${rule.count > 1 ? 's' : ''} made before kickoff`,
      helper: 'Violates hackathon rule: all code must be written after event start',
      actionLabel: 'View commits',
      actionType: 'scroll_branch',
    });
  }

  // 2. Demo drift: commits landed after freeze
  if (frozenDemo) {
    const freezeMs = new Date(frozenDemo.frozenAt).getTime();
    const driftCommits = commits.filter(
      (c) => c.branch === frozenDemo.branch && new Date(c.at).getTime() > freezeMs
    );
    if (driftCommits.length > 0) {
      items.push({
        id: 'att-demo-drift',
        severity: 'drift',
        title: 'Demo branch changed after freeze: re-verify the demo',
        helper: `${driftCommits.length} new commit${driftCommits.length > 1 ? 's' : ''} landed since freeze`,
        actionLabel: 'Re-freeze',
        actionType: 'open_freeze',
      });
    }
  }

  // 3. Demo-safe behind main
  const demoSafeBranch = branches.find((b) => b.role === 'demo-safe');
  if (demoSafeBranch && demoSafeBranch.behind > 0) {
    items.push({
      id: 'att-demo-behind',
      severity: 'demo',
      title: `demo-safe is ${demoSafeBranch.behind} commits behind main`,
      helper: 'Update demo branch so stage tests include latest bugfixes',
      actionLabel: 'Update demo branch',
      actionType: 'open_url',
      url: `https://github.com/${repo.fullName}/compare/${demoSafeBranch.name}...main`,
    });
  }

  // 4. PR conflicts
  for (const b of branches) {
    if (b.pr?.conflicts) {
      items.push({
        id: `att-conflict-${b.name}`,
        severity: 'conflict',
        title: `PR #${b.pr.number} has merge conflicts`,
        helper: `${b.name} cannot be merged into ${repo.defaultBranch}`,
        actionLabel: 'Open PR',
        actionType: 'open_url',
        url: `https://github.com/${repo.fullName}/pull/${b.pr.number}`,
        targetBranch: b.name,
      });
    }
  }

  // 5. Missing required health items
  for (const h of health) {
    if (h.status === 'fail' && h.required) {
      items.push({
        id: `att-health-${h.id}`,
        severity: 'health',
        title: `${h.label} is missing`,
        helper: 'Required item from confirmed brief',
        actionLabel: h.action?.label || 'Fix',
        actionType: 'open_url',
        url: h.action?.url,
      });
    }
  }

  // 6. Secrets found
  const secretItem = health.find((h) => h.id === 'gc-4' && h.status === 'fail');
  if (secretItem) {
    items.push({
      id: 'att-secrets-found',
      severity: 'secret',
      title: 'Potential secret committed to repository',
      helper: 'Rotate the key first, then remove it from history',
      actionLabel: 'Inspect',
      actionType: 'scroll_branch',
    });
  }

  // 7. Non-required failed health items
  for (const h of health) {
    if (h.status === 'fail' && !h.required && h.id !== 'gc-4') {
      items.push({
        id: `att-health-${h.id}`,
        severity: 'health',
        title: `${h.label} is missing`,
        helper: 'Recommended for judge readiness',
        actionLabel: h.action?.label || 'Fix',
        actionType: 'open_url',
        url: h.action?.url,
      });
    }
  }

  // 8. Branches with no owner or task
  for (const b of (branches || [])) {
    if (b.role === 'experiment' && (b.linkedTaskKeys?.length ?? 0) === 0) {
      items.push({
        id: `att-notask-${b.name}`,
        severity: 'hygiene',
        title: `${b.name} has no linked task`,
        helper: 'Unlinked branch may be forgotten at deadline',
        actionLabel: 'Link task',
        actionType: 'scroll_branch',
        targetBranch: b.name,
      });
    }
  }

  // 9. Stale branches
  for (const b of branches) {
    if (b.role === 'stale' && b.pr?.status !== 'merged') {
      items.push({
        id: `att-stale-${b.name}`,
        severity: 'hygiene',
        title: `${b.name} is stale with no activity in 24h`,
        helper: 'Consider archiving or merging into main',
        actionLabel: 'Inspect',
        actionType: 'scroll_branch',
        targetBranch: b.name,
      });
    }
  }

  // Filter out dismissed items
  return items.filter((item) => !dismissedIds.includes(item.id));
}

// ── 5. Readiness Score ───────────────────────────────────────────────────────
export function computeReadinessScore(health?: HealthItem[]): { passed: number; total: number } {
  const safeHealth = health || [];
  const total = safeHealth.length;
  const passed = safeHealth.filter((h) => h.status === 'pass').length;
  return { passed, total };
}
