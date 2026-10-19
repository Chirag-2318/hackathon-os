import { useEffect, useState } from 'react';
import { MousePointer2 } from 'lucide-react';
import { Bracket } from './bracket';
import { HOW_CALLOUTS } from '../data/how-callouts';

interface StageOverlayProps {
  stageId: string;
  animated: boolean;
}

export function StageOverlay({ stageId, animated }: StageOverlayProps) {
  const callouts = HOW_CALLOUTS[stageId] ?? [];
  const [reduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  const [drawn, setDrawn] = useState(!animated || reduced);
  const [moved, setMoved] = useState(false);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    if (!animated || reduced) return;
    const t1 = window.setTimeout(() => setDrawn(true), 200);
    const t2 = window.setTimeout(() => setMoved(true), 500);
    const t3 = window.setTimeout(() => setClicked(true), 1200);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [animated, reduced]);

  if (callouts.length === 0) return null;

  const target = callouts.find((callout) => callout.click) ?? callouts[0];

  return (
    <div className="l-stage-overlay" aria-hidden="true">
      {callouts.map((callout) => (
        <div
          key={callout.label}
          className="l-callout"
          data-label-above={callout.y + callout.h > 80 ? 'true' : undefined}
          style={{
            left: `${callout.x}%`,
            top: `${callout.y}%`,
            width: `${callout.w}%`,
            height: `${callout.h}%`,
          }}
        >
          <Bracket side="left" arm={8} stroke={2} drawn={drawn} />
          <Bracket side="right" arm={8} stroke={2} drawn={drawn} />
          <span className="l-callout-label" data-shown={drawn ? 'true' : 'false'}>
            {callout.label}
          </span>
        </div>
      ))}
      {animated && !reduced && target ? (
        <span
          className="l-cursor"
          data-clicked={clicked ? 'true' : 'false'}
          style={{
            left: moved ? `${target.x + target.w * 0.6}%` : '84%',
            top: moved ? `${target.y + target.h * 0.6}%` : '92%',
          }}
        >
          <MousePointer2 size={18} fill="currentColor" />
        </span>
      ) : null}
    </div>
  );
}
