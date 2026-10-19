import { useEffect, useRef, useState } from 'react';
import { HUD_ORDER, useHudSource } from './use-hud';
import { LAUNCH, REHEARSAL } from '../data/stage-act';
import { formatClock, parseClock } from '../lib/clock';

// The pinned layout only exists on desktop and when the visitor has not asked for reduced motion.
const PINNED_QUERY = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)';

// Where each scene starts, as a fraction (0 to 1) of the scroll through the track.
// Before the first number the big heading is on screen (scene -1).
const SCENE_STARTS = [0.12, 0.4, 0.62, 0.78]; // rehearsal, Judge's Chair, readiness, launch pad
const LINES = REHEARSAL.lines.length;

// The clock glides from six hours left (the Present stage) down to the launch pad time.
const CLOCK_START = 6 * 3600;
const CLOCK_END = parseClock(LAUNCH.time);

// Runway length on desktop: extended from 340% to 400% of a screen so the stamp holds before scrolling away.
const RUNWAY_OLD = 340;
const RUNWAY_NEW = 400;
const RUNWAY_SCALE = RUNWAY_NEW / RUNWAY_OLD; // 400 / 340

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function useStageProgress() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const report = useHudSource(HUD_ORDER.stage);
  const [pinned, setPinned] = useState(false);
  const [scene, setScene] = useState(-1);
  const [line, setLine] = useState(0);
  const [level, setLevel] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      const track = trackRef.current;
      const sticky = stickyRef.current;
      if (!track || !sticky) return;

      const isPinned = window.matchMedia(PINNED_QUERY).matches;
      setPinned(isPinned);
      if (!isPinned) {
        report(null);
        return;
      }

      const box = track.getBoundingClientRect();
      const total = Math.max(1, track.offsetHeight - sticky.offsetHeight);
      const scrolled = -box.top; // the sticky frame is pinned at top: 0
      const progressNew = clamp(scrolled / total, 0, 1);
      // Remap progress so the existing timeline is unchanged, and the final 15% holds the finished state
      const progress = Math.min(1, progressNew * RUNWAY_SCALE);

      // which scene is active
      let nextScene = -1;
      SCENE_STARTS.forEach((start, index) => {
        if (scrolled >= 0 && progress >= start) nextScene = index;
      });
      setScene(nextScene);

      // teleprompter line and waveform loudness (only meaningful during the rehearsal scene)
      let nextLine = 0;
      let nextLevel = 0;
      if (nextScene === 0) {
        const local = clamp((progress - SCENE_STARTS[0]) / (SCENE_STARTS[1] - SCENE_STARTS[0]), 0, 1);
        const lineFloat = local * LINES;
        nextLine = Math.min(LINES - 1, Math.floor(lineFloat));
        const t = lineFloat >= LINES ? 1 : lineFloat - Math.floor(lineFloat);
        // loud in the middle of a line, quiet at its edges (a small pause between lines)
        const envelope = Math.sqrt(Math.max(0, Math.sin(Math.PI * t)));
        nextLevel = Math.round((0.12 + 0.88 * envelope) * 10) / 10;
      }
      setLine(nextLine);
      setLevel(nextLevel);

      // the HUD clock: only once the pinned frame has started
      if (scrolled >= 0) {
        const glide = clamp((progress - SCENE_STARTS[0]) / (SCENE_STARTS[3] - SCENE_STARTS[0]), 0, 1);
        const seconds = CLOCK_START + (CLOCK_END - CLOCK_START) * glide;
        report({ text: formatClock(seconds), tone: 'running' });
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

  return { trackRef, stickyRef, pinned, scene, line, level };
}
