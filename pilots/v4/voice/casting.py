"""Make three level-matched blind audio reels with shared shot boundaries."""
import argparse
import json
from pathlib import Path
import secrets
import statistics

import numpy as np
from alignment import CaptionAligner
from assets import DEFAULT_CACHE
from audio_tools import FPS,RATE,UNIT,acoustic_cues,asr,edit_distance,master,srt,stretch,words
from perform import PROFILES,read_wav,spoken,trim_room


def write(path,data):
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')


def build(passage,private,out,assets,options,labels):
    rows=json.loads(passage.read_text())
    raw={name:private/(name+'-raw') for name in options}
    profile={name:name for name in options}
    out.mkdir(parents=True,exist_ok=True)
    private.mkdir(parents=True,exist_ok=True)
    keyfile=private/'casting-key.json'
    if not keyfile.exists():
        profiles=list(raw)
        secrets.SystemRandom().shuffle(profiles)
        write(keyfile,dict(zip('ABC',profiles,strict=True)))
    key=json.loads(keyfile.read_text())
    assert set(key)==set('ABC') and set(key.values())==set(raw)
    lengths={}
    for name,folder in raw.items():
        lengths[name]=[]
        for row in rows:
            wave,rate=read_wav(folder/(row['id']+'.wav'))
            lengths[name].append(len(trim_room(wave,rate))/rate)
    median=[statistics.median(t[i] for t in lengths.values()) for i in range(len(rows))]
    holds={'question':1.05,'action':.52,'evidence':.66,'narrative':.43}
    pre=.16
    # Exactly 52 seconds of shared picture. Preserve each interpretation's intra-line timing.
    frame_counts=[]
    spoken_secs=52-sum(pre+holds[row['intent']] for row in rows)
    exact=0
    for index,row in enumerate(rows):
        exact+=FPS*(pre+spoken_secs*median[index]/sum(median)+holds[row['intent']])
        frame_counts.append(round(exact)-sum(frame_counts))
    frame_counts[-1]=52*FPS-sum(frame_counts[:-1]);timeline=[];start_frame=0
    for row,frames in zip(rows,frame_counts,strict=True):
        timeline.append(dict(id=row['id'],startFrame=start_frame,endFrame=start_frame+frames,text=row['text']))
        start_frame+=frames
    timing_file=out/'timeline.json'
    if timing_file.exists():
        locked=json.loads(timing_file.read_text())
        if locked['fps']!=FPS or [(v['id'],v['text']) for v in locked['beats']] != [(r['id'],r['text']) for r in rows]:
            raise ValueError('A new passage requires a new, empty casting output directory')
        frame_counts=[v['endFrame']-v['startFrame'] for v in locked['beats']]
        assert sum(frame_counts)==locked['durationFrames'] and all(n>0 for n in frame_counts)
    else:
        write(timing_file,{'fps':FPS,'durationFrames':start_frame,'beats':timeline})
    aligner=CaptionAligner(assets)
    metrics=private/'objective-measurements.json'
    result=json.loads(metrics.read_text()) if metrics.exists() else {}
    for label,name in key.items():
        if label not in labels:
            continue
        chunks=[]; scenes=[];details=[];errors=0;word_count=0
        for index,(row,frames) in enumerate(zip(rows,frame_counts,strict=True)):
            slot=frames/FPS
            pad=PROFILES[profile[name]]['pause'][row['intent']]
            target=slot-pre-pad
            tempo=max(.80,lengths[name][index]/target)
            path=raw[name]/(row['id']+'.wav')
            wave=stretch(path,tempo)
            start=round(pre*RATE)
            if start+len(wave)>frames*UNIT-1:
                raise ValueError(f'Phrase crosses the shared cut in {row["id"]}')
            output=np.zeros(frames*UNIT,dtype='float32');output[start:start+len(wave)]=wave
            decoded=asr(aligner,wave,RATE)
            ref=words(spoken(row['text']));err=edit_distance(ref,words(decoded))
            errors+=err;word_count+=len(ref)
            chunks.append(output)
            cues=acoustic_cues(aligner,wave,row['text'],pre)
            scenes.append({'id':row['id'],'durationFrames':frames,'cues':cues})
            details.append(dict(beat=row['id'],tempo=round(tempo,4),speechSeconds=round(len(wave)/RATE,3),
                                postPause=round(slot-pre-len(wave)/RATE,3),decoded=decoded,wordErrors=err))
        levels=master(np.concatenate(chunks),out/(label+'.m4a'))
        (out/(label+'.srt')).write_text(srt(scenes))
        result[label]=dict(levels=levels,alignedWords=word_count,rawAsrWordErrors=errors,beats=details)
        print(label,word_count,errors,levels,flush=True)
    write(metrics,result)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--passage',type=Path,required=True)
    p.add_argument('--private',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--assets',type=Path,default=DEFAULT_CACHE)
    p.add_argument('--profiles',nargs=3,choices=('reference','workshop','reader'),default=['reference','workshop','reader'])
    p.add_argument('--labels',default='ABC',help='Subset to rebuild with an existing blind key')
    a=p.parse_args()
    build(a.passage,a.private,a.out,a.assets,a.profiles,a.labels)
