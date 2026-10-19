import { useEffect, useRef, useState } from 'react';
import { HUD_ORDER, useHudSource } from './use-hud';
import { RAIL_STOPS } from '../data/rail-stops';
import { formatClock, parseClock } from '../lib/clock';

// Seconds remaining at each stop (read from the data file, so the two never disagree).
const ANCHORS = RAIL_STOPS.map((stop) => parseClock(stop.time));
const FIRST_LATE_INDEX = RAIL_STOPS.findIndex((stop) => stop.late);
const URGENT_BELOW_SECONDS = 6 * 3600; // under six hours left the clock turns red
const TRIGGER = 0.55; // the trigger line sits at 55% of the viewport height
const RAIL_LINE_INSET = 8; // the rail line starts and ends 8px inside the list

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Seconds remaining when the trigger line is at triggerY. Piecewise linear between the stop positions,
// then runs down to zero between the last stop and the bottom of the list.
function secondsAt(triggerY: number, centers: number[], listBottom: number): number {
  const lastIndex = centers.length - 1;
  if (triggerY <= centers[0]) return ANCHORS[0];
  for (let i = 0; i < lastIndex; i += 1) {
    if (triggerY < centers[i + 1]) {
      const t = (triggerY - centers[i]) / (centers[i + 1] - centers[i]);
      return ANCHORS[i] + (ANCHORS[i + 1] - ANCHORS[i]) * t;
    }
  }
  const span = Math.max(1, listBottom - centers[lastIndex]);
  const t = clamp((triggerY - centers[lastIndex]) / span, 0, 1);
  return ANCHORS[lastIndex] * (1 - t);
}

export function useRailProgress() {
  const listRef = useRef<HTMLOListElement | null>(null);
  const nodeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const legendRef = useRef<HTMLSpanElement | null>(null);
  const report = useHudSource(HUD_ORDER.rail);
  const [reached, setReached] = useState(0);
  // With reduced motion nothing is scroll-linked: the rail simply shows its finished state.
  const [reduced] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (reduced) {
      setReached(RAIL_STOPS.length);
      return;
    }

    let frame = 0;

    const update = () => {
      const list = listRef.current;
      if (!list) return;
      const centers: number[] = [];
      for (const node of nodeRefs.current) {
        if (!node) return;
        const box = node.getBoundingClientRect();
        centers.push(box.top + box.height / 2);
      }
      if (centers.length < RAIL_STOPS.length) return;

      const triggerY = window.innerHeight * TRIGGER;
      const listBox = list.getBoundingClientRect();

      // 1) the rail fill, from the top of the line down to the trigger line
      const fill = clamp(triggerY - (listBox.top + RAIL_LINE_INSET), 0, listBox.height - 2 * RAIL_LINE_INSET);
      list.style.setProperty('--l-rail-fill', `${fill}px`);

      // 2) which stops have been reached
      setReached(centers.filter((center) => triggerY >= center).length);

      // 3) the clock
      const seconds = Math.round(secondsAt(triggerY, centers, listBox.bottom));
      const text = formatClock(seconds);
      const urgent = seconds < URGENT_BELOW_SECONDS;
      const legend = legendRef.current;
      if (legend) {
        legend.textContent = text;
        legend.dataset.urgent = urgent ? 'true' : 'false';
      }
      // The rail only takes part once its list has reached the trigger line; before that the HUD shows its default.
      if (listBox.top <= triggerY) report({ text, tone: urgent ? 'urgent' : 'running' });
      else report(null);
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
  }, [reduced, report]);

  // The last two stops are the "late" ones: from the moment the first late stop is reached the rail turns red.
  const late = reached > FIRST_LATE_INDEX;

  return { listRef, nodeRefs, legendRef, reached, late };
}
