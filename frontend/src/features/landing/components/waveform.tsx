import { useEffect, useMemo, useRef } from 'react';

// Decorative and deterministic: no randomness, so it looks the same on every visit.
// With `animate` the bars move on their own (about 30 frames a second) and follow `level`;
// without it they show one fixed frame.
type WaveformProps = {
  bars?: number;
  level?: number; // 0 to 1: how loud
  phase?: number; // shifts the shape
  animate?: boolean;
  className?: string;
};

const MIN = 4;
const MAX = 56;

function heightFor(index: number, level: number, phase: number): number {
  const shape = (Math.sin(index * 0.7 + phase) + Math.sin(index * 0.23 + phase * 0.6 + 1) + 2) / 4;
  return Math.round(MIN + (MAX - MIN) * level * shape);
}

export function Waveform({ bars = 48, level = 1, phase = 0, animate = false, className = '' }: WaveformProps) {
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const levelRef = useRef(level);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  const staticHeights = useMemo(
    () => Array.from({ length: bars }, (_, index) => heightFor(index, level, phase)),
    [bars, level, phase],
  );

  useEffect(() => {
    if (!animate) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    let last = 0;
    const tick = (now: number) => {
      frame = window.requestAnimationFrame(tick);
      if (now - last < 33) return;
      last = now;
      const livePhase = phase + now * 0.004;
      barRefs.current.forEach((element, index) => {
        if (element) element.style.height = `${heightFor(index, levelRef.current, livePhase)}px`;
      });
    };
    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
      // put the bars back on the fixed frame when the animation stops
      barRefs.current.forEach((element, index) => {
        if (element) element.style.height = `${heightFor(index, levelRef.current, phase)}px`;
      });
    };
  }, [animate, phase]);

  return (
    <div className={`l-wave ${className}`.trim()} aria-hidden="true">
      {staticHeights.map((height, index) => (
        <span
          key={index}
          ref={(element) => {
            barRefs.current[index] = element;
          }}
          className="l-wave-bar"
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
}
