import React from 'react';
import { InviteCodeDialog } from './components/InviteCodeDialog';
import { InviteIcon } from '@/components/icons';

interface InvitePopoverProps {
  roomId: string;
  trigger?: React.ReactNode;
}

export function InvitePopover({ roomId, trigger }: InvitePopoverProps) {
  const defaultTrigger = (
    <button
      type="button"
      className="group btn-icon size-7 rounded-md flex items-center justify-center text-ink-2 hover:bg-hover hover:text-ink transition-colors cursor-pointer"
      aria-label="Invite teammates"
      title="Invite teammates"
    >
      <InviteIcon size={16} />
    </button>
  );

  return (
    <InviteCodeDialog
      roomId={roomId}
      trigger={trigger || defaultTrigger}
    />
  );
}
