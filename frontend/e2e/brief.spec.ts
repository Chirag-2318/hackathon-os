import { test, expect } from '@playwright/test';

test.describe('S09: Brief Screen', () => {
  test('renders Brief components with mock data', async ({ page }) => {
    // Navigate to the Brief page
    await page.goto('/app/room/r-1/brief');

    // Wait for the mock data to load
    await expect(page.locator('h2', { hasText: 'Problem Statement' })).toBeVisible();

    // Verify layout panels
    // Left panel elements
    await expect(page.locator('text=Rules Checklist')).toBeVisible();
    await expect(page.locator('text=Deadlines')).toBeVisible();
    await expect(page.locator('text=Eligibility')).toBeVisible();
    await expect(page.locator('text=Tracks & Prizes')).toBeVisible();
    await expect(page.locator('text=Format')).toBeVisible();
    
    // Check AI policy callout
    await expect(page.locator('text=AI-use policy')).toBeVisible();
    
    // Check specific mock data elements
    await expect(page.locator('text=Students lack reliable ways to find study groups.')).toBeVisible();
    
    // Rules changed banner
    await expect(page.locator('text=Rules changed on 20 Sep.')).toBeVisible();
    
    // Right panel - source text and progress
    await expect(page.locator('text=Welcome to Campus Build Sprint 2026!')).toBeVisible();
    
    // Confirm all button
    const confirmBtn = page.locator('button', { hasText: 'Confirm all' });
    await expect(confirmBtn).toBeVisible();
  });
});
