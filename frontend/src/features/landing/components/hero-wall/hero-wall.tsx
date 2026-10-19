import { useEffect, useState } from 'react';
import { WALL_CAPTION, WALL_FRAMES } from '../../data/hero-wall';
import { useHeroWall } from '../../hooks/use-hero-wall';
import { WallFrame } from './wall-frame';
import { WALL_SCREENS } from './wall-screens';

function useMatch(query: string): boolean {
  const [match, setMatch] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatch(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return match;
}

function HeroWallInner({ reduced }: { reduced: boolean }) {
  const wall = useHeroWall(true, reduced);
  return (
    <>
      <div
        className={`l-hero__wall${wall.ready ? ' is-ready' : ''}`}
        aria-hidden="true"
        inert
        ref={wall.viewportRef}
      >
        <div className={`l-wall-dolly${wall.dolly ? ' is-dolly' : ''}`}>
          <div
            className={`l-wall-cam${wall.instant ? ' is-instant' : ''}`}
            style={{ transform: `translate3d(${wall.offset.x}px, ${wall.offset.y}px, 0)` }}
          >
            <div className="l-wall-grid">
              {WALL_FRAMES.map((def) => {
                const Screen = WALL_SCREENS[def.screen];
                return (
                  <WallFrame
                    key={def.key}
                    def={def}
                    focused={wall.focusKey === def.key}
                    frameRef={wall.registerFrame(def.key)}
                  >
                    <Screen />
                  </WallFrame>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="l-hero__veil" aria-hidden="true" />
      <p className="l-hero__wallcap" aria-hidden="true">{WALL_CAPTION}</p>
    </>
  );
}

export function HeroWall() {
  const wide = useMatch('(min-width: 1024px)');
  const reduced = useMatch('(prefers-reduced-motion: reduce)');
  if (!wide) return null;
  return <HeroWallInner reduced={reduced} />;
}
