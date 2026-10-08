# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ideate.spec.ts >> Phase 3a: Ideation Board (S11) >> navigates through all seven ideation stages
- Location: e2e\ideate.spec.ts:4:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Your ideas')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Your ideas') with timeout 5000ms
  - waiting for getByText('Your ideas')

```

```yaml
- complementary "Primary navigation":
  - text: Hackathon OS
  - button "Collapse sidebar" [expanded]: Collapse
  - navigation "Primary":
    - link "Home":
      - /url: /app/home
    - link "My rooms 2":
      - /url: /app/rooms
    - link "Playbooks":
      - /url: /app/playbooks
    - link "Tool directory":
      - /url: /app/tools
    - link "Portfolio":
      - /url: /app/portfolio
    - link "Settings":
      - /url: /app/settings
  - link "Go Pro — unlock AI planning and auto-scheduling":
    - /url: /app/settings/billing
    - paragraph: Go Pro
    - paragraph: AI planning and auto-scheduling.
  - button "Copy email": aarav@example.com
  - paragraph: 09:39:01 PM IST
- main:
  - navigation "Breadcrumb": Workspace Overview
  - button "Search tasks, docs, rules (Ctrl K)": Search tasks, docs, rules Ctrl K
  - button "Notifications": "3"
  - button "User menu": AM
  - heading "Command palette" [level=2]
  - paragraph: Search tasks, docs, rules, or run actions
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Phase 3a: Ideation Board (S11)', () => {
  4  |   test('navigates through all seven ideation stages', async ({ page }) => {
  5  |     // 1. Visit an existing room and go to Ideate
  6  |     await page.goto('/app/room/r-1/ideate');
  7  | 
  8  |     // Wait for mock data
> 9  |     await expect(page.getByText('Your ideas')).toBeVisible();
     |                                                ^ Error: expect(locator).toBeVisible() failed
  10 | 
  11 |     // 2. Solo Stage
  12 |     await expect(page.getByText('Private until reveal')).toBeVisible();
  13 |     await expect(page.getByText('Idea Editor')).toBeVisible();
  14 | 
  15 |     // Leader action: Advance
  16 |     await page.getByRole('button', { name: 'Advance Stage' }).click();
  17 | 
  18 |     // 3. Reveal Stage
  19 |     await expect(page.getByText('Reveal Ideas (M04)')).toBeVisible();
  20 |     await expect(page.getByText('Anonymous Mode')).toBeVisible();
  21 |     // Reveal action
  22 |     await page.getByRole('button', { name: 'Reveal Ideas (M04)' }).click();
  23 |     await expect(page.getByRole('button', { name: 'Revealed' })).toBeVisible();
  24 | 
  25 |     // Leader action: Advance
  26 |     await page.getByRole('button', { name: 'Advance Stage' }).click();
  27 | 
  28 |     // 4. Research Stage
  29 |     await expect(page.getByText('Research Ideas')).toBeVisible();
  30 |     await expect(page.getByText('Talked to a real user')).toBeVisible();
  31 | 
  32 |     // Leader action: Advance
  33 |     await page.getByRole('button', { name: 'Advance Stage' }).click();
  34 | 
  35 |     // 5. Critique Stage
  36 |     await expect(page.getByText('Critique Matrix (C15)')).toBeVisible();
  37 |     await expect(page.getByText('Rubric Fit')).toBeVisible();
  38 | 
  39 |     // Leader action: Advance
  40 |     await page.getByRole('button', { name: 'Advance Stage' }).click();
  41 | 
  42 |     // 6. Stress Test Stage
  43 |     await expect(page.getByText('Stress Test')).toBeVisible();
  44 |     await expect(page.getByText('AI Stress Test Analysis')).toBeVisible();
  45 | 
  46 |     // Leader action: Advance
  47 |     await page.getByRole('button', { name: 'Advance Stage' }).click();
  48 | 
  49 |     // 7. Vote Stage
  50 |     await expect(page.getByText('Vote on the best idea')).toBeVisible();
  51 |     await expect(page.getByText('Submit Vote')).toBeVisible();
  52 |     // Close voting
  53 |     await page.getByRole('button', { name: 'Close Voting (Leader)' }).click();
  54 |     await expect(page.getByText('Open Voting')).toBeVisible(); // State changed
  55 | 
  56 |     // Leader action: Advance
  57 |     await page.getByRole('button', { name: 'Advance Stage' }).click();
  58 | 
  59 |     // 8. Decide Stage
  60 |     await expect(page.getByText('Lock the decision')).toBeVisible();
  61 |     await expect(page.getByText('Time to decide')).toBeVisible();
  62 |     
  63 |     // Lock idea
  64 |     await page.getByRole('button', { name: 'Lock Idea' }).click();
  65 |     
  66 |     // Wait for animation mock (1200ms)
  67 |     await page.waitForTimeout(1500);
  68 |     await expect(page.getByRole('button', { name: 'Continue to Plan' })).toBeVisible();
  69 |     
  70 |     // 9. Continue to next phase (S12 Plan Placeholder)
  71 |     await page.getByRole('button', { name: 'Continue to Plan' }).click();
  72 |     await expect(page).toHaveURL(/\/app\/room\/r-1\/plan/);
  73 |   });
  74 | });
  75 | 
```