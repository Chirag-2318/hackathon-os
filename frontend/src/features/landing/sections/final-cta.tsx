import { Section } from '../components/section';
import { Container } from '../components/container';
import { Bracket } from '../components/bracket';
import { ItalicHeading } from '../components/italic-heading';
import { Button } from '../components/button';
import { useInViewOnce } from '../hooks/use-in-view-once';
import { FINAL_COPY } from '../data/final-cta';

export function FinalCta() {
  const { ref, inView } = useInViewOnce<HTMLDivElement>(0.3);

  return (
    <Section id="final-cta" tone="dark" grid grain className="l-final" ariaLabelledBy="final-heading">
      <Container>
        <div ref={ref} className="l-final-frame">
          <Bracket side="left" arm={48} stroke={2} drawn={inView} />
          <Bracket side="right" arm={48} stroke={2} drawn={inView} />
          <div className="l-final-content">
            <ItalicHeading
              as="h2"
              id="final-heading"
              size="display-xl"
              align="center"
              lead={FINAL_COPY.headingLead}
              em={FINAL_COPY.headingEm}
            />
            <div className="l-final-actions">
              <Button to={FINAL_COPY.primary.to} size="lg" arrow on="dark">
                {FINAL_COPY.primary.label}
              </Button>
              <Button to={FINAL_COPY.secondary.to} size="lg" variant="secondary" on="dark">
                {FINAL_COPY.secondary.label}
              </Button>
            </div>
            <p className="l-caption">{FINAL_COPY.caption}</p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
