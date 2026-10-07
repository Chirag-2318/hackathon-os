import { test, expect } from '@playwright/test';

test.describe('S10: Team Screen', () => {
  test('renders Team layout components with mock data', async ({ page }) => {
    await page.goto('/app/room/r-1/team');

    // Wait for data load
    await expect(page.locator('h2', { hasText: 'Members' })).toBeVisible();

    // Member list rendering
    await expect(page.locator('text=Aarav Mehta').first()).toBeVisible();
    await expect(page.locator('text=Ishita Rao').first()).toBeVisible();

    // Center column details
    await expect(page.locator('text=aarav@example.com')).toBeVisible();
    await expect(page.locator('text=@aaravm')).toBeVisible();

    // Right column features
    await expect(page.locator('text=Skill Gap Radar')).toBeVisible();
    await expect(page.locator('text=Team Health')).toBeVisible();
    await expect(page.locator('text=Team Charter')).toBeVisible();
    
    // Rescuer alert check (Aarav has 65%)
    await expect(page.locator('text=Rescuer alert')).toBeVisible();
    await expect(page.locator('text=65%')).toBeVisible();

    // Invite button
    const inviteBtn = page.locator('button', { hasText: 'Invite' });
    await expect(inviteBtn).toBeVisible();
  });
});
