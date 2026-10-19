import { Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Blueprint } from '../components/blueprint';
import { Container } from '../components/container';
import { DOOR_VISUALS } from '../components/door-visuals';
import { Eyebrow } from '../components/eyebrow';
import { ItalicHeading } from '../components/italic-heading';
import { Reveal } from '../components/reveal';
import { Section } from '../components/section';
import { DOORS, DOORS_COPY } from '../data/doors';

// Gutter lines sit in the middle of the gaps between the three columns (equal columns, 24px gap).
const VERTICALS = ['-16px', 'calc((100% - 48px) / 3 + 12px)', 'calc((100% - 48px) * 2 / 3 + 36px)', 'calc(100% + 16px)'];
const HORIZONTALS = ['-32px', 'calc(100% + 32px)'];

export function Doors() {
  return (
    <Section tone="light" className="l-paths" ariaLabelledBy="paths-heading">
      <Container>
        <div className="l-paths-head">
          <Eyebrow preserveCase>{DOORS_COPY.eyebrow}</Eyebrow>
          <ItalicHeading as="h2" id="paths-heading" lead={DOORS_COPY.headingLead} em={DOORS_COPY.headingEm} />
          <p className="l-lead">{DOORS_COPY.lead}</p>
        </div>
        <div className="l-paths-wrap">
          <Blueprint verticals={VERTICALS} horizontals={HORIZONTALS} reach={64} />
          <ul className="l-paths-grid">
            {DOORS.map((door, index) => (
              <Reveal as="li" key={door.id} index={index}>
                <Link to={door.to} className="l-path">
                  <span className="l-path-top">
                    <span className="l-path-tag">{`[ ${door.index} ]`}</span>
                    <span className="l-path-state" data-live={door.live ? 'true' : undefined}>
                      {door.live ? <span className="l-live-dot" aria-hidden="true" /> : null}
                      {door.state}
                    </span>
                  </span>
                  <span className="l-path-title">{door.title}</span>
                  <span className="l-path-line">{door.line}</span>
                  <span className="l-path-visual" aria-hidden="true">{DOOR_VISUALS[door.id]}</span>
                  <span className="l-path-list">
                    {door.outcomes.map((outcome) => (
                      <span key={outcome} className="l-path-item"><Check size={15} strokeWidth={2.5} aria-hidden="true" />{outcome}</span>
                    ))}
                  </span>
                  <span className="l-path-cta">{door.cta}<ArrowRight className="l-path-arrow" size={16} aria-hidden="true" /></span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}
