# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: create-room.spec.ts >> Create Room Wizard (S06) >> Speed Mode: 2 steps with auto-suggested name
- Location: e2e\create-room.spec.ts:32:3

# Error details

```
Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'Create Room' }) resolved to 2 elements:
    1) <button type="button" title="Create room" aria-label="Create room" class="opacity-0 group-hover:opacity-100 size-5 rounded hover:bg-surface text-ink-2 hover:text-ink flex items-center justify-center transition-all cursor-pointer mr-0.5">…</button> aka getByTestId('nav-row-my-rooms').getByRole('button', { name: 'Create room' })
    2) <button data-slot="button" data-size="default" data-variant="default" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-…>Create Room</button> aka getByTestId('panel').getByRole('button', { name: 'Create Room' })

Call log:
  - waiting for getByRole('button', { name: 'Create Room' })

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
          - paragraph [ref=e80]: 05:06:29 PM IST
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
            - paragraph [ref=e116]: Event Details
            - generic [ref=e118]:
              - generic [ref=e119]: "2"
              - paragraph [ref=e122]: Confirm
          - generic [ref=e124]:
            - heading "Review & Create" [level=2] [ref=e125]
            - generic [ref=e126]:
              - generic [ref=e127]:
                - paragraph [ref=e128]: Room Name
                - paragraph [ref=e129]: My room — Oct 10
              - generic [ref=e130]:
                - paragraph [ref=e131]: Template
                - paragraph [ref=e132]: 4-hour AI sprint
          - generic [ref=e133]:
            - button "Back" [ref=e134]
            - button "Create Room" [active] [ref=e135]
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
> 46 |     await page.getByRole('button', { name: 'Create Room' }).click();
     |                                                             ^ Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'Create Room' }) resolved to 2 elements:
  47 |     
  48 |     // Check navigation to overview
  49 |     await expect(page).toHaveURL(/.*\/overview/);
  50 |   });
  51 | });
  52 | 
```