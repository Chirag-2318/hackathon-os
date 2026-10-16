import { useParams, Link } from 'react-router-dom';
import { usePlaybookDetail } from './hooks/use-playbooks';
import { LandingHeader } from '@/features/landing/components/landing-header';
import { LandingFooter } from '@/features/landing/components/landing-footer';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/primitives/empty-state';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/shared/constants/routes';
import { AlertCircle, Users, Layers, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Chip } from '@/components/primitives/chip';

export function PlaybookDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: playbook, isLoading, isError } = usePlaybookDetail(slug ?? '');

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <LandingHeader />

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-12 md:py-16">
        <Link to={ROUTES.PLAYBOOKS} className="inline-flex items-center text-sm text-ink-muted hover:text-ink mb-8 transition-colors">
          <ArrowLeft className="mr-2 size-4" />
          Back to Playbooks
        </Link>

        {isLoading && (
          <div className="flex flex-col md:flex-row gap-12">
            <div className="flex-1 space-y-6">
              <Skeleton className="h-10 w-3/4 rounded-control" />
              <Skeleton className="h-6 w-1/2 rounded-control" />
              <Skeleton className="h-40 w-full rounded-card mt-8" />
            </div>
            <div className="md:w-[400px] space-y-6">
              <Skeleton className="h-[200px] w-full rounded-card" />
              <Skeleton className="h-12 w-full rounded-control" />
            </div>
          </div>
        )}

        {isError && (
          <div className="py-12">
            <EmptyState
              icon={<AlertCircle strokeWidth={1.5} />}
              title="Playbook not found"
              description="We couldn't load this playbook. It might have been removed."
              actionLabel="Browse all playbooks"
              onAction={() => window.location.href = ROUTES.PLAYBOOKS}
            />
          </div>
        )}

        {playbook && (
          <div className="flex flex-col md:flex-row gap-12">
            {/* Left Column: Details & Timeline */}
            <div className="flex-1">
              <div className="mb-6">
                <Chip variant="soft" className="mb-4">{playbook.eventType}</Chip>
                <h1 className="text-3xl sm:text-4xl font-display font-normal text-ink mb-4 leading-none tracking-tight">{playbook.title}</h1>
                <div className="flex flex-wrap gap-6 text-body text-ink-muted">
                  {playbook.teamSize !== null && (
                    <span className="flex items-center gap-2">
                      <Users className="size-4" strokeWidth={1.5} />
                      {playbook.teamSizeLabel}
                    </span>
                  )}
                  <span className="flex items-center gap-2">
                    <Layers className="size-4" strokeWidth={1.5} />
                    {playbook.phases}
                  </span>
                </div>
              </div>

              <div className="mt-12">
                <h2 className="text-h2 text-ink-strong mb-6">Timeline Preview</h2>
                {/* Timeline UI placeholder */}
                <div className="space-y-4">
                  {Array.from({ length: playbook.phaseCount }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-sm font-medium">
                          {i + 1}
                        </div>
                        {i < playbook.phaseCount - 1 && <div className="w-px h-12 bg-border my-2" />}
                      </div>
                      <div className="pt-1 pb-6">
                        <h3 className="text-h4 text-ink-strong">Phase {i + 1}</h3>
                        <p className="text-body text-ink-muted mt-1">Expected duration and tasks for this phase.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Meta & Action */}
            <div className="md:w-[400px]">
              <div className="sticky top-24 rounded-card border border-border/50 bg-surface p-6 shadow-sm">
                
                {/* Checklist Preview */}
                <div className="mb-8">
                  <h3 className="text-h4 text-ink-strong mb-4">What you'll do</h3>
                  <ul className="space-y-3">
                    {playbook.checklistPreview.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-body text-ink">
                        <CheckCircle2 className="size-5 text-mint-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Rubric Preview */}
                <div className="mb-8 pt-6 border-t border-border">
                  <h3 className="text-h4 text-ink-strong mb-4">Judging Criteria</h3>
                  <div className="flex flex-wrap gap-2">
                    {playbook.defaultRubric.map((item: string, i: number) => (
                      <Chip key={i} variant="soft">{item}</Chip>
                    ))}
                  </div>
                </div>

                {/* Action */}
                <Button className="w-full" size="lg" asChild>
                  <Link to={ROUTES.SITUATION}>Use this playbook</Link>
                </Button>
                <p className="text-sm text-ink-muted text-center mt-4">
                  Requires sign in. You can customize rules later.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <LandingFooter />
    </div>
  );
}
