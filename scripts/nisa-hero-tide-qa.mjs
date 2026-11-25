import assert from 'node:assert/strict'
import fs from 'node:fs'
const { chromium } = await import(process.env.OMG_PLAYWRIGHT_MODULE ?? 'playwright')
const route='/knowledge/nisa-limits-and-future-value'
const local='http://127.0.0.1:4173'
const remote='https://preview-nisa-hero-tide.okinawa-money-guide.pages.dev'
const browser=await chromium.launch({headless:true,args:['--no-sandbox']})
fs.mkdirSync('qa/nisa-hero',{recursive:true})
const reports=[]
const marker=()=>getComputedStyle(document.querySelector('.nisa-bank-hero')).getPropertyValue('--omg-editorial-tide-v1').trim()
async function ready(base){
  const probe=await browser.newPage()
  try{
    for(let i=0;i<30;i++){
      try{await probe.goto(base+route,{waitUntil:'domcontentloaded',timeout:8000});await probe.waitForSelector('.nisa-bank-hero',{timeout:5000});if(await probe.evaluate(marker)==='1')return}
      catch{}
      await new Promise(r=>setTimeout(r,2500))
    }
    throw Error('Preview style marker missing at '+base)
  }finally{await probe.close()}
}
function emit(name,b){const s=b.toString('base64');for(let i=0;i<s.length;i+=3500)console.log(name+'_'+String(i/3500).padStart(3,'0')+'='+s.slice(i,i+3500))}
try{
  for(const [kind,base] of [['local',local],['deployed',remote]]){
    await ready(base)
    for(const width of [1440,1024,768,390,320]){
      const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'})
      const errors=[]
      page.on('pageerror',e=>errors.push(String(e)))
      page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
      try{
        const response=await page.goto(base+route,{waitUntil:'networkidle',timeout:60000})
        assert.equal(response.status(),200)
        await page.evaluate(()=>document.fonts.ready)
        const metrics=await page.evaluate(()=>{
          const hero=document.querySelector('.nisa-bank-hero'), h=hero.querySelector('h1'),lead=hero.querySelector('.nisa-bank-hero__lead'),meta=hero.querySelector('.nisa-bank-hero__meta')
          const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}}
          const background=getComputedStyle(hero).backgroundImage
          const motif=getComputedStyle(hero,'::after')
          return {marker:getComputedStyle(hero).getPropertyValue('--omg-editorial-tide-v1').trim(),background,motif:motif.backgroundImage.startsWith('url('),motifDisplay:motif.display,hero:rect(hero),heading:rect(h),lead:rect(lead),meta:rect(meta),headingText:h.textContent,leadText:lead.textContent,overflow:document.documentElement.scrollWidth-innerWidth,sectionCount:document.querySelectorAll('.nisa-bank-section[id]').length,headingFont:parseFloat(getComputedStyle(h).fontSize),metaColor:getComputedStyle(meta.querySelector('dt')).color}
        })
        assert.equal(metrics.marker,'1')
        assert.ok(metrics.background.includes('gradient'))
        assert.ok(metrics.motif)
        assert.equal(metrics.motifDisplay==='none',width<=760)
        assert.equal(metrics.headingText,'NISAの非課税枠と、積立額・将来額の考え方')
        assert.equal(metrics.sectionCount,8)
        assert.ok(metrics.overflow<=1)
        assert.ok(metrics.heading.right<=width&&metrics.lead.right<=width&&metrics.meta.right<=width)
        assert.ok(metrics.meta.bottom<=metrics.hero.bottom+1)
        assert.deepEqual(errors,[])
        await page.screenshot({path:'qa/nisa-hero/'+kind+'-'+width+'.jpg',type:'jpeg',quality:80,animations:'disabled'})
        if(kind==='deployed'&&(width===1440||width===390)){
          const shot=await page.screenshot({type:'jpeg',quality:50,animations:'disabled'})
          emit('HERO_'+width,shot)
        }
        reports.push({kind,width,status:'PASS',metrics})
      }catch(e){reports.push({kind,width,status:'FAIL',error:String(e),errors});await page.screenshot({path:'qa/nisa-hero/'+kind+'-'+width+'-FAIL.png',fullPage:true}).catch(()=>{})}
      finally{await page.close()}
    }
  }
}catch(e){reports.push({status:'FAIL',error:String(e)})}
finally{await browser.close()}
fs.writeFileSync('qa/nisa-hero/report.json',JSON.stringify(reports,null,2))
console.log(JSON.stringify(reports.map(r=>({kind:r.kind,width:r.width,status:r.status,error:r.error,overflow:r.metrics?.overflow,headingFont:r.metrics?.headingFont}))))
if(reports.length!==10||reports.some(r=>r.status!=='PASS'))process.exitCode=1
