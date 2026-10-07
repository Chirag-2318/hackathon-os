import { test, expect } from '@playwright/test';

test.describe('Situation Picker (S05)', () => {
  test('should display three options and navigate correctly', async ({ page }) => {
    await page.goto('/app/situation');
    
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

    // Check cards
    const cards = page.locator('[data-slot="situation-card"]');
    await expect(cards).toHaveCount(3);

    // Click "Just exploring"
    await page.getByText('Just exploring').click();
    
    // Check continue button is enabled and works
    const continueBtn = page.getByRole('button', { name: 'Continue' });
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();
    
    await expect(page).toHaveURL(/.*\/playbooks/);
  });
});
