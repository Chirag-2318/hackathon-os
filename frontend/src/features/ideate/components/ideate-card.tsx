import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Edit3, Trash2, Globe, FileText, Star, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Idea } from '@/services/types';
import { cn } from '@/lib/utils';

export interface IdeateCardProps {
  idea: Idea;
  isMine: boolean;
  canDecide: boolean;
  isLocked: boolean;
  viewMode?: 'cards' | 'compact';
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onStar?: (id: string, isPrimary: boolean) => void;
  onUpdate: (idea: Idea) => void;
  onDelete: (id: string) => void;
}

export function IdeateCard({
  idea,
  isMine,
  canDecide,
  isLocked,
  viewMode = 'cards',
  onApprove,
  onReject,
  onStar,
  onUpdate,
  onDelete,
}: IdeateCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(idea.text);
  const [justApproved, setJustApproved] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const status = idea.status || 'pending';
  const authorName = (idea as any).author?.name || (idea as any).authorName || 'Teammate';
  const username = (idea as any).author?.username || authorName.toLowerCase().replace(/\s+/g, '');

  const relativeTime = idea.createdAt
    ? formatDistanceToNow(new Date(idea.createdAt), { addSuffix: true })
    : '';

  const handleApprove = () => {
    if (isLocked || !canDecide) return;
    setJustApproved(true);
    onApprove(idea.id);
  };

  const handleReject = () => {
    if (isLocked || !canDecide) return;
    setIsRejecting(true);
    onReject(idea.id);
  };

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    onUpdate({ ...idea, text: editText.trim() });
    setIsEditing(false);
  };

  // Keyboard accessibility: A to approve, R to reject on focused card
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isEditing) return;
    if (canDecide && !isLocked && status === 'pending') {
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleApprove();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReject();
      }
    }
  };

  // 3px left status stripe color
  const stripeColor =
    status === 'approved'
      ? 'bg-emerald-500'
      : status === 'rejected'
      ? 'bg-red-500/80'
      : 'bg-border';

  const statusLabel =
    status === 'approved'
      ? 'Approved'
      : status === 'rejected'
      ? 'Rejected'
      : 'Pending';

  const statusTextColor =
    status === 'approved'
      ? 'text-emerald-600'
      : status === 'rejected'
      ? 'text-red-600'
      : 'text-muted-foreground';

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative rounded-xl border border-border/80 bg-card p-4 transition-all duration-150 outline-none select-none',
        'hover:-translate-y-[2px] hover:shadow-xs focus-visible:ring-2 focus-visible:ring-primary/20',
        isRejecting && 'opacity-60 transition-opacity duration-300',
        viewMode === 'compact' ? 'flex flex-col gap-2' : 'flex flex-col gap-3 min-h-[160px]'
      )}
    >
      {/* 3px left status stripe */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute left-0 top-0 bottom-0 w-[3px] rounded-l transition-colors duration-250',
          stripeColor
        )}
      />

      {/* Header: Author UserAvatar + @username + relative time */}
      <div className="flex items-center justify-between gap-2 pl-1">
        <div className="flex items-center gap-2 min-w-0">
          <UserAvatar
            user={(idea as any).author || { name: authorName, username }}
            size={24}
            className="shrink-0"
          />
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-xs text-foreground truncate">
              {authorName}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground truncate">
              @{username}
            </span>
            <span className="text-muted-foreground/40 text-[10px]">•</span>
            <span className="text-[11px] font-mono text-muted-foreground shrink-0">
              {relativeTime}
            </span>
          </div>
        </div>

        {/* Primary pitch badge or Star button */}
        {idea.isPrimary && (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1 shrink-0">
            <Star className="size-3 fill-amber-500 text-amber-500" />
            <span className="hidden sm:inline">Primary</span>
          </span>
        )}
      </div>

      {/* Idea text (with line clamp 5 and Show more) */}
      <div className="pl-1 flex-1">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              rows={3}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-muted/40 text-sm border border-border/70 resize-none outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex justify-end gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-7 text-xs px-2.5">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEdit} className="h-7 text-xs px-3">
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-1">
            <p
              style={{ fontFamily: 'var(--font-ui)' }}
              className={cn(
                'text-[16px] text-foreground leading-relaxed whitespace-pre-wrap select-text',
                !isExpanded && 'line-clamp-5'
              )}
            >
              {idea.text}
            </p>
            {idea.text.length > 220 && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-primary hover:underline font-medium mt-0.5 cursor-pointer"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}

        {/* Attachments chips */}
        {(idea.links?.length > 0 || idea.notes?.length > 0) && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {idea.links?.map((link, idx) => {
              let domain = '';
              try {
                domain = new URL(link.url).hostname.replace(/^www\./, '');
              } catch {
                domain = link.url;
              }

              return (
                <Popover key={`link-${idx}`}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/50 hover:bg-muted text-[11px] text-foreground border border-border/60 transition-colors cursor-pointer"
                    >
                      <Globe className="size-3 text-muted-foreground shrink-0" />
                      <span className="font-mono truncate max-w-[140px]">{domain}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 text-xs flex flex-col gap-2">
                    <p className="font-semibold text-foreground truncate">{link.title || domain}</p>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-[11px] break-all"
                    >
                      <span>{link.url}</span>
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  </PopoverContent>
                </Popover>
              );
            })}

            {idea.notes?.map((note, idx) => (
              <Popover key={`note-${idx}`}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/50 hover:bg-muted text-[11px] text-foreground border border-border/60 transition-colors cursor-pointer"
                  >
                    <FileText className="size-3 text-muted-foreground shrink-0" />
                    <span className="truncate max-w-[140px]">{note.slice(0, 20)}...</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3 text-xs leading-relaxed text-foreground">
                  <div className="font-semibold text-muted-foreground mb-1">Research Note</div>
                  <p className="whitespace-pre-wrap">{note}</p>
                </PopoverContent>
              </Popover>
            ))}
          </div>
        )}
      </div>

      {/* Footer hairline with status label and actions */}
      <div className="flex items-center justify-between pt-2 mt-auto border-t border-border/40 pl-1 text-xs">
        {/* Left: Status label + animated stamp check */}
        <div className="flex items-center gap-1.5">
          <span className={cn('font-mono text-[11px] uppercase font-semibold tracking-wider', statusTextColor)}>
            {statusLabel}
          </span>
          <AnimatePresence>
            {(status === 'approved' || justApproved) && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="size-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0"
              >
                <Check className="size-2.5 stroke-[3]" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Member's own idea edit/delete on pending */}
          {isMine && status === 'pending' && !isLocked && !isEditing && (
            <div className="flex items-center gap-1 mr-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                title="Edit idea"
              >
                <Edit3 className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(idea.id)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                title="Delete idea"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          )}

          {/* Leader-only actions */}
          {canDecide && !isLocked && (
            <>
              {status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleReject}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-red-600 hover:bg-red-500/10 gap-1"
                    title="Reject idea (Press R)"
                  >
                    <X className="size-3.5" />
                    <span>Reject</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleApprove}
                    className="h-7 px-2.5 text-xs text-emerald-600 border-emerald-600/30 hover:bg-emerald-500/10 hover:border-emerald-600/50 gap-1 font-medium"
                    title="Approve idea (Press A)"
                  >
                    <Check className="size-3.5" />
                    <span>Approve</span>
                  </Button>
                </>
              )}

              {status === 'approved' && onStar && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onStar(idea.id, !idea.isPrimary)}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  <Star className={cn('size-3.5', idea.isPrimary && 'fill-amber-500 text-amber-500')} />
                  <span>{idea.isPrimary ? 'Unstar' : 'Set as primary'}</span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
