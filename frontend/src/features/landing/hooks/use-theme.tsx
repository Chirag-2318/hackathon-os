import { useLayoutEffect, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'brackit-landing-theme';

function readStored(): Theme | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // storage can be blocked (private mode)
  }
  return null;
}

function readSystem(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// The first visit follows the system setting; after that the visitor's own choice is remembered.
let current: Theme = readStored() ?? readSystem();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getTheme(): Theme {
  return current;
}

// For the page root, which renders the attribute once and never subscribes (so it never re-renders on a switch).
export function getCurrentTheme(): Theme {
  return current;
}

// Puts the theme on the DOM directly: the landing root (used by all landing CSS) and the document element
// (used by the few rules that must reach outside the landing root, like the page background and scrollbars).
function paint(theme: Theme): void {
  document.documentElement.setAttribute('data-landing-theme', theme);
  document.querySelector('.landing-root')?.setAttribute('data-theme', theme);
}

function commit(next: Theme, persist: boolean): void {
  current = next;
  paint(next);
  if (persist) {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore: the choice just will not be remembered
    }
  }
  // only components that read the theme re-render, and they do it right now (inside the view transition)
  flushSync(() => {
    listeners.forEach((listener) => listener());
  });
}

type ViewTransitionLike = { finished: Promise<unknown> };
type StartViewTransition = (update: () => void) => ViewTransitionLike;

let switchId = 0;

function switchTo(next: Theme, persist: boolean): void {
  if (next === current) return;
  const root = document.querySelector<HTMLElement>('.landing-root');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!root || reduced) {
    commit(next, persist);
    return;
  }

  const id = (switchId += 1);
  const start = (document as Document & { startViewTransition?: StartViewTransition }).startViewTransition;

  if (start) {
    // The browser cross-fades the old picture of the page into the new one. While it does, every element's own
    // transitions are switched off (see landing.css) so nothing animates twice.
    root.setAttribute('data-theme-switching', '');
    const transition = start.call(document, () => commit(next, persist));
    const clear = () => {
      if (id === switchId) root.removeAttribute('data-theme-switching');
    };
    transition.finished.then(clear, clear);
  } else {
    // Browsers without view transitions: every element fades its colours with the same duration at the same time.
    root.setAttribute('data-theme-fading', '');
    commit(next, persist);
    window.setTimeout(() => {
      if (id === switchId) root.removeAttribute('data-theme-fading');
    }, 450);
  }
}

export function toggleTheme(): void {
  switchTo(current === 'dark' ? 'light' : 'dark', true);
}

// Sets the document attribute before the first paint (no flash) and follows the system setting while the visitor
// has not chosen a theme themselves. The attribute is removed again when the landing page is left.
export function ThemeProvider({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    paint(current);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = () => {
      if (readStored() === null) switchTo(media.matches ? 'dark' : 'light', false);
    };
    media.addEventListener('change', onSystemChange);
    return () => {
      media.removeEventListener('change', onSystemChange);
      document.documentElement.removeAttribute('data-landing-theme');
    };
  }, []);
  return <>{children}</>;
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const theme = useSyncExternalStore(subscribe, getTheme, getTheme);
  return { theme, toggle: toggleTheme };
}
