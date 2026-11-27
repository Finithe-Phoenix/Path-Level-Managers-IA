"""Freeze or reconstruct the exact chosen mono WAVs without requiring speech synthesis."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import tempfile
import zipfile

from perform import PROFILES


def sha(path):
    with path.open('rb') as source:
        return hashlib.file_digest(source,'sha256').hexdigest()


def write(path,value):
    path.write_text(json.dumps(value,indent=2,ensure_ascii=False)+'\n')


def freeze(raw,out,profile):
    out.mkdir(exist_ok=True,parents=True)
    rows=json.loads((raw/'script.json').read_text())
    receipts=json.loads((raw/'retake-receipt.json').read_text())
    winners={r['id']:r['winnerSeed'] for r in receipts}
    choices={};assets={}
    for row in rows:
        ident=row['id']
        if not re.fullmatch(r'[A-Za-z0-9_-]+',ident):
            raise ValueError('Unsupported thought identifier')
        chosen=winners.get(ident,row['seed']);base=row['seed']
        index=((chosen-base) % 2**32)//7919
        if chosen!=base:
            choices[ident]=dict(alternate=True,seed=chosen,speed=PROFILES[profile]['speed'][row['intent']]+[-.012,.012][(index-1)%2],
                                splitSentences=index>=3)
        name=ident+'.wav';assets[name]=sha(raw/name)
    with tempfile.TemporaryDirectory(dir=out) as temp:
        stage=Path(temp)
        with zipfile.ZipFile(stage/'raw-wavs.zip','w') as archive:
            for name in sorted(assets):
                entry=zipfile.ZipInfo(name,date_time=(1980,1,1,0,0,0));entry.external_attr=0o644<<16
                archive.writestr(entry,(raw/name).read_bytes(),compress_type=zipfile.ZIP_DEFLATED,compresslevel=7)
        shutil.copyfile(raw/'script.json',stage/'script.json');write(stage/'choices.json',choices)
        write(stage/'sha256.json',dict(files=assets,archive=sha(stage/'raw-wavs.zip'),script=sha(stage/'script.json'),choices=sha(stage/'choices.json'),profile=profile))
        for name in ('raw-wavs.zip','script.json','choices.json','sha256.json'):
            (stage/name).replace(out/name)
    print(out.name,len(assets),len(choices),sha(out/'raw-wavs.zip'),flush=True)


def unpack(archive_root,out):
    manifest=json.loads((archive_root/'sha256.json').read_text())
    for name,field in [('raw-wavs.zip','archive'),('script.json','script'),('choices.json','choices')]:
        if sha(archive_root/name)!=manifest[field]:
            raise ValueError(f'Invalid {name} in the frozen performance')
    out.mkdir(exist_ok=True,parents=True)
    with zipfile.ZipFile(archive_root/'raw-wavs.zip') as src:
        members=src.namelist()
        if set(members)!=set(manifest['files']) or len(members)!=len(set(members)):
            raise ValueError('Missing or duplicate thought in the frozen archive')
        for name in members:
            if not re.fullmatch(r'[A-Za-z0-9_-]+\.wav',name):
                raise ValueError('Invalid path in frozen archive')
            path=out/name
            with src.open(name) as stream,path.open('wb') as target:
                shutil.copyfileobj(stream,target)
            if sha(path)!=manifest['files'][name]:
                raise ValueError('Frozen performance hash mismatch: '+name)
    shutil.copyfile(archive_root/'script.json',out/'script.json')
    return manifest['profile']


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('operation',choices=('freeze','unpack'))
    parser.add_argument('--source',type=Path,required=True);parser.add_argument('--out',type=Path,required=True)
    parser.add_argument('--profile',default='workshop');a=parser.parse_args()
    if a.operation=='freeze':freeze(a.source,a.out,a.profile)
    else:unpack(a.source,a.out)
