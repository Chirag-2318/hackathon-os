# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\shell-geometry.spec.ts >> sidebar absolute geometry
- Location: e2e\shell-geometry.spec.ts:24:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.boundingBox: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByTestId('sidebar')

```

# Page snapshot

```yaml
- generic:
  - generic:
    - generic:
      - generic:
        - generic: "[brackit]"
        - 'heading "[TODO: sign in heading]" [level=1]'
        - generic:
          - button "Continue with GitHub"
          - button "Continue with Google"
          - paragraph: Early access, 1,000 spots. 997 left.
        - paragraph: "[TODO: minimal GitHub permissions requested]"
        - generic:
          - link "Terms":
            - /url: /terms
          - generic: ·
          - link "Privacy":
            - /url: /privacy
      - generic:
        - generic:
          - generic:
            - generic:
              - generic [aria-hidden]: "[TODO: sign-in illustration alt text]"
    - region "Notifications alt+T"
  - dialog [ref=e2]:
    - generic [ref=e3]:
      - heading "Session Expired" [level=2] [ref=e7]
      - paragraph [ref=e8]: Your authenticated session has expired. You can review and copy any unsaved drafts before re-authenticating.
    - generic [ref=e9]:
      - button "Review Current Page" [active] [ref=e10]
      - button "Sign In Again" [ref=e11]
    - button "Close" [ref=e13]
