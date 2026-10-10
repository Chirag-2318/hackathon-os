# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: create-room.spec.ts >> Create Room Wizard (S06) >> Standard Mode: 4 steps to create room
- Location: e2e\create-room.spec.ts:4:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByText('SIH-style hackathon')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - complementary "Primary navigation" [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]: Hackathon OS
        - button "Collapse sidebar" [expanded] [ref=e12] [cursor=pointer]:
          - generic [ref=e18]: Collapse
        - navigation "Primary" [ref=e21]:
          - link "Home" [ref=e22] [cursor=pointer]:
            - /url: /app/home
          - link "My rooms Create room 2" [ref=e28] [cursor=pointer]:
            - /url: /app/rooms
            - generic [ref=e37]: My rooms
            - button "Create room" [ref=e38]
            - generic [ref=e40]: "2"
          - link "Playbooks" [ref=e41] [cursor=pointer]:
            - /url: /app/playbooks
          - link "Tool directory" [ref=e48] [cursor=pointer]:
            - /url: /app/tools
          - link "Portfolio" [ref=e53] [cursor=pointer]:
            - /url: /app/portfolio
          - link "Settings" [ref=e59] [cursor=pointer]:
            - /url: /app/settings
        - link "Go Pro — unlock AI planning and auto-scheduling" [ref=e66] [cursor=pointer]:
          - /url: /app/settings/billing
          - img "Go Pro" [ref=e68]
          - generic [ref=e69]:
            - paragraph [ref=e70]: Go Pro
            - paragraph [ref=e71]: AI planning and auto-scheduling.
        - generic [ref=e72]:
          - button "Copy email" [ref=e74] [cursor=pointer]:
            - generic [ref=e79]: Aarav Mehta
          - paragraph [ref=e80]: 05:06:23 PM IST
    - main [ref=e81]:
      - generic [ref=e82]:
        - navigation "Breadcrumb" [ref=e83]:
          - generic [ref=e84]: Workspace
          - generic [ref=e87]: Home
        - button "Search tasks, docs, rules (Ctrl K)" [ref=e89] [cursor=pointer]:
          - generic [ref=e94]: Search tasks, docs, rules
          - generic [ref=e95]: Ctrl K
        - generic [ref=e96]:
          - button "Notifications" [ref=e97] [cursor=pointer]
          - button "User profile menu" [ref=e101] [cursor=pointer]: AM
      - generic [ref=e103]:
        - generic [ref=e104]:
          - heading "Command palette" [level=2] [ref=e105]
          - paragraph [ref=e106]: Search tasks, docs, rules, or jump to any page
        - generic [ref=e108]:
          - generic [ref=e110]:
            - generic [ref=e111]:
              - generic [ref=e112]: "1"
              - paragraph [ref=e115]: Event Details
            - generic [ref=e117]:
              - generic [ref=e118]: "2"
              - paragraph [ref=e121]: Time & Schedule
            - generic [ref=e123]:
              - generic [ref=e124]: "3"
              - paragraph [ref=e127]: Team Setup
            - generic [ref=e129]:
              - generic [ref=e130]: "4"
              - paragraph [ref=e133]: Confirm
          - generic [ref=e135]:
            - heading "What kind of event is this?" [level=2] [ref=e136]
            - generic [ref=e137]:
              - generic [ref=e138]: Event Template
              - generic [ref=e139]:
                - generic [ref=e140] [cursor=pointer]: SIH-style (6 members, 36h)
                - generic [ref=e141] [cursor=pointer]: 48-hour online (Devpost-style)
                - generic [ref=e142] [cursor=pointer]: Weekend (MLH-style)
                - generic [ref=e143] [cursor=pointer]: 4-hour AI sprint
                - generic [ref=e144] [cursor=pointer]: Corporate hackathon
                - generic [ref=e145] [cursor=pointer]: Solo
            - generic [ref=e146]:
              - generic [ref=e147]:
                - generic [ref=e148]: Rules & Brief
                - generic [ref=e149]:
                  - button "Paste Text" [ref=e150]
                  - button "Paste Link" [ref=e151]
              - textbox "Paste the hackathon rules or prompt here..." [ref=e152]
          - generic [ref=e153]:
            - button "Cancel" [ref=e154]
            - button "Next" [disabled]
  - region "Notifications alt+T"
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
> 9  |     await page.getByText('SIH-style hackathon').click();
     |                                                 ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
  29 |     await expect(page).toHaveURL(/.*\/overview/);
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