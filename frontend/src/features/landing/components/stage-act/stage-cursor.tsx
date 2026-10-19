import { MousePointer2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

type Target = { x: number; y: number; w: number; h: number };

export function StageCursor({ frameRef, active, onPress }: { frameRef: RefObject<HTMLDivElement | null>; active: boolean; onPress: () => void }) {
  const [target, setTarget] = useState<Target | null>(null);
  const [phase, setPhase] = useState<'idle' | 'moving' | 'tap'>('idle');
  const pressRef = useRef(onPress);
  pressRef.current = onPress;

  useEffect(() => {
    setTarget(null);
    setPhase('idle');
    if (!active) return;
    const frame = frameRef.current;
    if (!frame) return;
    const timers: number[] = [];

    const measure = (): boolean => {
      const element = frame.querySelector<HTMLElement>('.l-st-layer[data-state="rest"] [data-callout="Leader only"]');
      if (!element) return false;
      const frameBox = frame.getBoundingClientRect();
      const rect = element.getBoundingClientRect();
      setTarget({ x: rect.left - frameBox.left, y: rect.top - frameBox.top, w: rect.width, h: rect.height });
      return true;
    };

    timers.push(
      window.setTimeout(() => {
        if (measure()) {
          timers.push(window.setTimeout(() => setPhase('moving'), 140));
          timers.push(window.setTimeout(() => setPhase('tap'), 900));
          timers.push(window.setTimeout(() => pressRef.current(), 1100));
        } else {
          timers.push(window.setTimeout(() => pressRef.current(), 1200));
        }
      }, 140),
    );

    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(frame);
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      observer.disconnect();
    };
  }, [active, frameRef]);

  if (!active || !target) return null;
  return (
    <>
      <button
        type="button"
        className="l-sg-press"
        style={{ left: target.x, top: target.y, width: target.w, height: target.h }}
        onClick={() => pressRef.current()}
        aria-label="Mark as submitted (example)"
      />
      <span className="l-sg-cursor" data-phase={phase} aria-hidden="true" style={{ left: target.x + target.w * 0.62, top: target.y + target.h * 0.6 }}>
        <MousePointer2 size={20} fill="currentColor" />
      </span>
    </>
  );
}
