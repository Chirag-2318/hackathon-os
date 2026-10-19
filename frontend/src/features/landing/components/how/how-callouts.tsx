import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { Bracket } from '../bracket';

type Box = { label: string; left: number; top: number; width: number; height: number; above: boolean };
const PAD = 6;

export function HowCallouts({ frameRef, stageId, settled }: { frameRef: RefObject<HTMLDivElement | null>; stageId: string; settled: boolean }) {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    setDrawn(false);
    if (!frame || !settled) {
      setBoxes([]);
      return;
    }

    const measure = () => {
      const frameBox = frame.getBoundingClientRect();
      const found: Box[] = [];
      frame.querySelectorAll<HTMLElement>('.l-st-layer[data-state="rest"] [data-callout]').forEach((element) => {
        const label = element.getAttribute('data-callout');
        if (!label) return;
        const rect = element.getBoundingClientRect();
        const left = Math.max(0, rect.left - frameBox.left - PAD);
        const top = Math.max(0, rect.top - frameBox.top - PAD);
        const right = Math.min(frameBox.width, rect.right - frameBox.left + PAD);
        const bottom = Math.min(frameBox.height, rect.bottom - frameBox.top + PAD);
        const width = right - left;
        const height = bottom - top;
        if (width < 40 || height < 24) return;   // cropped away by the plate, or too small to be a useful highlight
        found.push({ label, left, top, width, height, above: bottom > frameBox.height - 44 });
      });
      setBoxes(found);
    };

    const first = window.setTimeout(measure, 80);
    const second = window.setTimeout(() => setDrawn(true), 160);
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(second);
      observer.disconnect();
    };
  }, [frameRef, stageId, settled]);

  return (
    <div className="l-hw-callouts" aria-hidden="true">
      {boxes.map((box) => (
        <div
          key={box.label}
          className="l-callout l-hw-callout"
          data-label-above={box.above ? 'true' : undefined}
          style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
        >
          <Bracket side="left" arm={8} stroke={2} drawn={drawn} />
          <Bracket side="right" arm={8} stroke={2} drawn={drawn} />
          <span className="l-callout-label" data-shown={drawn ? 'true' : 'false'}>{box.label}</span>
        </div>
      ))}
    </div>
  );
}
