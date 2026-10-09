/**
 * Overlay state management
 * Source: PRD §4.1–§4.7
 *
 * Zustand store managing open/close state for all 7 global overlays.
 * Supports an optional data payload passed when opening an overlay.
 * Exports useOverlay(name) hook for later phases to trigger overlays.
 */
import { create } from 'zustand';

export type OverlayName =
  | 'command-palette'
  | 'rubric-drawer'
  | 'room-feed'
  | 'task-drawer'
  | 'blocker-dialog'
  | 'scope-guard'
  | 'invite-dialog'
  | 'create-room-dialog'
  | 'join-code-dialog';

interface OverlayState {
  openOverlays: Set<OverlayName>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  overlayData: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  open: (name: OverlayName, data?: any) => void;
  close: (name: OverlayName) => void;
  toggle: (name: OverlayName) => void;
  isOpen: (name: OverlayName) => boolean;
}

export const useOverlayStore = create<OverlayState>((set, get) => ({
  openOverlays: new Set<OverlayName>(),
  overlayData: {},

  open: (name, data) =>
    set((s) => {
      const next = new Set(s.openOverlays);
      next.add(name);
      return { openOverlays: next, overlayData: { ...s.overlayData, [name]: data } };
    }),

  close: (name) =>
    set((s) => {
      const next = new Set(s.openOverlays);
      next.delete(name);
      const { [name]: _removed, ...rest } = s.overlayData;
      return { openOverlays: next, overlayData: rest };
    }),

  toggle: (name) => {
    const s = get();
    if (s.openOverlays.has(name)) {
      s.close(name);
    } else {
      s.open(name);
    }
  },

  isOpen: (name) => get().openOverlays.has(name),
}));

/**
 * Convenience hook for a specific overlay.
 * Returns { isOpen, data, open, close, toggle }.
 * open() now accepts an optional data payload: open({ roomId: '123' })
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useOverlay<T = any>(name: OverlayName) {
  const isOpen = useOverlayStore((s) => s.openOverlays.has(name));
  const data = useOverlayStore((s) => s.overlayData[name] as T | undefined);
  const openFn = useOverlayStore((s) => s.open);
  const closeFn = useOverlayStore((s) => s.close);
  const toggleFn = useOverlayStore((s) => s.toggle);

  return {
    isOpen,
    data,
    open: (payload?: T) => openFn(name, payload),
    close: () => closeFn(name),
    toggle: () => toggleFn(name),
  };
}
