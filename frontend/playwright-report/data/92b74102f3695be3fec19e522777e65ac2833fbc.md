# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: invite.spec.ts >> S03 Invite Landing Page >> expired invite shows correct message
- Location: e2e\invite.spec.ts:31:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('invite-expired')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByTestId('invite-expired') with timeout 5000ms
  - waiting for getByTestId('invite-expired')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { VALID_INVITE_TOKEN } from '../src/mocks/fixtures';
  3  | 
  4  | test.describe('S03 Invite Landing Page', () => {
  5  |   test('valid invite shows complete card', async ({ page }) => {
  6  |     await page.goto(`/invite/${VALID_INVITE_TOKEN}`);
  7  |     
  8  |     // Skeleton should show first
  9  |     await expect(page.getByTestId('invite-skeleton')).toBeVisible();
  10 |     
  11 |     // Then the card loads
  12 |     const card = page.getByTestId('invite-card');
  13 |     await expect(card).toBeVisible({ timeout: 5000 });
  14 |     
  15 |     // Check elements are present
  16 |     await expect(page.getByTestId('invite-event')).toBeVisible();
  17 |     await expect(page.getByTestId('invite-leader')).toBeVisible();
  18 |     await expect(page.getByTestId('invite-roles')).toBeVisible();
  19 |     await expect(page.getByTestId('invite-members')).toBeVisible();
  20 |     
  21 |     const joinBtn = page.getByTestId('btn-join-room');
  22 |     await expect(joinBtn).toBeDisabled();
  23 |     
  24 |     // Select role to enable join
  25 |     await page.getByTestId('join-role-select').click();
  26 |     await page.getByRole('option').first().click();
  27 |     
  28 |     await expect(joinBtn).toBeEnabled();
  29 |   });
  30 | 
  31 |   test('expired invite shows correct message', async ({ page }) => {
  32 |     await page.goto('/invite/expired-or-invalid-token');
  33 |     
  34 |     const expiredView = page.getByTestId('invite-expired');
> 35 |     await expect(expiredView).toBeVisible({ timeout: 5000 });
     |                               ^ Error: expect(locator).toBeVisible() failed
  36 |     
  37 |     // Verify verbatim copy
  38 |     await expect(expiredView).toContainText('Ask the leader for a new link');
  39 |   });
  40 | 
  41 |   test('successful join navigates away', async ({ page }) => {
  42 |     await page.goto(`/invite/${VALID_INVITE_TOKEN}`);
  43 |     await expect(page.getByTestId('invite-card')).toBeVisible({ timeout: 5000 });
  44 |     
  45 |     await page.getByTestId('join-role-select').click();
  46 |     await page.getByRole('option').first().click();
  47 |     await page.getByTestId('btn-join-room').click();
  48 |     
  49 |     // Should navigate to POST_JOIN route (which is /app)
  50 |     await expect(page).toHaveURL(/\/app/, { timeout: 5000 });
  51 |   });
  52 | });
  53 | 
```