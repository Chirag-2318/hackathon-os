import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AvatarPicker, type AvatarSelection } from '@/features/onboarding/components/avatar-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/design/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ROLE_TAG_OPTIONS = [
  'Frontend',
  'Backend',
  'ML / AI',
  'Design',
  'Presenter',
  'Domain expert',
  'QA / Demo operator',
];

export interface ProfileEditPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: {
    avatarType?: string | null;
    avatarPreset?: number | null;
    avatarUrl?: string | null;
    roleTags?: string[] | null;
  } | null;
  roomId: string;
}

export function ProfileEditPopover({
  open,
  onOpenChange,
  currentUser,
  roomId,
}: ProfileEditPopoverProps) {
  const queryClient = useQueryClient();

  const [selection, setSelection] = useState<AvatarSelection>({
    type: currentUser?.avatarType === 'CUSTOM' ? 'CUSTOM' : 'PRESET',
    presetIndex: currentUser?.avatarPreset ?? 1,
    customUrl: currentUser?.avatarUrl ?? undefined,
  });

  const [roleTags, setRoleTags] = useState<string[]>([]);

  useEffect(() => {
    if (open && currentUser) {
      setSelection({
        type: currentUser.avatarType === 'CUSTOM' ? 'CUSTOM' : 'PRESET',
        presetIndex: currentUser.avatarPreset ?? 1,
        customUrl: currentUser.avatarUrl ?? undefined,
      });
      setRoleTags(currentUser.roleTags || []);
    }
  }, [open, currentUser]);

  const toggleRoleTag = (tag: string) => {
    if (roleTags.includes(tag)) {
      setRoleTags(roleTags.filter((t) => t !== tag));
    } else {
      if (roleTags.length >= 3) {
        toast.info('Maximum 3 role tags');
        return;
      }
      setRoleTags([...roleTags, tag]);
    }
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: any = {
        avatarType: selection.type,
        roleTags,
      };
      if (selection.type === 'PRESET') {
        payload.avatarPreset = selection.presetIndex || 1;
        payload.avatarUrl = null;
      } else {
        payload.avatarUrl = selection.customUrl || null;
        payload.avatarPreset = null;
      }

      return apiFetch('/api/v1/users/me/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['room-members', roomId] });
      toast.success('Profile updated');
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update profile');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] p-6 rounded-2xl bg-surface border border-border shadow-2xl">
        <DialogHeader className="space-y-1 text-left pb-2">
          <DialogTitle className="text-lg font-medium text-foreground tracking-tight">
            Edit profile
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Update your avatar and choose up to 3 role tags for the team roster.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Avatar Picker */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">Avatar</label>
            <AvatarPicker selection={selection} onChange={setSelection} />
          </div>

          {/* Role Tags Chooser */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-foreground">Role tags</label>
              <span className="text-[11px] font-mono text-muted-foreground">
                {roleTags.length}/3 selected
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ROLE_TAG_OPTIONS.map((tag) => {
                const isSelected = roleTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleRoleTag(tag)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer border",
                      isSelected
                        ? "bg-foreground text-background border-foreground shadow-xs"
                        : "bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground hover:border-border"
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-border/40 mt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={saveMutation.isPending}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="text-xs font-semibold gap-1.5"
          >
            {saveMutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
