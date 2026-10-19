import { useState } from 'react';
import { Section } from '../components/section';
import { Container } from '../components/container';
import { Eyebrow } from '../components/eyebrow';
import { ItalicHeading } from '../components/italic-heading';
import { Reveal } from '../components/reveal';
import { FAQ_COPY, FAQ_ITEMS } from '../data/faq';
import { noOrphan } from '../lib/no-orphan';

export function Faq() {
  const [open, setOpen] = useState<string | null>(FAQ_ITEMS[0].id);

  return (
    <Section tone="surface" className="l-faq" ariaLabelledBy="faq-heading">
      <Container>
        <div className="l-faq-layout">
          <div className="l-faq-intro">
            <Eyebrow index={10}>{FAQ_COPY.eyebrow}</Eyebrow>
            <ItalicHeading as="h2" id="faq-heading" lead={FAQ_COPY.headingLead} em={FAQ_COPY.headingEm} />
          </div>
          <ul className="l-faq-list">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = open === item.id;
              return (
                <Reveal
                  as="li"
                  key={item.id}
                  index={index % 3}
                  className="l-faq-item l-faq__item"
                  data-open={isOpen ? 'true' : 'false'}
                >
                  <h3 className="l-faq-q">
                    <button
                      type="button"
                      className="l-faq-btn"
                      id={`faq-btn-${item.id}`}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${item.id}`}
                      onClick={() => setOpen(isOpen ? null : item.id)}
                    >
                      <span>{item.q}</span>
                      <span className="l-faq-icon" aria-hidden="true">
                        <span>[</span>
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          className="l-faq__glyph"
                          style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 2px' }}
                        >
                          <line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          <line
                            x1="5"
                            y1="1"
                            x2="5"
                            y2="9"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            className="l-faq__icon-v"
                          />
                        </svg>
                        <span>]</span>
                      </span>
                    </button>
                  </h3>
                  <div
                    className="l-faq-panel l-faq__panel"
                    id={`faq-panel-${item.id}`}
                    role="region"
                    aria-labelledby={`faq-btn-${item.id}`}
                    data-open={isOpen ? 'true' : 'false'}
                    inert={!isOpen ? true : undefined}
                  >
                    <div className="l-faq-panel-inner">
                      <p className="l-faq-a">{noOrphan(item.a)}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </Container>
    </Section>
  );
}
