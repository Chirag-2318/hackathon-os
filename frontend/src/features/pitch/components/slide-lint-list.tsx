import * as React from 'react';
import { type PitchLintIssue, type LintType } from '@/api/client';
import { Card } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, FileText, Hash, Map as MapIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const LINT_LABELS: Record<LintType, string> = {
  too_much_text: 'Too much text',
  no_problem_slide: 'No problem slide',
  no_impact_number: 'No impact number',
  no_roadmap: 'No roadmap',
};

const LINT_ICONS: Record<LintType, React.ReactNode> = {
  too_much_text: <FileText className="h-4 w-4" />,
  no_problem_slide: <AlertTriangle className="h-4 w-4" />,
  no_impact_number: <Hash className="h-4 w-4" />,
  no_roadmap: <MapIcon className="h-4 w-4" />,
};

interface SlideLintListProps {
  issues: PitchLintIssue[];
  onSelectSlide?: (slideId: string) => void;
}

export function SlideLintList({ issues = [], onSelectSlide }: SlideLintListProps) {
  // Filter to only known lint types
  const validIssues = (Array.isArray(issues) ? issues : []).filter((i) => i && i.type in LINT_LABELS);

  return (
    <Card className="p-4">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Slide lint</h3>
      {validIssues.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>No issues found</span>
        </div>
      ) : (
        <ul className="space-y-2">
          {validIssues.map((issue, idx) => (
            <li
              key={`${issue.type}-${idx}`}
              className="flex items-center gap-3 py-2 px-3 rounded-md bg-amber-50 dark:bg-amber-900/10 text-sm"
            >
              <span className="text-amber-600 dark:text-amber-400 shrink-0">
                {LINT_ICONS[issue.type]}
              </span>
              <span className="font-medium text-amber-900 dark:text-amber-200">
                {LINT_LABELS[issue.type]}
              </span>
              {issue.slideId && onSelectSlide && (
                <button
                  onClick={() => onSelectSlide(issue.slideId!)}
                  className="ml-auto text-xs text-lav-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lav-600 rounded"
                >
                  Go to slide
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
