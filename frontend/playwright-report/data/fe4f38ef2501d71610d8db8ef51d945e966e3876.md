# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: create-room.spec.ts >> Create Room Wizard (S06) >> Speed Mode: 2 steps with auto-suggested name
- Location: e2e\create-room.spec.ts:32:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'What kind of event is this?' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'What kind of event is this?' }) with timeout 5000ms
  - waiting for getByRole('heading', { name: 'What kind of event is this?' })

```

```yaml
- text: "[brackit]"
- 'heading "[TODO: sign in heading]" [level=1]'
- button "Continue with GitHub"
- button "Continue with Google"
- paragraph: Early access, 1,000 spots. 986 left.
- paragraph: "[TODO: minimal GitHub permissions requested]"
- link "Terms":
  - /url: /terms
- text: ·
- link "Privacy":
  - /url: /privacy
- region "Notifications alt+T"
- dialog "Session Expired":
  - heading "Session Expired" [level=2]
  - paragraph: Your authenticated session has expired. You can review and copy any unsaved drafts before re-authenticating.
  - button "Review Current Page"
  - button "Sign In Again"
  - button "Close"
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
> 36 |     await expect(page.getByRole('heading', { name: 'What kind of event is this?' })).toBeVisible();
     |                                                                                      ^ Error: expect(locator).toBeVisible() failed
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