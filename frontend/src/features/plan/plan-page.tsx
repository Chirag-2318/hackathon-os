import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planService, ideaService, roomService } from '@/services';
import type { PlanData } from '@/services/types';
import { fetchSettings } from '@/features/prep/api/settings-api';
import { PlanStepper } from './components/plan-stepper';
import { PromptBridgePanel } from './components/prompt-bridge-panel';
import { PlanRightRail } from './components/plan-right-rail';
import { PlanLockedView } from './components/plan-locked-view';
import { Loader2, AlertCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ApiError } from '@/lib/apiClient';
import { getAiErrorMessage } from '@/design';

import { BeforeWePlan } from './components/before-we-plan';

const BuildPhaseTransitionOverlay = React.lazy(() =>
  import('./components/build-phase-transition-overlay').then((m) => ({
    default: m.BuildPhaseTransitionOverlay,
  }))
);

const STEP_KEYS = ['prd', 'tech', 'phases', 'tasks', 'demo'] as const;

export function PlanPage() {
  const { roomId, id } = useParams<{ roomId?: string; id?: string }>();
  const activeRoomId = roomId || id || '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(['', '', '', '', '']);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [clearedStepsList, setClearedStepsList] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnteringBuild, setIsEnteringBuild] = useState(false);
  const [showTransitionOverlay, setShowTransitionOverlay] = useState(false);
  const [transitionCounts, setTransitionCounts] = useState<{ docs: number; tasks: number }>({
    docs: 9,
    tasks: 38,
  });
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: plan, isLoading: loadingPlan } = useQuery({
    queryKey: ['plan', activeRoomId],
    queryFn: () => planService.getPlan(activeRoomId),
    enabled: Boolean(activeRoomId),
  });

  const { data: room } = useQuery({
    queryKey: ['room', activeRoomId],
    queryFn: () => roomService.getRoom(activeRoomId),
    enabled: Boolean(activeRoomId),
  });

  const aiAllowed = (room as any)?.aiAllowed ?? true;

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  const hasApiKey = (settings?.aiAndKeys?.providers?.length || 0) > 0;

  const handleRefreshPrompt = async () => {
    try {
      await planService.refreshStepPrompt(activeRoomId, currentStepIndex + 1);
      queryClient.invalidateQueries({ queryKey: ['plan', activeRoomId] });
    } catch (e: any) {
      toast.error('Failed to refresh prompt');
    }
  };

  const stepsList = Array.isArray(plan?.steps)
    ? plan.steps
    : (plan?.steps && typeof plan.steps === 'object')
    ? Object.entries(plan.steps).map(([key, val]: [string, any], index) => ({
        key,
        index: index + 1,
        title: {
          prd: 'PRD and MVP',
          tech: 'Tech stack and architecture',
          phases: 'Phases and design',
          tasks: 'Tasks',
          demo: 'Demo and Q&A',
        }[key.toLowerCase()] || key.toUpperCase(),
        status: (val?.validated ? 'validated' : 'upcoming') as 'validated' | 'upcoming',
        answer: val?.answer,
        validated: !!val?.validated,
        errors: val?.issues || [],
        warnings: val?.warnings || [],
        promptText: '',
        expectedFormat: '',
        charCount: (val?.answer || '').length,
        contextFiles: [],
      }))
    : [];

  useEffect(() => {
    if (stepsList.length > 0) {
      const loaded = STEP_KEYS.map((k) => {
        const found = stepsList.find((s) => s.key === k);
        return found?.answer || '';
      });
      setAnswers(loaded);

      // Default to first unvalidated step
      const unvalIdx = stepsList.findIndex((s) => !s.validated);
      if (unvalIdx >= 0 && currentStepIndex === 0) {
        setCurrentStepIndex(unvalIdx);
      }
    }
  }, [plan]);

  const currentStepKey = STEP_KEYS[currentStepIndex] || 'prd';
  const currentStep = stepsList.find((s) => s.key === currentStepKey);

  // Autosave Draft
  const handleAnswerChange = (val: string) => {
    const updated = [...answers];
    updated[currentStepIndex] = val;
    setAnswers(updated);

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(async () => {
      try {
        await planService.saveStepDraft(activeRoomId, currentStepKey, val, false);
      } catch (err: any) {
        if (err instanceof ApiError && err.code === 'CONFIRM_REQUIRED') {
          const later = Array.isArray(err.details) ? err.details : ['subsequent steps'];
          setClearedStepsList(later);
          setConfirmClearOpen(true);
        }
      }
    }, 800);
  };

  const handleConfirmClear = async () => {
    try {
      await planService.saveStepDraft(activeRoomId, currentStepKey, answers[currentStepIndex], true);
      setConfirmClearOpen(false);
      queryClient.invalidateQueries({ queryKey: ['plan', activeRoomId] });
      toast.info('Subsequent steps cleared. Please re-validate in sequence.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to update step');
    }
  };

  // Validate handler
  const handleValidateStep = async (content: string) => {
    const res = await planService.validateStep(activeRoomId, currentStepKey, content);
    if (res.valid) {
      queryClient.invalidateQueries({ queryKey: ['plan', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['room', activeRoomId] });
      if (res.planComplete || currentStepIndex === 4) {
        try {
          await planService.enterBuild(activeRoomId);
        } catch (_) {}
        queryClient.invalidateQueries({ queryKey: ['room', activeRoomId] });
        queryClient.invalidateQueries({ queryKey: ['nav-badges', activeRoomId] });
        setTransitionCounts({
          docs: (res.completion as any)?.docs ?? (res.completion as any)?.docsCount ?? plan?.completion?.docsCount ?? 9,
          tasks: (res.completion as any)?.tasks ?? (res.completion as any)?.tasksCount ?? plan?.completion?.tasksCount ?? 38,
        });
      }
    }
    return res;
  };

  const handleStepSuccess = () => {
    if (currentStepIndex < 4) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      queryClient.invalidateQueries({ queryKey: ['plan', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['room', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['plan-state', activeRoomId] });
      const storageKey = `plan_transition_${activeRoomId}`;
      if (!sessionStorage.getItem(storageKey)) {
        setShowTransitionOverlay(true);
      } else {
        navigate(`/app/room/${activeRoomId}/board`);
      }
    }
  };

  // AI Generate
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await planService.generateStep(activeRoomId, currentStepKey);
      if (res.answer) {
        handleAnswerChange(res.answer);
        toast.success(`Generated answer for ${currentStep?.title || currentStepKey}`);
      }
    } catch (err: any) {
      const mappedMsg = getAiErrorMessage(err?.code, err?.message || 'AI generation failed');
      toast.error(mappedMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnterBuild = async () => {
    setIsEnteringBuild(true);
    try {
      await planService.enterBuild(activeRoomId);
      const storageKey = `plan_transition_${activeRoomId}`;
      if (!sessionStorage.getItem(storageKey)) {
        setTransitionCounts({
          docs: plan?.completion?.docsCount ?? (plan?.completion as any)?.docs ?? 9,
          tasks: plan?.completion?.tasksCount ?? (plan?.completion as any)?.tasks ?? 38,
        });
        setShowTransitionOverlay(true);
      } else {
        navigate(`/app/room/${activeRoomId}/board`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to enter build phase');
    } finally {
      setIsEnteringBuild(false);
    }
  };

  if (loadingPlan || !plan) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (plan.started === false) {
    return (
      <BeforeWePlan
        roomId={activeRoomId}
        contextSummary={plan.contextSummary}
        initialNotes={plan.notes || ''}
        onPlanStarted={() => {
          queryClient.invalidateQueries({ queryKey: ['plan', activeRoomId] });
        }}
      />
    );
  }

  if (plan.planLocked) {
    return (
      <>
        <PlanLockedView
          roomId={activeRoomId}
          docsCount={plan?.completion?.docsCount ?? transitionCounts.docs}
          tasksCount={plan?.completion?.tasksCount ?? transitionCounts.tasks}
          phasesCount={plan?.completion?.phasesCount ?? 5}
          onEnterBuild={handleEnterBuild}
          isEnteringBuild={isEnteringBuild}
          isLeader={plan.permissions?.isLeader ?? true}
        />
        {showTransitionOverlay && (
          <React.Suspense fallback={null}>
            <BuildPhaseTransitionOverlay
              roomId={activeRoomId}
              docsCount={transitionCounts.docs}
              tasksCount={transitionCounts.tasks}
              onNavigate={() => navigate(`/app/room/${activeRoomId}/board`)}
              onComplete={() => setShowTransitionOverlay(false)}
            />
          </React.Suspense>
        )}
      </>
    );
  }

  const validatedSteps = stepsList.map((s) => s.validated);
  const isAllComplete = validatedSteps.every(Boolean);

  return (
    <div className="w-full flex flex-col gap-6 p-8 max-w-[1400px] mx-auto font-sans pb-24">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Stepper Rail */}
        <div className="w-56 shrink-0 pt-2">
          <PlanStepper
            steps={stepsList.map((s) => s.title)}
            currentStep={currentStepIndex}
            validatedSteps={validatedSteps}
            onSelectStep={(idx) => setCurrentStepIndex(idx)}
          />
        </div>

        {/* Main Step Interaction Panel */}
        <div className="flex-1 min-w-0">
          <PromptBridgePanel
            stepIndex={currentStepIndex}
            stepId={String(currentStepIndex + 1)}
            stepName={currentStep?.title || 'Plan Step'}
            promptText={currentStep?.promptText || ''}
            answer={answers[currentStepIndex] || ''}
            mode={(currentStep as any)?.mode || 'BALANCED'}
            ideaVerdict={(currentStep as any)?.ideaVerdict}
            stale={Boolean((currentStep as any)?.stale)}
            aiAllowed={aiAllowed}
            onRefreshPrompt={handleRefreshPrompt}
            onAnswerChange={handleAnswerChange}
            onValidate={handleValidateStep}
            onSuccess={handleStepSuccess}
            onDownloadIdeas={() => ideaService.exportIdeasMarkdown(activeRoomId)}
            onDownloadContext={() => planService.downloadContext(activeRoomId, currentStepKey)}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            hasApiKey={hasApiKey}
          />
        </div>

        {/* Right Rail Context & Completion */}
        <div className="flex flex-col gap-6 w-72 shrink-0">
          <PlanRightRail
            roomId={activeRoomId}
            hasIdeas={Boolean((plan?.contextPack as any)?.ideas?.ready ?? (plan?.contextPack as any)?.idea?.ok ?? false)}
            ideasCount={Number((plan?.contextPack as any)?.ideas?.count ?? (plan?.contextPack as any)?.idea?.approvedCount ?? 0)}
            hasBrief={Boolean((plan?.contextPack as any)?.rubric?.ready ?? (plan?.contextPack as any)?.rubric?.ok ?? false)}
            hasSkills={Boolean((plan?.contextPack as any)?.skills?.ready ?? (plan?.contextPack as any)?.skills?.ok ?? false)}
            hasNotes={Boolean((plan?.contextPack as any)?.notes?.ok ?? !!plan?.planNotes)}
            membersCount={(plan?.contextPack as any)?.skills?.totalMembers || 1}
            isLeader={Boolean((plan?.permissions as any)?.canEnterBuild ?? true)}
            onDownloadIdeas={() => ideaService.exportIdeasMarkdown(activeRoomId)}
            onDownloadContext={() => planService.downloadContext(activeRoomId, currentStepKey)}
          />

          {/* Completion Summary Card */}
          {plan?.completion && (
            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Workspace Ready</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-muted/40">
                  <span className="text-muted-foreground text-[10px] block">DOCS</span>
                  <span className="font-mono font-bold">{plan.completion.docsCount}</span>
                </div>
                <div className="p-2 rounded-lg bg-muted/40">
                  <span className="text-muted-foreground text-[10px] block">TASKS</span>
                  <span className="font-mono font-bold">{plan.completion.tasksCount}</span>
                </div>
              </div>

              {(plan.completion.unassignedTasksCount || 0) > 0 && (
                <p className="text-[11px] text-amber-600 flex items-center gap-1 font-medium">
                  <AlertTriangle className="size-3 shrink-0" />
                  {plan.completion.unassignedTasksCount} task{plan.completion.unassignedTasksCount > 1 ? 's' : ''} need an owner
                </p>
              )}

              {plan?.permissions?.canEnterBuild && (
                <Button
                  onClick={handleEnterBuild}
                  disabled={isEnteringBuild}
                  className="w-full text-xs font-semibold h-9 mt-1"
                >
                  {isEnteringBuild ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
                  Enter Build Phase &rarr;
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog on Editing Validated Step */}
      <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-600" /> Confirm Step Modification
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Modifying this validated step will invalidate and clear subsequent steps:
              <span className="font-semibold text-foreground block mt-1">
                {clearedStepsList.join(', ')}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button variant="ghost" size="sm" onClick={() => setConfirmClearOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmClear} className="text-xs">
              Clear & Save Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Build Phase Transition Overlay */}
      {showTransitionOverlay && (
        <React.Suspense fallback={null}>
          <BuildPhaseTransitionOverlay
            roomId={activeRoomId}
            docsCount={transitionCounts.docs}
            tasksCount={transitionCounts.tasks}
            onNavigate={() => navigate(`/app/room/${activeRoomId}/board`)}
            onComplete={() => setShowTransitionOverlay(false)}
          />
        </React.Suspense>
      )}
    </div>
  );
}
