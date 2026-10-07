import { test, expect } from '@playwright/test';

test.describe('Playbooks Browse (S04)', () => {
  test('should display playbooks and filter correctly', async ({ page }) => {
    await page.goto('/playbooks');
    
    // Check header
    await expect(page.getByRole('heading', { name: 'Playbook Templates' })).toBeVisible();

    // The grid should show playbook cards
    const cards = page.locator('[data-slot="playbook-card"]');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // Test filters
    await page.getByRole('combobox').first().click(); // Open Type filter
    await page.getByRole('option', { name: '36-hour team' }).click();

    // Check that cards are filtered
    const filteredCount = await cards.count();
    expect(filteredCount).toBeLessThan(count);
    expect(filteredCount).toBeGreaterThan(0);

    // Test clear filters
    await page.getByRole('button', { name: /Remove filter/i }).first().click();
    
    // Should be back to full count
    const restoredCount = await cards.count();
    expect(restoredCount).toBe(count);
  });

  test('should navigate to detail page on click', async ({ page }) => {
    await page.goto('/playbooks');
    
    const cards = page.locator('[data-slot="playbook-card"]');
    await cards.first().click();

    // Verify detail page
    await expect(page.getByRole('link', { name: /Use this playbook/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Judging Criteria' })).toBeVisible();
  });
});
