import assert from 'node:assert/strict'
import fs from 'node:fs'
const { chromium } = await import(process.env.OMG_PLAYWRIGHT_MODULE ?? 'playwright')
const ready=process.env.OMG_ART_READY==='true'
const b=await chromium.launch({headless:true,args:['--no-sandbox']})
const out='qa/approved-art'
fs.mkdirSync(out,{recursive:true})
const results=[]
const emit=(name,img)=>{const data=img.toString('base64');for(let i=0;i<data.length;i+=3500)console.log(name+'_'+String(i/3500).padStart(3,'0')+'='+data.slice(i,i+3500))}
try{
 const probe=await b.newPage()
 for(let i=0;i<20;i++){try{await probe.goto('http://127.0.0.1:4173/knowledge',{timeout:3000});break}catch{await new Promise(r=>setTimeout(r,1000))}}
 await probe.close()
 for(const width of [1440,1024,768,390,320]){
   const page=await b.newPage({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'})
   for(const [topic,path] of [['knowledge','/knowledge'],['mortgage','/knowledge/mortgage-comparison'],['nisa','/knowledge/nisa-limits-and-future-value'],['home','/']]){
    const errors=[];const err=e=>errors.push(String(e));page.on('pageerror',err)
    try{
     const res=await page.goto('http://127.0.0.1:4173'+path,{waitUntil:'networkidle'});assert.equal(res.status(),200)
     await page.evaluate(()=>document.fonts.ready)
     assert.equal(await page.locator('.top-option02__header').getAttribute('class'),'top-option02__header')
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=1))
     assert.equal(await page.locator('[data-illustration-topic]').count(),ready&&(topic==='knowledge'||topic==='mortgage')?1:0)
     if(ready&&(topic==='knowledge'||topic==='mortgage')){
       const art=page.locator('[data-illustration-topic="'+topic+'"] img')
       await art.scrollIntoViewIfNeeded()
       const image=await art.evaluate(async e=>{await e.decode();return {w:e.naturalWidth,h:e.naturalHeight,rect:e.getBoundingClientRect().width}})
       assert.equal(image.w,1536);assert.equal(image.h,1024);assert.ok(image.rect>0&&image.rect<=width)
     }
     if(topic==='mortgage'){
       const region=page.getByRole('region',{name:'3,000万円の返済方式別試算'})
       for(const amount of ['99,379円','121,429円','41,739,109円','40,525,000円'])assert.equal(await region.getByText(amount,{exact:true}).count(),1)
       assert.equal(await page.locator('#mortgage-faq details').count(),5)
       assert.equal(await page.locator('#article-sources a').count(),6)
       const widths=await page.locator('.knowledge-data-table').evaluateAll(es=>es.map(e=>[e.scrollWidth,e.clientWidth]));assert.ok(widths.every(([s,c])=>s<=c+1),JSON.stringify(widths))
       if([1440,390].includes(width)){
        await region.scrollIntoViewIfNeeded()
        emit('EXAMPLE_'+width,await page.screenshot({path:out+'/example-'+width+'.jpg',type:'jpeg',quality:65}))
       }
     }
     if(topic==='knowledge'){assert.equal(await page.locator('#published article').count(),2);assert.equal(await page.locator('.simulator-links a').count(),5)}
     if(topic==='nisa')assert.equal(await page.locator('.nisa-bank-section[id]').count(),8)
     if([1440,390].includes(width)&&['knowledge','mortgage'].includes(topic)){
       await page.evaluate(()=>window.scrollTo(0,0))
       emit('ART_'+topic+'_'+width,await page.screenshot({path:out+'/'+topic+'-'+width+'.jpg',type:'jpeg',quality:65}))
       if(ready)emit('IMG_'+topic+'_'+width,await page.locator('[data-illustration-topic]').screenshot({path:out+'/'+topic+'-image-'+width+'.jpg',type:'jpeg',quality:65}))
     }
     assert.deepEqual(errors,[])
     results.push({width,topic,status:'PASS',ready})
    }catch(e){results.push({width,topic,status:'FAIL',error:String(e),errors});await page.screenshot({path:out+'/'+topic+'-'+width+'-FAIL.jpg'}).catch(()=>{})}
    finally{page.off('pageerror',err)}
   }
   await page.close()
 }
}finally{await b.close();fs.writeFileSync(out+'/report.json',JSON.stringify(results,null,2));console.log('ART_REPORT '+JSON.stringify(results))}
if(results.length!==20||results.some(x=>x.status!=='PASS'))process.exitCode=1
