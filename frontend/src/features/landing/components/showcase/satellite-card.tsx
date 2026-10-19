import { Check, Lock, X } from 'lucide-react';
import { BracketHighlight } from '../bracket-highlight';
import { ReadinessRings } from '../readiness-rings';
import { DEMO_ITEMS } from '../../data/hero-demo';
import { IDEAS, STRESS_ROWS, rubricScore, verdictFor } from '../../data/idea-demo';
import { JUDGE, READINESS } from '../../data/stage-act';
import { LEDGER_MIX, LEDGER_LEGEND } from '../../data/showcase';
import type { SatelliteKind } from '../../data/showcase';

function SatelliteBody({ kind }: { kind: SatelliteKind }) {
  switch (kind) {
    case 'gate':
      return (
        <>
          <div className="l-sat-head">
            <span className="l-sat-label">Gate</span>
            <span className="l-chip" data-tone="success">Confirmed</span>
          </div>
          <p className="l-sat-title">Brief confirmed by the leader</p>
          <div className="l-sat-ticks" aria-hidden="true">
            {DEMO_ITEMS.map((item) => (
              <span key={item.id} className="l-sat-tick">
                <Check size={11} strokeWidth={3} />
              </span>
            ))}
          </div>
          <p className="l-sat-text">8 of 8 rules ticked before the plan starts.</p>
        </>
      );
    case 'rule':
      return (
        <>
          <div className="l-sat-head">
            <span className="l-sat-label">Rule found</span>
            <span className="l-mono-chip">Start rule</span>
          </div>
          <p className="l-sat-title">
            <BracketHighlight tone="ink">No commits before Fri 9:00 AM</BracketHighlight>
          </p>
          <p className="l-sat-text">Found in the pasted brief. The room warns about early commits.</p>
        </>
      );
    case 'stress': {
      const idea = IDEAS[0];
      const rows: [string, number][] = [
        [STRESS_ROWS[0], rubricScore(idea.rubric)],
        [STRESS_ROWS[1], idea.finish],
        [STRESS_ROWS[3], idea.different],
      ];
      return (
        <>
          <div className="l-sat-head">
            <span className="l-sat-label">Stress test</span>
            <span className="l-mono-chip">{idea.name}</span>
          </div>
          <div className="l-stress l-sat-stress">
            {rows.map(([label, score]) => (
              <div key={label} className="l-stress-row">
                <div className="l-stress-top">
                  <span className="l-stress-label">{label}</span>
                  <span className="l-verdict" data-tone={verdictFor(score)}>{verdictFor(score)}</span>
                </div>
                <div className="l-bar">
                  <span className="l-bar-fill" data-tone={verdictFor(score)} style={{ width: `${score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </>
      );
    }
    case 'cut':
      return (
        <>
          <div className="l-sat-head">
            <span className="l-sat-label">Cut list</span>
            <span className="l-mono-chip">2 cut</span>
          </div>
          <ul className="l-sat-list">
            <li><X size={14} aria-hidden="true" />Export to Sheets</li>
            <li><X size={14} aria-hidden="true" />Email reminders</li>
          </ul>
          <p className="l-sat-text">Scope trimmed to fit the clock.</p>
        </>
      );
    case 'blocked':
      return (
        <>
          <div className="l-sat-head">
            <span className="l-sat-label">Board</span>
            <span className="l-verdict" data-tone="low">blocked</span>
          </div>
          <p className="l-sat-title">Receipt upload API</p>
          <p className="l-sat-text">Marked blocked by Meera. The leader was notified.</p>
          <p className="l-sat-lock"><Lock size={13} aria-hidden="true" />1 task waits for this</p>
        </>
      );
    case 'ledger':
      return (
        <>
          <div className="l-sat-head">
            <span className="l-sat-label">Reality ledger</span>
            <span className="l-mono-chip">Example</span>
          </div>
          <div className="l-ledger-bar" aria-hidden="true">
            {LEDGER_MIX.map(([status, grow]) => (
              <span key={status} className="l-ledger-seg" data-status={status} style={{ flexGrow: grow }} />
            ))}
          </div>
          <p className="l-sat-legend">{LEDGER_LEGEND}</p>
          <p className="l-sat-text">Mocked parts are written down before the judges ask.</p>
        </>
      );
    case 'judge':
      return (
        <>
          <div className="l-sat-head">
            <span className="l-sat-label">Judge’s Chair</span>
            <span className="l-dots" role="img" aria-label={JUDGE.difficultyLabel}>
              {Array.from({ length: JUDGE.difficultyMax }, (_, index) => (
                <span key={index} className="l-dot" data-on={index < JUDGE.difficulty ? 'true' : 'false'} />
              ))}
            </span>
          </div>
          <p className="l-sat-title l-sat-title--serif">{JUDGE.question}</p>
          <p className="l-sat-text">{JUDGE.why}</p>
          <span className="l-chip" data-tone="success">{JUDGE.ready}</span>
        </>
      );
    case 'readiness':
      return (
        <>
          <div className="l-sat-head">
            <span className="l-sat-label">Before the judges</span>
            <span className="l-mono-chip">{READINESS.exampleChip}</span>
          </div>
          <ReadinessRings values={[100, 85, 70, 90, 30, 40]} />
          <p className="l-sat-text">{READINESS.weak}</p>
        </>
      );
  }
}

export function SatelliteCard({ kind, slot }: { kind: SatelliteKind; slot: 'a' | 'b' }) {
  return (
    <div className="l-sat l-product-ui" data-slot={slot} data-kind={kind}>
      <SatelliteBody kind={kind} />
    </div>
  );
}
