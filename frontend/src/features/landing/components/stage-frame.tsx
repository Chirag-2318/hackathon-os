import type { HowStage } from '../data/how-stages';
import { HOW_COPY } from '../data/how-stages';
import { stageImages } from '../lib/stage-images';
import { ThemedShot } from './themed-shot';

interface StageFrameProps {
  stage: HowStage;
  overlay?: 'animated' | 'static' | 'none';
  ringValues?: number[];
}

export function StageFrame({ stage }: StageFrameProps) {
  const images = stageImages(stage.index);

  return (
    <figure className="l-stage-frame">
      {images ? (
        <div className="l-stage-canvas">
          <ThemedShot
            light={images.light}
            dark={images.dark}
            width={1568}
            height={1000}
            loading="lazy"
            alt={`${stage.title}: ${stage.caption}`}
            className="l-stage-img"
          />
          {/* Subtle film grain texture */}
          <div className="l-stage-grain" aria-hidden="true" />
          {/* Subtle atmospheric edge fade & vagueness */}
          <div className="l-stage-vague" aria-hidden="true" />
        </div>
      ) : (
        <div className="l-stage-placeholder">
          <span className="l-stage-placeholder-index" aria-hidden="true">{`[ ${stage.index} ]`}</span>
          <p className="l-stage-placeholder-title">{HOW_COPY.placeholderTitle}</p>
          <p className="l-caption">{stage.capture}</p>
        </div>
      )}
    </figure>
  );
}
