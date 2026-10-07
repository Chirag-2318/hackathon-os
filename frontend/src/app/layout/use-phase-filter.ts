/**
 * Phase filter — exposed state for Phase Track click-to-filter
 * Source: PRD §3.4
 *
 * Clicking a phase pill filters Board and Plan screens to that phase.
 * Does NOT navigate. Exposes selectedPhase for later screens to consume.
 */
import { create } from 'zustand';

export type PhaseId =
  | 'prep'
  | 'ideate'
  | 'plan'
  | 'build'
  | 'freeze'
  | 'ship'
  | 'retro';

interface PhaseFilterState {
  /** Currently selected phase filter, null = no filter (show all) */
  selectedPhase: PhaseId | null;
  /** Set filter to a specific phase */
  setSelectedPhase: (phase: PhaseId) => void;
  /** Clear the filter (show all) */
  clearPhaseFilter: () => void;
  /** Toggle: if already selected, clear; otherwise set */
  togglePhase: (phase: PhaseId) => void;
}

export const usePhaseFilterStore = create<PhaseFilterState>((set, get) => ({
  selectedPhase: null,

  setSelectedPhase: (phase) => set({ selectedPhase: phase }),

  clearPhaseFilter: () => set({ selectedPhase: null }),

  togglePhase: (phase) => {
    const current = get().selectedPhase;
    set({ selectedPhase: current === phase ? null : phase });
  },
}));
