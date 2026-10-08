# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home.spec.ts >> Home Page (S07) >> right rail shows countdown and week strip
- Location: e2e\home.spec.ts:39:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'This week' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'This week' }) with timeout 5000ms
  - waiting for getByRole('heading', { name: 'This week' })

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
  - paragraph: 09:38:54 PM IST
- main:
  - navigation "Breadcrumb": Workspace Home
  - button "Search tasks, docs, rules (Ctrl K)": Search tasks, docs, rules Ctrl K
  - button "Notifications": "3"
  - button "User menu": AM
  - heading "Command palette" [level=2]
  - paragraph: Search tasks, docs, rules, or run actions
  - paragraph: Good morning, Aarav Mehta
  - heading "Ready to build?" [level=1]
  - text: Thursday, October 8
  - heading "Active rooms" [level=2]
  - text: "2"
  - link "Campus Build Sprint 2026 Campus Sprint Progress 62 62% Aarav Mehta 18 tasks left":
    - /url: /app/room/r-1/overview
    - heading "Campus Build Sprint 2026" [level=3]
    - text: Campus Sprint Progress
    - progressbar
    - text: 62% Aarav Mehta 18 tasks left
  - 'link "Internal Round: Software Edition Internal Progress 30 30% Jane Doe 42 tasks left"':
    - /url: /app/room/r-2/overview
    - 'heading "Internal Round: Software Edition" [level=3]'
    - text: Internal Progress
    - progressbar
    - text: 30% Jane Doe 42 tasks left
  - heading "Rooms you're in" [level=2]
  - combobox "Filter rooms": Active
  - button "Search rooms"
  - button "Create room"
  - button "Campus Build Sprint 2026 Aarav Mehta·Active 62 62%":
    - paragraph: Campus Build Sprint 2026
    - paragraph: Aarav Mehta·Active
    - progressbar
    - text: 62%
  - 'button "Internal Round: Software Edition Jane Doe·Active 30 30%"':
    - paragraph: "Internal Round: Software Edition"
    - paragraph: Jane Doe·Active
    - progressbar
    - text: 30%
  - complementary "Right rail":
    - text: Until submission Due soon
    - paragraph: 9h 05m
    - text: Overall progress
    - progressbar
    - text: 68%
    - row "Week calendar":
      - cell "Sunday, October 4": Sun 4
      - cell "Monday, October 5": Mon 5
      - cell "Tuesday, October 6": Tue 6
      - cell "Wednesday, October 7": Wed 7
      - cell "Thursday, October 8": Thu 8
      - cell "Friday, October 9": Fri 9
      - cell "Saturday, October 10": Sat 10
    - heading "Upcoming" [level=3]
    - text: Freeze Submit
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Home Page (S07)', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Navigate directly to the home page (assumes MSW is active)
  6  |     await page.goto('/app/home');
  7  |   });
  8  | 
  9  |   test('renders greeting and date chip', async ({ page }) => {
  10 |     await expect(page.getByText('Good morning,').first()).toBeVisible();
  11 |     await expect(page.getByText('Aarav Mehta').first()).toBeVisible();
  12 |   });
  13 | 
  14 |   test('shows urgent room feature cards', async ({ page }) => {
  15 |     // There should be 2 feature cards (Campus Build Sprint 2026 and Internal Round)
  16 |     await expect(page.getByRole('heading', { name: 'Campus Build Sprint 2026' })).toBeVisible();
  17 |     await expect(page.getByRole('heading', { name: 'Internal Round: Software Edition' })).toBeVisible();
  18 |   });
  19 | 
  20 |   test('filters room list', async ({ page }) => {
  21 |     // Check initial state (Active filter)
  22 |     await expect(page.getByRole('heading', { name: "Rooms you're in" })).toBeVisible();
  23 |     // Since MSW fixture sets both to "Active", they should be visible
  24 |     const rows = page.locator('[data-slot="list-row"]');
  25 |     await expect(rows).toHaveCount(2);
  26 | 
  27 |     // Change filter to Completed
  28 |     await page.getByRole('combobox').click();
  29 |     await page.getByRole('option', { name: 'Completed' }).click();
  30 | 
  31 |     // Check empty state
  32 |     await expect(page.getByText('No rooms match these filters.')).toBeVisible();
  33 | 
  34 |     // Clear filters
  35 |     await page.getByRole('button', { name: 'Clear filters' }).click();
  36 |     await expect(rows).toHaveCount(2);
  37 |   });
  38 | 
  39 |   test('right rail shows countdown and week strip', async ({ page }) => {
  40 |     // Check right rail HeroPanel countdown
  41 |     await expect(page.getByText('until submission')).toBeVisible();
  42 | 
  43 |     // Check week strip
> 44 |     await expect(page.getByRole('heading', { name: 'This week' })).toBeVisible();
     |                                                                    ^ Error: expect(locator).toBeVisible() failed
  45 |     await expect(page.locator('[data-slot="week-strip"]')).toBeVisible();
  46 | 
  47 |     // Check upcoming items
  48 |     await expect(page.getByRole('heading', { name: 'Upcoming' })).toBeVisible();
  49 |     await expect(page.getByText('Freeze')).toBeVisible();
  50 |   });
  51 | 
  52 |   test('navigates to room overview on card click', async ({ page }) => {
  53 |     await page.getByRole('heading', { name: 'Campus Build Sprint 2026' }).click();
  54 |     await expect(page).toHaveURL(/\/app\/room\/r-1\/overview/);
  55 |   });
  56 | });
  57 | 
```