/**
 * Icon effects — reusable CSS class generators
 * Source: animations.md §4.4
 *
 * Each effect plays once (never loops) unless noted (Spin is looping).
 * All respect Reduce Motion per the replacement table.
 */

/**
 * CSS keyframe definitions for icon effects.
 * Import this file once in index.css or inject at app root.
 */
export const iconEffectKeyframes = `
/* Icon effect: Swap — cross-fade + scale 0.85→1 + 2px blur, 160ms */
@keyframes icon-swap {
  0% { opacity: 0; transform: scale(0.85); filter: blur(2px); }
  100% { opacity: 1; transform: scale(1); filter: blur(0); }
}

/* Icon effect: Draw — stroke draws along path, 200–240ms */
@keyframes icon-draw {
  0% { stroke-dashoffset: 1; }
  100% { stroke-dashoffset: 0; }
}

/* Icon effect: Bounce — scale 1→1.12→1 */
@keyframes icon-bounce {
  0% { transform: scale(1); }
  40% { transform: scale(1.12); }
  100% { transform: scale(1); }
}

/* Icon effect: Wiggle — rotate ±8°, 2 cycles, 360ms */
@keyframes icon-wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(8deg); }
  75% { transform: rotate(-8deg); }
}

/* Icon effect: Pulse — opacity 1→0.5→1, once, 400ms */
@keyframes icon-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Icon effect: Rotate — 90° or 45° */
@keyframes icon-rotate-90 {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(90deg); }
}

@keyframes icon-rotate-45 {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(45deg); }
}

/* Icon effect: Spin — continuous, linear, 700ms/turn (only looping effect) */
@keyframes icon-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Reduced motion: spinner becomes pulse */
@keyframes icon-spin-reduced {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
`;

/** CSS class strings for each icon effect */
export const iconEffects = {
  swap: 'animate-[icon-swap_160ms_cubic-bezier(0.16,1,0.3,1)_forwards]',
  draw: 'animate-[icon-draw_220ms_cubic-bezier(0.16,1,0.3,1)_forwards]',
  bounce: 'animate-[icon-bounce_350ms_cubic-bezier(0.16,1,0.3,1)]',
  wiggle: 'animate-[icon-wiggle_360ms_ease-in-out]',
  pulse: 'animate-[icon-pulse_400ms_ease-in-out]',
  rotate90: 'animate-[icon-rotate-90_350ms_cubic-bezier(0.16,1,0.3,1)_forwards]',
  rotate45: 'animate-[icon-rotate-45_350ms_cubic-bezier(0.16,1,0.3,1)_forwards]',
  spin: 'animate-[icon-spin_700ms_linear_infinite]',
  spinReduced: 'animate-[icon-spin-reduced_1400ms_ease-in-out_infinite]',
} as const;

/**
 * Get the appropriate icon effect class considering motion mode.
 * Returns empty string if the effect should be suppressed.
 */
export function getIconEffect(
  effect: keyof typeof iconEffects,
  motionMode: 'full' | 'reduced' | 'off'
): string {
  if (motionMode === 'off') return '';

  if (motionMode === 'reduced') {
    // Reduced motion replacements per §3.1
    switch (effect) {
      case 'wiggle':
      case 'bounce':
        return ''; // Removed — communicate with color/icon/text
      case 'spin':
        return iconEffects.spinReduced; // Non-rotating pulse
      default:
        return iconEffects[effect]; // Swap, draw, pulse, rotate retained
    }
  }

  return iconEffects[effect];
}
