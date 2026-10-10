import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ideaService, roomService, briefService, getCurrentRole, CURRENT_USER_ID
} from '@/services';
import type { Idea, IdeaLink, RoomMember } from '@/services/types';
import { generateIdeasMarkdown, downloadFile, getFirstSentence } from './utils/markdown-generator';
import {
  Lightbulb, Check, X, Star, Download, Link2, FileText, Trash2, Edit3,
  ExternalLink, Sparkles, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { InlineHighlight } from '@/features/home/components/HomeDesignSystem';
import { formatDistanceToNow } from 'date-fns';

export function IdeatePage() {
  const { roomId, id } = useParams<{ roomId?: string; id?: string }>();
  const activeRoomId = roomId || id || 'r-1';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isLeader = getCurrentRole() === 'leader';
  const currentUserId = CURRENT_USER_ID;

  // Queries
  const { data: room } = useQuery({
    queryKey: ['room', activeRoomId],
    queryFn: () => roomService.getRoom(activeRoomId),
  });

  const { data: brief } = useQuery({
    queryKey: ['brief', activeRoomId],
    queryFn: () => briefService.getBrief(activeRoomId),
  });

  const { data: ideas = [] } = useQuery({
    queryKey: ['ideas', activeRoomId],
    queryFn: () => ideaService.listIdeas(activeRoomId),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members', activeRoomId],
    queryFn: () => roomService.getMembers(activeRoomId),
  });

  const isLocked = Boolean(room?.stageDone?.ideate);

  // Composer State
  const [composerText, setComposerText] = useState('');
  const [composerLinks, setComposerLinks] = useState<IdeaLink[]>([]);
  const [composerNotes, setComposerNotes] = useState<string[]>([]);

  // Popover States for Composer
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [showNotePopover, setShowNotePopover] = useState(false);
  const [linkUrlInput, setLinkUrlInput] = useState('');
  const [noteTextInput, setNoteTextInput] = useState('');

  // Feed filters & expanded ideas
  const [feedFilter, setFeedFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [expandedIdeaIds, setExpandedIdeaIds] = useState<Record<string, boolean>>({});
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Mutations
  const createIdeaMutation = useMutation({
    mutationFn: (draft: { text: string; links: IdeaLink[]; notes: string[] }) =>
      ideaService.createIdea(activeRoomId, draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas', activeRoomId] });
      setComposerText('');
      setComposerLinks([]);
      setComposerNotes([]);
      toast.success('Idea posted to team feed.');
    },
  });

  const updateIdeaMutation = useMutation({
    mutationFn: (idea: Idea) => ideaService.updateIdea(idea),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas', activeRoomId] });
      setEditingIdeaId(null);
      toast.success('Idea updated.');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (ideaId: string) => ideaService.approveIdea(activeRoomId, ideaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas', activeRoomId] });
      toast.success('Idea approved.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (ideaId: string) => ideaService.rejectIdea(activeRoomId, ideaId),
    onSuccess: (_, ideaId) => {
      queryClient.invalidateQueries({ queryKey: ['ideas', activeRoomId] });
      toast('Idea rejected.', {
        duration: 8000,
        action: {
          label: 'Undo',
          onClick: () => restoreMutation.mutate(ideaId),
        },
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (ideaId: string) => ideaService.restoreIdea(activeRoomId, ideaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas', activeRoomId] });
      toast.success('Idea restored.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ideaId: string) => ideaService.deleteIdea(activeRoomId, ideaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas', activeRoomId] });
      toast.success('Idea deleted.');
    },
  });

  const primaryMutation = useMutation({
    mutationFn: (ideaId: string) => ideaService.setPrimaryIdea(activeRoomId, ideaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas', activeRoomId] });
    },
  });

  const doneMutation = useMutation({
    mutationFn: () => ideaService.markIdeationDone(activeRoomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', activeRoomId] });
      toast.success('Ideation complete!', {
        action: {
          label: 'Go to Plan',
          onClick: () => navigate(`/app/room/${activeRoomId}/plan`),
        },
      });
    },
  });

  const reopenMutation = useMutation({
    mutationFn: () => ideaService.reopenIdeation(activeRoomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', activeRoomId] });
      toast.info('Ideation reopened for the team.');
    },
  });

  const handlePostIdea = () => {
    if (composerText.trim().length < 10 || isLocked) return;
    createIdeaMutation.mutate({
      text: composerText.trim(),
      links: composerLinks,
      notes: composerNotes,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handlePostIdea();
    }
  };

  const handleAddLink = () => {
    if (!linkUrlInput.trim()) return;
    let url = linkUrlInput.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    try {
      const parsed = new URL(url);
      setComposerLinks([...composerLinks, { url, title: parsed.hostname }]);
      setLinkUrlInput('');
      setShowLinkPopover(false);
    } catch {
      toast.error('Please enter a valid URL.');
    }
  };

  const handleAddNote = () => {
    if (!noteTextInput.trim()) return;
    setComposerNotes([...composerNotes, noteTextInput.trim()]);
    setNoteTextInput('');
    setShowNotePopover(false);
  };

  const approvedIdeas = ideas.filter(i => i.status === 'approved');
  const filteredIdeas = ideas.filter(i => {
    if (feedFilter === 'all') return true;
    return i.status === feedFilter;
  });

  const handleDownloadMarkdown = () => {
    const md = generateIdeasMarkdown(room || null, brief || null, members, ideas);
    downloadFile(md, 'ideas.md');
    toast.success('Downloaded ideas.md');
  };

  return (
    <div className="w-full flex flex-col gap-6 p-8 max-w-[1320px] mx-auto font-sans pb-16">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-1 pb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Ideate</h1>
          <span
            className={cn(
              'px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase',
              isLocked
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {isLocked ? 'LOCKED' : 'OPEN'}
          </span>

          {import.meta.env.DEV && ideas.length === 0 && (
            <button
              onClick={() => ideaService.seedSampleIdeas(activeRoomId).then(() => queryClient.invalidateQueries({ queryKey: ['ideas', activeRoomId] }))}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 ml-auto"
            >
              <Sparkles className="size-3" /> Seed sample ideas
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="line-clamp-1 flex-1">
            {brief?.fields?.problemStatement || 'Problem statement from brief'}
          </span>
          <Link
            to={`/app/room/${activeRoomId}/brief`}
            className="text-blue-600 hover:underline font-semibold shrink-0"
          >
            Open brief &rarr;
          </Link>
        </div>
      </div>

      {/* ── 7 / 5 Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ── LEFT (7/12): ONE SectionedCard ── */}
        <div className="lg:col-span-7 flex flex-col rounded-[24px] bg-card border border-border shadow-xs overflow-hidden">
          {/* Top Composer */}
          <div className="p-5 flex flex-col gap-3">
            <textarea
              rows={3}
              disabled={isLocked}
              placeholder={isLocked ? 'Ideation is locked. Reopen to post new ideas.' : 'Share an idea with the team...'}
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                'w-full bg-transparent resize-none text-sm text-foreground placeholder:text-muted-foreground/60 outline-none leading-relaxed',
                isLocked && 'cursor-not-allowed opacity-60'
              )}
            />

            {/* Added Chips Preview */}
            {(composerLinks.length > 0 || composerNotes.length > 0) && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {composerLinks.map((link, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-[11px] font-medium text-foreground"
                  >
                    <Link2 className="size-3 text-muted-foreground" />
                    <span>{link.title || link.url}</span>
                    <button
                      type="button"
                      onClick={() => setComposerLinks(composerLinks.filter((_, i) => i !== idx))}
                      className="hover:text-red-500 cursor-pointer ml-0.5"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}

                {composerNotes.map((note, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-[11px] font-medium text-foreground"
                  >
                    <FileText className="size-3 text-muted-foreground" />
                    <span>{note.slice(0, 24)}{note.length > 24 ? '…' : ''}</span>
                    <button
                      type="button"
                      onClick={() => setComposerNotes(composerNotes.filter((_, i) => i !== idx))}
                      className="hover:text-red-500 cursor-pointer ml-0.5"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Actions Row */}
            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <div className="flex items-center gap-2 relative">
                {/* Add Link Button */}
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => {
                    setShowLinkPopover(!showLinkPopover);
                    setShowNotePopover(false);
                  }}
                  title="Add link"
                  className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer disabled:opacity-40"
                >
                  <Link2 className="size-4" />
                </button>

                {/* Add Note Button */}
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => {
                    setShowNotePopover(!showNotePopover);
                    setShowLinkPopover(false);
                  }}
                  title="Add note"
                  className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer disabled:opacity-40"
                >
                  <FileText className="size-4" />
                </button>

                {/* Link Popover */}
                {showLinkPopover && (
                  <div className="absolute left-0 top-10 z-30 p-2.5 rounded-xl bg-card border border-border shadow-lg flex items-center gap-2 w-72">
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={linkUrlInput}
                      onChange={(e) => setLinkUrlInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddLink(); }}
                      autoFocus
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-lg bg-muted text-foreground outline-none"
                    />
                    <Button size="sm" onClick={handleAddLink} className="h-7 px-2.5 text-xs">
                      Add
                    </Button>
                  </div>
                )}

                {/* Note Popover */}
                {showNotePopover && (
                  <div className="absolute left-10 top-10 z-30 p-2.5 rounded-xl bg-card border border-border shadow-lg flex items-center gap-2 w-72">
                    <input
                      type="text"
                      placeholder="e.g. Needs OpenAI Whisper API"
                      value={noteTextInput}
                      onChange={(e) => setNoteTextInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote(); }}
                      autoFocus
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-lg bg-muted text-foreground outline-none"
                    />
                    <Button size="sm" onClick={handleAddNote} className="h-7 px-2.5 text-xs">
                      Add
                    </Button>
                  </div>
                )}
              </div>

              {/* Right: Post Idea Button */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  Cmd+Enter
                </span>
                <Button
                  onClick={handlePostIdea}
                  disabled={isLocked || composerText.trim().length < 10 || createIdeaMutation.isPending}
                  className="h-9 px-4 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  Post idea
                </Button>
              </div>
            </div>
          </div>

          {/* Hairline Divider */}
          <div className="border-t border-border/70" />

          {/* Feed Header */}
          <div className="px-5 py-3.5 flex items-center justify-between border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Ideas
              </span>
              <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                {ideas.length}
              </span>
            </div>

            {/* Segmented Control */}
            <div className="inline-flex h-8 items-center rounded-lg bg-muted/60 p-0.5 text-xs text-muted-foreground">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFeedFilter(tab)}
                  className={cn(
                    'px-2.5 py-1 rounded-md capitalize font-medium transition-all cursor-pointer',
                    feedFilter === tab
                      ? 'bg-card text-foreground font-semibold shadow-xs'
                      : 'hover:text-foreground'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Feed Rows */}
          <div className="flex flex-col divide-y divide-border/60">
            {filteredIdeas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center p-6">
                <div className="size-10 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-2.5">
                  <Lightbulb className="size-5" />
                </div>
                <h4 className="text-sm font-bold text-foreground">No ideas yet</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Write the first idea above.</p>
              </div>
            ) : (
              filteredIdeas.map((idea) => {
                const author = members.find(m => m.id === idea.authorId);
                const isAuthor = idea.authorId === currentUserId;
                const isExpanded = expandedIdeaIds[idea.id];
                const isEditing = editingIdeaId === idea.id;

                return (
                  <motion.div
                    key={idea.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      'p-5 flex items-start gap-3.5 group transition-colors',
                      idea.status === 'rejected' && 'opacity-60 bg-muted/20'
                    )}
                  >
                    {/* 32px Avatar */}
                    <div
                      className="size-8 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: author?.avatarColor || '#6366F1' }}
                    >
                      {author?.initials || 'AM'}
                    </div>

                    {/* Text Block */}
                    <div className="flex-1 min-w-0">
                      {/* Line 1: Author, Time, Status Lozenge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {author?.displayName || 'Teammate'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(idea.createdAt), { addSuffix: true })}
                          </span>
                        </div>

                        {/* Status Lozenge */}
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'h-5 px-2 rounded-[6px] text-[10px] font-bold tracking-wider uppercase inline-flex items-center',
                              idea.status === 'approved'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : idea.status === 'rejected'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {idea.status}
                          </span>

                          {/* Leader Controls (Hover on desktop, always on touch) */}
                          {isLeader && !isLocked && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {idea.status !== 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => approveMutation.mutate(idea.id)}
                                  title="Approve idea"
                                  className="size-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Check className="size-3.5 stroke-[3]" />
                                </button>
                              )}
                              {idea.status !== 'rejected' && (
                                <button
                                  type="button"
                                  onClick={() => rejectMutation.mutate(idea.id)}
                                  title="Reject idea"
                                  className="size-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <X className="size-3.5 stroke-[3]" />
                                </button>
                              )}
                            </div>
                          )}

                          {/* Author Controls */}
                          {isAuthor && idea.status === 'pending' && !isLocked && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingIdeaId(idea.id);
                                  setEditingText(idea.text);
                                }}
                                title="Edit"
                                className="size-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer"
                              >
                                <Edit3 className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteMutation.mutate(idea.id)}
                                title="Delete"
                                className="size-7 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 flex items-center justify-center cursor-pointer"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Idea Text or Inline Editor */}
                      {isEditing ? (
                        <div className="mt-2 flex flex-col gap-2">
                          <textarea
                            rows={3}
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-border bg-muted/40 text-sm text-foreground outline-none"
                          />
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingIdeaId(null)}
                              className="h-7 px-2.5 text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updateIdeaMutation.mutate({ ...idea, text: editingText })}
                              className="h-7 px-3 text-xs"
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1">
                          <p
                            className={cn(
                              'text-sm text-foreground leading-relaxed',
                              !isExpanded && 'line-clamp-4',
                              idea.status === 'rejected' && 'line-through text-muted-foreground'
                            )}
                          >
                            {idea.text}
                          </p>

                          {idea.text.length > 240 && (
                            <button
                              type="button"
                              onClick={() => setExpandedIdeaIds({ ...expandedIdeaIds, [idea.id]: !isExpanded })}
                              className="text-xs text-blue-600 hover:underline mt-1 font-medium inline-block cursor-pointer"
                            >
                              {isExpanded ? 'Show less' : 'Show more'}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Rejected Restore Action */}
                      {idea.status === 'rejected' && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => restoreMutation.mutate(idea.id)}
                            className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                          >
                            Restore idea
                          </button>
                        </div>
                      )}

                      {/* Link & Note Chips */}
                      {((idea.links && idea.links.length > 0) || (idea.notes && idea.notes.length > 0)) && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {idea.links?.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Link2 className="size-3" />
                              <span>{link.title || link.url}</span>
                            </a>
                          ))}

                          {idea.notes?.map((note, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-[11px] text-muted-foreground"
                            >
                              <FileText className="size-3" />
                              <span>{note}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT (5/12): ONE SectionedCard "Approved ideas" ── */}
        <div className="lg:col-span-5 flex flex-col rounded-[24px] bg-card border border-border shadow-xs overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">Approved ideas</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-bold">
                {approvedIdeas.length}
              </span>
            </div>
          </div>

          {/* Body: 44px rows */}
          <div className="p-4 flex flex-col gap-1.5 min-h-[220px]">
            {approvedIdeas.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-2xl h-full my-auto">
                <p className="text-xs text-muted-foreground">Approved ideas collect here.</p>
              </div>
            ) : (
              approvedIdeas.map((idea, idx) => {
                const author = members.find(m => m.id === idea.authorId);
                const isPrimary = Boolean(idea.isPrimary);

                return (
                  <div
                    key={idea.id}
                    className={cn(
                      'h-11 px-3 rounded-xl flex items-center justify-between gap-2.5 transition-colors',
                      isPrimary ? 'bg-blue-500/10 border border-blue-500/20' : 'hover:bg-muted/40'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Numbered circle */}
                      <span className="size-5 rounded-full bg-muted text-[10px] font-bold text-muted-foreground flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>

                      {/* First sentence, 1 line ellipsis */}
                      <span className="text-xs font-medium text-foreground truncate flex-1">
                        {getFirstSentence(idea.text, 80)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* 24px Avatar */}
                      <div
                        className="size-6 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                        style={{ backgroundColor: author?.avatarColor || '#6366F1' }}
                        title={author?.displayName}
                      >
                        {author?.initials || 'AM'}
                      </div>

                      {/* Primary Star Button */}
                      <button
                        type="button"
                        onClick={() => primaryMutation.mutate(idea.id)}
                        title={isPrimary ? 'Primary idea (starred)' : 'Set as primary idea'}
                        className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
                      >
                        <Star
                          className={cn(
                            'size-4',
                            isPrimary ? 'text-blue-600 fill-blue-600' : 'text-muted-foreground/60'
                          )}
                        />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer (Hairline above) */}
          <div className="p-4 border-t border-border/70 bg-muted/20 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadMarkdown}
              className="text-xs h-9 rounded-xl group/dl"
            >
              <Download className="size-3.5 mr-1.5 transition-transform group-hover/dl:translate-y-0.5" />
              Download ideas.md
            </Button>

            {isLocked ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <Check className="size-3.5 stroke-[3]" /> Ideation done
                </span>
                {isLeader && (
                  <button
                    type="button"
                    onClick={() => reopenMutation.mutate()}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground underline cursor-pointer ml-1"
                  >
                    Reopen
                  </button>
                )}
              </div>
            ) : isLeader ? (
              <Button
                onClick={() => doneMutation.mutate()}
                disabled={approvedIdeas.length === 0 || doneMutation.isPending}
                className="h-9 px-4 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                Ideation done &rarr;
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground font-medium">
                Waiting for the leader
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
