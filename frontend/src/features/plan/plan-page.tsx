import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { planService, ideaService, roomService } from '@/services';
import { phaseService } from '@/services/phaseService';
import { boardService } from '@/services/boardService';
import { fetchSettings } from '@/features/prep/api/settings-api';
import { PlanStepper } from './components/plan-stepper';
import { PromptBridgePanel } from './components/prompt-bridge-panel';
import { PlanRightRail } from './components/plan-right-rail';
import { PlanLockedView } from './components/plan-locked-view';
import { Loader2, AlertTriangle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getAiErrorMessage } from '@/design';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { useAiAction } from '@/features/ai-gate';
import { recordTourHotspot } from '@/tour/api';
import { PlanGuideModal } from './components/plan-guide-modal';
import { BeforeWePlan } from './components/before-we-plan';

const PlanPrepareScreen = React.lazy(() =>
  import('./components/plan-prepare-screen').then((m) => ({
    default: m.PlanPrepareScreen,
  }))
);

const BuildPhaseTransitionOverlay = React.lazy(() =>
  import('./components/build-phase-transition-overlay').then((m) => ({
    default: m.BuildPhaseTransitionOverlay,
  }))
);

const STEP_CONFIG = [
  { key: 'prd-mvp', legacyKey: 'prd', title: 'PRD and MVP' },
  { key: 'stack-arch', legacyKey: 'tech', title: 'Tech stack and architecture' },
  { key: 'phases-design', legacyKey: 'phases', title: 'Phases and design' },
  { key: 'demo-qna', legacyKey: 'demo', title: 'Demo and Q&A' },
] as const;

const STEP_KEYS = STEP_CONFIG.map((s) => s.key);

