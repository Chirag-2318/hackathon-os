const columns = [
  { name: 'Now',   cards: ['Receipt upload flow', 'Budget total view'] },
  { name: 'Next',  cards: ['Export to Sheets', 'Demo script'] },
  { name: 'Later', cards: ['Polish empty states', 'Backup video'] },
];

export function PlanScreen() {
  return (
    <div className="l-ws l-ws--plan">
      <div className="l-ws-head">
        <span className="l-ws-title">Plan</span>
        <span className="l-ws-meta">phase 2 of 4</span>
      </div>
      <div className="l-ws-cols">
        {columns.map((c) => (
          <div key={c.name} className="l-ws-col">
            <span className="l-ws-colname">{c.name}</span>
            {c.cards.map((card, i) => (
              <div key={card} className={`l-ws-card${c.name === 'Now' && i === 0 ? ' l-ws-card--work' : ''}`}>
                <span className="l-ws-cardtext">{card}</span>
                <span className="l-ws-dot" />
                {c.name === 'Now' && i === 0 ? (
                  <span className="l-ws-card__bar">
                    <span />
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
