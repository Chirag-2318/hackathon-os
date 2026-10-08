import { test, expect, Page } from '@playwright/test';

test.use({ viewport: { width: 1534, height: 729 }, deviceScaleFactor: 1.25 });

async function goHome(page: Page) {
  await page.goto('http://localhost:5173/app/home');
  await page.waitForLoadState('networkidle');
}
const box = async (page: Page, id: string) => {
  const b = await page.getByTestId(id).boundingBox();
  if (!b) throw new Error(`missing or hidden: ${id}`);
  return b;
};
const near = (a: number, b: number, tol = 2, label = '') =>
  expect(Math.abs(a - b), `${label} got ${a}, want ${b}`).toBeLessThanOrEqual(tol);
const style = (page: Page, id: string) =>
  page.getByTestId(id).evaluate((el) => {
    const s = getComputedStyle(el);
    return { size: s.fontSize, weight: s.fontWeight, family: s.fontFamily };
  });

const KEYS = ['home', 'my-rooms', 'playbooks', 'tools', 'portfolio', 'settings'];

test('sidebar absolute geometry', async ({ page }) => {
  await goHome(page);
  near((await box(page, 'sidebar')).width, 232, 0.5, 'sidebar width');
  const g = await box(page, 'brand-glyph');
  near(g.x, 30, 1.5, 'brand glyph x'); near(g.width, 20, 1.5, 'brand glyph w');
  near((await box(page, 'brand-text')).x, 60, 1.5, 'brand text x');
  near((await box(page, 'collapse-icon')).x, 30, 2, 'collapse icon box x');
  near((await box(page, 'collapse-text')).x, 60, 1.5, 'collapse text x');
  for (const [i, k] of KEYS.entries()) {
    const r = await box(page, `nav-row-${k}`);
    near(r.x, 20, 1, `${k} row x`); near(r.y, 112 + 36 * i, 2, `${k} row y`);
    near(r.width, 192, 1, `${k} row w`); near(r.height, 32, 1, `${k} row h`);
    const ic = await box(page, `nav-icon-${k}`);
    near(ic.x, 30, 1.5, `${k} icon x`); near(ic.width, 20, 1, `${k} icon w`);
    near((await box(page, `nav-label-${k}`)).x, 60, 1.5, `${k} label x`);
  }
  const p = await box(page, 'promo');
  near(p.x, 20, 1); near(p.y, 360, 3, 'promo y'); near(p.width, 192, 1); near(p.height, 162, 5, 'promo h');
  const cap = await box(page, 'promo-caption');
  expect(cap.height, 'promo caption must be ONE line').toBeLessThanOrEqual(16);
  near((await box(page, 'footer-email')).x, 60, 2, 'email text x');
  near((await box(page, 'footer-clock')).x, 60, 2, 'clock x');
  const clock = await box(page, 'footer-clock');
  near(clock.y + clock.height, 729 - 32, 4, 'clock bottom');
});

test('sidebar typography', async ({ page }) => {
  await goHome(page);
  const want: Record<string, [string, string]> = {
    'brand-text': ['16px', '600'], 'collapse-text': ['14px', '400'],
    'nav-label-home': ['14px', '500'], 'nav-label-settings': ['14px', '500'],
    'promo-title': ['14px', '500'], 'promo-caption': ['11px', '400'],
    'footer-email': ['14px', '400'], 'footer-clock': ['13px', '400'], 'home-title': ['32px', '700'],
  };
  for (const [id, [size, weight]] of Object.entries(want)) {
    const s = await style(page, id);
    expect(s.size, `${id} size`).toBe(size);
    expect(s.weight, `${id} weight`).toBe(weight);
    expect(s.family, `${id} font`).toContain('DM Sans');
  }
});

test('alignment relationships', async ({ page }) => {
  await goHome(page);
  const cx = async (id: string) => { const b = await box(page, id); return b.x + b.width / 2; };
  near(await cx('brand-glyph'), await cx('nav-icon-home'), 1, 'glyph vs nav icon center');
  near(await cx('collapse-icon'), await cx('nav-icon-home'), 1.5, 'collapse vs nav icon center');
  // one left edge for header + content
  const bc = await box(page, 'header-breadcrumb');
  near(bc.x, (await box(page, 'home-greeting')).x, 1, 'breadcrumb vs greeting x');
  near(bc.x, (await box(page, 'active-rooms-title')).x, 1, 'breadcrumb vs section title x');
  // one right edge for avatar, date pill, rail
  const right = async (id: string) => { const b = await box(page, id); return b.x + b.width; };
  near(await right('header-avatar'), await right('rail-countdown'), 1.5, 'avatar vs rail right');
  near(await right('home-date-pill'), await right('rail-countdown'), 1.5, 'date pill vs rail right');
  // date pill centered on h1
  const t = await box(page, 'home-title'), d = await box(page, 'home-date-pill');
  near(d.y + d.height / 2, t.y + t.height / 2, 1.5, 'date pill vs h1 center');
  near(d.height, 32, 1, 'date pill height');
  // left column and rail start on the same top edge
  near((await box(page, 'active-rooms-title')).y, (await box(page, 'rail-countdown')).y, 3, 'grid top edge');
  const s = await box(page, 'header-search');
  near(s.height, 36, 2, 'search height'); near(s.width, 420, 6, 'search width');
  // rail cards: same x and 320 wide
  for (const id of ['rail-countdown', 'rail-week', 'rail-upcoming']) {
    const b = await box(page, id); near(b.width, 320, 1, `${id} width`);
  }
});
