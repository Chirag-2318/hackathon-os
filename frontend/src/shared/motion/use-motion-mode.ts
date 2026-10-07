/**
 * Motion Mode — user and system motion preferences
 * Source: animations.md §3.1–§3.2
 *
 * Four states: Full, Reduced, Off, Lite (automatic).
 * Reads OS prefers-reduced-motion as default.
 * Speed Mode default: Reduced.
 * Applies data-motion attribute to <html> for CSS token overrides.
 */
import { create } from 'zustand';
import { useEffect } from 'react';

export type MotionMode = 'full' | 'reduced' | 'off';

interface MotionModeState {
  /** User's explicit preference (null = follow OS) */
  userPreference: MotionMode | null;
  /** OS-level prefers-reduced-motion */
  osReducedMotion: boolean;
  /** Whether we're in Speed Mode (defaults to Reduced) */
  isSpeedMode: boolean;
  /** Resolved mode considering user pref > speed mode > OS > full */
  resolved: MotionMode;
  setUserPreference: (mode: MotionMode | null) => void;
  setSpeedMode: (enabled: boolean) => void;
  setOsReducedMotion: (reduced: boolean) => void;
}

function resolveMode(
  userPref: MotionMode | null,
  isSpeedMode: boolean,
  osReduced: boolean
): MotionMode {
  // User explicit choice always wins
  if (userPref !== null) return userPref;
  // Speed Mode default: reduced
  if (isSpeedMode) return 'reduced';
  // OS prefers-reduced-motion
  if (osReduced) return 'reduced';
  // Default
  return 'full';
}

export const useMotionModeStore = create<MotionModeState>((set) => ({
  userPreference: null,
  osReducedMotion: false,
  isSpeedMode: false,
  resolved: 'full',

  setUserPreference: (mode) =>
    set((s) => ({
      userPreference: mode,
      resolved: resolveMode(mode, s.isSpeedMode, s.osReducedMotion),
    })),

  setSpeedMode: (enabled) =>
    set((s) => ({
      isSpeedMode: enabled,
      resolved: resolveMode(s.userPreference, enabled, s.osReducedMotion),
    })),

  setOsReducedMotion: (reduced) =>
    set((s) => ({
      osReducedMotion: reduced,
      resolved: resolveMode(s.userPreference, s.isSpeedMode, reduced),
    })),
}));

/**
 * Hook that syncs OS reduced-motion preference and applies
 * the data-motion attribute to <html> for CSS token overrides.
 * Mount once at app root.
 */
export function useMotionModeSync(): void {
  const resolved = useMotionModeStore((s) => s.resolved);
  const setOsReducedMotion = useMotionModeStore((s) => s.setOsReducedMotion);

  // Listen for OS prefers-reduced-motion changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setOsReducedMotion(mq.matches);

    const handler = (e: MediaQueryListEvent) => {
      setOsReducedMotion(e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [setOsReducedMotion]);

  // Apply data-motion attribute to <html> for CSS overrides
  useEffect(() => {
    const root = document.documentElement;
    if (resolved === 'full') {
      root.removeAttribute('data-motion');
    } else {
      root.setAttribute('data-motion', resolved);
    }
  }, [resolved]);
}

/**
 * Convenience hook — returns resolved motion mode.
 */
export function useMotionMode(): MotionMode {
  return useMotionModeStore((s) => s.resolved);
}

/**
 * Returns true if movement-based animations should be skipped.
 * Press feedback (scale) is still allowed under Reduced; only Off removes everything.
 */
export function useIsMotionReduced(): boolean {
  const mode = useMotionMode();
  return mode === 'reduced' || mode === 'off';
}
