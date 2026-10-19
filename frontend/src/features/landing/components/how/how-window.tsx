import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { HowStage } from '../../data/how-stages';
import { useMediaQuery } from '../../hooks/use-media-query';
import { FitScale } from '../product/fit-scale';
import { ProductScope } from '../product/product-scope';
import { StageContent, STAGE_COMPACT_WIDTH, STAGE_DESIGN_WIDTH } from '../product/stage-content';
import { StageTransition } from '../product/stage-transition';
import { HowCallouts } from './how-callouts';

type HowWindowProps = {
  stage: HowStage;
  index: number;                              // stage number 0 to 7 (moves the plate's soft sheen)
  direction: 'forward' | 'backward';
  animated: boolean;                          // false for the stacked phone cards
};

export function HowWindow({ stage, index, direction, animated }: HowWindowProps) {
  const narrow = useMediaQuery('(max-width: 767px)');
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [settled, setSettled] = useState(true);
  const content = <StageContent stage={stage} compact={narrow} />;

  return (
    <div className="l-hw-plate" style={{ '--l-hw-i': index } as CSSProperties}>
      <span key={stage.id} className="l-hw-caption l-rise">{stage.caption}</span>
      <div ref={frameRef} className="l-hw-window">
        <ProductScope>
          <FitScale designWidth={narrow ? STAGE_COMPACT_WIDTH : STAGE_DESIGN_WIDTH} minScale={narrow ? 0.45 : 0.4}>
            {animated ? (
              <StageTransition viewKey={stage.id} direction={direction} onSettledChange={setSettled}>
                {content}
              </StageTransition>
            ) : (
              content
            )}
          </FitScale>
        </ProductScope>
        {animated ? <HowCallouts frameRef={frameRef} stageId={stage.id} settled={settled} /> : null}
      </div>
    </div>
  );
}
