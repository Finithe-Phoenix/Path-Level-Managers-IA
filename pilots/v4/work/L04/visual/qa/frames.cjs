'use strict';
const fs=require('node:fs');
const path=require('node:path');
const sharp=require(process.env.SHARP_MODULE || 'sharp');
const {frame,ids}=require('../scene.cjs');
const samples={question:[.11,.57,.9],wait:[.22,.62,.91],effort:[.54,.86],quality:[.12,.54,.7,.95],cost:[.18,.44,.79,.95],decision:[.10,.57,.88],transfer:[.75],debrief:[.14,.53,.9]};
async function main(){
 const lesson=JSON.parse(fs.readFileSync(process.argv[2]||path.resolve(__dirname,'../../lesson.json'),'utf8'));
 const dest=path.resolve(process.argv[3]||path.join(__dirname,'proof'));fs.mkdirSync(dest,{recursive:true});
 const tiles=[];let count=0;
 for(const [index,s] of lesson.scenes.entries()){
   if(s.id!==ids[index])throw new Error('Lesson scene mismatch: '+s.id);
   for(const p of samples[s.id]){
     const duration=s.duration || (s.durationFrames ? s.durationFrames/24 : 60);
     const svg=frame({scene:s,progress:p,seconds:p*duration,index,episode:lesson});
     const markup=svg.replace(/data:image\/(?:jpeg|png);base64,[\w+/=]+/g,'photo');
     if(/(?:NaN|undefined|Infinity)/.test(markup))throw new Error('Invalid SVG at '+s.id+'/'+p);
     const short=s.id+'-'+Math.round(100*p);const file=path.join(dest,short+'.jpg');
     await sharp(Buffer.from(svg)).jpeg({quality:88,mozjpeg:true}).toFile(file);
     const tile=await sharp(file).resize(480,270).toBuffer();
     tiles.push({input:tile,left:count%3*480,top:Math.floor(count/3)*304});
     const label=Buffer.from('<svg width="480" height="34" xmlns="http://www.w3.org/2000/svg"><text x="12" y="24" fill="white" font-size="16" font-family="sans-serif">'+short+'</text></svg>');
     tiles.push({input:label,left:count%3*480,top:Math.floor(count/3)*304+270});count++;
   }
 }
 await sharp({create:{width:1440,height:Math.ceil(count/3)*304,channels:3,background:'#102337'}}).composite(tiles).jpeg({quality:88}).toFile(path.join(dest,'contact-sheet.jpg'));
 console.log(count+' L04 camera positions rendered at 1920×1080 in '+dest);
}
main().catch(e=>{console.error(e);process.exitCode=1});
