import { PageContainer, PageHeading } from '@/shared/ui';

export function PlaybooksView() {
  return (
    <div data-testid="pb-page">
      <PageContainer>
        <PageHeading
          title="Playbooks"
          subtitle="Ready-made hackathon flows. Pick one and your room starts with its phases, checkpoints and deliverables."
          titleTestId="pb-title"
          subtitleTestId="pb-subtitle"
        />
        <div data-testid="pb-grid" className="py-4">
          {/* Will be populated in R3-3 */}
        </div>
      </PageContainer>
    </div>
  );
}
