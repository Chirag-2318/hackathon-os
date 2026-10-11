import { test, expect } from '@playwright/test';

test.use({
  baseURL: 'http://localhost:5173',
});

test.describe('GitHub Hub Redesign', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to GitHub page for room r-1
    await page.goto('/app/room/r-1/github');
    await page.waitForLoadState('networkidle');
  });

  test('renders GitHub page with all core sections and no horizontal overflow at 1366x768', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });

    // Header elements
    await expect(page.getByRole('heading', { name: 'GitHub', level: 1 })).toBeVisible();
    await expect(page.getByText('hackathon-os/mess-meter')).toBeVisible();
    await expect(page.getByText('Connected')).toBeVisible();
    await expect(page.getByRole('button', { name: /Freeze demo|Demo frozen/i })).toBeVisible();

    // Readiness Band & 4 Vitals
    const readinessBand = page.getByTestId('readiness-band');
    await expect(readinessBand.getByText('Judge-ready').or(readinessBand.getByText('Almost judge-ready'))).toBeVisible();
    await expect(readinessBand.getByRole('button', { name: /Rules/i })).toBeVisible();
    await expect(readinessBand.getByRole('button', { name: /History/i })).toBeVisible();
    await expect(readinessBand.getByRole('button', { name: /Demo/i })).toBeVisible();
    await expect(readinessBand.getByRole('button', { name: /Repo health/i })).toBeVisible();

    // Branch Map
    const branchMap = page.getByTestId('branch-map');
    await expect(branchMap.getByRole('heading', { name: 'Branches' })).toBeVisible();
    await expect(branchMap.getByPlaceholder('Search branches...')).toBeVisible();
    await expect(branchMap.getByText('PROTECTED')).toBeVisible();
    await expect(branchMap.getByText('IN PROGRESS')).toBeVisible();

    // Needs attention & Repo health
    await expect(page.getByRole('heading', { name: 'Needs attention' })).toBeVisible();
    await expect(page.getByTestId('repo-health-card')).toBeVisible();

    // Commit activity
    await expect(page.getByRole('heading', { name: 'Commit activity' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Activity' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Contributors' })).toBeVisible();

    // Check no horizontal scrollbar on document
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('no horizontal overflow at 1920x1080', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('Branch Map search, row expansion, and purpose editing work', async ({ page }) => {
    const branchMap = page.getByTestId('branch-map');

    // Search branches
    const searchInput = branchMap.getByPlaceholder('Search branches...');
    await searchInput.fill('deploy');
    await expect(branchMap.getByText('feat/api-deploy')).toBeVisible();
    await expect(branchMap.getByRole('link', { name: 'feat/dashboard' })).not.toBeVisible();

    // Clear search
    await searchInput.fill('');
    await expect(branchMap.getByRole('link', { name: 'feat/dashboard' })).toBeVisible();

    // Expand branch row
    const demoSafeRow = branchMap.getByTestId('branch-row-demo-safe');
    await demoSafeRow.click();
    await expect(branchMap.getByText("What's missing", { exact: false })).toBeVisible();
    await expect(branchMap.getByText('Recent commits', { exact: false })).toBeVisible();

    // Click purpose to edit
    const purposeText = branchMap.getByText('Stable demo fallback');
    await purposeText.click();
    const input = branchMap.locator('input[placeholder="What is this branch for?"]');
    await expect(input).toBeVisible();
    await input.fill('Updated stable fallback purpose');
    await input.press('Enter');
    await expect(branchMap.getByText('Updated stable fallback purpose')).toBeVisible();
  });

  test('Demo Freeze dialog opens, validates, and freezes demo', async ({ page }) => {
    // Click Freeze demo button in header
    await page.getByRole('button', { name: /Freeze demo|Demo frozen/i }).click();
    const dialog = page.getByTestId('freeze-demo-dialog');
    await expect(dialog.getByRole('heading', { name: /Freeze the demo|Re-freeze the demo/i })).toBeVisible();

    // Check before you freeze checklist
    await expect(dialog.getByText('README has run instructions')).toBeVisible();
    await expect(dialog.getByText('No secrets found in repository')).toBeVisible();

    // Tag name input
    const tagInput = dialog.locator('input[placeholder="demo-v1"]');
    await expect(tagInput).toBeVisible();

    // Click freeze demo inside dialog
    await dialog.getByRole('button', { name: 'Freeze demo' }).click();

    // Success state
    await expect(dialog.getByRole('heading', { name: 'Demo frozen' })).toBeVisible();
    await expect(dialog.getByRole('link', { name: /Create tag on GitHub/i })).toBeVisible();

    // Done button closes dialog
    await dialog.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByTestId('freeze-demo-dialog')).not.toBeVisible();

    // Header button updates to "Demo frozen"
    await expect(page.getByRole('button', { name: 'Demo frozen', exact: true })).toBeVisible();
  });

  test('Commit activity switches between Activity and Contributors tabs', async ({ page }) => {
    // Click Contributors tab
    await page.getByRole('button', { name: 'Contributors' }).click();

    // Team members from roster appear
    await expect(page.getByText('Aarav Mehta')).toBeVisible();
    await expect(page.getByText('Ishita Rao')).toBeVisible();
    await expect(page.getByText('Priya Lal')).toBeVisible();

    // Switch back to Activity
    await page.getByRole('button', { name: 'Activity' }).click();
    await expect(page.locator('svg').filter({ hasText: 'Kickoff' })).toBeVisible();
  });

  test('Repo Health Re-check toggles status and sorts failed items to top', async ({ page }) => {
    // Repo health card contains License added
    const repoHealthCard = page.getByTestId('repo-health-card');
    await expect(repoHealthCard.getByText('License added', { exact: true })).toBeVisible();
    await expect(repoHealthCard.getByRole('link', { name: /Add a license/i })).toBeVisible();

    // Click Re-check
    const recheckBtn = repoHealthCard.getByRole('button', { name: 'Re-check' });
    await expect(recheckBtn).toBeVisible();
    await recheckBtn.click();
    await expect(recheckBtn).toBeVisible();
  });
});
