import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { Playbook } from '../data/playbooks';
import { PLAYBOOK_MAX_HOURS, PLAYBOOKS_COPY } from '../data/playbooks';
import { useInViewOnce } from '../hooks/use-in-view-once';

const SIZE = 44;
const STROKE = 4;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface PlaybookCardProps {
  playbook?: Playbook;
  index?: number;
  id?: string;
  slug?: string;
  title?: string;
  eventType?: string;
  teamSize?: any;
  phases?: any;
}

export function PlaybookCard(props: PlaybookCardProps) {
  const { index = 0 } = props;
  const playbook: any = props.playbook || {
    id: props.id || '',
    slug: props.slug || '',
    title: props.title || '',
    hours: 36,
  };
  const { ref, inView } = useInViewOnce<HTMLAnchorElement>();
  const fraction = playbook.hours != null ? Math.min(1, playbook.hours / PLAYBOOK_MAX_HOURS) : 0;
  const offset = CIRCUMFERENCE * (1 - fraction);
  const widthPercent = playbook.hours != null ? `${Math.min(100, (playbook.hours / 36) * 100)}%` : '0%';

  return (
    <Link
      ref={ref}
      to={PLAYBOOKS_COPY.browseAll.to}
      className={`l-pb${inView ? ' is-in' : ''}`}
      style={{ '--w': widthPercent, '--i': index } as CSSProperties}
    >
      <div className="l-pb__preview">
        {playbook.hours != null ? (
          <>
            <div className="l-pb__track">
              <span className="l-pb__ticks" aria-hidden="true" />
              <span className="l-pb__bar" aria-hidden="true" />
            </div>
            <div className="l-pb__scale" aria-hidden="true">
              <span>0h</span>
              <span>18h</span>
              <span>36h</span>
            </div>
          </>
        ) : (
          <>
            <div className="l-pb__dashed" />
            <div className="l-pb__dashedlabel">{playbook.meta}</div>
          </>
        )}
      </div>

      <div className="l-pb__strip">
        <div className="l-pb__info">
          <h3 className="l-pb__title">{playbook.name}</h3>
          <p className="l-pb__meta">{playbook.meta}</p>
        </div>
        <div className="l-pb__right">
          <span
            className="l-pb-ring"
            style={{ '--l-c': CIRCUMFERENCE, '--l-off': offset } as CSSProperties}
            aria-hidden="true"
          >
            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                className="l-pb-ring-track"
                strokeWidth={STROKE}
              />
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                className="l-pb-ring-progress"
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              />
            </svg>
            <span className="l-pb-ring-text">
              {playbook.hours != null ? `${playbook.hours}h` : playbook.meta}
            </span>
          </span>
          <ArrowRight size={18} className="l-pb__arrow" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}