```

# Test source

```ts
  1  | import { test, expect, Page } from '@playwright/test';
  2  | 
  3  | test.use({ viewport: { width: 1534, height: 729 }, deviceScaleFactor: 1.25 });
  4  | 
  5  | async function goHome(page: Page) {
  6  |   await page.goto('http://localhost:5173/app/home');
  7  |   await page.waitForLoadState('networkidle');
  8  | }
  9  | const box = async (page: Page, id: string) => {
> 10 |   const b = await page.getByTestId(id).boundingBox();
     |                                        ^ Error: locator.boundingBox: Test timeout of 30000ms exceeded.
  11 |   if (!b) throw new Error(`missing or hidden: ${id}`);
  12 |   return b;
  13 | };
  14 | const near = (a: number, b: number, tol = 2, label = '') =>
  15 |   expect(Math.abs(a - b), `${label} got ${a}, want ${b}`).toBeLessThanOrEqual(tol);
  16 | const style = (page: Page, id: string) =>
  17 |   page.getByTestId(id).evaluate((el) => {
  18 |     const s = getComputedStyle(el);
  19 |     return { size: s.fontSize, weight: s.fontWeight, family: s.fontFamily };
  20 |   });
  21 | 
  22 | const KEYS = ['home', 'my-rooms', 'playbooks', 'tools', 'portfolio', 'settings'];
  23 | 
  24 | test('sidebar absolute geometry', async ({ page }) => {
  25 |   await goHome(page);
  26 |   near((await box(page, 'sidebar')).width, 232, 0.5, 'sidebar width');
  27 |   const g = await box(page, 'brand-glyph');
  28 |   near(g.x, 30, 1.5, 'brand glyph x'); near(g.width, 20, 1.5, 'brand glyph w');
  29 |   near((await box(page, 'brand-text')).x, 60, 1.5, 'brand text x');
  30 |   near((await box(page, 'collapse-icon')).x, 30, 2, 'collapse icon box x');
  31 |   near((await box(page, 'collapse-text')).x, 60, 1.5, 'collapse text x');
  32 |   for (const [i, k] of KEYS.entries()) {
  33 |     const r = await box(page, `nav-row-${k}`);
  34 |     near(r.x, 20, 1, `${k} row x`); near(r.y, 112 + 36 * i, 2, `${k} row y`);
  35 |     near(r.width, 192, 1, `${k} row w`); near(r.height, 32, 1, `${k} row h`);
  36 |     const ic = await box(page, `nav-icon-${k}`);
  37 |     near(ic.x, 30, 1.5, `${k} icon x`); near(ic.width, 20, 1, `${k} icon w`);
  38 |     near((await box(page, `nav-label-${k}`)).x, 60, 1.5, `${k} label x`);
  39 |   }
  40 |   const p = await box(page, 'promo');
  41 |   near(p.x, 20, 1); near(p.y, 360, 3, 'promo y'); near(p.width, 192, 1); near(p.height, 162, 5, 'promo h');
  42 |   const cap = await box(page, 'promo-caption');
  43 |   expect(cap.height, 'promo caption must be ONE line').toBeLessThanOrEqual(16);
  44 |   near((await box(page, 'footer-email')).x, 60, 2, 'email text x');
  45 |   near((await box(page, 'footer-clock')).x, 60, 2, 'clock x');
  46 |   const clock = await box(page, 'footer-clock');
  47 |   near(clock.y + clock.height, 729 - 32, 4, 'clock bottom');
  48 | });
  49 | 
  50 | test('sidebar typography', async ({ page }) => {
  51 |   await goHome(page);
  52 |   const want: Record<string, [string, string]> = {
  53 |     'brand-text': ['16px', '600'], 'collapse-text': ['14px', '400'],
  54 |     'nav-label-home': ['14px', '500'], 'nav-label-settings': ['14px', '500'],
  55 |     'promo-title': ['14px', '500'], 'promo-caption': ['11px', '400'],
  56 |     'footer-email': ['14px', '400'], 'footer-clock': ['13px', '400'], 'home-title': ['32px', '700'],
  57 |   };
  58 |   for (const [id, [size, weight]] of Object.entries(want)) {
  59 |     const s = await style(page, id);
  60 |     expect(s.size, `${id} size`).toBe(size);
  61 |     expect(s.weight, `${id} weight`).toBe(weight);
  62 |     expect(s.family, `${id} font`).toContain('DM Sans');
  63 |   }
  64 | });
  65 | 
  66 | test('alignment relationships', async ({ page }) => {
  67 |   await goHome(page);
  68 |   const cx = async (id: string) => { const b = await box(page, id); return b.x + b.width / 2; };
  69 |   near(await cx('brand-glyph'), await cx('nav-icon-home'), 1, 'glyph vs nav icon center');
  70 |   near(await cx('collapse-icon'), await cx('nav-icon-home'), 1.5, 'collapse vs nav icon center');
  71 |   // one left edge for header + content
  72 |   const bc = await box(page, 'header-breadcrumb');
  73 |   near(bc.x, (await box(page, 'home-greeting')).x, 1, 'breadcrumb vs greeting x');
  74 |   near(bc.x, (await box(page, 'active-rooms-title')).x, 1, 'breadcrumb vs section title x');
  75 |   // one right edge for avatar, date pill, rail
  76 |   const right = async (id: string) => { const b = await box(page, id); return b.x + b.width; };
  77 |   near(await right('header-avatar'), await right('rail-countdown'), 1.5, 'avatar vs rail right');
  78 |   near(await right('home-date-pill'), await right('rail-countdown'), 1.5, 'date pill vs rail right');
  79 |   // date pill centered on h1
  80 |   const t = await box(page, 'home-title'), d = await box(page, 'home-date-pill');
  81 |   near(d.y + d.height / 2, t.y + t.height / 2, 1.5, 'date pill vs h1 center');
  82 |   near(d.height, 32, 1, 'date pill height');
  83 |   // left column and rail start on the same top edge
  84 |   near((await box(page, 'active-rooms-title')).y, (await box(page, 'rail-countdown')).y, 3, 'grid top edge');
  85 |   const s = await box(page, 'header-search');
  86 |   near(s.height, 36, 2, 'search height'); near(s.width, 420, 6, 'search width');
  87 |   // rail cards: same x and 320 wide
  88 |   for (const id of ['rail-countdown', 'rail-week', 'rail-upcoming']) {
  89 |     const b = await box(page, id); near(b.width, 320, 1, `${id} width`);
  90 |   }
  91 | });
  92 | 
```