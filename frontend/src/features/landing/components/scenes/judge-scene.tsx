import { JUDGE } from '../../data/stage-act';
import { LEDGER_ROWS, LEDGER_STATUSES } from '../../data/ledger-demo';

export function JudgeScene() {
  const firstComponent = LEDGER_ROWS[0];
  const builtStatus =
    LEDGER_STATUSES.find((s) => s.id === firstComponent.initial)?.label ?? 'Built';

  const ledgerRows = [
    { name: firstComponent.name, status: builtStatus, tone: 'mint' as const },
    ...JUDGE.ledgerRows.map((row) => ({
      name: row.name,
      status: row.status,
      tone: 'sun' as const,
    })),
  ];

  return (
    <div className="l-judge">
      <div className="l-judge__left">
        <div className="l-judge-stack">
          <span className="l-judge-back l-judge-back--2" aria-hidden="true" />
          <span className="l-judge-back l-judge-back--1" aria-hidden="true" />
          <div className="l-judge-card">
            <div className="l-judge-top">
              <span className="l-judge-label">{JUDGE.cardLabel}</span>
              <span className="l-dots" role="img" aria-label={JUDGE.difficultyLabel}>
                {Array.from({ length: JUDGE.difficultyMax }, (_, index) => (
                  <span
                    key={index}
                    className="l-dot"
                    data-on={index < JUDGE.difficulty ? 'true' : 'false'}
                  />
                ))}
              </span>
            </div>
            <p className="l-judge-question">{JUDGE.question}</p>
            <p className="l-judge-why">{JUDGE.why}</p>
            <p className="l-judge-risk">
              <span className="l-judge-risk-dot" aria-hidden="true" />
              {JUDGE.risk}
            </p>
          </div>
        </div>

        <div className="l-judge__meta">
          <div className="l-judge__timer">
            <svg className="l-judge__ring" viewBox="0 0 44 44" aria-hidden="true">
              <circle className="track" cx="22" cy="22" r="18" />
              <circle className="value" cx="22" cy="22" r="18" />
            </svg>
            <span>{JUDGE.timerLabel}</span>
          </div>
          <span className="l-stage-chip" data-tone="mint">
            {JUDGE.ready}
          </span>
        </div>
      </div>

      <div className="l-judge__right">
        <p className="l-judge__label">{JUDGE.ledgerLabel}</p>
        <div className="l-judge__rows">
          {ledgerRows.map((row) => (
            <div key={row.name} className="l-judge__row">
              <span>{row.name}</span>
              <span className="l-stage-chip" data-tone={row.tone}>
                {row.status}
              </span>
            </div>
          ))}
        </div>

        <div className="l-judge__next">
          <p className="l-judge__label">{JUDGE.nextLabel}</p>
          {JUDGE.nextQuestions.map((q) => (
            <p key={q}>{q}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
