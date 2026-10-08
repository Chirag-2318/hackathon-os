# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sign-in.spec.ts >> S02 Sign In Page >> displays error message correctly
- Location: e2e\sign-in.spec.ts:20:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('auth-error')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByTestId('auth-error') with timeout 5000ms
  - waiting for getByTestId('auth-error')

```

```yaml
- link "Skip to content":
  - /url: "#start-of-content"
- banner
- main:
  - img "HackOS logo"
  - paragraph:
    - text: Sign in to
    - strong: GitHub
    - text: to continue to
    - strong: HackOS
  - text: Username or email address
  - textbox "Username or email address"
  - text: Password
  - textbox "Password"
  - link "Forgot password?":
    - /url: /password_reset
  - button "Sign in"
  - text: or
  - button "Continue with Google":
    - img
    - text: Continue with Google
  - button "Continue with Apple":
    - img
    - text: Continue with Apple
  - paragraph:
    - text: New to GitHub?
    - link "Create an account":
      - /url: /join?return_to=%2Flogin%2Foauth%2Fauthorize%3Fclient_id%3DOv23lirnymliuq9bUNp7%26code_challenge%3D3auQn33CVLJ8a59gV9DAqalZMdiM4B5qMdAvMHQt-Yk%26code_challenge_method%3DS256%26redirect_uri%3Dhttp%253A%252F%252Flocalhost%253A8080%252Flogin%252Foauth2%252Fcode%252Fgithub%26response_type%3Dcode%26scope%3Dread%253Auser%26state%3Ddk5PpJKTkQ5i9--91OGl_7CC5qx0nOKpAxRXgTX1yTo%253D&source=oauth
  - paragraph:
    - button "Sign in with a passkey"
- contentinfo:
  - list:
    - listitem:
      - link "Terms":
        - /url: https://docs.github.com/site-policy/github-terms/github-terms-of-service
    - listitem:
      - link "Privacy":
        - /url: https://docs.github.com/site-policy/privacy-policies/github-privacy-statement
    - listitem:
      - link "Docs":
        - /url: https://docs.github.com
    - listitem:
      - link "Contact GitHub Support":
        - /url: https://support.github.com
    - listitem:
      - button "Manage cookies"
    - listitem:
      - button "Do not share my personal information"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('S02 Sign In Page', () => {
  4  |   test('renders split layout', async ({ page }) => {
  5  |     await page.goto('/signin');
  6  |     
  7  |     // Form panel
  8  |     await expect(page.getByTestId('btn-github')).toBeVisible();
  9  |     await expect(page.getByTestId('btn-google')).toBeVisible();
  10 |     
  11 |     // Illustration panel (hidden on mobile, visible on desktop)
  12 |     const illustration = page.locator('[data-slot="hero-panel"]');
  13 |     if (page.viewportSize()?.width && page.viewportSize()!.width >= 768) {
  14 |       await expect(illustration).toBeVisible();
  15 |     } else {
  16 |       await expect(illustration).toBeHidden();
  17 |     }
  18 |   });
  19 | 
  20 |   test('displays error message correctly', async ({ page }) => {
  21 |     // We can simulate an error by intercepting the network request 
  22 |     // or by setting a header that our MSW mock respects.
  23 |     await page.addInitScript(() => {
  24 |       const originalFetch = window.fetch;
  25 |       window.fetch = async (...args) => {
  26 |         if (typeof args[0] === 'string' && args[0].includes('/api/v1/auth/github')) {
  27 |           return new Response(JSON.stringify({ success: false, error: 'Authentication failed. Please try again.' }), {
  28 |             status: 401,
  29 |             headers: { 'Content-Type': 'application/json' }
  30 |           });
  31 |         }
  32 |         return originalFetch(...args);
  33 |       };
  34 |     });
  35 | 
  36 |     await page.goto('/signin');
  37 |     await page.getByTestId('btn-github').click();
  38 |     
  39 |     const errorAlert = page.getByTestId('auth-error');
> 40 |     await expect(errorAlert).toBeVisible({ timeout: 5000 });
     |                              ^ Error: expect(locator).toBeVisible() failed
  41 |     
  42 |     // Check accessibility attributes
  43 |     await expect(errorAlert).toHaveAttribute('role', 'alert');
  44 |     await expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
  45 |   });
  46 | 
  47 |   test('successful login navigates away', async ({ page }) => {
  48 |     await page.goto('/signin');
  49 |     await page.getByTestId('btn-github').click();
  50 |     
  51 |     // Should navigate to POST_AUTH route (which is /app)
  52 |     await expect(page).toHaveURL(/\/app/, { timeout: 5000 });
  53 |   });
  54 | });
  55 | 
```