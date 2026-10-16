import { create } from 'zustand';

export type AiKeyDialogMode = 'first-run' | 'needed' | 'settings';

interface AiKeyDialogState {
  isOpen: boolean;
  mode: AiKeyDialogMode;
  message?: string;
  openDialog: (mode?: AiKeyDialogMode, message?: string) => void;
  closeDialog: () => void;
}

export const useAiKeyDialogStore = create<AiKeyDialogState>((set) => ({
  isOpen: false,
  mode: 'first-run',
  message: undefined,
  openDialog: (mode = 'needed', message) => set({ isOpen: true, mode, message }),
  closeDialog: () => set({ isOpen: false, message: undefined }),
}));
