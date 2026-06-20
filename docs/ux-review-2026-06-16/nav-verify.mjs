import { chromium } from 'playwright';
const BASE = 'https://jobsofficialsite.vercel.app';
const tests = ['/about', '/courses', '/teachers', '/fees', '/schedule', '/faq', '/contact'];
const browser = await chromium.launch();
const page = await browser.newContext({ viewport: { width: 1440, height: 900 } }).then(c => c.newPage());
for (const path of tests) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  // read which desktop nav link is marked active
  const active = await page.$$eval('#site-nav .nav-link', els =>
    els.filter(a => a.dataset.active === 'true').map(a => a.getAttribute('href') + ' / ' + a.textContent.trim()));
  const ariaCurrent = await page.$$eval('#site-nav .nav-link[aria-current="page"]', els => els.map(a => a.getAttribute('href')));
  console.log(`${path.padEnd(12)} → active=[${active.join(', ')}]  aria-current=[${ariaCurrent.join(',')}]  ${active.length===1 && active[0].startsWith(path)?'✓':'✗ CHECK'}`);
}
await browser.close();
