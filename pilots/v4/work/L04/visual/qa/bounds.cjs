'use strict';
const fs=require('node:fs');
const path=require('node:path');
const puppeteer=require(process.env.PUPPETEER_MODULE||'puppeteer-core');
const {frame}=require('../scene.cjs');
async function main(){
 const lesson=JSON.parse(fs.readFileSync(process.argv[2]||path.resolve(__dirname,'../../lesson.json'),'utf8'));
 const positions=[.01,.14,.24,.42,.54,.68,.77,.88,.98];
 const browser=await puppeteer.launch({executablePath:process.env.CHROMIUM||'chromium',headless:true,pipe:true,args:['--disable-dev-shm-usage','--disable-background-networking','--no-sandbox']});
 const bad=[];let checks=0;
 try{
  const page=await browser.newPage();await page.setViewport({width:1920,height:1080});await page.setContent('<style>*{margin:0;padding:0}svg{display:block}</style><main></main>');
  for(const [index,s] of lesson.scenes.entries())for(const p of positions){
    const duration=s.duration||(s.durationFrames?s.durationFrames/24:60);
    const svg=frame({scene:s,seconds:p*duration,progress:p,index,episode:lesson});
    const result=await page.evaluate(svg=>{
      const main=document.querySelector('main');main.innerHTML=svg;
      const bad=[];
      for(const t of main.querySelectorAll('text')){
        let op=1,elem=t;
        while(elem&&elem!==main){op*=Number(elem.getAttribute('opacity')||1);elem=elem.parentElement;}
        if(op<.11)continue;
        const b=t.getBoundingClientRect();
        if(b.left<30||b.right>1890||b.top<10||b.bottom>1070)bad.push({text:t.textContent,x:b.x,width:b.width,y:b.y,height:b.height});
      }
      return bad;
    },svg);
    checks++;for(const item of result)bad.push({id:s.id,progress:p,...item});
  }
 }finally{await browser.close();}
 const report={frames:checks,outOfBounds:bad};
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));if(bad.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
