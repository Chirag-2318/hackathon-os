import type { SatelliteSpec } from '../../data/stage-cues';
import { satellitesFor } from '../../data/stage-cues';

function Body({ spec }: { spec: SatelliteSpec }) {
  switch (spec.kind) {
    case 'timer':
      return (
        <>
          <p className="l-sat-big">{spec.value}</p>
          <p className="l-sat-text">{spec.note}</p>
        </>
      );
    case 'note':
      return <p className="l-sat-text">{spec.text}</p>;
    case 'ledger':
      return (
        <>
          <p className="l-sat-text">{spec.note}</p>
          <div className="l-sat-rows">
            {spec.rows.map((row) => (
              <div key={row.name} className="l-sat-row">
                <span>{row.name}</span>
                <span className="l-verdict" data-tone="risky">{row.status}</span>
              </div>
            ))}
          </div>
        </>
      );
    case 'milestones':
      return (
        <ol className="l-sat-miles">
          {spec.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      );
    case 'result':
      return <p className="l-sat-result">{spec.text}</p>;
  }
}

function Satellite({ spec, slot }: { spec: SatelliteSpec; slot: 'a' | 'b' }) {
  const late = spec.kind === 'milestones' || spec.kind === 'result';
  return (
    <div className="l-sat l-product-ui" data-product-theme="dark" data-slot={slot} data-late={late ? 'true' : undefined}>
      <div className="l-sat-head">
        <span className="l-sat-label">{spec.label}</span>
      </div>
      <Body spec={spec} />
    </div>
  );
}

export function StageSatellites({ index, submitted }: { index: number; submitted: boolean }) {
  const specs = satellitesFor(index, submitted);
  return (
    <>
      {specs.a ? <Satellite key={`${index}-${submitted}-a`} spec={specs.a} slot="a" /> : null}
      {specs.b ? <Satellite key={`${index}-${submitted}-b`} spec={specs.b} slot="b" /> : null}
    </>
  );
}
