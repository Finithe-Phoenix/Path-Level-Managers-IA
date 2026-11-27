"""Rehearse up to two alternate seeded readings of a flagged line, preserving its script."""
import argparse
from collections import Counter
import json
import re
import numpy as np
from pathlib import Path
import tempfile

from alignment import CaptionAligner
from assets import DEFAULT_CACHE
from audio_tools import RATE,asr,edit_distance,stretch,words
from perform import PROFILES,read_wav,save_wav,spoken,trim_room
from supertonic import Narrator

# Retake technical words before replacing an otherwise good line for a spelling distinction.
TERMS=set('test tests true false zero one two three four five six seven eight nine ten equal greater red green passed failed increase decrease above below hours cost hours quality wait defects hundred'.split())


def tokens(text):
    replace={'neighbouring':'neighboring','centre':'center','then':'than','fulfil':'fulfill'}
    return [replace.get(w,w) for w in words(text)]


def measured(path,text,align,tempo):
    y=stretch(path,tempo)
    decoded=asr(align,y,RATE)
    ref=tokens(spoken(text));got=tokens(decoded)
    a=Counter(w for w in ref if w in TERMS);b=Counter(w for w in got if w in TERMS)
    critical=sum((a-b).values())+sum((b-a).values())
    return (critical,edit_distance(ref,got)),decoded


def select(rows,source,assets,profile,overrides=None,limit=2,slots=None):
    engine=PROFILES[profile]
    model=Narrator(assets,engine['preset'],1)
    align=CaptionAligner(assets)
    records=[]
    for row in rows:
        path=source/(row['id']+'.wav');text=row['text']
        def tempo_for(candidate):
            if slots:
                audio,rate=read_wav(candidate)
                box=slots[row['id']]/24-.16-engine['pause'][row['intent']]
                return max(.80,len(trim_room(audio,rate))/rate/box)
            return overrides.get(row['id'],1.0) if overrides else 1.0
        best,decoded=measured(path,text,align,tempo_for(path))
        first=list(best);winner=row['seed'];first_text=decoded
        if best[0] or best[1]>=3:
            with tempfile.TemporaryDirectory(dir=source) as temporary:
                alt=Path(temporary)/'alternative.wav'
                for index in range(1,limit+1):
                    candidate_seed=(row['seed']+7919*index)%2**32
                    speed=engine['speed'][row['intent']]+([-.012,.012][(index-1)%2])
                    if index>=3:
                        phrases=re.split(r'(?<=[.!?])\s+',text)
                        fragments=[]
                        for phrase_index,phrase in enumerate(phrases):
                            if phrase_index:fragments.append(np.zeros(round(model.rate*.26),dtype=np.float32))
                            part=model.synthesize(spoken(phrase),speed,engine['steps'],candidate_seed+phrase_index)
                            fragments.append(trim_room(part,model.rate))
                        raw=np.concatenate(fragments)
                    else:
                        raw=model.synthesize(spoken(text),speed,engine['steps'],candidate_seed)
                    save_wav(alt,trim_room(raw,model.rate),model.rate)
                    score,transcript=measured(alt,text,align,tempo_for(alt))
                    if score<best:
                        alt.replace(path);best=score;winner=candidate_seed;decoded=transcript
                    if best[0]==0 and best[1]<=1:break
        records.append(dict(id=row['id'],first=first,firstText=first_text,score=best,winnerSeed=winner,decoded=decoded))
        print(row['id'],first,best,flush=True)
    (source/'retake-receipt.json').write_text(json.dumps(records,indent=2)+'\n')


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--input',type=Path,required=True)
    p.add_argument('--source',type=Path,required=True);p.add_argument('--profile',required=True)
    p.add_argument('--assets',type=Path,default=DEFAULT_CACHE);p.add_argument('--rates',type=Path)
    p.add_argument('--limit',type=int,default=2);p.add_argument('--timeline',type=Path)
    a=p.parse_args();r=json.loads(a.rates.read_text()) if a.rates else None
    slots={b['id']:b['endFrame']-b['startFrame'] for b in json.loads(a.timeline.read_text())['beats']} if a.timeline else None
    select(json.loads(a.input.read_text()),a.source,a.assets,a.profile,r,a.limit,slots)
