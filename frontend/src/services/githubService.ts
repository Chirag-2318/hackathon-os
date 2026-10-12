/**
 * githubService.ts — GitHub Hub service calling backend API directly.
 */
import { apiFetch } from '@/api/client';
import type {
  GithubState, GithubDataComputed, Branch, BranchRole,
  FrozenDemo, Commit
} from './types';
import {
  computeRuleCheck, computeHistoryHealth, computeBranchMissing,
  computeAttentionItems, computeReadinessScore
} from './githubCalculations';

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

    const state: GithubState = {
      repo: res.repo || {
        fullName: res.repoName || '',
        url: res.repoUrl || (res.repoName ? `https://github.com/${res.repoName}` : ''),
        visibility: 'public',
        defaultBranch: 'main',
        connected: res.isConnected ?? false,
        lastSyncAt: res.lastSyncAt || new Date().toISOString(),
        access: 'read-only',
      },
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

  async connectRepo(roomId: string, repoInput: string): Promise<GithubDataComputed> {
    const raw = repoInput.trim();
    await apiFetch<any>(`/api/v1/rooms/${roomId}/github/connect`, {
      method: 'POST',
      body: JSON.stringify({ repo: raw, repoName: raw }),
    });
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
};
