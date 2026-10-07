/**
 * Gesture primitives — reusable hooks for drag, swipe, long-press, pull-to-refresh
 * Source: animations.md §4.3
 *
 * Generic primitives built now; no consuming screens yet.
 * Diagram Studio pinch/pan is also a primitive for later phases.
 */
import { useRef, useCallback, useState, useEffect } from 'react';

// ── Drag (1:1 follow with spring-interactive) ─────────────────────

export interface DragState {
  isDragging: boolean;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

interface UseDragOptions {
  onDragStart?: (state: DragState) => void;
  onDragMove?: (state: DragState) => void;
  onDragEnd?: (state: DragState) => void;
  disabled?: boolean;
}

export function useDrag(options: UseDragOptions = {}) {
  const { onDragStart, onDragMove, onDragEnd, disabled = false } = options;
  const stateRef = useRef<DragState>({
    isDragging: false,
    x: 0, y: 0,
    velocityX: 0, velocityY: 0,
  });
  const startRef = useRef({ x: 0, y: 0 });
  const lastRef = useRef({ x: 0, y: 0, time: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || e.button !== 0) return;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      startRef.current = { x: e.clientX, y: e.clientY };
      lastRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
      stateRef.current = {
        isDragging: true,
        x: 0, y: 0,
        velocityX: 0, velocityY: 0,
      };
      setIsDragging(true);
      onDragStart?.(stateRef.current);
    },
    [disabled, onDragStart]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!stateRef.current.isDragging) return;
      const now = Date.now();
      const dt = Math.max(now - lastRef.current.time, 1);

      const x = e.clientX - startRef.current.x;
      const y = e.clientY - startRef.current.y;

      stateRef.current = {
        isDragging: true,
        x, y,
        velocityX: (e.clientX - lastRef.current.x) / dt,
        velocityY: (e.clientY - lastRef.current.y) / dt,
      };
      lastRef.current = { x: e.clientX, y: e.clientY, time: now };
      onDragMove?.(stateRef.current);
    },
    [onDragMove]
  );

  const handlePointerUp = useCallback(() => {
    if (!stateRef.current.isDragging) return;
    stateRef.current.isDragging = false;
    setIsDragging(false);
    onDragEnd?.(stateRef.current);
  }, [onDragEnd]);

  return {
    dragProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      style: { touchAction: 'none' as const },
    },
    isDragging,
    dragState: stateRef,
  };
}

// ── Long press ────────────────────────────────────────────────────

interface UseLongPressOptions {
  delay?: number;
  onLongPress: () => void;
  disabled?: boolean;
}

export function useLongPress(options: UseLongPressOptions) {
  const { delay = 500, onLongPress, disabled = false } = options;
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const triggeredRef = useRef(false);

  const handlePointerDown = useCallback(() => {
    if (disabled) return;
    triggeredRef.current = false;
    timerRef.current = setTimeout(() => {
      triggeredRef.current = true;
      onLongPress();
    }, delay);
  }, [delay, disabled, onLongPress]);

  const handlePointerUp = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current as unknown as number);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current as unknown as number);
    };
  }, []);

  return {
    longPressProps: {
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      onPointerLeave: handlePointerUp,
    },
    wasLongPress: triggeredRef,
  };
}

// ── Pull to refresh (content follows finger with resistance) ──────

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
}

export function usePullToRefresh(options: UsePullToRefreshOptions) {
  const { onRefresh, threshold = 80, resistance = 2.5 } = options;
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    if (scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPullingRef.current || isRefreshing) return;
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta > 0) {
        // Apply resistance curve
        setPullDistance(delta / resistance);
      }
    },
    [isRefreshing, resistance]
  );

  const onTouchEnd = useCallback(async () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
  }, [pullDistance, threshold, onRefresh]);

  return {
    pullProps: { onTouchStart, onTouchMove, onTouchEnd },
    pullDistance,
    isRefreshing,
  };
}
