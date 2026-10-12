import * as React from 'react';
import { type LinkCheckRow } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

const COPY_TODO_FIX_LABEL = 'Fix';

interface LinkCheckTableProps {
  rows: LinkCheckRow[];
}

export function LinkCheckTable({ rows = [] }: LinkCheckTableProps) {
  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <TooltipProvider>
      <Card className="overflow-hidden">
        <div className="p-4 pb-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Link check</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">URL</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Status</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Fix</th>
              </tr>
            </thead>
            <tbody>
              {safeRows.map((row, idx) => (
                <tr key={idx} className="border-b last:border-b-0">
                  <td className="px-4 py-3 max-w-[200px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="truncate block text-sm">{row.url}</span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs break-all">{row.url}</TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs',
                        row.status === 'verified'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      )}
                    >
                      {row.status === 'verified' ? 'Verified' : 'Failing'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {row.fixTarget ? (
                      <a
                        href="#"
                        className="text-xs text-lav-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lav-600 rounded"
                      >
                        {COPY_TODO_FIX_LABEL}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {safeRows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-xs text-slate-400">
                    No links to check
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </TooltipProvider>
  );
}
