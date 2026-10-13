import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useReducedMotion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { useHome } from '@/features/home/hooks/use-home';
import { useOverlay } from '@/app/providers/overlay-store';
import { recordTourHotspot } from '../api';
import type { SpotlightStep } from './types';
import { getHomeTourSteps } from './home-steps';
import { useSpotlightStore } from './spotlight-store';
import { useTargetRect, calculatePlacement, findTargetElement } from './target-tracker';
import { CutoutMask } from './CutoutMask';
import { GhostCursor } from './GhostCursor';
import { CoachCard } from './CoachCard';

interface SpotlightTourProps {
  steps?: SpotlightStep[];
}

export function SpotlightTour({ steps: propSteps }: SpotlightTourProps) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: homeData } = useHome();
  const prefersReduced = useReducedMotion();
  const isReducedMotion = Boolean(prefersReduced);

  const {
    isActive,
    steps,
    currentStepIndex,
    showConfirmSkip,
    startTour,
    endTour,
    nextStep,
    prevStep,
    setConfirmSkip,
  } = useSpotlightStore();

  const createRoomModal = useOverlay('create-room-dialog');
  const joinCodeModal = useOverlay('join-code-dialog');

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const previouslyFocusedEl = useRef<HTMLElement | null>(null);

  // Resize listener for mobile viewport check
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Finish or skip handler — purely closes tour without writing tour status
  const handleComplete = useCallback((_persist?: boolean) => {
    endTour();
    if (previouslyFocusedEl.current) {
      previouslyFocusedEl.current.focus();
    }
  }, [endTour]);

  // If propSteps passed explicitly, initialize tour
  useEffect(() => {
    if (propSteps && propSteps.length > 0) {
      startTour(propSteps);
    }
  }, [propSteps, startTour]);

  const currentStep = steps[currentStepIndex];

  // Silently skip steps whose target element is missing or hidden
  useEffect(() => {
    if (!isActive || !currentStep) return;
    if (currentStep.target) {
      const el = findTargetElement(currentStep.target);
      if (!el) {
        // Target missing or hidden on mobile: advance or finish
        if (currentStepIndex < steps.length - 1) {
          nextStep();
        } else {
          handleComplete(true);
        }
      }
    }
  }, [isActive, currentStep, currentStepIndex, steps.length, nextStep, handleComplete]);

  // Track target rect
  const targetRect = useTargetRect(currentStep?.target);

  // Next / Back navigation
  const handleNext = useCallback(() => {
    if (currentStepIndex >= steps.length - 1) {
      handleComplete(true);
    } else {
      nextStep();
    }
  }, [currentStepIndex, steps.length, nextStep, handleComplete]);

  const handleBack = useCallback(() => {
    prevStep();
  }, [prevStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K try-it listener
      if (currentStep?.tryItKey === 'ctrl-k' && (e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        handleNext();
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        // Avoid advancing if pressing Enter on an explicit button
        const target = e.target as HTMLElement;
        if (e.key === 'Enter' && target?.tagName === 'BUTTON' && target?.getAttribute('data-tour-action') !== 'next') {
          return;
        }
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleBack();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setConfirmSkip(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentStep, handleNext, handleBack, setConfirmSkip]);

  if (!isActive || !currentStep) return null;

  const { placement, style: cardStyle } = calculatePlacement(targetRect, 320, 180, isMobile);

  return createPortal(
    <div className="fixed inset-0 z-[80] pointer-events-auto select-none" aria-label="Product Spotlight Tour">
      {/* Screen reader live announcement */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Step {currentStepIndex + 1} of {steps.length}: {currentStep.title}. {currentStep.body}
      </div>

      {/* SVG Dimmed Cutout Mask */}
      <CutoutMask targetRect={targetRect} isReducedMotion={isReducedMotion} />

      {/* Ghost Cursor */}
      <GhostCursor targetRect={targetRect} isReducedMotion={isReducedMotion} isMobile={isMobile} />

      {/* Coach Card */}
      <AnimatePresence mode="wait">
        <CoachCard
          key={currentStepIndex}
          stepIndex={currentStepIndex}
          totalSteps={steps.length}
          step={currentStep}
          placement={placement}
          style={cardStyle}
          isMobile={isMobile}
          isReducedMotion={isReducedMotion}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={() => setConfirmSkip(true)}
          onCreateRoom={() => {
            handleComplete(true);
            createRoomModal.open();
          }}
          onJoinRoom={() => {
            handleComplete(true);
            joinCodeModal.open();
          }}
        />
      </AnimatePresence>

      {/* Confirm Skip Modal */}
      <AnimatePresence>
        {showConfirmSkip && (
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-skip-title"
          >
            <div className="w-full max-w-xs rounded-xl bg-white p-5 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
              <h4 id="confirm-skip-title" className="font-serif text-lg font-normal text-zinc-900 dark:text-zinc-100 mb-2">
                Skip the guided tour?
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-5">
                You can revisit the tour anytime from Settings or the command palette.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmSkip(false)}
                  className="flex-1 rounded-lg border border-zinc-300 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Continue tour
                </button>
                <button
                  type="button"
                  onClick={() => handleComplete(true)}
                  className="flex-1 rounded-lg bg-zinc-900 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Yes, skip
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
}
