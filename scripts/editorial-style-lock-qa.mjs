import assert from 'node:assert/strict'
import fs from 'node:fs'
const {chromium}=await import(process.env.OMG_PLAYWRIGHT_MODULE??'playwright')
const origin='http://127.0.0.1:4173'
const b=await chromium.launch({headless:true,args:['--no-sandbox']})
const results=[]
fs.mkdirSync('qa/style-lock',{recursive:true})
const emit=(n,img)=>{const s=img.toString('base64');for(let i=0;i<s.length;i+=3500)console.log(n+'_'+String(i/3500).padStart(3,'0')+'='+s.slice(i,i+3500))}
try{
 const p=await b.newPage()
 for(let i=0;i<20;i++){try{await p.goto(origin+'/knowledge',{timeout:5000});break}catch{await new Promise(r=>setTimeout(r,1000))}}
 await p.close()
 for(const width of [1440,1024,768,390,320]){
  const page=await b.newPage({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'})
  for(const [topic,path] of [['knowledge','/knowledge'],['mortgage','/knowledge/mortgage-comparison'],['nisa','/knowledge/nisa-limits-and-future-value'],['home','/']]){
   try{
    const response=await page.goto(origin+path,{waitUntil:'networkidle'});assert.equal(response.status(),200);await page.evaluate(()=>document.fonts.ready)
    const header=await page.locator('.top-option02__header').evaluate(e=>({cls:e.className,bg:getComputedStyle(e).backgroundColor}))
    assert.equal(header.cls,'top-option02__header')
    assert.ok(header.bg.includes('255, 255, 255'),JSON.stringify(header))
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.ok(overflow<=1)
    if(topic==='knowledge'||topic==='mortgage'){
      const fig=page.locator('[data-illustration-topic="'+topic+'"]')
      assert.equal(await fig.count(),1)
      const metrics=await fig.evaluate(async e=>{
       const svg=e.querySelector('svg'),img=svg.querySelector('image')
       const source=new Image();source.src=img.getAttribute('href');await source.decode()
       const groups=Array.from(svg.querySelectorAll('g')).map(g=>{const r=g.querySelector('rect').getBBox(),t=g.querySelector('text').getBBox();return {fits:t.x>=r.x&&t.x+t.width<=r.x+r.width&&t.y>=r.y&&t.y+t.height<=r.y+r.height,text:g.textContent}})
       return {source:img.getAttribute('href'),natural:[source.naturalWidth,source.naturalHeight],width:svg.getBoundingClientRect().width,groups}
      })
      assert.equal(metrics.source,'/article-media/nisa-questions-illustration.webp')
      assert.deepEqual(metrics.natural,[1200,900]);assert.ok(metrics.groups.every(g=>g.fits),JSON.stringify(metrics))
      if(width===1440||width===390){
        await fig.scrollIntoViewIfNeeded();const img=await fig.screenshot({type:'jpeg',quality:90,path:'qa/style-lock/'+topic+'-'+width+'.jpg'})
        emit('STYLE_'+topic+'_'+width,img)
      }
      results.push({topic,width,status:'PASS',metrics,header})
    }else{
      assert.equal(await page.locator('.editorial-questions-illustration').count(),0)
      if(topic==='nisa')assert.equal(await page.locator('.nisa-bank-editorial-illustration img').getAttribute('src'),'/article-media/nisa-questions-illustration.webp')
      results.push({topic,width,status:'PASS',header})
    }
   }catch(e){results.push({topic,width,status:'FAIL',error:String(e)})}
  }
  await page.close()
 }
}finally{await b.close();fs.writeFileSync('qa/style-lock/report.json',JSON.stringify(results,null,2));console.log('STYLE_REPORT '+JSON.stringify(results))}
if(results.length!==20||results.some(r=>r.status!=='PASS'))process.exitCode=1
