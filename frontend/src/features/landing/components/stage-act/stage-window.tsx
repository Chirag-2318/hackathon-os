import { useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { STAGE_CUES } from '../../data/stage-cues';
import { useMediaQuery } from '../../hooks/use-media-query';
import { FitScale } from '../product/fit-scale';
import { ProductScope } from '../product/product-scope';
import { STAGE_COMPACT_WIDTH, STAGE_DESIGN_WIDTH } from '../product/stage-content';
import { StageTransition } from '../product/stage-transition';
import { StageActContent } from './stage-act-content';
import { StageCursor } from './stage-cursor';
import { StageStamp } from './stage-stamp';

type StageWindowProps = {
  viewIndex: number;
  direction: 'forward' | 'backward';
  line: number;
  levelRef: MutableRefObject<number>;
  animated: boolean;           // false for the stacked phone cards (no wipe, no cursor, no live waveform)
  submitted: boolean;
  armed: boolean;              // the demo cursor may go to the submit control
  onPress: () => void;
};

export function StageWindow({ viewIndex, direction, line, levelRef, animated, submitted, armed, onPress }: StageWindowProps) {
  const narrow = useMediaQuery('(max-width: 767px)');
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [settled, setSettled] = useState(true);
  const cue = STAGE_CUES[viewIndex];
  const content = <StageActContent index={viewIndex} line={line} levelRef={levelRef} live={animated && viewIndex === 0} compact={narrow} />;

  return (
    <div ref={frameRef} className="l-sg-window" data-submitted={submitted ? 'true' : 'false'}>
      <ProductScope forceTheme="dark">
        <FitScale designWidth={narrow ? STAGE_COMPACT_WIDTH : STAGE_DESIGN_WIDTH} minScale={narrow ? 0.45 : 0.4}>
          {animated ? (
            <StageTransition viewKey={cue.id} direction={direction} onSettledChange={setSettled}>
              {content}
            </StageTransition>
          ) : (
            content
          )}
        </FitScale>
      </ProductScope>
      {animated ? <StageCursor frameRef={frameRef} active={armed && settled && viewIndex === 3 && !submitted} onPress={onPress} /> : null}
      <StageStamp show={submitted} />
    </div>
  );
}
