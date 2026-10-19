import { REHEARSAL } from '../../../data/stage-act';

export function RehearsalScreen() {
  const lines = REHEARSAL.lines.slice(0, 5);
  const runLine = REHEARSAL.readout;

  return (
    <div className="l-ws l-ws--rehearsal">
      <div className="l-ws-head">
        <span className="l-ws-title">{REHEARSAL.barLabel}</span>
        <span className="l-ws-meta">{runLine}</span>
      </div>
      <div className="l-ws-prompter">
        {lines.map((l, i) => (
          <p key={l} className="l-ws-pline" style={{ ['--i' as string]: i }}>
            {l}
          </p>
        ))}
      </div>
      <div className="l-ws-wave">
        {Array.from({ length: 36 }, (_, i) => (
          <span key={i} style={{ ['--i' as string]: i }} />
        ))}
      </div>
    </div>
  );
}
