import { useBrief } from './hooks/use-brief';
import { SourceTextPanel } from './components/source-text-panel';
import { Card } from '@/components/ui/card';
import { ChecklistRow } from '@/components/primitives/checklist-row';
import { DetailRow } from '@/components/primitives/detail-row';
import { DashedContainer } from '@/components/primitives/dashed-container';
import { Dropzone } from '@/components/primitives/dropzone';
import { Banner } from '@/components/primitives/banner';
import { DarkCallout } from '@/components/primitives/dark-callout';
import { Chip } from '@/components/primitives/chip';

import { ProgressBar } from '@/components/primitives/progress-bar';
import { Button } from '@/components/ui/button';
import { ExternalLink, CircleDot } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export function BriefPage() {
  const { data, isLoading } = useBrief('r-1'); // Hardcoded for this phase
  const queryClient = useQueryClient();

  const isLeader = true; // Hardcoded mock role for this phase

  if (isLoading) {
    return <div className="p-8 text-ink-muted">Loading Brief...</div>;
  }

  // Empty state / Import
  if (!data || !data.sourceText) {
    return (
      <div className="max-w-2xl mx-auto py-12 flex flex-col gap-6">
        <h1 className="text-h1">Brief</h1>
        <p className="text-body text-ink-muted">
          Every rule, deadline, and criterion in one confirmed place.
        </p>
        
        <Dropzone>
          <h3 className="text-h2">Paste the event page text</h3>
          <p className="text-body text-ink-muted">We'll extract the rules and deadlines automatically.</p>
          <div className="mt-4"><Button variant="outline" disabled={!isLeader}>Enter manually</Button></div>
        </Dropzone>
      </div>
    );
  }

  const handleConfirmItem = (id: string, current: boolean) => {
    if (!isLeader) return;
    // Optimistic update mock
    queryClient.setQueryData(['brief', 'r-1'], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        rulesChecklist: old.rulesChecklist.map((item: any) => 
          item.id === id ? { ...item, isConfirmed: !current } : item
        )
      };
    });
  };

  const handleConfirmAll = () => {
    if (!isLeader) return;
    queryClient.setQueryData(['brief', 'r-1'], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        rulesChecklist: old.rulesChecklist.map((item: any) => ({ ...item, isConfirmed: true })),
        confirmedCount: old.totalExtracts
      };
    });
  };

  const scrollToSpan = (spanId: string) => {
    const el = document.getElementById(spanId);
    if (el) {
      el.scrollIntoView({ behavior: 'auto', block: 'center' }); // No smooth scroll per pattern check
    }
  };

  // Re-calculate confirmed count from checklist
  const confirmedItemsCount = data.rulesChecklist.filter(r => r.isConfirmed).length;
  const isRulesChanged = !!data.rulesChangedEvent;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
      {/* Left Panel: Extracted Elements */}
      <div className="flex flex-col gap-6 overflow-y-auto pr-2 pb-12">
        {isRulesChanged && data.rulesChangedEvent && (
          <Banner variant="warning" className="animate-in slide-in-from-top-2 fade-in duration-200">
            Rules changed on {data.rulesChangedEvent.dateStr}. Review {data.rulesChangedEvent.itemsToReviewCount} items.
          </Banner>
        )}

        <div className="flex flex-col gap-2">
          <h2 className="text-h2">Problem Statement</h2>
          <Card className="p-4 bg-surface-raised border-stroke-base">
            <p className="text-body text-ink">{data.problemStatement.text}</p>
            {data.problemStatement.sourceUrl && (
              <button 
                onClick={() => scrollToSpan(data.problemStatement.sourceUrl!.replace('#', ''))}
                className="mt-3 flex items-center gap-1 text-caption font-bold text-ink-muted hover:text-ink transition-colors"
              >
                Source <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-h2">Rubric</h2>
          <Card className="p-4 flex flex-col gap-4 bg-surface-raised border-stroke-base">
            {data.rubric.map(criterion => (
              <div key={criterion.id} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-body font-bold text-ink">
                  <span>{criterion.name}</span>
                  <span>{criterion.weightPercent}%</span>
                </div>
                <ProgressBar value={criterion.weightPercent} className="h-2 bg-pastel-sky/30" />
              </div>
            ))}
          </Card>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-h2">Rules Checklist</h2>
          <DashedContainer className="flex flex-col gap-3 p-4">
            {data.rulesChecklist.map(item => (
              <div key={item.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  {!item.isConfirmed && (
                    <Chip fill="sun" className="text-ink">
                      {isLeader ? 'Unconfirmed' : 'Waiting for leader to confirm'}
                    </Chip>
                  )}
                  <button 
                    onClick={() => scrollToSpan(item.sourceSpanId)}
                    className="flex items-center gap-1 text-caption font-bold text-ink-muted hover:text-ink transition-colors ml-auto"
                  >
                    Source <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
                <ChecklistRow 
                  title={item.title} 
                  metaTime={item.metaTime} 
                  metaPlace={item.metaPlace}
                  checked={item.isConfirmed}
                  onCheckedChange={() => handleConfirmItem(item.id, item.isConfirmed)}
                  className={!isLeader ? 'opacity-50 pointer-events-none' : ''}
                />
              </div>
            ))}
          </DashedContainer>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-h2">Deadlines</h2>
          <div className="flex flex-col gap-3">
            {data.deadlines.map(deadline => (
              <DetailRow 
                key={deadline.id}
                label={deadline.label}
                value={
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-surface-sunken px-2 py-0.5 rounded">{deadline.timeText}</span>
                    <span className="text-ink-muted text-caption">{deadline.timezone}</span>
                  </div>
                }
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-h2">Eligibility</h2>
          <div className="flex flex-col gap-3">
            {data.eligibility.map(elig => (
              <DetailRow 
                key={elig.id}
                label={elig.label}
                value={elig.status}
                leading={<CircleDot className="h-4 w-4" />}
                status={
                  <Chip fill={elig.status === 'Pass' ? 'lime' : elig.status === 'Fail' ? 'coral' : 'sun'}>
                    {elig.status}
                  </Chip>
                }
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-h2">Tracks & Prizes</h2>
          <div className="grid grid-cols-2 gap-4">
            {data.tracks.map(track => (
              <Card 
                key={track.id} 
                className="p-4 flex flex-col gap-2 rounded-card shadow-e0 border-none"
                style={{ backgroundColor: track.pastelFill }}
              >
                <h3 className="text-h3 text-ink">{track.name}</h3>
                <p className="text-body text-ink/80">{track.description}</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-h2">Format</h2>
          <DetailRow 
            label="Profile"
            value={data.formatProfile}
          />
        </div>

        <DarkCallout 
          title="AI-use policy" 
          description={data.aiPolicyText} 
          buttonLabel="Read policy"
        />
      </div>

      {/* Right Panel: Source Text */}
      <div className="h-full pb-12">
        <SourceTextPanel 
          sourceText={data.sourceText}
          extractedSpans={data.extractedSpans}
          confirmedCount={confirmedItemsCount}
          totalExtracts={data.totalExtracts}
          onConfirmAll={handleConfirmAll}
          isLeader={isLeader}
        />
      </div>
    </div>
  );
}
