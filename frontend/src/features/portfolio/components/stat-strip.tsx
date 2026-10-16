import React, { useEffect, useState, useRef } from 'react';
import type { PortfolioStatsDto } from '../types';

interface StatStripProps {
  stats: PortfolioStatsDto;
}

interface StatItem {
  id: string;
  label: string;
  value: number;
  suffix?: string;
}

export const StatStrip: React.FC<StatStripProps> = ({ stats }) => {
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setHasAnimated(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setHasAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const items: StatItem[] = [
    { id: 'hackathons', label: 'Hackathons joined', value: stats.hackathonsJoined },
    { id: 'shipped', label: 'Projects shipped', value: stats.projectsShipped },
    { id: 'tasks', label: 'Tasks completed', value: stats.tasksCompleted },
    { id: 'led', label: 'Teams led', value: stats.teamsLed },
  ];

  return (
    <div
      ref={containerRef}
      className="border-t border-b border-border bg-transparent py-4 px-4 sm:px-6"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col px-4 py-2 first:pl-0 last:pr-0">
            <span
              className="font-mono text-[32px] font-normal tracking-tight text-foreground leading-none"
              style={{ fontFamily: 'var(--font-mono, monospace)' }}
            >
              <CountUp target={item.value} run={hasAnimated} />
              {item.suffix && <span className="text-[20px] text-muted-foreground ml-0.5">{item.suffix}</span>}
            </span>
            <span className="text-[12px] text-muted-foreground mt-1.5">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const CountUp: React.FC<{ target: number; run: boolean }> = ({ target, run }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!run) {
      setCurrent(0);
      return;
    }
    if (target === 0) {
      setCurrent(0);
      return;
    }

    const duration = 900;
    const steps = 30;
    const intervalTime = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      // Ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      const val = Math.round(eased * target);
      setCurrent(val);

      if (step >= steps) {
        clearInterval(timer);
        setCurrent(target);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [run, target]);

  return <>{run ? current : target}</>;
};
