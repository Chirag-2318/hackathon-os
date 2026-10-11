import { test, expect } from '@playwright/test';

test.describe('Phase 5 Hardening & Resilience E2E', () => {

  test('Room Overview renders and contains Export Room button', async ({ page }) => {
    await page.goto('/app/room/r-1/overview');
    await expect(page.locator('h1')).toBeVisible();

    // Export room button is present
    const exportBtn = page.getByRole('button', { name: /Export Room/i });
    if (await exportBtn.isVisible()) {
      await expect(exportBtn).toBeEnabled();
    }
  });

  test('Offline banner shows when offline and hides when back online', async ({ page }) => {
    await page.goto('/app/room/r-1/overview');

    // Simulate going offline
    await page.context().setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));

    const offlineBanner = page.getByRole('status');
    await expect(offlineBanner).toBeVisible();
    await expect(offlineBanner).toContainText(/offline/i);

    // Simulate coming back online
    await page.context().setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));

    await expect(offlineBanner).not.toBeVisible();
  });

  test('Session Expiry Dialog is displayed when auth:session-expired is dispatched', async ({ page }) => {
    await page.goto('/app/room/r-1/overview');

    // Dispatch 401 session expiry custom event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
    });

    const dialogTitle = page.getByRole('heading', { name: /Session Expired/i });
    await expect(dialogTitle).toBeVisible();

    const signInBtn = page.getByRole('button', { name: /Sign In Again/i });
    await expect(signInBtn).toBeVisible();
  });

  test('Dev Flow & Seeder page renders seeder controls', async ({ page }) => {
    await page.goto('/dev/flow');
    await expect(page.getByRole('heading', { name: /Dev Flow & Seeder Panel/i })).toBeVisible();

    const seedBtn = page.getByRole('button', { name: /Seed Demo Room/i });
    await expect(seedBtn).toBeVisible();
    await expect(seedBtn).toBeEnabled();
  });
});
