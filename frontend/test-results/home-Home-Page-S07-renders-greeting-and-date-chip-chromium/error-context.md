# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home.spec.ts >> Home Page (S07) >> renders greeting and date chip
- Location: e2e\home.spec.ts:9:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Good morning,').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Good morning,').first() with timeout 5000ms
  - waiting for getByText('Good morning,').first()

```

```yaml
- complementary "Primary navigation":
  - text: Hackathon OS
  - button "Collapse sidebar" [expanded]: Collapse
  - navigation "Primary":
    - link "Home":
      - /url: /app/home
    - link "My rooms Create room 2":
      - /url: /app/rooms
      - text: My rooms
      - button "Create room"
      - text: "2"
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
    - img "Go Pro"
    - paragraph: Go Pro
    - paragraph: AI planning and auto-scheduling.
  - button "Copy email": Aarav Mehta
  - paragraph: 05:06:40 PM IST
- main:
  - navigation "Breadcrumb": Workspace Home
  - button "Search tasks, docs, rules (Ctrl K)": Search tasks, docs, rules Ctrl K
  - button "Notifications"
  - button "User profile menu": AM
  - heading "Command palette" [level=2]
  - paragraph: Search tasks, docs, rules, or jump to any page
  - paragraph: Good evening, Aarav
  - 'heading "Polish phase: record the demo and lock your submission" [level=1]'
  - button "Campus Build Sprint 2026"
  - text: Hour 39 of 48 Saturday, October 10 Submission closes DUE SOON 9 h 0 5 m left Fri, 9 Oct · 7:00 AM IST Plan Phase details and exit checkpoint info. Build Phase details and exit checkpoint info. Freeze Phase details and exit checkpoint info. Polish Phase details and exit checkpoint info. Submit Phase details and exit checkpoint info. Plan Build Freeze Polish Submit Demo rehearsed 3 times 1 / 3
  - link "Open rehearsal":
    - /url: /app/room/r-1/pitch/rehearse
  - heading "Deadlines" [level=2]
  - button "Upload demo video by 1:30 AM VIDEO Public link, max 2 minutes in 3h 30m"
  - button "Review submission draft by 4:00 AM DRAFT Check text, track and prizes in 6h"
  - button "Final submission by 7:00 AM SUBMIT All members added, links open in 9h 05m"
  - text: / Submission checklist 5 of 9
  - img
  - heading "Your tasks" [level=2]
  - text: 4 LEFT
  - checkbox
  - heading "Record the 90-second demo video" [level=3]
  - text: DEMO ~45 min
  - link "demo-script.md":
    - /url: "#"
  - button "Start"
  - button "I'm blocked"
  - button "Skip"
  - text: Then
  - checkbox
  - text: Export final cut and upload DEMO in 3h
  - checkbox
  - text: Fix mobile layout on the results page FRONTEND
  - checkbox
  - text: "Update README with run steps DOCS / Quick actions Polish phase: 25%"
  - img
  - heading "Team workload" [level=2]
  - button "This phase"
  - text: 0 4 8 12 16 Aarav Ishita Sanjay Kabir Ishita is blocked on API deploy
  - button "Help"
  - heading "Rooms you're in" [level=2]
  - button "Create new room"
  - link "View all":
    - /url: /app/rooms
  - button "Hackathon Campus Build Sprint 2026 Build":
    - text: Hackathon
    - heading "Campus Build Sprint 2026" [level=3]
    - text: Build
  - 'button "INTERNAL Internal Round: Software Edition Build"':
    - text: INTERNAL
    - 'heading "Internal Round: Software Edition" [level=3]'
    - text: Build
- region "Notifications alt+T"
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
> 10 |     await expect(page.getByText('Good morning,').first()).toBeVisible();
     |                                                           ^ Error: expect(locator).toBeVisible() failed
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
  44 |     await expect(page.getByRole('heading', { name: 'This week' })).toBeVisible();
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