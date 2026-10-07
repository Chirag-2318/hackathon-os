import { type GithubHealthCheck } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, CheckCircle2, Circle } from 'lucide-react';

interface RepoHealthChecklistProps {
  checklist: GithubHealthCheck[];
}

export function RepoHealthChecklist({ checklist }: RepoHealthChecklistProps) {
  const allPassed = checklist.every((c) => c.isPassed);

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className={`h-5 w-5 ${allPassed ? 'text-emerald-500' : 'text-slate-500'}`} />
          Repo Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {checklist.map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              {item.isPassed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-5 w-5 text-slate-300 dark:text-slate-700 shrink-0 mt-0.5" />
              )}
              <span className={`text-sm ${item.isPassed ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
