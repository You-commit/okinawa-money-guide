import assert from 'node:assert/strict'
import fs from 'node:fs'
const {chromium}=await import(process.env.OMG_PLAYWRIGHT_MODULE??'playwright')
const base='https://preview-article-navy-header.okinawa-money-guide.pages.dev'
const before='https://ce04b6b0.okinawa-money-guide.pages.dev'
const routes=['/knowledge','/knowledge/nisa-limits-and-future-value','/knowledge/mortgage-comparison','/','/simulators/nisa','/simulators/ideco','/simulators/mortgage','/simulators/military-land','/simulators/taxable-income','/about','/trust','/knowledge/does-not-exist']
const b=await chromium.launch({headless:true,args:['--no-sandbox']})
fs.mkdirSync('qa/article-header',{recursive:true})
const reports=[]
function emit(name,img){const s=img.toString('base64');for(let i=0;i<s.length;i+=3500)console.log(name+'_'+String(i/3500).padStart(3,'0')+'='+s.slice(i,i+3500))}
async function ready(){
 const p=await b.newPage()
 try{
 for(let i=0;i<45;i++){
  try{await p.goto(base+routes[1],{waitUntil:'domcontentloaded',timeout:8000});await p.waitForSelector('.top-option02__header--editorial',{timeout:2500});return}catch{}
  await new Promise(r=>setTimeout(r,1800))
 }
 throw Error('Deployed editorial header not available')
 }finally{await p.close()}
}
const metric=()=>{const h=document.querySelector('.top-option02__header'),hero=document.querySelector('.nisa-bank-hero'),brand=h.querySelector('.top-option02__brand-copy strong'),nav=h.querySelector('.top-option02__navigation'),cta=h.querySelector('.top-option02__header-cta'),link=nav.querySelector('a[href="/knowledge"]');const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};return {navy:h.classList.contains('top-option02__header--editorial'),bg:getComputedStyle(h).backgroundColor,header:rect(h),brand:getComputedStyle(brand).color,nav:getComputedStyle(nav).color,cta:getComputedStyle(cta).backgroundColor,current:link.getAttribute('aria-current'),overflow:document.documentElement.scrollWidth-innerWidth,hero:hero?{rect:rect(hero),bg:getComputedStyle(hero).backgroundImage,text:hero.innerText}:null,brandRect:rect(brand),logoLoaded:h.querySelector('img').complete&&h.querySelector('img').naturalWidth>0}}
try{
 await ready()
 for(const width of [1440,1024,768,390,320]){
  const page=await b.newPage({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'})
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  for(const [i,route] of routes.entries()){
   if(width!==1440&&i>=3&&i!==3&&i!==4)continue
   try{
    errors.length=0
    await page.goto(before+route,{waitUntil:'networkidle',timeout:35000})
    await page.waitForSelector('.top-option02__header')
    await page.evaluate(()=>document.fonts.ready)
    const old=await page.evaluate(metric)
    errors.length=0
    const response=await page.goto(base+route,{waitUntil:'networkidle',timeout:35000})
    assert.equal(response.status(),200)
    await page.evaluate(()=>document.fonts.ready)
    const m=await page.evaluate(metric)
    assert.equal(m.navy,i<3);assert.equal(m.bg,i<3?'rgb(21, 54, 92)':old.bg)
    assert.equal(m.brand,i<3?'rgb(255, 255, 255)':old.brand)
    assert.equal(m.current,i===0?'page':i<3?'location':null)
    assert.equal(m.header.h,old.header.h)
    assert.ok(m.brandRect.right<=width&&m.logoLoaded)
    assert.ok(m.overflow<=Math.max(1,old.overflow))
    assert.deepEqual(m.hero,old.hero)
    if(i>=3){assert.equal(m.nav,old.nav);assert.equal(m.cta,old.cta)}
    if(i<3){
      if(width===1440||width===390){await page.screenshot({path:'qa/article-header/'+i+'-'+width+'.jpg',type:'jpeg',quality:80});if(i===1||width===1440)emit('HEADER_'+i+'_'+width,await page.screenshot({type:'jpeg',quality:52}))}
      const toggle=page.getByRole('button',{name:'メニューを開閉する'})
      const sim=page.getByRole('button',{name:'シミュレーター',exact:true})
      if(width<=900){await toggle.click();assert.equal(await toggle.getAttribute('aria-expanded'),'true');assert.equal(await page.locator('.top-option02__navigation').evaluate(e=>getComputedStyle(e).color),'rgb(21, 54, 92)')}
      await sim.click();assert.equal(await sim.getAttribute('aria-expanded'),'true');assert.equal(await page.locator('.top-option02__simulator-menu-card:visible').count(),5)
      const panel=await page.locator('.top-option02__simulator-menu-panel').boundingBox()
      assert.ok(panel.x>=-1&&panel.x+panel.width<=width+1,JSON.stringify(panel))
      if(i===1&&(width===1440||width===390)){await page.screenshot({path:'qa/article-header/menu-'+width+'.jpg',type:'jpeg',quality:80});emit('MENU_'+width,await page.screenshot({type:'jpeg',quality:50}))}
      await page.keyboard.press('Escape');assert.equal(await sim.getAttribute('aria-expanded'),'false')
      if(width<=900){await page.keyboard.press('Escape');assert.equal(await toggle.getAttribute('aria-expanded'),'false')}
    }
    assert.deepEqual(errors,[])
    reports.push({width,route,status:'PASS',headerHeight:m.header.h,overflow:m.overflow})
   }catch(e){reports.push({width,route,status:'FAIL',error:String(e),errors});await page.screenshot({path:'qa/article-header/'+i+'-'+width+'-FAIL.jpg',type:'jpeg',quality:80}).catch(()=>{})}
  }
  await page.close()
 }
}finally{await b.close()}
fs.writeFileSync('qa/article-header/report.json',JSON.stringify(reports,null,2))
console.log('HEADER_REPORT '+JSON.stringify(reports))
if(reports.length!==32||reports.some(r=>r.status!=='PASS'))process.exitCode=1
