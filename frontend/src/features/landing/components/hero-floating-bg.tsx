import { ThemedShot } from './themed-shot';
import { themedImage } from '../lib/themed-images';

interface FloatingCardDef {
  id: string;
  base: string;
  alt: string;
  side: 'left' | 'right';
  className: string;
}

const FLOATING_CARDS: FloatingCardDef[] = [
  // Left side flanking cards
  {
    id: 'overview',
    base: 'bg-1',
    alt: 'Overview dashboard with sprint checkpoints and team status',
    side: 'left',
    className: 'l-hero-float--1',
  },
  {
    id: 'docs',
    base: 'bg-2',
    alt: 'Docs vault with live AI architecture editor',
    side: 'left',
    className: 'l-hero-float--2',
  },
  {
    id: 'mvp',
    base: 'bg-3',
    alt: 'MVP studio core flow builder and reality ledger',
    side: 'left',
    className: 'l-hero-float--3',
  },
  // Right side flanking cards
  {
    id: 'api',
    base: 'bg-4',
    alt: 'API hub with external mock and schema viewer',
    side: 'right',
    className: 'l-hero-float--4',
  },
  {
    id: 'github',
    base: 'bg-5',
    alt: 'GitHub readiness and pre-submission checklist',
    side: 'right',
    className: 'l-hero-float--5',
  },
  {
    id: 'home',
    base: 'bg-6',
    alt: 'Hackathon rooms and live calendar tracker',
    side: 'right',
    className: 'l-hero-float--6',
  },
];

export function HeroFloatingBg() {
  return (
    <div className="l-hero-floating-bg" aria-hidden="true">
      <div className="l-hero-floating-flank l-hero-floating-flank--left">
        {FLOATING_CARDS.filter((c) => c.side === 'left').map((card) => {
          const img = themedImage(card.base);
          if (!img) return null;
          return (
            <div key={card.id} className={`l-hero-float-card ${card.className}`}>
              <div className="l-hero-float-media">
                <ThemedShot
                  light={img.light}
                  dark={img.dark}
                  alt={card.alt}
                  loading="lazy"
                  dim="opacity"
                />
                <div className="l-hero-float-grain" />
                <div className="l-hero-float-fade" />
              </div>
            </div>
          );
        })}
      </div>
      <div className="l-hero-floating-flank l-hero-floating-flank--right">
        {FLOATING_CARDS.filter((c) => c.side === 'right').map((card) => {
          const img = themedImage(card.base);
          if (!img) return null;
          return (
            <div key={card.id} className={`l-hero-float-card ${card.className}`}>
              <div className="l-hero-float-media">
                <ThemedShot
                  light={img.light}
                  dark={img.dark}
                  alt={card.alt}
                  loading="lazy"
                  dim="opacity"
                />
                <div className="l-hero-float-grain" />
                <div className="l-hero-float-fade" />
              </div>
            </div>
          );
        })}
      </div>
      {/* Centered protective veil keeping the typography clean while letting flank images float gracefully */}
      <div className="l-hero__veil" />
    </div>
  );
}
