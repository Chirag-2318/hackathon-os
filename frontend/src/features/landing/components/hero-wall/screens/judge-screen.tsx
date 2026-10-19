import { JUDGE } from '../../../data/stage-act';

export function JudgeScreen() {
  const question = JUDGE.question;
  const chips = JUDGE.ledgerRows.map((r) => ({
    name: r.name,
    status: r.status.toLowerCase(),
    statusLabel: r.status,
  }));

  return (
    <div className="l-ws l-ws--judge">
      <div className="l-ws-qstack">
        <div className="l-ws-qcard l-ws-qcard--back" />
        <div className="l-ws-qcard">
          <span className="l-ws-meta">{JUDGE.cardLabel}</span>
          <p className="l-ws-q">{question}</p>
          <span className="l-ws-chip l-ws-chip--ok l-ws-ready">{JUDGE.ready}</span>
        </div>
      </div>
      <div className="l-ws-side">
        <span className="l-ws-meta">{JUDGE.wallLedgerLabel}</span>
        {chips.map((c) => (
          <span key={c.name} className="l-ws-lrow">
            <span className="l-ws-rowlabel">{c.name}</span>
            <span className={`l-ws-chip l-ws-chip--${c.status}`}>{c.statusLabel}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
