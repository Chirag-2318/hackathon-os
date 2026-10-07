import { useEffect, useState } from 'react';
import { fetchGithub, type GithubResponse } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, GitCommit, GitPullRequest, GitBranch, AlertTriangle } from 'lucide-react';
import { IconBrandGithub } from '@tabler/icons-react';
import { BranchMap } from './components/branch-map';
import { RepoHealthChecklist } from './components/repo-health-checklist';

export function GithubPage() {
  const [data, setData] = useState<GithubResponse | null>(null);

  useEffect(() => {
    fetchGithub('r-1').then(setData);
  }, []);

  if (!data) {
    return <div className="p-8 text-center text-slate-500">Loading GitHub data...</div>;
  }

  if (!data.isConnected) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-2xl mx-auto text-center space-y-6 pt-12">
          <IconBrandGithub className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700" />
          <h2 className="text-2xl font-semibold">Connect GitHub</h2>
          <p className="text-slate-500">Connect your repository to track branches, health, and activity.</p>
          <Button variant="default">Connect Repository</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight">GitHub Hub</h1>
            <Badge variant="secondary" className="font-mono text-sm">{data.repoName}</Badge>
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/20">Connected</Badge>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sync
          </Button>
        </div>

        {/* History Health Callout */}
        {data.historyHealthWarning && (
          <div className="bg-[#2A2D32] text-white p-4 rounded-lg flex items-start gap-4">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-500">History Health Warning</h4>
              <p className="text-sm text-slate-300 mt-1">D8 condition triggered: Not all demo-safe branches are up to date.</p>
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Branches</CardTitle>
              <GitBranch className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.branchesCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Open PRs</CardTitle>
              <GitPullRequest className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.openPrsCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Last Commit</CardTitle>
              <GitCommit className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.lastCommitTime}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Event Commits</CardTitle>
              <GitCommit className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-2xl font-bold">{data.commitsSinceStart}</div>
                <Badge variant="outline" className={data.preEventRulePassed ? "text-emerald-500 border-emerald-500/20" : "text-rose-500 border-rose-500/20"}>
                  {data.preEventRulePassed ? "Pre-event rule: Pass" : "Pre-event rule: Fail"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-4 gap-6">
          <BranchMap branches={data.branches} />
          <RepoHealthChecklist checklist={data.healthChecklist} />
        </div>
      </div>
    </div>
  );
}
