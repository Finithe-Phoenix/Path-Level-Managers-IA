import React, {useEffect, useMemo, useState} from 'react';
import {
  AbsoluteFill, Audio, Composition, cancelRender, continueRender, delayRender,
  registerRoot, staticFile, useCurrentFrame,
} from 'remotion';
import studio from './stage.cjs';

// Load the exact local font families used by the native compositor before capturing a frame.
function Lesson() {
  const frame = useCurrentFrame();
  const [fontGate] = useState(() => delayRender('Loading the workshop typefaces'));
  const fontCss = useMemo(() => studio.fontCss.replace(/url\((['"])([^'"]+)\1\)/g,
    (_, quote, name) => 'url("' + staticFile('fonts/' + name) + '")'), []);
  useEffect(() => {
    let mounted = true;
    Promise.all(studio.fontRequests.map(request => document.fonts.load(request))).then(
      () => { if (mounted) continueRender(fontGate); },
      error => { if (mounted) cancelRender(error); }
    );
    return () => { mounted = false; };
  }, [fontGate]);
  return <AbsoluteFill style={{background:'#10151b'}}>
    <style>{fontCss+'svg{display:block}'}</style>
    <div data-native-frame={frame} dangerouslySetInnerHTML={{__html:studio.frame(frame)}}/>
    <Audio src={staticFile('narration.m4a')}/>
  </AbsoluteFill>;
}

function Root() {
  const e = studio.episode;
  return <Composition id="Workshop" component={Lesson} width={e.width} height={e.height}
    fps={e.fps} durationInFrames={e.durationFrames}/>;
}
registerRoot(Root);
