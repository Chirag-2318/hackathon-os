import { ItalicHeading } from '../components/italic-heading';
import { usePivotHud } from '../hooks/use-pivot-hud';
import { PIVOT_COPY } from '../data/pivot-copy';
import { formatClock } from '../lib/clock';

export function Pivot() {
  const { sectionRef, clockRef, cueRef } = usePivotHud();

  return (
    <section ref={sectionRef} className="l-pivot" data-tone="red" aria-labelledby="pivot-heading">
      <div className="l-pivot__sticky">
        <span className="l-pivot__bracket l-pivot__bracket--l" aria-hidden="true" />
        <span className="l-pivot__bracket l-pivot__bracket--r" aria-hidden="true" />
        <div className="l-pivot__stack">
          <p className="l-pivot__clock" aria-hidden="true">
            <span ref={clockRef}>{formatClock(0)}</span>
          </p>
          <ItalicHeading
            as="h2"
            id="pivot-heading"
            size="display-xl"
            align="center"
            lead={PIVOT_COPY.headingLead}
            em={PIVOT_COPY.headingEm}
            className="l-pivot__heading"
          />
          <p className="l-pivot__sub">{PIVOT_COPY.line}</p>
        </div>
        <p ref={cueRef} className="l-pivot__cue" aria-hidden="true">
          {PIVOT_COPY.cue}
        </p>
      </div>
    </section>
  );
}
