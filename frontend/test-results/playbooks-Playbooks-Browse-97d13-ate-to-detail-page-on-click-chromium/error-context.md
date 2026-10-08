# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: playbooks.spec.ts >> Playbooks Browse (S04) >> should navigate to detail page on click
- Location: e2e\playbooks.spec.ts:33:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('[data-slot="playbook-card"]').first()

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - link "Hackathon OS" [ref=e6] [cursor=pointer]:
        - /url: /
      - navigation [ref=e7]:
        - link "Playbooks" [ref=e8] [cursor=pointer]:
          - /url: /playbooks
        - link "Pricing" [ref=e9] [cursor=pointer]:
          - /url: "#plans"
        - link "Sign in" [ref=e10] [cursor=pointer]:
          - /url: /signin
        - link "Start a room" [ref=e11] [cursor=pointer]:
          - /url: /signin
  - main [ref=e12]:
    - generic [ref=e13]:
      - heading "Playbook Templates" [level=1] [ref=e14]
      - paragraph [ref=e15]: Battle-tested blueprints for your next hackathon.
    - generic [ref=e16]:
      - combobox [ref=e17]:
        - generic: All Types
      - combobox [ref=e18]:
        - generic: Any Size
    - generic [ref=e19]:
      - paragraph [ref=e20]: Failed to load playbooks.
      - button "Try again" [ref=e21]
  - contentinfo [ref=e22]:
    - generic [ref=e24]:
      - generic [ref=e25]: Hackathon OS
      - paragraph [ref=e26]: "[TODO: footer content]"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Playbooks Browse (S04)', () => {
  4  |   test('should display playbooks and filter correctly', async ({ page }) => {
  5  |     await page.goto('/playbooks');
  6  |     
  7  |     // Check header
  8  |     await expect(page.getByRole('heading', { name: 'Playbook Templates' })).toBeVisible();
  9  | 
  10 |     // The grid should show playbook cards
  11 |     const cards = page.locator('[data-slot="playbook-card"]');
  12 |     await expect(cards.first()).toBeVisible();
  13 |     const count = await cards.count();
  14 |     expect(count).toBeGreaterThan(0);
  15 | 
  16 |     // Test filters
  17 |     await page.getByRole('combobox').first().click(); // Open Type filter
  18 |     await page.getByRole('option', { name: '36-hour team' }).click();
  19 | 
  20 |     // Check that cards are filtered
  21 |     const filteredCount = await cards.count();
  22 |     expect(filteredCount).toBeLessThan(count);
  23 |     expect(filteredCount).toBeGreaterThan(0);
  24 | 
  25 |     // Test clear filters
  26 |     await page.getByRole('button', { name: /Remove filter/i }).first().click();
  27 |     
  28 |     // Should be back to full count
  29 |     const restoredCount = await cards.count();
  30 |     expect(restoredCount).toBe(count);
  31 |   });
  32 | 
  33 |   test('should navigate to detail page on click', async ({ page }) => {
  34 |     await page.goto('/playbooks');
  35 |     
  36 |     const cards = page.locator('[data-slot="playbook-card"]');
> 37 |     await cards.first().click();
     |                         ^ Error: locator.click: Test timeout of 30000ms exceeded.
  38 | 
  39 |     // Verify detail page
  40 |     await expect(page.getByRole('link', { name: /Use this playbook/i })).toBeVisible();
  41 |     await expect(page.getByRole('heading', { name: 'Judging Criteria' })).toBeVisible();
  42 |   });
  43 | });
  44 | 
```