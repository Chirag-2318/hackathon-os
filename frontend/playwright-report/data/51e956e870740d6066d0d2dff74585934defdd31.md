# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: landing.spec.ts >> S01 Landing Page >> playbooks section handles loading and data
- Location: e2e\landing.spec.ts:55:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('playbook-cards')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByTestId('playbook-cards') with timeout 5000ms
  - waiting for getByTestId('playbook-cards')

```

```yaml
- banner:
  - link "Hackathon OS":
    - /url: /
  - navigation:
    - link "Playbooks":
      - /url: /playbooks
    - link "Pricing":
      - /url: "#plans"
    - link "Sign in":
      - /url: /signin
    - link "Start a room":
      - /url: /signin
- region "Hero":
  - 'heading "[TODO: hero headline]" [level=1]'
  - paragraph: "[TODO: hero sentence]"
  - text: Room Overview (S08) — placeholder
- region "Five ways teams lose":
  - heading "Five ways teams lose" [level=2]
  - tablist "Five ways teams lose":
    - tab "no demo running by the halfway point" [selected]
    - tab "scope larger than the clock"
    - tab "rubric never read"
    - tab "submission started last"
    - tab "no fallback if wifi fails"
  - tabpanel "no demo running by the halfway point": No demo running — placeholder
- region "Phase walkthrough":
  - 'heading "[TODO: walkthrough section title]" [level=2]'
  - navigation "Phase navigation":
    - list:
      - listitem:
        - 'button "Prep [TODO: prep phase description]"'
      - listitem:
        - 'button "Ideate [TODO: ideate phase description]"'
      - listitem:
        - 'button "Plan [TODO: plan phase description]"'
      - listitem:
        - 'button "Build [TODO: build phase description]"'
      - listitem:
        - 'button "Freeze [TODO: freeze phase description]"'
      - listitem:
        - 'button "Ship [TODO: ship phase description]"'
      - listitem:
        - 'button "Retro [TODO: retro phase description]"'
  - text: Prep phase — placeholder Ideate phase — placeholder Plan phase — placeholder Build phase — placeholder Freeze phase — placeholder Ship phase — placeholder Retro phase — placeholder
- region "Plans comparison":
  - 'heading "[TODO: plans section title]" [level=2]'
  - table:
    - rowgroup:
      - 'row "Plan [TODO: plans section title] [TODO: plans section title] [TODO: plans section title]"':
        - columnheader "Plan"
        - 'columnheader "[TODO: plans section title]"'
        - 'columnheader "[TODO: plans section title]"'
        - 'columnheader "[TODO: plans section title]"'
    - rowgroup:
      - 'row "Free (Prompt Bridge) [TODO: plans section title] [TODO: plans section title] [TODO: plans section title]"':
        - cell "Free (Prompt Bridge)"
        - 'cell "[TODO: plans section title]"'
        - 'cell "[TODO: plans section title]"'
        - 'cell "[TODO: plans section title]"'
      - 'row "Bring your key [TODO: plans section title] [TODO: plans section title] [TODO: plans section title]"':
        - cell "Bring your key"
        - 'cell "[TODO: plans section title]"'
        - 'cell "[TODO: plans section title]"'
        - 'cell "[TODO: plans section title]"'
      - 'row "Pro [TODO: plans section title] [TODO: plans section title] [TODO: plans section title]"':
        - cell "Pro"
        - 'cell "[TODO: plans section title]"'
        - 'cell "[TODO: plans section title]"'
        - 'cell "[TODO: plans section title]"'
- region "Playbooks":
  - 'heading "[TODO: playbook section title]" [level=2]'
  - alert:
    - paragraph: "[TODO: playbook error message — what happened + what to do]"
    - button "Try again"
- contentinfo:
  - text: Hackathon OS
  - paragraph: "[TODO: footer content]"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('S01 Landing Page', () => {
  4  |   test('renders all 7 sections in order', async ({ page }) => {
  5  |     await page.goto('/');
  6  | 
  7  |     // 1. Header
  8  |     await expect(page.locator('header')).toBeVisible();
  9  | 
  10 |     // 2. Hero
  11 |     await expect(page.locator('section[aria-label="Hero"]')).toBeVisible();
  12 | 
  13 |     // 3. Five ways teams lose
  14 |     await expect(page.locator('section[aria-label="Five ways teams lose"]')).toBeVisible();
  15 | 
  16 |     // 4. Phase walkthrough
  17 |     await expect(page.locator('section[aria-label="Phase walkthrough"]')).toBeVisible();
  18 | 
  19 |     // 5. Plans
  20 |     await expect(page.locator('section[aria-label="Plans comparison"]')).toBeVisible();
  21 | 
  22 |     // 6. Playbook cards
  23 |     await expect(page.locator('section[aria-label="Playbooks"]')).toBeVisible();
  24 | 
  25 |     // 7. Footer
  26 |     await expect(page.locator('footer')).toBeVisible();
  27 |   });
  28 | 
  29 |   test('interactive five-ways section updates screen', async ({ page }) => {
  30 |     await page.goto('/');
  31 |     
  32 |     const tabs = page.locator('button[role="tab"]');
  33 |     const panels = page.locator('div[role="tabpanel"]');
  34 |     
  35 |     // First tab is selected by default
  36 |     await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  37 |     await expect(panels.nth(0)).not.toHaveAttribute('hidden', '');
  38 |     
  39 |     // Click second tab
  40 |     await tabs.nth(1).click();
  41 |     await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'false');
  42 |     await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  43 |     
  44 |     // Check panel visibility (Playwright handles hidden attribute natively)
  45 |     await expect(panels.nth(0)).toBeHidden();
  46 |     await expect(panels.nth(1)).toBeVisible();
  47 |   });
  48 | 
  49 |   test('plans table renders 3 rows', async ({ page }) => {
  50 |     await page.goto('/');
  51 |     const rows = page.locator('section[aria-label="Plans comparison"] tbody tr');
  52 |     await expect(rows).toHaveCount(3);
  53 |   });
  54 | 
  55 |   test('playbooks section handles loading and data', async ({ page }) => {
  56 |     await page.goto('/');
  57 |     
  58 |     // Cards should render (fixture has 4 items)
> 59 |     await expect(page.getByTestId('playbook-cards')).toBeVisible({ timeout: 5000 });
     |                                                      ^ Error: expect(locator).toBeVisible() failed
  60 |     const cards = page.locator('[data-slot="playbook-card"]');
  61 |     await expect(cards).toHaveCount(4);
  62 |   });
  63 | });
  64 | 
```