import { DEMO_ITEMS, DEMO_TEXT } from '../../../data/hero-demo';
import { WallCursor } from '../wall-cursor';

export function BriefScreen() {
  const rows = DEMO_ITEMS;

  return (
    <div className="l-ws l-ws--brief">
      <div className="l-ws-head">
        <span className="l-ws-title">{DEMO_TEXT.paneTitle}</span>
        <span className="l-ws-meta">{DEMO_TEXT.itemsFound}</span>
      </div>
      <div className="l-ws-rows">
        {rows.map((r, i) => (
          <div key={r.label} className={`l-ws-row${i >= 6 ? ' l-ws-row--late' : ''}`} style={{ ['--i' as string]: i - 6 }}>
            <span className="l-ws-check">
              <svg viewBox="0 0 10 10" width="8" height="8">
                <path d="M1.5 5.2 L4 7.6 L8.5 2.4" />
              </svg>
            </span>
            <span className="l-ws-rowlabel">{r.label}</span>
            <span className="l-ws-rowvalue">{r.value}</span>
          </div>
        ))}
      </div>
      <div className="l-ws-btn l-ws-btn--off l-ws-confirm">
        <span className="l-ws-confirm__off">{DEMO_TEXT.confirmLabel}</span>
        <span className="l-ws-confirm__on">{DEMO_TEXT.confirmedLabel}</span>
      </div>
      <WallCursor x={300} y={120} dx={-272} dy={52} delay={400} />
    </div>
  );
}
