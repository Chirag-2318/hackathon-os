import * as React from 'react';
import type { DocsVaultFile } from '@/api/client';

export interface DocsEditorProps {
  file: DocsVaultFile;
  onChange?: (newContent: string) => void;
}

export function DocsEditor({ file, onChange }: DocsEditorProps) {
  return (
    <div className="flex flex-col flex-1 h-full bg-surface">
      <div className="flex flex-col h-full overflow-y-auto px-12 py-12 max-w-4xl mx-auto w-full">
        {/* Placeholder for Notion-like editor. 
            Using a simple textarea for this phase. */}
        <h1 className="text-4xl font-bold text-ink mb-8">{file.name}</h1>
        
        <textarea
          className="flex-1 w-full resize-none text-ink text-base font-mono bg-transparent border-none focus:ring-0 focus:outline-none"
          value={file.content}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Start typing..."
        />
      </div>
    </div>
  );
}
