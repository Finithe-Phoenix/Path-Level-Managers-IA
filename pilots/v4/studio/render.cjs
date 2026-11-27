'use strict';
const fs=require('node:fs');
const fsp=fs.promises;
const path=require('node:path');
const os=require('node:os');
const {spawn,execFile}=require('node:child_process');
const {once}=require('node:events');
const {parseArgs}=require('node:util');
const {timeline,at}=require('./timeline.cjs');
process.env.FONTCONFIG_FILE ||= path.join(__dirname,'fonts/fonts.conf');
process.env.XDG_CACHE_HOME ||= path.join(os.tmpdir(),'workshop-font-cache');
const sharp=require('sharp');
sharp.concurrency(1);

function load(work,timedFile) {
  const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
  const lesson=read(path.join(work,'lesson.json'));
  const timing=read(timedFile||path.join(work,'audio/episode.json'));
  const episode=timeline(lesson,timing);
  const visual=require(path.join(work,'visual/scene.cjs'));
  return {episode,visual};
}
function escapeMeta(value){return value.replace(/([\\;=#\n])/g,'\\$1');}
async function probe(file){
  const {stdout}=await require('node:util').promisify(execFile)('ffprobe',['-v','error','-show_chapters','-show_streams','-show_format','-of','json',file],{maxBuffer:8*1024*1024});
  return JSON.parse(stdout);
}
async function frameJpeg(visual,input) {
  const svg=visual.frame(input);
  return sharp(Buffer.from(svg),{limitInputPixels:64000000})
    .resize(1920,1080,{fit:'fill'}).flatten({background:'#10151b'})
    .jpeg({quality:94,chromaSubsampling:'4:4:4'}).toBuffer();
}
async function encode({episode,visual,output,audio,captions,jobs=2,variant,from=0,count=episode.durationFrames,pictureOnly=false}) {
  await fsp.mkdir(path.dirname(output),{recursive:true});
  const temp=await fsp.mkdtemp(path.join(path.dirname(output),'.encoding-'));
  const next=path.join(temp,'movie.mp4');
  let proc;
  try {
    const args=['-nostdin','-v','error','-y','-f','image2pipe','-framerate','24','-c:v','mjpeg','-threads','1','-i','pipe:0'];
    if(!pictureOnly) {
      const chapters=path.join(temp,'chapters.txt');
      const lines=[';FFMETADATA1',...episode.scenes.flatMap(s=>['[CHAPTER]','TIMEBASE=1/24','START='+s.startFrame,
        'END='+(s.startFrame+s.durationFrames),'title='+escapeMeta(s.title)])];
      await fsp.writeFile(chapters,lines.join('\n')+'\n');
      args.push('-i',audio,'-i',captions,'-i',chapters,'-map','0:v','-map','1:a:0','-map','2:s:0','-map_chapters','3',
        '-c:a','copy','-c:s','mov_text','-metadata:s:a:0','language=eng','-metadata:s:a:0','handler_name=English narration',
        '-metadata:s:s:0','language=eng','-disposition:s:0','0');
    } else args.push('-map','0:v','-an');
    args.push('-vf','scale=in_range=full:out_range=tv,format=yuv420p','-c:v','libx264','-threads','2','-preset','veryfast',
      '-crf','19','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-g','72','-r','24',
      '-video_track_timescale','24000','-metadata','title='+episode.title,'-t',String(count/24),'-movflags','+faststart',next);
    proc=spawn('ffmpeg',args,{stdio:['pipe','ignore','inherit']});
    proc.stdin.on('error',()=>{});
    const done=once(proc,'exit');
    const ahead=new Map();
    let scheduled=0,previousScene='';
    function queue(i) {
      // Resolve worker errors eagerly; the ordered output loop reports them at their frame.
      const input={...at(episode,from+i),variant};
      ahead.set(i,frameJpeg(visual,input).then(data=>({data}),error=>({error})));
    }
    for(let i=0;i<count;i++){
      while(scheduled<count && scheduled<i+jobs)queue(scheduled++);
      const {data,error}=await ahead.get(i);ahead.delete(i);if(error)throw error;
      if(proc.exitCode!==null || proc.stdin.destroyed)throw Error('FFmpeg stopped while receiving frames');
      if(!proc.stdin.write(data))await once(proc.stdin,'drain');
      const id=at(episode,from+i).scene.id;
      if(id!==previousScene){console.log(episode.id,id,i+'/'+count);previousScene=id;}
    }
    proc.stdin.end(); const [code]=await done;
    if(code!==0)throw Error('FFmpeg exited '+code);
    const meta=await probe(next);
    const v=meta.streams.find(s=>s.codec_type==='video');
    if(v.width!==1920 || v.height!==1080 || Number(v.nb_frames)!==count)throw Error('Output dimensions or frame count differ');
    if(!pictureOnly && (meta.chapters.length!==episode.scenes.length || !meta.streams.some(s=>s.codec_type==='subtitle'&&s.tags.language==='eng') ||
      !meta.streams.some(s=>s.codec_type==='audio'&&s.tags.language==='eng'&&Math.abs(Number(s.duration)-count/24)<.15)))throw Error('Missing or mistimed delivery streams');
    await fsp.rename(next,output);console.log(output,count+' frames');
  } finally {
    if(proc && proc.exitCode===null)proc.kill('SIGTERM');
    await fsp.rm(temp,{recursive:true,force:true});
  }
}
async function main() {
  const {values}=parseArgs({options:{work:{type:'string'},output:{type:'string'},poster:{type:'string'},frame:{type:'string'},jobs:{type:'string'}}});
  if(!values.work || !(values.output||values.poster))throw new Error('Use --work work/M02 and --output media/M02.mp4 or --poster still.png --frame 120');
  const work=path.resolve(values.work);const {episode,visual}=load(work);
  if(values.poster){await sharp(Buffer.from(visual.frame(at(episode,Number(values.frame||0))))).png().toFile(values.poster);return;}
  const jobs=Number(values.jobs||2);if(!Number.isInteger(jobs)||jobs<1||jobs>6)throw Error('Choose 1–6 workers');
  await encode({episode,visual,output:path.resolve(values.output),audio:path.join(work,'audio/narration.m4a'),
    captions:path.join(work,'audio/captions.srt'),jobs});
}
module.exports={load,encode,probe};
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
