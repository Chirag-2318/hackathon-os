# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: plan-docs.spec.ts >> Phase 3b: Plan (Prompt Bridge) & Docs Vault >> should render the Plan page and navigate through prompt bridge
- Location: e2e\plan-docs.spec.ts:13:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Validation Passed')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Validation Passed') with timeout 5000ms
  - waiting for getByText('Validation Passed')

```

```yaml
- complementary "Primary navigation":
  - text: Hackathon OS
  - button "Collapse sidebar" [expanded]: Collapse
  - navigation "Primary":
    - link "Home":
      - /url: /app/home
    - link "My rooms 2":
      - /url: /app/rooms
    - link "Playbooks":
      - /url: /app/playbooks
    - link "Tool directory":
      - /url: /app/tools
    - link "Portfolio":
      - /url: /app/portfolio
    - link "Settings":
      - /url: /app/settings
  - link "Go Pro — unlock AI planning and auto-scheduling":
    - /url: /app/settings/billing
    - paragraph: Go Pro
    - paragraph: AI planning and auto-scheduling.
  - button "Copy email": aarav@example.com
  - paragraph: 09:39:31 PM IST
- main:
  - navigation "Breadcrumb": Workspace Overview
  - button "Search tasks, docs, rules (Ctrl K)": Search tasks, docs, rules Ctrl K
  - button "Notifications": "3"
  - button "User menu": AM
  - heading "Command palette" [level=2]
  - paragraph: Search tasks, docs, rules, or run actions
  - text: "1"
  - paragraph: PRD & MVP
  - text: "2"
  - paragraph: Tech stack and architecture
  - text: "3"
  - paragraph: Phases
  - text: "4"
  - paragraph: Tasks
  - text: "5"
  - paragraph: Demo & Q&A
  - 'heading "Step 1: PRD & MVP" [level=2]'
  - text: "1"
  - heading "Copy this prompt" [level=3]
  - text: "~0.2k chars Open in:"
  - link "ChatGPT":
    - /url: https://chatgpt.com
  - link "Claude":
    - /url: https://claude.ai
  - code: "You are an expert product manager. I am building a project called 'Study Buddy Tinder'. Create a comprehensive PRD and an MVP specification. Structure the response strictly in Markdown format, with `# PRD` and `# MVP` as the main headers."
  - button "Copy"
  - text: "2"
  - heading "Paste the answer" [level=3]
  - textbox "Paste the generated response here...": Here is the PRD and MVP.
  - text: "3"
  - heading "Check it" [level=3]
  - button "Validate"
  - heading "Context pack" [level=3]
  - paragraph: fields sent
  - text: Idea
  - checkbox [checked]
  - text: Rubric
  - checkbox [checked]
  - text: Skills
  - checkbox [checked]
  - img
  - paragraph: This prompt contains your idea text. It goes to the AI service you paste it into.
  - heading "Skip copy-paste with Pro" [level=3]
  - paragraph: Connect your API keys or upgrade to Managed to let the app generate these files automatically.
  - button "Upgrade"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Phase 3b: Plan (Prompt Bridge) & Docs Vault', () => {
  4  |   const roomId = 'r-1';
  5  | 
  6  |   test.beforeEach(async ({ page }) => {
  7  |     // Navigate directly to the Plan page
  8  |     await page.goto(`/app/room/${roomId}/plan`);
  9  |     // Wait for MSW mocks to resolve
  10 |     await page.waitForLoadState('networkidle');
  11 |   });
  12 | 
  13 |   test('should render the Plan page and navigate through prompt bridge', async ({ page }) => {
  14 |     // Verify Stepper is present
  15 |     await expect(page.getByText('PRD & MVP', { exact: true })).toBeVisible();
  16 |     await expect(page.getByText('Tech stack and architecture')).toBeVisible();
  17 | 
  18 |     // Verify right rail Context pack
  19 |     await expect(page.getByText('Context pack')).toBeVisible();
  20 | 
  21 |     // Step 1: Copy and paste
  22 |     await expect(page.getByText('Copy this prompt')).toBeVisible();
  23 |     await page.getByPlaceholder('Paste the generated response here...').fill('Here is the PRD and MVP.');
  24 |     
  25 |     // Validate Step 1 (Pass)
  26 |     await page.getByRole('button', { name: 'Validate' }).click();
> 27 |     await expect(page.getByText('Validation Passed')).toBeVisible();
     |                                                       ^ Error: expect(locator).toBeVisible() failed
  28 | 
  29 |     // Should move to Step 2 (Tech stack)
  30 |     await expect(page.getByRole('heading', { name: 'Step 2: Tech stack and architecture' })).toBeVisible();
  31 | 
  32 |     // Force Fail on Step 2
  33 |     // Our mock checks for a specific header or we can just mock the fail condition.
  34 |     // For now, let's inject a header to force failure
  35 |     await page.route('**/api/v1/rooms/*/plan/validate', async (route) => {
  36 |       const headers = route.request().headers();
  37 |       headers['x-test-force-error'] = 'true';
  38 |       route.continue({ headers });
  39 |     });
  40 | 
  41 |     await page.getByPlaceholder('Paste the generated response here...').fill('Here is the Tech Stack.');
  42 |     await page.getByRole('button', { name: 'Validate' }).click();
  43 |     
  44 |     // Should show validation failed
  45 |     await expect(page.getByText('Validation Failed')).toBeVisible();
  46 |     await expect(page.getByText('Missing user roles')).toBeVisible();
  47 |     await expect(page.getByText('Missing offline fallback')).toBeVisible();
  48 |     
  49 |     // Reset route for success
  50 |     await page.unroute('**/api/v1/rooms/*/plan/validate');
  51 |     await page.getByRole('button', { name: 'Validate' }).click();
  52 |     await expect(page.getByText('Validation Passed')).toBeVisible();
  53 | 
  54 |     // Mock skipping to Step 5 (for brevity in E2E)
  55 |     // In a real e2e, we would loop through all steps. Let's just do one more to simulate completion.
  56 |     // For this test we can just manually advance all the steps.
  57 |     for (let i = 3; i <= 5; i++) {
  58 |       await page.getByPlaceholder('Paste the generated response here...').fill(`Answer for step ${i}`);
  59 |       await page.getByRole('button', { name: 'Validate' }).click();
  60 |       await expect(page.getByText('Validation Passed')).toBeVisible();
  61 |     }
  62 | 
  63 |     // Step 6: Review and Lock
  64 |     await expect(page.getByRole('heading', { name: 'Review your plan' })).toBeVisible();
  65 |     await expect(page.getByText('PRD.md')).toBeVisible();
  66 |     
  67 |     // Lock Plan
  68 |     await page.getByRole('button', { name: 'Lock plan' }).click();
  69 |     
  70 |     // Wait for animation and success seal
  71 |     await expect(page.getByText('Plan Locked')).toBeVisible();
  72 | 
  73 |     // Navigate to Docs Vault
  74 |     await page.getByRole('button', { name: 'Go to Docs Vault' }).click();
  75 |     
  76 |     // Wait for Docs page to load
  77 |     await expect(page.getByRole('heading', { name: 'Docs Vault' })).toBeVisible();
  78 |     
  79 |     // Verify file tree
  80 |     await expect(page.getByText('PRD.md', { exact: true })).toBeVisible();
  81 |     await expect(page.getByText('TECH_STACK.md', { exact: true })).toBeVisible();
  82 | 
  83 |     // Select a file
  84 |     await page.getByText('TECH_STACK.md').click();
  85 |     
  86 |     // Verify editor shows the file content
  87 |     await expect(page.locator('textarea')).toHaveValue('# Tech Stack\n\nFrontend: React\nBackend: Node.js');
  88 |     
  89 |     // Verify Meta pane
  90 |     await expect(page.getByText('Edited by Aarav Mehta')).toBeVisible();
  91 |   });
  92 | });
  93 | 
```