import { test, expect } from '@playwright/test';

test.describe('Phase 3b: Plan (Prompt Bridge) & Docs Vault', () => {
  const roomId = '00000000-0000-0000-0000-000000000001'; // test-fixture-id

  test.beforeEach(async ({ page }) => {
    // Navigate directly to the Plan page
    await page.goto(`/app/room/${roomId}/plan`);
    // Wait for MSW mocks to resolve
    await page.waitForLoadState('networkidle');
  });

  test('should render the Plan page and navigate through prompt bridge', async ({ page }) => {
    // Verify Stepper is present
    await expect(page.getByText('PRD & MVP', { exact: true })).toBeVisible();
    await expect(page.getByText('Tech stack and architecture')).toBeVisible();

    // Verify right rail Context pack
    await expect(page.getByText('Context pack')).toBeVisible();

    // Step 1: Copy and paste
    await expect(page.getByText('Copy this prompt')).toBeVisible();
    await page.getByPlaceholder('Paste the generated response here...').fill('Here is the PRD and MVP.');
    
    // Validate Step 1 (Pass)
    await page.getByRole('button', { name: 'Validate' }).click();
    await expect(page.getByText('Validation Passed')).toBeVisible();

    // Should move to Step 2 (Tech stack)
    await expect(page.getByRole('heading', { name: 'Step 2: Tech stack and architecture' })).toBeVisible();

    // Force Fail on Step 2
    // Our mock checks for a specific header or we can just mock the fail condition.
    // For now, let's inject a header to force failure
    await page.route('**/api/v1/rooms/*/plan/validate', async (route) => {
      const headers = route.request().headers();
      headers['x-test-force-error'] = 'true';
      route.continue({ headers });
    });

    await page.getByPlaceholder('Paste the generated response here...').fill('Here is the Tech Stack.');
    await page.getByRole('button', { name: 'Validate' }).click();
    
    // Should show validation failed
    await expect(page.getByText('Validation Failed')).toBeVisible();
    await expect(page.getByText('Missing user roles')).toBeVisible();
    await expect(page.getByText('Missing offline fallback')).toBeVisible();
    
    // Reset route for success
    await page.unroute('**/api/v1/rooms/*/plan/validate');
    await page.getByRole('button', { name: 'Validate' }).click();
    await expect(page.getByText('Validation Passed')).toBeVisible();

    // Mock skipping to Step 5 (for brevity in E2E)
    // In a real e2e, we would loop through all steps. Let's just do one more to simulate completion.
    // For this test we can just manually advance all the steps.
    for (let i = 3; i <= 5; i++) {
      await page.getByPlaceholder('Paste the generated response here...').fill(`Answer for step ${i}`);
      await page.getByRole('button', { name: 'Validate' }).click();
      await expect(page.getByText('Validation Passed')).toBeVisible();
    }

    // Step 6: Review and Lock
    await expect(page.getByRole('heading', { name: 'Review your plan' })).toBeVisible();
    await expect(page.getByText('PRD.md')).toBeVisible();
    
    // Lock Plan
    await page.getByRole('button', { name: 'Lock plan' }).click();
    
    // Wait for animation and success seal
    await expect(page.getByText('Plan Locked')).toBeVisible();

    // Navigate to Docs Vault
    await page.getByRole('button', { name: 'Go to Docs Vault' }).click();
    
    // Wait for Docs page to load
    await expect(page.getByRole('heading', { name: 'Docs Vault' })).toBeVisible();
    
    // Verify file tree
    await expect(page.getByText('PRD.md', { exact: true })).toBeVisible();
    await expect(page.getByText('TECH_STACK.md', { exact: true })).toBeVisible();

    // Select a file
    await page.getByText('TECH_STACK.md').click();
    
    // Verify editor shows the file content
    await expect(page.locator('textarea')).toHaveValue('# Tech Stack\n\nFrontend: React\nBackend: Node.js');
    
    // Verify Meta pane
    await expect(page.getByText('Edited by Aarav Mehta')).toBeVisible();
  });
});
