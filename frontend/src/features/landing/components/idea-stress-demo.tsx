import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { Lock } from 'lucide-react';
import { BracketFrame } from './bracket-frame';
import {
  IDEAS,
  IDEA_TEXT,
  RUBRIC_CRITERIA,
  STRESS_ROWS,
  rubricScore,
  verdictFor,
} from '../data/idea-demo';

export function IdeaStressDemo() {
  const [selected, setSelected] = useState(0);
  const [tested, setTested] = useState<ReadonlySet<string>>(() => new Set());
  const [testing, setTesting] = useState<string | null>(null);
  const [lockedId, setLockedId] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }
    };
  }, []);

  const idea = IDEAS[selected];
  const isTested = tested.has(idea.id);
  const isTesting = testing === idea.id;
  const isLocked = lockedId === idea.id;

  const selectIdea = (index: number) => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    setTesting(null);
    setSelected(index);
  };

  const runTest = () => {
    if (isTesting || isTested) return;
    setTesting(idea.id);
    timer.current = window.setTimeout(() => {
      setTested((previous) => new Set(previous).add(idea.id));
      setTesting(null);
      timer.current = null;
    }, 700);
  };

  const lock = () => {
    setLockedId(idea.id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = IDEAS.length - 1;
    let next = selected;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = selected === last ? 0 : selected + 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = selected === 0 ? last : selected - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else return;
    event.preventDefault();
    selectIdea(next);
    chipRefs.current[next]?.focus();
  };

  const overallScore = rubricScore(idea.rubric);
  const overallVerdict = verdictFor(overallScore);

  const criteriaRows = [
    { label: STRESS_ROWS[1], value: idea.finish, n: 1 },
    { label: STRESS_ROWS[2], value: idea.feasible, n: 2 },
    { label: STRESS_ROWS[3], value: idea.different, n: 3 },
  ];

  return (
    <div className="l-dive-frame">
      <div className="l-dive-frame-top">
        <span className="l-demo-bar-label">{IDEA_TEXT.tablistLabel}</span>
        <span className="l-mono-chip">{IDEA_TEXT.silentChip}</span>
      </div>

      <div className="l-chips" role="tablist" aria-label={IDEA_TEXT.tablistLabel} onKeyDown={onKeyDown}>
        {IDEAS.map((option, index) => (
          <button
            key={option.id}
            ref={(element) => {
              chipRefs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`idea-tab-${option.id}`}
            aria-selected={index === selected}
            aria-controls="idea-panel"
            tabIndex={index === selected ? 0 : -1}
            className="l-idea-chip"
            onClick={() => selectIdea(index)}
          >
            {option.name}
            {lockedId === option.id ? <Lock size={13} aria-hidden="true" /> : null}
          </button>
        ))}
      </div>

      <div id="idea-panel" role="tabpanel" aria-labelledby={`idea-tab-${idea.id}`}>
        <div className="l-lockable" data-locked={isLocked ? 'true' : 'false'}>
          <BracketFrame gap={10} arm={10} drawn={isLocked}>
            <div className="l-idea-card">
              <div className="l-idea-field">
                <span className="l-idea-field-label">{IDEA_TEXT.identityLabel}</span>
                <span className="l-idea-field-text">{idea.identity}</span>
              </div>
              <div className="l-idea-field">
                <span className="l-idea-field-label">{IDEA_TEXT.wowLabel}</span>
                <span className="l-idea-field-text">{idea.wow}</span>
              </div>
              <div className="l-idea-field">
                <span className="l-idea-field-label">{IDEA_TEXT.riskLabel}</span>
                <span className="l-idea-field-text">{idea.risk}</span>
              </div>
            </div>
          </BracketFrame>
        </div>

        {isTested ? (
          <div className="l-stress" key={idea.id}>
            <div className="l-stress-row">
              <div className="l-stress-top">
                <span className="l-stress-label">{STRESS_ROWS[0]}</span>
                <span className="l-verdict" data-tone={overallVerdict}>
                  {IDEA_TEXT.verdicts[overallVerdict]}
                </span>
              </div>
              <div className="l-seg">
                {RUBRIC_CRITERIA.map((criterion, i) => (
                  <span
                    key={criterion.label}
                    className="l-bar"
                    style={{ flexGrow: criterion.weight }}
                    title={criterion.label}
                  >
                    <span
                      className="l-bar-fill"
                      style={{ width: `${idea.rubric[i]}%`, '--l-i': i } as CSSProperties}
                    />
                  </span>
                ))}
              </div>
              <div className="l-seg-labels">
                {RUBRIC_CRITERIA.map((criterion) => (
                  <span key={criterion.label} style={{ flexGrow: criterion.weight }}>
                    {criterion.label}
                  </span>
                ))}
              </div>
            </div>

            {criteriaRows.map((row) => {
              const verdict = verdictFor(row.value);
              return (
                <div key={row.label} className="l-stress-row">
                  <div className="l-stress-top">
                    <span className="l-stress-label">{row.label}</span>
                    <span className="l-verdict" data-tone={verdict}>
                      {IDEA_TEXT.verdicts[verdict]}
                    </span>
                  </div>
                  <div className="l-bar">
                    <span
                      className="l-bar-fill"
                      data-tone={verdict}
                      style={{ width: `${row.value}%`, '--l-i': row.n } as CSSProperties}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="l-dive-actions">
          {!isTested ? (
            <button
              type="button"
              className="l-btn l-btn--primary l-btn--sm"
              onClick={runTest}
              aria-disabled={isTesting}
            >
              {isTesting ? IDEA_TEXT.testingLabel : IDEA_TEXT.runLabel}
            </button>
          ) : isLocked ? (
            <span className="l-locked-note">
              <span className="l-chip" data-tone="success">
                {IDEA_TEXT.lockedChip}
              </span>
              {IDEA_TEXT.lockedNote}
            </span>
          ) : (
            <>
              <button type="button" className="l-btn l-btn--primary l-btn--sm" onClick={lock}>
                {IDEA_TEXT.lockLabel}
              </button>
              <span className="l-caption">{IDEA_TEXT.leaderNote}</span>
            </>
          )}
        </div>
      </div>

      <p className="l-sr-only" aria-live="polite">
        {isTested ? `${idea.name}: stress test finished` : ''}
      </p>
    </div>
  );
}
