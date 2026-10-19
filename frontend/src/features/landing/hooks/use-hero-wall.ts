import type { RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { WALL_SEQUENCE } from '../data/hero-wall';

/** Where the lit frame is parked, as a fraction of the wall layer. */
const SLOT_X = 0.79;
const SLOT_Y = 0.47;

const PAN_MS = 1150;
const DWELL_MS = 3600;
const FADE_IN_AT_MS = 600;
const FIRST_LIGHT_AT_MS = 1300;
const FOCUS_BEFORE_END_MS = 250;
const DOLLY_OUT_AT_MS = 560;

type Offset = { x: number; y: number };

export type HeroWallState = {
  viewportRef: RefObject<HTMLDivElement | null>;
  registerFrame: (key: string) => (el: HTMLDivElement | null) => void;
  offset: Offset;
  ready: boolean;
  instant: boolean;
  dolly: boolean;
  focusKey: string | null;
};

/**
 * Drives the hero wall camera.
 * @param enabled  false below 1024px (the component is not even rendered then)
 * @param reduced  true when the visitor prefers reduced motion
 */
export function useHeroWall(enabled: boolean, reduced: boolean): HeroWallState {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const frames = useRef(new Map<string, HTMLDivElement>());
  const camKey = useRef<string>(WALL_SEQUENCE[0]);
  const readyRef = useRef(false);

  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const [instant, setInstant] = useState(true);
  const [dolly, setDolly] = useState(false);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(
    typeof document === 'undefined' ? true : document.visibilityState === 'visible',
  );

  const registerFrame = useCallback(
    (key: string) => (el: HTMLDivElement | null) => {
      if (el) frames.current.set(key, el);
      else frames.current.delete(key);
    },
    [],
  );

  /** Offset that puts the frame centre on the slot. Uses layout coordinates, so transforms do not matter. */
  const measure = useCallback((key: string): Offset | null => {
    const vp = viewportRef.current;
    const el = frames.current.get(key);
    if (!vp || !el) return null;
    return {
      x: Math.round(vp.clientWidth * SLOT_X - (el.offsetLeft + el.offsetWidth / 2)),
      y: Math.round(vp.clientHeight * SLOT_Y - (el.offsetTop + el.offsetHeight / 2)),
    };
  }, []);

  /** Is the wall layer on screen? */
  useEffect(() => {
    const vp = viewportRef.current;
    if (!enabled || !vp) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    io.observe(vp);
    return () => io.disconnect();
  }, [enabled]);

  /** Is the tab visible? */
  useEffect(() => {
    const onChange = () => setTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  /** Park the camera on the current frame without animating, and re-park whenever the layer is resized. */
  useEffect(() => {
    const vp = viewportRef.current;
    if (!enabled || !vp) return;
    const park = () => {
      const o = measure(camKey.current);
      if (!o) return;
      setInstant(true);
      setOffset(o);
    };
    park();
    const ro = new ResizeObserver(park);
    ro.observe(vp);
    return () => ro.disconnect();
  }, [enabled, measure]);

  /** Reduced motion: static wall, first frame lit, nothing moves. */
  useEffect(() => {
    if (!enabled || !reduced) return;
    setReady(true);
    setFocusKey(WALL_SEQUENCE[0]);
  }, [enabled, reduced]);

  /** The loop. It runs only while the wall is on screen and the tab is visible. */
  useEffect(() => {
    if (!enabled || reduced || !inView || !tabVisible) return;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms));
    };

    const visit = () => {
      const i = WALL_SEQUENCE.indexOf(camKey.current);
      const next = WALL_SEQUENCE[(i + 1) % WALL_SEQUENCE.length];
      const target = measure(next);
      if (!target) return;
      camKey.current = next;
      setFocusKey(null);
      setDolly(true);
      setInstant(false);
      setOffset(target);
      later(() => setDolly(false), DOLLY_OUT_AT_MS);
      later(() => setFocusKey(next), PAN_MS - FOCUS_BEFORE_END_MS);
      later(visit, PAN_MS + DWELL_MS);
    };

    if (!readyRef.current) {
      // first paint: fade the wall in, light the first frame, then start travelling
      later(() => {
        readyRef.current = true;
        setReady(true);
      }, FADE_IN_AT_MS);
      later(() => setFocusKey(WALL_SEQUENCE[0]), FIRST_LIGHT_AT_MS);
      later(visit, FIRST_LIGHT_AT_MS + DWELL_MS);
    } else {
      // resuming after a pause: settle, keep a lit frame, travel after one dwell
      setDolly(false);
      setFocusKey((prev) => prev ?? camKey.current);
      later(visit, DWELL_MS);
    }
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [enabled, reduced, inView, tabVisible, measure]);

  return { viewportRef, registerFrame, offset, ready, instant, dolly, focusKey };
}
