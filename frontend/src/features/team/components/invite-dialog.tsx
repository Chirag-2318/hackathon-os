import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/design/components/confirm-dialog';
import { Copy, Check, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '@/design/api';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  joinCode: string;
  isLeader: boolean;
  onCodeRegenerated?: (newCode: string) => void;
  initialTab?: 'email' | 'code';
}

export function InviteDialog({
  open,
  onOpenChange,
  roomId,
  joinCode: initialJoinCode,
  isLeader,
  onCodeRegenerated,
  initialTab = 'email',
}: InviteDialogProps) {
  const [tab, setTab] = useState<'email' | 'code'>(initialTab);
  const [email, setEmail] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showResendOption, setShowResendOption] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    setJoinCode(initialJoinCode);
  }, [initialJoinCode]);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setErrorMessage(null);
      setShowResendOption(false);
    }
  }, [open, initialTab]);

  const copyCode = async () => {
    if (!joinCode) return;
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Room code copied');
    } catch {
      toast.error('Failed to copy code');
    }
  };

  const sendInviteMutation = useMutation({
    mutationFn: (variables: { email: string; note?: string | null }) =>
      apiFetch<any>(`/api/v1/rooms/${roomId}/invites/email`, {
        method: 'POST',
        body: JSON.stringify(variables),
      }),
    onSuccess: (_, variables) => {
      toast.success(`Invite sent to ${variables.email}`);
      setEmail('');
      setNote('');
      setShowNote(false);
      setErrorMessage(null);
      setShowResendOption(false);
      queryClient.invalidateQueries({ queryKey: ['room-invites', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room-members', roomId] });
    },
    onError: (err: any) => {
      const code = err?.code || '';
      const msg = err?.message || '';

      if (code === 'ALREADY_MEMBER' || msg.toLowerCase().includes('already a teammate') || msg.toLowerCase().includes('already a member')) {
        setErrorMessage('This user is already a member of this room.');
        setShowResendOption(false);
      } else if (code === 'INVITE_ALREADY_PENDING' || msg.toLowerCase().includes('already pending')) {
        setErrorMessage('An invite is already pending for this email.');
        setShowResendOption(true);
      } else if (code === 'LIMIT_REACHED' || msg.toLowerCase().includes('limit reached')) {
        setErrorMessage('Maximum pending invites reached (10 per room).');
        setShowResendOption(false);
      } else if (code === 'CAP_EXCEEDED' || msg.toLowerCase().includes('capacity') || msg.toLowerCase().includes('cap')) {
        setErrorMessage('This room has reached its member limit.');
        setShowResendOption(false);
      } else if (code === 'MAIL_DISABLED' || msg.toLowerCase().includes('mail') || msg.toLowerCase().includes('smtp') || err?.status === 503) {
        setErrorMessage("Email isn't set up yet. Share the room code instead.");
        setShowResendOption(false);
      } else if (err?.status === 429 || code === 'RATE_LIMIT_EXCEEDED') {
        setErrorMessage('Rate limit reached. Please wait before sending another invite.');
        setShowResendOption(false);
      } else {
        setErrorMessage(msg || 'Failed to send invite.');
        setShowResendOption(false);
      }
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setShowResendOption(false);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setErrorMessage('Please enter an email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (trimmed.length > 254) {
      setErrorMessage('Email address is too long (max 254 characters).');
      return;
    }

    sendInviteMutation.mutate({
      email: trimmed,
      note: note.trim() ? note.trim().slice(0, 140) : null,
    });
  };

  const handleRegenerateCode = async () => {
    setIsRegenerating(true);
    try {
      const res = await apiFetch<{ joinCode: string }>(
        `/api/v1/rooms/${roomId}/join-code/regenerate`,
        { method: 'POST' }
      );
      setJoinCode(res.joinCode);
      onCodeRegenerated?.(res.joinCode);
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
      toast.success('Room code regenerated');
      setShowRegenConfirm(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to regenerate code');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[480px] p-6 rounded-2xl bg-surface border border-border shadow-2xl">
          <DialogHeader className="space-y-1 text-left pb-2">
            <DialogTitle className="text-xl font-medium tracking-tight text-foreground">
              Invite to room
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Bring teammates into this room via email or the shareable join code.
            </DialogDescription>
          </DialogHeader>

          {/* Segmented Control */}
          <div className="flex rounded-lg bg-muted/60 p-1 mb-4 border border-border/40">
            <button
              type="button"
              onClick={() => {
                setTab('email');
                setErrorMessage(null);
              }}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer",
                tab === 'email'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('code');
                setErrorMessage(null);
              }}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer",
                tab === 'code'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Room code
            </button>
          </div>

          {/* Tab 1: Email */}
          {tab === 'email' && (
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label htmlFor="invite-email" className="block text-xs font-medium text-foreground mb-1.5">
                  Email address
                </label>
                <input
                  id="invite-email"
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="name@example.com"
                  disabled={sendInviteMutation.isPending}
                  className="w-full h-10 px-3.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                />
              </div>

              {/* Add a note toggle */}
              <div>
                {!showNote ? (
                  <button
                    type="button"
                    onClick={() => setShowNote(true)}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Add a note
                  </button>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor="invite-note" className="text-xs font-medium text-foreground">
                        Note (optional)
                      </label>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {note.length}/140
                      </span>
                    </div>
                    <textarea
                      id="invite-note"
                      rows={2}
                      maxLength={140}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add context for this teammate..."
                      className="w-full p-2.5 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground resize-none transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Inline Error Box */}
              {errorMessage && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">
                    <span>{errorMessage}</span>
                    {showResendOption && (
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage(null);
                          setShowResendOption(false);
                          queryClient.invalidateQueries({ queryKey: ['room-invites', roomId] });
                          toast.info('Check pending invites list below to resend');
                        }}
                        className="ml-2 font-semibold underline underline-offset-2 hover:text-destructive/80 cursor-pointer"
                      >
                        View pending invites
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={sendInviteMutation.isPending || !email.trim()}
                  className="h-9 px-4 text-xs font-semibold gap-2"
                >
                  {sendInviteMutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
                  Send invite
                </Button>
              </div>
            </form>
          )}

          {/* Tab 2: Room Code */}
          {tab === 'code' && (
            <div className="space-y-4 text-center py-2">
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                <div
                  className="font-mono text-3xl font-bold tracking-widest text-foreground select-all py-2"
                  style={{ fontFamily: 'var(--font-mono, monospace)' }}
                >
                  {joinCode || '------'}
                </div>
                <div className="flex justify-center mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyCode}
                    className="h-8 px-4 text-xs font-medium gap-1.5 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="size-3.5 text-emerald-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5 text-muted-foreground" />
                        Copy code
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Anyone with this code can join until the room is full.
              </p>

              {isLeader && (
                <div className="pt-2 border-t border-border/50 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowRegenConfirm(true)}
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="size-3" />
                    Regenerate code
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Regenerate Dialog */}
      <ConfirmDialog
        open={showRegenConfirm}
        onOpenChange={setShowRegenConfirm}
        title="Regenerate join code"
        description="The previous join code will stop working immediately. Teammates who already joined will stay in the room."
        confirmLabel="Regenerate"
        variant="primary"
        isLoading={isRegenerating}
        onConfirm={handleRegenerateCode}
      />
    </>
  );
}
