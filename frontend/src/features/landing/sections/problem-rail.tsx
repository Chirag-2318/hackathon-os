/**
 * ProblemRail — the scroll-linked problem section walking through the 36 hours.
 */
import type { ReactNode } from 'react';
import { Section } from '../components/section';
import { Container } from '../components/container';
import { Eyebrow } from '../components/eyebrow';
import { ItalicHeading } from '../components/italic-heading';
import { Reveal } from '../components/reveal';
import { UnreadRubric } from '../components/mini-visuals/unread-rubric';
import { HalfBuiltBars } from '../components/mini-visuals/half-built-bars';
import { EmptyDemo } from '../components/mini-visuals/empty-demo';
import { EmptySubmission } from '../components/mini-visuals/empty-submission';
import { NoWifi } from '../components/mini-visuals/no-wifi';
import { useRailProgress } from '../hooks/use-rail-progress';
import { RAIL_STOPS, RAIL_COPY } from '../data/rail-stops';
import type { RailVisualKey } from '../data/rail-stops';

const VISUALS: Record<RailVisualKey, ReactNode> = {
  rubric: <UnreadRubric />,
  bars: <HalfBuiltBars />,
  demo: <EmptyDemo />,
  form: <EmptySubmission />,
  wifi: <NoWifi />,
};

export function ProblemRail() {
  const { listRef, nodeRefs, legendRef, reached, late } = useRailProgress();

  return (
    <Section tone="light" className="l-rail" ariaLabelledBy="rail-heading">
      <div className="l-rail-tint" data-on={late ? 'true' : 'false'} aria-hidden="true" />
      <Container>
        <div className="l-rail-layout">
          <div className="l-rail-intro">
            <Eyebrow index={1}>{RAIL_COPY.eyebrow}</Eyebrow>
            <ItalicHeading
              as="h2"
              id="rail-heading"
              lead={RAIL_COPY.headingLead}
              em={RAIL_COPY.headingEm}
              className="l-rail-title"
            />
            <p className="l-caption">{RAIL_COPY.note}</p>
            <div className="l-rail-legend" aria-hidden="true">
              <span className="l-caption">{RAIL_COPY.legendLabel}</span>
              <span ref={legendRef} className="l-clock l-rail-legend-clock" data-urgent="false">
                {RAIL_COPY.legendClock}
              </span>
            </div>
          </div>

          <ol ref={listRef} className="l-rail-list" data-late={late ? 'true' : undefined}>
            {RAIL_STOPS.map((stop, index) => (
              <Reveal as="li" key={stop.id} className="l-rail-stop">
                <span
                  ref={(element) => {
                    nodeRefs.current[index] = element;
                  }}
                  className="l-rail-node"
                  data-late={stop.late ? 'true' : undefined}
                  data-reached={index < reached ? 'true' : 'false'}
                  data-current={index === reached - 1 ? 'true' : 'false'}
                  aria-hidden="true"
                />
                <article className="l-rail-card" data-past={index < reached - 1 ? 'true' : 'false'}>
                  <div className="l-rail-copy">
                    <p className="l-clock l-rail-time" data-late={stop.late ? 'true' : undefined}>
                      {stop.time}
                    </p>
                    <h3 className="l-rail-stop-title">{stop.title}</h3>
                    <p className="l-body">{stop.line}</p>
                  </div>
                  <div className="l-rail-visual">{VISUALS[stop.visual]}</div>
                </article>
              </Reveal>
            ))}
          </ol>
        </div>

        <div className="l-rail-closing">
          <ItalicHeading
            as="h3"
            size="h2"
            align="center"
            lead={RAIL_COPY.closingLead}
            em={RAIL_COPY.closingEm}
          />
        </div>
      </Container>
    </Section>
  );
}
