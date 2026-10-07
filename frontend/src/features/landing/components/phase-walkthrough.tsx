/**
 * PhaseWalkthrough — S01 item 4.
 * Source: PRD §3.1 item 4, A§6.2 S01.
 *
 * Sticky phase list on the left (Prep to Retro).
 * Matching screen on the right.
 * Scroll-linked progress: IntersectionObserver updates active phase.
 * No parallax, no scroll-jacking (A§6.2, A§10).
 * Reduced motion: static fallback (first phase highlighted).
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from 'cn';
import { FramedScreen } from '@/components/primitives/framed-screen';
import { COPY } from '@/shared/constants/copy';
import { useIsMotionReduced } from '@/shared/motion';

const phases = COPY.landing.phases;

export function PhaseWalkthrough() {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isReduced = useIsMotionReduced();

  const setRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      sectionRefs.current[index] = el;
    },
    [],
  );

  // Scroll-linked progress via IntersectionObserver
  useEffect(() => {
    // Skip scroll-linked updates under reduced motion
    if (isReduced) return;

    const observers: IntersectionObserver[] = [];

    sectionRefs.current.forEach((el, index) => {
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveIndex(index);
          }
        },
        { rootMargin: '-40% 0px -40% 0px', threshold: 0 },
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [isReduced]);

  return (
    <section className="py-16 md:py-24" aria-label="Phase walkthrough">
      <h2 className="text-h1 text-ink-strong mb-8 md:mb-12">
        {COPY.landing.walkthroughTitle}
      </h2>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[280px_1fr] md:gap-12">
        {/* Left: sticky phase list */}
        <nav
          className="md:sticky md:top-24 md:self-start"
          aria-label="Phase navigation"
        >
          <ol className="flex flex-col gap-1">
            {phases.map((phase, i) => (
              <li key={phase.name}>
                <button
                  onClick={() => {
                    setActiveIndex(i);
                    sectionRefs.current[i]?.scrollIntoView({
                      behavior: isReduced ? 'auto' : 'smooth',
                      block: 'center',
                    });
                  }}
                  className={cn(
                    'flex w-full flex-col items-start gap-0.5 rounded-control px-4 py-3 text-left transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-lav-600 focus-visible:outline-offset-2',
                    i === activeIndex
                      ? 'border-l-2 border-lav-600 bg-lav-100 text-ink-strong'
                      : 'border-l-2 border-transparent text-ink-muted hover:bg-surface-sunken hover:text-ink',
                  )}
                >
                  <span className="text-body-strong">{phase.name}</span>
                  <span className="text-caption text-ink-muted">
                    {phase.description}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        {/* Right: scrollable screens */}
        <div className="flex flex-col gap-12">
          {phases.map((phase, i) => (
            <div key={phase.name} ref={setRef(i)}>
              <FramedScreen
                label={`${phase.name} phase — placeholder`}
                className="w-full"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
