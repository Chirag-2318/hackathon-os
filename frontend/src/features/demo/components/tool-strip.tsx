import * as React from 'react';
import { type DemoTool } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Sun } from 'lucide-react';

interface ToolStripProps {
  tools: DemoTool[];
}

export function ToolStrip({ tools }: ToolStripProps) {
  if (tools.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Tools</h3>
        <p className="text-sm text-slate-400">No recording or video tools available</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Recording and video tools</h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className="shrink-0 w-52 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border flex flex-col gap-2"
          >
            <div className="flex items-start justify-between">
              <h4 className="text-sm font-semibold">{tool.name}</h4>
              <button
                className="text-slate-400 hover:text-lav-600 p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lav-600"
                aria-label={`Open ${tool.name} website`}
                onClick={() => {/* External link — no-op in mocks */}}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">{tool.use}</p>
            <div className="flex flex-wrap gap-1 mt-auto">
              {tool.cost && (
                <Badge variant="secondary" className="text-[10px] bg-lav-50 text-lav-700 dark:bg-lav-900/20 dark:text-lav-300">
                  {tool.cost}
                </Badge>
              )}
              {!tool.verified && (
                <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                  <Sun className="h-3 w-3 mr-0.5" />
                  Not verified
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Last checked {tool.lastChecked}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
