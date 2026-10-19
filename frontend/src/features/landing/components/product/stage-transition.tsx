import { useLayoutEffect, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export const STAGE_TRANSITION_MS = 700;

type Direction = 'forward' | 'backward';
type Layer = { id: number; state: 'enter' | 'exit' | 'rest'; dir: Direction; frozen: ReactNode };

type StageTransitionProps = {
  viewKey: string;                              // changes when the stage changes
  direction: Direction;                         // 'forward' when moving to a later stage
  onSettledChange?: (settled: boolean) => void; // false when a transition starts, true when it has finished
  children: ReactNode;                          // the CURRENT stage's content
};

export function StageTransition({ viewKey, direction, onSettledChange, children }: StageTransitionProps) {
  const [layers, setLayers] = useState<Layer[]>(() => [{ id: 0, state: 'rest', dir: direction, frozen: null }]);
  const [edge, setEdge] = useState<{ id: number; dir: Direction } | null>(null);
  const committedChildren = useRef<ReactNode>(children);
  const committedKey = useRef(viewKey);
  const idCounter = useRef(0);
  const timer = useRef<number | null>(null);
  const settledCallback = useRef(onSettledChange);
  settledCallback.current = onSettledChange;

  // Runs before the browser paints, so the old page is never replaced by the new one for even one frame.
  useLayoutEffect(() => {
    if (viewKey !== committedKey.current) {
      const outgoing = committedChildren.current;
      committedKey.current = viewKey;
      if (timer.current !== null) window.clearTimeout(timer.current);
      idCounter.current += 1;
      const id = idCounter.current;
      setLayers((previous) => {
        const last = previous[previous.length - 1];
        return [
          { ...last, state: 'exit', dir: direction, frozen: outgoing },
          { id, state: 'enter', dir: direction, frozen: null },
        ];
      });
      setEdge({ id, dir: direction });
      settledCallback.current?.(false);
      timer.current = window.setTimeout(() => {
        setLayers((previous) => [{ ...previous[previous.length - 1], state: 'rest' }]);
        setEdge(null);
        settledCallback.current?.(true);
      }, STAGE_TRANSITION_MS);
    }
    committedChildren.current = children;
  });

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  return (
    <div className="l-st-host">
      {layers.map((layer, index) => (
        <div key={layer.id} className="l-st-layer" data-state={layer.state} data-dir={layer.dir}>
          {index === layers.length - 1 ? children : layer.frozen}
        </div>
      ))}
      {edge ? <span key={edge.id} className="l-st-edge" data-dir={edge.dir} aria-hidden="true" /> : null}
    </div>
  );
}
