import React, { useState } from 'react';
import { UserAvatar } from '@/components/ui/user-avatar';
import type { PitchSettings } from '../api/pitch-kit-api';
import type { RoomMember } from '@/services/types';
import { toast } from 'sonner';

interface DemoStageRolesProps {
  settings: PitchSettings | null;
  members: RoomMember[];
  onUpdateRole: (role: 'presenter' | 'operator', userId: string | null) => Promise<void>;
}

export function DemoStageRoles({ settings, members, onUpdateRole }: DemoStageRolesProps) {
  const [openPicker, setOpenPicker] = useState<'presenter' | 'operator' | null>(null);
  const [updating, setUpdating] = useState(false);

  const presenterMember = members.find((m) => m.id === settings?.presenterUserId);
  const operatorMember = members.find((m) => m.id === settings?.operatorUserId);

  const handleSelect = async (role: 'presenter' | 'operator', userId: string | null) => {
    setUpdating(true);
    try {
      await onUpdateRole(role, userId);
      setOpenPicker(null);
      toast.success(`${role === 'presenter' ? 'Presenter' : 'Operator'} updated`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update stage role');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-3.5 pt-4 border-t border-border/60">
      <div>
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider font-mono">
          On stage
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          One presents, one operates.
        </p>
      </div>

      <div className="space-y-3">
        {/* Row 1: Presenter */}
        <div className="flex items-center justify-between gap-3 text-left">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground block">
              Presenter
            </span>
            <div className="flex items-center gap-2 mt-1">
              <UserAvatar
                user={presenterMember ? {
                  id: presenterMember.id,
                  displayName: presenterMember.displayName,
                  avatarUrl: presenterMember.avatarUrl,
                  initials: presenterMember.initials,
                } : null}
                size={26}
              />
              <span className="text-xs font-medium text-foreground">
                {presenterMember?.displayName || 'Unassigned'}
              </span>
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenPicker(openPicker === 'presenter' ? null : 'presenter')}
              className="text-xs font-mono text-accent hover:underline focus-visible:outline-none"
            >
              Change
            </button>

            {openPicker === 'presenter' && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-background border border-border rounded-md shadow-lg z-30 p-1.5 space-y-0.5 text-left animate-in fade-in zoom-in-95 duration-120">
                <button
                  type="button"
                  onClick={() => handleSelect('presenter', null)}
                  className="w-full text-left px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 rounded flex items-center gap-2"
                >
                  <span className="w-5 h-5 rounded-full border border-dashed border-border flex items-center justify-center text-[10px]">
                    —
                  </span>
                  <span>Unassigned</span>
                </button>
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelect('presenter', m.id)}
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted/50 rounded flex items-center gap-2"
                  >
                    <UserAvatar
                      user={{
                        id: m.id,
                        displayName: m.displayName,
                        avatarUrl: m.avatarUrl,
                        initials: m.initials,
                      }}
                      size={20}
                    />
                    <span className="truncate">{m.displayName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Operator */}
        <div className="flex items-center justify-between gap-3 text-left">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground block">
              Operator
            </span>
            <div className="flex items-center gap-2 mt-1">
              <UserAvatar
                user={operatorMember ? {
                  id: operatorMember.id,
                  displayName: operatorMember.displayName,
                  avatarUrl: operatorMember.avatarUrl,
                  initials: operatorMember.initials,
                } : null}
                size={26}
              />
              <span className="text-xs font-medium text-foreground">
                {operatorMember?.displayName || 'Unassigned'}
              </span>
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenPicker(openPicker === 'operator' ? null : 'operator')}
              className="text-xs font-mono text-accent hover:underline focus-visible:outline-none"
            >
              Change
            </button>

            {openPicker === 'operator' && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-background border border-border rounded-md shadow-lg z-30 p-1.5 space-y-0.5 text-left animate-in fade-in zoom-in-95 duration-120">
                <button
                  type="button"
                  onClick={() => handleSelect('operator', null)}
                  className="w-full text-left px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 rounded flex items-center gap-2"
                >
                  <span className="w-5 h-5 rounded-full border border-dashed border-border flex items-center justify-center text-[10px]">
                    —
                  </span>
                  <span>Unassigned</span>
                </button>
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelect('operator', m.id)}
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted/50 rounded flex items-center gap-2"
                  >
                    <UserAvatar
                      user={{
                        id: m.id,
                        displayName: m.displayName,
                        avatarUrl: m.avatarUrl,
                        initials: m.initials,
                      }}
                      size={20}
                    />
                    <span className="truncate">{m.displayName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
