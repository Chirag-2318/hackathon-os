import type { CSSProperties } from 'react';
import { Section } from '../components/section';
import { Container } from '../components/container';
import { Eyebrow } from '../components/eyebrow';
import { ItalicHeading } from '../components/italic-heading';
import { useInViewOnce } from '../hooks/use-in-view-once';
import { TRUST_COPY, TRUST_ROWS } from '../data/trust';
import { noOrphan } from '../lib/no-orphan';

export function Trust() {
  const { ref, inView } = useInViewOnce<HTMLUListElement>();

  return (
    <Section tone="light" className="l-trust" ariaLabelledBy="trust-heading">
      <Container>
        <div className="l-sec-head">
          <Eyebrow index={7}>{TRUST_COPY.eyebrow}</Eyebrow>
          <ItalicHeading as="h2" id="trust-heading" lead={TRUST_COPY.headingLead} em={TRUST_COPY.headingEm} />
        </div>
        <ul ref={ref} className={`l-trust-list${inView ? ' is-in' : ''}`}>
          {TRUST_ROWS.map((row, index) => (
            <li
              key={row.term}
              className="l-trust-row"
              style={{ '--i': index } as CSSProperties}
            >
              <span className="l-trust-term">{row.term}</span>
              <p className="l-trust-meaning">{noOrphan(row.meaning)}</p>
              <span className="l-trust-detail">{row.detail}</span>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
