/**
 * Motion Mode — user and system motion preferences
 * Three choices: System (follows OS prefers-reduced-motion), On (reduce motion), Off (allow motion).
 * Wire into one shared reduced-motion helper (useIsMotionReduced).
 */
import { create } from 'zustand';
import { useEffect } from 'react';

export type MotionChoice = 'system' | 'on' | 'off';
export type MotionMode = MotionChoice;

interface MotionModeState {
  /** User preference: 'system' | 'on' | 'off' */
  preference: MotionChoice;
  /** OS-level prefers-reduced-motion */
  osReducedMotion: boolean;
  /** Combined reduced-motion boolean */
  isReduced: boolean;
  setPreference: (choice: MotionChoice) => void;
  setOsReducedMotion: (reduced: boolean) => void;
}

function computeIsReduced(
  pref: MotionChoice,
  osReduced: boolean
): boolean {
  if (pref === 'on') return true;
  if (pref === 'off') return false;
  // 'system' mode: follow OS
  return osReduced;
}

function getStoredMotionPreference(): MotionChoice {
  if (typeof window === "undefined") return 'system';
  try {
    const val = localStorage.getItem('motion_preference') as MotionChoice | null;
    if (val === 'system' || val === 'on' || val === 'off') return val;
  } catch {}
  return 'system';
}

const initialPref = getStoredMotionPreference();

export const useMotionModeStore = create<MotionModeState>((set) => ({
  preference: initialPref,
  osReducedMotion: false,
  isReduced: computeIsReduced(initialPref, false),

  setPreference: (pref) => {
    try {
      localStorage.setItem('motion_preference', pref);
    } catch {}
    set((s) => ({
      preference: pref,
      isReduced: computeIsReduced(pref, s.osReducedMotion),
    }));
  },

  setOsReducedMotion: (reduced) =>
    set((s) => ({
      osReducedMotion: reduced,
      isReduced: computeIsReduced(s.preference, reduced),
    })),
}));

/**
 * Hook that syncs OS reduced-motion preference and applies
 * data-motion attribute to <html>. Mount once at app root.
 */
export function useMotionModeSync(): void {
  const isReduced = useMotionModeStore((s) => s.isReduced);
  const setOsReducedMotion = useMotionModeStore((s) => s.setOsReducedMotion);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setOsReducedMotion(mq.matches);

    const handler = (e: MediaQueryListEvent) => {
      setOsReducedMotion(e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [setOsReducedMotion]);

  useEffect(() => {
    const root = document.documentElement;
    if (isReduced) {
      root.setAttribute('data-motion', 'on');
    } else {
      root.removeAttribute('data-motion');
    }
  }, [isReduced]);
}

/**
 * Shared reduced-motion helper.
 * Combines OS prefers-reduced-motion and user choice (System, On, Off).
 */
export function useIsMotionReduced(): boolean {
  return useMotionModeStore((s) => s.isReduced);
}

/**
 * Returns current motion preference setting ('system' | 'on' | 'off').
 */
export function useMotionPreference(): MotionChoice {
  return useMotionModeStore((s) => s.preference);
}

/**
 * Backward compatibility alias for legacy call sites.
 */
export function useMotionMode(): 'full' | 'reduced' | 'off' {
  const isReduced = useMotionModeStore((s) => s.isReduced);
  return isReduced ? 'reduced' : 'full';
}

