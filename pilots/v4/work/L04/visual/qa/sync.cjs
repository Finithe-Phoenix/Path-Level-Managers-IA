'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {frame}=require('../scene.cjs');
const file=process.argv[2];
if(!file)throw Error('Pass the timed L04 episode JSON, then an optional output report.');
const episode=JSON.parse(fs.readFileSync(file,'utf8'));
if(episode.id!=='L04' || episode.fps!==24)throw Error('Expected timed L04 at 24 fps.');
const sr=episode.scenes.find(s=>s.id==='cost');
const states={};
for(const name of ['opened','formula','total','headroom','unit']){
 const bytes=fs.readFileSync(path.join(__dirname,'../assets/ledger-'+name+'.png')).toString('base64');
 states[name]=bytes.slice(-120,-20);
}
function view(s,t){
 const p=Math.max(0,Math.min(1,t/(s.durationFrames/24)));
 return frame({scene:s,index:episode.scenes.indexOf(s),seconds:t,progress:p,episode});
}
const terminal=[];
for(let i=0;i<sr.durationFrames;i+=3){
 const t=i/24;const svg=view(sr,t);
 const state=Object.keys(states).find(k=>svg.includes(states[k]))||'ledger';
 if(!terminal.length||terminal.at(-1).state!==state)terminal.push({seconds:t,state});
}
const sp=episode.scenes.find(s=>s.id==='transfer');
for(let i=0;i<sp.durationFrames;i+=6){
 if(/>16%|>7 \/ 50|>8 \/ 50/.test(view(sp,i/24)))throw Error('Answer exposed during independent practice');
}
const last=sp.beats.find(b=>b.id==='challenge'),dq=episode.scenes.find(s=>s.id==='quality');
const rq=dq.beats.find(b=>b.id==='rate'),aq=dq.beats.find(b=>b.id==='threshold');
const p25=i=>Math.round(i*100)/100;
const report={
  timingSha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
  sceneCount:episode.scenes.length,frames:episode.durationFrames,seconds:episode.durationFrames/24,
  transferChallengeHold:last.holdSeconds||last.practiceHoldSeconds,qualityDivisionHold:rq.holdSeconds||rq.practiceHoldSeconds,
  qualityAnswerBeatStart:aq.start??aq.startFrame/24,
  transferAnswerAbsent:true,terminalShots:terminal,
  includesCalculatedResults:['opened','formula','total','headroom','unit'].every(x=>terminal.some(s=>s.state===x)),
  finalNarrationCues:episode.scenes.reduce((n,s)=>n+s.cues.length,0)
};
const formula=terminal.find(x=>x.state==='formula'),total=terminal.find(x=>x.state==='total');
report.typedFormulaVisibleSeconds=formula&&total?p25(total.seconds-formula.seconds):0;
if(report.typedFormulaVisibleSeconds<1)throw Error('The typed formula must stay visible before its result.');
if(report.transferChallengeHold<5.75||report.qualityDivisionHold<2.25||!report.includesCalculatedResults)throw Error(JSON.stringify(report));
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
