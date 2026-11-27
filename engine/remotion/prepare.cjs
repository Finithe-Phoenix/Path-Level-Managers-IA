const fs=require('node:fs/promises');
const path=require('node:path');
const {parseArgs}=require('node:util');
async function prepare() {
  const {values:a}=parseArgs({options:{episode:{type:'string'},audio:{type:'string'}}});
  if(!a.episode)throw Error('Use --episode path/to/episode.json [--audio path/to/narration.m4a]');
  const episode=JSON.parse(await fs.readFile(a.episode,'utf8'));
  const publicDir=path.join(__dirname,'public');await fs.mkdir(publicDir,{recursive:true});
  await fs.cp(path.join(__dirname,'..','fonts'),path.join(publicDir,'fonts'),{recursive:true});
  let audioFile=null;
  if(a.audio){audioFile=episode.id+path.extname(a.audio);const dest=path.join(__dirname,'public');await fs.mkdir(dest,{recursive:true});await fs.copyFile(a.audio,path.join(dest,audioFile));}
  const props=path.join(__dirname,'props-'+episode.id+'.json');
  await fs.writeFile(props,JSON.stringify({episode,audioFile},null,2)+'\n');console.log(props);
}
prepare().catch(error=>{console.error(error);process.exitCode=1;});
