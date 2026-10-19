/**
 * Hero — the top-of-page section with headline, CTA buttons,
 * and the interactive hero demo frame.
 */
import { Section } from '../components/section';
import { Container } from '../components/container';
import { ItalicHeading } from '../components/italic-heading';
import { Eyebrow } from '../components/eyebrow';
import { Button } from '../components/button';
import { Showcase } from '../components/showcase/showcase';
import { Rise } from '../components/rise';
import { HERO_COPY } from '../data/hero-copy';
import { HeroFloatingBg } from '../components/hero-floating-bg';

export function Hero() {
  return (
    <Section tone="light" grid className="l-hero" ariaLabelledBy="hero-heading">
      <HeroFloatingBg />
      <div className="l-hero-wash" aria-hidden="true" />
      <Container>
        <div className="l-hero-inner">
          <Rise index={0}>
            <Eyebrow preserveCase className="l-pill">{HERO_COPY.eyebrow}</Eyebrow>
          </Rise>

          <Rise index={1} className="l-hero-title">
            <ItalicHeading
              as="h1"
              id="hero-heading"
              align="center"
              lead={[...HERO_COPY.headingLead]}
              em={HERO_COPY.headingEm}
              gradientDot
            />
          </Rise>

          <Rise index={2} className="l-hero-lead">
            <p className="l-lead" style={{ marginInline: 'auto' }}>{HERO_COPY.lead}</p>
          </Rise>

          <Rise index={3} className="l-hero-cta">
            <Button to={HERO_COPY.primaryCta.to} size="lg" arrow>{HERO_COPY.primaryCta.label}</Button>
            <Button to={HERO_COPY.secondaryCta.to} size="lg" variant="secondary">{HERO_COPY.secondaryCta.label}</Button>
          </Rise>

          <Rise index={4} className="l-hero-note">
            <p className="l-caption">{HERO_COPY.note}</p>
          </Rise>

          <p className="l-sr-only">{HERO_COPY.clockNote}</p>

          <Rise index={5} className="l-hero-demo">
            <Showcase />
          </Rise>
        </div>
      </Container>
    </Section>
  );
}
