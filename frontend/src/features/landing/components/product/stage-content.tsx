import type { ComponentType } from 'react';
import type { HowStage, HowStageId } from '../../data/how-stages';
import { ProductAppShell, APP_COMPACT_WIDTH, APP_DESIGN_WIDTH } from './product-app-shell';
import { ProductBoardPage } from './product-board-page';
import { ProductBriefPage } from './product-brief-page';
import { ProductIdeatePage } from './product-ideate-page';
import { ProductLaunchPage } from './product-launch-page';
import { ProductPlanPage } from './product-plan-page';
import { ProductPresentPage } from './product-present-page';
import { ProductRoomShell, ROOM_COMPACT_WIDTH, ROOM_DESIGN_WIDTH } from './product-room-shell';
import { ProductSetupPage } from './product-setup-page';
import { ProductTeamPage } from './product-team-page';

// Both shells are drawn at the same design width so a switch between them looks like one window changing pages.
export const STAGE_DESIGN_WIDTH = Math.max(APP_DESIGN_WIDTH, ROOM_DESIGN_WIDTH);
export const STAGE_COMPACT_WIDTH = Math.min(APP_COMPACT_WIDTH, ROOM_COMPACT_WIDTH);

const PAGES: Record<HowStageId, ComponentType> = {
  setup: ProductSetupPage,
  brief: ProductBriefPage,
  team: ProductTeamPage,
  idea: ProductIdeatePage,
  plan: ProductPlanPage,
  build: ProductBoardPage,
  present: ProductPresentPage,
  submit: ProductLaunchPage,
};

// One stage: the right shell around the right page.
export function StageContent({ stage, compact }: { stage: HowStage; compact: boolean }) {
  const Page = PAGES[stage.id];
  if (stage.shell === 'app') {
    return (
      <ProductAppShell active={stage.nav} crumbs={stage.crumbs} compact={compact}>
        <Page />
      </ProductAppShell>
    );
  }
  return (
    <ProductRoomShell active={stage.nav} crumbs={stage.crumbs} clock={stage.time} rings={stage.rings ?? [0, 0, 0, 0, 0, 0]} compact={compact}>
      <Page />
    </ProductRoomShell>
  );
}
