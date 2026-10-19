import { useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Section } from '../components/section';
import { Container } from '../components/container';
import { Eyebrow } from '../components/eyebrow';
import { ItalicHeading } from '../components/italic-heading';
import { COMPARE_COPY, COMPARE_TABS } from '../data/compare';
import { noOrphan } from '../lib/no-orphan';

export function Compare() {
  const [active, setActive] = useState(0);
  const [pill, setPill] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });
  const tabListRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useLayoutEffect(() => {
    const tab = tabRefs.current[active];
    if (!tab) return;

    const updatePill = () => {
      setPill({
        left: tab.offsetLeft,
        width: tab.offsetWidth,
        ready: true,
      });
    };

    updatePill();

    if (typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(() => {
      updatePill();
    });

    if (tabListRef.current) {
      ro.observe(tabListRef.current);
    }
    ro.observe(tab);

    return () => ro.disconnect();
  }, [active]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = COMPARE_TABS.length - 1;
    let next = active;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = active === last ? 0 : active + 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = active === 0 ? last : active - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <Section tone="surface" className="l-compare" ariaLabelledBy="compare-heading">
      <Container>
        <div className="l-sec-head">
          <Eyebrow index={8}>{COMPARE_COPY.eyebrow}</Eyebrow>
          <ItalicHeading as="h2" id="compare-heading" lead={COMPARE_COPY.headingLead} em={COMPARE_COPY.headingEm} />
          <p className="l-lead">{noOrphan(COMPARE_COPY.lead)}</p>
        </div>
        <div
          ref={tabListRef}
          className="l-tabs"
          role="tablist"
          aria-label={COMPARE_COPY.tablistLabel}
          onKeyDown={onKeyDown}
        >
          <span
            className="l-tabs__pill"
            style={{
              transform: `translateX(${pill.left}px)`,
              width: `${pill.width}px`,
              opacity: pill.ready ? 1 : 0,
            }}
            aria-hidden="true"
          />
          {COMPARE_TABS.map((tab, index) => (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`compare-tab-${tab.id}`}
              aria-selected={index === active}
              aria-controls="compare-panel"
              tabIndex={index === active ? 0 : -1}
              className="l-tab l-tabs__tab"
              onClick={() => setActive(index)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div id="compare-panel" role="tabpanel" aria-labelledby={`compare-tab-${COMPARE_TABS[active].id}`}>
          <div key={COMPARE_TABS[active].id} className="l-compare-panel l-compare__content">
            <div className="l-compare-card">
              <p className="l-compare-title">{COMPARE_COPY.leftTitle}</p>
              <p className="l-compare-text">{noOrphan(COMPARE_TABS[active].left)}</p>
            </div>
            <div className="l-compare-card l-compare-card--brackit">
              <p className="l-compare-title">{COMPARE_COPY.rightTitle}</p>
              <p className="l-compare-text">{noOrphan(COMPARE_TABS[active].right)}</p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
