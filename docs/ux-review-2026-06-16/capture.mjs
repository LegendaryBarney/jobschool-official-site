import { chromium } from 'playwright';

const BASE = 'https://jobsofficialsite.vercel.app';
const OUT = new URL('./screenshots/', import.meta.url).pathname.replace(/^\//, '');
const pages = {
  home: '/', about: '/about', courses: '/courses', 'course-detail': '/courses/high-math-grade-10',
  teachers: '/teachers', 'teacher-detail': '/teachers/barney', tutors: '/tutors', schedule: '/schedule',
  fees: '/fees', faq: '/faq', testimonials: '/testimonials', contact: '/contact',
};
const viewports = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };

const browser = await chromium.launch();
for (const [vname, vp] of Object.entries(viewports)) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: vname === 'mobile' ? 2 : 1, isMobile: vname === 'mobile', reducedMotion: 'no-preference' });
  const page = await ctx.newPage();
  for (const [name, path] of Object.entries(pages)) {
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 45000 });
      // scroll through to trigger IntersectionObserver reveals
      await page.evaluate(async () => {
        const h = document.body.scrollHeight;
        for (let y = 0; y <= h; y += window.innerHeight * 0.8) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 180)); }
        window.scrollTo(0, 0);
        // force any still-hidden reveal elements visible
        document.querySelectorAll('[style*="opacity"], .reveal, [data-reveal]').forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
        await new Promise(r => setTimeout(r, 400));
      });
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${OUT}${name}-${vname}.png`, fullPage: true });
      console.log('OK', name, vname);
    } catch (e) { console.log('FAIL', name, vname, e.message); }
  }
  await ctx.close();
}
await browser.close();
