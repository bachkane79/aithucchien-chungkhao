const { chromium } = require('../node_modules/@playwright/test');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto('http://127.0.0.1:3000/gioi-thieu');
  console.log(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('body *')].map(el => { const r = el.getBoundingClientRect(); return {tag:el.tagName,class:el.className,left:r.left,right:r.right,width:r.width}; }).filter(r => r.right > 376 || r.left < -1)), null, 2));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
