import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Crown, MoreHorizontal, UserPlus, Share2, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/design/api';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/design/components/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InviteDialog } from './components/invite-dialog';
import { CodePopover } from './components/code-popover';
import { ProfileEditPopover, ROLE_TAG_OPTIONS } from './components/profile-edit-popover';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { cn } from '@/lib/utils';

interface MemberItemDto {
  userId: string;
  name?: string;
  displayName?: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
  avatarType?: string;
  avatarPreset?: number;
  role?: string;
  skills?: string[];
  roleTags?: string[];
  status?: string;
  joinedAt?: string;
  lastSeenAt?: string;
  isLeader?: boolean;
  isMe?: boolean;
}

interface EmailInviteItemDto {
  id: string;
  email: string;
  invitedByName?: string;
  invitedById?: string;
  createdAt: string;
  expiresAt: string;
  sendCount: number;
  note?: string;
  status: string;
}

interface RoomDetailDto {
  id: string;
  name: string;
  joinCode?: string;
  isLeader?: boolean;
  memberCount?: number;
}

const ALL_ROLES = [
  'Frontend',
  'Backend',
  'ML / AI',
  'Design',
  'Presenter',
  'Domain expert',
  'QA / Demo operator',
] as const;

function formatRelativeTime(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const now = Date.now();
  const time = new Date(dateInput).getTime();
  const diff = now - time;
  const mins = Math.floor(Math.abs(diff) / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (diff >= 0) {
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  } else {
    if (mins < 1) return 'in <1m';
    if (mins < 60) return `in ${mins}m`;
    if (hours < 24) return `in ${hours}h`;
    return `in ${days}d`;
  }
}

function isRoleCovered(role: string, memberSkills: string[]): boolean {
  const normRole = role.toLowerCase().replace(/[^a-z0-9]/g, '');
  return memberSkills.some((s) => {
    const normSkill = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normSkill === normRole) return true;
    if (normRole.includes('frontend') && normSkill.includes('frontend')) return true;
    if (normRole.includes('backend') && normSkill.includes('backend')) return true;
    if (normRole.includes('mlai') && (normSkill.includes('ml') || normSkill.includes('ai'))) return true;
    if (normRole.includes('design') && normSkill.includes('design')) return true;
    if (normRole.includes('presenter') && (normSkill.includes('present') || normSkill.includes('pitch'))) return true;
    if (normRole.includes('domain') && normSkill.includes('domain')) return true;
    if (normRole.includes('qademo') && (normSkill.includes('qa') || normSkill.includes('demo'))) return true;
    return false;
  });
}

