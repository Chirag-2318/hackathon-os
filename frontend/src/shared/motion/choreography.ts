/**
 * Choreography utilities
 * Source: animations.md §2.5
 *
 * Shared logic for coordinating animations across the app.
 * These are utility functions, not hooks — designed to be called
 * from animation orchestration code in later phases.
 */

import { choreography } from './motion-tokens';

// ── §2.5.1 Origin-aware transform-origin ─────────────────────────

/**
 * Compute transform-origin for a popover/menu/tooltip anchored to a trigger.
 * Dialogs are exempt (always centered).
 */
export function getAnchoredOrigin(
  triggerRect: DOMRect,
  popoverRect: DOMRect
): string {
  const triggerCenterX = triggerRect.left + triggerRect.width / 2;
  const triggerCenterY = triggerRect.top + triggerRect.height / 2;

  const relativeX = triggerCenterX - popoverRect.left;
  const relativeY = triggerCenterY - popoverRect.top;

  return `${relativeX}px ${relativeY}px`;
}

// ── §2.5.2 Asymmetric timing ──────────────────────────────────────

/**
 * Returns enter and exit durations following the 65% exit rule.
 */
export function asymmetricTiming(enterMs: number): {
  enter: number;
  exit: number;
} {
  return {
    enter: enterMs,
    exit: Math.round(enterMs * 0.65),
  };
}

// ── §2.5.3 Concurrency guard ─────────────────────────────────────

let activeAnimations = 0;

/**
 * Request an animation slot. Returns true if the animation can proceed.
 * At most `maxConcurrent` (3) elements animate simultaneously.
 */
export function requestAnimationSlot(): boolean {
  if (activeAnimations >= choreography.maxConcurrent) return false;
  activeAnimations++;
  return true;
}

/**
 * Release an animation slot when the animation finishes.
 */
export function releaseAnimationSlot(): void {
  activeAnimations = Math.max(0, activeAnimations - 1);
}

// ── §2.5.4 Layering helper ───────────────────────────────────────

/**
 * Returns staggered start times for foreground (0ms) and backdrop (40ms delay).
 */
export function layeredTiming(): {
  foregroundDelay: number;
  backdropDelay: number;
} {
  return {
    foregroundDelay: 0,
    backdropDelay: choreography.backdropDelay,
  };
}

// ── §2.5.5 FLIP helper ───────────────────────────────────────────

/**
 * Capture the "First" position of an element for FLIP animation.
 */
export function captureRect(element: HTMLElement): DOMRect {
  return element.getBoundingClientRect();
}

/**
 * Perform the Invert + Play steps of FLIP.
 * - first: the captured DOMRect before the change
 * - element: the element after the DOM change
 * - durationMs: animation duration
 * - easing: CSS easing string
 */
export function flipAnimate(
  element: HTMLElement,
  first: DOMRect,
  durationMs: number,
  easing: string
): Animation | null {
  const last = element.getBoundingClientRect();

  const deltaX = first.left - last.left;
  const deltaY = first.top - last.top;
  const deltaW = first.width / last.width;
  const deltaH = first.height / last.height;

  // No movement needed
  if (
    Math.abs(deltaX) < 1 &&
    Math.abs(deltaY) < 1 &&
    Math.abs(deltaW - 1) < 0.01 &&
    Math.abs(deltaH - 1) < 0.01
  ) {
    return null;
  }

  return element.animate(
    [
      {
        transform: `translate(${deltaX}px, ${deltaY}px) scale(${deltaW}, ${deltaH})`,
      },
      { transform: 'none' },
    ],
    {
      duration: durationMs,
      easing,
      fill: 'none',
    }
  );
}

// ── §2.5.6 Elevation-follows-motion ──────────────────────────────

/**
 * Shadow change as opacity swap on pre-rendered layers.
 * Returns class names for the two shadow layers to toggle.
 * Never interpolate box-shadow directly.
 */
export function elevationSwapClasses(
  from: 'e0' | 'e1' | 'e2',
  to: 'e1' | 'e2' | 'e3'
): { fromClass: string; toClass: string } {
  return {
    fromClass: `shadow-${from}`,
    toClass: `shadow-${to}`,
  };
}

// ── §2.5.7 Layout stability guard ─────────────────────────────────

/**
 * Utility to lock an element's dimensions before a state change
 * to prevent layout shift. Call with the element before the change,
 * returns a cleanup function to call after animation completes.
 */
export function lockDimensions(element: HTMLElement): () => void {
  const rect = element.getBoundingClientRect();
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;

  return () => {
    element.style.width = '';
    element.style.height = '';
  };
}

// ── §2.5.8 No motion on first paint ──────────────────────────────

/**
 * Returns true if the app shell has completed its initial render.
 * The shell must appear immediately with no entrance animation.
 */
let shellMounted = false;

export function markShellMounted(): void {
  shellMounted = true;
}

export function isShellMounted(): boolean {
  return shellMounted;
}

// ── Phase 2a Choreography Constants ──────────────────────────────

/**
 * M01: Room birth — arriving on S08 from Create Room
 */
export const M01_ROOM_BIRTH = {
  phaseTrackStaggerMs: 40,
  clockStripDurationMs: 400,
  kpiFadeDurationMs: 300,
};

/**
 * M02: Zoom into room — arriving on S08 from S07 feature card
 * Note: Actual implementation uses View Transitions API where supported,
 * otherwise cross-fades.
 */
export const M02_ZOOM_INTO_ROOM = {
  crossfadeDurationMs: 250,
};

/**
 * M09: Feature freeze reached
 */
export const M09_FEATURE_FREEZE = {
  flagSettleSpring: 'spring-bouncy', // from motion tokens
  bannerDropDurationMs: 400,
  phaseGlideDurationMs: 600,
};

/**
 * M11: Last hour begins
 */
export const M11_LAST_HOUR = {
  crossfadeDurationMs: 480,
};
