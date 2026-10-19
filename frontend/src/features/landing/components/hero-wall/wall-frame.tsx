import type { ReactNode } from 'react';
import type { WallFrameDef } from '../../data/hero-wall';

type WallFrameProps = {
  def: WallFrameDef;
  focused: boolean;
  /** register the element so the camera can measure it */
  frameRef?: (el: HTMLDivElement | null) => void;
  children: ReactNode;
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function WallFrame({ def, focused, frameRef, children }: WallFrameProps) {
  const caption = def.journeyIndex !== null ? `[ ${pad(def.journeyIndex)} ]  ${def.label}` : def.label;
  return (
    <div
      ref={frameRef}
      className={`l-wall-frame${focused ? ' is-focus' : ''}${def.colSpan === 2 ? ' l-wall-frame--wide' : ''}`}
      data-key={def.key}
      data-screen={def.screen}
      style={{ gridColumn: `${def.col} / span ${def.colSpan}`, gridRow: `${def.row}` }}
    >
      <div className="l-wall-frame__head">
        <span className="l-wall-frame__label">{caption}</span>
        {def.time ? <span className="l-wall-frame__time">{def.time}</span> : null}
      </div>
      <div className="l-wall-frame__screen">{children}</div>
    </div>
  );
}
