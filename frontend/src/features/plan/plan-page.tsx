import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FramedScreen } from '@/components/primitives/framed-screen';
import { SegmentedControl } from '@/components/primitives/segmented-control';
import {
  planService, roomService, briefService, ideaService, getCurrentRole
} from '@/services';
import type { ValidationResult } from '@/services/planService';
import type { Room, Brief, Idea, PlanState } from '@/services/types';
import { PlanStepper } from './components/plan-stepper';
import { PromptBridgePanel } from './components/prompt-bridge-panel';
import { PlanRightRail } from './components/plan-right-rail';
import { AiPolicyGate } from './components/ai-policy-gate';
import { PlanLockedView } from './components/plan-locked-view';
import { generateContextMarkdown } from './utils/context-generator';
import { generateIdeasMarkdown, downloadFile } from '@/features/ideate/utils/markdown-generator';
import { Loader2, AlertCircle, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const STEPS = [
  'PRD & MVP',
  'Tech stack and architecture',
  'Phases',
  'Tasks',
  'Demo & Q&A',
];

const STEP_KEYS: Array<keyof PlanState['steps']> = ['prd', 'tech', 'phases', 'tasks', 'demo'];

export function PlanPage() {
  const { roomId, id } = useParams<{ roomId?: string; id?: string }>();
  const activeRoomId = roomId || id || 'r-1';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState('Prompt Bridge (free)');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(['', '', '', '', '']);
  const [revalidateConfirmOpen, setRevalidateConfirmOpen] = useState(false);
  const [pendingRevalidateStep, setPendingRevalidateStep] = useState<number | null>(null);
  const [isEnteringBuild, setIsEnteringBuild] = useState(false);

  // Queries
  const { data: room, isLoading: loadingRoom } = useQuery({
    queryKey: ['room', activeRoomId],
    queryFn: () => roomService.getRoom(activeRoomId),
  });

  const { data: brief } = useQuery({
    queryKey: ['brief', activeRoomId],
    queryFn: () => briefService.getBrief(activeRoomId),
  });

  const { data: ideas = [] } = useQuery({
    queryKey: ['ideas', activeRoomId],
    queryFn: () => ideaService.listIdeas(activeRoomId),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members', activeRoomId],
    queryFn: () => roomService.getMembers(activeRoomId),
  });

  const { data: planState, isLoading: loadingPlan } = useQuery({
    queryKey: ['planState', activeRoomId],
    queryFn: () => planService.getPlanState(activeRoomId),
  });

  // Approved and primary ideas
  const approvedIdeas = useMemo(() => ideas.filter((i) => i.status === 'approved'), [ideas]);
  const primaryIdea = useMemo(
    () => approvedIdeas.find((i) => i.isPrimary) || approvedIdeas[0] || null,
    [approvedIdeas]
  );

  // Initialize answers and current step from planState
  useEffect(() => {
    if (planState) {
      const loadedAnswers = [
        planState.steps.prd.answer || '',
        planState.steps.tech.answer || '',
        planState.steps.phases.answer || '',
        planState.steps.tasks.answer || '',
        planState.steps.demo.answer || '',
      ];
      setAnswers(loadedAnswers);

      // Find first unvalidated step
      const stepValidated = [
        planState.steps.prd.validated,
        planState.steps.tech.validated,
        planState.steps.phases.validated,
        planState.steps.tasks.validated,
        planState.steps.demo.validated,
      ];

      const firstUnvalidated = stepValidated.findIndex((v) => !v);
      if (firstUnvalidated >= 0) {
        setCurrentStepIndex(firstUnvalidated);
      } else {
        // All validated
        setCurrentStepIndex(5);
      }
    }
  }, [planState]);

  const validatedSteps = useMemo(() => {
    if (!planState) return [false, false, false, false, false];
    return [
      Boolean(planState.steps.prd.validated),
      Boolean(planState.steps.tech.validated),
      Boolean(planState.steps.phases.validated),
      Boolean(planState.steps.tasks.validated),
      Boolean(planState.steps.demo.validated),
    ];
  }, [planState]);

  const isAllComplete = useMemo(() => {
    return validatedSteps.every(Boolean) || room?.stage === 'build';
  }, [validatedSteps, room?.stage]);

  // Dynamic AI Prompts
  const dynamicPrompts = useMemo(() => {
    const projName = room?.name || 'Hackathon OS';
    const ideaText = primaryIdea?.text || primaryIdea?.identity || 'Autonomous developer workspace';

    return [
      `You are an expert product manager. I am building a project called "${projName}".
Project idea: ${ideaText}

Create a comprehensive PRD and MVP specification.
Structure the response STRICTLY in Markdown with the following exact headings in this order:
# PRD
## Problem
## Target user
## One-sentence identity
## Core flow
(Include 3 to 5 numbered items: 1. ..., 2. ..., 3. ...)
## Wow moment
## Must-have features
## Out of scope
# MVP
## The one end-to-end flow
## Real vs mocked
(Include a markdown table with Feature, Implementation, Notes)
## Cut list
(Include at least 3 bullet points starting with -)
## Risks and fallbacks`,

      `You are an expert software architect.
Based on the PRD for "${projName}" (${ideaText}), define the Tech Stack and Architecture.
Output STRICTLY in Markdown with the following structure:
# Tech stack
(Include a Markdown table with at least 4 rows having: Layer | Technology | Rationale | Status. The Status column MUST explicitly state "Known" or "New" for every row.)

# Architecture
(A short explanation paragraph followed by exactly ONE mermaid graph code block using \`\`\`mermaid ... \`\`\`)

# New-tech risks
(Detail the highest technical risks and how you will mitigate them.)`,

      `You are an expert engineering manager. Break down "${projName}" into contiguous hackathon sprint phases.
Output STRICTLY a JSON array of phase objects with this exact schema:
[
  {
    "id": "phase-0",
    "name": "Phase 0: Workspace Scaffolding",
    "startPct": 0,
    "endPct": 20,
    "exitCheckpoint": "Working build and empty mock store",
    "goals": ["Goal 1", "Goal 2"]
  },
  ...
]
Requirements:
1. Provide at least 5 phases.
2. Contiguously cover 0% to 100% (each phase startPct must equal previous endPct).
3. One phase name MUST contain the word "Freeze" (feature freeze).
4. One phase name MUST contain the word "Rehearsal" (pitch rehearsal).
Output only valid JSON.`,

      `You are an expert technical lead. Break down the phases into specific sprint tasks for "${projName}".
Output STRICTLY a JSON array of tasks with this exact schema:
[
  {
    "id": "task-1",
    "title": "Task title",
    "phaseId": "phase-0",
    "role": "Frontend",
    "estimateMin": 60,
    "dependsOn": [],
    "acceptance": "Acceptance criteria",
    "status": "todo"
  },
  ...
]
Requirements:
1. Each task must reference a valid phaseId from the Phases step.
2. dependsOn must only reference other valid task IDs with NO dependency cycles.
3. Realistic time estimates for a hackathon sprint.
Output only valid JSON.`,

      `You are an expert pitch coach. Create a demo script and judge defense pack for "${projName}".
Output STRICTLY in Markdown with the following headers:
# Demo script
(Section with timed subsections e.g. "0 to 15s (15s): Hook", summing strictly between 60 and 120 seconds total.)

# Shot list
(At least 3 numbered shots: 1. ..., 2. ..., 3. ...)

# Likely judge Q&A
(At least 8 Q&A pairs. Must explicitly include:
- "What did you build this weekend?"
- "What breaks first?"
and at least 6 other tough questions with crisp answers.)`,
    ];
  }, [room?.name, primaryIdea]);

  // Downloads
  const handleDownloadIdeas = () => {
    const md = generateIdeasMarkdown(ideas, primaryIdea?.id);
    downloadFile(md, 'ideas.md', 'text/markdown');
    toast.success('Downloaded ideas.md');
  };

  const handleDownloadContext = () => {
    const md = generateContextMarkdown(room, brief, primaryIdea, planState);
    downloadFile(md, 'context.md', 'text/markdown');
    toast.success('Downloaded context.md');
  };

  // Validate handler
  const handleValidateStep = async (content: string): Promise<ValidationResult> => {
    const stepKey = STEP_KEYS[currentStepIndex];
    const result = await planService.validateStep(activeRoomId, stepKey, content);
    if (result.valid) {
      queryClient.invalidateQueries({ queryKey: ['planState', activeRoomId] });
    }
    return result;
  };

  const handleStepSuccess = () => {
    if (currentStepIndex < 4) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Step 5 complete!
      planService.completePlan(activeRoomId).then(() => {
        queryClient.invalidateQueries({ queryKey: ['planState', activeRoomId] });
        queryClient.invalidateQueries({ queryKey: ['room', activeRoomId] });
        setCurrentStepIndex(5);
      });
    }
  };

  const handleSelectStep = (index: number) => {
    // If selecting an already validated step and currentStep is ahead, allow viewing
    setCurrentStepIndex(index);
  };

  // Enter build phase handler
  const handleEnterBuildPhase = async () => {
    setIsEnteringBuild(true);
    try {
      await planService.completePlan(activeRoomId);
      await roomService.enterBuildPhase(activeRoomId);
      sessionStorage.setItem(`hos:build_live:${activeRoomId}`, 'true');
      await queryClient.invalidateQueries({ queryKey: ['room', activeRoomId] });
      await queryClient.invalidateQueries({ queryKey: ['board', activeRoomId] });
      await queryClient.invalidateQueries({ queryKey: ['docs', activeRoomId] });
      await queryClient.invalidateQueries({ queryKey: ['mvp', activeRoomId] });
      toast.success('Build phase unlocked! All sprint tools are active.');
      navigate(`/app/room/${activeRoomId}/board`);
    } catch (e: any) {
      toast.error('Failed to unlock build phase: ' + e.message);
    } finally {
      setIsEnteringBuild(false);
    }
  };

  if (loadingRoom || loadingPlan) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-ink-muted" />
      </div>
    );
  }

  return (
    <FramedScreen title="Plan">
      {/* Soft Gate Banner if no approved ideas */}
      {approvedIdeas.length === 0 && (
        <div className="mb-6 flex items-center justify-between px-4 py-3 rounded-card bg-amber-500/10 border border-amber-500/20 text-ink">
          <div className="flex items-center gap-2 text-caption font-medium text-amber-700 dark:text-amber-400">
            <AlertTriangle className="size-4 shrink-0" />
            <span>
              No approved ideas found. Planning without an approved idea might lead to generic outputs.
            </span>
          </div>
          <Link
            to={`/app/room/${activeRoomId}/ideate`}
            className="text-caption font-semibold text-lav-600 hover:text-lav-700 underline underline-offset-2 flex items-center gap-1"
          >
            Back to Ideation <ChevronRight className="size-3.5" />
          </Link>
        </div>
      )}

      <div className="flex flex-col h-full relative">
        <div className="flex justify-center mb-8">
          <SegmentedControl
            options={['Prompt Bridge (free)', 'Your API key', 'Managed (Pro)']}
            selected={mode}
            onChange={setMode}
          />
        </div>

        <div className="flex flex-1 gap-10 max-w-[1240px] mx-auto w-full">
          {/* Left: Stepper */}
          <div className="w-64 shrink-0 mt-2">
            <PlanStepper
              steps={STEPS}
              currentStep={currentStepIndex}
              validatedSteps={validatedSteps}
              onSelectStep={handleSelectStep}
            />
          </div>

          {/* Center: Main Panel */}
          <div className="flex-1 relative min-w-0">
            <AnimatePresence mode="wait">
              {currentStepIndex < 5 ? (
                <motion.div
                  key={`step-${currentStepIndex}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="w-full h-full"
                >
                  <PromptBridgePanel
                    stepIndex={currentStepIndex}
                    stepId={String(currentStepIndex + 1)}
                    stepName={STEPS[currentStepIndex]}
                    promptText={dynamicPrompts[currentStepIndex]}
                    answer={answers[currentStepIndex] || ''}
                    onAnswerChange={(val) => {
                      const copy = [...answers];
                      copy[currentStepIndex] = val;
                      setAnswers(copy);
                    }}
                    onValidate={handleValidateStep}
                    onSuccess={handleStepSuccess}
                    onDownloadIdeas={handleDownloadIdeas}
                    onDownloadContext={handleDownloadContext}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="locked-view"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full flex"
                >
                  <PlanLockedView
                    roomId={activeRoomId}
                    docsCount={9}
                    tasksCount={38}
                    phasesCount={5}
                    onEnterBuild={handleEnterBuildPhase}
                    isEnteringBuild={isEnteringBuild}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Rail */}
          {currentStepIndex < 5 && (
            <div className="hidden lg:block mt-2">
              <PlanRightRail
                roomId={activeRoomId}
                hasIdeas={approvedIdeas.length > 0}
                ideasCount={approvedIdeas.length}
                hasBrief={Boolean(brief?.confirmed)}
                hasSkills={members.some((m) => Boolean(m.role || m.skills?.length))}
                onDownloadIdeas={handleDownloadIdeas}
                onDownloadContext={handleDownloadContext}
              />
            </div>
          )}
        </div>
      </div>

      {/* Re-validation Warning Dialog */}
      <Dialog open={revalidateConfirmOpen} onOpenChange={setRevalidateConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-validate this step?</DialogTitle>
            <DialogDescription>
              Re-validating will invalidate downstream steps and require checking subsequent answers again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevalidateConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setRevalidateConfirmOpen(false);
                if (pendingRevalidateStep !== null) {
                  // Perform re-validation
                }
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FramedScreen>
  );
}
