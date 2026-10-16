import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomService } from '@/services/roomService';
import { roomApi } from '../api';
import { invitePath } from '@/shared/constants/routes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, Check, RefreshCw, Link as LinkIcon, Loader2, Users, Mail, Send } from 'lucide-react';
import { toast } from 'sonner';

interface InviteCodeDialogProps {
  roomId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const INVITE_ROLES = [
  { label: 'Builder', value: 'BUILDER' },
  { label: 'Designer', value: 'DESIGNER' },
  { label: 'Presenter', value: 'PRESENTER' },
  { label: 'Domain Expert', value: 'DOMAIN_EXPERT' },
  { label: 'QA / Testing', value: 'QA' },
];

export function InviteCodeDialog({ roomId, open, onOpenChange, trigger }: InviteCodeDialogProps) {
  const queryClient = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;

  const [codeCopied, setCodeCopied] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [showLinkUi, setShowLinkUi] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Email invitation state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('BUILDER');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  const { data: room, isLoading: isRoomLoading } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => roomService.getRoom(roomId),
    enabled: Boolean(roomId) && isOpen,
  });

  const joinCode = (room?.joinCode || '').toUpperCase();
  const isLeader = Boolean(room?.isLeader);

  const { mutate: generateInviteLink, isPending: isGeneratingLink } = useMutation({
    mutationFn: () => roomApi.createInvite(roomId),
    onSuccess: (data) => {
      const link = `${window.location.origin}${invitePath(data.token)}`;
      setInviteUrl(link);
    },
  });

  const emailInviteMutation = useMutation({
    mutationFn: () => roomApi.inviteByEmail(roomId, email.trim(), role),
    onSuccess: () => {
      setEmailSuccess(`Invitation sent to ${email.trim()}`);
      setEmail('');
      setEmailError(null);
      toast.success('Invitation email sent');
    },
    onError: (err: any) => {
      const message = err?.message || 'Failed to send invitation';
      setEmailError(message);
      toast.error(message);
    },
  });

  const handleSendEmailInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSuccess(null);
    setEmailError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Please enter an email address');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    emailInviteMutation.mutate();
  };

  const regenMutation = useMutation({
    mutationFn: () => roomService.regenerateJoinCode(roomId),
    onSuccess: (data) => {
      queryClient.setQueryData(['room', roomId], (prev: any) =>
        prev ? { ...prev, joinCode: data.joinCode } : prev
      );
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
      toast.success('Generated new room code');
      setShowRegenConfirm(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to regenerate code');
      setShowRegenConfirm(false);
    },
  });

  const handleCopyCode = () => {
    if (!room?.joinCode) return;
    navigator.clipboard.writeText(room.joinCode).catch(() => {});
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 1500);
  };

  const handleCopyLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1500);
  };

  const toggleLinkUi = () => {
    const next = !showLinkUi;
    setShowLinkUi(next);
    if (next && !inviteUrl) {
      generateInviteLink();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[460px] rounded-[24px] bg-card p-6 font-sans">
        <DialogHeader className="flex flex-col items-center text-center pb-1">
          <div className="size-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-1.5">
            <Users className="size-5" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            Invite teammates
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-1">
          {/* Monospace Boxes */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-full">
            {isRoomLoading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="w-8 h-10 sm:w-9 sm:h-11 rounded-xl border-2 border-border/80 bg-muted/30 flex items-center justify-center"
                >
                  <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                </div>
              ))
            ) : (
              (joinCode || '--------').split('').map((char: string, idx: number) => (
                <div
                  key={idx}
                  className="w-8 h-10 sm:w-9 sm:h-11 rounded-xl border-2 border-border/80 bg-muted/30 flex items-center justify-center font-mono text-xl sm:text-2xl font-bold uppercase text-foreground shadow-xs select-all"
                >
                  {char}
                </div>
              ))
            )}
          </div>

          {/* Action Row: Copy Code & New Code */}
          <div className="flex items-center gap-2 w-full justify-center">
            <Button
              onClick={handleCopyCode}
              disabled={isRoomLoading || !room?.joinCode}
              className="h-8 px-4 rounded-xl text-xs font-semibold gap-1.5 min-w-[100px]"
            >
              {codeCopied ? (
                <>
                  <Check className="size-3.5 text-white" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Copy code</span>
                </>
              )}
            </Button>

            {isLeader && !showRegenConfirm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRegenConfirm(true)}
                className="h-8 px-3 rounded-xl text-xs font-medium gap-1 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="size-3" />
                New code
              </Button>
            )}
          </div>

          {/* Leader Confirmation for New Code */}
          {showRegenConfirm && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex flex-col gap-1.5 w-full text-center">
              <span className="font-medium">The old code will stop working</span>
              <div className="flex items-center justify-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowRegenConfirm(false)} className="h-7 px-3 text-xs">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => regenMutation.mutate()}
                  disabled={regenMutation.isPending}
                  className="h-7 px-3 text-xs bg-accent text-on-accent hover:opacity-90 cursor-pointer"
                >
                  {regenMutation.isPending ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
                  Confirm
                </Button>
              </div>
            </div>
          )}

          {/* Email Invitation Form */}
          <div className="w-full pt-3 border-t border-border/60 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Mail className="size-3.5 text-blue-600" />
              <span>Invite via email</span>
            </div>

            <form onSubmit={handleSendEmailInvite} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError(null); setEmailSuccess(null); }}
                  className="h-9 text-xs rounded-xl flex-1 font-sans"
                  disabled={emailInviteMutation.isPending}
                />
                <Select value={role} onValueChange={setRole} disabled={emailInviteMutation.isPending}>
                  <SelectTrigger className="h-9 w-28 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVITE_ROLES.map(r => (
                      <SelectItem key={r.value} value={r.value} className="text-xs">
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="submit"
                  size="sm"
                  disabled={emailInviteMutation.isPending || !email.trim()}
                  className="h-9 px-3 rounded-xl text-xs font-semibold gap-1 shrink-0"
                >
                  {emailInviteMutation.isPending ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Send className="size-3" />
                  )}
                  Send
                </Button>
              </div>

              {emailError && (
                <p className="text-[11px] text-danger-text text-left font-medium">{emailError}</p>
              )}
              {emailSuccess && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 text-left font-medium">✓ {emailSuccess}</p>
              )}
            </form>
          </div>

          {/* Shareable Link UI */}
          <div className="w-full pt-2 border-t border-border/60 flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={toggleLinkUi}
              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <LinkIcon className="size-3" />
              {showLinkUi ? 'Hide invite link' : 'Or share an invite link'}
            </button>

            {showLinkUi && (
              <div className="w-full flex items-center gap-1.5 p-1.5 rounded-xl bg-muted/40 border border-border mt-1">
                <input
                  type="text"
                  readOnly
                  value={isGeneratingLink ? 'Generating invite link…' : inviteUrl ?? ''}
                  className="flex-1 bg-transparent px-2 text-xs text-foreground truncate outline-none select-all font-mono"
                />
                <Button
                  size="sm"
                  onClick={handleCopyLink}
                  disabled={isGeneratingLink || !inviteUrl}
                  className="h-7 px-3 rounded-lg text-xs font-semibold gap-1 shrink-0"
                >
                  {linkCopied ? <Check className="size-3" /> : <Copy className="size-3" />}
                  {linkCopied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
