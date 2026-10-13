/**
 * S28-2 Appearance sub-section
 * PRD 6a §3, S28-2
 *
 * Theme: Light | Dark | System (default: System)
 * Density: Comfortable | Compact (default: Comfortable)
 * Changes apply immediately. No save button needed.
 */
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSettings, patchSettings } from '@/features/prep/api/settings-api';
import { SegmentedControl, SegmentedControlItem } from '@/components/primitives/segmented-control';
import { Skeleton } from '@/components/ui/skeleton';
import type { AppTheme, Density } from '@/features/prep/api/types';
import { resetTourHotspots } from '@/tour/api';

export function AppearanceSection() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  const handleResetTips = async () => {
    try {
      await resetTourHotspots();
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Page tips reset');
    } catch {
      toast.error('Failed to reset page tips');
    }
  };

  const mutation = useMutation({
    mutationFn: (patch: { theme?: AppTheme; density?: Density }) =>
      patchSettings({ appearance: { ...data!.appearance, ...patch } }),
    onSuccess: (updated) => queryClient.setQueryData(['settings'], updated),
  });

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-28" />
        <div className="flex flex-col gap-4 p-5 rounded-card border border-border">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  const { theme, density } = data.appearance;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-ink">Appearance</h1>

      <div className="bg-surface-raised rounded-card border border-border p-5 flex flex-col gap-5">
        {/* Row 1: Theme */}
        <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="text-body-strong text-ink">Theme</p>
          </div>
          <SegmentedControl aria-label="Theme">
            {(['light', 'dark', 'system'] as AppTheme[]).map(t => (
              <SegmentedControlItem
                key={t}
                active={theme === t}
                onClick={() => mutation.mutate({ theme: t })}
                aria-pressed={theme === t}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </div>

        {/* Row 2: Density */}
        <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="text-body-strong text-ink">Density</p>
          </div>
          <SegmentedControl aria-label="Density">
            {(['comfortable', 'compact'] as Density[]).map(d => (
              <SegmentedControlItem
                key={d}
                active={density === d}
                onClick={() => mutation.mutate({ density: d })}
                aria-pressed={density === d}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </div>

        {/* Row 3: Page tips */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-body-strong text-ink">Page tips</p>
            <p className="text-caption text-ink-muted">Reset dismissed beacons and in-app tips.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetTips}
              className="h-8 px-3 rounded-md border border-border bg-surface text-xs font-medium text-ink hover:bg-hover transition-colors cursor-pointer"
            >
              Reset page tips
            </button>
          </div>
        </div>
      </div>

      <p className="text-caption text-ink-muted">
        Compact density reduces row heights and control sizes for information-dense views.
      </p>
    </div>
  );
}
