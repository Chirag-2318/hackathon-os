import { useLayoutEffect, useRef, useState } from 'react';
import { LAUNCH, REHEARSAL } from '../data/stage-act';
import { formatClock, parseClock } from '../lib/clock';
import { HUD_ORDER, useHudSource } from './use-hud';

// Where each cue starts, as a fraction (0 to 1) of the scroll through the track. Before the first number the big heading
// is on screen while the product window rises into the light (the "entrance").
export const CUE_STARTS = [0.14, 0.42, 0.62, 0.8] as const;
// Scroll fractions and the rail positions (per cent) they map to, so the rail fill lands exactly on each node.
const RAIL_STOPS = [0.14, 0.42, 0.62, 0.8, 1];
const RAIL_PERCENT = [0, 25, 50, 75, 100];
const LINES = REHEARSAL.lines.length;
const CLOCK_START = 6 * 3600;
const CLOCK_END = parseClock(LAUNCH.time);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function railPercentAt(progress: number): number {
  if (progress <= RAIL_STOPS[0]) return 0;
  for (let i = 0; i < RAIL_STOPS.length - 1; i += 1) {
    if (progress <= RAIL_STOPS[i + 1]) {
      const t = (progress - RAIL_STOPS[i]) / (RAIL_STOPS[i + 1] - RAIL_STOPS[i]);
      return RAIL_PERCENT[i] + (RAIL_PERCENT[i + 1] - RAIL_PERCENT[i]) * t;
    }
  }
  return 100;
}

export function useStageAct() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const headRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLSpanElement | null>(null);
  const levelRef = useRef(0);
  const report = useHudSource(HUD_ORDER.stage);
  const [scene, setScene] = useState(-1);
  const [line, setLine] = useState(0);

  // Layout effect: the first styles are applied before the browser paints, so nothing flashes in the wrong place.
  useLayoutEffect(() => {
    let frame = 0;
    let lastEntrance = -1;
    let lastFill = -1;

    const applyEntrance = (e: number) => {
      const k = 1 - Math.pow(1 - e, 3);
      const head = headRef.current;
      const wrap = wrapRef.current;
      const rail = railRef.current;
      if (head) {
        head.style.opacity = String(clamp(1 - e * 1.6, 0, 1));
        head.style.transform = `translateY(${(-e * 56).toFixed(1)}px) scale(${(1 - e * 0.06).toFixed(3)})`;
      }
      if (wrap) {
        wrap.style.opacity = (0.3 + 0.7 * k).toFixed(3);
        wrap.style.transform =
          k > 0.999 ? 'none' : `perspective(1800px) translateY(${((1 - k) * 52).toFixed(2)}svh) rotateX(${((1 - k) * 9).toFixed(2)}deg)`;
      }
      if (rail) rail.style.opacity = String(clamp((e - 0.5) * 2, 0, 1));
    };

    const update = () => {
      const track = trackRef.current;
      const sticky = stickyRef.current;
      if (!track || !sticky) return;

      const box = track.getBoundingClientRect();
      const total = Math.max(1, track.offsetHeight - sticky.offsetHeight);
      const scrolled = -box.top;
      const progress = clamp(scrolled / total, 0, 1);

      // which cue is active
      let nextScene = -1;
      CUE_STARTS.forEach((start, index) => {
        if (scrolled >= 0 && progress >= start) nextScene = index;
      });
      setScene(nextScene);

      // teleprompter line (state, changes five times) and waveform loudness (a ref, changes every frame)
      let nextLine = 0;
      let nextLevel = 0;
      if (nextScene === 0) {
        const local = clamp((progress - CUE_STARTS[0]) / (CUE_STARTS[1] - CUE_STARTS[0]), 0, 1);
        const lineFloat = local * LINES;
        nextLine = Math.min(LINES - 1, Math.floor(lineFloat));
        const t = lineFloat >= LINES ? 1 : lineFloat - Math.floor(lineFloat);
        // loud in the middle of a line, quiet at its edges (a small pause between lines)
        nextLevel = 0.12 + 0.88 * Math.sqrt(Math.max(0, Math.sin(Math.PI * t)));
      }
      setLine(nextLine);
      levelRef.current = nextLevel;

      // the entrance: heading lifts away while the window rises into the light
      const e = scrolled <= 0 ? 0 : clamp(progress / CUE_STARTS[0], 0, 1);
      if (Math.abs(e - lastEntrance) > 0.002) {
        lastEntrance = e;
        applyEntrance(e);
      }

      // the cue rail fill
      const fill = fillRef.current;
      const percent = scrolled <= 0 ? 0 : railPercentAt(progress);
      if (fill && Math.abs(percent - lastFill) > 0.05) {
        lastFill = percent;
        fill.style.width = `${percent.toFixed(2)}%`;
      }

      // the nav clock pill: glides from six hours left down to the launch pad time
      if (scrolled >= 0) {
        const glide = clamp((progress - CUE_STARTS[0]) / (CUE_STARTS[3] - CUE_STARTS[0]), 0, 1);
        report({ text: formatClock(CLOCK_START + (CLOCK_END - CLOCK_START) * glide), tone: 'running' });
      } else {
        report(null);
      }
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) window.cancelAnimationFrame(frame);
      report(null);
    };
  }, [report]);

  return { trackRef, stickyRef, headRef, wrapRef, railRef, fillRef, levelRef, scene, line };
}
