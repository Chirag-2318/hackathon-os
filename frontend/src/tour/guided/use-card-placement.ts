import { useState, useEffect, useMemo } from 'react';
import { getVisualViewport, computeCanvasScale } from './viewport-scale';

export const CANVAS_WIDTH = 720;
export const CANVAS_HEIGHT = 420;

export type TailSide = 'top' | 'bottom' | 'left' | 'right';

interface UseCardPlacementOptions {
  targetRect: DOMRect | null;
  isSeatChoice?: boolean;
  targetKey?: string;
}

export interface CardPlacementResult {
  scale: number;
  posX: number;
  posY: number;
  scaledW: number;
  scaledH: number;
  isMobile: boolean;
  tailSide: TailSide | null;
  tailPos: number | null;
  cardStyle: React.CSSProperties;
  actualCardRect: DOMRect | null;
}

export function useCardPlacement({
  targetRect,
  isSeatChoice = false,
  targetKey,
}: UseCardPlacementOptions): CardPlacementResult {
  const [viewport, setViewport] = useState(() => getVisualViewport());

  useEffect(() => {
    const handleUpdate = () => {
      setViewport(getVisualViewport());
    };

    window.addEventListener('resize', handleUpdate, { passive: true });
    window.addEventListener('orientationchange', handleUpdate, { passive: true });
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', handleUpdate);
      vv.addEventListener('scroll', handleUpdate);
    }

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('orientationchange', handleUpdate);
      if (vv) {
        vv.removeEventListener('resize', handleUpdate);
        vv.removeEventListener('scroll', handleUpdate);
      }
    };
  }, []);

  return useMemo(() => {
    const availW = viewport.width;
    const availH = viewport.height;

    // Viewport narrower than 768px or shorter than 480px uses mobile sheet layout
    const isMobile = availW < 768 || availH < 480;

    if (isMobile) {
      return {
        scale: 1,
        posX: 12,
        posY: 12,
        scaledW: availW - 24,
        scaledH: Math.min(availH * 0.78, 440),
        isMobile: true,
        tailSide: null,
        tailPos: null,
        cardStyle: {
          position: 'fixed',
          bottom: 12,
          left: 12,
          right: 12,
          maxHeight: '78vh',
          zIndex: 50,
        },
        actualCardRect: null,
      };
    }

    // Desktop: Canvas 720x420 scaled to fit viewport with 32px total margin
    const scale = computeCanvasScale(availW, availH, CANVAS_WIDTH, CANVAS_HEIGHT, 0.5, 1.0, 32);
    const scaledW = CANVAS_WIDTH * scale;
    const scaledH = CANVAS_HEIGHT * scale;

    // Center if no target or on seat step
    if (!targetRect || isSeatChoice) {
      const posX = Math.max(16, (availW - scaledW) / 2);
      const posY = Math.max(16, (availH - scaledH) / 2);
      const actualRect = new DOMRect(posX, posY, scaledW, scaledH);

      return {
        scale,
        posX,
        posY,
        scaledW,
        scaledH,
        isMobile: false,
        tailSide: null,
        tailPos: null,
        cardStyle: {
          position: 'fixed',
          left: posX,
          top: posY,
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          zIndex: 50,
        },
        actualCardRect: actualRect,
      };
    }

    // Sidebar boundary detection
    const sidebarEl = typeof document !== 'undefined'
      ? document.querySelector<HTMLElement>('[data-testid="sidebar"], aside')
      : null;
    const sidebarRect = sidebarEl ? sidebarEl.getBoundingClientRect() : null;
    const sidebarRight = sidebarRect && sidebarRect.right > 0 ? sidebarRect.right : 0;

    // Tail length is 12px, tip points at cutout edge with 6px space -> 18px total gap
    const gapScaled = 18 * scale;

    const spaceRight = availW - 16 - targetRect.right;
    const spaceLeft = targetRect.left - Math.max(16, sidebarRight + 16);
    const spaceBelow = availH - 16 - targetRect.bottom;
    const spaceAbove = targetRect.top - 16;

    const isCreateRoom = targetKey === 'create-room' || (targetRect.left > 300 && targetRect.top > 160 && targetRect.top < 450);

    let candidateSides: Array<'right' | 'left' | 'below' | 'above'>;
    if (isCreateRoom) {
      // Place clear of both: left if space allows, otherwise below
      if (spaceLeft >= scaledW + gapScaled) {
        candidateSides = ['left', 'below', 'right', 'above'];
      } else {
        candidateSides = ['below', 'left', 'right', 'above'];
      }
    } else {
      // Sort sides by free space, tie-break right, left, below, above
      const defaultOrder: Array<'right' | 'left' | 'below' | 'above'> = ['right', 'left', 'below', 'above'];
      const spaces: Record<'right' | 'left' | 'below' | 'above', number> = {
        right: spaceRight,
        left: spaceLeft,
        below: spaceBelow,
        above: spaceAbove,
      };
      candidateSides = [...defaultOrder].sort((a, b) => spaces[b] - spaces[a]);
    }

    let chosenPos: { x: number; y: number } | null = null;
    let chosenTailSide: TailSide | null = null;
    let chosenTailPos: number | null = null;

    for (const side of candidateSides) {
      let candX = 16;
      let candY = 16;
      let facingSide: TailSide = 'left';

      if (side === 'right') {
        candX = targetRect.right + gapScaled;
        candY = targetRect.top + (targetRect.height - scaledH) / 2;
        facingSide = 'left';
      } else if (side === 'left') {
        candX = targetRect.left - gapScaled - scaledW;
        candY = targetRect.top + (targetRect.height - scaledH) / 2;
        facingSide = 'right';
      } else if (side === 'below') {
        candX = targetRect.left + (targetRect.width - scaledW) / 2;
        candY = targetRect.bottom + gapScaled;
        facingSide = 'top';
      } else if (side === 'above') {
        candX = targetRect.left + (targetRect.width - scaledW) / 2;
        candY = targetRect.top - gapScaled - scaledH;
        facingSide = 'bottom';
      }

      // Clamp inside viewport with 16px margins
      let minX = 16;
      if (sidebarRight > 0) {
        if (side !== 'left' || candX >= sidebarRight) {
          minX = Math.max(16, sidebarRight + 16);
        }
      }
      const maxX = Math.max(minX, availW - 16 - scaledW);
      const clampedX = Math.max(minX, Math.min(maxX, candX));

      const minY = 16;
      const maxY = Math.max(minY, availH - 16 - scaledH);
      const clampedY = Math.max(minY, Math.min(maxY, candY));

      // Overlap check with cutout (targetRect + 4px margin) and sidebar
      const cardRight = clampedX + scaledW;
      const cardBottom = clampedY + scaledH;
      const cLeft = targetRect.left - 4;
      const cTop = targetRect.top - 4;
      const cRight = targetRect.right + 4;
      const cBottom = targetRect.bottom + 4;

      const overlapsCutout = !(
        cardRight <= cLeft ||
        clampedX >= cRight ||
        cardBottom <= cTop ||
        clampedY >= cBottom
      );

      const overlapsSidebar = sidebarRight > 0 && clampedX < sidebarRight + 8;

      if (!overlapsCutout && !overlapsSidebar) {
        chosenPos = { x: clampedX, y: clampedY };
        chosenTailSide = facingSide;

        // Recompute tail position after clamping: align to target center, clamped >= 28px from corners
        if (facingSide === 'left' || facingSide === 'right') {
          const targetCenterY = targetRect.top + targetRect.height / 2;
          const localY = (targetCenterY - clampedY) / scale;
          chosenTailPos = Math.max(28, Math.min(CANVAS_HEIGHT - 28, localY));
        } else {
          const targetCenterX = targetRect.left + targetRect.width / 2;
          const localX = (targetCenterX - clampedX) / scale;
          chosenTailPos = Math.max(28, Math.min(CANVAS_WIDTH - 28, localX));
        }
        break;
      }
    }

    if (chosenPos && chosenTailSide && chosenTailPos != null) {
      const actualRect = new DOMRect(chosenPos.x, chosenPos.y, scaledW, scaledH);
      return {
        scale,
        posX: chosenPos.x,
        posY: chosenPos.y,
        scaledW,
        scaledH,
        isMobile: false,
        tailSide: chosenTailSide,
        tailPos: chosenTailPos,
        cardStyle: {
          position: 'fixed',
          left: chosenPos.x,
          top: chosenPos.y,
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          zIndex: 50,
        },
        actualCardRect: actualRect,
      };
    }

    // Fallback: If no side fits without overlapping, center the card and hide the tail
    const fallbackX = Math.max(16, (availW - scaledW) / 2);
    const fallbackY = Math.max(16, (availH - scaledH) / 2);
    const actualRect = new DOMRect(fallbackX, fallbackY, scaledW, scaledH);

    return {
      scale,
      posX: fallbackX,
      posY: fallbackY,
      scaledW,
      scaledH,
      isMobile: false,
      tailSide: null,
      tailPos: null,
      cardStyle: {
        position: 'fixed',
        left: fallbackX,
        top: fallbackY,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        zIndex: 50,
      },
      actualCardRect: actualRect,
    };
  }, [viewport, targetRect, isSeatChoice, targetKey]);
}
