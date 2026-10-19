import { useInViewOnce } from '../hooks/use-in-view-once';

interface TickRulerProps {
  /** mono label, for example "05 → 06" */
  label: string;
}

export function TickRuler({ label }: TickRulerProps) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();
  return (
    <div ref={ref} className={`l-ruler${inView ? ' is-in' : ''}`} aria-hidden="true">
      <span className="l-ruler__label">{label}</span>
      <span className="l-ruler__line" />
    </div>
  );
}
