import { useOverlay } from '@/app/providers/overlay-store';
import { InviteCodeDialog } from '@/features/room/components/InviteCodeDialog';

export function InviteDialogOverlay() {
  const { isOpen, close, data } = useOverlay<{ roomId?: string }>('invite-dialog');
  const roomId = data?.roomId ?? '';

  if (!roomId) return null;

  return (
    <InviteCodeDialog
      roomId={roomId}
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    />
  );
}
