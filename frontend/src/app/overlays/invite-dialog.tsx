/**
 * Invite Dialog — wired to real POST /api/v1/rooms/{roomId}/invites
 * Source: PRD §4.7
 *
 * Opens via useOverlay('invite-dialog').open({ roomId })
 * Generates a real invite token and shows a copyable link.
 */
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useOverlay } from '@/app/providers/overlay-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Copy, Check, Loader2 } from 'lucide-react';
import { roomApi } from '@/features/room/api';
import { invitePath } from '@/shared/constants/routes';

export function InviteDialogOverlay() {
  const { isOpen, close, data } = useOverlay<{ roomId?: string }>('invite-dialog');
  const roomId = data?.roomId ?? '';
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { mutate: generateInvite, isPending, error } = useMutation({
    mutationFn: () => roomApi.createInvite(roomId),
    onSuccess: (res) => {
      const base = `${window.location.origin}${invitePath(res.token)}`;
      setInviteLink(base);
    },
  });

  const handleCopy = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClose = () => {
    setInviteLink(null);
    setCopied(false);
    close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            Invite teammates
          </DialogTitle>
          <DialogDescription>
            Generate a link anyone can use to join this room.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex flex-col gap-4">
          {!inviteLink ? (
            <Button
              onClick={() => generateInvite()}
              disabled={isPending || !roomId}
            >
              {isPending ? (
                <><Loader2 className="size-4 mr-2 animate-spin" />Generating…</>
              ) : (
                'Generate invite link'
              )}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly className="text-xs text-ink-muted" />
              <Button variant="outline" size="icon" onClick={handleCopy} aria-label="Copy link">
                {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
              </Button>
            </div>
          )}
          {error && (
            <p className="text-caption text-danger-text">
              Failed to generate invite link. Please try again.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
