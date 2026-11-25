import assert from 'node:assert/strict'
import fs from 'node:fs'
const {chromium}=await import(process.env.OMG_PLAYWRIGHT_MODULE??'playwright')
const route='/knowledge/nisa-limits-and-future-value'
const base='https://preview-nisa-editorial-masthead-20261125.okinawa-money-guide.pages.dev'
const browser=await chromium.launch({headless:true,args:['--no-sandbox']})
fs.mkdirSync('qa/nisa-masthead',{recursive:true})
const report=[]
function emit(name,b){const s=b.toString('base64');for(let i=0;i<s.length;i+=3500)console.log(name+'_'+String(i/3500).padStart(3,'0')+'='+s.slice(i,i+3500))}
async function verify(kind,url){
 for(const width of [1440,1024,768,390,320]){
  const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'})
  const errors=[]
  page.on('pageerror',e=>errors.push(String(e)))
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  try{
   const response=await page.goto(url+route,{waitUntil:'networkidle',timeout:45000})
   assert.equal(response.status(),200)
   await page.evaluate(()=>document.fonts.ready)
   const m=await page.evaluate(()=>{
    const hero=document.querySelector('.nisa-bank-hero'),panel=hero.querySelector('.nisa-editorial-keyfacts'),copy=hero.querySelector('.nisa-bank-hero__copy'),head=hero.querySelector('h1')
    const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}}
    return {marker:getComputedStyle(hero).getPropertyValue('--omg-editorial-masthead-v2').trim(),background:getComputedStyle(hero).backgroundImage,panelColor:getComputedStyle(panel).backgroundColor,hero:rect(hero),panel:rect(panel),copy:rect(copy),heading:rect(head),headingText:head.textContent,overflow:document.documentElement.scrollWidth-innerWidth,panelOverflow:panel.scrollWidth-panel.clientWidth,copyOverflow:copy.scrollWidth-copy.clientWidth,sections:document.querySelectorAll('.nisa-bank-section[id]').length,values:[...panel.querySelectorAll('dd strong')].map(e=>e.textContent)}
   })
   assert.equal(m.marker,'1')
   assert.equal(m.background,'none')
   assert.equal(m.panelColor,'rgb(21, 54, 92)')
   assert.equal(m.headingText,'NISAの非課税枠と、積立額・将来額の考え方')
   assert.deepEqual(m.values,['1,800','120','240'])
   assert.equal(m.sections,8)
   assert.ok(m.overflow<=1&&m.panelOverflow<=1&&m.copyOverflow<=1,JSON.stringify(m))
   assert.ok(m.panel.right<=width+1&&m.heading.right<=width+1)
   assert.ok(width>1050?m.panel.left>=m.copy.right-1:m.panel.top>=m.copy.bottom-1)
   assert.ok(m.panel.bottom<=m.hero.bottom+1)
   assert.deepEqual(errors,[])
   const image=await page.screenshot({path:'qa/nisa-masthead/'+kind+'-'+width+'.jpg',type:'jpeg',quality:78,animations:'disabled'})
   if(kind==='deployed'&&(width===1440||width===390))emit('MASTHEAD_'+width,await page.screenshot({type:'jpeg',quality:43,animations:'disabled'}))
   report.push({kind,width,status:'PASS',metrics:m,bytes:image.length})
  }catch(e){report.push({kind,width,status:'FAIL',error:String(e),errors});await page.screenshot({path:'qa/nisa-masthead/'+kind+'-'+width+'-FAIL.jpg',type:'jpeg',quality:75}).catch(()=>{})}
  await page.close()
 }
}
try{await verify('local','http://127.0.0.1:4173');await verify('deployed',base)}finally{await browser.close()}
fs.writeFileSync('qa/nisa-masthead/report.json',JSON.stringify(report,null,2))
console.log('MASTHEAD_REPORT '+JSON.stringify(report.map(r=>({kind:r.kind,width:r.width,status:r.status,error:r.error,overflow:r.metrics?.overflow,panelOverflow:r.metrics?.panelOverflow}))))
if(report.length!==10||report.some(r=>r.status!=='PASS'))process.exitCode=1
