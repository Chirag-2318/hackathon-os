import { READINESS } from '../../data/stage-act';
import { BigRing } from '../big-ring';

interface ReadinessSceneProps {
  filled?: boolean;
}

export function ReadinessScene({ filled }: ReadinessSceneProps) {
  return (
    <div className="l-readiness">
      <div className="l-ready">
        {READINESS.rings.map((ring, index) => (
          <BigRing
            key={ring.label}
            value={ring.value}
            label={ring.label}
            index={index}
            filled={filled}
          />
        ))}
      </div>
      <div className="l-weak">
        <span className="l-stage-chip" data-tone="sun">
          {READINESS.weak}
        </span>
      </div>
    </div>
  );
}
