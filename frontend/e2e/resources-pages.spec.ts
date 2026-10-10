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

  test('Clicking a playbook card opens the detail dialog and sets ?playbook=<id>', async ({ page }) => {
    await page.goto('/app/playbooks');
    await page.waitForLoadState('networkidle');

    const firstCard = page.locator('[data-testid^="pb-card-"]').first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    await expect(page).toHaveURL(/.*[?&]playbook=[^&]+/);
    const dialog = page.getByTestId('pb-dialog');
    await expect(dialog).toBeVisible();

    // Close button dismisses dialog and clears param
    const closeBtn = page.getByTestId('pb-dialog-close');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(dialog).toBeHidden();
    expect(page.url()).not.toContain('playbook=');
  });

  test('Back button closes dialog and reload with param opens it directly', async ({ page }) => {
    await page.goto('/app/playbooks');
    await page.waitForLoadState('networkidle');

    const firstCard = page.locator('[data-testid^="pb-card-"]').first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    const dialog = page.getByTestId('pb-dialog');
    await expect(dialog).toBeVisible();

    // Browser back button
    await page.goBack();
    await expect(dialog).toBeHidden();
    expect(page.url()).not.toContain('playbook=');

    // Direct navigation with param
    await page.goto('/app/playbooks?playbook=pb-sih');
    await page.waitForLoadState('networkidle');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('SIH-style hackathon');
  });

  test('Use this playbook button closes playbook dialog and opens Create Room dialog with template preselected', async ({ page }) => {
    await page.goto('/app/playbooks?playbook=pb-devpost');
    await page.waitForLoadState('networkidle');

    const pbDialog = page.getByTestId('pb-dialog');
    await expect(pbDialog).toBeVisible();

    const useBtn = page.getByTestId('pb-use');
    await expect(useBtn).toBeVisible();
    await useBtn.click();

    // Playbook dialog should close
    await expect(pbDialog).toBeHidden();

    // Create room dialog should open
    const createRoomHeading = page.getByRole('heading', { name: 'Create a room' });
    await expect(createRoomHeading).toBeVisible();

    // Devpost template radio should be checked
    const devpostRadio = page.locator('[role="radio"][aria-checked="true"]');
    await expect(devpostRadio).toBeVisible();
    await expect(devpostRadio).toContainText('Devpost');
  });
});

test.describe('Tool Directory Page (Round 3)', () => {
  test('Category filter chips narrow the grid and active chip toggle returns to All', async ({ page }) => {
    await page.goto('/app/tools');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('[data-testid^="tool-card-"]');
    await expect(cards.first()).toBeVisible();
    const totalCount = await cards.count();
    expect(totalCount).toBeGreaterThan(0);

    // Click "Recording" chip
    const recordingChip = page.getByTestId('tools-categories').getByRole('button', { name: /^Recording/ });
    await expect(recordingChip).toBeVisible();
    await recordingChip.click();

    // Cards narrowed
    const recordingCount = await cards.count();
    expect(recordingCount).toBeLessThan(totalCount);
    expect(recordingCount).toBeGreaterThan(0);

    // Clicking it again toggles back to All
    await recordingChip.click();
    await expect(cards).toHaveCount(totalCount);
  });

  test('Category callout appears for specific category and disappears on All', async ({ page }) => {
    await page.goto('/app/tools');
    await page.waitForLoadState('networkidle');

    // On initial load (All), callout is absent
    const callout = page.getByTestId('tools-cat-callout');
    await expect(callout).toHaveCount(0);

    // Select "Video" chip
    const videoChip = page.getByTestId('tools-categories').getByRole('button', { name: /^Video/ });
    await videoChip.click();

    await expect(callout).toBeVisible();
    await expect(callout).toContainText('Video');
    await expect(callout).toContainText('rehearsal');

    // Select "All" chip
    const allChip = page.getByTestId('tools-categories').getByRole('button', { name: /^All/ });
    await allChip.click();
    await expect(callout).toHaveCount(0);
  });

  test('Tool card clicks open external URL in new tab', async ({ page }) => {
    await page.goto('/app/tools');
    await page.waitForLoadState('networkidle');

    const firstCard = page.locator('[data-testid^="tool-card-"]').first();
    await expect(firstCard).toBeVisible();

    await expect(firstCard).toHaveAttribute('target', '_blank');
    await expect(firstCard).toHaveAttribute('rel', 'noopener noreferrer');
    const href = await firstCard.getAttribute('href');
    expect(href).toMatch(/^https?:\/\//);
  });

  test('Search input filters tool cards by name or description', async ({ page }) => {
    await page.goto('/app/tools');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('[data-testid^="tool-card-"]');
    await expect(cards.first()).toBeVisible();
    const totalCount = await cards.count();

    const searchInput = page.getByTestId('tools-search');
    await searchInput.fill('Figma');

    await expect(cards).toHaveCount(1);
    await expect(page.getByTestId('tool-card-t5')).toBeVisible();

    // Clear search
    await page.getByTestId('tools-clear').click();
    await expect(cards).toHaveCount(totalCount);
  });

  test('Cost, License, and Verified filters narrow the grid, update count and Clear restores', async ({ page }) => {
    await page.goto('/app/tools');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('[data-testid^="tool-card-"]');
    await expect(cards.first()).toBeVisible();
    const totalCount = await cards.count();

    // Cost filter: Free
    const costSelect = page.getByTestId('tools-filter-cost');
    await costSelect.click();
    await page.getByRole('option', { name: 'Free', exact: true }).click();

    const freeCount = await cards.count();
    expect(freeCount).toBeLessThan(totalCount);
    expect(freeCount).toBeGreaterThan(0);

    // Verified only filter toggle
    const verifiedBtn = page.getByTestId('tools-filter-verified');
    await verifiedBtn.click();

    // Clear restores all
    const clearBtn = page.getByTestId('tools-clear');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    await expect(cards).toHaveCount(totalCount);
  });
});


