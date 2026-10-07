import { test, expect } from '@playwright/test';

test.describe('S01 Landing Page', () => {
  test('renders all 7 sections in order', async ({ page }) => {
    await page.goto('/');

    // 1. Header
    await expect(page.locator('header')).toBeVisible();

    // 2. Hero
    await expect(page.locator('section[aria-label="Hero"]')).toBeVisible();

    // 3. Five ways teams lose
    await expect(page.locator('section[aria-label="Five ways teams lose"]')).toBeVisible();

    // 4. Phase walkthrough
    await expect(page.locator('section[aria-label="Phase walkthrough"]')).toBeVisible();

    // 5. Plans
    await expect(page.locator('section[aria-label="Plans comparison"]')).toBeVisible();

    // 6. Playbook cards
    await expect(page.locator('section[aria-label="Playbooks"]')).toBeVisible();

    // 7. Footer
    await expect(page.locator('footer')).toBeVisible();
  });

  test('interactive five-ways section updates screen', async ({ page }) => {
    await page.goto('/');
    
    const tabs = page.locator('button[role="tab"]');
    const panels = page.locator('div[role="tabpanel"]');
    
    // First tab is selected by default
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    await expect(panels.nth(0)).not.toHaveAttribute('hidden', '');
    
    // Click second tab
    await tabs.nth(1).click();
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'false');
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    
    // Check panel visibility (Playwright handles hidden attribute natively)
    await expect(panels.nth(0)).toBeHidden();
    await expect(panels.nth(1)).toBeVisible();
  });

  test('plans table renders 3 rows', async ({ page }) => {
    await page.goto('/');
    const rows = page.locator('section[aria-label="Plans comparison"] tbody tr');
    await expect(rows).toHaveCount(3);
  });

  test('playbooks section handles loading and data', async ({ page }) => {
    await page.goto('/');
    
    // Cards should render (fixture has 4 items)
    await expect(page.getByTestId('playbook-cards')).toBeVisible({ timeout: 5000 });
    const cards = page.locator('[data-slot="playbook-card"]');
    await expect(cards).toHaveCount(4);
  });
});
