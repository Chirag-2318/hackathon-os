/**
 * HalfBuiltBars — mini visual showing fragmented, partially complete feature bars.
 */
const BARS: readonly [string, number][] = [
  ['login', 62],
  ['feed', 41],
  ['search', 74],
  ['upload', 33],
  ['chat', 55],
];

export function HalfBuiltBars() {
  return (
    <div className="l-mv l-mv--bars" aria-hidden="true">
      {BARS.map(([label, percent]) => (
        <div key={label} className="l-mv-row">
          <span className="l-mv-label">{label}</span>
          <span className="l-mv-track">
            <span className="l-mv-fill" style={{ width: `${percent}%` }} />
          </span>
        </div>
      ))}
    </div>
  );
}