export function PlanPage() {
  const { roomId, id } = useParams<{ roomId?: string; id?: string }>();
  const activeRoomId = roomId || id || '';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forceGuide = searchParams.get('guide') === '1';
  const queryClient = useQueryClient();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnteringBuild, setIsEnteringBuild] = useState(false);
  const [showTransitionOverlay, setShowTransitionOverlay] = useState(false);
  const [transitionCounts, setTransitionCounts] = useState<{ docs: number; tasks: number }>({
    docs: 9,
    tasks: 38,
  });

  const currentUser = useAuthStore((s) => s.user);
  const [isPreparing, setIsPreparing] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const isManualGuideOpenRef = useRef(false);
  const hasTriggeredGuideRef = useRef(false);
  const prepareCheckedRef = useRef(false);

  const { data: plan } = useQuery({
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

  const hasIdeas = Boolean(
    (plan?.contextPack as any)?.ideas?.ready ??
      (plan?.contextPack as any)?.idea?.ok ??
      ((plan?.contextSummary?.approvedIdeas?.length || 0) > 0)
  );
  const hasBrief = Boolean(
    (plan?.contextPack as any)?.rubric?.ready ??
      (plan?.contextPack as any)?.rubric?.ok ??
      Boolean(plan?.contextSummary?.briefStatement || (plan?.contextSummary as any)?.statementPreview)
  );
  const requiredInputsExist = hasIdeas && hasBrief;

  // 1. Lazy step 1 prepare trigger on mount (idempotent; skip loading screen if READY)
  useEffect(() => {
    if (!plan || prepareCheckedRef.current || !activeRoomId) return;
    if (!requiredInputsExist) {
      prepareCheckedRef.current = true;
      setIsPreparing(false);
      return;
    }

    prepareCheckedRef.current = true;
    let active = true;

    async function initPrepare() {
      try {
        const res = await planService.prepareStep(activeRoomId, 1);
        if (!active) return;
        if (res.status === 'READY' || res.status === 'FALLBACK') {
          setIsPreparing(false);
        } else {
          setIsPreparing(true);
        }
      } catch (_) {
        if (!active) return;
        setIsPreparing(false);
      }
    }

    initPrepare();

    return () => {
      active = false;
    };
  }, [plan, activeRoomId, requiredInputsExist]);

  const handlePrepareComplete = () => {
    setIsPreparing(false);
    queryClient.invalidateQueries({ queryKey: ['plan', activeRoomId] });
  };

  const handleOpenAnyway = () => {
    setIsPreparing(false);
  };

  const handlePrepareRetry = async () => {
    try {
      await planService.prepareStep(activeRoomId, 1);
    } catch (_) {
      toast.error('Failed to restart prepare job');
    }
  };

  const stepsList = STEP_CONFIG.map((cfg, index) => {
    let rawVal: any = null;
    if (Array.isArray(plan?.steps)) {
      rawVal = plan.steps.find((s: any) => s.key === cfg.key || s.key === cfg.legacyKey || s.stepKey === cfg.key || s.stepKey === cfg.legacyKey);
    } else if (plan?.steps && typeof plan.steps === 'object') {
      rawVal = (plan.steps as any)[cfg.key] || (plan.steps as any)[cfg.legacyKey];
    }
    return {
      key: cfg.key,
      index: index + 1,
      title: cfg.title,
      status: (rawVal?.validated ? 'validated' : 'upcoming') as 'validated' | 'upcoming',
      answer: rawVal?.answer,
      validated: !!rawVal?.validated,
      errors: rawVal?.issues || [],
      warnings: rawVal?.warnings || [],
      promptText: '',
      expectedFormat: '',
      charCount: (rawVal?.answer || '').length,
      contextFiles: [],
    };
  });

  useEffect(() => {
    if (stepsList.length > 0) {
      const unvalIdx = stepsList.findIndex((s) => !s.validated);
      if (unvalIdx >= 0 && currentStepIndex === 0) {
        setCurrentStepIndex(unvalIdx);
      }
    }
  }, [plan]);

  const currentStepKey = STEP_KEYS[currentStepIndex] || 'prd-mvp';
  const currentStep = stepsList.find((s) => s.key === currentStepKey);

  // Fetch Step Prompt for current active step
  const { data: stepPromptData, isLoading: loadingStepPrompt } = useQuery({
    queryKey: ['plan-prompt', activeRoomId, currentStepIndex + 1],
    queryFn: () => planService.getStepPrompt(activeRoomId, currentStepIndex + 1),
    enabled: Boolean(activeRoomId && !isPreparing),
    staleTime: 60 * 1000,
  });

  // Prefetch step n+1 once 800ms after current step prompt has rendered
  useEffect(() => {
    if (!stepPromptData || stepPromptData.ready === false || currentStepIndex >= STEP_CONFIG.length - 1) return;
    const sessionKey = `prefetch_${activeRoomId}_${currentStepIndex + 1}`;
    if (sessionStorage.getItem(sessionKey)) return;

    const timer = setTimeout(async () => {
      try {
        sessionStorage.setItem(sessionKey, '1');
        await planService.prefetchNext(activeRoomId, currentStepIndex + 1);
      } catch (_) {}
    }, 800);

    return () => clearTimeout(timer);
  }, [stepPromptData, activeRoomId, currentStepIndex]);

  // First-time "How this works" Guide modal trigger (step 1 on first entry)
  useEffect(() => {
    // Must be step 1
    if (currentStepIndex !== 0) return;
    // Must not be in BeforeWePlan
    if (plan?.started === false) return;
    // Prompt panel must have rendered
    if (loadingStepPrompt || !stepPromptData) return;
    // If already triggered or open, return
    if (hasTriggeredGuideRef.current || showGuideModal) return;

    const storageKey = currentUser?.id
      ? `plan_guide_done_v2_${currentUser.id}`
      : 'plan_guide_done_v2_guest';

    const hasSeen = typeof window !== 'undefined' && (
      localStorage.getItem(storageKey) === 'true' ||
      Boolean(currentUser?.hotspotsSeen?.includes('plan_guide_v2'))
    );

    if (!forceGuide && hasSeen) return;

    // Check no tour or other modal is open
    const isTourActive = typeof window !== 'undefined' && (
      sessionStorage.getItem('tour_active') === '1' ||
      Boolean(document.querySelector('[data-tour-active="true"]'))
    );
    if (isTourActive) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let checkInterval: ReturnType<typeof setInterval> | null = null;

    const triggerOpen = () => {
      if (cancelled) return;
      hasTriggeredGuideRef.current = true;
      isManualGuideOpenRef.current = false;
      setShowGuideModal(true);
    };

    if (isPreparing) {
      const startTime = Date.now();
      checkInterval = setInterval(() => {
        if (!isPreparing || Date.now() - startTime >= 3000) {
          if (checkInterval) clearInterval(checkInterval);
          if (timer) clearTimeout(timer);
          setIsPreparing(false);
          triggerOpen();
        }
      }, 100);

      timer = setTimeout(() => {
        if (checkInterval) clearInterval(checkInterval);
        setIsPreparing(false);
        triggerOpen();
      }, 3000);
    } else {
      triggerOpen();
    }

    return () => {
      cancelled = true;
      if (checkInterval) clearInterval(checkInterval);
      if (timer) clearTimeout(timer);
    };
  }, [
    currentStepIndex,
    plan?.started,
    loadingStepPrompt,
    stepPromptData,
    isPreparing,
    currentUser,
    forceGuide,
    showGuideModal,
  ]);

  const handleCloseGuide = () => {
    setShowGuideModal(false);
    const storageKey = currentUser?.id
      ? `plan_guide_done_v2_${currentUser.id}`
      : 'plan_guide_done_v2_guest';
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
      if (currentUser?.id) {
        recordTourHotspot('plan_guide_v2');
      }
    }
  };

  const handleOpenManualGuide = () => {
    isManualGuideOpenRef.current = true;
    setShowGuideModal(true);
  };

  const handleRefreshPrompt = async () => {
    try {
      await planService.refreshStepPrompt(activeRoomId, currentStepIndex + 1);
      queryClient.invalidateQueries({ queryKey: ['plan-prompt', activeRoomId, currentStepIndex + 1] });
    } catch (_) {
      toast.error('Failed to rebuild plan prompt');
    }
  };

  const syncPostPlanData = async () => {
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['room', activeRoomId] }),
        queryClient.invalidateQueries({ queryKey: ['phases', activeRoomId] }),
        queryClient.invalidateQueries({ queryKey: ['tasks', activeRoomId] }),
        queryClient.invalidateQueries({ queryKey: ['board', activeRoomId] }),
        queryClient.invalidateQueries({ queryKey: ['nav-badges', activeRoomId] }),
      ]);

      const [roomData, phasesData] = await Promise.all([
        queryClient.refetchQueries({ queryKey: ['room', activeRoomId] }),
        queryClient.fetchQuery({
          queryKey: ['phases', activeRoomId],
          queryFn: () => phaseService.getPhases(activeRoomId),
        }),
        queryClient.refetchQueries({ queryKey: ['tasks', activeRoomId] }),
      ]);

      const activePhase = (phasesData as any[])?.find((p: any) => p.status === 'ACTIVE') || (phasesData as any[])?.[0];
      if (activePhase) {
        await queryClient.prefetchQuery({
          queryKey: ['phase-prompt', activeRoomId, activePhase.key, 'FRESH'],
          queryFn: () => phaseService.getPhaseTaskPrompt(activeRoomId, activePhase.key, 'FRESH'),
        });
      }
    } catch (e) {
      console.warn('Failed to pre-sync post plan data:', e);
    }
  };

  // Multipart Files Validation handler
  const handleValidateStepFiles = async (files: File[], confirm = false, override = false) => {
    const res = await planService.validateStepFiles(activeRoomId, currentStepIndex + 1, files, confirm, override);
    if (res.ok && (!res.needsConfirmation || confirm)) {
      queryClient.invalidateQueries({ queryKey: ['plan', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['room', activeRoomId] });
      if (currentStepIndex < STEP_CONFIG.length - 1) {
        queryClient.prefetchQuery({
          queryKey: ['plan-prompt', activeRoomId, currentStepIndex + 2],
          queryFn: () => planService.getStepPrompt(activeRoomId, currentStepIndex + 2),
        });
        planService.prefetchNext(activeRoomId, currentStepIndex + 1).catch(() => {});
      }
      if (res.planComplete || currentStepIndex === STEP_CONFIG.length - 1) {
        try {
          await planService.enterBuild(activeRoomId);
        } catch (_) {}
        await syncPostPlanData();
        setTransitionCounts({
          docs: (res.completion as any)?.docs ?? (res.completion as any)?.docsCount ?? plan?.completion?.docsCount ?? 9,
          tasks: (res.completion as any)?.tasks ?? (res.completion as any)?.tasksCount ?? plan?.completion?.tasksCount ?? 0,
        });
      }
    }
    return res;
  };

  // JSON Text Validation handler (used for AI draft)
  const handleValidateStepText = async (text: string, confirm = false) => {
    const res = await planService.validateStepText(activeRoomId, currentStepIndex + 1, text, confirm);
    if (res.ok && (!res.needsConfirmation || confirm)) {
      queryClient.invalidateQueries({ queryKey: ['plan', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['room', activeRoomId] });
      if (currentStepIndex < STEP_CONFIG.length - 1) {
        queryClient.prefetchQuery({
          queryKey: ['plan-prompt', activeRoomId, currentStepIndex + 2],
          queryFn: () => planService.getStepPrompt(activeRoomId, currentStepIndex + 2),
        });
        planService.prefetchNext(activeRoomId, currentStepIndex + 1).catch(() => {});
      }
      if (res.planComplete || currentStepIndex === STEP_CONFIG.length - 1) {
        try {
          await planService.enterBuild(activeRoomId);
        } catch (_) {}
        await syncPostPlanData();
        setTransitionCounts({
          docs: (res.completion as any)?.docs ?? (res.completion as any)?.docsCount ?? plan?.completion?.docsCount ?? 9,
          tasks: (res.completion as any)?.tasks ?? (res.completion as any)?.tasksCount ?? plan?.completion?.tasksCount ?? 0,
        });
      }
    }
    return res;
  };

  const handleStepSuccess = async () => {
    if (currentStepIndex < STEP_CONFIG.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      await syncPostPlanData();
      const storageKey = `plan_transition_${activeRoomId}`;
      if (!sessionStorage.getItem(storageKey)) {
        setShowTransitionOverlay(true);
      } else {
        navigate(`/app/room/${activeRoomId}/board`);
      }
    }
  };

  const { handleAiError } = useAiAction();

  // AI Generate step
  const handleGenerate = async (): Promise<string | void> => {
    setIsGenerating(true);
    try {
      const res = await planService.generateStep(activeRoomId, currentStepKey);
      return res.answer;
    } catch (err: any) {
      handleAiError(err);
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
    } catch (e: any) {
      if (!plan?.planLocked) {
        toast.error(e.message || 'Failed to enter build phase');
        setIsEnteringBuild(false);
        return;
      }
    }

    try {
      await syncPostPlanData();
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
    } catch (_) {
      navigate(`/app/room/${activeRoomId}/board`);
    } finally {
      setIsEnteringBuild(false);
    }
  };

  if (isPreparing) {
    return (
      <React.Suspense fallback={null}>
        <PlanPrepareScreen
          roomId={activeRoomId}
          stepIndex={1}
          onComplete={handlePrepareComplete}
          onOpenAnyway={handleOpenAnyway}
          onRetry={handlePrepareRetry}
        />
      </React.Suspense>
    );
  }

  if (!plan) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted/40 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-96 bg-muted/20 rounded-xl" />
          <div className="h-96 bg-muted/20 rounded-xl" />
        </div>
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
          isLeader={Boolean(
            (plan.permissions as any)?.isLeader ??
            room?.isLeader ??
            (room?.myRole || '').toUpperCase() === 'LEADER'
          )}
        />
        {showTransitionOverlay && (
          <React.Suspense fallback={null}>
            <BuildPhaseTransitionOverlay
              roomId={activeRoomId}
              docsCount={transitionCounts.docs}
              phasesCount={plan?.completion?.phasesCount ?? 5}
              onNavigate={() => navigate(`/app/room/${activeRoomId}/board`)}
              onComplete={() => setShowTransitionOverlay(false)}
            />
          </React.Suspense>
        )}
      </>
    );
  }

  const validatedSteps = stepsList.map((s) => s.validated);

  return (
    <div className="w-full flex flex-col gap-6 p-8 max-w-[1400px] mx-auto font-sans pb-24">
      {/* Header utility bar */}
      <div className="flex items-center justify-end -mb-2">
        <button
          type="button"
          onClick={handleOpenManualGuide}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors cursor-pointer py-1"
        >
          <HelpCircle className="size-3.5" />
          <span>How this works</span>
        </button>
      </div>

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
            key={currentStepIndex}
            stepIndex={currentStepIndex}
            stepId={String(currentStepIndex + 1)}
            stepName={currentStep?.title || 'Plan Step'}
            promptText={stepPromptData?.prompt || currentStep?.promptText || ''}
            mode={stepPromptData?.mode || (currentStep as any)?.mode || 'BALANCED'}
            ideaVerdict={stepPromptData?.ideaVerdict || (currentStep as any)?.ideaVerdict}
            stale={Boolean(stepPromptData?.stale ?? (currentStep as any)?.stale)}
            aiAllowed={aiAllowed}
            isLeader={plan.permissions?.isLeader ?? true}
            analysisState={stepPromptData?.analysisState}
            ready={stepPromptData ? (stepPromptData.ready ?? true) : !loadingStepPrompt}
            outputFiles={stepPromptData?.outputFiles || []}
            bundleName={stepPromptData?.bundleName}
            validatedWithOverrides={(currentStep as any)?.validatedWithOverrides}
            issuesCount={(currentStep as any)?.errors?.length || 0}
            onRefreshPrompt={handleRefreshPrompt}
            onValidateFiles={handleValidateStepFiles}
            onValidateText={handleValidateStepText}
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
                  <span className="text-muted-foreground text-[10px] block">PHASES</span>
                  <span className="font-mono font-bold">{plan.completion.phasesCount ?? 5}</span>
                </div>
              </div>

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

      {/* Build Phase Transition Overlay */}
      {showTransitionOverlay && (
        <React.Suspense fallback={null}>
          <BuildPhaseTransitionOverlay
            roomId={activeRoomId}
            docsCount={transitionCounts.docs}
            phasesCount={plan?.completion?.phasesCount ?? 5}
            onNavigate={() => navigate(`/app/room/${activeRoomId}/board`)}
            onComplete={() => setShowTransitionOverlay(false)}
          />
        </React.Suspense>
      )}

      {/* First-time / Manual Plan Guide Modal */}
      <PlanGuideModal
        isOpen={showGuideModal}
        onClose={handleCloseGuide}
      />
    </div>
  );
}
