import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useOverlay } from '@/app/providers/overlay-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KeyRound, Loader2, Check, ArrowRight, ShieldAlert } from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { apiFetch } from '@/design/api';
import { playSound } from '@/shared/sound/sound-effects';

function formatCode(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  if (clean.length > 4) {
    return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  }
  return clean;
}

function unformatCode(formatted: string): string {
  return formatted.replace(/[^A-Z0-9]/g, '').toUpperCase();
}

export function JoinCodeDialogOverlay() {
  const { isOpen, close } = useOverlay('join-code-dialog');
  const navigate = useNavigate();

  const [rawInput, setRawInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmedRoom, setConfirmedRoom] = useState<{ id: string; name: string; leader?: any } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setRawInput('');
      setError(null);
      setConfirmedRoom(null);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const joinMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiFetch<{ roomId: string; roomName?: string }>('/api/v1/rooms/join', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
    },
    onSuccess: async (result) => {
      if (result?.roomId) {
        playSound('success');
        // Fetch room detail to show leader avatar and confirm step before final entry
        try {
          const detail = await apiFetch<any>(`/api/v1/rooms/${result.roomId}/overview`);
          setConfirmedRoom({
            id: result.roomId,
            name: detail.name || detail.room?.name || 'Hackathon Room',
            leader: detail.leader || detail.team?.find((m: any) => m.role === 'LEADER') || { username: 'leader', name: 'Team Leader' },
          });
        } catch {
          // If overview fails or permissions check, go straight to room
          close();
          navigate(`/app/room/${result.roomId}/overview`);
        }
      }
    },
    onError: (err: any) => {
      playSound('error');
      setError(err?.message || 'Invalid join code. Please check with your leader or try again.');
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCode(e.target.value);
    setRawInput(formatted);
    setError(null);

    const clean = unformatCode(formatted);
    if (clean.length === 8 && !joinMutation.isPending && !confirmedRoom) {
      joinMutation.mutate(clean);
    }
  };

  const handleConfirmEnter = () => {
    if (confirmedRoom) {
      close();
      navigate(`/app/room/${confirmedRoom.id}/overview`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(openState) => { if (!openState) close(); }}>
      <DialogContent className="sm:max-w-[420px] rounded-[22px] bg-card border border-border p-6 text-center text-ink shadow-xl font-[var(--font-inter)]">
        <DialogHeader className="flex flex-col items-center mb-4">
          <div className="size-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-2.5">
            <KeyRound className="size-5" />
          </div>
          <DialogTitle className="text-lg font-bold text-ink">
            {confirmedRoom ? 'Join Room' : 'Enter room code'}
          </DialogTitle>
          <DialogDescription className="text-xs text-ink-2">
            {confirmedRoom
              ? 'You have been verified. Confirm to enter this team workspace.'
              : 'Enter the 8-character code provided by your hackathon team leader.'}
          </DialogDescription>
        </DialogHeader>

        {!confirmedRoom ? (
          <div className="flex flex-col items-center gap-5 py-2">
            <div className="w-full">
              <input
                ref={inputRef}
                type="text"
                placeholder="XXXX-XXXX"
                value={rawInput}
                onChange={handleInputChange}
                disabled={joinMutation.isPending}
                maxLength={9} // 8 chars + 1 hyphen
                className="w-full h-14 text-center text-2xl font-mono font-bold tracking-widest uppercase rounded-[14px] border-2 bg-surface text-ink transition-all outline-none border-border focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                aria-label="8-character room code"
              />
              <p className="text-[11px] text-ink-3 mt-2">
                Auto-submits when 8 characters are entered
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
                <ShieldAlert className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {joinMutation.isPending && (
              <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                <Loader2 className="size-4 animate-spin" />
                <span>Verifying room code…</span>
              </div>
            )}

            <div className="flex w-full items-center justify-end gap-2 pt-2 border-t border-border/50">
              <Button variant="outline" size="sm" onClick={close} disabled={joinMutation.isPending}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => joinMutation.mutate(unformatCode(rawInput))}
                disabled={joinMutation.isPending || unformatCode(rawInput).length < 8}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                Join
              </Button>
            </div>
          </div>
        ) : (
          /* Confirm step showing room name and leader avatar */
          <div className="flex flex-col items-center gap-5 py-2 animate-in zoom-in-95 duration-200">
            <div className="w-full p-4 rounded-2xl bg-surface border border-border flex flex-col items-center text-center gap-3">
              <div className="ring-4 ring-border rounded-full">
                <UserAvatar user={confirmedRoom.leader} size={48} />
              </div>
              <div>
                <h4 className="text-base font-bold text-ink">{confirmedRoom.name}</h4>
                <p className="text-xs text-ink-2 mt-0.5">
                  Led by <span className="font-semibold">{confirmedRoom.leader?.displayName || confirmedRoom.leader?.name || confirmedRoom.leader?.username || '@leader'}</span>
                </p>
              </div>
            </div>

            <div className="flex w-full items-center justify-between gap-2 pt-2 border-t border-border/50">
              <Button variant="outline" size="sm" onClick={() => setConfirmedRoom(null)}>
                Change code
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmEnter}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium gap-1.5"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
