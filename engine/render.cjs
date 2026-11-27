#!/usr/bin/env node
'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const {spawn} = require('node:child_process');
const {parseArgs} = require('node:util');
// Choose the included typefaces even on a minimal Linux render worker.
process.env.FONTCONFIG_FILE ||= path.join(__dirname,'fonts','fonts.conf');
const sharp = require('sharp');
const stage = require('./stage.cjs');
const {buildProject} = require('./web-project.cjs');

function ffmpeg(args) {
  return new Promise((resolve,reject)=>{
    const proc=spawn('ffmpeg',args,{stdio:['ignore','inherit','inherit']});
    proc.on('error',reject);
    proc.on('close',code=>code===0?resolve():reject(Error('FFmpeg exited '+code)));
  });
}
async function still(ep,at,output){
  await fs.mkdir(path.dirname(path.resolve(output)),{recursive:true});
  await sharp(Buffer.from(stage.frame(ep,at))).png().toFile(output);
}
async function movie(ep,args){
  const work=await fs.mkdtemp(path.join(os.tmpdir(),'fieldlab-'));
  try{
    const frames=stage.captureFrames(ep);
    const manifest=['ffconcat version 1.0'];
    let next=0;
    // Disk-backed frames keep peak memory bounded on a laptop or cloud workspace.
    async function worker(){
      while(next<frames.length){
        const index=next++,file='k'+String(index).padStart(5,'0')+'.jpg';
        const image=Buffer.from(stage.frame(ep,frames[index]));
        await sharp(image).jpeg({quality:94,chromaSubsampling:'4:4:4'}).toFile(path.join(work,file));
      }
    }
    sharp.concurrency(1);
    await Promise.all(Array.from({length:Number(args.jobs||2)},worker));
    for(let i=0;i<frames.length;i++){
      const file='k'+String(i).padStart(5,'0')+'.jpg';
      manifest.push('file '+file,'option framerate 24','duration '+(((frames[i+1]??ep.durationFrames)-frames[i])/24).toFixed(9));
    }
    manifest.push('file k'+String(frames.length-1).padStart(5,'0')+'.jpg','option framerate 24');
    const shotList=path.join(work,'frames.ffconcat');
    await fs.writeFile(shotList,manifest.join('\n')+'\n');
    const cmd=['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',shotList];
    if(args.audio)cmd.push('-i',args.audio);
    if(args.subtitles)cmd.push('-i',args.subtitles);
    // Write chapter navigation from the very same frame timeline as the moving image.
    const metadata=[';FFMETADATA1',...ep.scenes.flatMap(s=>['[CHAPTER]','TIMEBASE=1/24','START='+s.start,'END='+(s.start+s.durationFrames),'title='+s.title.replace(/([\\;=#\n])/g,'\\$1')])];
    const meta=path.join(work,'chapters.ffmeta');await fs.writeFile(meta,metadata.join('\n')+'\n');
    cmd.push('-i',meta,'-map','0:v:0','-map_chapters',String(1+Number(!!args.audio)+Number(!!args.subtitles)));
    if(args.audio){cmd.push('-map','1:a:0');if(/\.(m4a|aac)$/i.test(args.audio))cmd.push('-c:a','copy');else cmd.push('-c:a','aac','-b:a','128k','-ar','48000');cmd.push('-metadata:s:a:0','language=eng');}
    if(args.subtitles)cmd.push('-map',String(args.audio?2:1)+':s:0','-c:s','mov_text','-metadata:s:s:0','language=eng');
    cmd.push('-vf','scale=in_range=full:out_range=tv,format=yuv420p','-c:v','libx264',
      '-preset','veryfast','-crf','19','-threads','2','-bf','0','-fps_mode','vfr','-enc_time_base','1:24',
      '-force_key_frames','expr:gte(t,n_forced*4)','-video_track_timescale','24000','-movflags','+faststart',
      '-metadata','title='+ep.title,'-t',String(ep.durationFrames/24));
    // Write the completed container atomically. Failed re-renders preserve a usable file.
    await fs.mkdir(path.dirname(path.resolve(args.output)),{recursive:true});
    const temp=path.resolve(args.output)+'.partial-'+process.pid+'.mp4';
    try{await ffmpeg([...cmd,temp]);await fs.rename(temp,args.output);}
    finally{await fs.rm(temp,{force:true});}
    console.log(ep.id+' · '+frames.length+' motion samples · '+(ep.durationFrames/24).toFixed(2)+' s · '+args.output);
  }finally{await fs.rm(work,{force:true,recursive:true});}
}
async function main(){
  const {values:a}=parseArgs({options:{
    episode:{type:'string'},audio:{type:'string'},subtitles:{type:'string'},output:{type:'string'},
    poster:{type:'string'},'at-frame':{type:'string'},'project-dir':{type:'string'},jobs:{type:'string'},help:{type:'boolean'}
  }});
  if(a.help){console.log('node render.cjs --episode episode.json [--audio narration.m4a] [--subtitles captions.srt] [--output lesson.mp4] [--poster frame.png --at-frame 48] [--project-dir project] [--jobs 2]');return;}
  if(!a.episode||!(a.output||a.poster||a['project-dir']))throw Error('Supply --episode and --output, --poster, or --project-dir. See --help.');
  if(a.jobs&&(!Number.isInteger(Number(a.jobs))||Number(a.jobs)<1||Number(a.jobs)>8))throw Error('--jobs must be an integer from 1 to 8.');
  const data=JSON.parse(await fs.readFile(a.episode,'utf8')),ep=stage.prepare(data);
  if(a.poster)await still(ep,a['at-frame']!==undefined?Number(a['at-frame']):Math.round(ep.scenes[0].resultAt*24)+24,a.poster);
  if(a['project-dir'])await buildProject(data,ep,a);
  if(a.output)await movie(ep,a);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
