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
  onExportRoomZip?: () => void;
  onPushDocsToGithub?: () => void;
  isPushingDocs?: boolean;
  isLeader?: boolean;
  hasGithubRepo?: boolean;
  pushErrorNotice?: string | null;
  prResultUrl?: string | null;
}

export function DocsListPane({
  files,
  selectedFileId,
  onSelectFile,
  onDownloadAllZip,
  onExportRoomZip,
  onPushDocsToGithub,
  isPushingDocs,
  isLeader,
  hasGithubRepo,
  pushErrorNotice,
  prResultUrl,
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

      {/* File List grouped by plan step */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/30">
        {[
          { step: 1, title: 'Step 1: PRD & MVP', fileNames: ['PRD.md', 'MVP.md'] },
          { step: 2, title: 'Step 2: Stack & Arch', fileNames: ['TECH_STACK.md', 'ARCHITECTURE.md'] },
          { step: 3, title: 'Step 3: Phases & Design', fileNames: ['PHASES.md', 'DESIGN.md'] },
          { step: 4, title: 'Step 4: Tasks', fileNames: ['TASKS.md'] },
          { step: 5, title: 'Step 5: Demo & Q&A', fileNames: ['DEMO_SCRIPT.md', 'QNA.md'] },
        ].map((group) => {
          const groupFiles = files.filter(f => group.fileNames.some(fn => fn.toLowerCase() === f.name.toLowerCase()));
          if (groupFiles.length === 0) return null;

          return (
            <div key={group.step} className="border-b border-border/20 last:border-b-0">
              <div className="px-3 py-1.5 bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {group.title}
              </div>
              <div className="divide-y divide-border/20">
                {groupFiles.map((file) => {
                  const isSelected = file.id === selectedFileId;
                  const serverHealth = (file as any).health;
                  const health = serverHealth
                    ? { isHealthy: serverHealth.status === 'ok', warnings: serverHealth.issues || [] }
                    : checkDocHealth(file.name, file.content);

                  return (
                    <button
                      key={file.id}
                      onClick={() => onSelectFile(file.id)}
                      className={cn(
                        'w-full h-10 px-3 flex items-center justify-between gap-2 text-left transition-colors',
                        isSelected
                          ? 'bg-neutral-100 dark:bg-muted text-foreground font-semibold'
                          : 'hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className={cn('size-3.5 shrink-0', isSelected ? 'text-blue-600' : 'text-muted-foreground')} />
                        <span className="text-xs truncate font-mono">
                          {file.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Version chip */}
                        <span className="text-[10px] font-mono px-1 rounded bg-muted/80 text-muted-foreground">
                          v{file.version || 1}
                        </span>

                        {/* Single Doc Download Icon */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const blob = new Blob([file.content || ''], { type: 'text/markdown;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = file.name;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(url);
                          }}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                          title={`Download ${file.name}`}
                        >
                          <Download className="size-3" />
                        </button>

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
                                {health.warnings.map((w: string, i: number) => (
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
            </div>
          );
        })}
      </div>

      {/* Footer toolbar */}
      <div className="p-2.5 border-t border-border flex flex-col gap-1.5 shrink-0 bg-surface/50">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadAllZip}
            className="flex-1 h-8 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5"
          >
            <Download className="size-3" />
            <span>All (.zip)</span>
          </Button>
          {onExportRoomZip && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportRoomZip}
              className="flex-1 h-8 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5"
            >
              <span>Export room</span>
            </Button>
          )}
        </div>

        {/* Leader-only Push docs to repo */}
        {isLeader && onPushDocsToGithub && (
          <Button
            size="sm"
            onClick={onPushDocsToGithub}
            disabled={isPushingDocs}
            className="w-full h-8 rounded-lg text-[11px] font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center gap-1.5"
          >
            <span>Push docs to repo</span>
          </Button>
        )}

        {pushErrorNotice && (
          <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[10px] text-amber-900 dark:text-amber-200">
            {pushErrorNotice}
          </div>
        )}

        {prResultUrl && (
          <a
            href={prResultUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-[10px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between font-medium"
          >
            <span>PR opened: View on GitHub</span>
          </a>
        )}
      </div>
    </div>
  );
}
