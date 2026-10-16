import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchEmailPrefs,
  patchEmailPrefs,
  sendTestEmail,
  type EmailPrefsResponse,
} from '@/features/prep/api/settings-api';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

interface CategoryConfig {
  key: string;
  label: string;
  description: string;
}

const YOUR_WORK_CATEGORIES: CategoryConfig[] = [
  {
    key: 'TASK_ASSIGNED',
    label: 'Task assigned to you',
    description: 'A task is assigned to you or your assignment changes.',
  },
  {
    key: 'BLOCKERS',
    label: 'Blockers and flags',
    description: 'A task you own is blocked or a teammate flags a blocker in your room.',
  },
  {
    key: 'REVIEW',
    label: 'Review requests',
    description: 'A task waits for your confirmation and changes requested on your tasks.',
  },
];

const YOUR_TEAM_CATEGORIES: CategoryConfig[] = [
  {
    key: 'TEAM_CHANGES',
    label: 'Team changes',
    description: 'Someone joined, left, got a role, or leadership moved.',
  },
  {
    key: 'CHECKPOINTS',
    label: 'Checkpoints',
    description: 'A checkpoint or stage is reached or missed in your rooms.',
  },
  // ANNOUNCEMENTS is omitted because it has no trigger in the codebase.
];

const THE_CLOCK_CATEGORIES: CategoryConfig[] = [
  {
    key: 'CLOCK_REMINDERS',
    label: 'Clock reminders',
    description: 'Feature freeze and submission countdowns.',
  },
  {
    key: 'ALERTS',
    label: 'Important alerts',
    description: 'Changed deadlines or freeze time, AI-use policy changes, brief rule changes.',
  },
];

export function NotificationsSection() {
  const queryClient = useQueryClient();
  const [isSendingTest, setIsSendingTest] = useState(false);

  const { data: prefs, isLoading, isError } = useQuery<EmailPrefsResponse>({
    queryKey: ['email-prefs'],
    queryFn: fetchEmailPrefs,
  });

  const mutation = useMutation({
    mutationFn: patchEmailPrefs,
    onMutate: async (newReq) => {
      await queryClient.cancelQueries({ queryKey: ['email-prefs'] });
      const previous = queryClient.getQueryData<EmailPrefsResponse>(['email-prefs']);

      if (previous) {
        queryClient.setQueryData<EmailPrefsResponse>(['email-prefs'], {
          ...previous,
          paused: newReq.paused !== undefined ? newReq.paused : previous.paused,
          categories: {
            ...previous.categories,
            ...(newReq.categories || {}),
          },
        });
      }

      return { previous };
    },
    onError: (err: any, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['email-prefs'], context.previous);
      }
      toast.error(err?.message || 'Failed to save email preference. Reverted.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['email-prefs'] });
    },
  });

  const handleToggleMaster = (enabled: boolean) => {
    mutation.mutate({ paused: !enabled });
  };

  const handleToggleCategory = (key: string, enabled: boolean) => {
    mutation.mutate({
      categories: { [key]: enabled },
    });
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    try {
      const res = await sendTestEmail();
      toast.success(res.message || 'Sample update email sent');
    } catch (err: any) {
      toast.error(err?.message || "Email isn't set up on the server");
    } finally {
      setIsSendingTest(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 max-w-3xl">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-20 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !prefs) {
    return (
      <div className="flex flex-col gap-6 max-w-3xl">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-normal text-ink">Notifications</h1>
          <p className="text-caption text-ink-muted mt-1">Manage email preferences and room update digests.</p>
        </div>
        <p className="text-body text-danger">Failed to load email preferences. Please refresh the page.</p>
      </div>
    );
  }

  const isMasterOn = !prefs.paused;

  const renderSwitchRow = (cat: CategoryConfig) => {
    const isChecked = prefs.categories[cat.key] !== false;

    return (
      <div
        key={cat.key}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 min-h-[44px]"
      >
        <div className="pr-4">
          <label htmlFor={`cat-${cat.key}`} className="text-body font-medium text-ink block cursor-pointer">
            {cat.label}
          </label>
          <p className="text-caption text-ink-muted mt-0.5">{cat.description}</p>
        </div>
        <div className="flex items-center self-end sm:self-center shrink-0 min-h-[44px] min-w-[44px]">
          <Switch
            id={`cat-${cat.key}`}
            checked={isChecked}
            disabled={!isMasterOn}
            onCheckedChange={(checked) => handleToggleCategory(cat.key, checked)}
            aria-label={cat.label}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-normal text-ink">Notifications</h1>
        <p className="text-caption text-ink-muted mt-1">
          Digest updates for tasks, blockers, and countdowns delivered to your inbox.
        </p>
      </div>

      {/* Master Switch Row */}
      <div className="border-b border-border pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 min-h-[44px]">
          <div>
            <span className="text-body font-medium text-ink block">Email notifications</span>
            <p className="text-caption text-ink-muted mt-0.5">
              Updates sent to <span className="font-mono text-ink">{prefs.maskedEmail || 'your address'}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={handleSendTest}
              disabled={isSendingTest || !isMasterOn}
              className="text-caption font-medium text-ink hover:text-lav-600 disabled:opacity-40 disabled:pointer-events-none px-3 py-2 rounded-control border border-border hover:border-border-strong transition-colors min-h-[44px] sm:min-h-0 flex items-center gap-1.5"
            >
              {isSendingTest && <Loader2 className="size-3.5 animate-spin" />}
              Send a test email
            </button>
            <div className="flex items-center min-h-[44px] min-w-[44px]">
              <Switch
                id="master-email-switch"
                checked={isMasterOn}
                onCheckedChange={handleToggleMaster}
                aria-label="Master email notifications"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Group rows */}
      <div
        className={`flex flex-col gap-8 transition-opacity duration-200 ${
          !isMasterOn ? 'opacity-40 pointer-events-none' : ''
        }`}
      >
        {/* Group 1: Your work */}
        <section aria-labelledby="section-your-work">
          <h2 id="section-your-work" className="text-[13px] font-medium text-ink-muted uppercase tracking-wider mb-2">
            Your work
          </h2>
          <div className="divide-y divide-border border-y border-border">
            {YOUR_WORK_CATEGORIES.map(renderSwitchRow)}
          </div>
        </section>

        {/* Group 2: Your team */}
        <section aria-labelledby="section-your-team">
          <h2 id="section-your-team" className="text-[13px] font-medium text-ink-muted uppercase tracking-wider mb-2">
            Your team
          </h2>
          <div className="divide-y divide-border border-y border-border">
            {YOUR_TEAM_CATEGORIES.map(renderSwitchRow)}
          </div>
        </section>

        {/* Group 3: The clock */}
        <section aria-labelledby="section-the-clock">
          <h2 id="section-the-clock" className="text-[13px] font-medium text-ink-muted uppercase tracking-wider mb-2">
            The clock
          </h2>
          <div className="divide-y divide-border border-y border-border">
            {THE_CLOCK_CATEGORIES.map(renderSwitchRow)}
          </div>
        </section>
      </div>

      {/* Muted line at bottom */}
      <div className="pt-2 border-t border-border">
        <p className="text-caption text-ink-muted">
          Always sent: welcome, invitations, join confirmations.
        </p>
      </div>
    </div>
  );
}
