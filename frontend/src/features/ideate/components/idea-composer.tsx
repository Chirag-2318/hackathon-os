import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link2, FileText, X } from 'lucide-react';
import type { IdeaLink } from '@/services/types';
import { toast } from 'sonner';

interface IdeaComposerProps {
  isLocked: boolean;
  canPost: boolean;
  isPending: boolean;
  onPost: (draft: { text: string; links: IdeaLink[]; notes: string[] }) => void;
}

export function IdeaComposer({ isLocked, canPost, isPending, onPost }: IdeaComposerProps) {
  const [text, setText] = useState('');
  const [links, setLinks] = useState<IdeaLink[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [showNotePopover, setShowNotePopover] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [noteInput, setNoteInput] = useState('');

  const handlePost = () => {
    if (text.trim().length < 10 || isLocked || !canPost) return;
    onPost({ text: text.trim(), links, notes });
    setText('');
    setLinks([]);
    setNotes([]);
  };

  const handleAddLink = () => {
    let url = linkInput.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    try {
      const parsed = new URL(url);
      setLinks([...links, { url, title: parsed.hostname }]);
      setLinkInput('');
      setShowLinkPopover(false);
    } catch {
      toast.error('Invalid URL format');
    }
  };

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    setNotes([...notes, noteInput.trim()]);
    setNoteInput('');
    setShowNotePopover(false);
  };

  return (
    <div className="p-4 border-b border-border/70 flex flex-col gap-3">
      <textarea
        rows={3}
        placeholder={isLocked ? 'Ideation is locked.' : 'Post an idea for the hackathon... (Ctrl+Enter to post)'}
        value={text}
        disabled={isLocked || !canPost}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handlePost();
          }
        }}
        className="w-full p-3 rounded-xl bg-muted/40 text-xs border border-border/60 resize-none outline-none focus:ring-1 focus:ring-primary"
      />

      {(links.length > 0 || notes.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {links.map((l, i) => (
            <span key={i} className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 text-[11px] flex items-center gap-1">
              <Link2 className="size-3" /> {l.title || l.url}
              <button type="button" onClick={() => setLinks(links.filter((_, idx) => idx !== i))}>
                <X className="size-2.5 ml-1" />
              </button>
            </span>
          ))}
          {notes.map((n, i) => (
            <span key={i} className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 text-[11px] flex items-center gap-1">
              <FileText className="size-3" /> {n}
              <button type="button" onClick={() => setNotes(notes.filter((_, idx) => idx !== i))}>
                <X className="size-2.5 ml-1" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowLinkPopover(!showLinkPopover)}
            disabled={isLocked || !canPost}
            className="text-xs h-8 text-muted-foreground"
          >
            <Link2 className="size-3.5 mr-1" /> Add Link
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowNotePopover(!showNotePopover)}
            disabled={isLocked || !canPost}
            className="text-xs h-8 text-muted-foreground"
          >
            <FileText className="size-3.5 mr-1" /> Add Note
          </Button>
        </div>

        <Button
          size="sm"
          onClick={handlePost}
          disabled={text.trim().length < 10 || isLocked || !canPost || isPending}
          className="text-xs font-semibold h-8 px-4"
        >
          {isPending ? 'Posting...' : 'Post idea'}
        </Button>
      </div>

      {showLinkPopover && (
        <div className="flex gap-2 pt-2 border-t border-border/40">
          <input
            type="url"
            placeholder="https://github.com/..."
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            className="flex-1 h-8 px-3 rounded-lg bg-muted text-xs border border-border"
          />
          <Button size="sm" onClick={handleAddLink} className="h-8 text-xs">Attach</Button>
        </div>
      )}

      {showNotePopover && (
        <div className="flex gap-2 pt-2 border-t border-border/40">
          <input
            type="text"
            placeholder="Private or technical note..."
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            className="flex-1 h-8 px-3 rounded-lg bg-muted text-xs border border-border"
          />
          <Button size="sm" onClick={handleAddNote} className="h-8 text-xs">Attach</Button>
        </div>
      )}
    </div>
  );
}
