import { test, expect } from '@playwright/test';

test.describe('Build Phase and Acceptance Checklist Tests', () => {
  const roomId = '00000000-0000-0000-0000-000000000001'; // test-fixture-id

  test('Checklist 1: Hidden modules (prep, crowd-check, schedule) are hidden and redirect to overview', async ({ page }) => {
    // Navigate to room overview
    await page.goto(`/app/room/${roomId}/overview`);
    await page.waitForLoadState('networkidle');

    // Sidebar should NOT contain prep, crowd-check, or schedule links
    const sidebar = page.locator('nav, aside');
    await expect(sidebar.locator('text=Pre-hackathon prep')).toHaveCount(0);
    await expect(sidebar.locator('text=Crowd check')).toHaveCount(0);
    await expect(sidebar.locator('text=Schedule')).toHaveCount(0);

    // Direct navigation to /prep redirects to overview
    await page.goto(`/app/room/${roomId}/prep`);
    await page.waitForURL(new RegExp(`/app/room/${roomId}/overview`));
    await expect(page).toHaveURL(new RegExp(`/app/room/${roomId}/overview`));

    // Direct navigation to /crowd-check redirects to overview
    await page.goto(`/app/room/${roomId}/crowd-check`);
    await page.waitForURL(new RegExp(`/app/room/${roomId}/overview`));
    await expect(page).toHaveURL(new RegExp(`/app/room/${roomId}/overview`));

    // Direct navigation to /schedule redirects to overview
    await page.goto(`/app/room/${roomId}/schedule`);
    await page.waitForURL(new RegExp(`/app/room/${roomId}/overview`));
    await expect(page).toHaveURL(new RegExp(`/app/room/${roomId}/overview`));
  });

  test('Checklist 4: Ideate simplified 7/5 layout, composer, popovers, and approved card', async ({ page }) => {
    await page.goto(`/app/room/${roomId}/ideate`);
    await page.waitForLoadState('networkidle');

    // Check page header
    await expect(page.locator('h1:has-text("Ideate")')).toBeVisible();

    // Check composer textarea
    const composer = page.locator('textarea');
    await expect(composer).toBeVisible();

    // Check popover buttons "Add link" and "Add note"
    await expect(page.locator('button:has-text("Add link"), button[title*="Add link"]')).toBeVisible();
    await expect(page.locator('button:has-text("Add note"), button[title*="Add note"]')).toBeVisible();

    // Check Approved ideas card on right (5/12)
    await expect(page.locator('h3:has-text("Approved ideas")')).toBeVisible();
  });

  test('Checklist 5: Board 3 equal columns, cards, quick filters, list view', async ({ page }) => {
    await page.goto(`/app/room/${roomId}/board`);
    await page.waitForLoadState('networkidle');

    // Header Board title
    await expect(page.locator('h1:has-text("Board")')).toBeVisible();

    // 3 equal columns headers: TO DO, IN PROGRESS, DONE
    await expect(page.getByText('TO DO', { exact: true })).toBeVisible();
    await expect(page.getByText('IN PROGRESS', { exact: true })).toBeVisible();
    await expect(page.getByText('DONE', { exact: true })).toBeVisible();

    // Quick filter bar: search input, Only mine, Blocked, Due soon
    await expect(page.locator('input[placeholder="Search board"]')).toBeVisible();
    await expect(page.locator('button:has-text("Only mine")')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Blocked', exact: true })).toBeVisible();
    await expect(page.locator('button:has-text("Due soon")')).toBeVisible();

    // Switch to List view
    const listTab = page.locator('button:has-text("List")');
    await listTab.click();
    await expect(page.locator('text=Summary')).toBeVisible();
    await expect(page.getByText('Phase', { exact: true })).toBeVisible();

    // Switch back to Board view
    const boardTab = page.locator('button:has-text("Board")');
    await boardTab.click();
    await expect(page.getByText('TO DO', { exact: true })).toBeVisible();
  });

  test('Checklist 6: Task detail modal deep link ?task= opens and displays Jira details', async ({ page }) => {
    await page.goto(`/app/room/${roomId}/board?task=CBS-1`);
    await page.waitForLoadState('networkidle');

    // Task modal opens
    await expect(page.locator('text=CBS-1').first()).toBeVisible();
    await expect(page.locator('text=Acceptance criteria')).toBeVisible();
    await expect(page.locator('text=Subtasks')).toBeVisible();
    await expect(page.locator('text=Activity')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Assignee')).toBeVisible();
  });

  test('Checklist 7: MVP Studio pitch card, core flow, reality ledger, health card', async ({ page }) => {
    await page.goto(`/app/room/${roomId}/mvp`);
    await page.waitForLoadState('networkidle');

    // Header
    await expect(page.locator('h1:has-text("MVP Studio")')).toBeVisible();

    // Pitch card
    await expect(page.locator('text=One-Sentence Identity')).toBeVisible();
    await expect(page.getByText('Wow moment', { exact: true })).toBeVisible();

    // Core flow
    await expect(page.locator('text=Core flow')).toBeVisible();

    // Reality ledger
    await expect(page.locator('text=Reality ledger')).toBeVisible();

    // MVP Health
    await expect(page.locator('text=MVP Health')).toBeVisible();
    await expect(page.locator('text=Runs end to end')).toBeVisible();
  });

  test('Checklist 8: Docs 3-pane full-height layout, markdown rendering, outline', async ({ page }) => {
    await page.goto(`/app/room/${roomId}/docs`);
    await page.waitForLoadState('networkidle');

    // Left pane has Plan documents
    await expect(page.locator('h3:has-text("Plan documents")')).toBeVisible();
    await expect(page.locator('text=PRD.md').first()).toBeVisible();

    // Center pane has Preview / Markdown controls
    await expect(page.locator('button:has-text("Preview")')).toBeVisible();
    await expect(page.locator('button:has-text("Markdown")')).toBeVisible();

    // Right pane has Outline
    await expect(page.locator('button:has-text("Outline")')).toBeVisible();

    // Download all button
    await expect(page.locator('button:has-text("Download all (zip)")')).toBeVisible();
  });

  test('Checklist 2 & 3: Plan page stepper geometry and DEV fill sample answer', async ({ page }) => {
    await page.goto(`/app/room/${roomId}/plan`);
    await page.waitForLoadState('networkidle');

    // 5 step rows in PlanStepper
    await expect(page.getByText('PRD & MVP', { exact: true })).toBeVisible();
    await expect(page.getByText('Tech stack and architecture', { exact: true })).toBeVisible();
    await expect(page.getByText('Phases', { exact: true })).toBeVisible();
    await expect(page.getByText('Tasks', { exact: true })).toBeVisible();
    await expect(page.getByText('Demo & Q&A', { exact: true })).toBeVisible();

    // Dev button Fill sample answer
    const fillButton = page.locator('button:has-text("Fill sample answer")');
    await expect(fillButton.first()).toBeVisible();

    // Click Fill sample answer to verify it fills sample content
    await fillButton.first().click();
    const textarea = page.locator('textarea').first();
    await expect(textarea).not.toHaveValue('');
  });

  test('Checklist 9 & Command Palette: Task search in Command Palette', async ({ page }) => {
    await page.goto(`/app/room/${roomId}/overview`);
    await page.waitForLoadState('networkidle');

    // Press Ctrl+K
    await page.keyboard.press('Control+k');
    const input = page.locator('input[placeholder*="Search tasks"]');
    await expect(input).toBeVisible();

    // Type CBS-1
    await input.fill('CBS-1');
    const taskItem = page.locator('text=CBS-1').first();
    await expect(taskItem).toBeVisible();
  });
});
