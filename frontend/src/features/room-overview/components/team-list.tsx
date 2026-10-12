import * as React from 'react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { UserName } from '@/components/ui/user-name';
import { useParams } from 'react-router-dom';
import { useOverlay } from '@/app/providers/overlay-store';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { roomApi } from '@/features/room/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TeamListProps {
  members: { id: string; avatarId: string; name: string; role: string; presenceOnline: boolean }[];
}

export function TeamList({ members }: TeamListProps) {
  const { roomId } = useParams<{ roomId: string }>();
  const { open } = useOverlay('invite-dialog');
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const displayMembers = members.slice(0, 5); // max rows visible in reference height

  const currentUserMembership = members.find(m => m.id === String(user?.id));
  const isLeaderOrCaptain = currentUserMembership?.role === 'LEADER' || currentUserMembership?.role === 'CAPTAIN';

  const { mutate: changeRole } = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) => 
      roomApi.changeRole(roomId!, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-overview', roomId] });
    }
  });

  return (
    <div className="flex flex-col p-5 bg-surface rounded-card border border-border shadow-e0">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-h3 text-ink">Members</h3>
          <span className="text-caption text-ink-muted bg-surface-sunken px-2 py-0.5 rounded-pill">{members.length} active</span>
        </div>
        {isLeaderOrCaptain && (
          <Button variant="outline" size="sm" onClick={() => open({ roomId })}>
            <UserPlus className="size-4 mr-2" />
            Invite
          </Button>
        )}
      </header>
      <div className="flex flex-col divide-y divide-border -mx-5 px-5">
        {displayMembers.map(member => (
          <div key={member.id} className="flex items-center justify-between py-4 min-w-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <UserAvatar user={member} size={36} />
              <div className="flex flex-col min-w-0">
                <span className="text-body-strong truncate">
                  <UserName user={member} showDisplayName={true} />
                </span>
                <div className="flex gap-1 flex-wrap mt-1">
                  {isLeaderOrCaptain && member.id !== String(user?.id) ? (
                    <Select 
                      value={member.role} 
                      onValueChange={(newRole) => changeRole({ userId: Number(member.id), role: newRole })}
                    >
                      <SelectTrigger className="h-6 text-xs bg-surface-sunken border-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">MEMBER</SelectItem>
                        <SelectItem value="CAPTAIN">CAPTAIN</SelectItem>
                        <SelectItem value="SPECTATOR">SPECTATOR</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-caption text-ink-muted bg-surface-sunken px-2 py-0.5 rounded-pill truncate max-w-full">{member.role}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center shrink-0 ml-3">
              <div className={`w-2 h-2 rounded-full ${member.presenceOnline ? 'bg-success-solid' : 'bg-ink-muted'}`} />
            </div>
          </div>
        ))}
      </div>
      {members.length > 5 && (
        <button className="mt-4 text-body-strong text-info-text hover:underline text-left">
          View all
        </button>
      )}
    </div>
  );
}
