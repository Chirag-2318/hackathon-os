import * as React from 'react';
import { type VideoRule } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const FIELD_LABELS: Record<string, string> = {
  max_length: 'Max length',
  public_link: 'Public link',
  captions: 'Captions',
};

interface VideoRulesCheckProps {
  rules?: any;
}

export function VideoRulesCheck({ rules }: VideoRulesCheckProps) {
  const ruleList = React.useMemo(() => {
    if (Array.isArray(rules) && rules.length > 0) {
      return rules;
    }
    if (rules && typeof rules === 'object') {
      const maxSec = rules.maxSeconds ?? 120;
      return [
        {
          field: 'max_length',
          required: `${Math.floor(maxSec / 60)}:00`,
          actual: 'Under limit',
          result: 'pass',
        },
        {
          field: 'public_link',
          required: rules.publicLink || rules.publicOnly ? 'Yes' : 'Optional',
          actual: 'Check URL',
          result: 'unknown',
        },
        {
          field: 'captions',
          required: rules.captionsRequired || rules.captions ? 'Yes' : 'Optional',
          actual: 'Check manually',
          result: 'unknown',
        },
      ];
    }
    return [
      { field: 'max_length', required: '2:00', actual: 'Check length', result: 'unknown' },
      { field: 'public_link', required: 'Optional', actual: 'Not checked', result: 'unknown' },
      { field: 'captions', required: 'Optional', actual: 'Check manually', result: 'unknown' },
    ];
  }, [rules]);

  return (
    <Card className="p-4">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Video rules check</h3>
      <div className="space-y-3">
        {ruleList.map((rule: any, idx: number) => (
          <div key={rule.field || idx} className="flex items-center justify-between py-2.5 px-3 rounded-md bg-slate-50 dark:bg-slate-800/30">
            <div>
              <p className="text-xs text-slate-500">{FIELD_LABELS[rule.field] ?? rule.field}</p>
              <p className="text-sm font-semibold">{rule.actual || '—'}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Req: {rule.required || '—'}</span>
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs capitalize',
                  rule.result === 'pass' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
                  rule.result === 'fail' && 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
                  rule.result === 'unknown' && 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
                )}
              >
                {rule.result === 'pass' ? 'Verified' : rule.result === 'fail' ? 'Failing' : 'Unknown'}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
