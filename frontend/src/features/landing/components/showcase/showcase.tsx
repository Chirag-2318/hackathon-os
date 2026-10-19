import { useRef } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { SHOWCASE_COPY, SHOWCASE_VIEWS } from '../../data/showcase';
import { SHOWCASE_AUTOPLAY_MS, useShowcase } from '../../hooks/use-showcase';
import { Blueprint } from '../blueprint';
import { RoomWindow } from './room-window';
import { SatelliteCard } from './satellite-card';

// The hero product tour: blueprint guide lines, a violet plate, the room window bleeding off its edge and two
// dashed cards floating over the plate. Four tabs; the tour plays itself until the visitor picks a tab.
export function Showcase() {
  const tour = useShowcase();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = SHOWCASE_VIEWS.length - 1;
    let next = tour.active;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = tour.active === last ? 0 : tour.active + 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = tour.active === 0 ? last : tour.active - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else return;
    event.preventDefault();
    tour.select(next, true);
    tabRefs.current[next]?.focus();
  };

  return (
    <div
      ref={tour.ref}
      className="l-showcase"
      style={{ '--l-sc-dur': `${SHOWCASE_AUTOPLAY_MS}ms` } as CSSProperties}
      onPointerEnter={() => tour.setHovering(true)}
      onPointerLeave={() => tour.setHovering(false)}
    >
      <div className="l-sc-tabs" role="tablist" aria-label={SHOWCASE_COPY.tablistLabel} onKeyDown={onKeyDown}>
        {SHOWCASE_VIEWS.map((item, index) => (
          <button
            key={item.id}
            ref={(element) => { tabRefs.current[index] = element; }}
            type="button"
            role="tab"
            id={`sc-tab-${item.id}`}
            aria-selected={index === tour.active}
            aria-controls="sc-panel"
            tabIndex={index === tour.active ? 0 : -1}
            className="l-sc-tab"
            onClick={() => tour.select(index, true)}
          >
            <span className="l-sc-tab-index">{item.index}</span>
            <span>{item.label}</span>
            {index === tour.active && tour.playing ? <span key={`progress-${tour.active}`} className="l-sc-tab-progress" aria-hidden="true" /> : null}
          </button>
        ))}
      </div>

      <div className="l-sc-stage" id="sc-panel" role="tabpanel" aria-labelledby={`sc-tab-${tour.view.id}`}>
        <p className="l-sr-only">{tour.view.desc}</p>
        <Blueprint
          verticals={['0px', '100%']}
          horizontals={['0px', '100%']}
          reach={72}
        />
        <div className="l-sc-plate">
          <div className="l-sc-window">
            <RoomWindow view={tour.view} clock={tour.clock} />
          </div>
        </div>
        <SatelliteCard key={`${tour.view.id}-a`} kind={tour.view.satellites[0]} slot="a" />
        <SatelliteCard key={`${tour.view.id}-b`} kind={tour.view.satellites[1]} slot="b" />
      </div>

      <p className="l-caption l-sc-note">{SHOWCASE_COPY.note}</p>
    </div>
  );
}
