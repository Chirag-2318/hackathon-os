# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: brief.spec.ts >> S09: Brief Screen >> renders Brief components with mock data
- Location: e2e\brief.spec.ts:4:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h2').filter({ hasText: 'Problem Statement' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('h2').filter({ hasText: 'Problem Statement' }) with timeout 5000ms
  - waiting for locator('h2').filter({ hasText: 'Problem Statement' })

```

```yaml
- complementary "Primary navigation":
  - text: Hackathon OS
  - button "Collapse sidebar" [expanded]: Collapse
  - link "All rooms":
    - /url: /app/rooms
  - button "Switch room":
    - text: CB Campus Build Sprint 2026
    - paragraph: Polish · 09:05
  - button "Invite teammates"
  - link "Overview":
    - /url: /app/room/r-1/overview
  - link "Team":
    - /url: /app/room/r-1/team
  - link "Speed mode Crunch time active":
    - /url: /speed-mode/r-1
    - text: Speed mode
  - button "Plan 3" [expanded]
  - link "Brief":
    - /url: /app/room/r-1/brief
  - link "Ideate":
    - /url: /app/room/r-1/ideate
  - link "Plan":
    - /url: /app/room/r-1/plan
  - button "Build 3"
  - button "Tech 3"
  - button "Present Current phase 5": Present 5
  - button "Review 2"
  - paragraph: 05:05:47 PM IST
- main:
  - navigation "Breadcrumb":
    - link "My rooms":
      - /url: /app/rooms
    - link "Campus Build Sprint 2026":
      - /url: /app/room/r-1/overview
    - text: Plan Brief
  - button "Search tasks, docs, rules (Ctrl K)": Search tasks, docs, rules Ctrl K
  - button "Notifications"
  - button "User profile menu": AM
  - heading "Command palette" [level=2]
  - paragraph: Search tasks, docs, rules, or jump to any page
  - heading "Hackathon Brief" [level=1]
  - text: NOT ADDED
  - paragraph: Every rule, rubric weight, and deadline in one verified source of truth.
  - button "Link"
  - button "Upload PDF"
  - button "Write it"
  - text: Hackathon announcement URL
  - textbox "https://devpost.com/software/example or https://sih.gov.in"
  - button "Fetch" [disabled]
  - text: "Auto-parse is a Pro feature. Free: use the AI chat option."
  - button "Use an AI chat instead →"
- region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('S09: Brief Screen', () => {
  4  |   test('renders Brief components with mock data', async ({ page }) => {
  5  |     // Navigate to the Brief page
  6  |     await page.goto('/app/room/r-1/brief');
  7  | 
  8  |     // Wait for the mock data to load
> 9  |     await expect(page.locator('h2', { hasText: 'Problem Statement' })).toBeVisible();
     |                                                                        ^ Error: expect(locator).toBeVisible() failed
  10 | 
  11 |     // Verify layout panels
  12 |     // Left panel elements
  13 |     await expect(page.locator('text=Rules Checklist')).toBeVisible();
  14 |     await expect(page.locator('text=Deadlines')).toBeVisible();
  15 |     await expect(page.locator('text=Eligibility')).toBeVisible();
  16 |     await expect(page.locator('text=Tracks & Prizes')).toBeVisible();
  17 |     await expect(page.locator('text=Format')).toBeVisible();
  18 |     
  19 |     // Check AI policy callout
  20 |     await expect(page.locator('text=AI-use policy')).toBeVisible();
  21 |     
  22 |     // Check specific mock data elements
  23 |     await expect(page.locator('text=Students lack reliable ways to find study groups.')).toBeVisible();
  24 |     
  25 |     // Rules changed banner
  26 |     await expect(page.locator('text=Rules changed on 20 Sep.')).toBeVisible();
  27 |     
  28 |     // Right panel - source text and progress
  29 |     await expect(page.locator('text=Welcome to Campus Build Sprint 2026!')).toBeVisible();
  30 |     
  31 |     // Confirm all button
  32 |     const confirmBtn = page.locator('button', { hasText: 'Confirm all' });
  33 |     await expect(confirmBtn).toBeVisible();
  34 |   });
  35 | });
  36 | 
```