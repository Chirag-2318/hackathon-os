/**
 * Motion Tokens — TypeScript constants
 * Source: animations.md §2.1–§2.6
 *
 * Mirrors CSS custom properties for JS/hook usage.
 * Spring configs use stiffness/damping/mass for physics-style APIs.
 * Conversion: stiffness = (2π / duration)², damping = 4π(1−bounce) / duration, mass = 1
 */

// ── §2.1 Durations ──────────────────────────────────────────────

export const durations = {
  instant: 0,
  micro: 100,
  fast: 160,
  base: 220,
  slow: 320,
  emph: 480,
  hero: 720,
} as const;

/** Exit duration ≈ 65% of enter duration (§2.1 rule) */
export function exitDuration(enterMs: number): number {
  return Math.round(enterMs * 0.65);
}

// ── §2.2 Easing curves ──────────────────────────────────────────

export const easings = {
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  outSoft: 'cubic-bezier(0.25, 1, 0.5, 1)',
  move: 'cubic-bezier(0.65, 0, 0.35, 1)',
  linear: 'linear',
} as const;

// ── §2.3 Springs ─────────────────────────────────────────────────

export interface SpringConfig {
  readonly duration: number;
  readonly bounce: number;
  readonly stiffness: number;
  readonly damping: number;
  readonly mass: number;
}

/**
 * Convert Apple-style (duration, bounce) to physics (stiffness, damping, mass).
 * stiffness = (2π / duration)², damping = 4π(1 − bounce) / duration, mass = 1
 */
export function springFromDurationBounce(
  duration: number,
  bounce: number
): SpringConfig {
  const twoPi = 2 * Math.PI;
  const stiffness = (twoPi / duration) ** 2;
  const damping = (4 * Math.PI * (1 - bounce)) / duration;
  return {
    duration,
    bounce,
    stiffness: Math.round(stiffness * 10) / 10,
    damping: Math.round(damping * 10) / 10,
    mass: 1,
  };
}

export const springs = {
  /** Position/size changes, layout shifts, shared-element moves */
  smooth: {
    duration: 0.5, bounce: 0, stiffness: 158, damping: 25.1, mass: 1,
  },
  /** Sheets, drawers, panels */
  sheet: {
    duration: 0.4, bounce: 0, stiffness: 247, damping: 31.4, mass: 1,
  },
  /** Toggles, tab/pill indicators, drop settle, small controls */
  snappy: {
    duration: 0.35, bounce: 0.15, stiffness: 322, damping: 30.5, mass: 1,
  },
  /** Pointer-following (drag lag, tooltip follow) */
  interactive: {
    duration: 0.2, bounce: 0, stiffness: 987, damping: 62.8, mass: 1,
  },
  /** Rare milestones only */
  bouncy: {
    duration: 0.5, bounce: 0.3, stiffness: 158, damping: 17.6, mass: 1,
  },
} as const;

// ── §2.4 Transform values ────────────────────────────────────────

export const transforms = {
  translateSm: 8,
  translateMd: 16,
  translateLg: 24,
  translateTooltip: 4,
  scalePress: 0.97,
  scalePressIcon: 0.92,
  scaleEnter: 0.96,
  scaleLift: 1.03,
  hoverLiftY: -2,
  staggerDelay: 40,
  staggerMaxItems: 8,
  blurSwap: 4,
} as const;

// ── §2.6 Frequency tiers ─────────────────────────────────────────

export const FrequencyTier = {
  /** Keyboard-initiated / 100+×/day — none or ≤100ms opacity fade */
  T0: 'T0',
  /** Tens/day — t-micro to t-fast; spring bounce 0–0.15 */
  T1: 'T1',
  /** Several/day — t-base to t-slow */
  T2: 'T2',
  /** Rare/milestone — up to t-hero, signature choreography */
  T3: 'T3',
} as const;

export type FrequencyTier = typeof FrequencyTier[keyof typeof FrequencyTier];

// ── §2.5 Choreography constants ──────────────────────────────────

export const choreography = {
  /** Maximum simultaneous animating elements */
  maxConcurrent: 3,
  /** Backdrop fade starts this many ms after the surface starts */
  backdropDelay: 40,
  /** Maximum stagger total duration */
  maxStaggerTotal: 400,
} as const;
