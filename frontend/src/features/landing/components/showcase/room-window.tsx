import { ProductBoardPage } from '../product/product-board-page';
import { ProductBriefPage } from '../product/product-brief-page';
import { FitScale } from '../product/fit-scale';
import { ProductPlanPage } from '../product/product-plan-page';
import { ProductPresentPage } from '../product/product-present-page';
import { ProductScope } from '../product/product-scope';
import { ProductRoomShell, ROOM_COMPACT_WIDTH, ROOM_DESIGN_WIDTH } from '../product/product-room-shell';
import { useMediaQuery } from '../../hooks/use-media-query';
import type { ShowcaseView } from '../../data/showcase';

// The hero's room window: the product's real room shell and pages, drawn as static copies at their real design width
// and shrunk to fit the window. On phones the sidebar is left out so the page can be shown larger.
const PAGES = { brief: ProductBriefPage, plan: ProductPlanPage, board: ProductBoardPage, present: ProductPresentPage } as const;

export function RoomWindow({ view, clock }: { view: ShowcaseView; clock: string }) {
  const narrow = useMediaQuery('(max-width: 767px)');
  const Page = PAGES[view.id];
  return (
    <ProductScope>
      <FitScale designWidth={narrow ? ROOM_COMPACT_WIDTH : ROOM_DESIGN_WIDTH} minScale={narrow ? 0.5 : 0.42}>
        <ProductRoomShell active={view.nav} clock={clock} rings={view.rings} compact={narrow}>
          <div className="l-ps-fade" key={view.id}>
            <Page />
          </div>
        </ProductRoomShell>
      </FitScale>
    </ProductScope>
  );
}
