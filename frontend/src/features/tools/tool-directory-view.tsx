import { PageContainer, PageHeading } from '@/shared/ui';

export function ToolDirectoryView() {
  return (
    <div data-testid="tool-page">
      <PageContainer>
        <PageHeading
          title="Tool directory"
          subtitle="Tools hackathon teams actually use. Every tool shows when it was last checked."
          titleTestId="tool-title"
        />
        <div data-testid="tool-grid" className="py-4">
          {/* Will be populated in R3-5 */}
        </div>
      </PageContainer>
    </div>
  );
}
