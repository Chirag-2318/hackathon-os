# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: create-room.spec.ts >> Create Room Wizard (S06) >> Standard Mode: 4 steps to create room
- Location: e2e\create-room.spec.ts:4:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*\/overview/
Received string:  "http://localhost:5173/app/create-room"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    13 × locator resolved to <html lang="en" class="light">…</html>
       - unexpected value "http://localhost:5173/app/create-room"

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
  - paragraph: 09:38:44 PM IST
- main:
  - navigation "Breadcrumb": Workspace Home
  - button "Search tasks, docs, rules (Ctrl K)": Search tasks, docs, rules Ctrl K
  - button "Notifications": "3"
  - button "User menu": AM
  - heading "Command palette" [level=2]
  - paragraph: Search tasks, docs, rules, or run actions
  - paragraph: Event Details
  - paragraph: Time & Schedule
  - paragraph: Team Setup
  - text: "4"
  - paragraph: Confirm
  - heading "Review & Create" [level=2]
  - paragraph: Room Name
  - paragraph: My Awesome Team
  - paragraph: Template
  - paragraph: SIH-style hackathon
  - paragraph: Team Size
  - paragraph: 4 members
  - button "Back"
  - button "Create Room"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Create Room Wizard (S06)', () => {
  4  |   test('Standard Mode: 4 steps to create room', async ({ page }) => {
  5  |     await page.goto('/app/create-room');
  6  |     
  7  |     // Step 1: Event Details
  8  |     await expect(page.getByRole('heading', { name: 'What kind of event is this?' })).toBeVisible();
  9  |     await page.getByText('SIH-style hackathon').click();
  10 |     await page.getByRole('button', { name: 'Next' }).click();
  11 | 
  12 |     // Step 2: Time
  13 |     await expect(page.getByRole('heading', { name: 'When does it happen?' })).toBeVisible();
  14 |     await page.getByRole('button', { name: 'Next' }).click();
  15 | 
  16 |     // Step 3: Team
  17 |     await expect(page.getByRole('heading', { name: 'Set up your team' })).toBeVisible();
  18 |     await page.getByLabel('Room Name').fill('My Awesome Team');
  19 |     await page.getByRole('button', { name: 'Next' }).click();
  20 | 
  21 |     // Step 4: Confirm
  22 |     await expect(page.getByRole('heading', { name: 'Review & Create' })).toBeVisible();
  23 |     await expect(page.getByText('My Awesome Team')).toBeVisible();
  24 |     
  25 |     // Submit
  26 |     await page.getByRole('button', { name: 'Create Room' }).click();
  27 |     
  28 |     // Check navigation to overview
> 29 |     await expect(page).toHaveURL(/.*\/overview/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  30 |   });
  31 | 
  32 |   test('Speed Mode: 2 steps with auto-suggested name', async ({ page }) => {
  33 |     await page.goto('/app/create-room?mode=speed');
  34 |     
  35 |     // Step 1: Event Details
  36 |     await expect(page.getByRole('heading', { name: 'What kind of event is this?' })).toBeVisible();
  37 |     await page.getByText('4-hour AI sprint').click();
  38 |     await page.getByRole('button', { name: 'Next' }).click();
  39 | 
  40 |     // Step 2: Confirm (auto-skipped time and team)
  41 |     await expect(page.getByRole('heading', { name: 'Review & Create' })).toBeVisible();
  42 |     // Name should be auto-suggested
  43 |     await expect(page.getByText(/My room — /)).toBeVisible();
  44 |     
  45 |     // Submit
  46 |     await page.getByRole('button', { name: 'Create Room' }).click();
  47 |     
  48 |     // Check navigation to overview
  49 |     await expect(page).toHaveURL(/.*\/overview/);
  50 |   });
  51 | });
  52 | 
```