import React from 'react';
import type { Branch } from '@/services/types';

interface PrLozengeProps {
  pr?: Branch['pr'];
  repoFullName: string;
}

export function PrLozenge({ pr, repoFullName }: PrLozengeProps) {
  if (!pr) {
    return <span className="text-muted-foreground/60 font-mono">—</span>;
  }

  const { status, number, conflicts } = pr;
  const prStyles: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: '#F3F4F6', text: '#6B7280', label: `DRAFT #${number}` },
    open: { bg: '#E4F7E9', text: '#2E9E55', label: `OPEN #${number}` },
    merged: { bg: '#F3E8FF', text: '#7E22CE', label: `MERGED #${number}` },
    closed: { bg: '#F3F4F6', text: '#9CA3AF', label: `CLOSED #${number}` },
  };
  const style = prStyles[status] || prStyles.open;

  return (
    <div className="flex items-center gap-1">
      <a
        href={`https://github.com/${repoFullName}/pull/${number}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: style.bg, color: style.text }}
        className="h-5 px-1.5 rounded-[5px] text-[10px] font-bold tracking-wide uppercase inline-flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap"
        title={`PR #${number}: ${pr.title}`}
      >
        <span>{style.label}</span>
      </a>
      {conflicts && (
        <span
          className="size-2 rounded-full bg-rose-500 animate-pulse shrink-0"
          title="PR has merge conflicts"
        />
      )}
    </div>
  );
}
