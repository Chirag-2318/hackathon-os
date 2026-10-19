import type { MutableRefObject } from 'react';
import { STAGE_CUES } from '../../data/stage-cues';
import { ProductJudgePage } from '../product/product-judge-page';
import { ProductLaunchPage } from '../product/product-launch-page';
import { ProductPresentPage } from '../product/product-present-page';
import { ProductReadinessPage } from '../product/product-readiness-page';
import { ProductRoomShell } from '../product/product-room-shell';

type StageActContentProps = {
  index: number;                         // 0 to 3
  line: number;                          // the highlighted teleprompter line (cue 0)
  levelRef: MutableRefObject<number>;    // live waveform loudness (cue 0)
  live: boolean;                         // the waveform runs on its own (cue 0, pinned layout)
  compact: boolean;                      // phones: no sidebar
};

export function StageActContent({ index, line, levelRef, live, compact }: StageActContentProps) {
  const cue = STAGE_CUES[index];
  return (
    <ProductRoomShell active={cue.nav} crumbs={cue.crumbs} clock={cue.time} rings={cue.rings} compact={compact}>
      {index === 0 ? <ProductPresentPage current={line} levelRef={levelRef} animate={live} /> : null}
      {index === 1 ? <ProductJudgePage /> : null}
      {index === 2 ? <ProductReadinessPage /> : null}
      {index === 3 ? <ProductLaunchPage /> : null}
    </ProductRoomShell>
  );
}
