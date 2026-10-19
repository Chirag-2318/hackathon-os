import { useEffect, useRef, useState } from 'react';
import { SHOWCASE_VIEWS } from '../data/showcase';
import { formatClock, parseClock } from '../lib/clock';

export const SHOWCASE_AUTOPLAY_MS = 4600;
const COUNT = SHOWCASE_VIEWS.length;

// State for the hero product tour: which tab is active, the room clock, and when the tour plays by itself.
// It plays only while the tour is on screen, pauses while the pointer is over it, and stops for good
// as soon as the visitor picks a tab. With reduced motion it never advances on its own.
export function useShowcase() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [visible, setVisible] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [reduced] = useState<boolean>(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.3 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const playing = visible && !stopped && !hovering && !reduced;

  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => setActive((current) => (current + 1) % COUNT), SHOWCASE_AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [playing, active]);

  // the room clock restarts at each tab's own time, then counts down in real seconds while the tour is on screen
  useEffect(() => {
    setElapsed(0);
  }, [active]);
  useEffect(() => {
    if (!visible || reduced) return;
    const id = window.setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(id);
  }, [visible, reduced]);

  const view = SHOWCASE_VIEWS[active];
  const clock = formatClock(parseClock(view.time) - elapsed);

  const select = (index: number, byVisitor: boolean) => {
    if (byVisitor) setStopped(true);
    setActive(index);
  };

  return { ref, active, view, clock, playing, select, setHovering };
}
