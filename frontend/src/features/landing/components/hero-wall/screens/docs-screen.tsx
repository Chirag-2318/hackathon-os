const WIDTHS = [72, 58, 84, 64, 76, 52, 80, 60, 68];

export function DocsScreen() {
  return (
    <div className="l-ws l-ws--docs">
      <div className="l-ws-head">
        <span className="l-ws-skel" style={{ width: '56px', height: '8px' }} />
      </div>
      <div className="l-ws-rows">
        {WIDTHS.map((w, i) => (
          <div key={i} className="l-ws-row">
            <span className="l-ws-docicon" />
            <span className="l-ws-skel" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
