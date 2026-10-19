import { useEffect, useState } from 'react';
import { RING_LABEL } from '../data/how-rings';

const SIZE = 20;
const STROKE = 3;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}

interface ReadinessRingsProps {
  values: number[];
  className?: string;
}

export function ReadinessRings({ values, className = '' }: ReadinessRingsProps) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShown(true), 40);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className={`l-rings l-rise ${className}`.trim()} aria-hidden="true">
      <span className="l-rings-label">{RING_LABEL}</span>
      {values.map((value, index) => (
        <svg key={index} width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="l-ring">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--border-strong)"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            className="l-ring-progress"
            stroke="var(--ink)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - (shown ? clamp(value) : 0) / 100)}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </svg>
      ))}
    </div>
  );
}
