import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { UserName } from '@/components/ui/user-name';
import type { Task, RoomMember } from '@/services/types';

export interface TaskActivitySectionProps {
  task: Task;
  members: RoomMember[];
  currentMember: RoomMember | null;
  onAddComment: (text: string) => Promise<void>;
}

export function TaskActivitySection({
  task,
  members,
  currentMember,
  onAddComment,
}: TaskActivitySectionProps) {
  const [commentText, setCommentText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async () => {
    if (!commentText.trim() || isPosting) return;
    setIsPosting(true);
    try {
      await onAddComment(commentText.trim());
      setCommentText('');
      setIsFocused(false);
    } finally {
      setIsPosting(false);
    }
  };

  const comments = task.comments || [];

  return (
    <div className="flex flex-col gap-3 pt-4 border-t border-border/60">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Activity & Comments ({comments.length})
        </span>
      </div>

      {/* Comment Input */}
      <div className="flex items-start gap-3">
        <div
          className="size-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: currentMember?.avatarColor || '#3b82f6' }}
        >
          {currentMember?.initials || 'ME'}
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <textarea
            rows={isFocused || commentText.length > 0 ? 3 : 1}
            placeholder="Add a comment or note..."
            value={commentText}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => setCommentText(e.target.value)}
            className="w-full text-xs text-foreground p-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background outline-none resize-none transition-all placeholder:text-muted-foreground leading-relaxed"
          />
          {(isFocused || commentText.length > 0) && (
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsFocused(false);
                  setCommentText('');
                }}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!commentText.trim() || isPosting}
                className="h-7 text-xs"
              >
                {isPosting ? 'Posting...' : 'Save Comment'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Comments List */}
      {comments.length > 0 && (
        <div className="flex flex-col gap-2.5 pt-1">
          {comments.map((c) => {
            const author = members.find((m) => m.id === c.authorId);
            return (
              <div key={c.id} className="flex items-start gap-2.5 text-xs">
                <div className="size-6 rounded-full overflow-hidden shrink-0 mt-0.5">
                  <UserAvatar
                    user={{
                      ...author,
                      avatarUrl: (author as any)?.avatarUrl || (author as any)?.avatar,
                    }}
                    size={24}
                  />
                </div>
                <div className="flex-1 bg-muted/40 p-2.5 rounded-xl border border-border/40">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-foreground">
                      <UserName
                        user={{
                          ...author,
                          name: author?.name || (author as any)?.displayName,
                        }}
                        showDisplayName={true}
                      />
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : ''}
                    </span>
                  </div>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">{c.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
