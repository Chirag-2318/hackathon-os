import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button, StatusDot } from '@/design';
import { roomService } from '@/services/roomService';
import type { RoomMember } from '@/services/types';
import { toast } from 'sonner';
import { AlertTriangle, Crown, UserCheck } from 'lucide-react';

export interface LeaveRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: {
    id: string;
    name: string;
    isLeader?: boolean;
    myRole?: string;
    memberCount?: number;
  };
  onSuccess?: () => void;
}

export function LeaveRoomDialog({
  open,
  onOpenChange,
  room,
  onSuccess,
}: LeaveRoomDialogProps) {
  const navigate = useNavigate();
  const isLeader = Boolean(room.isLeader || (room.myRole || '').toUpperCase() === 'LEADER');
  
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [selectedSuccessorId, setSelectedSuccessorId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedSuccessorId('');
      setErrorNotice(null);
      setIsSubmitting(false);
      return;
    }

    if (isLeader) {
      setLoadingMembers(true);
      roomService.getMembers(room.id)
        .then((list) => {
          setMembers(list);
          const eligible = list.filter((m) => m.role !== 'leader');
          if (eligible.length > 0) {
            setSelectedSuccessorId(eligible[0].id);
          }
        })
        .catch((err) => {
          console.error('Failed to load members for leader check:', err);
        })
        .finally(() => {
          setLoadingMembers(false);
        });
    }
  }, [open, isLeader, room.id]);

  const otherMembers = members.filter((m) => m.role !== 'leader');
  const isSoleMember = isLeader && !loadingMembers && otherMembers.length === 0;

  const handleConfirmLeave = async () => {
    setIsSubmitting(true);
    setErrorNotice(null);

    try {
      // 1. If leader with other teammates, transfer leadership first
      if (isLeader && otherMembers.length > 0) {
        if (!selectedSuccessorId) {
          setErrorNotice('Please select a teammate to become the new leader.');
          setIsSubmitting(false);
          return;
        }
        await roomService.transferLeadership(room.id, selectedSuccessorId);
      }

      // 2. Perform leave
      await roomService.leaveRoom(room.id);
      
      toast.success(isSoleMember ? `Room "${room.name}" archived.` : `You left "${room.name}".`);
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/app/rooms');
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to leave room. Please try again.';
      setErrorNotice(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-[16px] bg-card border border-border shadow-xl">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="size-4" />
            </span>
            <DialogTitle className="text-base font-semibold text-foreground">
              {isSoleMember ? 'Archive and Leave Room' : 'Leave Room'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {room.name ? `You are about to leave "${room.name}".` : 'You are about to leave this room.'}
          </DialogDescription>
        </DialogHeader>

        <div className="my-3 space-y-3">
          {isLeader ? (
            loadingMembers ? (
              <div className="py-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <StatusDot variant="neutral" pulse />
                Checking team members...
              </div>
            ) : isSoleMember ? (
              <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/10 text-xs text-rose-900 dark:text-rose-200">
                <p className="font-medium mb-1">Sole Member Warning</p>
                <p className="text-[11px] leading-relaxed">
                  You are currently the only member of this room. Leaving will automatically archive the room and all its workspaces.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <Crown className="size-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    You are the room leader. You must hand over room leadership to another teammate before you can step down.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
                    Select New Leader
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg border border-border p-1">
                    {otherMembers.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => setSelectedSuccessorId(member.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-md text-xs transition-colors ${
                          selectedSuccessorId === member.id
                            ? 'bg-primary/10 border border-primary/30 text-foreground font-medium'
                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="size-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                            style={{ backgroundColor: member.avatarColor || '#6366f1' }}
                          >
                            {member.initials}
                          </span>
                          <span>{member.displayName}</span>
                        </div>
                        {selectedSuccessorId === member.id && (
                          <UserCheck className="size-3.5 text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed">
              You will lose access to team boards, docs, and real-time updates. You can re-join later if you have the room code.
            </p>
          )}

          {errorNotice && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
              {errorNotice}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            isLoading={isSubmitting}
            onClick={handleConfirmLeave}
          >
            {isSoleMember ? 'Archive & Leave' : isLeader ? 'Transfer & Leave' : 'Leave Room'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
