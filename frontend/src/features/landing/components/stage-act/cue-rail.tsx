import type { RefObject } from 'react';
import { STAGE_CUES } from '../../data/stage-cues';

// A theatre cue sheet: four cues on a dashed rail. The fill is moved by the scroll hook (no re-render per scroll).
export function CueRail({ active, fillRef }: { active: number; fillRef: RefObject<HTMLSpanElement | null> }) {
  return (
    <div className="l-cue" aria-hidden="true">
      <div className="l-cue-track">
        <span ref={fillRef} className="l-cue-fill" />
      </div>
      <ol className="l-cue-list">
        {STAGE_CUES.map((cue, index) => (
          <li key={cue.id} className="l-cue-item" data-state={index < active ? 'past' : index === active ? 'active' : 'future'}>
            <span className="l-cue-dot" />
            <span className="l-cue-name">
              <span className="l-cue-index">{`[ ${cue.index} ]`}</span>
              <span className="l-cue-label">{cue.label}</span>
            </span>
            <span className="l-cue-time">{cue.time}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
