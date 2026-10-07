/**
 * usePress — press scale animation hook
 * Source: animations.md §4.2 "Press" pattern
 *
 * Scale 0.97 down on press; spring back up.
 * Down: t-fast; up: spring-snappy.
 * Retained under Reduced Motion (essential feedback).
 * Removed under Motion: Off.
 */
import { useState, useCallback, type CSSProperties } from 'react';
import { useMotionMode } from './use-motion-mode';

interface UsePressOptions {
  /** Scale factor on press. Default 0.97 (buttons/rows); use 0.92 for small icon buttons */
  scale?: number;
  /** Whether the element is disabled */
  disabled?: boolean;
}

interface UsePressReturn {
  /** Spread onto the target element */
  pressProps: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerUp: () => void;
    onPointerLeave: () => void;
    style: CSSProperties;
  };
  isPressed: boolean;
}

export function usePress(options: UsePressOptions = {}): UsePressReturn {
  const { scale = 0.97, disabled = false } = options;
  const [isPressed, setIsPressed] = useState(false);
  const mode = useMotionMode();

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      // Only respond to primary pointer
      if (e.button !== 0) return;
      setIsPressed(true);
    },
    [disabled]
  );

  const onPointerUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const onPointerLeave = useCallback(() => {
    setIsPressed(false);
  }, []);

  // Motion: Off removes all animation including press feedback
  const isOff = mode === 'off';

  const style: CSSProperties = isOff
    ? {}
    : {
        transform: isPressed ? `scale(${scale})` : 'scale(1)',
        transition: isPressed
          ? 'transform 160ms cubic-bezier(0.16, 1, 0.3, 1)'
          : 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'transform',
      };

  return {
    pressProps: {
      onPointerDown,
      onPointerUp,
      onPointerLeave,
      style,
    },
    isPressed,
  };
}
