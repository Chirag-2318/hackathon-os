import { test, expect } from '@playwright/test';

test.use({
  viewport: { width: 1534, height: 729 },
  deviceScaleFactor: 1.25,
});

test.describe('Playbooks Page (Round 3)', () => {
  test('Playbooks shows its own breadcrumb and no second site navbar', async ({ page }) => {
    await page.goto('/app/playbooks');
    await page.waitForLoadState('networkidle');

    // Breadcrumb contains "Playbooks"
    const breadcrumb = page.getByTestId('header-breadcrumb');
    await expect(breadcrumb).toContainText('Playbooks');

    // Inside panel there is no link named "Start a room" and no text "Pricing"
    const panel = page.getByTestId('panel');
    await expect(panel.getByRole('link', { name: 'Start a room' })).toHaveCount(0);
    await expect(panel.getByText('Pricing')).toHaveCount(0);
  });

  test('Playbooks title, subtitle and cards share the breadcrumb left edge', async ({ page }) => {
    await page.goto('/app/playbooks');
    await page.waitForLoadState('networkidle');

    const breadcrumb = page.getByTestId('header-breadcrumb');
    const title = page.getByTestId('pb-title');
    const firstCard = page.locator('[data-testid^="pb-card-"]').first();

    await expect(title).toBeVisible();
    await expect(firstCard).toBeVisible();

    const bcBox = await breadcrumb.boundingBox();
    const titleBox = await title.boundingBox();
    const cardBox = await firstCard.boundingBox();

    expect(bcBox).toBeTruthy();
    expect(titleBox).toBeTruthy();
    expect(cardBox).toBeTruthy();

    expect(Math.abs(bcBox!.x - titleBox!.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(titleBox!.x - cardBox!.x)).toBeLessThanOrEqual(1);
  });

  test('Playbook cards are flat and fully visible', async ({ page }) => {
    await page.goto('/app/playbooks');
    await page.waitForLoadState('networkidle');

    const grid = page.getByTestId('pb-grid');
    await expect(grid).toBeVisible();
    const gridBox = await grid.boundingBox();
    expect(gridBox).toBeTruthy();

    const cards = page.locator('[data-testid^="pb-card-"]');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const b = await card.boundingBox();
      expect(b).toBeTruthy();

      // Check height between 112 and 180
      expect(b!.height).toBeGreaterThanOrEqual(112);
      expect(b!.height).toBeLessThanOrEqual(180);

      // Card right edge not past grid container right edge (+0.5px)
      expect(b!.x + b!.width).toBeLessThanOrEqual(gridBox!.x + gridBox!.width + 0.5);

      // Computed box-shadow is none
      const shadow = await card.evaluate((el) => window.getComputedStyle(el).boxShadow);
      expect(shadow).toBe('none');
    }
  });

  test('Playbook filters narrow the grid and Clear restores it', async ({ page }) => {
    await page.goto('/app/playbooks');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('[data-testid^="pb-card-"]');
    await expect(cards.first()).toBeVisible();
    const totalCount = await cards.count();
    expect(totalCount).toBeGreaterThan(0);

    // Initial count display
    const countDisplay = page.getByTestId('pb-count');
    await expect(countDisplay).toHaveText(`${totalCount} playbooks`);

    // 1. Search text filter
    const searchInput = page.getByTestId('pb-search');
    await searchInput.fill('sprint');
    const filteredCount = await cards.count();
    expect(filteredCount).toBeLessThan(totalCount);
    expect(filteredCount).toBeGreaterThan(0);
    await expect(countDisplay).toHaveText(`${filteredCount} playbook`);

    // 2. Clear button restores it
    const clearBtn = page.getByTestId('pb-clear');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    await expect(cards).toHaveCount(totalCount);
    await expect(clearBtn).toBeHidden();

    // 3. Type filter
    const typeSelect = page.getByTestId('pb-filter-type');
    await typeSelect.click();
    await page.getByRole('option', { name: '36-hour team' }).click();
    const typeCount = await cards.count();
    expect(typeCount).toBeLessThan(totalCount);
    expect(typeCount).toBeGreaterThan(0);

    // Clear filters again
    await page.getByTestId('pb-clear').click();
    await expect(cards).toHaveCount(totalCount);

    // 4. No-match search produces EmptyState
    await searchInput.fill('nonexistent-query-xyz');
    await expect(cards).toHaveCount(0);
    await expect(page.getByText('No playbooks match')).toBeVisible();
    await expect(page.getByText('Try a different search or clear the filters.')).toBeVisible();

    // Clicking action inside EmptyState clears filters
    await page.getByTestId('pb-empty-clear').click();
    await expect(cards).toHaveCount(totalCount);
  });
});
