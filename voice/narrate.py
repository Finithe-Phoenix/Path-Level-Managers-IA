"""Direct English performances with a local diffusion narrator and acoustic caption alignment."""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import re
import subprocess
import tempfile
import textwrap
import wave

import numpy as np

from alignment import CaptionAligner
from assets import DEFAULT_CACHE, LOCK, ensure_assets
from supertonic import Narrator
from verify import timestamp

HERE = Path(__file__).resolve().parent
FPS = 24
PRONUNCIATION = {
    "GitHub": "Git Hub", "VS Code": "Vee Ess Code", "OpenAI": "Open A I", "OpenCode": "Open Code",
    "PRs": "pull requests", "PR": "pull request", "CLI": "command line interface",
    "API": "A P I", "CI": "C I", "AI": "A I", "MAI": "M A I", "GPT": "G P T",
    "IDs": "eye dees", "ID": "eye dee", "Copilot": "co-pilot",
    "SKILL.md": "skill dot em dee", "README.md": "read me dot em dee", "JSON": "Jason",
}
TERMS = re.compile(r"(?<!\w)(" + "|".join(re.escape(s) for s in sorted(PRONUNCIATION, key=len, reverse=True)) + r")(?!\w)", re.IGNORECASE)
SAY = {k.lower(): v for k, v in PRONUNCIATION.items()}
PUNCT = str.maketrans({"“": '"', "”": '"', "’": "'", "‘": "'", "—": ", ", "–": "-", "_": " ", "`": ""})


def spoken(text):
    return TERMS.sub(lambda match: SAY[match.group(0).lower()], text.translate(PUNCT)).strip()


def sentence_groups(text):
    sentences = re.split(r'(?<=[.!?])\s+|(?<=[.!?][”"])\s+', text.strip())
    current = ""
    for sentence in sentences:
        if current and (len(current) >= 48 or len(current) + len(sentence) > 140 or current.rstrip('”"').endswith("?")):
            yield current
            current = ""
        current = (current + " " + sentence).strip()
    if current:
        yield current


def pages(text):
    words = text.split()
    while words:
        end = len(words)
        while end > 1 and len(textwrap.wrap(" ".join(words[:end]), 40, break_long_words=False, break_on_hyphens=False)) > 2:
            end -= 1
        if end < len(words):
            cuts = [i for i in range(4, end + 1) if words[i - 1].rstrip('”"').endswith((",", ":", ";", "—"))]
            if cuts and cuts[-1] >= end * .52:
                end = cuts[-1]
        yield "\n".join(textwrap.wrap(" ".join(words[:end]), 40, break_long_words=False, break_on_hyphens=False))
        words = words[end:]


def intent(text):
    if "?" in text:
        return "question"
    if re.match(r"^(look|open|find|try|attach|read|run|add|choose|inspect|select|compare|check|watch|keep|pause|notice|use|set|record|follow|ask|trace|count|divide)\b", text, re.I):
        return "action"
    if re.search(r"\b(because|expected|result|means|succeeds|passes|fails|instead|evidence|observe|reveals|however|therefore)\b", text, re.I):
        return "evidence"
    return "narrative"


def trim_room(waveform, rate):
    """Retain word onsets and breaths while giving the editor control of between-phrase room."""
    win = round(rate * .008)
    count = len(waveform) // win
    if count < 2:
        raise ValueError("Invalid empty phrase")
    energy = np.sqrt(np.mean(waveform[:count * win].reshape(count, win) ** 2, axis=1))
    voiced = np.flatnonzero(energy > max(np.max(energy) * .006, .0008))
    if not len(voiced):
        raise ValueError("No speech detected")
    start = max(0, int(voiced[0] * win - rate * .055))
    end = min(len(waveform), int((voiced[-1] + 1) * win + rate * .085))
    return waveform[start:end]


def scene_audio(synth, aligner, episode_id, scene, profile, is_last):
    rate = synth.rate
    parts = [np.zeros(round(rate * .22), np.float32)]
    cursor = len(parts[0])
    cues = []
    groups = list(sentence_groups(scene["narration"]))
    for index, sentence in enumerate(groups):
        pages_text = list(pages(sentence))
        plain = [spoken(page.replace("\n", " ")) for page in pages_text]
        if not all(plain):
            raise ValueError(f"Empty caption in {episode_id}/{scene['id']}")
        mode = intent(sentence)
        seed = int.from_bytes(hashlib.sha256(f"{episode_id}/{scene['id']}/{index}/{sentence}".encode()).digest()[:4], "big")
        # A fixed seed changes the acoustic delivery from phrase to phrase while retaining reproducibility.
        rendered = synth.synthesize(" ".join(plain), profile["speeds"][mode], profile["diffusion_steps"], seed)
        samples = trim_room(rendered, rate)
        spans = aligner.align(samples, rate, plain)
        for page, (start, end) in zip(pages_text, spans, strict=True):
            cues.append({"start": round(cursor / rate + start, 3), "end": round(cursor / rate + end, 3), "text": page})
        parts.append(samples)
        cursor += len(samples)
        pause = {"question": .53, "action": .32, "narrative": .21, "evidence": .36}[mode]
        if index == len(groups) - 1:
            pause = .84 if is_last else .59
        gap = np.zeros(round(rate * pause), np.float32)
        cursor += len(gap)
        parts.append(gap)
    frames = math.ceil(cursor * FPS / rate)
    samples_total = round(frames * rate / FPS)
    parts.append(np.zeros(samples_total - cursor, np.float32))
    return np.concatenate(parts), frames, cues


