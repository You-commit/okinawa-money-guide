import assert from 'node:assert/strict'
import fs from 'node:fs'
const {chromium}=await import(process.env.OMG_PLAYWRIGHT_MODULE??'playwright')
const route='/knowledge/nisa-limits-and-future-value'
const base='https://preview-nisa-heading-v3.okinawa-money-guide.pages.dev'
const browser=await chromium.launch({headless:true,args:['--no-sandbox']})
fs.mkdirSync('qa/nisa-heading',{recursive:true})
const report=[]
function emit(name,b){const s=b.toString('base64');for(let i=0;i<s.length;i+=3500)console.log(name+'_'+String(i/3500).padStart(3,'0')+'='+s.slice(i,i+3500))}
try {
 const probe=await browser.newPage()
 for(let i=0;i<35;i++){
   try{await probe.goto(base+route,{waitUntil:'domcontentloaded',timeout:8000});await probe.waitForSelector('.nisa-bank-hero',{timeout:3000});if(await probe.locator('.nisa-bank-hero').evaluate(e=>getComputedStyle(e).getPropertyValue('--omg-nisa-heading-review-v3').trim())==='1')break}catch{}
   await new Promise(r=>setTimeout(r,2000))
 }
 await probe.close()
 for(const width of [1440,1024,768,390,320]){
  const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'})
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  try{
    const res=await page.goto(base+route,{waitUntil:'networkidle',timeout:45000});assert.equal(res.status(),200)
    await page.evaluate(()=>document.fonts.ready)
    const m=await page.evaluate(()=>{
      const hero=document.querySelector('.nisa-bank-hero'),h=hero.querySelector('h1'),lead=hero.querySelector('.nisa-bank-hero__lead'),meta=hero.querySelector('.nisa-bank-hero__meta'),nav=document.querySelector('.nisa-bank-nav-shell'),article=document.querySelector('#basic h2')
      const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}}
      return {marker:getComputedStyle(hero).getPropertyValue('--omg-nisa-heading-review-v3').trim(),bg:getComputedStyle(hero).backgroundColor,bgImage:getComputedStyle(hero).backgroundImage,headingText:h.textContent,headingFont:parseFloat(getComputedStyle(h).fontSize),hero:rect(hero),heading:rect(h),lead:rect(lead),meta:rect(meta),nav:rect(nav),article:rect(article),overflow:document.documentElement.scrollWidth-innerWidth,sectionCount:document.querySelectorAll('.nisa-bank-section[id]').length,metaCount:meta.querySelectorAll('time').length}
    })
    assert.equal(m.marker,'1');assert.equal(m.bg,'rgb(220, 235, 240)');assert.equal(m.bgImage,'none')
    assert.equal(m.headingText,'NISAの非課税枠と、積立額・将来額の考え方')
    assert.equal(m.sectionCount,8);assert.equal(m.metaCount,3);assert.ok(m.overflow<=1)
    assert.ok(m.heading.right<=width+1&&m.lead.right<=width+1&&m.meta.right<=width+1)
    assert.ok(m.meta.bottom<=m.hero.bottom+1);assert.ok(m.lead.top>=m.heading.bottom-1)
    if(width>=1024){assert.ok(m.hero.height<=280,'Masthead too tall: '+JSON.stringify(m));assert.ok(m.article.top<700,'Article entry too low: '+JSON.stringify(m))}
    assert.deepEqual(errors,[])
    const screenshot=await page.screenshot({path:'qa/nisa-heading/'+width+'.jpg',type:'jpeg',quality:80,animations:'disabled'})
    if(width===1440||width===390||width===320)emit('HEADING_'+width,await page.screenshot({type:'jpeg',quality:48,animations:'disabled'}))
    report.push({width,status:'PASS',metrics:m,bytes:screenshot.length})
  }catch(e){report.push({width,status:'FAIL',error:String(e),errors});await page.screenshot({path:'qa/nisa-heading/'+width+'-FAIL.jpg',type:'jpeg',quality:75}).catch(()=>{})}
  await page.close()
 }
}finally{await browser.close()}
fs.writeFileSync('qa/nisa-heading/report.json',JSON.stringify(report,null,2))
console.log('HEADING_REPORT '+JSON.stringify(report.map(r=>({width:r.width,status:r.status,error:r.error,heroHeight:r.metrics?.hero.height,articleY:r.metrics?.article.top,headingFont:r.metrics?.headingFont,overflow:r.metrics?.overflow}))))
if(report.length!==5||report.some(r=>r.status!=='PASS'))process.exitCode=1
