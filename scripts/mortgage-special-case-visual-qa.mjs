import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = await import(process.env.OMG_PLAYWRIGHT_MODULE ?? 'playwright');

const output = path.resolve('qa/mortgage-regression');
fs.mkdirSync(output, { recursive: true });
const base = process.env.OMG_BASE_URL ?? 'http://127.0.0.1:4173';
const cases = [
  {
    key: 'zero-rate',
    amount: '30000000',
    rate: '0',
    years: '35',
    layout: 'years',
    crossover: '期間内のマイナス転換なし',
    marker: false,
  },
  {
    key: 'month-crossover',
    amount: '1000000000',
    rate: '20',
    years: '50',
    layout: 'months',
    crossover: '10年1か月目からマイナス（破線）',
    marker: true,
  },
];
const widths = [
  ['desktop', 1440, 900],
  ['mobile', 390, 844],
];
const all = [];
const errors = [];
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  for (const [viewport, width, height] of widths) {
    for (const scenario of cases) {
      const page = await browser.newPage({ viewport: {width,height}, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      const faults = [];
      page.on('pageerror', err => faults.push(err.message));
      page.on('console', msg => { if (msg.type()==='error') faults.push(msg.text()); });
      try {
        const response = await page.goto(base+'/simulators/mortgage', { waitUntil: 'networkidle', timeout: 60000 });
        assert.ok(response?.ok(), 'HTTP invalid');
        await page.getByLabel('借入金額', {exact:true}).fill(scenario.amount);
        await page.getByLabel('年利', {exact:true}).fill(scenario.rate);
        await page.getByLabel('返済期間', {exact:true}).fill(scenario.years);
        await page.getByRole('button', {name:'シミュレートする'}).click();
        const graph = page.locator('.mortgage-trajectory-difference__visual');
        await graph.waitFor({state:'visible',timeout:20000});
        const layout = await graph.getAttribute('data-mobile-axis-layout');
        const crossover = await graph.getAttribute('data-mobile-crossover-label');
        assert.equal(layout, scenario.layout, 'axis layout mismatched');
        assert.equal(crossover, scenario.crossover, 'crossover label mismatched');
        const marker = graph.locator('.mortgage-trajectory-difference__crossover');
        assert.equal(await marker.count(), scenario.marker?1:0, 'marker presence mismatched');
        if (scenario.marker) {
          const label = await marker.getAttribute('aria-label');
          assert.ok(label?.includes('10年1か月目'), 'exact monthly crossover marker missing');
        }
        const measured = await page.evaluate(() => ({
          viewportWidth: window.innerWidth,
          documentScrollWidth: document.documentElement.scrollWidth,
          visibleResult: document.querySelector('.mortgage-results')?.getAttribute('data-empty'),
        }));
        assert.equal(measured.visibleResult, 'false', 'result did not render');
        assert.equal(faults.length,0,'page script/console errors: '+faults.join(';'));
        await page.screenshot({path:path.join(output,scenario.key+'-'+viewport+'.png'),fullPage:true,animations:'disabled'});
        all.push({key:scenario.key,viewport,status:'PASS',layout,crossover,marker:scenario.marker,...measured});
        console.log('PASS '+scenario.key+' '+viewport+' '+crossover);
      } catch (e) {
        errors.push(scenario.key+' '+viewport+': '+String(e));
        all.push({key:scenario.key,viewport,status:'FAIL',error:String(e),faults});
        await page.screenshot({path:path.join(output,scenario.key+'-'+viewport+'-fail.png'),fullPage:true}).catch(()=>{});
      } finally {await page.close();}
    }
  }
} finally {await browser.close();}
const report={base,createdAt:new Date().toISOString(),cases:all,failures:errors};
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
for(const error of errors)console.error('FAIL '+error);
if(errors.length)process.exitCode=1;
