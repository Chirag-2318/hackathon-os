import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, FileText, X, Globe, Plus, CornerDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import type { IdeaLink } from '@/services/types';
import type { UserLike } from '@/components/ui/user-avatar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface IdeateComposerProps {
  currentUser?: UserLike | null;
  isLocked: boolean;
  canPost: boolean;
  isPending: boolean;
  onPost: (draft: { text: string; links: IdeaLink[]; notes: string[] }) => Promise<void> | void;
}

export interface IdeateComposerRef {
  focus: () => void;
}

export const IdeateComposer = forwardRef<IdeateComposerRef, IdeateComposerProps>(function IdeateComposer(
  { currentUser, isLocked, canPost, isPending, onPost },
  ref
) {
  const [text, setText] = useState('');
  const [links, setLinks] = useState<IdeaLink[]>([]);
  const [notes, setNotes] = useState<string[]>([]);

  // Inline attachment controls
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [noteText, setNoteText] = useState('');

  // Mobile expansion state
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  // Success animation state
  const [justPosted, setJustPosted] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
      setIsMobileExpanded(true);
    },
  }));

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(68, textareaRef.current.scrollHeight)}px`;
    }
  }, [text]);

  const handlePost = async () => {
    const trimmed = text.trim();
    if (!trimmed || isLocked || !canPost || isPending) return;

    setJustPosted(true);
    try {
      await onPost({ text: trimmed, links, notes });
      setText('');
      setLinks([]);
      setNotes([]);
      setShowLinkInput(false);
      setShowNoteInput(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } finally {
      setTimeout(() => setJustPosted(false), 500);
    }
  };

  const handleAddLink = () => {
    let url = linkUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    try {
      const parsed = new URL(url);
      setLinks((prev) => [...prev, { url, title: parsed.hostname.replace(/^www\./, '') }]);
      setLinkUrl('');
      setShowLinkInput(false);
    } catch {
      toast.error('Invalid URL');
    }
  };

  const handleAddNote = () => {
    const note = noteText.trim();
    if (!note) return;
    setNotes((prev) => [...prev, note]);
    setNoteText('');
    setShowNoteInput(false);
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  };

  const hasContent = text.trim().length > 0;
  const charCount = text.length;

  return (
    <motion.div
      animate={justPosted ? { y: -6, opacity: 0.85 } : { y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={cn(
        'rounded-2xl border border-border/80 bg-card p-4 transition-all duration-150',
        'focus-within:border-border-strong focus-within:ring-2 focus-within:ring-primary/15 focus-within:shadow-xs',
        isLocked && 'opacity-60 pointer-events-none'
      )}
    >
      <div className="flex gap-3 items-start">
        {/* User avatar on the left */}
        <div className="shrink-0 pt-0.5">
          <UserAvatar user={currentUser} size={32} />
        </div>

        {/* Main composer body */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Borderless auto-growing textarea */}
          <textarea
            ref={textareaRef}
            rows={2}
            value={text}
            disabled={isLocked || !canPost}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsMobileExpanded(true)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handlePost();
              }
            }}
            placeholder={
              isLocked
                ? 'Ideation is locked.'
                : 'What should we build? One idea, in your own words.'
            }
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 resize-none outline-none border-0 p-0 leading-relaxed min-h-[64px]"
          />

          {/* Inline attachment input rows */}
          <AnimatePresence>
            {showLinkInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/60 text-xs"
              >
                <div className="size-5 rounded flex items-center justify-center shrink-0">
                  {linkUrl ? (
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${getDomain(linkUrl)}&sz=32`}
                      alt=""
                      className="size-3.5 object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Globe className="size-3.5 text-muted-foreground" />
                  )}
                </div>
                <input
                  type="text"
                  placeholder="https://example.com or article"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLink();
                    } else if (e.key === 'Escape') {
                      setShowLinkInput(false);
                    }
                  }}
                  className="flex-1 bg-transparent border-0 outline-none text-xs text-foreground placeholder:text-muted-foreground"
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={handleAddLink} className="h-6 px-2 text-xs">
                  Attach
                </Button>
                <button
                  type="button"
                  onClick={() => setShowLinkInput(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </motion.div>
            )}

            {showNoteInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/60 text-xs"
              >
                <FileText className="size-3.5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Quick research note or key stat..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNote();
                    } else if (e.key === 'Escape') {
                      setShowNoteInput(false);
                    }
                  }}
                  className="flex-1 bg-transparent border-0 outline-none text-xs text-foreground placeholder:text-muted-foreground"
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={handleAddNote} className="h-6 px-2 text-xs">
                  Attach
                </Button>
                <button
                  type="button"
                  onClick={() => setShowNoteInput(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attachment chips under textarea */}
          {(links.length > 0 || notes.length > 0) && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {links.map((link, idx) => (
                <span
                  key={`link-${idx}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border/60 text-xs text-foreground"
                >
                  <Globe className="size-3 text-muted-foreground shrink-0" />
                  <span className="truncate max-w-[160px] font-mono text-[11px]">
                    {link.title || link.url}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLinks((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-muted-foreground hover:text-foreground ml-0.5 cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}

              {notes.map((note, idx) => (
                <span
                  key={`note-${idx}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border/60 text-xs text-foreground"
                >
                  <FileText className="size-3 text-muted-foreground shrink-0" />
                  <span className="truncate max-w-[180px] text-[11px]">{note}</span>
                  <button
                    type="button"
                    onClick={() => setNotes((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-muted-foreground hover:text-foreground ml-0.5 cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Bottom actions row */}
          <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
            {/* Left: Ghost attachment buttons */}
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowLinkInput(!showLinkInput);
                  setShowNoteInput(false);
                }}
                disabled={isLocked || !canPost}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <Link2 className="size-3.5" />
                <span>Add link</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNoteInput(!showNoteInput);
                  setShowLinkInput(false);
                }}
                disabled={isLocked || !canPost}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <FileText className="size-3.5" />
                <span>Add note</span>
              </Button>
            </div>

            {/* Right: Character hint + Post idea button */}
            <div className="flex items-center gap-3">
              {charCount > 0 && (
                <span className="font-mono text-[11px] text-muted-foreground">
                  {charCount} chars
                </span>
              )}

              <Button
                type="button"
                size="sm"
                disabled={!hasContent || isLocked || !canPost || isPending}
                onClick={handlePost}
                className="h-8 px-3 text-xs font-semibold gap-1.5"
              >
                <span>{isPending ? 'Posting...' : 'Post idea'}</span>
                <span className="font-mono text-[10px] opacity-60 hidden sm:inline">
                  Ctrl+Enter
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
