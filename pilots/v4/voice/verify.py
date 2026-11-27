"""Verify the exact final dialogue, its scene/beat clock and accessible subtitles."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

from audio_tools import FPS,RATE,levels,srt


def digest(path):
    with path.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()


def verify(lesson_file,source):
    script=json.loads(lesson_file.read_text());ep=json.loads((source/'episode.json').read_text());audio=source/'narration.m4a'
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',audio]))['streams']
    if len(probe)!=1 or (probe[0]['codec_name'],probe[0]['channels'],int(probe[0]['sample_rate']))!=('aac',1,RATE):
        raise ValueError('Dialogue must be a single mono AAC stream at 48 kHz')
    assert ep['id']==script['id'] and ep['fps']==FPS and ep['durationFrames']==sum(s['durationFrames'] for s in ep['scenes'])
    seconds=ep['durationFrames']/FPS
    assert abs(float(probe[0]['duration'])-seconds)<.025
    total_cues=0;total_beats=0;holds=[];absolute=0
    for source_scene,sc in zip(script['scenes'],ep['scenes'],strict=True):
        assert sc['id']==source_scene['id'] and sc['narration']==source_scene['narration'] and sc['startFrame']==absolute
        assert ' '.join(c['text'].replace('\n',' ') for c in sc['cues']).split()==sc['narration'].split()
        edge=0
        for c in sc['cues']:
            assert 0<=edge<=c['start']<c['end']<=sc['duration']+.001
            edge=c['end'];total_cues+=1
        last=0
        for original,b in zip(source_scene['beats'],sc['beats'],strict=True):
            assert all(b[k]==value for k,value in original.items())
            assert last<=b['startFrame']<b['endFrame']<=sc['durationFrames']
            assert 0.0<=b['start']<b['speechEnd']<b['end']<=sc['duration']+.001
            assert abs((b['end']-b['speechEnd'])-b['holdSeconds'])<.0021
            assert b['holdSeconds']+.001>=b.get('practiceHoldSeconds',0)
            if b.get('practiceHoldSeconds'):holds.append(dict(scene=sc['id'],beat=b['id'],seconds=b['holdSeconds']))
            total_beats+=1;last=b['endFrame']
        absolute+=sc['durationFrames']
    assert (source/'captions.srt').read_text()==srt(ep['scenes'])
    measures=levels(audio)
    assert abs(measures['integratedLUFS']+18)<.1 and measures['truePeakDBTP']<=-.9
    subprocess.run(['ffmpeg','-nostdin','-v','error','-xerror','-i',audio,'-f','null','-'],check=True)
    return dict(id=ep['id'],seconds=round(seconds,3),scenes=len(ep['scenes']),beats=total_beats,cues=total_cues,
                authoredHolds=holds,sha256=digest(audio),captionsSha256=digest(source/'captions.srt'),**measures)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--lesson',type=Path,required=True)
    p.add_argument('--source',type=Path,required=True);p.add_argument('--report',type=Path);a=p.parse_args()
    report=verify(a.lesson,a.source);serialized=json.dumps(report,indent=2)+'\n'
    if a.report:a.report.write_text(serialized)
    print(serialized)
