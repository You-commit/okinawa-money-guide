import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const {chromium}=await import(process.env.OMG_PLAYWRIGHT_MODULE??'playwright');
const route='/knowledge/nisa-limits-and-future-value';
const folder=path.resolve('qa/nisa-headings');
fs.mkdirSync(folder,{recursive:true});
async function ready(port){
 const url='http://127.0.0.1:'+port+route;
 for(let i=0;i<50;i++){
   try{const r=await fetch(url);if(r.ok)return;}catch{}
   await new Promise(ok=>setTimeout(ok,900));
 }
 throw new Error('Preview unavailable '+port);
}
await Promise.all([4173,4174].map(ready));
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const report=[],failures=[];
for(const [name,width,height] of [['desktop',1440,900],['mobile',390,844],['small-mobile',320,740]]){
 const opts={viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'};
 const old=await browser.newPage(opts),cur=await browser.newPage(opts);
 const errors=[];
 cur.on('pageerror',e=>errors.push(String(e)));
 cur.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 const grab=()=>({
   text:(()=>{const cl=document.querySelector('.nisa-bank-article')?.cloneNode(true);
    cl?.querySelectorAll('.nisa-bank-section__heading > span').forEach(x=>x.remove());
    return cl?.textContent?.replace(/\s+/g,' ').trim();})(),
   nav:(()=>{const cl=document.querySelector('.nisa-bank-sidebar nav')?.cloneNode(true);
    cl?.querySelectorAll('a > span').forEach(x=>x.remove());
    return cl?.textContent?.replace(/\s+/g,' ').trim();})(),
   ids:[...document.querySelectorAll('.nisa-bank-section[id]')].map(x=>x.id),
   headers:[...document.querySelectorAll('.nisa-bank-section h2')].map(x=>x.textContent?.trim()),
   numbers:[...document.querySelectorAll('.nisa-bank-section__heading > span, .nisa-bank-sidebar nav a > span')].map(x=>x.textContent?.trim()),
   toc:document.querySelectorAll('.nisa-bank-sidebar nav a').length,
   faqs:document.querySelectorAll('#faq details').length,
   sources:document.querySelectorAll('#sources li a').length,
   faqRect:(()=>{const el=document.querySelector('#faq');const r=el?.getBoundingClientRect();return r?{top:r.top,bottom:r.bottom,left:r.left,right:r.right}:null;})(),
   sourceRect:(()=>{const el=document.querySelector('#sources');const r=el?.getBoundingClientRect();return r?{top:r.top,bottom:r.bottom,left:r.left,right:r.right}:null;})(),
   gridStyle:getComputedStyle(document.querySelector('.nisa-bank-bottom-grid')).display,
   sourceFont:parseFloat(getComputedStyle(document.querySelector('.nisa-bank-sources a span')).fontSize),
   image:(()=>{const el=document.querySelector('.nisa-bank-editorial-illustration img');return {complete:el?.complete,width:el?.naturalWidth,src:el?.getAttribute('src')};})(),
   viewport:innerWidth,
   scrollWidth:document.documentElement.scrollWidth
 });
 try{
  await Promise.all([
    old.goto('http://127.0.0.1:4174'+route,{waitUntil:'networkidle',timeout:60000}),
    cur.goto('http://127.0.0.1:4173'+route,{waitUntil:'networkidle',timeout:60000})
  ]);
  const before=await old.evaluate(grab),after=await cur.evaluate(grab);
  assert.equal(after.text,before.text,'NISA article text changed, beyond chapter badges');
  assert.equal(after.nav,before.nav,'TOC labels changed');
  assert.deepEqual(after.ids,before.ids,'8 section ids changed');
  assert.deepEqual(after.headers,before.headers,'headings changed');
  assert.equal(after.ids.length,8);
  assert.equal(after.numbers.length,0,'Decorative ordinal badges remain');
  assert.equal(after.toc,8);
  assert.equal(after.faqs,before.faqs);
  assert.equal(after.sources,before.sources);
  assert.equal(after.gridStyle,'block','FAQ and sources are still in a two-column grid');
  assert.ok(after.sourceRect.top >= after.faqRect.bottom+24,'Sources must be strictly below FAQ');
  assert.ok(Math.abs(after.sourceRect.left-after.faqRect.left)<2,'Sources must align with FAQ on left');
  assert.ok(Math.abs(after.sourceRect.right-after.faqRect.right)<2,'Sources must use article width');
  assert.ok(after.sourceFont>=12,'Sources label font smaller than 12px');
  assert.ok(after.image.complete&&after.image.width>100,'Original illustration did not load');
  assert.ok(after.scrollWidth<=after.viewport+1,'New horizontal overflow');
  assert.deepEqual(errors,[],'JavaScript errors');
  await cur.locator('.nisa-bank-bottom-grid').screenshot({path:path.join(folder,name+'-faq-sources.png'),animations:'disabled'});
  await cur.screenshot({path:path.join(folder,name+'-full.png'),fullPage:true,animations:'disabled'});
  report.push({viewport:name,status:'PASS',sourcesBelowFaq:true,numbers:0,headingCount:8,details:after.faqs,links:after.sources,sourceFont:after.sourceFont,contentUnchanged:true});
  console.log('PASS '+name+' FAQ->source vertical reading order, no decorative numbers, article content preserved');
 }catch(err){
  failures.push(name+': '+String(err));
  report.push({viewport:name,status:'FAIL',error:String(err),errors});
  await cur.screenshot({path:path.join(folder,name+'-FAILED.png'),fullPage:true}).catch(()=>{});
 }finally{await old.close();await cur.close();}
}
await browser.close();
fs.writeFileSync(path.join(folder,'report.json'),JSON.stringify({report,failures},null,2));
for(const f of failures)console.error('FAIL '+f);
if(failures.length)process.exitCode=1;
