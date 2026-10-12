import * as React from 'react';
import { type DemoShot } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface ShotListTableProps {
  shots: DemoShot[];
}

export function ShotListTable({ shots = [] }: ShotListTableProps) {
  const safeShots = Array.isArray(shots) ? shots : [];

  return (
    <TooltipProvider>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Shot</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Screen</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Narration</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Length</th>
              </tr>
            </thead>
            <tbody>
              {safeShots.map((shot: any, idx: number) => {
                const shotNum = shot.shot ?? shot.position ?? idx + 1;
                const screen = shot.screen ?? shot.title ?? `Shot ${shotNum}`;
                const narration = shot.narration ?? shot.notes ?? '—';
                const duration = shot.lengthSeconds ?? shot.durationSec ?? 0;
                return (
                  <tr key={shot.id || idx} className="border-b last:border-b-0 hover:bg-lav-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium tabular-nums">{shotNum}</td>
                    <td className="px-4 py-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="truncate block max-w-[200px]">{screen}</span>
                        </TooltipTrigger>
                        <TooltipContent>{screen}</TooltipContent>
                      </Tooltip>
                    </td>
                    <td className="px-4 py-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="truncate block max-w-[200px] text-slate-500">{narration}</span>
                        </TooltipTrigger>
                        <TooltipContent>{narration}</TooltipContent>
                      </Tooltip>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{duration}s</td>
                  </tr>
                );
              })}
              {safeShots.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-xs text-slate-400">
                    No shots added yet.
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
