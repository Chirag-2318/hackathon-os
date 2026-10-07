/**
 * S28-3 Notifications sub-section
 * PRD 6a §3, S28-3
 *
 * Notification preference rows with toggles. 5 categories (placeholder list —
 * confirm with product team [OQ-3]).
 * Save preferences button at the bottom.
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSettings, patchSettings } from '@/features/prep/api/settings-api';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { NotificationPreferences } from '@/features/prep/api/types';

// TODO [OQ-3]: Confirm these notification categories with product team.
const NOTIFICATION_ROWS: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  { key: 'blockerAlerts',      label: 'Blocker alerts',       description: 'Notify when a blocker is raised in the room.' },
  { key: 'checkpointReminders',label: 'Checkpoint reminders', description: 'Notify before scheduled checkpoints.' },
  { key: 'taskAssignments',    label: 'Task assignments',     description: 'Notify when a task is assigned to you.' },
  { key: 'deadlineReminders',  label: 'Deadline reminders',   description: 'Notify 30 minutes before a deadline.' },
  { key: 'teamAnnouncements',  label: 'Team announcements',   description: 'Notify when the team lead posts an announcement.' },
];

export function NotificationsSection() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  const [draft, setDraft] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    if (data && !draft) setDraft({ ...data.notifications });
  }, [data]);

  const isDirty = draft && data
    ? JSON.stringify(draft) !== JSON.stringify(data.notifications)
    : false;

  const saveMutation = useMutation({
    mutationFn: (notifications: NotificationPreferences) =>
      patchSettings({ notifications }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings'], updated);
      setDraft({ ...updated.notifications });
    },
  });

  if (isLoading || !draft) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-36" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-ink">Notifications</h1>

      <div className="bg-surface-raised rounded-card border border-border divide-y divide-border">
        {NOTIFICATION_ROWS.map(row => (
          <div key={row.key} className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-body-strong text-ink">{row.label}</p>
              <p className="text-caption text-ink-muted mt-0.5">{row.description}</p>
            </div>
            <Switch
              id={`notif-${row.key}`}
              checked={draft[row.key]}
              onCheckedChange={checked => setDraft({ ...draft, [row.key]: checked })}
              aria-label={row.label}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => saveMutation.mutate(draft)}
          disabled={!isDirty || saveMutation.isPending}
          className="bg-lav-600 text-white hover:bg-lav-700"
        >
          {saveMutation.isPending ? 'Saving…' : 'Save preferences'}
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
