import { test, expect } from '@playwright/test';

test.describe('Create Room Wizard (S06)', () => {
  test('Standard Mode: 4 steps to create room', async ({ page }) => {
    await page.goto('/app/create-room');
    
    // Step 1: Event Details
    await expect(page.getByRole('heading', { name: 'What kind of event is this?' })).toBeVisible();
    await page.getByText('SIH-style hackathon').click();
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 2: Time
    await expect(page.getByRole('heading', { name: 'When does it happen?' })).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 3: Team
    await expect(page.getByRole('heading', { name: 'Set up your team' })).toBeVisible();
    await page.getByLabel('Room Name').fill('My Awesome Team');
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 4: Confirm
    await expect(page.getByRole('heading', { name: 'Review & Create' })).toBeVisible();
    await expect(page.getByText('My Awesome Team')).toBeVisible();
    
    // Submit
    await page.getByRole('button', { name: 'Create Room' }).click();
    
    // Check navigation to overview
    await expect(page).toHaveURL(/.*\/overview/);
  });

  test('Speed Mode: 2 steps with auto-suggested name', async ({ page }) => {
    await page.goto('/app/create-room?mode=speed');
    
    // Step 1: Event Details
    await expect(page.getByRole('heading', { name: 'What kind of event is this?' })).toBeVisible();
    await page.getByText('4-hour AI sprint').click();
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 2: Confirm (auto-skipped time and team)
    await expect(page.getByRole('heading', { name: 'Review & Create' })).toBeVisible();
    // Name should be auto-suggested
    await expect(page.getByText(/My room — /)).toBeVisible();
    
    // Submit
    await page.getByRole('button', { name: 'Create Room' }).click();
    
    // Check navigation to overview
    await expect(page).toHaveURL(/.*\/overview/);
  });
});
