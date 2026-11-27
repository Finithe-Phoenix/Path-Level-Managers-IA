'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const {parseArgs} = require('node:util');
const {timeline} = require('./timeline.cjs');

const literal = value => JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
const html = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const templates = path.join(__dirname, 'adapters');

async function localInputs(file, root) {
  // Native scene modules read checked-in images and evidence synchronously before drawing.
  // Replace those literal inputs at build time. Rendering then needs no Node polyfills or network.
  const code = await fs.readFile(file,'utf8');
  const dependencies = [];
  const imports = /require\(\s*(['"])(\.\.?\/[^'"]+\.json)\1\s*\)/g;
  const reads = /fs\.readFileSync\(\s*path\.join\(\s*__dirname\s*,\s*(['"])([^'"]+)\1\s*\)\s*,\s*(['"])(base64|utf8)\3\s*\)/g;
  for (const match of code.matchAll(imports)) dependencies.push({start:match.index,length:match[0].length,name:match[2],encoding:'json'});
  for (const match of code.matchAll(reads)) dependencies.push({start:match.index,length:match[0].length,name:match[2],encoding:match[4]});
  dependencies.sort((a,b)=>a.start-b.start);
  let body='', at=0;
  for (const dep of dependencies) {
    const asset=path.resolve(path.dirname(file),dep.name);
    const relative=path.relative(root,await fs.realpath(asset));
    if(relative.startsWith('..'+path.sep) || relative==='..' || path.isAbsolute(relative)) {
      throw new Error('Visual asset is outside the lesson directory: '+dep.name);
    }
    const data=await fs.readFile(asset,dep.encoding==='json'?'utf8':dep.encoding);
    const value=dep.encoding==='json'?JSON.parse(data):data;
    body+=code.slice(at,dep.start)+literal(value);
    at=dep.start+dep.length;
  }
  body+=code.slice(at);
  body=body.replace(/^\s*const\s+(?:fs|path)\s*=\s*require\(\s*(['"])node:(?:fs|path)\1\s*\);?\s*$/gm,'');
  if(/\brequire\s*\(|\bfs\.readFile|\b__dirname\b/.test(body)) {
    throw new Error('Unsupported dynamic dependency in '+file+'. Use a literal local JSON import or fs.readFileSync(path.join(__dirname, filename), encoding).');
  }
  return body;
}
function wrapped(source) {
  return '(function(){const module={exports:{}};\n'+source+'\nreturn module.exports;})()';
}
async function makeBundle(work,ep) {
  const timelineSource=await fs.readFile(path.join(__dirname,'timeline.cjs'),'utf8');
  const visual=await localInputs(path.join(work,'visual/scene.cjs'),work);
  const fontCss=await fs.readFile(path.join(__dirname,'fonts/faces.css'),'utf8');
  const fontRequests=[];
  for(const face of fontCss.matchAll(/@font-face\s*\{([^}]+)\}/g)) {
    const name=/font-family:\s*['"]([^'"]+)['"]/.exec(face[1]);
    const weight=/font-weight:\s*(\d+)/.exec(face[1]);
    if(!name||!weight)throw new Error('Font CSS must name every family and weight.');
    fontRequests.push(weight[1]+' 32px "'+name[1]+'"');
  }
  return "/* Generated from the lesson's editable scene and the shared frame clock. */\n"+
    '(function(root,build){const api=build();if(typeof module==="object"&&module.exports)module.exports=api;else root.PilotStudio=api;})(globalThis,function(){\n'+
    'const clock='+wrapped(timelineSource)+';\nconst visual='+wrapped(visual)+';\nconst episode='+literal(ep)+';\n'+
    'return {episode,fontCss:'+literal(fontCss)+',fontRequests:'+literal(fontRequests)+',frame(number){return visual.frame(clock.at(episode,number));}};\n});\n';
}
function hyperPage(ep) {
  const seconds=ep.durationFrames/ep.fps;
  return '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>'+html(ep.title)+'</title>\n'+
    '<link rel="stylesheet" href="fonts/faces.css"><style>*{box-sizing:border-box}html,body,main,#screen{margin:0;width:'+ep.width+'px;height:'+ep.height+'px;background:#10151b}svg{display:block}</style></head>\n'+
    '<body><main id="lesson" data-composition-id="'+html(ep.id)+'" data-width="'+ep.width+'" data-height="'+ep.height+'" data-fps="'+ep.fps+'" data-start="0" data-duration="'+seconds+'" data-no-timeline>\n'+
    '<div id="screen"></div><audio id="voice" src="narration.m4a" preload="auto" data-start="0" data-duration="'+seconds+'" data-track-index="1"></audio></main>\n'+
    '<script src="stage.js"></script><script src="seek.js"></script></body></html>\n';
}
async function buildProject(workPath, outPath) {
  const work=await fs.realpath(workPath),out=path.resolve(outPath);
  if(out===work||out.startsWith(work+path.sep)||work.startsWith(out+path.sep)) {
    throw new Error('Choose a build directory separate from the editable work directory.');
  }
  const audio=path.join(work,'audio');
  const load=async file=>JSON.parse(await fs.readFile(file,'utf8'));
  const ep=timeline(await load(path.join(work,'lesson.json')),await load(path.join(audio,'episode.json')));
  // Require a complete timed lesson. The exported projects each remain usable after being moved.
  await Promise.all(['narration.m4a','captions.srt'].map(name=>fs.access(path.join(audio,name))));
  const bundle=await makeBundle(work,ep);
  for(const renderer of ['hyperframes','remotion']) {
    const dest=path.join(out,renderer),assets=renderer==='remotion'?path.join(dest,'public'):dest;
    await fs.mkdir(assets,{recursive:true});
    await fs.cp(path.join(templates,renderer),dest,{recursive:true,filter:src=>path.basename(src)!=='node_modules'});
    await fs.cp(path.join(__dirname,'fonts'),path.join(assets,'fonts'),{recursive:true});
    await Promise.all(['narration.m4a','captions.srt'].map(name=>fs.copyFile(path.join(audio,name),path.join(assets,name))));
    await fs.writeFile(path.join(dest,renderer==='remotion'?'stage.cjs':'stage.js'),bundle);
    if(renderer==='hyperframes')await fs.writeFile(path.join(dest,'index.html'),hyperPage(ep));
  }
  return {episode:ep.id,width:ep.width,height:ep.height,fps:ep.fps,durationFrames:ep.durationFrames,out};
}
module.exports={buildProject};
if(require.main===module) {
  const {values}=parseArgs({options:{work:{type:'string'},out:{type:'string'}}});
  if(!values.work||!values.out)throw new Error('Use node studio/project.cjs --work work/M02 --out build/M02');
  buildProject(values.work,values.out).then(result=>console.log(JSON.stringify(result))).catch(err=>{console.error(err.message);process.exitCode=1;});
}
