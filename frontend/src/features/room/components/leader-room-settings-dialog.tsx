import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button, StatusDot, ConfirmDialog } from '@/design';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { roomService } from '@/services/roomService';
import type { Room, RoomMember } from '@/services/types';
import { toast } from 'sonner';
import {
  Settings,
  KeyRound,
  Users,
  AlertTriangle,
  RefreshCw,
  Ban,
  Trash2,
  Crown,
  Save,
} from 'lucide-react';

export interface LeaderRoomSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  onUpdated?: () => void;
  onArchived?: () => void;
}

export function LeaderRoomSettingsDialog({
  open,
  onOpenChange,
  roomId,
  onUpdated,
  onArchived,
}: LeaderRoomSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'access' | 'team' | 'danger'>('details');
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [joinCode, setJoinCode] = useState<string>('');

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationHours, setDurationHours] = useState<number>(36);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Confirmation modals state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: React.ReactNode;
    confirmLabel?: string;
    variant?: 'danger' | 'primary';
    action?: () => Promise<void>;
  }>({
    open: false,
    title: '',
    description: '',
  });
  const [isConfirming, setIsConfirming] = useState(false);

  const loadData = async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const [r, m] = await Promise.all([
        roomService.getRoom(roomId),
        roomService.getMembers(roomId),
      ]);
      if (r) {
        setRoom(r);
        setName(r.name || '');
        setDescription(r.description || '');
        setDurationHours(r.durationHours || 36);
        setJoinCode((r as any).joinCode || '');
      }
      setMembers(m);
    } catch (err: any) {
      toast.error('Failed to load room settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
      setFieldErrors({});
    }
  }, [open, roomId]);

  // Handle save details
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setIsSavingDetails(true);

    try {
      await roomService.updateRoom(roomId, {
        name,
        description,
        durationHours: Number(durationHours),
      } as any);

      toast.success('Room settings updated');
      onUpdated?.();
    } catch (err: any) {
      if (err?.details && typeof err.details === 'object') {
        setFieldErrors(err.details);
      } else {
        toast.error(err?.message || 'Failed to update room');
      }
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Regenerate join code
  const promptRegenerateCode = () => {
    setConfirmModal({
      open: true,
      title: 'Regenerate Room Code',
      description: 'The old code will stop working immediately. Teammates must use the new code to join.',
      confirmLabel: 'Regenerate',
      variant: 'primary',
      action: async () => {
        const res = await roomService.regenerateJoinCode(roomId);
        setJoinCode(res.joinCode);
        toast.success(`New code generated: ${res.joinCode}`);
        onUpdated?.();
      },
    });
  };

  // Revoke join code
  const promptRevokeCode = () => {
    setConfirmModal({
      open: true,
      title: 'Revoke Room Code',
      description: 'No new members will be able to join using a room code until you regenerate a new one.',
      confirmLabel: 'Revoke Code',
      variant: 'danger',
      action: async () => {
        await roomService.revokeJoinCode(roomId);
        setJoinCode('');
        toast.success('Room code revoked');
        onUpdated?.();
      },
    });
  };

  // Remove member
  const promptRemoveMember = (member: RoomMember) => {
    setConfirmModal({
      open: true,
      title: `Remove ${member.displayName}`,
      description: `Are you sure you want to remove ${member.displayName} from the room? Their assigned tasks will be unassigned.`,
      confirmLabel: 'Remove Member',
      variant: 'danger',
      action: async () => {
        await roomService.removeMember(roomId, member.id);
        toast.success(`${member.displayName} removed`);
        loadData();
        onUpdated?.();
      },
    });
  };

  // Transfer leadership
  const promptTransferLeadership = (member: RoomMember) => {
    setConfirmModal({
      open: true,
      title: `Make ${member.displayName} Leader`,
      description: `Transfer room leadership to ${member.displayName}? You will remain a regular team member.`,
      confirmLabel: 'Transfer Leadership',
      variant: 'primary',
      action: async () => {
        await roomService.transferLeadership(roomId, member.id);
        toast.success(`${member.displayName} is now the room leader`);
        onOpenChange(false);
        onUpdated?.();
      },
    });
  };

  // Archive room
  const promptArchiveRoom = () => {
    setConfirmModal({
      open: true,
      title: 'Archive Room',
      description: `Are you sure you want to archive "${room?.name || 'this room'}"? The room will become read-only and removed from active dashboards.`,
      confirmLabel: 'Archive Room',
      variant: 'danger',
      action: async () => {
        await roomService.archiveRoom(roomId);
        toast.success('Room archived');
        onOpenChange(false);
        onArchived?.();
      },
    });
  };

  const executeConfirmAction = async () => {
    if (!confirmModal.action) return;
    setIsConfirming(true);
    try {
      await confirmModal.action();
      setConfirmModal((prev) => ({ ...prev, open: false }));
    } catch (err: any) {
      toast.error(err?.message || 'Operation failed');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl p-6 rounded-[16px] bg-card border border-border shadow-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="space-y-1 text-left shrink-0 pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Settings className="size-4" />
              </span>
              <DialogTitle className="text-base font-semibold text-foreground">
                Leader Settings
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure room details, access controls, team rosters, and lifecycle.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <StatusDot variant="neutral" pulse />
              Loading room settings...
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
              <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
                <TabsList className="w-full grid grid-cols-4 mb-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="access">Access</TabsTrigger>
                  <TabsTrigger value="team">Roster</TabsTrigger>
                  <TabsTrigger value="danger" className="text-rose-600 dark:text-rose-400">Danger</TabsTrigger>
                </TabsList>

                {/* 1. ROOM DETAILS TAB */}
                <TabsContent value="details">
                  <form onSubmit={handleSaveDetails} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Room Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        minLength={3}
                        maxLength={60}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      {fieldErrors.name && (
                        <p className="text-[11px] text-rose-500">{fieldErrors.name}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        maxLength={200}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                      {fieldErrors.description && (
                        <p className="text-[11px] text-rose-500">{fieldErrors.description}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Duration (Hours)</label>
                      <input
                        type="number"
                        min={1}
                        max={168}
                        value={durationHours}
                        onChange={(e) => setDurationHours(Number(e.target.value))}
                        className="w-32 px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      {fieldErrors.durationHours && (
                        <p className="text-[11px] text-rose-500">{fieldErrors.durationHours}</p>
                      )}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        isLoading={isSavingDetails}
                        leftIcon={<Save className="size-3.5" />}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                {/* 2. ACCESS TAB */}
                <TabsContent value="access">
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-border bg-muted/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <KeyRound className="size-4 text-primary" />
                          <span className="text-xs font-semibold text-foreground">Join Code</span>
                        </div>
                        <span className="font-mono text-sm font-bold tracking-wider px-2.5 py-1 rounded-md bg-background border border-border text-foreground">
                          {joinCode || 'REVOKED'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Teammates can quickly join this room by entering this 8-character code on the dashboard.
                      </p>

                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={promptRegenerateCode}
                          leftIcon={<RefreshCw className="size-3.5" />}
                        >
                          Regenerate Code
                        </Button>
                        {joinCode && (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={promptRevokeCode}
                            leftIcon={<Ban className="size-3.5" />}
                          >
                            Revoke Code
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* 3. ROSTER / TEAM TAB */}
                <TabsContent value="team">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <Users className="size-3.5" /> Room Roster ({members.length})
                      </span>
                    </div>

                    <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-background">
                      {members.map((m) => {
                        const isCallerOrLeader = m.role === 'leader';
                        return (
                          <div
                            key={m.id}
                            className="p-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className="size-7 rounded-full flex items-center justify-center text-xs font-bold bg-inverse text-on-inverse shrink-0"
                              >
                                {m.initials}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">
                                  {m.displayName}
                                </p>
                                <span className="text-[10px] text-muted-foreground uppercase font-mono">
                                  {m.role}
                                </span>
                              </div>
                            </div>

                            {!isCallerOrLeader && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  className="h-7 text-[11px]"
                                  onClick={() => promptTransferLeadership(m)}
                                  title="Transfer room leadership to this member"
                                  leftIcon={<Crown className="size-3 text-amber-500" />}
                                >
                                  Make Leader
                                </Button>
                                <Button
                                  type="button"
                                  variant="danger"
                                  size="sm"
                                  className="h-7 px-2"
                                  onClick={() => promptRemoveMember(m)}
                                  title="Remove member from room"
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                {/* 4. DANGER ZONE TAB */}
                <TabsContent value="danger">
                  <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 space-y-3">
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                      <AlertTriangle className="size-4 shrink-0" />
                      <h4 className="text-xs font-semibold">Archive Room</h4>
                    </div>
                    <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                      Archiving closes all active sessions and freezes editing. Existing files and exported records remain accessible to admins.
                    </p>
                    <div className="pt-1">
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={promptArchiveRoom}
                        leftIcon={<Trash2 className="size-3.5" />}
                      >
                        Archive this room
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmModal.open}
        onOpenChange={(op) => setConfirmModal((prev) => ({ ...prev, open: op }))}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmLabel={confirmModal.confirmLabel}
        variant={confirmModal.variant}
        isLoading={isConfirming}
        onConfirm={executeConfirmAction}
      />
    </>
  );
}
