import { useCallback, useEffect, useRef, useState } from 'react';
import { HUD_ORDER, useHudSource } from './use-hud';
import { HOW_STAGES } from '../data/how-stages';
import { formatClock, parseClock } from '../lib/clock';

const STICKY_TOP = 112; // must match the CSS `top` of .l-how-sticky
const COUNT = HOW_STAGES.length;
const SECONDS = HOW_STAGES.map((stage) => parseClock(stage.time));

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function useHowProgress() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const report = useHudSource(HUD_ORDER.how);
  const [active, setActive] = useState(0);
  const [reduced] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    // With reduced motion the stacked cards are shown instead of the sticky tour, so nothing is tracked.
    if (reduced) return;
    let frame = 0;

    const update = () => {
      const track = trackRef.current;
      const sticky = stickyRef.current;
      if (!track || !sticky) return;
      // The tour is hidden on phones and tablets (display: none), where there is nothing to track.
      if (track.offsetParent === null) {
        report(null);
        return;
      }
      const trackBox = track.getBoundingClientRect();
      const total = Math.max(1, trackBox.height - sticky.offsetHeight);
      const scrolled = STICKY_TOP - trackBox.top;
      const progress = clamp(scrolled / total, 0, 1);

      setActive(Math.min(COUNT - 1, Math.floor(progress * COUNT)));

      if (scrolled >= 0) {
        // The clock glides between the stage times. Stage i sits at the middle of its own scroll slice.
        const position = clamp(progress * COUNT - 0.5, 0, COUNT - 1);
        const from = Math.floor(position);
        const to = Math.min(from + 1, COUNT - 1);
        const seconds = SECONDS[from] + (SECONDS[to] - SECONDS[from]) * (position - from);
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
  }, [reduced, report]);

  // Scrolls the page so the given stage is the active one (used by clicks and the arrow keys).
  const goTo = useCallback(
    (index: number) => {
      const track = trackRef.current;
      const sticky = stickyRef.current;
      if (!track || !sticky) return;
      const trackTop = track.getBoundingClientRect().top + window.scrollY;
      const total = Math.max(1, track.offsetHeight - sticky.offsetHeight);
      const target = trackTop - STICKY_TOP + ((index + 0.5) / COUNT) * total;
      window.scrollTo({ top: target, behavior: reduced ? 'auto' : 'smooth' });
      setActive(index);
    },
    [reduced],
  );

  return { trackRef, stickyRef, active, goTo };
}
