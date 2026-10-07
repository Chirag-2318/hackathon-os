import { test, expect } from '@playwright/test';

test.describe('Home Page (S07)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the home page (assumes MSW is active)
    await page.goto('/app/home');
  });

  test('renders greeting and date chip', async ({ page }) => {
    await expect(page.getByText('Good morning,')).toBeVisible();
    await expect(page.getByText('Aarav Mehta')).toBeVisible();
  });

  test('shows urgent room feature cards', async ({ page }) => {
    // There should be 2 feature cards (Campus Build Sprint 2026 and Internal Round)
    await expect(page.getByRole('heading', { name: 'Campus Build Sprint 2026' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Internal Round: Software Edition' })).toBeVisible();
  });

  test('filters room list', async ({ page }) => {
    // Check initial state (Active filter)
    await expect(page.getByRole('heading', { name: "Rooms you're in" })).toBeVisible();
    // Since MSW fixture sets both to "Active", they should be visible
    const rows = page.locator('[data-slot="list-row"]');
    await expect(rows).toHaveCount(2);

    // Change filter to Completed
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Completed' }).click();

    // Check empty state
    await expect(page.getByText('No rooms match these filters.')).toBeVisible();

    // Clear filters
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(rows).toHaveCount(2);
  });

  test('right rail shows countdown and week strip', async ({ page }) => {
    // Check right rail HeroPanel countdown
    await expect(page.getByText('until submission')).toBeVisible();

    // Check week strip
    await expect(page.getByRole('heading', { name: 'This week' })).toBeVisible();
    await expect(page.locator('[data-slot="week-strip"]')).toBeVisible();

    // Check upcoming items
    await expect(page.getByRole('heading', { name: 'Upcoming' })).toBeVisible();
    await expect(page.getByText('Freeze')).toBeVisible();
  });

  test('navigates to room overview on card click', async ({ page }) => {
    await page.getByRole('heading', { name: 'Campus Build Sprint 2026' }).click();
    await expect(page).toHaveURL(/\/app\/room\/r-1\/overview/);
  });
});
