# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home.spec.ts >> Home Page (S07) >> filters room list
- Location: e2e\home.spec.ts:20:3

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('[data-slot="list-row"]')
Expected: 2
Received: 0
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" locator('[data-slot="list-row"]') with timeout 5000ms
  - waiting for locator('[data-slot="list-row"]')
    14 × locator resolved to 0 elements
       - unexpected value "0"

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
          - paragraph [ref=e80]: 05:06:58 PM IST
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
          - generic [ref=e109]:
            - generic [ref=e110]:
              - paragraph [ref=e111]: Good evening, Aarav
              - 'heading "Polish phase: record the demo and lock your submission" [level=1] [ref=e112]'
              - generic [ref=e113]:
                - button "Campus Build Sprint 2026" [ref=e115]
                - generic [ref=e119]: Hour 39 of 48
            - generic [ref=e120]: Saturday, October 10
          - generic [ref=e124]:
            - generic [ref=e126]:
              - generic [ref=e127]:
                - generic [ref=e128]: Submission closes
                - generic [ref=e129]: DUE SOON
              - generic [ref=e131]:
                - generic [ref=e132]: "9"
                - generic [ref=e134]: h
                - generic [ref=e135]: "0"
                - generic [ref=e137]: "5"
                - generic [ref=e139]: m
                - generic [ref=e140]: left
              - generic [ref=e141]: Fri, 9 Oct · 7:00 AM IST
              - generic [ref=e145]:
                - generic [ref=e146]:
                  - generic [ref=e147]:
                    - generic:
                      - generic: Plan
                      - generic: Phase details and exit checkpoint info.
                  - generic [ref=e149]:
                    - generic:
                      - generic: Build
                      - generic: Phase details and exit checkpoint info.
                  - generic [ref=e151]:
                    - generic:
                      - generic: Freeze
                      - generic: Phase details and exit checkpoint info.
                  - generic [ref=e153]:
                    - generic:
                      - generic: Polish
                      - generic: Phase details and exit checkpoint info.
                  - generic [ref=e155]:
                    - generic:
                      - generic: Submit
                      - generic: Phase details and exit checkpoint info.
                - generic [ref=e157]:
                  - generic [ref=e158]: Plan
                  - generic [ref=e159]: Build
                  - generic [ref=e160]: Freeze
                  - generic [ref=e161]: Polish
                  - generic [ref=e162]: Submit
              - generic [ref=e164]:
                - generic [ref=e167]: Demo rehearsed 3 times
                - generic [ref=e168]: 1 / 3
                - link "Open rehearsal" [ref=e171] [cursor=pointer]:
                  - /url: /app/room/r-1/pitch/rehearse
            - generic [ref=e174]:
              - generic [ref=e175]:
                - heading "Deadlines" [level=2] [ref=e180]
                - generic [ref=e181]:
                  - button "Upload demo video by 1:30 AM VIDEO Public link, max 2 minutes in 3h 30m" [ref=e182]:
                    - generic [ref=e185]:
                      - generic [ref=e186]:
                        - generic [ref=e187]: Upload demo video by 1:30 AM
                        - generic [ref=e188]: VIDEO
                      - generic [ref=e190]: Public link, max 2 minutes
                    - generic [ref=e191]: in 3h 30m
                  - button "Review submission draft by 4:00 AM DRAFT Check text, track and prizes in 6h" [ref=e196]:
                    - generic [ref=e199]:
                      - generic [ref=e200]:
                        - generic [ref=e201]: Review submission draft by 4:00 AM
                        - generic [ref=e202]: DRAFT
                      - generic [ref=e204]: Check text, track and prizes
                    - generic [ref=e205]: in 6h
                  - button "Final submission by 7:00 AM SUBMIT All members added, links open in 9h 05m" [ref=e210]:
                    - generic [ref=e213]:
                      - generic [ref=e214]:
                        - generic [ref=e215]: Final submission by 7:00 AM
                        - generic [ref=e216]: SUBMIT
                      - generic [ref=e218]: All members added, links open
                    - generic [ref=e219]: in 9h 05m
              - generic [ref=e224]:
                - generic [ref=e225]:
                  - generic [ref=e226]: /
                  - generic [ref=e227]: Submission checklist
                - generic [ref=e228]: 5 of 9
          - generic [ref=e234]:
            - generic [ref=e235]:
              - generic [ref=e237]:
                - generic [ref=e238]:
                  - generic [ref=e239]:
                    - heading "Your tasks" [level=2] [ref=e240]
                    - generic [ref=e241]: 4 LEFT
                  - generic [ref=e243]:
                    - generic [ref=e245]:
                      - checkbox [ref=e247]
                      - generic [ref=e248]:
                        - heading "Record the 90-second demo video" [level=3] [ref=e249]
                        - generic [ref=e250]:
                          - generic [ref=e251]: DEMO
                          - generic [ref=e253]: ~45 min
                          - link "demo-script.md" [ref=e258] [cursor=pointer]:
                            - /url: "#"
                        - generic [ref=e259]:
                          - button "Start" [ref=e260]
                          - button "I'm blocked" [ref=e261]
                          - button "Skip" [ref=e262]
                    - generic [ref=e263]: Then
                    - generic [ref=e265]:
                      - checkbox [ref=e267]
                      - generic [ref=e268]:
                        - generic [ref=e269]: Export final cut and upload
                        - generic [ref=e271]:
                          - generic [ref=e272]: DEMO
                          - generic [ref=e274]: in 3h
                    - generic [ref=e279]:
                      - checkbox [ref=e281]
                      - generic [ref=e282]:
                        - generic [ref=e283]: Fix mobile layout on the results page
                        - generic [ref=e285]: FRONTEND
                    - generic [ref=e292]:
                      - checkbox [ref=e294]
                      - generic [ref=e295]:
                        - generic [ref=e296]: Update README with run steps
                        - generic [ref=e298]: DOCS
                - generic [ref=e305]:
                  - generic [ref=e306]:
                    - generic [ref=e307]: /
                    - generic [ref=e308]: Quick actions
                  - generic [ref=e309]: "Polish phase: 25%"
              - generic [ref=e316]:
                - generic [ref=e317]:
                  - heading "Team workload" [level=2] [ref=e320]
                  - button "This phase" [ref=e322]
                - generic [ref=e326]:
                  - generic:
                    - generic: "0"
                    - generic: "4"
                    - generic: "8"
                    - generic: "12"
                    - generic: "16"
                  - generic [ref=e327]:
                    - generic [ref=e328]: Aarav
                    - generic [ref=e337]: Ishita
                    - generic [ref=e346]: Sanjay
                    - generic [ref=e355]: Kabir
                - generic [ref=e364]:
                  - generic [ref=e365]: Ishita is blocked on API deploy
                  - button "Help" [ref=e368]
            - generic [ref=e370]:
              - generic [ref=e371]:
                - generic [ref=e372]:
                  - heading "Rooms you're in" [level=2] [ref=e373]
                  - button "Create new room" [ref=e374] [cursor=pointer]
                - link "View all" [ref=e376] [cursor=pointer]:
                  - /url: /app/rooms
              - generic [ref=e377]:
                - button "Hackathon Campus Build Sprint 2026 Build" [ref=e379] [cursor=pointer]:
                  - generic [ref=e380]: Hackathon
                  - heading "Campus Build Sprint 2026" [level=3] [ref=e381]
                  - generic [ref=e382]: Build
                - 'button "INTERNAL Internal Round: Software Edition Build" [ref=e387] [cursor=pointer]':
                  - generic [ref=e388]: INTERNAL
                  - 'heading "Internal Round: Software Edition" [level=3] [ref=e389]'
                  - generic [ref=e390]: Build
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
> 25 |     await expect(rows).toHaveCount(2);
     |                        ^ Error: expect(locator).toHaveCount(expected) failed
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