/**
 * Motion system — barrel export
 * All motion tokens, hooks, and utilities re-exported from one entry point.
 */

// Tokens
export * from './motion-tokens';

// Hooks
export { useMotionMode, useIsMotionReduced, useMotionModeSync, useMotionModeStore } from './use-motion-mode';
export { usePress } from './use-press';
export { useHoverLift } from './use-hover-lift';

// Choreography utilities
export {
  getAnchoredOrigin,
  asymmetricTiming,
  requestAnimationSlot,
  releaseAnimationSlot,
  layeredTiming,
  captureRect,
  flipAnimate,
  elevationSwapClasses,
  lockDimensions,
  markShellMounted,
  isShellMounted,
} from './choreography';

// Icon effects
export { iconEffectKeyframes, iconEffects, getIconEffect } from './icon-effects';

// Gesture primitives
export { useDrag, useLongPress, usePullToRefresh } from './gestures';

// Types
export type { SpringConfig } from './motion-tokens';
export type { MotionMode } from './use-motion-mode';
export type { DragState } from './gestures';
