# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: team.spec.ts >> S10: Team Screen >> renders Team layout components with mock data
- Location: e2e\team.spec.ts:4:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h2').filter({ hasText: 'Members' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('h2').filter({ hasText: 'Members' }) with timeout 5000ms
  - waiting for locator('h2').filter({ hasText: 'Members' })

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
  - paragraph: 09:40:04 PM IST
- main:
  - navigation "Breadcrumb": Workspace Overview
  - button "Search tasks, docs, rules (Ctrl K)": Search tasks, docs, rules Ctrl K
  - button "Notifications": "3"
  - button "User menu": AM
  - heading "Command palette" [level=2]
  - paragraph: Search tasks, docs, rules, or run actions
  - text: Loading Team...
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('S10: Team Screen', () => {
  4  |   test('renders Team layout components with mock data', async ({ page }) => {
  5  |     await page.goto('/app/room/r-1/team');
  6  | 
  7  |     // Wait for data load
> 8  |     await expect(page.locator('h2', { hasText: 'Members' })).toBeVisible();
     |                                                              ^ Error: expect(locator).toBeVisible() failed
  9  | 
  10 |     // Member list rendering
  11 |     await expect(page.locator('text=Aarav Mehta').first()).toBeVisible();
  12 |     await expect(page.locator('text=Ishita Rao').first()).toBeVisible();
  13 | 
  14 |     // Center column details
  15 |     await expect(page.locator('text=aarav@example.com')).toBeVisible();
  16 |     await expect(page.locator('text=@aaravm')).toBeVisible();
  17 | 
  18 |     // Right column features
  19 |     await expect(page.locator('text=Skill Gap Radar')).toBeVisible();
  20 |     await expect(page.locator('text=Team Health')).toBeVisible();
  21 |     await expect(page.locator('text=Team Charter')).toBeVisible();
  22 |     
  23 |     // Rescuer alert check (Aarav has 65%)
  24 |     await expect(page.locator('text=Rescuer alert')).toBeVisible();
  25 |     await expect(page.locator('text=65%')).toBeVisible();
  26 | 
  27 |     // Invite button
  28 |     const inviteBtn = page.locator('button', { hasText: 'Invite' });
  29 |     await expect(inviteBtn).toBeVisible();
  30 |   });
  31 | });
  32 | 
```