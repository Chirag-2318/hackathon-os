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

Locator: getByText('PRD & MVP', { exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('PRD & MVP', { exact: true }) with timeout 5000ms
  - waiting for getByText('PRD & MVP', { exact: true })

```

```yaml
- text: "[plugin:vite:import-analysis] Failed to resolve import \"@/components/primitives/button\" from \"src/features/docs/docs-page.tsx\". Does the file exist? C:/Users/Admin/.antigravity/hackathon-os/frontend/src/features/docs/docs-page.tsx:5:23 3 | import { useParams, Link } from \"react-router-dom\"; 4 | import { FramedScreen } from \"@/components/primitives/framed-screen\"; 5 | import { Button } from \"@/components/primitives/button\"; | ^ 6 | import { fetchDocsVault } from \"@/api/client\"; 7 | import { DocsFileTree } from \"./components/docs-file-tree\"; at TransformPluginContext._formatLog (file:///C:/Users/Admin/.antigravity/hackathon-os/frontend/node_modules/vite/dist/node/chunks/node.js:8393:39) at TransformPluginContext.error (file:///C:/Users/Admin/.antigravity/hackathon-os/frontend/node_modules/vite/dist/node/chunks/node.js:8390:14) at normalizeUrl (file:///C:/Users/Admin/.antigravity/hackathon-os/frontend/node_modules/vite/dist/node/chunks/node.js:26058:18) at async file:///C:/Users/Admin/.antigravity/hackathon-os/frontend/node_modules/vite/dist/node/chunks/node.js:26128:30 at async Promise.all (index 4) at async TransformPluginContext.transform (file:///C:/Users/Admin/.antigravity/hackathon-os/frontend/node_modules/vite/dist/node/chunks/node.js:26094:4) at async EnvironmentPluginContainer.transform (file:///C:/Users/Admin/.antigravity/hackathon-os/frontend/node_modules/vite/dist/node/chunks/node.js:8172:14) at async loadAndTransform (file:///C:/Users/Admin/.antigravity/hackathon-os/frontend/node_modules/vite/dist/node/chunks/node.js:19634:26) Click outside, press Esc key, or fix the code to dismiss. You can also disable this overlay by setting"
- code: server.hmr.overlay
- text: to
- code: "false"
- text: in
- code: vite.config.ts
- text: .
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
> 15 |     await expect(page.getByText('PRD & MVP', { exact: true })).toBeVisible();
     |                                                                ^ Error: expect(locator).toBeVisible() failed
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
  27 |     await expect(page.getByText('Validation Passed')).toBeVisible();
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