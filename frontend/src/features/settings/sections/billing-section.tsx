/**
 * Settings > Billing
 * Built to spec:
 * - "Current plan" hairline row with mono room usage meter ("X of Y rooms used"), thin segmented bar, resetsAt
 * - "Billing history: no invoices yet." muted line
 * - 3-column plan comparison separated by hairlines (no nested cards, no gradients/ribbons)
 * - 2px top rule in text colour on active plan
 * - Feature list with 16px check icons and tiny mono "PLANNED" badge
 * - "Join the waitlist" dialog with optional note
 * - Footer note reading currency from config
 * - Reusable locked state component for gated pages
 */
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchBillingSummary,
  recordPlanInterest,
  type BillingSummary,
  type PlanDefinition,
} from '@/features/prep/api/settings-api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Check, Lock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BillingSection() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['billingSummary'],
    queryFn: fetchBillingSummary,
  });

  const [waitlistModalPlan, setWaitlistModalPlan] = React.useState<PlanDefinition | null>(null);
  const [waitlistNote, setWaitlistNote] = React.useState('');

  const waitlistMutation = useMutation({
    mutationFn: ({ plan, note }: { plan: string; note?: string }) => recordPlanInterest(plan, note),
    onSuccess: (_, variables) => {
      queryClient.setQueryData<BillingSummary>(['billingSummary'], (old) => {
        if (!old) return old;
        const set = new Set(old.waitlistedPlans || []);
        set.add(variables.plan.toUpperCase());
        return { ...old, waitlistedPlans: Array.from(set) };
      });
      toast.success(`You're on the ${variables.plan} waitlist. We'll email you when paid plans open.`);
      setWaitlistModalPlan(null);
      setWaitlistNote('');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Could not record interest. Please try again.');
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col max-w-5xl pb-16 space-y-6">
        <div>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="py-6 border-y border-border">
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col max-w-5xl pb-16 space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-ink tracking-tight">Billing</h1>
          <p className="text-sm text-ink-2 mt-1">Unable to load billing data.</p>
        </div>
        <div className="p-6 rounded-md border border-border bg-surface flex items-center justify-between">
          <p className="text-sm text-ink">An error occurred while loading plans and usage.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="size-3.5" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  const currentPlanId = (data.plan || 'FREE').toUpperCase();
  const usage = data.usage;
  const plans = data.plans || [];
  const waitlisted = new Set((data.waitlistedPlans || []).map((p) => p.toUpperCase()));

  return (
    <div className="flex flex-col max-w-5xl pb-16">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-ink tracking-tight">Billing</h1>
        <p className="text-sm text-ink-2 mt-1">
          Manage your subscription, review room creation quotas, and see upcoming feature tiers.
        </p>
      </div>

      {/* Current plan & Usage meter */}
      <div className="border-y border-border py-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Current Plan</span>
              <span className="text-sm font-semibold text-ink">{currentPlanId}</span>
            </div>
            <p className="text-xs text-ink-2 mt-1">Billing history: no invoices yet.</p>
          </div>

          {/* Usage Meter */}
          <div className="flex flex-col sm:items-end gap-1.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-ink font-medium">
                {usage.limit != null
                  ? `${usage.roomsThisMonth} of ${usage.limit} rooms used`
                  : `${usage.roomsThisMonth} rooms created this month`}
              </span>
              <span className="text-ink-muted">•</span>
              <span className="text-ink-muted">{usage.resetsAt}</span>
            </div>

            {/* Segmented bar for limited plans */}
            {usage.limit != null && usage.limit > 0 && (
              <div className="flex items-center gap-1 w-48 sm:w-56 h-1.5 pt-0.5" role="progressbar" aria-valuenow={usage.roomsThisMonth} aria-valuemax={usage.limit}>
                {Array.from({ length: usage.limit }).map((_, idx) => {
                  const isFilled = idx < usage.roomsThisMonth;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        'flex-1 h-full rounded-[1px] transition-colors',
                        isFilled ? 'bg-ink' : 'bg-border'
                      )}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plan comparison: 3 columns on desktop, stacked on mobile, separated by hairlines */}
      <div className="mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 border-y border-border divide-y lg:divide-y-0 lg:divide-x divide-border">
          {plans.map((p) => {
            const isCurrent = p.id.toUpperCase() === currentPlanId;
            const isFree = p.id.toUpperCase() === 'FREE';
            const isOnWaitlist = waitlisted.has(p.id.toUpperCase());

            return (
              <div
                key={p.id}
                className={cn(
                  'flex flex-col p-6 sm:p-7 relative bg-surface',
                  isCurrent && 'border-t-2 border-t-ink lg:-mt-[1px]'
                )}
              >
                {/* Header */}
                <div className="space-y-1 pb-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-serif text-ink font-semibold">{p.name}</h2>
                    {isCurrent && (
                      <span className="text-[11px] font-mono uppercase tracking-wider text-ink font-medium px-1.5 py-0.5 rounded bg-muted">
                        Current plan
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 pt-2">
                    <span className="text-3xl font-mono font-bold text-ink tracking-tight">${p.price}</span>
                    <span className="text-xs text-ink-muted">per month</span>
                  </div>
                  <p className="text-xs text-ink-2 pt-1 min-h-[32px] leading-relaxed">{p.description}</p>
                </div>

                {/* CTA */}
                <div className="pt-2 pb-6">
                  {isCurrent ? (
                    <Button
                      type="button"
                      disabled
                      variant="outline"
                      className="w-full min-h-[44px] text-xs font-medium border-border text-ink-muted bg-muted/40 cursor-default"
                    >
                      Current plan
                    </Button>
                  ) : isFree ? (
                    <Button
                      type="button"
                      disabled
                      variant="outline"
                      className="w-full min-h-[44px] text-xs font-medium border-border text-ink-muted"
                    >
                      Included
                    </Button>
                  ) : isOnWaitlist ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled
                      className="w-full min-h-[44px] text-xs font-medium border-border gap-1.5 text-ink bg-muted/30"
                    >
                      <Check className="size-4 text-emerald-600 dark:text-emerald-400" /> On the waitlist
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => {
                        setWaitlistModalPlan(p);
                        setWaitlistNote('');
                      }}
                      className="w-full min-h-[44px] text-xs font-medium bg-ink text-surface hover:opacity-90 transition-opacity"
                    >
                      Join the waitlist
                    </Button>
                  )}
                </div>

                {/* Features */}
                <div className="pt-4 border-t border-border flex-1">
                  <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-3">Includes</p>
                  <ul className="space-y-3">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-ink leading-relaxed">
                        <Check className="size-4 shrink-0 text-ink-muted mt-0.5" aria-hidden="true" />
                        <span className="flex-1">
                          {feat.text}
                          {feat.planned && (
                            <span className="inline-block ml-1.5 px-1 py-0.2 text-[9px] font-mono tracking-wider text-ink-muted bg-muted rounded align-middle">
                              PLANNED
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Currency disclaimer footer */}
        <p className="mt-4 text-xs text-ink-muted">
          Prices are shown in {data.currency || 'USD'} per month and may change before launch.
        </p>
      </div>

      {/* Waitlist Modal */}
      <Dialog open={waitlistModalPlan !== null} onOpenChange={(open) => !open && setWaitlistModalPlan(null)}>
        <DialogContent className="max-w-md p-6 bg-surface border border-border text-ink">
          <DialogHeader>
            <DialogTitle className="text-lg font-serif">
              Join the {waitlistModalPlan?.name} waitlist
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-2 leading-relaxed">
              Paid plans aren't open yet. We'll email you when they are.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <label className="text-xs font-medium text-ink">
              What are you hoping to use {waitlistModalPlan?.name} for? (optional)
            </label>
            <Input
              type="text"
              placeholder="e.g. Claude MCP integration, multiple concurrent hackathons"
              value={waitlistNote}
              onChange={(e) => setWaitlistNote(e.target.value)}
              maxLength={300}
              className="text-xs bg-background border-border text-ink h-10"
            />
          </div>

          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setWaitlistModalPlan(null)}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={waitlistMutation.isPending}
              onClick={() => {
                if (waitlistModalPlan) {
                  waitlistMutation.mutate({ plan: waitlistModalPlan.id, note: waitlistNote.trim() || undefined });
                }
              }}
              className="min-h-[44px] bg-ink text-surface hover:opacity-90"
            >
              {waitlistMutation.isPending ? 'Joining…' : 'Join waitlist'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Reusable Calm Locked State Component for Review, Retro, Summary, and Room Creation limits.
 */
export function PlanLockedNotice({
  requiredPlan = 'MAX',
  title = 'Plan upgrade required',
  description,
  onJoinWaitlist,
}: {
  requiredPlan?: 'PRO' | 'MAX';
  title?: string;
  description?: string;
  onJoinWaitlist?: () => void;
}) {
  const defaultDesc =
    requiredPlan === 'MAX'
      ? 'Review, Retro, and project summary analytics require the Max tier.'
      : 'You have reached your room limit for this month on the Free plan.';

  return (
    <div className="p-8 border border-border rounded-card bg-surface flex flex-col items-center text-center max-w-md mx-auto my-12 space-y-4">
      <div className="p-3 rounded-full bg-muted text-ink">
        <Lock className="size-5" />
      </div>
      <div>
        <h3 className="font-serif text-lg font-semibold text-ink">{title}</h3>
        <p className="text-xs text-ink-2 mt-1 leading-relaxed">{description || defaultDesc}</p>
      </div>
      {onJoinWaitlist ? (
        <Button
          type="button"
          onClick={onJoinWaitlist}
          className="min-h-[44px] bg-ink text-surface text-xs font-medium hover:opacity-90"
        >
          Join the {requiredPlan} waitlist
        </Button>
      ) : (
        <a
          href="/app/settings/billing"
          className="inline-flex items-center justify-center min-h-[44px] px-5 py-2 rounded-md bg-ink text-surface text-xs font-medium hover:opacity-90"
        >
          View plans in Billing
        </a>
      )}
    </div>
  );
}
