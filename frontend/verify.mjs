import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const routes = [
    '/',
    '/sign-in',
    '/invite/123',
    '/playbooks',
    '/playbooks/pb-1',
    '/room/new',
    '/app',
    '/app/room/00000000-0000-0000-0000-000000000001',
    '/app/room/00000000-0000-0000-0000-000000000001/brief',
    '/app/room/00000000-0000-0000-0000-000000000001/team',
    '/app/room/00000000-0000-0000-0000-000000000001/ideate',
    '/app/room/00000000-0000-0000-0000-000000000001/plan',
    '/app/room/00000000-0000-0000-0000-000000000001/docs',
    '/app/room/00000000-0000-0000-0000-000000000001/board',
    '/app/room/00000000-0000-0000-0000-000000000001/schedule',
    '/app/room/00000000-0000-0000-0000-000000000001/mvp',
    '/app/room/00000000-0000-0000-0000-000000000001/github',
    '/app/room/00000000-0000-0000-0000-000000000001/apis',
    '/app/room/00000000-0000-0000-0000-000000000001/diagrams',
    '/app/room/00000000-0000-0000-0000-000000000001/pitch',
    '/app/room/00000000-0000-0000-0000-000000000001/demo',
    '/app/room/00000000-0000-0000-0000-000000000001/submit'
  ];

  for (const route of routes) {
    try {
      await page.goto(`http://localhost:5173${route}`, { waitUntil: 'networkidle', timeout: 5000 });
      
      const viteOverlay = await page.$('vite-error-overlay');
      if (viteOverlay) {
        console.error(`❌ ${route} showed Vite error overlay`);
      } else {
        console.log(`✅ ${route} rendered OK`);
      }
    } catch (e) {
      console.error(`Failed to load ${route}:`, e.message);
    }
  }

  await browser.close();
})();