export function TeamPage() {
  const { roomId = '', id = '' } = useParams<{ roomId?: string; id?: string }>();
  const activeRoomId = roomId || id;
  const queryClient = useQueryClient();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [profileModalOpen, setShowProfileModal] = useState(false);

  // Leadership & Removal confirmation states
  const [targetMakeLeader, setTargetMakeLeader] = useState<MemberItemDto | null>(null);
  const [targetRemove, setTargetRemove] = useState<MemberItemDto | null>(null);
  const [targetRevokeInvite, setTargetRevokeInvite] = useState<EmailInviteItemDto | null>(null);

  const { data: currentUser } = useCurrentUser();

  // 1. Fetch Room Details
  const { data: room } = useQuery<RoomDetailDto>({
    queryKey: ['room', activeRoomId],
    queryFn: () => apiFetch<RoomDetailDto>(`/api/v1/rooms/${activeRoomId}`),
    enabled: Boolean(activeRoomId),
  });

  // 2. Fetch Members
  const {
    data: membersData,
    isLoading: isMembersLoading,
    isError: isMembersError,
    refetch: refetchMembers,
  } = useQuery<{ items: MemberItemDto[] }>({
    queryKey: ['room-members', activeRoomId],
    queryFn: () => apiFetch<{ items: MemberItemDto[] }>(`/api/v1/rooms/${activeRoomId}/members`),
    enabled: Boolean(activeRoomId),
  });

  // 3. Fetch Online Presence
  const { data: onlineMembers = [] } = useQuery<{ id: string }[]>({
    queryKey: ['room-presence', activeRoomId],
    queryFn: async () => {
      const res = await apiFetch<any>(`/api/v1/rooms/${activeRoomId}/presence`);
      // Normalize: API may return an array directly, or a wrapped { items: [...] } shape
      if (Array.isArray(res)) return res as { id: string }[];
      if (Array.isArray(res?.items)) return res.items as { id: string }[];
      if (Array.isArray(res?.members)) return res.members as { id: string }[];
      return [];
    },
    enabled: Boolean(activeRoomId),
    refetchInterval: 15000,
  });

  // 4. Fetch Invites (leader only)
  const isLeader = room?.isLeader ?? false;
  const { data: invites = [] } = useQuery<EmailInviteItemDto[]>({
    queryKey: ['room-invites', activeRoomId],
    queryFn: () => apiFetch<EmailInviteItemDto[]>(`/api/v1/rooms/${activeRoomId}/invites`),
    enabled: Boolean(activeRoomId) && isLeader,
  });

  // Leadership transfer mutation
  const transferLeadershipMutation = useMutation({
    mutationFn: (userId: string) =>
      apiFetch(`/api/v1/rooms/${activeRoomId}/members/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: 'LEADER' }),
      }),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['room', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['room-members', activeRoomId] });
      const target = membersData?.items?.find((m) => m.userId === userId);
      toast.success(`Transferred leadership to @${target?.username || target?.name || 'teammate'}`);
      setTargetMakeLeader(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to transfer leadership');
    },
  });

  // Member removal mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) =>
      apiFetch(`/api/v1/rooms/${activeRoomId}/members/${userId}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['room-members', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['room', activeRoomId] });
      const target = membersData?.items?.find((m) => m.userId === userId);
      toast.success(`Removed @${target?.username || target?.name || 'teammate'} from the room`);
      setTargetRemove(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to remove member');
    },
  });

  // Resend invite mutation
  const resendInviteMutation = useMutation({
    mutationFn: (inviteId: string) =>
      apiFetch(`/api/v1/rooms/${activeRoomId}/invites/${inviteId}/resend`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-invites', activeRoomId] });
      toast.success('Invite resent');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to resend invite');
    },
  });

  // Revoke invite mutation
  const revokeInviteMutation = useMutation({
    mutationFn: (inviteId: string) =>
      apiFetch(`/api/v1/rooms/${activeRoomId}/invites/${inviteId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-invites', activeRoomId] });
      toast.success('Invite revoked');
      setTargetRevokeInvite(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to revoke invite');
    },
  });

  const members = membersData?.items || [];
  const roomCap = 6;
  const filledSeats = members.length;
  const remainingSeats = Math.max(0, roomCap - filledSeats);

  // Sort: Leader first, then by join date ascending
  const sortedMembers = [...members].sort((a, b) => {
    if (a.isLeader && !b.isLeader) return -1;
    if (!a.isLeader && b.isLeader) return 1;
    const timeA = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
    const timeB = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
    return timeA - timeB;
  });

  // Skill coverage computation
  const allMemberSkills = members.flatMap((m) => [
    ...(Array.isArray(m.skills) ? m.skills : []),
    ...(Array.isArray(m.roleTags) ? m.roleTags : []),
    m.role || '',
  ]);

  const coveredRoles = ALL_ROLES.filter((role) => isRoleCovered(role, allMemberSkills));
  const missingRoles = ALL_ROLES.filter((role) => !coveredRoles.includes(role));

  const skillSummary =
    missingRoles.length === 0
      ? 'All 7 roles covered.'
      : missingRoles.length === 1
      ? `Covered ${coveredRoles.length} of 7. No one on ${missingRoles[0]} yet.`
      : `Covered ${coveredRoles.length} of 7. No one on ${missingRoles.slice(0, -1).join(', ')} or ${
          missingRoles[missingRoles.length - 1]
        } yet.`;

  // Render open seats count (max 5 dashed rows, then +N more)
  const openSeatRowsCount = Math.min(remainingSeats, 5);
  const extraOpenSeats = remainingSeats - openSeatRowsCount;

  // Open appropriate invite trigger
  const handleOpenInvite = () => {
    if (isLeader) {
      setInviteModalOpen(true);
    } else {
      setCodeModalOpen(true);
    }
  };

  return (
    <div className="w-full max-w-[880px] mx-auto p-6 sm:p-8 font-sans pb-24">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <h1
            className="text-3xl sm:text-4xl font-normal tracking-tight text-foreground leading-none"
            style={{ fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)' }}
          >
            Team
          </h1>
          <p
            className="text-xs font-mono text-muted-foreground mt-2 tracking-wide"
            style={{ fontFamily: 'var(--font-mono, monospace)' }}
          >
            {filledSeats} of {roomCap} seats filled
          </p>
        </div>

        <div>
          {isLeader ? (
            <Button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              className="h-9 px-4 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
            >
              <UserPlus className="size-3.5" />
              Invite
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCodeModalOpen(true)}
              className="h-9 px-4 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <Share2 className="size-3.5" />
              Share code
            </Button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isMembersLoading && (
        <div className="divide-y divide-border/60 py-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-14 flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-muted/60 animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-24 bg-muted/60 rounded animate-pulse" />
                  <div className="h-2.5 w-32 bg-muted/40 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-3 w-16 bg-muted/40 rounded animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isMembersError && !isMembersLoading && (
        <div className="py-12 text-center flex flex-col items-center gap-3">
          <AlertCircle className="size-6 text-destructive" />
          <p className="text-sm text-muted-foreground">Unable to load team members.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchMembers()}
            className="text-xs font-medium gap-1.5 cursor-pointer"
          >
            <RefreshCw className="size-3" />
            Retry
          </Button>
        </div>
      )}

      {/* Content */}
      {!isMembersLoading && !isMembersError && (
        <div className="space-y-8 mt-2">
          {/* 2. Members List */}
          <div className="divide-y divide-border/60">
            {sortedMembers.map((m) => {
              const isOnline = onlineMembers.some((o) => o.id === m.userId);
              const isMe = m.isMe || (currentUser && currentUser.id === m.userId);
              const roleTagsList = Array.isArray(m.roleTags) && m.roleTags.length > 0
                ? m.roleTags
                : Array.isArray(m.skills) && m.skills.length > 0
                ? m.skills
                : [];
              const roleTagsText = roleTagsList.join(' · ');

              return (
                <div
                  key={m.userId}
                  className="min-h-[56px] py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 hover:bg-muted/20 transition-colors rounded-lg"
                >
                  {/* Left: Avatar, Username, Display Name, Role Tags, Leader Badge */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative shrink-0">
                      <UserAvatar user={m} size={36} />
                      {isOnline && (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background"
                          title="Online"
                        />
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="text-sm font-medium text-foreground truncate">
                          @{m.username || m.name || 'member'}
                        </span>
                        {m.displayName && m.displayName !== m.username && (
                          <span className="text-xs text-muted-foreground truncate">
                            {m.displayName}
                          </span>
                        )}
                        {m.isLeader && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                            <Crown className="size-3" /> Leader
                          </span>
                        )}
                      </div>

                      {roleTagsText && (
                        <span className="text-xs text-muted-foreground truncate mt-0.5">
                          {roleTagsText}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Joined Date, You / Edit Profile, or Leader Actions */}
                  <div className="flex items-center gap-3 sm:ml-auto self-end sm:self-center shrink-0">
                    <span
                      className="text-xs font-mono text-muted-foreground"
                      style={{ fontFamily: 'var(--font-mono, monospace)' }}
                    >
                      Joined {formatRelativeTime(m.joinedAt)}
                    </span>

                    {/* Own row actions */}
                    {isMe && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                          You
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowProfileModal(true)}
                          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors cursor-pointer min-h-[44px] inline-flex items-center"
                        >
                          Edit profile
                        </button>
                      </div>
                    )}

                    {/* Leader menu on other rows */}
                    {isLeader && !m.isLeader && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="size-8 rounded-md hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer min-h-[44px] min-w-[44px]"
                            aria-label={`Actions for ${m.username || m.name}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => setTargetMakeLeader(m)}>
                            Make leader
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setTargetRemove(m)}
                            className="text-destructive focus:text-destructive"
                          >
                            Remove from room
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 3. Open Seats (Dashed Hairline Rows) */}
            {Array.from({ length: openSeatRowsCount }).map((_, idx) => (
              <div
                key={`open-${idx}`}
                className="h-14 flex items-center justify-between px-1 border-b border-dashed border-border/60"
              >
                <span className="text-sm text-muted-foreground font-normal">
                  Open seat
                </span>
                <button
                  type="button"
                  onClick={handleOpenInvite}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors cursor-pointer min-h-[44px] inline-flex items-center"
                >
                  Invite someone
                </button>
              </div>
            ))}

            {/* Extra open seats indicator if cap > 5 */}
            {extraOpenSeats > 0 && (
              <div className="h-12 flex items-center justify-between px-1 border-b border-dashed border-border/60 text-xs font-mono text-muted-foreground">
                <span>+{extraOpenSeats} more seats</span>
                <button
                  type="button"
                  onClick={handleOpenInvite}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 cursor-pointer"
                >
                  Invite someone
                </button>
              </div>
            )}
          </div>

          {/* Empty State when only the leader exists */}
          {members.length === 1 && isLeader && (
            <div className="p-6 rounded-xl border border-dashed border-border text-center space-y-2 bg-muted/20">
              <p className="text-sm text-muted-foreground">Just you so far.</p>
              <Button
                type="button"
                size="sm"
                onClick={() => setInviteModalOpen(true)}
                className="text-xs font-semibold gap-1.5"
              >
                <UserPlus className="size-3.5" />
                Invite
              </Button>
            </div>
          )}

          {/* 5. Skill Coverage Line */}
          <div className="pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground pt-4 border-t border-border/60">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {ALL_ROLES.map((role) => {
                  const covered = coveredRoles.includes(role);
                  return (
                    <span key={role} className="inline-flex items-center gap-1.5">
                      <span
                        className={cn(
                          "size-2 rounded-full shrink-0",
                          covered
                            ? "bg-foreground"
                            : "border border-muted-foreground/60 bg-transparent"
                        )}
                        aria-hidden="true"
                      />
                      <span className={covered ? "text-foreground font-medium" : "text-muted-foreground"}>
                        {role}
                      </span>
                    </span>
                  );
                })}
              </div>

              <span
                className="text-muted-foreground font-mono text-[11px] shrink-0"
                style={{ fontFamily: 'var(--font-mono, monospace)' }}
              >
                {skillSummary}
              </span>
            </div>
          </div>

          {/* 4. Pending Invites (Leader only, hidden when none) */}
          {isLeader && invites.length > 0 && (
            <div className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  Pending Invites
                </h3>
                <span className="text-xs font-mono text-muted-foreground">
                  {invites.length} pending
                </span>
              </div>

              <div className="divide-y divide-border/60 border-t border-border/60">
                {invites.map((inv) => {
                  const isExpired =
                    inv.status === 'EXPIRED' ||
                    new Date(inv.expiresAt).getTime() < Date.now();

                  // 10-minute cooldown calculation from createdAt
                  const lastSent = inv.createdAt ? new Date(inv.createdAt).getTime() : 0;
                  const cooldownSec = Math.max(
                    0,
                    Math.ceil((10 * 60 * 1000 - (Date.now() - lastSent)) / 1000)
                  );
                  const canResend = cooldownSec === 0 && inv.sendCount < 3;

                  return (
                    <div
                      key={inv.id}
                      className={cn(
                        "min-h-[52px] py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1",
                        isExpired && "opacity-60"
                      )}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-foreground truncate">
                          {inv.email}
                        </span>
                        <span
                          className="text-xs font-mono text-muted-foreground"
                          style={{ fontFamily: 'var(--font-mono, monospace)' }}
                        >
                          Invited {formatRelativeTime(inv.createdAt)}, expires {formatRelativeTime(inv.expiresAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                        {isExpired ? (
                          <button
                            type="button"
                            onClick={() => setInviteModalOpen(true)}
                            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors cursor-pointer min-h-[44px] inline-flex items-center"
                          >
                            Invite again
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => resendInviteMutation.mutate(inv.id)}
                              disabled={!canResend || resendInviteMutation.isPending}
                              className={cn(
                                "text-xs underline underline-offset-2 transition-colors min-h-[44px] inline-flex items-center",
                                canResend
                                  ? "text-muted-foreground hover:text-foreground cursor-pointer"
                                  : "text-muted-foreground/40 cursor-not-allowed"
                              )}
                            >
                              {!canResend && cooldownSec > 0
                                ? `Resend in ${Math.ceil(cooldownSec / 60)}m`
                                : 'Resend'}
                            </button>

                            <button
                              type="button"
                              onClick={() => setTargetRevokeInvite(inv)}
                              disabled={revokeInviteMutation.isPending}
                              className="text-xs text-destructive/80 hover:text-destructive underline underline-offset-2 transition-colors cursor-pointer min-h-[44px] inline-flex items-center"
                            >
                              Revoke
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leader: Make Leader ConfirmDialog */}
      <ConfirmDialog
        open={Boolean(targetMakeLeader)}
        onOpenChange={(open) => !open && setTargetMakeLeader(null)}
        title="Transfer leadership"
        description={`Are you sure you want to transfer leadership to @${
          targetMakeLeader?.username || targetMakeLeader?.name || 'this member'
        }? You will become a regular member of the room.`}
        confirmLabel="Make leader"
        variant="primary"
        isLoading={transferLeadershipMutation.isPending}
        onConfirm={() => {
          if (targetMakeLeader) transferLeadershipMutation.mutate(targetMakeLeader.userId);
        }}
      />

      {/* Leader: Remove Member ConfirmDialog */}
      <ConfirmDialog
        open={Boolean(targetRemove)}
        onOpenChange={(open) => !open && setTargetRemove(null)}
        title="Remove from room"
        description={`Are you sure you want to remove @${
          targetRemove?.username || targetRemove?.name || 'this member'
        } from the room? Any tasks assigned to them will become unassigned.`}
        confirmLabel="Remove"
        variant="danger"
        isLoading={removeMemberMutation.isPending}
        onConfirm={() => {
          if (targetRemove) removeMemberMutation.mutate(targetRemove.userId);
        }}
      />

      {/* Leader: Revoke Invite ConfirmDialog */}
      <ConfirmDialog
        open={Boolean(targetRevokeInvite)}
        onOpenChange={(open) => !open && setTargetRevokeInvite(null)}
        title="Revoke invitation"
        description={`Revoking this invitation will invalidate the link sent to ${
          targetRevokeInvite?.email || 'the recipient'
        }.`}
        confirmLabel="Revoke"
        variant="danger"
        isLoading={revokeInviteMutation.isPending}
        onConfirm={() => {
          if (targetRevokeInvite) revokeInviteMutation.mutate(targetRevokeInvite.id);
        }}
      />

      {/* Modals */}
      <InviteDialog
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        roomId={activeRoomId}
        joinCode={room?.joinCode || ''}
        isLeader={isLeader}
      />

      <CodePopover
        open={codeModalOpen}
        onOpenChange={setCodeModalOpen}
        joinCode={room?.joinCode || ''}
      />

      <ProfileEditPopover
        open={profileModalOpen}
        onOpenChange={setShowProfileModal}
        currentUser={currentUser || null}
        roomId={activeRoomId}
      />
    </div>
  );
}
