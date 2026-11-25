import assert from 'node:assert/strict'
import fs from 'node:fs'
const {chromium}=await import(process.env.OMG_PLAYWRIGHT_MODULE??'playwright')
const base='https://preview-editorial-common-pol.okinawa-money-guide.pages.dev'
const alternate='https://564ca95f.okinawa-money-guide.pages.dev'
const old='https://73d07fb8.okinawa-money-guide.pages.dev'
const routes=['/knowledge','/knowledge/mortgage-comparison','/knowledge/nisa-limits-and-future-value','/','/simulators/nisa','/simulators/mortgage','/simulators/ideco','/simulators/military-land','/simulators/taxable-income','/about','/trust']
const browser=await chromium.launch({headless:true,args:['--no-sandbox']})
fs.mkdirSync('qa/editorial-common',{recursive:true})
const results=[]
const emit=(n,b)=>{const s=b.toString('base64');for(let i=0;i<s.length;i+=3500)console.log(n+'_'+String(i/3500).padStart(3,'0')+'='+s.slice(i,i+3500))}
let deployed=base
try{
 const probe=await browser.newPage()
 let ready=false
 for(let t=0;t<30&&!ready;t++){
   for(const host of [base,alternate]){
    try{await probe.goto(host+'/knowledge',{waitUntil:'domcontentloaded',timeout:6000});await probe.waitForSelector('#published',{timeout:1500});deployed=host;ready=true;break}catch{}
   }
   if(!ready)await new Promise(r=>setTimeout(r,1500))
 }
 await probe.close()
 assert.ok(ready,'Preview not ready')
 for(const width of [1440,1024,768,390,320]){
  const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'})
  for(const [i,path] of routes.entries()){
   if(width!==1440&&i>3)continue
   const errors=[];const onError=e=>errors.push(String(e));page.on('pageerror',onError)
   try{
    const res=await page.goto(deployed+path,{waitUntil:'domcontentloaded',timeout:25000});assert.equal(res.status(),200)
    await page.waitForSelector('.top-option02__header');await page.evaluate(()=>document.fonts.ready)
    const m=await page.evaluate(()=>{
      const h=document.querySelector('.top-option02__header'),f=document.querySelector('.site-footer')
      const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}}
      return {h:getComputedStyle(h).backgroundColor,f:getComputedStyle(f).backgroundColor,overflow:document.documentElement.scrollWidth-innerWidth,heading:document.querySelector('h1').textContent,headH:h.getBoundingClientRect().height,body:document.querySelector('.knowledge-article-body')?rect(document.querySelector('.knowledge-article-body')):null}
    })
    assert.equal(m.f,'rgb(21, 50, 72)');if(i<3)assert.equal(m.h,m.f);else assert.notEqual(m.h,m.f)
    assert.ok(m.overflow<=1,'horizontal overflow '+JSON.stringify(m))
    if(i===0){
      assert.equal(await page.locator('.info-shell > section').first().getAttribute('id'),'published')
      assert.equal(await page.locator('#published article').count(),2)
      assert.equal(await page.locator('#published time').count(),2)
      assert.equal(await page.locator('.simulator-links a').count(),5)
      assert.equal(await page.locator('.knowledge-hero-nav a').count(),4)
      for(const id of ['borrow','save','grow','protect'])assert.equal(await page.locator('#'+id).count(),1)
    }
    if(i===1){
      assert.equal(await page.locator('.knowledge-article-aside nav a').count(),7)
      assert.equal(await page.locator('#article-sources a').count(),3)
      assert.equal(await page.locator('#mortgage-faq details').count(),3)
      for(const id of ['overview','repayment-methods','interest-and-total','fees','questions','mortgage-faq','article-sources'])assert.equal(await page.locator('#'+id).count(),1)
      const table=await page.locator('.knowledge-data-table').evaluate(e=>({scroll:e.scrollWidth,client:e.clientWidth}));assert.ok(table.scroll<=table.client+1,JSON.stringify(table))
    }
    if(i===2){
      assert.equal(await page.locator('.nisa-bank-section[id]').count(),8)
      assert.equal(await page.locator('.nisa-bank-sidebar nav a').count(),8)
    }
    if(i<3&&[1440,390,320].includes(width)){
      await page.screenshot({path:'qa/editorial-common/'+i+'-'+width+'.jpg',type:'jpeg',quality:85})
      if(i<2&&width!==320)emit('POLISH_'+i+'_'+width,await page.screenshot({type:'jpeg',quality:55}))
    }
    if(i===1){
      if(width<=760)await page.locator('.knowledge-article-mobile-toc summary').click()
      const toc=width<=760?'.knowledge-article-mobile-toc':'.knowledge-article-aside'
      await page.locator(toc+' a[href="#fees"]').click()
      await page.waitForTimeout(300)
      assert.equal(new URL(page.url()).hash,'#fees')
      const section=await page.locator('#fees').boundingBox()
      assert.ok(section.y>=m.headH-1&&section.y<350,'anchor obstructed '+JSON.stringify(section))
      await page.locator('#mortgage-faq summary').first().click()
      assert.equal(await page.locator('#mortgage-faq details').first().getAttribute('open'),'')
      if([1440,390].includes(width)){
        await page.locator('#mortgage-faq').scrollIntoViewIfNeeded()
        await page.screenshot({path:'qa/editorial-common/faq-'+width+'.jpg',type:'jpeg',quality:85})
        emit('FAQ_'+width,await page.screenshot({type:'jpeg',quality:50}))
      }
    }
    if(i===0){
      await page.locator('.knowledge-hero-nav a[href="#grow"]').click()
      assert.equal(new URL(page.url()).hash,'#grow')
      await page.locator('#published h3 a').first().click()
      await page.waitForURL('**/knowledge/nisa-limits-and-future-value')
    }
    assert.deepEqual(errors,[])
    results.push({width,path,status:'PASS',m})
   }catch(e){results.push({width,path,status:'FAIL',error:String(e),errors});await page.screenshot({path:'qa/editorial-common/'+i+'-'+width+'-FAIL.jpg',type:'jpeg',quality:85}).catch(()=>{})}
   finally{page.off('pageerror',onError)}
  }
  await page.close()
 }
}finally{await browser.close();fs.writeFileSync('qa/editorial-common/report.json',JSON.stringify(results,null,2));console.log('POLISH_REPORT '+JSON.stringify(results.map(x=>({width:x.width,path:x.path,status:x.status,error:x.error,overflow:x.m?.overflow,header:x.m?.h,footer:x.m?.f}))))}
if(results.length!==27||results.some(r=>r.status!=='PASS'))process.exitCode=1
