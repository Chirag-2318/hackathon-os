/**
 * InviteCard — S03 valid invite state.
 * Source: PRD §3.3.
 *
 * Card content in order: room name, event, leader avatar, roles-needed chips,
 * member avatars, "Join as" selector, "Join room" button.
 *
 * Member avatars enter with 40ms stagger, once per page visit.
 * Stagger cap: 8 items, total <400ms. Reduced motion: all appear together.
 * "Join as" is single-select, required, no default, options limited to roles needed.
 * Room name truncates at 2 lines with tooltip (D§9).
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from 'cn';
import { UserAvatar } from '@/components/primitives/avatar-stack';
import { Chip } from '@/components/primitives/chip';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/primitives/form-field';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle } from 'lucide-react';
import { COPY } from '@/shared/constants/copy';
import { ROUTES } from '@/shared/constants/routes';
import { useJoinRoom } from '../hooks/use-join-room';
import { useIsMotionReduced } from '@/shared/motion';
import { announce } from '@/shared/utils/announce';
import type { InviteRoom } from '@/api/client';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

interface InviteCardProps {
  room: InviteRoom;
  token: string;
}

// Track if animation has played once per session
let hasAnimatedSession = false;

export function InviteCard({ room, token }: InviteCardProps) {
  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const join = useJoinRoom(token);
  const isReduced = useIsMotionReduced();

  useEffect(() => {
    if (error) {
      announce(error, 'assertive');
    }
  }, [error]);

  const handleJoin = () => {
    if (!selectedRole) return;
    setError(null);
    join.mutate(selectedRole, {
      onSuccess: (result: any) => {
        if (result) {
          navigate(ROUTES.POST_JOIN);
        }
      },
      onError: () => {
        setError(COPY.invite.errorMessage);
      },
    });
  };

  // Mark stagger animation as played after first render
  const shouldStagger = !hasAnimatedSession && !isReduced;
  useEffect(() => {
    hasAnimatedSession = true;
  }, []);

  return (
    <div
      className="flex flex-col gap-5 p-6 animate-in fade-in"
      style={{
        animationDuration: 'var(--t-fast)',
        animationTimingFunction: 'var(--ease-out)',
      }}
      data-testid="invite-card"
    >
      {/* Room name — 2-line clamp with tooltip */}
      <Tooltip>
        <TooltipTrigger asChild>
          <h1 className="text-h1 text-ink-strong line-clamp-2">
            {room.name}
          </h1>
        </TooltipTrigger>
        <TooltipContent>{room.name}</TooltipContent>
      </Tooltip>

      {/* Event */}
      <p className="text-body text-ink-muted" data-testid="invite-event">
        {room.eventName}
      </p>

      {/* Leader avatar + name */}
      <div className="flex items-center gap-3" data-testid="invite-leader">
        <UserAvatar
          size="md"
          src={room.leader.avatarUrl}
          initials={getInitials(room.leader.name)}
        />
        <div>
          <span className="text-body-strong text-ink">{room.leader.name}</span>
          <span className="text-caption text-ink-muted block">Leader</span>
        </div>
      </div>

      {/* Roles needed */}
      <div className="flex flex-wrap gap-2" data-testid="invite-roles">
        {room.rolesNeeded.map((role: any) => (
          <Chip key={role.label} variant="soft" fill={role.color}>
            {role.label}
          </Chip>
        ))}
      </div>

      {/* Member avatars — 40ms stagger, once */}
      <div className="flex items-center" data-testid="invite-members">
        {room.members.map((member: any, i: number) => (
          <div
            key={member.name}
            className={cn(
              shouldStagger && 'animate-in fade-in zoom-in-95',
            )}
            style={
              shouldStagger
                ? {
                    animationDelay: `${i * 40}ms`,
                    animationDuration: 'var(--t-fast)',
                    animationTimingFunction: 'var(--ease-out)',
                    animationFillMode: 'backwards',
                  }
                : undefined
            }
          >
            <UserAvatar
              size="sm"
              src={member.avatarUrl}
              initials={getInitials(member.name)}
              stacked
            />
          </div>
        ))}
      </div>

      {/* Join as select */}
      <FormField label={COPY.invite.joinAs} htmlFor="join-role">
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger
            id="join-role"
            className="w-full h-10 rounded-control border border-border-input bg-surface"
            data-testid="join-role-select"
          >
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {room.joinableRoles.map((role: any) => (
              <SelectItem key={role.label} value={role.label}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      {/* Error — inline with retry */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-2 text-caption text-danger-text animate-in fade-in slide-in-from-bottom-2"
          style={{
            animationDuration: 'var(--t-base)',
            animationTimingFunction: 'var(--ease-out)',
          }}
          data-testid="invite-error"
        >
          <AlertCircle className="size-4 shrink-0 mt-0.5" strokeWidth={1.5} />
          <span>{error}</span>
        </div>
      )}

      {/* Join room button */}
      <Button
        size="lg"
        className="w-full"
        disabled={!selectedRole || join.isPending}
        onClick={handleJoin}
        data-testid="btn-join-room"
      >
        {join.isPending ? 'Joining…' : COPY.invite.joinRoom}
      </Button>
    </div>
  );
}
