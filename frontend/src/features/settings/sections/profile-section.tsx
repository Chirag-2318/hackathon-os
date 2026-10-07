/**
 * S28-1 Profile sub-section
 * PRD 6a §3, S28-1
 *
 * Fields: display name, email (read-only), github handle,
 *         role tags (multi-select), availability, skills.
 * Save changes button disabled until dirty. Required display name validation.
 */
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSettings, patchSettings } from '@/features/prep/api/settings-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserProfile, RoleTag } from '@/features/prep/api/types';

const ROLE_TAGS: RoleTag[] = [
  'Frontend', 'Backend', 'ML/AI', 'Design',
  'Presenter', 'Domain expert', 'QA/Demo operator',
];

export function ProfileSection() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  const [draft, setDraft] = useState<UserProfile | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data && !draft) setDraft({ ...data.profile });
  }, [data]);

  const isDirty = draft && data
    ? JSON.stringify(draft) !== JSON.stringify(data.profile)
    : false;

  const saveMutation = useMutation({
    mutationFn: (profile: UserProfile) => patchSettings({ profile }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings'], updated);
      setDraft({ ...updated.profile });
      setErrors({});
    },
  });

  const handleSave = () => {
    if (!draft) return;
    const newErrors: Record<string, string> = {};
    if (!draft.displayName.trim()) newErrors.displayName = 'Display name is required.';
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    saveMutation.mutate(draft);
  };

  const toggleRole = (tag: RoleTag) => {
    if (!draft) return;
    const has = draft.roleTags.includes(tag);
    setDraft({ ...draft, roleTags: has ? draft.roleTags.filter(t => t !== tag) : [...draft.roleTags, tag] });
  };

  if (isLoading) return <ProfileSkeleton />;
  if (isError || !draft) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-body text-ink-muted">Could not load profile settings.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="size-4 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-ink">Profile</h1>

      {/* Avatar */}
      <div className="flex flex-col items-start gap-2">
        <div
          className="relative group size-24 rounded-full bg-surface-sunken border border-border flex items-center justify-center overflow-hidden cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label="Change profile photo"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
        >
          <span className="text-h2 font-bold text-ink-muted select-none">
            {draft.displayName.slice(0, 2).toUpperCase() || 'AM'}
          </span>
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
            <Camera className="size-5 text-white" />
            <span className="text-[10px] text-white font-semibold">Change photo</span>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label="Upload profile photo"
        />
        <button
          type="button"
          className="text-caption text-ink-muted underline underline-offset-2 hover:text-ink transition-colors"
        >
          Remove photo
        </button>
      </div>

      {/* Form */}
      <div className="bg-surface-raised rounded-card border border-border p-5 flex flex-col gap-5">

        {/* Display name */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="display-name">Display name <span aria-hidden="true" className="text-danger-text">*</span></Label>
          <Input
            id="display-name"
            value={draft.displayName}
            onChange={e => { setDraft({ ...draft, displayName: e.target.value }); setErrors({}); }}
            className={cn(errors.displayName && 'border-danger-text')}
            aria-describedby={errors.displayName ? 'display-name-error' : undefined}
            aria-required="true"
          />
          {errors.displayName && (
            <p id="display-name-error" className="text-caption text-danger-text" role="alert">
              {errors.displayName}
            </p>
          )}
        </div>

        {/* Email (read-only) */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={draft.email}
            readOnly
            aria-readonly="true"
            className="bg-surface-sunken text-ink-muted cursor-default"
          />
          <p className="text-caption text-ink-muted">Email cannot be changed here.</p>
        </div>

        {/* GitHub handle */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="github-handle">GitHub handle</Label>
          <Input
            id="github-handle"
            value={draft.githubHandle}
            onChange={e => setDraft({ ...draft, githubHandle: e.target.value })}
            placeholder="e.g. your-handle"
          />
        </div>

        {/* Role tags */}
        <div className="flex flex-col gap-1.5">
          <Label>Role tags</Label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Role tags">
            {ROLE_TAGS.map(tag => {
              const active = draft.roleTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleRole(tag)}
                  className={cn(
                    'px-3 py-1 rounded-chip text-label font-semibold border transition-colors',
                    active
                      ? 'bg-lav-600 text-white border-transparent'
                      : 'bg-surface-sunken text-ink border-border-strong hover:border-lav-400',
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Availability */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="availability">Availability</Label>
          <Input
            id="availability"
            value={draft.availability}
            onChange={e => setDraft({ ...draft, availability: e.target.value })}
            placeholder="e.g. 18 hours"
          />
        </div>

        {/* Skills */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="skills">Skills</Label>
          <Input
            id="skills"
            value={draft.skills}
            onChange={e => setDraft({ ...draft, skills: e.target.value })}
            placeholder="e.g. Python, React, PostgreSQL"
          />
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!isDirty || saveMutation.isPending}
          className="bg-lav-600 text-white hover:bg-lav-700"
        >
          {saveMutation.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-caption text-danger-text text-right" role="alert">
          Save failed. Try again.
        </p>
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="size-24 rounded-full" />
      <div className="flex flex-col gap-4 p-5 rounded-card border border-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
