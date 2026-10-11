import React, { useState } from 'react';
import type { Idea } from '@/services/types';
import { Button } from '@/components/ui/button';
import { Star, Check, X, Trash2, Edit3, Link2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface IdeaFeedCardProps {
  idea: Idea;
  isMine: boolean;
  canDecide: boolean;
  isLocked: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onStar: (id: string, isPrimary: boolean) => void;
  onUpdate: (idea: Idea) => void;
  onDelete: (id: string) => void;
}

export function IdeaFeedCard({
  idea,
  isMine,
  canDecide,
  isLocked,
  onApprove,
  onReject,
  onStar,
  onUpdate,
  onDelete,
}: IdeaFeedCardProps) {
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState(idea.text);

  const handleSave = () => {
    if (!draftText.trim()) return;
    onUpdate({ ...idea, text: draftText.trim() });
    setEditing(false);
  };

  const isPending = idea.status === 'pending';

  return (
    <div className={cn(
      'p-4 border-b border-border/60 flex flex-col gap-2.5 transition-colors',
      idea.isPrimary && 'bg-amber-500/5 dark:bg-amber-500/10'
    )}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-foreground">
            {idea.authorId ? `Member ${idea.authorId.slice(0, 6)}` : 'Team member'}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {idea.createdAt ? formatDistanceToNow(new Date(idea.createdAt), { addSuffix: true }) : ''}
          </span>
          {idea.isPrimary && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1">
              <Star className="size-3 fill-amber-500 text-amber-500" /> Primary Pitch
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <span className={cn(
            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
            idea.status === 'approved' && 'bg-emerald-500/10 text-emerald-600',
            idea.status === 'rejected' && 'bg-red-500/10 text-red-600',
            idea.status === 'pending' && 'bg-muted text-muted-foreground'
          )}>
            {idea.status}
          </span>
        </div>
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            rows={3}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-muted text-xs border border-border resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="text-xs h-7">Cancel</Button>
            <Button size="sm" onClick={handleSave} className="text-xs h-7">Save</Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{idea.text}</p>
      )}

      {(idea.links?.length > 0 || idea.notes?.length > 0) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {idea.links?.map((l, i) => (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="px-2 py-0.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground text-[11px] flex items-center gap-1"
            >
              <Link2 className="size-3" /> {l.title || l.url}
            </a>
          ))}
          {idea.notes?.map((n, i) => (
            <span key={i} className="px-2 py-0.5 rounded-lg bg-muted text-muted-foreground text-[11px] flex items-center gap-1">
              <FileText className="size-3" /> {n}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <div className="flex items-center gap-1">
          {isMine && isPending && !isLocked && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="h-7 px-2 text-muted-foreground text-xs">
                <Edit3 className="size-3 mr-1" /> Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(idea.id)} className="h-7 px-2 text-red-500 hover:text-red-600 text-xs">
                <Trash2 className="size-3 mr-1" /> Delete
              </Button>
            </>
          )}
        </div>

        {canDecide && !isLocked && (
          <div className="flex items-center gap-1.5">
            {isPending && (
              <>
                <Button size="sm" variant="outline" onClick={() => onApprove(idea.id)} className="h-7 px-2.5 text-xs text-emerald-600">
                  <Check className="size-3 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => onReject(idea.id)} className="h-7 px-2.5 text-xs text-red-600">
                  <X className="size-3 mr-1" /> Reject
                </Button>
              </>
            )}
            {idea.status === 'approved' && (
              <Button
                size="sm"
                variant={idea.isPrimary ? 'secondary' : 'outline'}
                onClick={() => onStar(idea.id, !idea.isPrimary)}
                className="h-7 px-2.5 text-xs"
              >
                <Star className={cn('size-3 mr-1', idea.isPrimary && 'fill-amber-500 text-amber-500')} />
                {idea.isPrimary ? 'Unstar primary' : 'Set as primary'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
