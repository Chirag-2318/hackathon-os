/**
 * useMediaQuery — responsive breakpoint detection
 * Source: design.md §2.4 breakpoints: 360, 640, 768, 1024, 1280, 1536
 */
import { useSyncExternalStore, useCallback } from 'react';

/**
 * Generic media query hook. Returns true when the query matches.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', callback);
      return () => mq.removeEventListener('change', callback);
    },
    [query]
  );

  const getSnapshot = () => window.matchMedia(query).matches;
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Design breakpoints from design.md §2.4 */
export const breakpoints = {
  sm: 360,
  md: 640,
  tablet: 768,
  lg: 1024,
  desktop: 1280,
  wide: 1536,
} as const;

/** True when viewport is at most 767px (mobile) */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/** True when viewport is at least 768px (tablet+) */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px)');
}

/** True when viewport is at least 1280px (desktop) */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1280px)');
}

/** True when viewport is at least 1536px (wide) */
export function useIsWide(): boolean {
  return useMediaQuery('(min-width: 1536px)');
}
