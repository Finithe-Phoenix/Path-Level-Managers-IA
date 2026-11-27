"""Generate one original English performance per thought on a single CPU thread."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile
import wave

import numpy as np

from assets import DEFAULT_CACHE, ensure_assets
from supertonic import Narrator

HERE = Path(__file__).resolve().parent
PROFILES = json.loads((HERE / 'profiles.json').read_text())


def seed(key):
    return int.from_bytes(hashlib.sha256(key.encode()).digest()[:4], 'big')


def trim_room(samples, rate):
    block = round(rate * .008)
    count = samples.size // block
    power = np.sqrt(np.mean(samples[:count * block].reshape(count, block)**2, axis=1))
    activity = np.flatnonzero(power > max(np.max(power)*.006, .0008))
    if not len(activity):
        raise ValueError('Thought has no audible speech')
    start = max(0, activity[0]*block-round(rate*.055))
    stop = min(len(samples), (activity[-1]+1)*block+round(rate*.085))
    return samples[start:stop]


def spoken(text):
    terms = {"GitHub":"Git Hub", "Copilot":"co-pilot", "VS Code":"Vee Ess Code", "CLI":"command line interface",
             "PR":"pull request", "PRs":"pull requests", "AI":"A I", "API":"A P I", "CI":"C I"}
    text = text.translate(str.maketrans({'“':'"','”':'"','’':"'",'—':', ','–':'-','`':''}))
    for old, new in terms.items():
        text = re.sub(r'\b'+re.escape(old)+r'\b', new, text, flags=re.I)
    return text


def save_wav(path, samples, rate):
    path.parent.mkdir(exist_ok=True, parents=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, suffix='.wav', delete=False) as temporary:
        name = temporary.name
    try:
        with wave.open(name, 'wb') as out:
            out.setparams((1,2,rate,0,'NONE','not compressed'))
            out.writeframes(np.rint(np.clip(samples,-1,1)*32767).astype('<i2').tobytes())
        os.replace(name, path)
    finally:
        Path(name).unlink(missing_ok=True)


def read_wav(path):
    with wave.open(str(path),'rb') as src:
        if (src.getnchannels(),src.getsampwidth()) != (1,2):
            raise ValueError(f'Expected mono signed 16-bit audio at {path}')
        return np.frombuffer(src.readframes(src.getnframes()), dtype='<i2').astype('float32')/32768, src.getframerate()


def recording(path, model, text, speed, steps, first_seed, split_sentences=False):
    if not split_sentences:
        raw=model.synthesize(spoken(text),speed,steps,first_seed)
        save_wav(path,trim_room(raw,model.rate),model.rate)
        return
    phrases=re.split(r'(?<=[.!?])\s+', text)
    parts=[]
    for index,phrase in enumerate(phrases):
        if index:
            parts.append(np.zeros(round(model.rate*.26),np.float32))
        raw=model.synthesize(spoken(phrase),speed,steps,first_seed+index)
        parts.append(trim_room(raw,model.rate))
    save_wav(path,trim_room(np.concatenate(parts),model.rate),model.rate)


def generate(rows, output, assets, name, choices=None):
    profile = PROFILES[name]
    if profile['engine'] != 'supertonic':
        raise ValueError('Unknown speech engine for this local profile.')
    ensure_assets(assets)
    synth = Narrator(assets,profile['preset'],1)
    for row in rows:
        text = spoken(row['text'])
        mode = row['intent']
        speed = profile['speed'][mode]
        if name == 'workshop':
            # Tiny variation within an intent prevents neighboring directions from acquiring an identical cadence.
            speed += [-.015, 0, .015][row['seed'] % 3]
        take=(choices or {}).get(row['id'])
        path=output/(row['id']+'.wav')
        if take and take.get('alternate'):
            recording(path,synth,row['text'],take['speed'],profile['steps'],take['seed'],take['splitSentences'])
        else:
            samples = synth.synthesize(text,speed,profile['steps'],row['seed'])
            save_wav(path,trim_room(samples,synth.rate),synth.rate)
        print(row['id'],flush=True)


if __name__=='__main__':
    cli=argparse.ArgumentParser(description=__doc__)
    cli.add_argument('--input',type=Path,required=True)
    cli.add_argument('--out',type=Path,required=True)
    cli.add_argument('--profile',choices=('reference','workshop','reader'),required=True)
    cli.add_argument('--assets',type=Path,default=DEFAULT_CACHE)
    cli.add_argument('--choices',type=Path,help='Saved, profile-specific direction and alternate seeds')
    args=cli.parse_args()
    generate(json.loads(args.input.read_text()),args.out,args.assets,args.profile,json.loads(args.choices.read_text()) if args.choices else None)
