import { IDEAS, IDEA_TEXT } from '../../../data/idea-demo';

const scores = [
  { label: 'Impact', value: 82 },
  { label: 'Feasibility', value: 64 },
  { label: 'Mock risk', value: 30 },
];

export function IdeaScreen() {
  const titles = IDEAS.map((item) => item.name);

  return (
    <div className="l-ws l-ws--idea">
      <div className="l-ws-head">
        <span className="l-ws-title">{IDEA_TEXT.tablistLabel}</span>
        <span className="l-ws-meta">{IDEA_TEXT.runLabel}</span>
      </div>
      <div className="l-ws-pills">
        {titles.map((t, i) => (
          <span key={t} className={`l-ws-pill${i === 0 ? ' is-active' : ''}`}>
            {t}
          </span>
        ))}
      </div>
      <div className="l-ws-scores">
        {scores.map((s, i) => (
          <div key={s.label} className="l-ws-score" style={{ ['--v' as string]: `${s.value}%`, ['--i' as string]: i }}>
            <span className="l-ws-scorelabel">{s.label}</span>
            <span className="l-ws-track">
              <span className="l-ws-fill" />
            </span>
            <span className="l-ws-scorenum">{s.value}</span>
          </div>
        ))}
      </div>
      <div className="l-ws-lock">
        <span className="l-ws-btn l-ws-btn--ink">{IDEA_TEXT.lockLabel}</span>
        <span className="l-ws-lockmark" aria-hidden="true">
          [ locked ]
        </span>
      </div>
    </div>
  );
}
