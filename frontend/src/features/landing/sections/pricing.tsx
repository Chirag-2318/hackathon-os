import { useState, lazy, Suspense } from 'react';
import { Check } from 'lucide-react';
import { Section } from '../components/section';
import { Container } from '../components/container';
import { Eyebrow } from '../components/eyebrow';
import { ItalicHeading } from '../components/italic-heading';
import { Reveal } from '../components/reveal';
import { Button } from '../components/button';
import { PLANS, PRICING_COPY } from '../data/pricing';
import { noOrphan } from '../lib/no-orphan';

const WaitlistDialog = lazy(() => import('../components/waitlist-dialog').then((module) => ({ default: module.WaitlistDialog })));

export function Pricing() {
  const [waitlistPlan, setWaitlistPlan] = useState<'pro' | 'max' | null>(null);
  const [dialogLoaded, setDialogLoaded] = useState(false);

  return (
    <Section id="pricing" tone="light" className="l-pricing" ariaLabelledBy="pricing-heading">
      <Container>
        <div className="l-sec-head">
          <Eyebrow index={9}>{PRICING_COPY.eyebrow}</Eyebrow>
          <ItalicHeading as="h2" id="pricing-heading" lead={PRICING_COPY.headingLead} em={PRICING_COPY.headingEm} />
          <p className="l-lead">{noOrphan(PRICING_COPY.sub)}</p>
        </div>
        <ul className="l-price-grid">
          {PLANS.map((plan, index) => (
            <Reveal as="li" key={plan.id} index={index}>
              <article className="l-price-card" data-active={plan.active ? 'true' : undefined}>
                <div className="l-price-top">
                  <h3 className="l-price-name">{plan.name}</h3>
                  {plan.active ? <span className="l-chip" data-tone="success">{PRICING_COPY.activeChip}</span> : null}
                </div>
                <p className="l-price-amount">
                  <span className="l-price-figure">{plan.price}</span>
                  {plan.period ? <span className="l-price-period">{plan.period}</span> : null}
                </p>
                <p className="l-price-rooms">{plan.rooms}</p>
                <ul className="l-price-list">
                  {plan.includes.map((item) => (
                    <li key={item}>
                      <Check size={16} strokeWidth={2.5} aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                  {plan.planned.map((item) => (
                    <li key={item}>
                      <Check size={16} strokeWidth={2.5} aria-hidden="true" />
                      <span>{item}</span>
                      <span className="l-mono-chip">{PRICING_COPY.plannedChip}</span>
                    </li>
                  ))}
                </ul>
                <div className="l-price-cta">
                  {plan.id === 'free' ? (
                    <Button to="/signin" size="lg" arrow fullWidth>
                      {PRICING_COPY.startLabel}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="lg"
                      fullWidth
                      onClick={() => {
                        setDialogLoaded(true);
                        setWaitlistPlan(plan.id === 'pro' ? 'pro' : 'max');
                      }}
                    >
                      {PRICING_COPY.waitlistLabel}
                    </Button>
                  )}
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
        <p className="l-caption l-price-note">{noOrphan(PRICING_COPY.note)}</p>
      </Container>
      {dialogLoaded ? <Suspense fallback={null}><WaitlistDialog plan={waitlistPlan} onClose={() => setWaitlistPlan(null)} /></Suspense> : null}
    </Section>
  );
}
