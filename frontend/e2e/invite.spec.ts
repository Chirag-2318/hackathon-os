import { test, expect } from '@playwright/test';
import { VALID_INVITE_TOKEN } from '../src/mocks/fixtures';

test.describe('S03 Invite Landing Page', () => {
  test('valid invite shows complete card', async ({ page }) => {
    await page.goto(`/invite/${VALID_INVITE_TOKEN}`);
    
    // Skeleton should show first
    await expect(page.getByTestId('invite-skeleton')).toBeVisible();
    
    // Then the card loads
    const card = page.getByTestId('invite-card');
    await expect(card).toBeVisible({ timeout: 5000 });
    
    // Check elements are present
    await expect(page.getByTestId('invite-event')).toBeVisible();
    await expect(page.getByTestId('invite-leader')).toBeVisible();
    await expect(page.getByTestId('invite-roles')).toBeVisible();
    await expect(page.getByTestId('invite-members')).toBeVisible();
    
    const joinBtn = page.getByTestId('btn-join-room');
    await expect(joinBtn).toBeDisabled();
    
    // Select role to enable join
    await page.getByTestId('join-role-select').click();
    await page.getByRole('option').first().click();
    
    await expect(joinBtn).toBeEnabled();
  });

  test('expired invite shows correct message', async ({ page }) => {
    await page.goto('/invite/expired-or-invalid-token');
    
    const expiredView = page.getByTestId('invite-expired');
    await expect(expiredView).toBeVisible({ timeout: 5000 });
    
    // Verify verbatim copy
    await expect(expiredView).toContainText('Ask the leader for a new link');
  });

  test('successful join navigates away', async ({ page }) => {
    await page.goto(`/invite/${VALID_INVITE_TOKEN}`);
    await expect(page.getByTestId('invite-card')).toBeVisible({ timeout: 5000 });
    
    await page.getByTestId('join-role-select').click();
    await page.getByRole('option').first().click();
    await page.getByTestId('btn-join-room').click();
    
    // Should navigate to POST_JOIN route (which is /app)
    await expect(page).toHaveURL(/\/app/, { timeout: 5000 });
  });
});
