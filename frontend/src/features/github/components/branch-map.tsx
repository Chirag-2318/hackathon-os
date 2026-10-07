import { type GithubBranch } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GitBranch, GitPullRequest } from 'lucide-react';

interface BranchMapProps {
  branches: GithubBranch[];
}

export function BranchMap({ branches }: BranchMapProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'main': return 'bg-lime-500/20 text-lime-700 dark:bg-lime-500/10 dark:text-lime-400';
      case 'demo-safe': return 'bg-sky-500/20 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400';
      case 'experiment': return 'bg-amber-500/20 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
      default: return 'bg-slate-500/20 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400';
    }
  };

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Branch Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Branch</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Ahead/Behind</TableHead>
              <TableHead>PR Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Last Commit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.map((branch) => (
              <TableRow key={branch.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                <TableCell className="font-mono text-sm font-medium">{branch.name}</TableCell>
                <TableCell>{branch.purpose}</TableCell>
                <TableCell>{branch.ownerName}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {branch.ahead > 0 && <Badge variant="outline" className="text-emerald-500 border-emerald-500/20">+{branch.ahead}</Badge>}
                    {branch.behind > 0 && <Badge variant="outline" className="text-rose-500 border-rose-500/20">-{branch.behind}</Badge>}
                    {branch.ahead === 0 && branch.behind === 0 && <Badge variant="outline" className="text-slate-400 border-slate-200">Synced</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  {branch.prStatus !== 'None' && (
                    <div className="flex items-center gap-1.5">
                      <GitPullRequest className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">{branch.prStatus}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={getRoleColor(branch.roleTag)}>
                    {branch.roleTag}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-slate-500">{branch.lastCommitTime}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
