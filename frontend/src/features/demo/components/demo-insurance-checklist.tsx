import * as React from 'react';
import { type InsuranceItem } from '@/api/client';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface DemoInsuranceChecklistProps {
  items: InsuranceItem[];
  onToggle?: (id: string) => void;
}

export function DemoInsuranceChecklist({ items = [], onToggle }: DemoInsuranceChecklistProps) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-1">
      <h3 className="px-4 pt-3 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Demo insurance checklist
      </h3>
      <div className="bg-white dark:bg-[#1C1C1E] rounded-lg shadow-sm divide-y">
        {safeItems.map((item: any) => {
          const itemId = item.id || item.key || item.itemKey;
          return (
            <div key={itemId} className="flex items-center gap-3 px-4 py-3.5">
              <button
                onClick={() => onToggle?.(itemId)}
                className={cn(
                  'h-6 w-6 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lav-600 focus-visible:ring-offset-2',
                  item.done
                    ? 'bg-[#3F6B0F] border-[#3F6B0F]'
                    : 'border-slate-300 dark:border-slate-600 hover:border-lav-400'
                )}
                aria-label={item.done ? `${item.label}: done` : `${item.label}: not done`}
              >
                {item.done && <Check className="h-4 w-4 text-white" />}
              </button>
              <span
                className={cn(
                  'text-sm',
                  item.done && 'line-through text-slate-400 dark:text-slate-500'
                )}
              >
                {item.label}
              </span>
            </div>
          );
        })}
        {safeItems.length === 0 && (
          <div className="px-4 py-3 text-xs text-slate-400">No insurance items found.</div>
        )}
      </div>
    </div>
  );
}
