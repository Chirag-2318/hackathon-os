import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { RotateCcw, Send, MessageSquare, History, List } from 'lucide-react';
import type { DocFile, DocVersion, DocComment } from '@/services/types';
import { formatDistanceToNow } from 'date-fns';
import { CURRENT_USER_ID } from '@/services/mockStore';

export interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

export interface DocsRightPaneProps {
  file: DocFile;
  onRestoreVersion: (content: string) => Promise<void>;
  onAddComment: (text: string) => Promise<void>;
}

export function DocsRightPane({
  file,
  onRestoreVersion,
  onAddComment,
}: DocsRightPaneProps) {
  const [activeTab, setActiveTab] = useState<'outline' | 'history' | 'comments'>('outline');
  const [commentText, setCommentText] = useState('');
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  // Extract real headings (h1 to h3)
  const headings: HeadingItem[] = [];
  const lines = file.content.split('\n');
  lines.forEach(l => {
    if (l.startsWith('# ')) {
      const text = l.slice(2).trim();
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
      headings.push({ id, text, level: 1 });
    } else if (l.startsWith('## ')) {
      const text = l.slice(3).trim();
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
      headings.push({ id, text, level: 2 });
    } else if (l.startsWith('### ')) {
      const text = l.slice(4).trim();
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
      headings.push({ id, text, level: 3 });
    }
  });

  const scrollToHeading = (id: string) => {
    setActiveHeadingId(id);
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    await onAddComment(commentText.trim());
    setCommentText('');
  };

  // Build version list
  const versions: DocVersion[] = file.versions && file.versions.length > 0
    ? file.versions
    : [
        {
          id: 'v1',
          version: 1,
          content: file.content,
          authorName: 'Plan Generator',
          createdAt: file.createdAt || new Date().toISOString(),
          note: 'Generated from the plan',
        },
      ];

  const comments: DocComment[] = file.comments || [];

  return (
    <div className="w-[260px] shrink-0 border-l border-border flex flex-col h-full bg-card select-none">
      {/* Tab Switcher */}
      <div className="h-14 px-3 border-b border-border flex items-center justify-between shrink-0 bg-muted/20">
        <button
          onClick={() => setActiveTab('outline')}
          className={cn(
            'flex-1 h-8 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors',
            activeTab === 'outline' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <List className="size-3" />
          <span>Outline</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            'flex-1 h-8 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors',
            activeTab === 'history' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <History className="size-3" />
          <span>History</span>
        </button>

        <button
          onClick={() => setActiveTab('comments')}
          className={cn(
            'flex-1 h-8 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors',
            activeTab === 'comments' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <MessageSquare className="size-3" />
          <span>({comments.length})</span>
        </button>
      </div>

      {/* Pane Content */}
      <div className="flex-1 overflow-y-auto p-3 text-xs">
        {/* OUTLINE */}
        {activeTab === 'outline' && (
          <div className="flex flex-col gap-1">
            {headings.map((h, i) => {
              const isActive = activeHeadingId === h.id;

              return (
                <button
                  key={i}
                  onClick={() => scrollToHeading(h.id)}
                  style={{ paddingLeft: `${(h.level - 1) * 12 + 8}px` }}
                  className={cn(
                    'py-1.5 pr-2 rounded text-left transition-all truncate text-muted-foreground hover:text-foreground relative',
                    isActive && 'font-semibold text-foreground border-l-2 border-l-blue-600 bg-muted/40 rounded-l-none'
                  )}
                >
                  <span className="truncate block">{h.text}</span>
                </button>
              );
            })}
            {headings.length === 0 && (
              <span className="text-muted-foreground italic p-2">No headings in document</span>
            )}
          </div>
        )}

        {/* HISTORY */}
        {activeTab === 'history' && (
          <div className="flex flex-col divide-y divide-border/40">
            {versions.map((ver) => (
              <div key={ver.id} className="py-2.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground font-mono">
                    v{ver.version}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(ver.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {ver.note || `Edited by ${ver.authorName || 'team member'}`}
                </p>
                {ver.version !== (file.version || 1) && (
                  <button
                    onClick={() => onRestoreVersion(ver.content)}
                    className="self-start text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <RotateCcw className="size-2.5" />
                    <span>Restore this version</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* COMMENTS */}
        {activeTab === 'comments' && (
          <div className="flex flex-col h-full gap-3">
            <div className="flex-1 overflow-y-auto flex flex-col gap-2.5">
              {comments.map((comm) => (
                <div key={comm.id} className="p-2.5 rounded-xl bg-muted/30 border border-border/40 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-[11px]">
                      {comm.authorId === CURRENT_USER_ID ? 'Aarav Mehta' : 'Team Member'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(comm.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-foreground leading-relaxed">{comm.text}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <span className="text-muted-foreground italic p-2">No comments yet</span>
              )}
            </div>

            {/* Composer */}
            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Leave feedback..."
                rows={2}
                className="w-full text-xs p-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
              <button
                onClick={handlePostComment}
                disabled={!commentText.trim()}
                className="self-end h-7 px-3 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold text-xs flex items-center gap-1 hover:bg-black disabled:opacity-40"
              >
                <Send className="size-3" />
                <span>Comment</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
