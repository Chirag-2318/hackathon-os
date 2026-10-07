/**
 * S28-7 Billing sub-section
 * PRD 6a §3, S28-7
 *
 * Plan card (feature card style) showing current plan (Free in mock).
 * Free: Get Pro button + comparison list.
 * TODO [OQ-10]: Confirm billing copy and Pro feature list with product team.
 */
import { useQuery } from '@tanstack/react-query';
import { fetchSettings } from '@/features/prep/api/settings-api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2 } from 'lucide-react';

// TODO [OQ-10]: Replace with final Pro feature list from ideation.md §7 or product team.
const PRO_FEATURES = [
  'Managed AI — no API key needed',
  'Priority support',
  'Advanced analytics',
  'Unlimited rooms',
];

export function BillingSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-[200px] w-full rounded-card" />
      </div>
    );
  }

  const plan = data.billing.plan;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-ink">Billing</h1>

      {/* Plan card */}
      <div className="rounded-card bg-surface-raised border border-border shadow-e1 p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-h2 text-ink capitalize">{plan === 'free' ? 'Free' : 'Pro'}</h2>
          {plan === 'free' && (
            <p className="text-body text-ink-muted mt-1">
              Basic access. Upgrade to Pro for AI tools and unlimited rooms.
            </p>
          )}
          {plan === 'pro' && (
            <p className="text-body text-ink-muted mt-1">
              You're on Pro. Full access to all features.
            </p>
          )}
        </div>

        {plan === 'free' && (
          <>
            <ul className="flex flex-col gap-2">
              {PRO_FEATURES.map(feat => (
                <li key={feat} className="flex items-start gap-2 text-body text-ink">
                  <CheckCircle2 className="size-4 text-ink-muted shrink-0 mt-0.5" aria-hidden="true" />
                  {feat}
                </li>
              ))}
            </ul>
            <Button className="self-start bg-lav-600 text-white hover:bg-lav-700">
              Get Pro
            </Button>
          </>
        )}

        {plan === 'pro' && (
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              Manage subscription
            </Button>
            <p className="text-caption text-ink-muted">
              Next billing date: [Content TBD]
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
