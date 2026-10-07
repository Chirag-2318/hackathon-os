import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stepper } from '@/components/primitives/stepper';
import { Chip } from '@/components/primitives/chip';
import { useIdeate } from './hooks/use-ideate';
import { SoloStage } from './components/solo-stage';
import { RevealStage } from './components/reveal-stage';
import { ResearchStage } from './components/research-stage';
import { CritiqueStage } from './components/critique-stage';
import { StressTestStage } from './components/stress-test-stage';
import { VoteStage } from './components/vote-stage';
import { DecideStage } from './components/decide-stage';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDraftStore } from '@/app/layout/use-draft-store';

const STAGES = [
  { label: 'Solo' },
  { label: 'Reveal' },
  { label: 'Research' },
  { label: 'Critique' },
  { label: 'Stress test' },
  { label: 'Vote' },
  { label: 'Decide' },
];

export function IdeatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const roomId = id!;
  const { data: ideateData, isLoading } = useIdeate(roomId);

  const currentStepIndex = useDraftStore((s) => s.drafts[roomId]?.ideate?.currentStepIndex ?? 0);
  const setIdeateStep = useDraftStore((s) => s.setIdeateStep);

  if (isLoading || !ideateData) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-ink-muted" />
      </div>
    );
  }

  // Next stage handler for the leader
  const handleNextStage = () => {
    if (currentStepIndex < STAGES.length - 1) {
      setIdeateStep(roomId, currentStepIndex + 1);
    }
  };

  const handleContinueToPlan = () => {
    navigate(`/app/room/${id}/plan`);
  };

  const currentStageName = STAGES[currentStepIndex].label;

  return (
    <div className="flex h-full w-full">
        {/* Main Content Area */}
        <div className="flex flex-1 flex-col h-full bg-surface">
          {/* Top Bar with Stepper */}
          <div className="flex items-center justify-between border-b border-border p-4 h-20">
            <div className="flex-1 max-w-3xl">
              <Stepper steps={STAGES} currentStep={currentStepIndex} />
            </div>
            
            {/* Leader Controls (Demo only) */}
            <div className="ml-8 flex items-center gap-4">
              <span className="text-sm text-ink-muted">Leader actions:</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNextStage}
                disabled={currentStepIndex === STAGES.length - 1}
              >
                Advance Stage
              </Button>
            </div>
          </div>

          {/* Stage Content */}
          <div className="flex-1 overflow-auto p-6 relative">
            {currentStageName === 'Solo' && <SoloStage data={ideateData} />}
            {currentStageName === 'Reveal' && <RevealStage data={ideateData} />}
            {currentStageName === 'Research' && <ResearchStage data={ideateData} />}
            {currentStageName === 'Critique' && <CritiqueStage data={ideateData} />}
            {currentStageName === 'Stress test' && <StressTestStage data={ideateData} />}
            {currentStageName === 'Vote' && <VoteStage data={ideateData} />}
            {currentStageName === 'Decide' && <DecideStage data={ideateData} onContinue={handleContinueToPlan} />}
          </div>
        </div>

        {/* Persistent Right Rail */}
        <div className="w-80 border-l border-border bg-surface flex flex-col h-full shrink-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-ink">Rubric</h3>
            <Chip color="peach">Phase 3</Chip>
          </div>
          <div className="p-4 flex-1 overflow-auto space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Innovation</span>
                <span className="text-ink-muted">30%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Execution</span>
                <span className="text-ink-muted">40%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">UI/UX</span>
                <span className="text-ink-muted">30%</span>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <h4 className="text-sm font-semibold mb-3">Presence</h4>
              <div className="flex flex-col gap-2">
                {/* Mock Presence */}
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-pastel-yellow flex items-center justify-center text-xs font-bold text-ink">AM</div>
                  <span className="text-sm">Aarav (Leader)</span>
                  <div className="ml-auto size-2 rounded-full bg-success-fill" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-pastel-sky flex items-center justify-center text-xs font-bold text-ink">IR</div>
                  <span className="text-sm">Ishita</span>
                  <div className="ml-auto size-2 rounded-full bg-success-fill" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-surface-sunken flex items-center justify-center text-xs font-bold text-ink-muted">KN</div>
                  <span className="text-sm text-ink-muted">Kabir</span>
                  <div className="ml-auto size-2 rounded-full bg-ink-muted" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <h4 className="text-sm font-semibold mb-3">Stage Timer</h4>
              <div className="bg-surface-sunken rounded-md p-3 text-center">
                <span className="text-2xl font-mono font-bold tracking-tight">04:59</span>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
