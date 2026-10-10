import { test, expect } from '@playwright/test';

test.use({
  viewport: { width: 1534, height: 729 },
  deviceScaleFactor: 1.25,
});

test.describe('Regression Baseline (Round 3)', () => {
  test('Home page baseline', async ({ page }) => {
    await page.goto('/app/home');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('home-baseline.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.002,
      mask: [
        page.locator('[data-testid="footer-clock"]'),
        page.locator('[data-testid="home-date-pill"]'),
        page.locator('[data-testid="home-greeting"]'),
      ],
    });
  });

  test('My rooms page baseline', async ({ page }) => {
    await page.goto('/app/rooms');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('my-rooms-baseline.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.002,
      mask: [
        page.locator('[data-testid="footer-clock"]'),
      ],
    });
  });

  test('Room Overview tab baseline', async ({ page }) => {
    await page.goto('/app/room/r-1/overview');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('room-overview-baseline.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.002,
      mask: [
        page.locator('[data-testid="footer-clock"]'),
      ],
    });
  });

  test('Create Room dialog baseline (from My rooms)', async ({ page }) => {
    await page.goto('/app/rooms');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'New room' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await expect(page).toHaveScreenshot('create-room-dialog-baseline.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.002,
      mask: [
        page.locator('[data-testid="footer-clock"]'),
        page.locator('[data-testid="create-room-date-btn"]'),
      ],
    });
  });
});
