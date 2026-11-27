'use strict';

// Shared by the encoder, browser preview, HyperFrames and Remotion.
function timeline(lesson,timing) {
  if (lesson.id!==timing.id || lesson.scenes.length!==timing.scenes.length || timing.fps!==24) {
    throw new Error('The narration timing does not match this 24 fps lesson.');
  }
  let cursor=0;
  const scenes=lesson.scenes.map((source,i)=>{
    const timed=timing.scenes[i];
    if (source.id!==timed.id || source.narration!==timed.narration ||
        !Number.isInteger(timed.durationFrames) || timed.durationFrames<1) {
      throw new Error('Narration or scene order differs in '+source.id+'. Rebuild the voice.');
    }
    const scene={...source,...timed,startFrame:cursor,duration:timed.durationFrames/24};
    cursor+=timed.durationFrames;
    return scene;
  });
  if(cursor!==timing.durationFrames)throw new Error('Invalid total duration');
  return {...lesson,scenes,durationFrames:cursor,fps:24,width:1920,height:1080};
}
function at(episode,frame) {
  const absolute=Math.max(0,Math.min(episode.durationFrames-1,Math.floor(frame)));
  const index=episode.scenes.findIndex(s=>absolute<s.startFrame+s.durationFrames);
  const scene=episode.scenes[index],offset=absolute-scene.startFrame;
  return {episode,scene,index,seconds:offset/episode.fps,progress:offset/Math.max(1,scene.durationFrames-1),
    frame:offset,absoluteFrame:absolute};
}
module.exports={timeline,at};