def master(samples, rate, dest, profile):
    """Preserve the 44.1 kHz generated performance in a two-pass 48 kHz AAC dialogue master."""
    with tempfile.TemporaryDirectory(dir=dest.parent) as tmp:
        directory = Path(tmp)
        raw = directory / "speech.wav"
        with wave.open(str(raw), "wb") as output:
            output.setparams((1, 2, rate, 0, "NONE", "not compressed"))
            output.writeframes(np.rint(np.clip(samples, -1, 1) * 32767).astype("<i2").tobytes())
        base = f"loudnorm=I={profile['integrated_lufs']}:TP={profile['true_peak_dbtp']}:LRA=9"
        ff = ["ffmpeg", "-nostdin", "-hide_banner", "-i", str(raw)]
        # A subtle low-cut keeps the voice steady while preserving its natural dynamics.
        clean = "highpass=f=55,"
        result = subprocess.run(ff + ["-af", clean + base + ":print_format=json", "-f", "null", "-"], capture_output=True, text=True, check=True)
        stats = json.loads(result.stderr[result.stderr.rindex("{"):result.stderr.rindex("}")+1])
        keys = {"measured_I":"input_i", "measured_TP":"input_tp", "measured_LRA":"input_lra", "measured_thresh":"input_thresh", "offset":"target_offset"}
        measured = ":".join(f"{k}={stats[v]}" for k,v in keys.items())
        subprocess.run(ff + ["-v","error","-af",clean+base+":"+measured+":linear=true","-ar","48000","-c:a","aac",
                             "-b:a","192k","-t",f"{len(samples)/rate:.9f}","-movflags","+faststart",str(directory/"audio.m4a")], check=True)
        os.replace(directory/"audio.m4a",dest)


def produce(synth, aligner, episode, dest, profile):
    dest.mkdir(parents=True, exist_ok=True)
    key = hashlib.sha256(json.dumps([episode,profile],sort_keys=True).encode())
    for p in (Path(__file__), HERE/"alignment.py", HERE/"supertonic.py", LOCK):key.update(p.read_bytes())
    identity = key.hexdigest()
    marker = dest/"episode.json"
    if marker.exists() and json.loads(marker.read_text()).get("voiceBuild")==identity and all((dest/i).is_file() for i in ("narration.m4a","captions.srt")):
        return
    audio, timed, captions = [], [], []
    start_frame = 0
    for i, scene in enumerate(episode["scenes"]):
        w, frames, cues = scene_audio(synth, aligner, episode["id"], scene, profile, i == len(episode["scenes"])-1)
        audio.append(w)
        timed.append(dict(scene, durationFrames=frames, duration=frames/FPS, cues=cues))
        for cue in cues:
            captions.append(f"{len(captions)+1}\n{timestamp(start_frame/FPS+cue['start'])} --> {timestamp(start_frame/FPS+cue['end'])}\n{cue['text']}")
        start_frame += frames
    data = dict(episode, fps=FPS, width=1280, height=720, durationFrames=start_frame, scenes=timed, voiceBuild=identity)
    with tempfile.TemporaryDirectory(dir=dest) as tmp:
        stage=Path(tmp)
        master(np.concatenate(audio), synth.rate, stage/"narration.m4a", profile)
        (stage/"captions.srt").write_text("\n\n".join(captions)+"\n")
        (stage/"episode.json").write_text(json.dumps(data, indent=2, ensure_ascii=False)+"\n")
        for name in ("narration.m4a","captions.srt","episode.json"):os.replace(stage/name,dest/name)
    print(f"{episode['id']} delivered {start_frame/FPS:.2f}s and {len(captions)} acoustic cues",flush=True)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lessons", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--episode", action="append", default=[])
    parser.add_argument("--assets", type=Path, default=DEFAULT_CACHE)
    parser.add_argument("--profile", type=Path, default=HERE/"profile.json")
    parser.add_argument("--threads", type=int, default=1)
    args=parser.parse_args()
    ensure_assets(args.assets)
    data=json.loads(args.lessons.read_text())
    if missing:=set(args.episode)-{ep["id"] for ep in data}:parser.error(f"Unknown episodes: {sorted(missing)}")
    profile=json.loads(args.profile.read_text())
    synth=Narrator(args.assets, profile["preset"], args.threads)
    aligner=CaptionAligner(args.assets)
    for ep in data:
        if not args.episode or ep["id"] in args.episode:produce(synth,aligner,ep,args.out/ep["id"],profile)


if __name__ == "__main__":
    main()
