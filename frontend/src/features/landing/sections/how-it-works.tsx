import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { Blueprint } from '../components/blueprint';
import { Container } from '../components/container';
import { Eyebrow } from '../components/eyebrow';
import { HowWindow } from '../components/how/how-window';
import { LazyMount } from '../components/lazy-mount';
import { Reveal } from '../components/reveal';
import { Section } from '../components/section';
import { VividHeading } from '../components/vivid-heading';
import { HOW_COPY, HOW_STAGES } from '../data/how-stages';
import { useHowProgress } from '../hooks/use-how-progress';

// Desktop: a pinned tour. The stage list stays on the left; the product window on the right changes page as you scroll.
// Phones, tablets and reduced motion: eight stacked cards (the product windows are mounted only when they come near).
export function HowItWorks() {
  const { trackRef, stickyRef, active, goTo } = useHowProgress();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const previousActive = useRef(active);
  const direction = active >= previousActive.current ? 'forward' : 'backward';
  useEffect(() => {
    previousActive.current = active;
  }, [active]);
  const stage = HOW_STAGES[active];

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = HOW_STAGES.length - 1;
    let next = active;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = active === last ? 0 : active + 1;
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = active === 0 ? last : active - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else return;
    event.preventDefault();
    goTo(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <Section id="how-it-works" tone="light" className="l-how" ariaLabelledBy="how-heading">
      <Container>
        <div className="l-how-head">
          <Eyebrow index={2}>{HOW_COPY.eyebrow}</Eyebrow>
          <VividHeading as="h2" id="how-heading" lead={HOW_COPY.headingLead} vivid={HOW_COPY.headingVivid} />
          <p className="l-vivid-lead">{HOW_COPY.lead}</p>
          <p className="l-caption">{HOW_COPY.note}</p>
        </div>

        <div ref={trackRef} className="l-how-track">
          <div ref={stickyRef} className="l-how-sticky">
            <div className="l-how-desktop">
              <div className="l-how-list" role="tablist" aria-orientation="vertical" aria-label={HOW_COPY.tablistLabel} onKeyDown={onKeyDown}>
                {HOW_STAGES.map((item, index) => (
                  <button
                    key={item.id}
                    ref={(element) => { tabRefs.current[index] = element; }}
                    type="button"
                    role="tab"
                    id={`how-tab-${index}`}
                    aria-selected={index === active}
                    aria-controls="how-panel"
                    tabIndex={index === active ? 0 : -1}
                    className="l-how-tab"
                    data-state={index < active ? 'past' : index === active ? 'active' : 'future'}
                    onClick={() => goTo(index)}
                  >
                    <span className="l-how-tab-head">
                      <span className="l-how-tab-index">{`[${item.index}]`}</span>
                      <span className="l-how-tab-title">{item.title}</span>
                    </span>
                    <span className="l-how-tab-detail">
                      <span className="l-how-tab-detail-inner">
                        <span className="l-how-tab-line">{item.line}</span>
                        <span className="l-how-tab-time l-clock">{item.time}</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="l-how-panel" role="tabpanel" id="how-panel" aria-labelledby={`how-tab-${active}`}>
                <p className="l-sr-only">{stage.desc}</p>
                <Blueprint verticals={['0px', '100%']} horizontals={['0px', '100%']} reach={56} reachX={44} />
                <HowWindow stage={stage} index={active} direction={direction} animated />
              </div>
            </div>
          </div>
        </div>

        <ol className="l-how-stack">
          {HOW_STAGES.map((item, index) => (
            <Reveal as="li" key={item.id} index={index % 2}>
              <article className="l-how-card">
                <div className="l-how-card-head">
                  <p className="l-how-card-meta"><span>{`[${item.index}]`}</span><span className="l-clock">{item.time}</span></p>
                  <h3 className="l-how-card-title">{item.title}</h3>
                  <p className="l-body">{item.line}</p>
                </div>
                <p className="l-sr-only">{item.desc}</p>
                <LazyMount minHeight={260}>
                  <HowWindow stage={item} index={index} direction="forward" animated={false} />
                </LazyMount>
              </article>
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
