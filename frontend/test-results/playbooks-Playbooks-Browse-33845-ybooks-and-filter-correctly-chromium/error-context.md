# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: playbooks.spec.ts >> Playbooks Browse (S04) >> should display playbooks and filter correctly
- Location: e2e\playbooks.spec.ts:4:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-slot="playbook-card"]').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('[data-slot="playbook-card"]').first() with timeout 5000ms
  - waiting for locator('[data-slot="playbook-card"]').first()

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
- main:
  - heading "Playbook Templates" [level=1]
  - paragraph: Battle-tested blueprints for your next hackathon.
  - combobox: All Types
  - combobox: Any Size
  - paragraph: Failed to load playbooks.
  - button "Try again"
- contentinfo:
  - text: Hackathon OS
  - paragraph: "[TODO: footer content]"
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
> 12 |     await expect(cards.first()).toBeVisible();
     |                                 ^ Error: expect(locator).toBeVisible() failed
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
  37 |     await cards.first().click();
  38 | 
  39 |     // Verify detail page
  40 |     await expect(page.getByRole('link', { name: /Use this playbook/i })).toBeVisible();
  41 |     await expect(page.getByRole('heading', { name: 'Judging Criteria' })).toBeVisible();
  42 |   });
  43 | });
  44 | 
```