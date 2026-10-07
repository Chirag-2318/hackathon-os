/**
 * useHoverLift — hover lift for feature cards
 * Source: animations.md §2.4, §4.2 "Hover" pattern
 *
 * Feature cards: translateY −2px + e1→e2 on hover.
 * Removed under Reduced Motion (color/border change only).
 */
import { useState, useCallback, type CSSProperties } from 'react';
import { useIsMotionReduced } from './use-motion-mode';

interface UseHoverLiftReturn {
  hoverProps: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    style: CSSProperties;
  };
  isHovered: boolean;
}

export function useHoverLift(): UseHoverLiftReturn {
  const [isHovered, setIsHovered] = useState(false);
  const isReduced = useIsMotionReduced();

  const onMouseEnter = useCallback(() => setIsHovered(true), []);
  const onMouseLeave = useCallback(() => setIsHovered(false), []);

  const style: CSSProperties = isReduced
    ? {}
    : {
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered
          ? '0 8px 24px rgba(20, 22, 26, 0.10)' // e2
          : '0 1px 2px rgba(20, 22, 26, 0.06)', // e1
        transition:
          'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'transform',
      };

  return {
    hoverProps: { onMouseEnter, onMouseLeave, style },
    isHovered,
  };
}
