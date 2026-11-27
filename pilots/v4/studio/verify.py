"""Verify the pilot's media, selected takes, authored source and chapter timeline."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

ROOT=Path(__file__).resolve().parents[1]

def sha(p):
    with p.open('rb') as f:
        return hashlib.file_digest(f,'sha256').hexdigest()

def check(decode=False):
    manifest=json.loads((ROOT/'manifest.json').read_text())
    for rel,expected in manifest['sha256'].items():
        if sha(ROOT/rel)!=expected:
            raise ValueError(f'Content differs for {rel}')
    id_=manifest['pilot']
    path=ROOT/'media'/(id_+'.mp4')
    media=json.loads(subprocess.check_output(['ffprobe','-v','error','-of','json','-show_streams','-show_format','-show_chapters',path]))
    v=next(s for s in media['streams'] if s['codec_type']=='video')
    a=next(s for s in media['streams'] if s['codec_type']=='audio')
    c=next(s for s in media['streams'] if s['codec_type']=='subtitle')
    if (v['codec_name'],v['width'],v['height'],int(v['nb_frames']))!=('h264',*manifest['size'],manifest['frames']):
        raise ValueError('Unexpected picture')
    if (a['codec_name'],a['tags']['language'],c['codec_name'],c['tags']['language'])!=('aac','eng','mov_text','eng'):
        raise ValueError('Unexpected narration or captions')
    episode=json.loads((ROOT/'work'/id_/'audio/episode.json').read_text())
    if len(media['chapters'])!=len(episode['scenes']):
        raise ValueError('Missing chapters')
    pos=0
    for chapter,scene in zip(media['chapters'],episode['scenes'],strict=True):
        if chapter['tags']['title']!=scene['title'] or abs(float(chapter['start_time'])-pos/24)>.002:
            raise ValueError(f"Chapter differs for {scene['id']}")
        pos+=scene['durationFrames']
    if abs(float(media['format']['duration'])-pos/24)>.15:
        raise ValueError('Unexpected duration')
    if decode:
        subprocess.run(['ffmpeg','-nostdin','-v','error','-xerror','-threads','1','-i',path,'-map','0:v','-map','0:a','-f','null','-'],check=True)
    print(f'{id_}: {v["nb_frames"]} frames, {len(media["chapters"])} chapters, English audio and captions verified.')

if __name__=='__main__':
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--decode',action='store_true')
    check(ap.parse_args().decode)
