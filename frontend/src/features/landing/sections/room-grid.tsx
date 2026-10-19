import type { CSSProperties } from 'react';
import { Section } from '../components/section';
import { Container } from '../components/container';
import { Eyebrow } from '../components/eyebrow';
import { ItalicHeading } from '../components/italic-heading';
import { useInViewOnce } from '../hooks/use-in-view-once';
import { ROOM_COPY, ROOM_TILES } from '../data/room-grid';
import { ROOM_VISUALS } from '../components/room-visuals';
import { noOrphan } from '../lib/no-orphan';

const CENTER_OUT_DELAYS = [180, 120, 180, 60, 0, 60, 180, 120, 180];

export function RoomGrid() {
  const { ref, inView } = useInViewOnce<HTMLUListElement>();

  return (
    <Section tone="surface" className="l-room" ariaLabelledBy="room-heading">
      <Container>
        <div className="l-sec-head">
          <Eyebrow index={6}>{ROOM_COPY.eyebrow}</Eyebrow>
          <ItalicHeading as="h2" id="room-heading" lead={ROOM_COPY.headingLead} em={ROOM_COPY.headingEm} />
        </div>
        <ul ref={ref} className={`l-room-grid${inView ? ' is-in' : ''}`}>
          {ROOM_TILES.map((tile, index) => (
            <li key={tile.id} className={tile.span === 2 ? 'l-span-2' : ''}>
              <article
                className="l-tile"
                style={{ '--d': `${CENTER_OUT_DELAYS[index] ?? 0}ms` } as CSSProperties}
              >
                <p className="l-tile-label">
                  <span className="l-tile-br" aria-hidden="true">[</span>
                  <span>{tile.label}</span>
                  <span className="l-tile-br" aria-hidden="true">]</span>
                </p>
                <p className="l-tile-line">{noOrphan(tile.line)}</p>
                {ROOM_VISUALS[tile.visual]}
              </article>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
