import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FramedScreen } from '@/components/primitives/framed-screen';
import { SegmentedControl } from '@/components/primitives/segmented-control';
import { fetchPlanState, validatePlanStep } from '@/api/client';
import { PlanStepper } from './components/plan-stepper';
import { PromptBridgePanel } from './components/prompt-bridge-panel';
import { PlanRightRail } from './components/plan-right-rail';
import { AiPolicyGate } from './components/ai-policy-gate';
import { PlanLockedView } from './components/plan-locked-view';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDraftStore } from '@/app/layout/use-draft-store';

const STEPS = [
  'PRD & MVP',
  'Tech stack and architecture',
  'Phases',
  'Tasks',
  'Demo & Q&A'
];

const PROMPTS = [
  "You are an expert product manager. I am building a project called 'Study Buddy Tinder'. Create a comprehensive PRD and an MVP specification. Structure the response strictly in Markdown format, with `# PRD` and `# MVP` as the main headers.",
  "You are an expert software architect. Based on the PRD for 'Study Buddy Tinder', define the Tech Stack and architecture. Recommend open source libraries where possible. Output strictly in Markdown with `# Tech Stack` as the header.",
  "You are an expert engineering manager. Break down the project into logical Phases. Output strictly in Markdown with `# Phases` as the header.",
  "You are an expert technical lead. Break down the phases into specific Tasks. Output strictly in Markdown with `# Tasks` as the header.",
  "You are an expert pitch coach. Create a demo script and a list of Q&A questions for 'Study Buddy Tinder'. Output strictly in Markdown with `# Demo Script` and `# Risks` as the headers."
];

export function PlanPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [loading, setLoading] = useState(true);
  const [aiRestricted, setAiRestricted] = useState(false);
  const [overrideRestricted, setOverrideRestricted] = useState(false);
  const [mode, setMode] = useState('Prompt Bridge (free)');
  
  const [serverIsComplete, setServerIsComplete] = useState(false);
  
  const currentStep = useDraftStore((s) => s.drafts[roomId || '']?.plan?.currentStep ?? 0);
  const setPlanStep = useDraftStore((s) => s.setPlanStep);

  useEffect(() => {
    if (!roomId) return;
    fetchPlanState(roomId)
      .then((res) => {
        setAiRestricted(res.aiRestricted);
        setServerIsComplete(res.isComplete);
      })
      .finally(() => setLoading(false));
  }, [roomId]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-ink-muted" />
      </div>
    );
  }

  const showGate = aiRestricted && !overrideRestricted;
  const isComplete = serverIsComplete || currentStep === STEPS.length;

  return (
    <FramedScreen title="Plan">
      {showGate && (
        <AiPolicyGate onOverride={() => setOverrideRestricted(true)} />
      )}

      <div className="flex flex-col h-full relative">
        <div className="flex justify-center mb-8">
          <SegmentedControl
            options={['Prompt Bridge (free)', 'Your API key', 'Managed (Pro)']}
            selected={mode}
            onChange={setMode}
          />
        </div>

        <div className="flex flex-1 gap-12 max-w-[1200px] mx-auto w-full">
          {/* Left: Stepper */}
          <div className="w-64 shrink-0 mt-2">
            <PlanStepper steps={STEPS} currentStep={currentStep} />
          </div>

          {/* Center: Main Panel */}
          <div className="flex-1 relative min-w-0">
            <AnimatePresence mode="wait">
              {!isComplete ? (
                <motion.div
                  key={`step-${currentStep}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  <PromptBridgePanel
                    stepId={String(currentStep + 1)}
                    stepName={STEPS[currentStep]}
                    promptText={PROMPTS[currentStep]}
                    onValidate={(content) => validatePlanStep(roomId!, String(currentStep), content)}
                    onSuccess={() => setPlanStep(roomId!, currentStep + 1)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="locked-view"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full flex"
                >
                  <PlanLockedView roomId={roomId!} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Rail */}
          {!isComplete && (
            <div className="hidden lg:block mt-2">
              <PlanRightRail />
            </div>
          )}
        </div>
      </div>
    </FramedScreen>
  );
}
