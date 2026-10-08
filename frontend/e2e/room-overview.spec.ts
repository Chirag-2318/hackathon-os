import { test, expect } from '@playwright/test';

test.describe('Room Overview Page (S08)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the room overview page (assumes MSW is active)
    await page.goto('/app/room/r-1/overview');
  });

  test('renders clock strip and KPI tiles', async ({ page }) => {
    // Clock strip needle and flags
    await expect(page.locator('[data-slot="clock-strip"]')).toBeVisible();
    await expect(page.getByText('Freeze in 3h 20m')).toBeVisible();

    // KPI Tiles
    await expect(page.getByText('Submit in 9h 05m')).toBeVisible();
    
    await expect(page.getByText('Checkpoints').first()).toBeVisible();
    await expect(page.getByText('/ 7')).toBeVisible();

    await expect(page.getByText('Tasks open')).toBeVisible();
    await expect(page.getByText('18').first()).toBeVisible();

    // Dark Callout
    await expect(page.getByText('2 tasks are blocked')).toBeVisible();
    await expect(page.getByRole('button', { name: 'View blocked tasks' })).toBeVisible();
  });

  test('renders charts', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Progress vs plan' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Team Activity' })).toBeVisible();
  });

  test('renders tasks and team lists', async ({ page }) => {
    // Tasks list
    await expect(page.getByRole('heading', { name: 'My tasks' })).toBeVisible();
    // 6 tasks in fixture
    await expect(page.getByText('Setup repository')).toBeVisible();
    await expect(page.getByText('Build auth API')).toBeVisible();

    // Team members list
    await expect(page.getByRole('heading', { name: 'Team', exact: true })).toBeVisible();
    await expect(page.getByText('Aarav Mehta')).toBeVisible();
    await expect(page.getByText('Leader')).toBeVisible();
  });

  test('right rail shows countdown and checkpoints', async ({ page }) => {
    // Check week strip
    await expect(page.getByRole('heading', { name: 'Event Days' })).toBeVisible();
    
    // Check upcoming items
    await expect(page.getByRole('heading', { name: 'Upcoming Checkpoints' })).toBeVisible();
    await expect(page.getByText('Mid-point demo')).toBeVisible();
  });
});
