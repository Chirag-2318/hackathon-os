import { LEDGER_ROWS, LEDGER_STATUSES, LEDGER_TEXT } from '../../../data/ledger-demo';

export function LedgerScreen() {
  const components = LEDGER_ROWS.map((r) => ({
    name: r.name,
    status: r.initial,
    statusLabel: LEDGER_STATUSES.find((s) => s.id === r.initial)?.label ?? r.initial,
  }));

  const mix = LEDGER_STATUSES.map((s) => ({
    status: s.id,
    count: LEDGER_ROWS.filter((r) => r.initial === s.id).length,
  }));

  return (
    <div className="l-ws l-ws--ledger">
      <div className="l-ws-head">
        <span className="l-ws-title">{LEDGER_TEXT.barLabel}</span>
        <span className="l-ws-meta">example</span>
      </div>
      <div className="l-ws-mix">
        {mix.map((m, i) => (
          <span
            key={m.status}
            className={`l-ws-mixseg l-ws-mixseg--${m.status}`}
            style={{ flexGrow: m.count, ['--i' as string]: i }}
          />
        ))}
      </div>
      <div className="l-ws-rows">
        {components.map((c) => (
          <div key={c.name} className="l-ws-lrow">
            <span className="l-ws-rowlabel">{c.name}</span>
            <span className={`l-ws-chip l-ws-chip--${c.status}`}>{c.statusLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
