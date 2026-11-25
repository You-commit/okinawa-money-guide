import assert from 'node:assert/strict'
import fs from 'node:fs'
const {chromium}=await import(process.env.OMG_PLAYWRIGHT_MODULE??'playwright')
const url='http://127.0.0.1:4173/knowledge/nisa-limits-and-future-value'
for(let i=0;i<50;i++){try{if((await fetch(url)).ok)break}catch{};await new Promise(r=>setTimeout(r,500))}
fs.mkdirSync('qa/nisa-chart',{recursive:true})
const browser=await chromium.launch({headless:true,args:['--no-sandbox']})
const reports=[]
for(const width of [1440,390,320]){
 const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1})
 const errors=[]
 page.on('pageerror',e=>errors.push(String(e)))
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 await page.goto(url,{waitUntil:'networkidle'})
 const result=await page.evaluate(()=>{
   const chart=document.querySelector('#cases')
   const plots=[...chart.querySelectorAll('.nisa-accurate-chart__plot')]
   const bars=[...chart.querySelectorAll('.nisa-accurate-chart__bar')].map(bar=>{
     const p=bar.closest('.nisa-accurate-chart__plot')
     const r=bar.getBoundingClientRect(), pr=p.getBoundingClientRect()
     const col=bar.parentElement
     return {value:Number(bar.dataset.total),monthly:Number(col.dataset.monthly),year:Number(col.dataset.year),height:r.height,plotHeight:pr.height,bottom:r.bottom-pr.bottom,segments:[...bar.children].map(s=>s.getBoundingClientRect().height)}
   })
   return {axis:plots.map(p=>Number(p.dataset.axisMax)),bars,overflow:document.documentElement.scrollWidth-innerWidth,headings:document.querySelectorAll('.nisa-bank-section[id]').length,rows:chart.querySelectorAll('.nisa-accurate-chart__data tbody tr').length,blank:chart.querySelectorAll('.nisa-accurate-chart__unmodeled').length}
 })
 try{
  assert.deepEqual(result.axis,[3000,3000,3000])
  assert.equal(result.bars.length,11);assert.equal(result.rows,11);assert.equal(result.blank,1)
  assert.equal(result.headings,8);assert.ok(result.overflow<=1);assert.deepEqual(errors,[])
  for(const b of result.bars){
    const m=Math.pow(1.05,1/12)-1
    let expected=0;for(let i=0;i<b.year*12;i++)expected=expected*(1+m)+b.monthly
    assert.ok(Math.abs(b.value-expected)<0.01)
    assert.ok(Math.abs(b.height/b.plotHeight-b.value/30000000)<0.002)
    assert.ok(Math.abs(b.bottom)<1)
    assert.ok(Math.abs(b.segments.reduce((s,v)=>s+v,0)-b.height)<1)
    assert.ok(Math.abs(b.segments[0]/b.plotHeight-b.monthly*b.year*12/30000000)<0.002)
  }
  await page.locator('#cases').screenshot({path:'qa/nisa-chart/'+width+'.png'})
  reports.push({width,status:'PASS',...result})
 }catch(e){
  await page.screenshot({path:'qa/nisa-chart/'+width+'-FAIL.png',fullPage:true})
  reports.push({width,status:'FAIL',error:String(e),errors,...result})
 }
 await page.close()
}
await browser.close()
fs.writeFileSync('qa/nisa-chart/report.json',JSON.stringify(reports,null,2))
console.log(JSON.stringify(reports.map(r=>({width:r.width,status:r.status,error:r.error}))))
if(reports.some(r=>r.status!=='PASS'))process.exitCode=1
