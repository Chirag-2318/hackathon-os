import * as React from 'react';
import { type DemoShot } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface ShotListTableProps {
  shots: DemoShot[];
}

export function ShotListTable({ shots }: ShotListTableProps) {
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
              {shots.map((shot) => (
                <tr key={shot.id} className="border-b last:border-b-0 hover:bg-lav-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium tabular-nums">{shot.shot}</td>
                  <td className="px-4 py-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="truncate block max-w-[200px]">{shot.screen}</span>
                      </TooltipTrigger>
                      <TooltipContent>{shot.screen}</TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="px-4 py-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="truncate block max-w-[200px] text-slate-500">{shot.narration}</span>
                      </TooltipTrigger>
                      <TooltipContent>{shot.narration}</TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{shot.lengthSeconds}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </TooltipProvider>
  );
}
