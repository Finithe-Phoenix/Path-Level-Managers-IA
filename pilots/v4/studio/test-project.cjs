'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const {execFile} = require('node:child_process');
const {promisify,parseArgs} = require('node:util');
const {createHash} = require('node:crypto');
const run = promisify(execFile);
const {load} = require('./render.cjs');
const {at} = require('./timeline.cjs');
const sharp = require('sharp');

const hash = buffer => createHash('sha256').update(buffer).digest('hex');
async function renderedMeanError(a,b) {
  const thumb = filename => sharp(filename).flatten({background:'#10151b'}).removeAlpha()
    .resize(320,180,{fit:'fill'}).toColourspace('srgb').raw().toBuffer();
  const [left,right] = await Promise.all([thumb(a),thumb(b)]);
  let error=0;
  for(let i=0;i<left.length;i++)error+=Math.abs(left[i]-right[i]);
  return error/(left.length*255);
}
async function binary(project,renderer) {
  // Use the installed package entrypoint instead of platform-specific .bin wrappers.
  const file=renderer==='remotion'?'@remotion/cli/package.json':'hyperframes/package.json';
  const manifestPath=require.resolve(file,{paths:[path.join(project,renderer)]});
  const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
  const entry=typeof manifest.bin==='string'?manifest.bin:manifest.bin[renderer];
  return {file:path.resolve(path.dirname(manifestPath),entry),version:manifest.version};
}
async function audioSamples(filename,start=0,length=.90) {
  const args=['-v','error','-i',filename,'-ss',String(start),'-t',String(length),
    '-map','0:a:0','-vn','-sn','-ar','8000','-ac','1','-f','s16le','pipe:1'];
  const {stdout}=await run('ffmpeg',args,{encoding:'buffer',maxBuffer:512*1024});
  const samples=new Int16Array(Math.floor(stdout.length/2));
  for(let i=0;i<samples.length;i++)samples[i]=stdout.readInt16LE(i*2);
  return samples;
}
function audioMatch(reference,candidate) {
  // AAC padding/MP4 edit lists differ across renderers. Search a small alignment
  // window and compare the same waveform well inside the clip.
  const from=1000,to=Math.min(reference.length,candidate.length)-1000;
  if(to-from<512)throw new Error('Insufficient audio for a waveform check');
  let best=0,lag=0,power=0;
  for(let i=from;i<to;i++)power+=reference[i]*reference[i];
  if(Math.sqrt(power/(to-from))<24)throw new Error('The selected second is silent. Choose a frame during speech.');
  let referencePower=0;
  for(let i=from;i<to;i+=2)referencePower+=reference[i]*reference[i];
  for(let d=-800;d<=800;d++) {
    let cross=0,testPower=0;
    for(let i=from;i<to;i+=2){const target=candidate[i+d];cross+=reference[i]*target;testPower+=target*target;}
    const correlation=cross/Math.sqrt(referencePower*testPower||1);
    if(correlation>best){best=correlation;lag=d;}
  }
  return {correlation:best,offsetMilliseconds:lag/8};
}
async function inspectClip(filename,master,start,length) {
  const {stdout}=await run('ffprobe',['-v','error','-show_streams','-of','json',filename]);
  const streams=JSON.parse(stdout).streams;
  const picture=streams.find(v=>v.codec_type==='video'),voice=streams.find(v=>v.codec_type==='audio');
  if(!picture||!voice||picture.width!==1920||picture.height!==1080||
     picture.avg_frame_rate!=='24/1'||Math.abs(Number(picture.duration)-length)>.09) {
    throw new Error('Missing or mistimed output streams in '+filename);
  }
  const [expected,actual]=await Promise.all([audioSamples(master,start,length),audioSamples(filename,0,length)]);
  return {frames:Number(picture.nb_frames),seconds:Number(picture.duration),audioCodec:voice.codec_name,...audioMatch(expected,actual)};
}
async function main() {
  const {values:args}=parseArgs({options:{work:{type:'string'},project:{type:'string'},out:{type:'string'},
    frame:{type:'string'},chrome:{type:'string'},clip:{type:'boolean',default:false}}});
  if(!args.work||!args.project||!args.out)throw new Error('Use --work work/M02 --project build/M02 --out qa/M02 [--frame N] [--chrome path]');
  const work=path.resolve(args.work),project=path.resolve(args.project),out=path.resolve(args.out);
  const {episode,visual}=load(work);
  const pick=args.frame===undefined?Math.floor(episode.durationFrames/2):Number(args.frame);
  if(!Number.isInteger(pick)||pick<0||pick>=episode.durationFrames)throw new Error('Frame must be within this lesson.');
  await fs.mkdir(out,{recursive:true});
  const rDir=path.join(project,'remotion'),hDir=path.join(project,'hyperframes');
  const remotion=require(path.join(rDir,'stage.cjs'));
  const browser=vm.createContext({});
  vm.runInContext(await fs.readFile(path.join(hDir,'stage.js'),'utf8'),browser,{filename:'stage.js'});
  const checks=new Set([pick]);
  for(const scene of episode.scenes) {
    for(const p of [0,.5,1])checks.add(scene.startFrame+Math.round((scene.durationFrames-1)*p));
  }
  for(const f of checks) {
    const native=visual.frame(at(episode,f));
    if(remotion.frame(f)!==native||browser.PilotStudio.frame(f)!==native)throw new Error('SVG differs from native at frame '+f);
  }
  const audioHash=hash(await fs.readFile(path.join(work,'audio/narration.m4a')));
  for(const name of [path.join(hDir,'narration.m4a'),path.join(rDir,'public/narration.m4a')]) {
    if(hash(await fs.readFile(name))!==audioHash)throw new Error('Narration differs: '+name);
  }
  const target={native:path.join(out,'native.png'),remotion:path.join(out,'remotion.png')};
  await sharp(Buffer.from(visual.frame(at(episode,pick)))).png().toFile(target.native);
  const rem=await binary(project,'remotion'),hyper=await binary(project,'hyperframes');
  const env={...process.env,DO_NOT_TRACK:'1',REMOTION_TELEMETRY_DISABLED:'1'};
  const chrome=args.chrome?path.resolve(args.chrome):null;
  const remArgs=[rem.file,'still','src.jsx','Workshop',target.remotion,'--frame='+pick,'--concurrency=1','--log=error'];
  if(chrome)remArgs.push('--browser-executable='+chrome);
  await run(process.execPath,remArgs,{cwd:rDir,env,maxBuffer:8*1024*1024});
  if(chrome)env.PRODUCER_HEADLESS_SHELL_PATH=chrome;
  const hOutput=path.join(out,'hyperframes');
  const hyperArgs=[hyper.file,'snapshot','.', '--at',String(pick/episode.fps),'--no-end',
    '--output',hOutput,'--timeout','150000'];
  await run(process.execPath,hyperArgs,{cwd:hDir,env,maxBuffer:8*1024*1024});
  const pngs=(await fs.readdir(hOutput)).filter(f=>f.endsWith('.png'));
  if(pngs.length!==1)throw new Error('Expected one HyperFrames capture, found '+pngs.length);
  target.hyperframes=path.join(hOutput,pngs[0]);
  for(const filename of Object.values(target)) {
    const image=await sharp(filename).metadata();
    if(image.width!==episode.width||image.height!==episode.height)throw new Error('Unexpected raster size '+filename);
  }
  const metrics={
    nativeRemotion:await renderedMeanError(target.native,target.remotion),
    nativeHyperFrames:await renderedMeanError(target.native,target.hyperframes),
    remotionHyperFrames:await renderedMeanError(target.remotion,target.hyperframes)
  };
  const result={episode:episode.id,frame:pick,scene:at(episode,pick).scene.id,
    width:episode.width,height:episode.height,fps:episode.fps,durationFrames:episode.durationFrames,
    identicalVectorSamples:checks.size,sharedNarrationSha256:audioHash,
    remotion:rem.version,hyperframes:hyper.version,normalizedMeanPixelError:metrics};
  if(args.clip) {
    if(episode.durationFrames-pick<24)throw new Error('Choose a speaking frame with at least one second remaining.');
    const start=pick/episode.fps,stop=(pick+24)/episode.fps;
    const rClip=path.join(out,'remotion-clip.mp4'),hClip=path.join(out,'hyperframes-clip.mp4');
    const cli=[rem.file,'render','src.jsx','Workshop',rClip,'--frames='+pick+'-'+(pick+23),'--concurrency=1','--log=error'];
    if(chrome)cli.push('--browser-executable='+chrome);
    await run(process.execPath,cli,{cwd:rDir,env,maxBuffer:8*1024*1024});
    await run(process.execPath,[hyper.file,'render','.','--start='+start,'--end='+stop,
      '--fps=24','--workers=1','--output='+hClip],{cwd:hDir,env,maxBuffer:12*1024*1024});
    const narration=path.join(work,'audio/narration.m4a');
    result.clips={remotion:await inspectClip(rClip,narration,start,1),hyperframes:await inspectClip(hClip,narration,start,1)};
  }
  await fs.writeFile(path.join(out,'adapter-check.json'),JSON.stringify(result,null,2)+'\n');
  // Chromium and native librsvg antialias fonts differently. The SVG identity test above is exact.
  if(metrics.nativeRemotion>.045||metrics.nativeHyperFrames>.045||metrics.remotionHyperFrames>.012) {
    throw new Error('Unexpected visual difference. Inspect the captures and '+path.join(out,'adapter-check.json'));
  }
  if(result.clips && Object.values(result.clips).some(c=>c.correlation<.78||Math.abs(c.offsetMilliseconds)>75)) {
    throw new Error('The one-second export does not match the narration at the requested time.');
  }
  console.log(JSON.stringify(result));
}
main().catch(error=>{ console.error(error.stderr||error.message);process.exitCode=1; });
