import * as React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocsVaultFile } from '@/api/client';

export interface DocsFileTreeProps {
  files: DocsVaultFile[];
  selectedFileId: string | null;
  onSelect: (id: string) => void;
}

export function DocsFileTree({ files, selectedFileId, onSelect }: DocsFileTreeProps) {
  return (
    <div className="flex flex-col w-64 shrink-0 border-r border-border bg-sidebar h-full overflow-y-auto p-4">
      <h3 className="text-xs font-bold text-sidebar-muted uppercase tracking-wider mb-4">
        Plan Documents
      </h3>
      <div className="flex flex-col gap-1 relative">
        {files.map((file) => {
          const isSelected = file.id === selectedFileId;
          return (
            <button
              key={file.id}
              onClick={() => onSelect(file.id)}
              className={cn(
                'relative flex items-center justify-between w-full p-2 text-sm rounded-md transition-colors text-left',
                isSelected ? 'text-sidebar-text font-medium' : 'text-sidebar-muted hover:bg-black/5 hover:text-sidebar-text'
              )}
            >
              {isSelected && (
                <motion.div
                  layoutId="fileTreeSelection"
                  className="absolute inset-0 bg-black/10 rounded-md"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className="flex items-center gap-2 relative z-10">
                <FileText className="size-4" />
                <span className="truncate">{file.name}</span>
              </div>
              <div className="relative z-10 shrink-0">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-black/10 text-sidebar-muted">
                  {file.version}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
