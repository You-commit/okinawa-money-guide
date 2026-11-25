import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = await import(process.env.OMG_PLAYWRIGHT_MODULE ?? 'playwright');
const root='http://127.0.0.1:417';
const route='/knowledge/nisa-limits-and-future-value';
const output=path.resolve('qa/nisa-illustration');
fs.mkdirSync(output,{recursive:true});
const sleep=n=>new Promise(ok=>setTimeout(ok,n));
for(const port of [3,4]){
 let ok=false;
 for(let n=0;n<45;n++){
  try{const r=await fetch(root+port+route);if(r.ok){ok=true;break;}}catch{}
  await sleep(1000);
 }
 assert.ok(ok,'Preview not started '+port);
}
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results=[], failures=[];
try{
 for(const [label,width,height] of [['PC',1440,900],['mobile',390,844],['small-mobile',320,740]]){
  const opts={viewport:{width,height},reducedMotion:'reduce',deviceScaleFactor:1};
  const orig=await browser.newPage(opts),newPage=await browser.newPage(opts);
  const errors=[];
  newPage.on('pageerror',e=>errors.push(e.message));
  newPage.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  try{
   await Promise.all([
    orig.goto(root+'4'+route,{waitUntil:'networkidle',timeout:60000}),
    newPage.goto(root+'3'+route,{waitUntil:'networkidle',timeout:60000})
   ]);
   const oldData=await orig.evaluate(()=>({
    text:document.querySelector('.nisa-bank-article')?.textContent?.replace(/\s+/g,' ').trim(),
    heads:[...document.querySelectorAll('.nisa-bank-section h2')].map(x=>x.textContent?.trim()),
    ids:[...document.querySelectorAll('.nisa-bank-section[id]')].map(x=>x.id)
   }));
   const newData=await newPage.evaluate(async()=>{
    const img=document.querySelector('.nisa-bank-editorial-illustration img');
    if(img&&!img.complete)await new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});setTimeout(resolve,8000)});
    const box=img?.getBoundingClientRect(),article=img?.closest('article')?.getBoundingClientRect();
    return {
      text:document.querySelector('.nisa-bank-article')?.textContent?.replace(/\s+/g,' ').trim(),
      heads:[...document.querySelectorAll('.nisa-bank-section h2')].map(x=>x.textContent?.trim()),
      ids:[...document.querySelectorAll('.nisa-bank-section[id]')].map(x=>x.id),
      img: img?{src:img.getAttribute('src'),alt:img.alt,complete:img.complete,
        naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,
        renderedWidth:box?.width,articleWidth:article?.width}:null,
      pageWidth:document.documentElement.scrollWidth,
      viewportWidth:innerWidth
    };
   });
   assert.equal(newData.text,oldData.text,'Original article paragraph text changed');
   assert.deepEqual(newData.heads,oldData.heads,'Original headings changed');
   assert.deepEqual(newData.ids,oldData.ids,'Original section IDs changed');
   assert.equal(newData.img?.src,'/article-media/nisa-questions-illustration.webp');
   assert.ok(newData.img?.alt,'Image alt missing');
   assert.ok(newData.img?.naturalWidth>100&&newData.img?.naturalHeight>100,'Illustration not decoded');
   assert.ok(newData.img?.renderedWidth<=newData.img?.articleWidth+2,'Image too wide');
   assert.ok(newData.pageWidth<=newData.viewportWidth+1,'Horizontal overflow');
   assert.deepEqual(errors,[],'Unexpected script/console errors');
   await newPage.screenshot({path:path.join(output,label+'.png'),fullPage:true,animations:'disabled'});
   results.push({label,status:'PASS',image:newData.img,textIdentical:true,headingCount:newData.heads.length,sections:newData.ids.length});
   console.log('PASS '+label+' / existing article identical, illustration loaded');
  }catch(err){
   failures.push(label+': '+String(err));
   results.push({label,status:'FAIL',error:String(err),errors});
   await newPage.screenshot({path:path.join(output,label+'-FAIL.png'),fullPage:true}).catch(()=>{});
  }finally{await orig.close();await newPage.close();}
 }
}finally{await browser.close();}
fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({results,failures},null,2));
for(const e of failures)console.error('FAIL '+e);
if(failures.length)process.exitCode=1;
