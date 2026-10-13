export interface ViewportSize {
  width: number;
  height: number;
}

export function getVisualViewport(): ViewportSize {
  if (typeof window === 'undefined') {
    return { width: 1280, height: 720 };
  }
  const vv = window.visualViewport;
  if (vv) {
    return { width: vv.width, height: vv.height };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * Computes scale clamped between minScale (default 0.5) and maxScale (default 1.0)
 * ensuring the canvas never overflows the available viewport with margins.
 */
export function computeCanvasScale(
  availW: number,
  availH: number,
  canvasW: number,
  canvasH: number,
  minScale = 0.5,
  maxScale = 1.0,
  padding = 32
): number {
  const raw = Math.min((availW - padding) / canvasW, (availH - padding) / canvasH);
  return Math.min(maxScale, Math.max(minScale, raw));
}
