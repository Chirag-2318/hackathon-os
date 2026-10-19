import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { Section } from '../components/section';
import { Container } from '../components/container';
import { Eyebrow } from '../components/eyebrow';
import { ItalicHeading } from '../components/italic-heading';
import { Reveal } from '../components/reveal';
import { StageFrame } from '../components/stage-frame';
import { useHowProgress } from '../hooks/use-how-progress';
import { HOW_COPY, HOW_STAGES } from '../data/how-stages';

export function HowItWorks() {
  const { trackRef, stickyRef, active, goTo } = useHowProgress();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

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
    <Section tone="light" className="l-how" ariaLabelledBy="how-heading">
      <Container>
        <div className="l-how-head">
          <Eyebrow index={2}>{HOW_COPY.eyebrow}</Eyebrow>
          <ItalicHeading as="h2" id="how-heading" lead={HOW_COPY.headingLead} em={HOW_COPY.headingEm} />
          <p className="l-lead">{HOW_COPY.lead}</p>
          <p className="l-caption">{HOW_COPY.note}</p>
        </div>

        {/* desktop: stage list on the left, product frame on the right */}
        <div ref={trackRef} className="l-how-track">
          <div ref={stickyRef} className="l-how-sticky">
            <div className="l-how-desktop">
              <div
                className="l-how-list"
                role="tablist"
                aria-orientation="vertical"
                aria-label={HOW_COPY.tablistLabel}
                onKeyDown={onKeyDown}
              >
                {HOW_STAGES.map((stage, index) => (
                  <button
                    key={stage.id}
                    ref={(element) => {
                      tabRefs.current[index] = element;
                    }}
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
                      <span className="l-how-tab-index">{`[${stage.index}]`}</span>
                      <span className="l-how-tab-title">{stage.title}</span>
                    </span>
                    <span className="l-how-tab-detail">
                      <span className="l-how-tab-detail-inner">
                        <span className="l-how-tab-line">{stage.line}</span>
                        <span className="l-how-tab-time l-clock">{stage.time}</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="l-how-panel" role="tabpanel" id="how-panel" aria-labelledby={`how-tab-${active}`}>
                <StageFrame key={HOW_STAGES[active].id} stage={HOW_STAGES[active]} />
              </div>
            </div>
          </div>
        </div>

        {/* tablet and phone: every stage as its own card */}
        <ol className="l-how-stack">
          {HOW_STAGES.map((stage, index) => (
            <Reveal as="li" key={stage.id} index={index % 2}>
              <article className="l-how-card">
                <div className="l-how-card-head">
                  <p className="l-how-card-meta">
                    <span>{`[${stage.index}]`}</span>
                    <span className="l-clock">{stage.time}</span>
                  </p>
                  <h3 className="l-how-card-title">{stage.title}</h3>
                  <p className="l-body">{stage.line}</p>
                </div>
                <StageFrame stage={stage} />
              </article>
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
