import { test, expect } from '@playwright/test';

test.describe('Phase 3a: Ideation Board (S11)', () => {
  test('navigates through all seven ideation stages', async ({ page }) => {
    // 1. Visit an existing room and go to Ideate
    await page.goto('/app/room/r-1/ideate');

    // Wait for mock data
    await expect(page.getByText('Your ideas')).toBeVisible();

    // 2. Solo Stage
    await expect(page.getByText('Private until reveal')).toBeVisible();
    await expect(page.getByText('Idea Editor')).toBeVisible();

    // Leader action: Advance
    await page.getByRole('button', { name: 'Advance Stage' }).click();

    // 3. Reveal Stage
    await expect(page.getByText('Reveal Ideas (M04)')).toBeVisible();
    await expect(page.getByText('Anonymous Mode')).toBeVisible();
    // Reveal action
    await page.getByRole('button', { name: 'Reveal Ideas (M04)' }).click();
    await expect(page.getByRole('button', { name: 'Revealed' })).toBeVisible();

    // Leader action: Advance
    await page.getByRole('button', { name: 'Advance Stage' }).click();

    // 4. Research Stage
    await expect(page.getByText('Research Ideas')).toBeVisible();
    await expect(page.getByText('Talked to a real user')).toBeVisible();

    // Leader action: Advance
    await page.getByRole('button', { name: 'Advance Stage' }).click();

    // 5. Critique Stage
    await expect(page.getByText('Critique Matrix (C15)')).toBeVisible();
    await expect(page.getByText('Rubric Fit')).toBeVisible();

    // Leader action: Advance
    await page.getByRole('button', { name: 'Advance Stage' }).click();

    // 6. Stress Test Stage
    await expect(page.getByText('Stress Test')).toBeVisible();
    await expect(page.getByText('AI Stress Test Analysis')).toBeVisible();

    // Leader action: Advance
    await page.getByRole('button', { name: 'Advance Stage' }).click();

    // 7. Vote Stage
    await expect(page.getByText('Vote on the best idea')).toBeVisible();
    await expect(page.getByText('Submit Vote')).toBeVisible();
    // Close voting
    await page.getByRole('button', { name: 'Close Voting (Leader)' }).click();
    await expect(page.getByText('Open Voting')).toBeVisible(); // State changed

    // Leader action: Advance
    await page.getByRole('button', { name: 'Advance Stage' }).click();

    // 8. Decide Stage
    await expect(page.getByText('Lock the decision')).toBeVisible();
    await expect(page.getByText('Time to decide')).toBeVisible();
    
    // Lock idea
    await page.getByRole('button', { name: 'Lock Idea' }).click();
    
    // Wait for animation mock (1200ms)
    await page.waitForTimeout(1500);
    await expect(page.getByRole('button', { name: 'Continue to Plan' })).toBeVisible();
    
    // 9. Continue to next phase (S12 Plan Placeholder)
    await page.getByRole('button', { name: 'Continue to Plan' }).click();
    await expect(page).toHaveURL(/\/app\/room\/r-1\/plan/);
  });
});
