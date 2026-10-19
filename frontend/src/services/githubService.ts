/**
 * githubService.ts — GitHub Hub service calling backend API directly.
 */
import { apiFetch } from '@/api/client';
import type {
  GithubState, GithubDataComputed, Branch, BranchRole,
  FrozenDemo, Commit, Repo, RepoVisibility
} from './types';
import {
  computeRuleCheck, computeHistoryHealth, computeBranchMissing,
  computeAttentionItems, computeReadinessScore
} from './githubCalculations';

export interface SectionResponse<T> {
  state: 'READY' | 'PARTIAL' | 'ERROR';
  data: T;
  error?: string | null;
  notice?: string | null;
}

export interface RepoSummarySection {
  name: string;
  description: string;
  visibility: string;
  defaultBranch: string;
  language: string;
  stars: number;
  pushedDate?: string | null;
  htmlUrl: string;
  fullName: string;
  connected: boolean;
}

function computeAll(state: GithubState, eventStart: string): GithubDataComputed {
  const nowMs = Date.now();

  const ruleCheck = computeRuleCheck(state.commits || [], eventStart);
  const historyHealth = computeHistoryHealth(state.commits || [], eventStart, nowMs);

  const branchMissing: Record<string, string[]> = {};
  for (const b of (state.branches || [])) {
    branchMissing[b.name] = computeBranchMissing(b, nowMs);
  }

  const attentionItems = computeAttentionItems(
    state.repo,
    state.branches || [],
    state.commits || [],
    state.health || [],
    state.frozenDemo,
    state.dismissedAttentionIds || [],
    eventStart,
    nowMs
  );

  const readinessScore = computeReadinessScore(state.health || []);

  let commitsSinceFreeze = 0;
  if (state.frozenDemo) {
    const freezeMs = new Date(state.frozenDemo.frozenAt).getTime();
    commitsSinceFreeze = (state.commits || []).filter(
      (c) => c.branch === state.frozenDemo?.branch && new Date(c.at).getTime() > freezeMs
    ).length;
  }

  return {
    ...state,
    ruleCheck,
    historyHealth,
    branchMissing,
    attentionItems,
    readinessScore,
    commitsSinceFreeze,
  };
}

