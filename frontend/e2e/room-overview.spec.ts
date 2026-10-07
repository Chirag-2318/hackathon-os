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
    await expect(page.getByText('Time left')).toBeVisible();
    await expect(page.getByText('09:05')).toBeVisible();
    
    await expect(page.getByText('Checkpoints passed')).toBeVisible();
    await expect(page.getByText('3/7')).toBeVisible();

    await expect(page.getByText('Tasks open')).toBeVisible();
    await expect(page.getByText('18')).toBeVisible();

    // Dark Callout
    await expect(page.getByText('2 tasks are blocked.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Assign owners' })).toBeVisible();
  });

  test('renders charts', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Progress vs. Plan' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Team Activity' })).toBeVisible();
  });

  test('renders tasks and team lists', async ({ page }) => {
    // Tasks list
    await expect(page.getByRole('heading', { name: 'My tasks' })).toBeVisible();
    // 6 tasks in fixture
    await expect(page.getByText('Setup repository')).toBeVisible();
    await expect(page.getByText('Build auth API')).toBeVisible();

    // Team members list
    await expect(page.getByRole('heading', { name: 'Team' })).toBeVisible();
    await expect(page.getByText('Aarav Mehta')).toBeVisible();
    await expect(page.getByText('Leader')).toBeVisible();
  });

  test('right rail shows countdown and checkpoints', async ({ page }) => {
    // Check right rail HeroPanel countdown
    await expect(page.getByText('until submission')).toBeVisible();

    // Check week strip
    await expect(page.getByRole('heading', { name: 'Event Days' })).toBeVisible();
    
    // Check upcoming items
    await expect(page.getByRole('heading', { name: 'Upcoming Checkpoints' })).toBeVisible();
    await expect(page.getByText('Mid-point demo')).toBeVisible();
  });
});
