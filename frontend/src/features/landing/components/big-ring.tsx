import { useInViewOnce } from '../hooks/use-in-view-once';

const SIZE = 96;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface BigRingProps {
  value: number;
  label: string;
  index?: number;
  filled?: boolean;
}

export function BigRing({ value, label, index = 0, filled }: BigRingProps) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>(0.4);
  const show = filled ?? inView;
  const clamped = Math.min(100, Math.max(0, value));
  const tone = clamped >= 90 ? 'mint' : clamped >= 70 ? 'sun' : 'orange';

  return (
    <div ref={ref} className="l-bigring">
      <div className="l-bigring-wrap">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            className="l-bigring-track"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            className="l-bigring-progress"
            data-tone={tone}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - (show ? clamped : 0) / 100)}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            style={{ transitionDelay: `${index * 100}ms` }}
          />
        </svg>
        <span className="l-bigring-value">{`${clamped}%`}</span>
      </div>
      <span className="l-bigring-label">{label}</span>
    </div>
  );
}
