/**
 * S28-1 Profile sub-section
 * Dynamic profile integration with OnboardingBadge ID Card
 */
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSettings, patchSettings } from '@/features/prep/api/settings-api';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { apiClient } from '@/lib/apiClient';
import { OnboardingBadge } from '@/features/onboarding/components/onboarding-badge';
import { getPresetAvatarUrl } from '@/features/onboarding/preset-avatars';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Camera, Repeat, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { RoleTag } from '@/features/prep/api/types';

const ROLE_OPTIONS: RoleTag[] = [
  'Frontend', 'Backend', 'ML/AI', 'Design',
  'Presenter', 'Domain expert', 'QA/Demo operator',
];

export function ProfileSection() {
  const queryClient = useQueryClient();
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const { data: settingsData, isLoading: isSettingsLoading, isError, refetch } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [roleTags, setRoleTags] = useState<string[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial state from backend
  useEffect(() => {
    if (user || settingsData) {
      setDisplayName(settingsData?.profile.displayName || user?.displayName || user?.name || '');
      setUsername(user?.username || settingsData?.profile.githubHandle || '');
      const roles = user?.roleTags && user.roleTags.length > 0
        ? user.roleTags
        : (settingsData?.profile.roleTags || []);
      setRoleTags(roles);
    }
  }, [user, settingsData]);

  const initialDisplayName = settingsData?.profile.displayName || user?.displayName || user?.name || '';
  const initialUsername = user?.username || settingsData?.profile.githubHandle || '';
  const initialRoleTags = user?.roleTags && user.roleTags.length > 0
    ? user.roleTags
    : (settingsData?.profile.roleTags || []);

  const isDirty =
    displayName.trim() !== initialDisplayName ||
    username.trim().toLowerCase() !== initialUsername.toLowerCase() ||
    JSON.stringify(roleTags) !== JSON.stringify(initialRoleTags);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return patchSettings({
        profile: {
          displayName: displayName.trim(),
          username: username.trim().toLowerCase(),
          githubHandle: username.trim().toLowerCase(),
          roleTags: roleTags as RoleTag[],
          availability: user?.experienceLevel || 'MID',
          skills: user?.techStack?.join(', ') || '',
          email: user?.email || settingsData?.profile.email || '',
        },
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings'], updated);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Profile saved successfully');
      setErrors({});
    },
    onError: (err: any) => {
      const msg = err?.message || 'Failed to update profile';
      toast.error(msg);
      setErrors({ form: msg });
    },
  });

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!displayName.trim()) errs.displayName = 'Display name is required.';
    if (username.trim() && !/^[a-zA-Z0-9_.]+$/.test(username.trim())) {
      errs.username = 'Only letters, numbers, dots and underscores are allowed.';
    }
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    saveMutation.mutate();
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await apiClient<{ avatarUrl: string }>('/api/v1/users/me/avatar', {
        method: 'POST',
        body: formData,
      });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Profile photo updated');
    } catch (err: any) {
      toast.error(err?.message || 'Could not upload photo');
    } finally {
      setAvatarUploading(false);
    }
  };

  const toggleRole = (tag: string) => {
    setRoleTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  if (isUserLoading || isSettingsLoading) return <ProfileSkeleton />;
  if (isError) {
    return (
      <div className="flex flex-col gap-3 p-6 rounded-card border border-border bg-card">
        <p className="text-body text-ink-muted">Could not load profile settings.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="w-fit">
          <RefreshCw className="size-4 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  const effectiveAvatar =
    user?.avatarUrl ||
    (user?.avatarPreset ? getPresetAvatarUrl(user.avatarPreset) : null) ||
    settingsData?.profile.avatarUrl ||
    ((settingsData?.profile as any)?.avatarPreset ? getPresetAvatarUrl((settingsData?.profile as any).avatarPreset) : null) ||
    null;
  const joinedDate = user?.onboardedAt
    ? new Date(user.onboardedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Member';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-ink font-display">Profile & Digital Badge</h1>
          <p className="text-caption text-ink-muted">Manage your identity and verified participant card.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 3D ID Badge Card */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full flex justify-end mb-2">
            <button
              type="button"
              onClick={() => setIsFlipped(f => !f)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border border-border bg-card hover:bg-hover text-ink transition-colors cursor-pointer"
            >
              <Repeat className="size-3" />
              {isFlipped ? 'Show front' : 'Flip badge'}
            </button>
          </div>

          <div
            className="cursor-pointer"
            onClick={() => setIsFlipped(f => !f)}
            title="Click to flip badge"
          >
            <OnboardingBadge
              displayName={displayName || user?.name || 'Anonymous'}
              handle={username}
              avatarSrc={effectiveAvatar}
              roleTags={roleTags}
              experienceLevel={user?.experienceLevel}
              goal={user?.goal}
              isFlipped={isFlipped}
              joinedDate={joinedDate}
            />
          </div>

          <div className="flex items-center gap-2 mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="text-xs rounded-full gap-1.5"
            >
              <Camera className="size-3.5" />
              {avatarUploading ? 'Uploading…' : 'Change photo'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleAvatarFile}
            />
          </div>
        </div>

        {/* Right Column: Editable Profile Fields */}
        <div className="lg:col-span-7 flex flex-col gap-5 bg-card rounded-card border border-border p-6 shadow-xs">
          {/* Display Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="display-name" className="text-xs font-semibold uppercase tracking-wider text-ink-muted font-mono">
              Display Name <span className="text-danger">*</span>
            </Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={e => { setDisplayName(e.target.value); setErrors({}); }}
              placeholder="e.g. Alex Morgan"
              className={cn(errors.displayName && 'border-danger')}
            />
            {errors.displayName && (
              <p className="text-caption text-danger" role="alert">{errors.displayName}</p>
            )}
          </div>

          {/* Handle / Username */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username-input" className="text-xs font-semibold uppercase tracking-wider text-ink-muted font-mono">
              Handle
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted font-mono text-sm">@</span>
              <Input
                id="username-input"
                value={username}
                onChange={e => { setUsername(e.target.value); setErrors({}); }}
                placeholder="your_handle"
                className="pl-7 font-mono"
              />
            </div>
            {errors.username && (
              <p className="text-caption text-danger" role="alert">{errors.username}</p>
            )}
          </div>

          {/* Email (Read-only) */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email-input" className="text-xs font-semibold uppercase tracking-wider text-ink-muted font-mono">
              Registered Email
            </Label>
            <Input
              id="email-input"
              type="email"
              value={user?.email || settingsData?.profile.email || ''}
              readOnly
              className="bg-muted text-ink-muted font-mono cursor-not-allowed"
            />
          </div>

          {/* Role Tags Selection */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-ink-muted font-mono">
              Role Focus
            </Label>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Role focus">
              {ROLE_OPTIONS.map(tag => {
                const active = roleTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleRole(tag)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer',
                      active
                        ? 'bg-primary text-primary-foreground border-primary font-semibold'
                        : 'bg-card text-ink border-border hover:border-ink-muted'
                    )}
                  >
                    {active ? '✓ ' : ''}{tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Action */}
          <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
            <span className="text-xs text-ink-muted font-mono">
              {isDirty ? '● Unsaved changes' : 'All changes saved'}
            </span>
            <Button
              onClick={handleSave}
              disabled={!isDirty || saveMutation.isPending}
              className="rounded-full px-6 font-semibold"
            >
              {saveMutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 flex flex-col items-center gap-3">
          <Skeleton className="w-[300px] h-[440px] rounded-[20px]" />
        </div>
        <div className="lg:col-span-7 flex flex-col gap-4 p-6 rounded-card border border-border">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
