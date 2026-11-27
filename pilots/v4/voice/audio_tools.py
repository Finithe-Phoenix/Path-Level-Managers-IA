"""Build 48 kHz dialogue masters and measure the delivered AAC against its script."""
import itertools
import json
from pathlib import Path
import re
import subprocess
import tempfile
import textwrap

import numpy as np
from perform import read_wav, save_wav, spoken, trim_room

RATE = 48000
FPS = 24
UNIT = RATE // FPS


def stretch(path, tempo):
    raw = subprocess.check_output(['ffmpeg','-nostdin','-v','error','-i',str(path),'-af',f'atempo={tempo:.8f}',
                                   '-ar',str(RATE),'-ac','1','-f','f32le','-'])
    return trim_room(np.frombuffer(raw,'<f4'),RATE)


def caption_pages(text):
    words = text.split()
    result = []
    while words:
        end = len(words)
        def lines(n):
            return textwrap.wrap(' '.join(words[:n]),38,break_long_words=False,break_on_hyphens=False)
        while end>1 and len(lines(end))>2:
            end-=1
        if end < len(words):
            cuts = [i for i in range(4,end+1) if words[i-1].rstrip('”"').endswith((',',':',';','?','.'))]
            if cuts and cuts[-1] >= end*.55:
                end=cuts[-1]
            if len(words)-end == 1 and end>3:
                end-=2
        result.append('\n'.join(lines(end)))
        words=words[end:]
    return result


def acoustic_cues(aligner, samples, text, start):
    pages = caption_pages(text)
    bounds = aligner.align(samples,RATE,[spoken(p.replace('\n',' ')) for p in pages])
    return [dict(start=round(start+a,3),end=round(start+b,3),text=p) for p,(a,b) in zip(pages,bounds,strict=True)]


def stamp(sec):
    total,ms=divmod(round(sec*1000),1000)
    mm,ss=divmod(total,60)
    hh,mm=divmod(mm,60)
    return f'{hh:02}:{mm:02}:{ss:02},{ms:03}'


def srt(scenes):
    blocks=[]
    offset=0
    for scene in scenes:
        for c in scene['cues']:
            blocks.append(f"{len(blocks)+1}\n{stamp(offset/FPS+c['start'])} --> {stamp(offset/FPS+c['end'])}\n{c['text']}")
        offset+=scene['durationFrames']
    return '\n\n'.join(blocks)+'\n'


def read_stats(args):
    data=subprocess.run(args,stderr=subprocess.PIPE,stdout=subprocess.DEVNULL,text=True,check=True).stderr
    return json.loads(data[data.rindex('{'):data.rindex('}')+1])


def levels(path):
    data=read_stats(['ffmpeg','-nostdin','-hide_banner','-i',str(path),'-af','loudnorm=I=-18:TP=-1.8:LRA=8:print_format=json','-f','null','-'])
    return {'integratedLUFS':float(data['input_i']),'truePeakDBTP':float(data['input_tp']),'loudnessRangeLU':float(data['input_lra'])}


def master(samples,dest):
    dest.parent.mkdir(exist_ok=True,parents=True)
    with tempfile.TemporaryDirectory(dir=dest.parent) as tmp:
        source=Path(tmp)/'take.wav'
        save_wav(source,samples,RATE)
        start=['ffmpeg','-nostdin','-hide_banner','-i',str(source)]
        flt='highpass=f=55,loudnorm=I=-18:TP=-1.8:LRA=8'
        stats=read_stats(start+['-af',flt+':print_format=json','-f','null','-'])
        take={'measured_I':'input_i','measured_TP':'input_tp','measured_LRA':'input_lra','measured_thresh':'input_thresh','offset':'target_offset'}
        measured=':'.join(k+'='+stats[v] for k,v in take.items())
        pcm=Path(tmp)/'calibrated.wav'
        subprocess.run(start+['-v','error','-af',flt+':'+measured+':linear=true','-ar',str(RATE),
                              '-c:a','pcm_f32le','-t',f'{len(samples)/RATE:.9f}',str(pcm)],check=True)
        out=Path(tmp)/'final.m4a'
        gain=0.0
        for attempt in range(4):
            # Re-encode from the lossless first-pass output; measure the AAC listeners actually receive.
            filters=f'volume={gain:.4f}dB,alimiter=limit=0.8128:level=0:latency=1'
            subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',str(pcm),'-af',filters,'-c:a','aac',
                            '-b:a','192k','-map_metadata','-1','-movflags','+faststart',
                            '-t',f'{len(samples)/RATE:.9f}',str(out)],check=True)
            value=levels(out)
            if abs(value['integratedLUFS']+18)<=.08 and value['truePeakDBTP']<=-.9:
                out.replace(dest)
                return value
            gain += -18-value['integratedLUFS']
        raise ValueError(f'Voice mastering outside target: {value}')


def asr(aligner,samples,rate):
    logits=aligner.logits(samples,rate)
    vocab={n:k for k,n in aligner.vocab.items()}
    return ''.join(vocab[i] for i,_ in itertools.groupby(logits.argmax(axis=1)) if i).replace('|',' ').strip().lower()


def words(s):
    return re.findall(r"[a-z]+(?:'[a-z]+)?",s.lower().replace('-', ' '))


def edit_distance(a,b):
    d=list(range(len(b)+1))
    for i,word in enumerate(a,1):
        current=[i]
        for j,other in enumerate(b,1):
            current.append(min(current[-1]+1,d[j]+1,d[j-1]+(word!=other)))
        d=current
    return d[-1]
