"""Build a frame-aligned English audio stem, timed lesson, and SRT subtitles."""
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
import onnxruntime as ort
from kokoro_onnx import Kokoro

from assets import DEFAULT_CACHE, LOCK, ensure_assets

HERE = Path(__file__).resolve().parent
FPS = 24
RATE = 24000
SAMPLES_PER_FRAME = RATE // FPS
PRONOUNCE = {
    "GitHub": "Git Hub", "VS Code": "V S Code", "OpenAI": "Open A I",
    "OpenCode": "Open Code", "SKILL.md": "skill dot em dee", "AGENTS.md": "agents dot em dee",
    "CLAUDE.md": "Claude dot em dee", "README.md": "read me dot em dee",
    "README": "read me", "pytest": "pie test", "JSON": "Jason", "YAML": "yam el",
    "UTF-8": "U T F eight", "F1": "F one", "p95": "P ninety five",
    "RAG": "rag", "MAI": "M A I", "Phi": "fie", "CLI": "C L I", "LLMs": "large language models",
    "LLM": "large language model", "AI": "A I", "GCP": "G C P", "MCP": "M C P",
    "GPT": "G P T", "API": "A P I", "PRs": "pull requests", "PR": "pull request",
    "CI": "C I", "gh pr": "gee aitch pee are", "gh": "gee aitch",
}
TERM = re.compile(r"(?<!\w)(" + "|".join(re.escape(key) for key in sorted(PRONOUNCE, key=len, reverse=True)) + r")(?!\w)", re.I)
LOOKUP = {key.lower(): val for key, val in PRONOUNCE.items()}


def spoken(text):
    return TERM.sub(lambda m: LOOKUP[m.group().lower()], text.translate(str.maketrans({
        "“": "", "”": "", "‘": "'", "’": "'", "`": "", "—": ", ", "_": " ",
        "→": " to ", "≥": " greater than or equal to ", "≤": " less than or equal to ",
    })))


def pages(text):
    """Balance English captions into short clauses and up to two lines of dialogue."""
    sentences = re.split(r'(?<=[.!?])\s+|(?<=[.!?][”"])\s+', text.strip())
    for sentence in sentences:
        words = sentence.split()
        while words:
            end = len(words)
            while end > 1 and len(textwrap.wrap(" ".join(words[:end]), 40, break_long_words=False)) > 2:
                end -= 1
            if end < len(words):
                possible = [i for i in range(4, end + 1)
                            if words[i - 1].rstrip('”"').endswith((",", ":", ";", "—"))]
                if possible and possible[-1] >= end * .55:
                    end = possible[-1]
            yield "\n".join(textwrap.wrap(" ".join(words[:end]), 40, break_long_words=False))
            words = words[end:]


def timestamp(secs):
    rest, ms = divmod(round(secs * 1000), 1000)
    rest, sec = divmod(rest, 60)
    hrs, mins = divmod(rest, 60)
    return f"{hrs:02}:{mins:02}:{sec:02},{ms:03}"


def groups(items):
    """Group caption phonemes into takes that preserve cadence across caption breaks."""
    batch, chars = [], 0
    for item in items:
        previous_stop = batch and batch[-1][1].endswith((".", "!", "?"))
        if batch and (chars + len(item[1]) + 1 > 460 or (chars >= 130 and previous_stop)):
            yield batch
            batch, chars = [], 0
        batch.append(item)
        chars += 1 + len(item[1])
    if batch:
        yield batch


def scene_audio(synth, voice, scene, profile, is_last):
    text = scene["narration"]
    lead = round(.32 * RATE)
    parts = [np.zeros(lead, np.float32)]
    cursor = lead
    cues = []
    chunks = [(p, synth.tokenizer.phonemize(spoken(p.replace("\n", " ")), profile["language"]))
              for p in pages(text)]
    for section in groups(chunks):
        phonemes = " ".join(item[1] for item in section)
        audio, rate, marks = synth.create_timed(
            phonemes, voice=voice, is_phonemes=True, lang=profile["language"],
            speed=profile["speed"], sentence_pause=profile["sentence_pause"],
            clause_pause=profile["clause_pause"],
        )
        if rate != RATE or not len(audio) or not np.isfinite(audio).all():
            raise ValueError("The synthesizer returned invalid audio")
        if "".join(mark.phoneme for mark in marks) != phonemes:
            raise ValueError(f"Phoneme timing mismatch: {phonemes}")
        start_phoneme = 0
        take_start = cursor / RATE
        for page, phon in section:
            end_phoneme = start_phoneme + len(phon) - 1
            start_seconds = take_start + marks[start_phoneme].start
            end_seconds = min(take_start + marks[end_phoneme].end, take_start + len(audio) / RATE)
            cues.append({"start": round(start_seconds, 3), "end": round(end_seconds, 3), "text": page})
            start_phoneme = end_phoneme + 2
        parts.append(audio)
        # A short breath between takes is longer when the speaker leaves an open question.
        pause = .39 if section[-1][1].endswith("?") else .22
        gap = round(RATE * pause)
        parts.append(np.zeros(gap, np.float32))
        cursor += len(audio) + gap
    scene_frames = math.ceil((cursor / RATE + (.94 if is_last else .53)) * FPS)
    parts.append(np.zeros(scene_frames * SAMPLES_PER_FRAME - cursor, np.float32))
    return np.concatenate(parts), scene_frames, cues


