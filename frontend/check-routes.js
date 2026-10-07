import puppeteer from 'puppeteer';

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

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  for (const route of routes) {
    console.log(`\nVisiting: ${route}`);
    
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', err => {
      errors.push(err.toString());
    });
    
    try {
      await page.goto(`http://localhost:5173${route}`, { waitUntil: 'networkidle0', timeout: 10000 });
      // wait a bit for any async renders
      await new Promise(r => setTimeout(r, 1000));
      
      if (errors.length > 0) {
        console.error(`ERRORS ON ${route}:`);
        errors.forEach(e => console.error(' -', e));
      } else {
        console.log(`OK: ${route}`);
      }
    } catch (e) {
      console.error(`FAILED TO LOAD ${route}:`, e);
    }
    
    // clear listeners for next route
    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
  }
  
  await browser.close();
})();
