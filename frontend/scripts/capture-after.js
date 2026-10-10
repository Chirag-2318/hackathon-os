import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '../../docs/redesign/round3');

async function main() {
  const browser = await chromium.launch();

  // Desktop context matching the screenshots (1534x729 at 1.25 dsf)
  const context = await browser.newContext({
    viewport: { width: 1534, height: 729 },
    deviceScaleFactor: 1.25,
  });

  const page = await context.newPage();

  // 1. after-playbooks.png
  console.log('Capturing after-playbooks.png...');
  await page.goto('http://localhost:5173/app/playbooks');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid^="pb-card-"]');
  await page.screenshot({ path: path.join(outDir, 'after-playbooks.png') });

  // 2. after-playbook-dialog.png
  console.log('Capturing after-playbook-dialog.png...');
  const firstCard = page.locator('[data-testid^="pb-card-"]').first();
  await firstCard.click();
  await page.waitForSelector('[role="dialog"]');
  await page.waitForTimeout(300); // allow transition to settle
  await page.screenshot({ path: path.join(outDir, 'after-playbook-dialog.png') });

  // 3. after-tools.png
  console.log('Capturing after-tools.png...');
  await page.goto('http://localhost:5173/app/tools');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid^="tool-card-"]');
  await page.screenshot({ path: path.join(outDir, 'after-tools.png') });

  // 4. after-tools-category.png
  console.log('Capturing after-tools-category.png...');
  const videoChip = page.getByTestId('tools-categories').getByRole('button', { name: /^Video/ });
  await videoChip.click();
  await page.waitForSelector('[data-testid="tools-cat-callout"]');
  await page.screenshot({ path: path.join(outDir, 'after-tools-category.png') });

  await context.close();

  // Responsive viewports: 1100px and 390px
  // 1100px Playbooks
  const ctx1100 = await browser.newContext({ viewport: { width: 1100, height: 800 } });
  const p1100 = await ctx1100.newPage();
  await p1100.goto('http://localhost:5173/app/playbooks');
  await p1100.waitForLoadState('networkidle');
  await p1100.screenshot({ path: path.join(outDir, 'after-playbooks-1100.png') });

  // 1100px Tools
  await p1100.goto('http://localhost:5173/app/tools');
  await p1100.waitForLoadState('networkidle');
  await p1100.screenshot({ path: path.join(outDir, 'after-tools-1100.png') });
  await ctx1100.close();

  // 390px Playbooks
  const ctx390 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const p390 = await ctx390.newPage();
  await p390.goto('http://localhost:5173/app/playbooks');
  await p390.waitForLoadState('networkidle');
  await p390.screenshot({ path: path.join(outDir, 'after-playbooks-390.png') });

  // 390px Tools
  await p390.goto('http://localhost:5173/app/tools');
  await p390.waitForLoadState('networkidle');
  await p390.screenshot({ path: path.join(outDir, 'after-tools-390.png') });
  await ctx390.close();

  await browser.close();
  console.log('All screenshots captured successfully.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
