import React from 'react';
import { cn } from '@/lib/utils';
import { FileText, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import type { DocFile } from '@/services/types';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface DocHealthInfo {
  isHealthy: boolean;
  warnings: string[];
}

export function checkDocHealth(name: string, content: string): DocHealthInfo {
  const warnings: string[] = [];
  if (name === 'PRD.md') {
    if (!content.includes('# PRD')) warnings.push('Missing "# PRD" heading');
    if (!content.includes('## Problem')) warnings.push('Missing "## Problem" section');
    if (!content.includes('## Core flow')) warnings.push('Missing "## Core flow" section');
  } else if (name === 'MVP.md') {
    if (!content.includes('# MVP')) warnings.push('Missing "# MVP" heading');
  } else if (name === 'TECH_STACK.md') {
    if (!content.includes('|')) warnings.push('Missing architecture/tech table');
    if (!content.includes('mermaid')) warnings.push('Missing mermaid architecture diagram block');
  } else if (name === 'PHASES.md') {
    if (!content.includes('|')) warnings.push('Missing phases table');
  } else if (name === 'DEMO_SCRIPT.md') {
    if (!content.includes('# Demo script')) warnings.push('Missing "# Demo script" section');
  } else if (name === 'QA.md') {
    if (!content.includes('# Likely judge Q&A')) warnings.push('Missing "# Likely judge Q&A" section');
  }
  return { isHealthy: warnings.length === 0, warnings };
}

export interface DocsListPaneProps {
  files: DocFile[];
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
  onDownloadAllZip: () => void;
}

export function DocsListPane({
  files,
  selectedFileId,
  onSelectFile,
  onDownloadAllZip,
}: DocsListPaneProps) {
  return (
    <div className="w-[260px] shrink-0 border-r border-border flex flex-col h-full bg-card select-none">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-border shrink-0">
        <h3 className="text-sm font-semibold text-foreground">
          Plan documents
        </h3>
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground">
          {files.length}
        </span>
      </div>

      {/* File List (44px rows) */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/30">
        {files.map((file) => {
          const isSelected = file.id === selectedFileId;
          const health = checkDocHealth(file.name, file.content);

          return (
            <button
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={cn(
                'w-full h-11 px-3 flex items-center justify-between gap-2 text-left transition-colors',
                isSelected
                  ? 'bg-neutral-100 dark:bg-muted text-foreground font-semibold'
                  : 'hover:bg-muted/40 text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <FileText className={cn('size-4 shrink-0', isSelected ? 'text-blue-600' : 'text-muted-foreground')} />
                <span className="text-xs truncate font-mono">
                  {file.name}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Version chip */}
                <span className="text-[10px] font-mono px-1 rounded bg-muted/80 text-muted-foreground">
                  v{file.version || 1}
                </span>

                {/* Health Dot */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">
                      {health.isHealthy ? (
                        <span className="size-2 rounded-full bg-emerald-500 block" />
                      ) : (
                        <span className="size-2 rounded-full bg-amber-500 block" />
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs max-w-xs">
                    {health.isHealthy ? (
                      <span className="text-emerald-600">All required sections present</span>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-amber-600">Warnings:</span>
                        {health.warnings.map((w, i) => (
                          <span key={i} className="text-muted-foreground">• {w}</span>
                        ))}
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer (52px with Download all zip) */}
      <div className="h-[52px] px-3 border-t border-border flex items-center shrink-0">
        <Button
          variant="outline"
          onClick={onDownloadAllZip}
          className="w-full h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
        >
          <Download className="size-3.5" />
          <span>Download all (zip)</span>
        </Button>
      </div>
    </div>
  );
}
