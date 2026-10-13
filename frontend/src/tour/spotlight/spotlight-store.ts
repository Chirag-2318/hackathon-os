import { create } from 'zustand';
import type { SpotlightStep } from './types';

interface SpotlightState {
  isActive: boolean;
  steps: SpotlightStep[];
  currentStepIndex: number;
  showConfirmSkip: boolean;
  startTour: (steps: SpotlightStep[]) => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  setConfirmSkip: (show: boolean) => void;
  skipTour: () => void;
}

export const useSpotlightStore = create<SpotlightState>((set) => ({
  isActive: false,
  steps: [],
  currentStepIndex: 0,
  showConfirmSkip: false,

  startTour: (steps) =>
    set({
      isActive: true,
      steps,
      currentStepIndex: 0,
      showConfirmSkip: false,
    }),

  endTour: () =>
    set({
      isActive: false,
      steps: [],
      currentStepIndex: 0,
      showConfirmSkip: false,
    }),

  nextStep: () =>
    set((state) => ({
      currentStepIndex: Math.min(state.currentStepIndex + 1, state.steps.length - 1),
    })),

  prevStep: () =>
    set((state) => ({
      currentStepIndex: Math.max(state.currentStepIndex - 1, 0),
    })),

  setConfirmSkip: (show) =>
    set({
      showConfirmSkip: show,
    }),

  skipTour: () =>
    set({
      isActive: false,
      steps: [],
      currentStepIndex: 0,
      showConfirmSkip: false,
    }),
}));
