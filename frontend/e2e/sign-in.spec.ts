import { test, expect } from '@playwright/test';

test.describe('S02 Sign In Page', () => {
  test('renders split layout', async ({ page }) => {
    await page.goto('/signin');
    
    // Form panel
    await expect(page.getByTestId('btn-github')).toBeVisible();
    await expect(page.getByTestId('btn-google')).toBeVisible();
    
    // Illustration panel (hidden on mobile, visible on desktop)
    const illustration = page.locator('[data-slot="hero-panel"]');
    if (page.viewportSize()?.width && page.viewportSize()!.width >= 768) {
      await expect(illustration).toBeVisible();
    } else {
      await expect(illustration).toBeHidden();
    }
  });

  test('displays error message correctly', async ({ page }) => {
    // We can simulate an error by intercepting the network request 
    // or by setting a header that our MSW mock respects.
    await page.addInitScript(() => {
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        if (typeof args[0] === 'string' && args[0].includes('/api/v1/auth/github')) {
          return new Response(JSON.stringify({ success: false, error: 'Authentication failed. Please try again.' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return originalFetch(...args);
      };
    });

    await page.goto('/signin');
    await page.getByTestId('btn-github').click();
    
    const errorAlert = page.getByTestId('auth-error');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
    
    // Check accessibility attributes
    await expect(errorAlert).toHaveAttribute('role', 'alert');
    await expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
  });

  test('successful login navigates away', async ({ page }) => {
    await page.goto('/signin');
    await page.getByTestId('btn-github').click();
    
    // Should navigate to POST_AUTH route (which is /app)
    await expect(page).toHaveURL(/\/app/, { timeout: 5000 });
  });
});
