import * as React from 'react';
import { type SubmissionItem, type SubmissionGroup } from '@/api/client';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const GROUP_TITLES: Record<SubmissionGroup, string> = {
  required: 'Required by this event',
  team: 'Team checks',
  verification: 'Verification',
};

interface ChecklistGroupProps {
  group: SubmissionGroup;
  items: SubmissionItem[];
  onToggle?: (id: string) => void;
}

export function ChecklistGroup({ group, items, onToggle }: ChecklistGroupProps) {
  const isVerification = group === 'verification';
  const isDashed = group === 'required';

  return (
    <div className={cn(isDashed && 'border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-1')}>
      <h3 className="px-4 pt-3 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {GROUP_TITLES[group]}
      </h3>
      <div className="bg-white dark:bg-[#1C1C1E] rounded-lg shadow-sm divide-y">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
            <button
              onClick={() => !isVerification && onToggle?.(item.id)}
              disabled={isVerification}
              className={cn(
                'h-6 w-6 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lav-600 focus-visible:ring-offset-2',
                item.done
                  ? 'bg-[#3F6B0F] border-[#3F6B0F]'
                  : 'border-slate-300 dark:border-slate-600',
                !isVerification && !item.done && 'hover:border-lav-400',
                isVerification && 'cursor-not-allowed opacity-70'
              )}
              aria-label={item.done ? `${item.label}: done` : `${item.label}: not done`}
            >
              {item.done && <Check className="h-4 w-4 text-white" />}
            </button>
            <span
              className={cn(
                'text-sm flex-1',
                item.done && 'line-through text-slate-400 dark:text-slate-500'
              )}
            >
              {item.label}
            </span>
            {!item.ruleConfirmed && (
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 shrink-0">
                Confirm in Brief
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