def master(samples, dest, profile):
    """Measure first, then loudness-normalize the complete episode and encode one AAC stem."""
    with tempfile.TemporaryDirectory(dir=dest.parent) as work:
        wav = Path(work) / "take.wav"
        with wave.open(str(wav), "wb") as file:
            file.setparams((1, 2, RATE, 0, "NONE", "not compressed"))
            file.writeframes((np.clip(samples, -1, 1) * 32767).astype("<i2").tobytes())
        command = ["ffmpeg", "-nostdin", "-hide_banner", "-i", str(wav)]
        base = f"loudnorm=I={profile['integrated_lufs']}:TP={profile['true_peak_dbtp']}:LRA=8"
        measure = subprocess.run(command + ["-af", base + ":print_format=json", "-f", "null", "-"],
                                 capture_output=True, text=True, check=True)
        values = json.loads(measure.stderr[measure.stderr.rindex("{"):measure.stderr.rindex("}") + 1])
        fields = {"measured_I": "input_i", "measured_TP": "input_tp", "measured_LRA": "input_lra",
                  "measured_thresh": "input_thresh", "offset": "target_offset"}
        settings = ":".join(f"{to}={values[key]}" for to, key in fields.items())
        subprocess.run(command + ["-loglevel", "error", "-af", f"{base}:{settings}:linear=true",
                                  "-ar", "48000", "-t", f"{len(samples) / RATE:.9f}", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart",
                                  str(Path(work) / "narration.m4a")], check=True)
        os.replace(Path(work) / "narration.m4a", dest)


def produce(synth, episode, out, profile, key):
    out.mkdir(parents=True, exist_ok=True)
    marker = out / "episode.json"
    if marker.exists() and json.loads(marker.read_text()).get("voiceBuild") == key and all(
        (out / name).is_file() for name in ("narration.m4a", "captions.srt")
    ):
        print(f"{episode['id']} is current", flush=True)
        return
    voice = sum(weight * synth.get_voice_style(name) for name, weight in profile["voices"].items())
    if abs(sum(profile["voices"].values()) - 1.0) > .0001:
        raise ValueError("Voice weights must sum to one")
    position, track, scenes, captions = 0, [], [], []
    for i, scene in enumerate(episode["scenes"]):
        waveform, frames, cues = scene_audio(synth, voice, scene, profile, i == len(episode["scenes"]) - 1)
        track.append(waveform)
        scenes.append(dict(scene, durationFrames=frames, duration=frames / FPS, cues=cues))
        for cue in cues:
            start = timestamp(position / FPS + cue["start"])
            end = timestamp(position / FPS + cue["end"])
            captions.append(f"{len(captions) + 1}\n{start} --> {end}\n{cue['text']}")
        position += frames
    timed = dict(episode, fps=FPS, width=1280, height=720, scenes=scenes, durationFrames=position,
                 voiceBuild=key)
    with tempfile.TemporaryDirectory(dir=out) as work:
        stage = Path(work)
        master(np.concatenate(track), stage / "narration.m4a", profile)
        (stage / "captions.srt").write_text("\n\n".join(captions) + "\n", encoding="utf-8")
        (stage / "episode.json").write_text(json.dumps(timed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        for name in ("narration.m4a", "captions.srt", "episode.json"):
            os.replace(stage / name, out / name)
    print(f"{episode['id']} ready: {position / FPS:.2f}s, {len(captions)} captions", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lessons", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--episode", action="append", default=[])
    parser.add_argument("--assets", type=Path, default=DEFAULT_CACHE)
    parser.add_argument("--profile", type=Path, default=HERE / "profile.json")
    parser.add_argument("--threads", type=int, default=2)
    args = parser.parse_args()
    episodes = json.loads(args.lessons.read_text(encoding="utf-8"))
    ids = {e["id"] for e in episodes}
    if missing := set(args.episode) - ids:
        raise SystemExit("Unknown episode " + ", ".join(sorted(missing)))
    ensure_assets(args.assets)
    options = ort.SessionOptions()
    options.intra_op_num_threads = args.threads
    options.inter_op_num_threads = 1
    options.add_session_config_entry("session.intra_op.allow_spinning", "0")
    session = ort.InferenceSession(str(args.assets / "kokoro-v1.0.onnx"), options, providers=["CPUExecutionProvider"])
    synth = Kokoro.from_session(session, str(args.assets / "voices-v1.0.bin"))
    profile = json.loads(args.profile.read_text(encoding="utf-8"))
    for ep in episodes:
        if args.episode and ep["id"] not in args.episode:
            continue
        data = json.dumps([ep, profile], sort_keys=True).encode()
        key = hashlib.sha256(data + Path(__file__).read_bytes() + LOCK.read_bytes()).hexdigest()
        produce(synth, ep, args.out / ep["id"], profile, key)


if __name__ == "__main__":
    main()
