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
    '/app/room/r-1',
    '/app/room/r-1/brief',
    '/app/room/r-1/team',
    '/app/room/r-1/ideate',
    '/app/room/r-1/plan',
    '/app/room/r-1/docs',
    '/app/room/r-1/board',
    '/app/room/r-1/schedule',
    '/app/room/r-1/mvp',
    '/app/room/r-1/github',
    '/app/room/r-1/apis',
    '/app/room/r-1/diagrams',
    '/app/room/r-1/pitch',
    '/app/room/r-1/demo',
    '/app/room/r-1/submit'
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
