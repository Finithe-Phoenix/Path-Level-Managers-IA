"""Rebuild a pilot from authored demonstration beats and a chosen synthetic performance."""
import argparse
import contextlib
import hashlib
import json
import math
from pathlib import Path
import re
import tempfile

import numpy as np
from alignment import CaptionAligner
from assets import DEFAULT_CACHE
from audio_tools import FPS,RATE,UNIT,acoustic_cues,asr,edit_distance,master,srt,stretch,words
from take_archive import unpack
from perform import PROFILES,generate,read_wav,seed,spoken,trim_room


def write(path,data):
    path.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')


def thoughts(text):
    sentences=re.split(r'(?<=[.!?])\s+|(?<=[.!?][”"])\s+',text.strip())
    group=''
    for sentence in sentences:
        if group and (len(group)+len(sentence)>129 or len(group)>65 or group.endswith('?')):
            yield group
            group=''
        group=(group+' '+sentence).strip()
    if group:
        yield group


def intent(text,direction):
    if '?' in text:
        return 'question'
    if re.match(r'^(run|open|look|type|pause|replace|ask|make|write|compare|read|find|inspect|follow|change|check|copy|divide|count|calculate|choose|keep|record|add|start|return)\b',text,re.I):
        return 'action'
    if re.search(r'\b(result|failed|false|passes|passed|evidence|cost|answer|actual|expected|decision|difference|threshold)\b',text,re.I) or re.search(r'contrast|result|resolve|land|understate',direction,re.I):
        return 'evidence'
    return 'narrative'


def lines(lesson):
    rows=[]
    for scene in lesson['scenes']:
        assert scene['narration']==' '.join(b['text'] for b in scene['beats'])
        for beat in scene['beats']:
            for i,text in enumerate(thoughts(beat['text'])):
                ident=f"{scene['id']}_{beat['id']}_{i+1:02d}"
                rows.append(dict(id=ident,scene=scene['id'],beat=beat['id'],text=text,
                                 intent=intent(text,beat.get('voiceDirection','')),seed=seed(lesson['id']+'/'+ident+'/'+text)))
    return rows


def raw(lesson,profile,cache,assets,choices=None):
    rows=lines(lesson)
    cache.mkdir(exist_ok=True,parents=True)
    write(cache/'script.json',rows)
    generate(rows,cache,assets,profile,choices)
    return rows


def deliver(lesson,profile,rows,cache,out,assets):
    align=CaptionAligner(assets);scenes=[];audio=[];checks=[];chapter_start=0
    silence=lambda n:np.zeros(n,dtype='float32')
    for scene in lesson['scenes']:
        cursor=round(.20*RATE);pieces=[silence(cursor)];cues=[];beat_rows=[]
        for beat_index,beat in enumerate(scene['beats']):
            subset=[r for r in rows if r['scene']==scene['id'] and r['beat']==beat['id']]
            start_sample=cursor
            for i,row in enumerate(subset):
                path=cache/(row['id']+'.wav');source,rate=read_wav(path)
                duration=len(trim_room(source,rate))/rate
                syllable_len=len(words(spoken(row['text'])))
                # Respect differences among sentences while giving technical clauses space to land.
                base={'question':156,'action':160,'evidence':151,'narrative':165}[row['intent']]
                target=60*syllable_len/base
                tempo=max(.84,min(1.06,(duration/max(.2,target))**.80))
                wave=stretch(path,tempo)
                part_start=cursor/RATE
                cues+=acoustic_cues(align,wave,row['text'],part_start)
                pieces.append(wave);cursor+=len(wave)
                decoded=asr(align,wave,RATE)
                errors=edit_distance(words(spoken(row['text'])),words(decoded))
                checks.append(dict(id=row['id'],text=row['text'],transcript=decoded,errors=errors,
                                   words=syllable_len,tempo=round(tempo,4),seconds=round(len(wave)/RATE,3)))
                pause=PROFILES[profile]['pause'][row['intent']]
                if i==len(subset)-1:
                    hold=float(beat.get('practiceHoldSeconds',0))
                    pause=max(pause,hold,.54)
                    if beat_index==len(scene['beats'])-1:
                        pause=max(pause,.75)
                gap=round(pause*RATE);pieces.append(silence(gap));cursor+=gap
            beat_rows.append(dict(beat,start=round(start_sample/RATE,3),end=round(cursor/RATE,3),
                                  startFrame=round(start_sample/UNIT),endFrame=round(cursor/UNIT),
                                  speechEnd=round((cursor-gap)/RATE,3),holdSeconds=round(gap/RATE,3)))
        frames=math.ceil(cursor/UNIT);pieces.append(silence(frames*UNIT-cursor));audio.extend(pieces)
        scenes.append(dict(scene,durationFrames=frames,duration=frames/FPS,cues=cues,beats=beat_rows,startFrame=chapter_start))
        chapter_start+=frames
    out.mkdir(exist_ok=True,parents=True)
    with tempfile.TemporaryDirectory(dir=out) as temp:
        stage=Path(temp);data=dict(lesson,fps=FPS,width=1280,height=720,scenes=scenes,durationFrames=chapter_start)
        level=master(np.concatenate(audio),stage/'narration.m4a')
        data['delivery']={'status':'provisional','kind':'English dialogue only','voiceProfile':profile,'sampleRate':RATE,
                          'wordsPerMinute':round(60*sum(c['words'] for c in checks)/(chapter_start/FPS),2),**level}
        data['voiceBuild']=hashlib.sha256((json.dumps(lesson,sort_keys=True)+json.dumps(PROFILES[profile],sort_keys=True)).encode()).hexdigest()
        write(stage/'episode.json',data)
        (stage/'captions.srt').write_text(srt(scenes))
        for name in ('narration.m4a','captions.srt','episode.json'):
            (stage/name).replace(out/name)
    write(cache/'speech-audit.json',dict(asrWordErrors=sum(c['errors'] for c in checks),words=sum(c['words'] for c in checks),parts=checks))
    print(lesson['id'],round(chapter_start/FPS,3),data['delivery'],flush=True)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--lesson',type=Path,required=True)
    p.add_argument('--cache',type=Path,required=True,help='Private, profile-specific work directory')
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--profile',choices=PROFILES,default='workshop')
    p.add_argument('--assets',type=Path,default=DEFAULT_CACHE)
    p.add_argument('--choices',type=Path,help='Saved pickups for this performance and script. Omit when switching profiles.')
    p.add_argument('--stage',choices=('all','raw','pack'),default='all')
    a=p.parse_args();lesson=json.loads(a.lesson.read_text());rows=lines(lesson)
    if a.stage in ('all','raw'):
        raw(lesson,a.profile,a.cache,a.assets,json.loads(a.choices.read_text()) if a.choices else None)
    if a.stage in ('all','pack'):
        with contextlib.ExitStack() as resources:
            source=a.cache
            if a.stage=='pack' and (source/'raw-wavs.zip').exists():
                temporary=Path(resources.enter_context(tempfile.TemporaryDirectory()))
                frozen=unpack(source,temporary)
                if frozen!=a.profile:
                    raise ValueError('Choose the profile recorded in take/sha256.json when packing a frozen take')
                source=temporary
            if rows!=json.loads((source/'script.json').read_text()):
                raise ValueError('Regenerate the take after changing the lesson')
            deliver(lesson,a.profile,rows,source,a.out,a.assets)
            if source!=a.cache:
                (a.out/'speech-audit.json').write_bytes((source/'speech-audit.json').read_bytes())
