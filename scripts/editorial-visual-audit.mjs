const { chromium } = await import(process.env.OMG_PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const outDir = path.resolve('qa/editorial-visual');
fs.mkdirSync(outDir, { recursive: true });
const targets = [
  ['home', '/'],
  ['military-land', '/simulators/military-land'],
  ['mortgage-sim', '/simulators/mortgage'],
  ['nisa-sim', '/simulators/nisa'],
  ['ideco-sim', '/simulators/ideco'],
  ['taxable-sim', '/simulators/taxable-income'],
  ['knowledge', '/knowledge'],
  ['nisa-article', '/knowledge/nisa-limits-and-future-value'],
  ['mortgage-article', '/knowledge/mortgage-comparison'],
  ['about', '/about'],
  ['trust', '/trust'],
  ['404', '/__unknown_omg_qa__'],
];
const protectedNames = new Set(['home', 'military-land', 'mortgage-sim', 'nisa-sim', 'ideco-sim', 'taxable-sim']);
const layouts = [
  ['desktop', { width: 1440, height: 900 }],
  ['mobile', { width: 390, height: 844 }],
];
const address = { baseline: 'http://127.0.0.1:4174', feature: 'http://127.0.0.1:4173' };
const sleep = delay => new Promise(resolve => setTimeout(resolve, delay));
async function ready(url) {
  for (let n=0;n<45;n++) {
    try { const r=await fetch(url); if(r.ok) return; } catch {}
    await sleep(1000);
  }
  throw new Error('Preview server did not start: '+url);
}
await Promise.all(Object.values(address).map(ready));
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const rows = [];
const failures = [];

async function inspect(page, type, label, pathname, layout) {
  const faults = [];
  page.on('pageerror', error => faults.push(error.message));
  page.on('console', msg => { if(msg.type()==='error') faults.push(msg.text()); });
  const response = await page.goto(address[type] + pathname, { waitUntil:'networkidle', timeout:60000 });
  assert.ok(response && response.ok(), 'HTTP response invalid '+type+' '+pathname);
  await page.locator('#main-content').waitFor({timeout:30000});
  await page.evaluate(async () => { await document.fonts.ready; window.scrollTo(0,0); });
  const details = await page.evaluate(() => {
    const sample = Array.from(document.querySelectorAll('#main-content h1, #main-content h2, #main-content button, #main-content input, #main-content select, #main-content .result-card')).slice(0,40);
    return {
      title: document.title,
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      height: document.documentElement.scrollHeight,
      h1: document.querySelector('#main-content h1')?.textContent?.trim() ?? null,
      contentText: document.querySelector('#main-content')?.textContent?.replace(/\s+/g,' ').trim() ?? '',
      computed: sample.map(el => {
        const c=getComputedStyle(el);
        const r=el.getBoundingClientRect();
        return [el.tagName, el.className?.toString().slice(0,90), c.fontSize,c.fontWeight,c.color,c.backgroundColor,c.borderRadius,c.borderColor,c.boxShadow,Math.round(r.width),Math.round(r.height)];
      }),
    };
  });
  const textHash=createHash('sha256').update(details.contentText).digest('hex');
  delete details.contentText;
  if (type==='feature') {
    await page.screenshot({
      path: path.join(outDir, label + '-' + layout + '.png'),
      fullPage: true,
      animations: 'disabled',
    });
  }
  return { ...details, textHash, faults, type, label, layout };
}
try {
  for (const [layout,viewport] of layouts) {
    const baseline = await browser.newPage({viewport, deviceScaleFactor:1, reducedMotion:'reduce'});
    const feature = await browser.newPage({viewport, deviceScaleFactor:1, reducedMotion:'reduce'});
    for (const [label,pathname] of targets) {
      try {
        const before=await inspect(baseline,'baseline',label,pathname,layout);
        const after=await inspect(feature,'feature',label,pathname,layout);
        rows.push({label,layout,pathname,before,after});
        if(after.scrollWidth>after.width+1 || after.bodyScrollWidth>after.width+1)
          failures.push(label+' '+layout+': horizontal overflow');
        if(after.faults.length>before.faults.length)
          failures.push(label+' '+layout+': new console/page error '+after.faults.join(';'));
        if(protectedNames.has(label)){
          if(before.textHash!==after.textHash) failures.push(label+' '+layout+': protected visible text differs');
          if(JSON.stringify(before.computed)!==JSON.stringify(after.computed))
            failures.push(label+' '+layout+': protected element computed styles differ');
        }
      } catch(e) {failures.push(label+' '+layout+': '+String(e));}
    }
    await baseline.close();await feature.close();
  }
} finally {await browser.close();}
const report={createdAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',routeCount:targets.length,viewports:layouts.map(x=>x[0]),screenshots:rows.length,failures,rows};
fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify(report,null,2));
console.log('OMG visual QA: '+report.status+'; screenshots='+report.screenshots+' / 24; protected routes='+protectedNames.size+' x 2');
for(const item of failures)console.error('FAIL '+item);
if(failures.length)process.exitCode=1;
