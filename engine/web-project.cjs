const fs=require('node:fs/promises');
const path=require('node:path');
const safeJSON=(v)=>JSON.stringify(v).replace(/</g,'\\u003c');
const escape=(v)=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
async function buildProject(data,ep,args){
  const dir=path.resolve(args['project-dir']);await fs.mkdir(dir,{recursive:true});
  await fs.cp(path.join(__dirname,'fonts'),path.join(dir,'fonts'),{recursive:true});
  const sourceFiles=['manager-visuals.cjs','architecture.cjs','foundations.cjs','workbenches.cjs','stage.cjs'];
  const scriptDir=path.join(dir,'scripts');await fs.mkdir(scriptDir,{recursive:true});
  const published=sourceFiles.map(v=>v.replace(/\.cjs$/,'.js'));
  await Promise.all(sourceFiles.map((v,i)=>fs.copyFile(path.join(__dirname,v),path.join(scriptDir,published[i]))));
  const stageScripts=published.map(v=>'<script src="scripts/'+v+'"></script>').join('\n');
  let audio='';
  if(args.audio){
    audio='narration'+path.extname(args.audio);
    await fs.copyFile(args.audio,path.join(dir,audio));
  }
  if(args.subtitles)await fs.copyFile(args.subtitles,path.join(dir,'captions.srt'));
  const sec=ep.durationFrames/24;
  const body=`<main id="lesson" data-composition-id="${escape(ep.id)}" data-width="1280" data-height="720" data-fps="24" data-start="0" data-duration="${sec}" data-no-timeline><div id="screen"></div>${audio?`<audio id="voice" src="${escape(audio)}" preload="auto" data-start="0" data-duration="${sec}" data-track-index="1"></audio>`:''}</main>`;
  const js=`const data=${safeJSON(data)},episode=WorkshopStage.prepare(data),screen=document.getElementById('screen'); const draw=t=>{screen.innerHTML=WorkshopStage.frame(episode,Math.min(episode.durationFrames-1,Math.round(t*24)))}; const tl={duration:()=>${sec},totalDuration:()=>${sec},time:function(t){if(t===undefined)return this.now||0;this.now=t;draw(t);return this},seek:function(t){return this.time(t)},pause(){return this},play(){return this}};window.__timelines=window.__timelines||{};window.__timelines[data.id]=tl;window.drawTrainingTime=draw;window.addEventListener('hf-seek',event=>draw(event.detail.time));draw(0);`;
  const head=`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escape(ep.title)}</title><link rel="stylesheet" href="fonts/faces.css"><style>*{box-sizing:border-box}html,body,main,#screen{margin:0;width:1280px;height:720px;background:#102321}svg{display:block}</style></head>`;
  await fs.writeFile(path.join(dir,'index.html'),head+'<body>'+body+stageScripts+'<script>'+js+'</script></body></html>');
  const controls=`<div id="controls"><button id="play">Play</button><input id="scrub" aria-label="Seek" type="range" min="0" max="${sec}" step=".041667" value="0"></div><style>body{width:100vw;height:100vh;display:grid;align-content:center;overflow:hidden}main,#screen{height:auto;width:100%;max-height:calc(100vh - 50px)}svg{width:100%;height:100%;max-height:calc(100vh - 50px)}#controls{display:flex;gap:20px;padding:10px 2%;height:50px}button{background:#c6f78b;border:0;border-radius:5px;padding:4px 24px}input{flex:1}</style><script>const play=document.getElementById('play'),scrub=document.getElementById('scrub'),voice=document.getElementById('voice');let active=false,start=0;const tick=()=>{if(!active)return;const t=voice?voice.currentTime:Math.min(${sec},(performance.now()-start)/1000);draw(t);scrub.value=t;if(t>=${sec}-.05||(voice&&voice.ended)){active=false;play.textContent='Play';return}requestAnimationFrame(tick)};scrub.oninput=()=>{const t=Number(scrub.value);draw(t);if(voice)voice.currentTime=t;start=performance.now()-t*1000};play.onclick=async()=>{if(active){active=false;if(voice)voice.pause();play.textContent='Play';return}if(Number(scrub.value)>=${sec}-.1){scrub.value=0;scrub.oninput()}if(voice)await voice.play();active=true;start=performance.now()-Number(scrub.value)*1000;play.textContent='Pause';tick()};</script>`;
  await fs.writeFile(path.join(dir,'preview.html'),head+'<body>'+body.replace(/ data-[\w-]+(?:="[^"]*")?/g,'')+stageScripts+'<script>'+js+'</script>'+controls+'</body></html>');
}
module.exports={buildProject};
