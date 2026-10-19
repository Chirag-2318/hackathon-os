import { READINESS } from '../../../data/stage-act';

export function ReadinessScreen() {
  return (
    <div className="l-ws l-ws--readiness">
      {READINESS.rings.map((r, i) => (
        <div key={r.label} className={`l-ws-ring${r.value < 80 ? ' l-ws-ring--warn' : ''}`}>
          <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
            <circle className="l-ws-ring__track" cx="20" cy="20" r="16" />
            <circle
              className="l-ws-ring__value"
              cx="20"
              cy="20"
              r="16"
              pathLength="100.5"
              style={{ ['--p' as string]: r.value, ['--i' as string]: i }}
            />
            <text className="l-ws-ring__num" x="20" y="23" textAnchor="middle">
              {r.value}%
            </text>
          </svg>
          <span>{r.label}</span>
        </div>
      ))}
    </div>
  );
}
