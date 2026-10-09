import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface IdeateDraft {
  currentStepIndex: number;
}

interface PlanDraft {
  currentStep: number;
  answers: Record<string, string>; // stepId -> answer
}

interface DiagramDraft {
  code: string;
}

interface PitchDraft {
  activeTab: string;
  selectedSlideId: string | null;
}

interface RoomDrafts {
  ideate?: IdeateDraft;
  plan?: PlanDraft;
  diagram?: DiagramDraft;
  pitch?: PitchDraft;
}

interface DraftStore {
  // Keyed by roomId to prevent cross-room contamination
  drafts: Record<string, RoomDrafts>;

  // Ideate
  setIdeateStep: (roomId: string, stepIndex: number) => void;
  
  // Plan
  setPlanStep: (roomId: string, stepIndex: number) => void;
  setPlanAnswer: (roomId: string, stepId: string, answer: string) => void;
  
  // Diagram
  setDiagramCode: (roomId: string, code: string) => void;
  
  // Pitch
  setPitchTab: (roomId: string, tab: string) => void;
  setPitchSlide: (roomId: string, slideId: string | null) => void;
}

export const DEFAULT_DIAGRAM_CODE = 'graph TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[Result 1]\n  B -->|No| D[Result 2]';

export const useDraftStore = create<DraftStore>()(
  persist(
    (set) => ({
      drafts: {},
      
      setIdeateStep: (roomId, stepIndex) => set((state) => ({
        drafts: {
          ...state.drafts,
          [roomId]: {
            ...state.drafts[roomId],
            ideate: {
              ...state.drafts[roomId]?.ideate,
              currentStepIndex: stepIndex,
            }
          }
        }
      })),

      setPlanStep: (roomId, stepIndex) => set((state) => ({
        drafts: {
          ...state.drafts,
          [roomId]: {
            ...state.drafts[roomId],
            plan: {
              answers: {},
              ...state.drafts[roomId]?.plan,
              currentStep: stepIndex,
            }
          }
        }
      })),

      setPlanAnswer: (roomId, stepId, answer) => set((state) => {
        const planDraft = state.drafts[roomId]?.plan || { currentStep: 0, answers: {} };
        return {
          drafts: {
            ...state.drafts,
            [roomId]: {
              ...state.drafts[roomId],
              plan: {
                ...planDraft,
                answers: {
                  ...planDraft.answers,
                  [stepId]: answer,
                }
              }
            }
          }
        };
      }),

      setDiagramCode: (roomId, code) => set((state) => ({
        drafts: {
          ...state.drafts,
          [roomId]: {
            ...state.drafts[roomId],
            diagram: {
              ...state.drafts[roomId]?.diagram,
              code,
            }
          }
        }
      })),

      setPitchTab: (roomId, tab) => set((state) => ({
        drafts: {
          ...state.drafts,
          [roomId]: {
            ...state.drafts[roomId],
            pitch: {
              selectedSlideId: null,
              ...state.drafts[roomId]?.pitch,
              activeTab: tab,
            }
          }
        }
      })),

      setPitchSlide: (roomId, slideId) => set((state) => ({
        drafts: {
          ...state.drafts,
          [roomId]: {
            ...state.drafts[roomId],
            pitch: {
              activeTab: 'deck',
              ...state.drafts[roomId]?.pitch,
              selectedSlideId: slideId,
            }
          }
        }
      })),
    }),
    {
      name: 'hackathon-os-drafts',
      // We only persist this specific local draft namespace.
      // Finalized documents live in the backend and sync via react-query, avoiding conflicts.
    }
  )
);
