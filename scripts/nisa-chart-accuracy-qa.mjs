import assert from 'node:assert/strict'
import fs from 'node:fs'
const {chromium}=await import(process.env.OMG_PLAYWRIGHT_MODULE??'playwright')
const base=process.env.OMG_PREVIEW_URL??'http://127.0.0.1:4173'
const url=base+'/knowledge/nisa-limits-and-future-value#cases'
for(let i=0;i<60;i++){try{if((await fetch(url)).ok)break}catch{};await new Promise(r=>setTimeout(r,500))}
fs.mkdirSync('qa/nisa-chart',{recursive:true})
const browser=await chromium.launch({headless:true,args:['--no-sandbox']})
const reports=[]
for(const width of [1440,1024,768,390,320]){
 const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'})
 const errors=[]
 page.on('pageerror',e=>errors.push(String(e)))
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 try{
  await page.goto(url,{waitUntil:'networkidle'})
  await page.waitForSelector('.nisa-comparison__figure')
  await page.waitForTimeout(350)
  const heading=await page.locator('#cases h2').boundingBox()
  const header=await page.evaluate(()=>{const els=[...document.querySelectorAll('header')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.top<=1&&r.height>0&&['sticky','fixed'].includes(s.position)});return Math.max(0,...els.map(e=>e.getBoundingClientRect().bottom))})
  assert.ok(heading.y>=header-2&&heading.y>=0&&heading.y<330,'Anchor heading obscured or not reached: '+JSON.stringify({heading,header}))
  console.log('ANCHOR_'+width+' '+JSON.stringify({headingY:heading.y,header,scrollY:await page.evaluate(()=>scrollY),sectionY:await page.locator('#cases').evaluate(e=>e.getBoundingClientRect().top),scrollPadding:await page.evaluate(()=>getComputedStyle(document.documentElement).scrollPaddingTop),scrollMargin:await page.locator('#cases').evaluate(e=>getComputedStyle(e).scrollMarginTop)}))
  const nav=page.locator('.nisa-bank-sidebar nav a[aria-current=location]')
  assert.equal(await nav.getAttribute('href'),'#cases','Sidebar current state')
  assert.equal(await page.locator('.nisa-comparison__control button[aria-pressed=true]').textContent(),'15年')
  const initial=await page.screenshot({path:'qa/nisa-chart/'+width+'-viewport.jpg',type:'jpeg',quality:70,animations:'disabled'})
  await page.locator('#cases .nisa-comparison').screenshot({path:'qa/nisa-chart/'+width+'-comparison.png',animations:'disabled'})
  if(width===1440||width===390){
    // Compact review evidence for the supervising agent; the full screenshots remain in the artifact.
    const review=await page.locator('.nisa-comparison__figure').screenshot({type:'jpeg',quality:35,animations:'disabled'})
    const b64=review.toString('base64')
    for(let i=0;i<b64.length;i+=3500)console.log('VISUAL_'+width+'_'+String(i/3500).padStart(3,'0')+'='+b64.slice(i,i+3500))
  }
  const results=[]
  for(const year of [5,10,15,20]){
    await page.getByRole('group',{name:'積立期間'}).getByRole('button',{name:year+'年',exact:true}).click()
    await page.waitForFunction(y=>[...document.querySelectorAll('.nisa-comparison__row')].every(r=>Number(r.dataset.year)===y),year)
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
    const result=await page.evaluate(()=>{
      const chart=document.querySelector('#cases')
      const bars=[...chart.querySelectorAll('.nisa-comparison__bar')].map(bar=>{
        const track=bar.closest('.nisa-comparison__track'),row=bar.closest('.nisa-comparison__row')
        const r=bar.getBoundingClientRect(),tr=track.getBoundingClientRect()
        return {value:Number(bar.dataset.total),monthly:Number(row.dataset.monthly),year:Number(row.dataset.year),width:r.width,trackWidth:tr.width,left:r.left-tr.left,parts:[...bar.children].map(s=>s.getBoundingClientRect().width),axis:Number(track.dataset.axisMax),amount:row.querySelector('.nisa-comparison__amount').textContent}
      })
      const table=[...chart.querySelectorAll('.nisa-comparison__table tbody tr')].map(tr=>[...tr.cells].map(c=>c.textContent))
      return {bars,table,overflow:document.documentElement.scrollWidth-innerWidth,chartOverflow:chart.querySelector('.nisa-comparison').scrollWidth-chart.querySelector('.nisa-comparison').clientWidth,headings:document.querySelectorAll('.nisa-bank-section[id]').length,excluded:chart.querySelector('.nisa-comparison__excluded')?.textContent??null}
    })
    assert.equal(result.bars.length,year===20?2:3)
    assert.ok(result.overflow<=1&&result.chartOverflow<=1)
    assert.equal(result.headings,8);assert.equal(result.table.length,4)
    if(year===20)assert.ok(result.excluded.includes('保有・運用は継続できます'))
    for(const b of result.bars){
      const m=Math.pow(1.05,1/12)-1
      let expected=0;for(let k=0;k<year*12;k++)expected=expected*(1+m)+b.monthly
      assert.equal(b.year,year);assert.equal(b.axis,3000)
      assert.ok(Math.abs(b.value-expected)<0.01)
      assert.ok(Math.abs(b.width/b.trackWidth-b.value/30000000)<0.002,'Bar geometry: '+JSON.stringify(b))
      assert.ok(Math.abs(b.parts[0]/b.trackWidth-b.monthly*year*12/30000000)<0.002,'Principal geometry: '+JSON.stringify(b))
      assert.ok(Math.abs(b.parts.reduce((s,v)=>s+v,0)-b.width)<1)
      assert.ok(Math.abs(b.left)<1)
      assert.equal(b.amount,'約'+Math.round(expected/10000).toLocaleString('ja-JP')+'万円')
      assert.equal(result.table[[5,10,15,20].indexOf(year)][[10000,50000,100000].indexOf(b.monthly)+1],Math.round(expected/10000).toLocaleString('ja-JP'))
    }
    results.push({year,barCount:result.bars.length,overflow:result.overflow})
  }
  if(width===1440||width===390){
    const img=await page.locator('.nisa-comparison__figure').screenshot({path:'qa/nisa-chart/'+width+'-20-year.jpg',type:'jpeg',quality:45,animations:'disabled'})
    const b64=img.toString('base64')
    for(let i=0;i<b64.length;i+=3500)console.log('VISUAL20_'+width+'_'+String(i/3500).padStart(3,'0')+'='+b64.slice(i,i+3500))
    const tbl=await page.locator('.nisa-comparison__table').screenshot({type:'jpeg',quality:45,animations:'disabled'})
    const tb=tbl.toString('base64')
    for(let i=0;i<tb.length;i+=3500)console.log('VISUALTABLE_'+width+'_'+String(i/3500).padStart(3,'0')+'='+tb.slice(i,i+3500))
  }
  await page.evaluate(()=>document.getElementById('reuse').scrollIntoView({behavior:'instant',block:'start'}))
  await page.waitForTimeout(300)
  assert.equal(await nav.getAttribute('href'),'#reuse','Scroll-linked TOC state')
  assert.deepEqual(errors,[])
  reports.push({width,status:'PASS',results,header,headingY:heading.y,viewportImageBytes:initial.length})
 }catch(e){
  await page.screenshot({path:'qa/nisa-chart/'+width+'-FAIL.png',fullPage:true}).catch(()=>{})
  reports.push({width,status:'FAIL',error:String(e),errors})
 }
 await page.close()
}
await browser.close()
fs.writeFileSync('qa/nisa-chart/report.json',JSON.stringify(reports,null,2))
console.log(JSON.stringify(reports))
if(reports.some(r=>r.status!=='PASS'))process.exitCode=1