export const githubService = {
  async getGithubData(roomId: string): Promise<GithubDataComputed> {
    const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/github`);
    const rawBranches = res.branches || [];
    const normalizedBranches: Branch[] = rawBranches.map((b: any) => ({
      ...b,
      linkedTaskKeys: Array.isArray(b.linkedTaskKeys)
        ? b.linkedTaskKeys
        : Array.isArray(b.linkedTasks)
          ? b.linkedTasks.map((t: any) => t.key || t.id || '')
          : [],
      ownerId: b.ownerId || b.owner?.username || b.owner?.id || '',
      ahead: typeof b.ahead === 'number' ? b.ahead : 0,
      behind: typeof b.behind === 'number' ? b.behind : 0,
      lastCommitAt: b.lastCommitAt || new Date().toISOString(),
    }));

    const isConnected = Boolean(res.connected ?? res.repo?.connected ?? res.isConnected ?? false);
    const repoObj: Repo = typeof res.repo === 'string'
      ? {
          fullName: res.repo,
          url: `https://github.com/${res.repo}`,
          visibility: 'public',
          defaultBranch: 'main',
          connected: isConnected,
          lastSyncAt: new Date().toISOString(),
          access: 'read-only',
        }
      : res.repo
        ? {
            fullName: res.repo.fullName || res.repoName || '',
            url: res.repo.url || (res.repo.fullName ? `https://github.com/${res.repo.fullName}` : ''),
            visibility: (res.repo.visibility as RepoVisibility) || 'public',
            defaultBranch: res.repo.defaultBranch || 'main',
            connected: isConnected,
            lastSyncAt: res.repo.lastSyncAt || res.lastSyncAt || new Date().toISOString(),
            access: res.repo.access || 'read-only',
          }
        : {
            fullName: res.repoName || '',
            url: res.repoUrl || (res.repoName ? `https://github.com/${res.repoName}` : ''),
            visibility: 'public',
            defaultBranch: 'main',
            connected: isConnected,
            lastSyncAt: res.lastSyncAt || new Date().toISOString(),
            access: 'read-only',
          };

    const state: GithubState = {
      repo: repoObj,
      branches: normalizedBranches,
      commits: res.commits || [],
      health: res.healthChecklist || res.health || [],
      frozenDemo: res.frozenDemo,
      dismissedAttentionIds: res.dismissedAttentionIds || [],
    };
    return computeAll(state, res.eventStart || new Date().toISOString());
  },

  async syncRepo(roomId: string): Promise<GithubDataComputed> {
    await apiFetch<any>(`/api/v1/rooms/${roomId}/github/sync`, { method: 'POST' });
    return this.getGithubData(roomId);
  },

  async updateBranchPurpose(roomId: string, branchIdOrName: string, purpose: string): Promise<Branch> {
    return apiFetch<Branch>(`/api/v1/rooms/${roomId}/github/branches/${encodeURIComponent(branchIdOrName)}`, {
      method: 'PATCH',
      body: JSON.stringify({ purpose }),
    });
  },

  async updateBranchRole(roomId: string, branchIdOrName: string, role: BranchRole): Promise<Branch> {
    return apiFetch<Branch>(`/api/v1/rooms/${roomId}/github/branches/${encodeURIComponent(branchIdOrName)}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  async linkTaskToBranch(roomId: string, branchIdOrName: string, taskKey: string): Promise<Branch> {
    return apiFetch<Branch>(`/api/v1/rooms/${roomId}/github/branches/${encodeURIComponent(branchIdOrName)}/tasks`, {
      method: 'PUT',
      body: JSON.stringify({ taskKeys: [taskKey] }),
    });
  },

  async unlinkTaskFromBranch(roomId: string, branchIdOrName: string, _taskKey: string): Promise<Branch> {
    return apiFetch<Branch>(`/api/v1/rooms/${roomId}/github/branches/${encodeURIComponent(branchIdOrName)}/tasks`, {
      method: 'PUT',
      body: JSON.stringify({ taskKeys: [] }),
    });
  },

  async freezeDemo(
    roomId: string,
    data: { branch: string; tag: string; sha: string; message: string }
  ): Promise<FrozenDemo> {
    const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/github/freeze`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.frozenDemo || res;
  },

  async getFrozenDemo(roomId: string): Promise<FrozenDemo | null> {
    const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/github/freeze`);
    return res.frozenDemo || null;
  },

  async linkRepo(roomId: string, url: string): Promise<RepoSummarySection> {
    const raw = url.trim();
    return apiFetch<RepoSummarySection>(`/api/v1/rooms/${roomId}/github/link`, {
      method: 'POST',
      body: JSON.stringify({ url: raw, repo: raw }),
    });
  },

  async getSummarySection(roomId: string): Promise<SectionResponse<RepoSummarySection>> {
    return apiFetch<SectionResponse<RepoSummarySection>>(`/api/v1/rooms/${roomId}/github/summary`);
  },

  async getBranchesSection(roomId: string): Promise<SectionResponse<any[]>> {
    return apiFetch<SectionResponse<any[]>>(`/api/v1/rooms/${roomId}/github/branches`);
  },

  async getCommitsSection(roomId: string): Promise<SectionResponse<any[]>> {
    return apiFetch<SectionResponse<any[]>>(`/api/v1/rooms/${roomId}/github/commits`);
  },

  async getPullsSection(roomId: string): Promise<SectionResponse<any[]>> {
    return apiFetch<SectionResponse<any[]>>(`/api/v1/rooms/${roomId}/github/pulls`);
  },

  async getHealthSection(roomId: string): Promise<SectionResponse<any[]>> {
    return apiFetch<SectionResponse<any[]>>(`/api/v1/rooms/${roomId}/github/health`);
  },

  async connectRepo(roomId: string, repoInput: string): Promise<GithubDataComputed> {
    const raw = repoInput.trim();
    await this.linkRepo(roomId, raw);
    return this.getGithubData(roomId);
  },

  async getLinkStatus(): Promise<{ linked: boolean; login: string | null; privateAccess: boolean }> {
    return apiFetch<{ linked: boolean; login: string | null; privateAccess: boolean }>('/api/v1/github/status');
  },

  async disconnectLink(): Promise<void> {
    await apiFetch<void>('/api/v1/github/link', { method: 'DELETE' });
  },

  async getMyRepos(search?: string): Promise<Array<{ fullName: string; isPrivate: boolean; updatedAt: string }>> {
    const query = search ? `?search=${encodeURIComponent(search.trim())}` : '';
    return apiFetch<Array<{ fullName: string; isPrivate: boolean; updatedAt: string }>>(`/api/v1/github/my-repos${query}`);
  },

  async disconnectRepo(roomId: string): Promise<void> {
    await apiFetch<void>(`/api/v1/rooms/${roomId}/github/connect`, { method: 'DELETE' });
  },

  async dismissAttentionItem(roomId: string, itemId: string): Promise<void> {
    await apiFetch<void>(`/api/v1/rooms/${roomId}/github/attention/${encodeURIComponent(itemId)}/dismiss`, {
      method: 'POST',
    });
  },

  async recheckHealth(roomId: string): Promise<GithubDataComputed> {
    return this.syncRepo(roomId);
  },

  async simulateCommit(roomId: string): Promise<Commit> {
    return apiFetch<Commit>(`/api/v1/dev/rooms/${roomId}/fake-commits`, { method: 'POST' });
  },

  async getChecks(roomId: string): Promise<GithubCheck[]> {
    return apiFetch<GithubCheck[]>(`/api/v1/rooms/${roomId}/github/checks`);
  },

  async getContributors(roomId: string): Promise<GithubContributorsResponse> {
    return apiFetch<GithubContributorsResponse>(`/api/v1/rooms/${roomId}/github/contributors`);
  },

  async getTaskLinks(roomId: string): Promise<GithubTaskLinksResponse> {
    return apiFetch<GithubTaskLinksResponse>(`/api/v1/rooms/${roomId}/github/task-links`);
  },

  async getDemoMarker(roomId: string): Promise<DemoMarker | null> {
    return apiFetch<DemoMarker | null>(`/api/v1/rooms/${roomId}/github/demo-marker`);
  },

  async saveDemoMarker(roomId: string, branch?: string): Promise<DemoMarker> {
    return apiFetch<DemoMarker>(`/api/v1/rooms/${roomId}/github/demo-marker`, {
      method: 'POST',
      body: JSON.stringify({ branch }),
    });
  },

  async deleteDemoMarker(roomId: string): Promise<void> {
    await apiFetch<void>(`/api/v1/rooms/${roomId}/github/demo-marker`, { method: 'DELETE' });
  },
};

export interface GithubCheck {
  id: string;
  label: string;
  status: 'PASS' | 'WARN' | 'FAIL' | 'UNKNOWN';
  detail: string;
  fixUrl?: string | null;
  fixLabel?: string | null;
}

export interface GithubContributorItem {
  userId?: string | null;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  githubLogin?: string | null;
  commitsLast7Days: number;
  prsOpened: number;
  prsMerged: number;
  lastCommitAt?: string | null;
  isMember: boolean;
}

export interface GithubContributorsResponse {
  members: GithubContributorItem[];
  otherAuthors: GithubContributorItem[];
}

export interface TaskCommitLink {
  sha: string;
  message: string;
  author?: string;
  committedAt?: string;
  url: string;
}

export interface TaskPrLink {
  number: number;
  title: string;
  status: string;
  url: string;
}

export interface TaskBranchLink {
  name: string;
  url: string;
}

export interface TaskLinksItem {
  taskKey: string;
  commits: TaskCommitLink[];
  prs: TaskPrLink[];
  branches: TaskBranchLink[];
}

export interface GithubTaskLinksResponse {
  totalCommits: number;
  commitsWithTasks: number;
  headerSummary: string;
  tasks: TaskLinksItem[];
}

export interface DemoMarker {
  branch: string;
  sha: string;
  markedBy?: string;
  markedByName: string;
  markedAt: string;
  commitsMoved: number;
  summary: string;
}

