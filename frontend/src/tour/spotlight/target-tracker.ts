import { useState, useEffect, useCallback } from 'react';
import type { TargetRect, Placement } from './types';

export function findTargetElement(targetKey?: string): HTMLElement | null {
  if (!targetKey) return null;
  // Try data-tour attribute first
  let el = document.querySelector<HTMLElement>(`[data-tour="${targetKey}"]`);
  if (!el && (targetKey.startsWith('.') || targetKey.startsWith('#') || targetKey.startsWith('['))) {
    el = document.querySelector<HTMLElement>(targetKey);
  }
  if (!el) return null;

  // Check if visible
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return null;
  }
  return el;
}

export function useTargetRect(targetKey?: string, padding = 8): TargetRect | null {
  const [rect, setRect] = useState<TargetRect | null>(null);

  const update = useCallback(() => {
    const el = findTargetElement(targetKey);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({
      x: r.x - padding,
      y: r.y - padding,
      left: r.left - padding,
      top: r.top - padding,
      width: r.width + padding * 2,
      height: r.height + padding * 2,
      right: r.right + padding,
      bottom: r.bottom + padding,
    });
  }, [targetKey, padding]);

  useEffect(() => {
    update();

    const el = findTargetElement(targetKey);
    let ro: ResizeObserver | null = null;
    if (el) {
      ro = new ResizeObserver(() => update());
      ro.observe(el);
    }

    const onScroll = () => update();
    const onResize = () => update();

    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      ro?.disconnect();
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [targetKey, update]);

  return rect;
}

export function calculatePlacement(
  targetRect: TargetRect | null,
  cardWidth = 320,
  cardHeight = 180,
  isMobile = false
): { placement: Placement; style: React.CSSProperties } {
  const vv = typeof window !== 'undefined' ? window.visualViewport : null;
  const vw = vv ? vv.width : (typeof window !== 'undefined' ? window.innerWidth : 1280);
  const vh = vv ? vv.height : (typeof window !== 'undefined' ? window.innerHeight : 720);

  const effectiveMobile = isMobile || vw < 768 || vh < 480;

  if (!targetRect || effectiveMobile) {
    if (effectiveMobile && targetRect) {
      return {
        placement: 'bottom-sheet',
        style: {
          position: 'fixed',
          bottom: 16,
          left: 16,
          right: 16,
          margin: '0 auto',
          maxWidth: 'calc(100vw - 32px)',
        },
      };
    }
    return {
      placement: 'center',
      style: {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      },
    };
  }

  const margin = 14;

  // Space available in each direction
  const spaceBottom = vh - targetRect.bottom;
  const spaceTop = targetRect.top;
  const spaceRight = vw - targetRect.right;
  const spaceLeft = targetRect.left;

  // Best fit order
  if (spaceBottom >= cardHeight + margin) {
    const left = Math.max(16, Math.min(vw - cardWidth - 16, targetRect.left + (targetRect.width - cardWidth) / 2));
    const top = Math.max(16, Math.min(vh - cardHeight - 16, targetRect.bottom + margin));
    return {
      placement: 'bottom',
      style: { position: 'fixed', top, left },
    };
  }

  if (spaceTop >= cardHeight + margin) {
    const left = Math.max(16, Math.min(vw - cardWidth - 16, targetRect.left + (targetRect.width - cardWidth) / 2));
    const top = Math.max(16, Math.min(vh - cardHeight - 16, targetRect.top - cardHeight - margin));
    return {
      placement: 'top',
      style: { position: 'fixed', top, left },
    };
  }

  if (spaceRight >= cardWidth + margin) {
    const left = Math.max(16, Math.min(vw - cardWidth - 16, targetRect.right + margin));
    const top = Math.max(16, Math.min(vh - cardHeight - 16, targetRect.top + (targetRect.height - cardHeight) / 2));
    return {
      placement: 'right',
      style: { position: 'fixed', left, top },
    };
  }

  if (spaceLeft >= cardWidth + margin) {
    const left = Math.max(16, Math.min(vw - cardWidth - 16, targetRect.left - cardWidth - margin));
    const top = Math.max(16, Math.min(vh - cardHeight - 16, targetRect.top + (targetRect.height - cardHeight) / 2));
    return {
      placement: 'left',
      style: { position: 'fixed', left, top },
    };
  }

  // Fallback to bottom-sheet
  return {
    placement: 'bottom-sheet',
    style: {
      position: 'fixed',
      bottom: 20,
      left: 16,
      right: 16,
      margin: '0 auto',
      maxWidth: 340,
    },
  };
}
