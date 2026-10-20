import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=metal','--ignore-gpu-blocklist'] });
for (const clean of [0,1]) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1400 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.log('pageerror', e.message));
  await page.goto(`http://127.0.0.1:4180/?backend=webgl&res=900x1200&view=front&clean=${clean}`, { waitUntil: 'networkidle' });
  await page.waitForFunction('window.__YUU__ && window.__YUU__.ready', null, { timeout: 60000 }).catch(()=>console.log('timeout'));
  await page.waitForTimeout(1500);
  console.log('clean', clean, await page.evaluate(() => {
    const f = document.getElementById('stageFallback');
    const cs = getComputedStyle(f);
    return { hidden: f.hidden, display: cs.display, vis: cs.visibility, opacity: cs.opacity, z: cs.zIndex, bodyClass: document.body.className, backend: window.__YUU__?.backend, rect: f.getBoundingClientRect().toJSON() };
  }));
  await page.screenshot({ path: `output/tmp_clean${clean}.png` });
  await page.close();
}
await browser.close();
