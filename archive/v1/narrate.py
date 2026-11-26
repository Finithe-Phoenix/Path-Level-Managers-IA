"""Create synchronized English narration, captions, and a timed render JSON."""
import argparse
import json
import math
import os
from pathlib import Path
import re
import textwrap
import wave

import numpy as np
import onnxruntime as ort
from kokoro_onnx import Kokoro

HOME_DIR = Path(__file__).resolve().parent
FPS = 24
VOICE = "af_heart"
PRONUNCIATION = {
    "GitHub CLI": "GitHub C L I",
    "gh pr": "G H P R",
    "VS Code": "V S Code",
    "GCP": "G C P",
    "MCP": "M C P",
    "RAG": "rag",
    "LLM": "L L M",
    "LLMs": "L L Ms",
    "CI": "C I",
    "SKILL.md": "skill dot M D",
    "README": "read me",
}


def spoken_text(text):
    for term, pronunciation in PRONUNCIATION.items():
        text = re.sub(rf"\b{re.escape(term)}\b", pronunciation, text, flags=re.IGNORECASE)
    return text


def timestamp(seconds):
    milliseconds = round(seconds * 1000)
    seconds, milliseconds = divmod(milliseconds, 1000)
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    return f"{hours:02}:{minutes:02}:{seconds:02},{milliseconds:03}"


def caption_pages(sentence):
    rows = textwrap.wrap(sentence, width=42, break_long_words=False)
    return ["\n".join(rows[index:index + 2]) for index in range(0, len(rows), 2)]


def append_captions(captions, sentence, start, duration):
    pages = caption_pages(sentence)
    length = sum(len(page) for page in pages)
    for page in pages:
        end = start + duration * len(page) / length
        captions.append(f"{len(captions) + 1}\n{timestamp(start)} --> {timestamp(end)}\n{page}")
        start = end


def atomic_write(path, payload):
    temp = path.with_name(path.name + ".partial")
    temp.write_text(payload, encoding="utf-8")
    os.replace(temp, path)


def synthesize_episode(synth, episode, directory, speed):
    directory.mkdir(parents=True, exist_ok=True)
    frames_elapsed = 0
    track = []
    captions = []
    timed_scenes = []
    sample_rate = 24000
    for scene in episode["scenes"]:
        start = frames_elapsed / FPS
        lead = round(sample_rate * 0.34)
        pause = np.zeros(round(sample_rate * 0.18), dtype=np.float32)
        clips = [np.zeros(lead, dtype=np.float32)]
        position = lead
        sentences = re.split(r"(?<=[.!?])\s+", scene["narration"].strip())
        for sentence in sentences:
            samples, actual_rate = synth.create(
                spoken_text(sentence), voice=VOICE, speed=speed, lang="en-us"
            )
            if actual_rate != sample_rate:
                raise ValueError(f"Unexpected sample rate: {actual_rate}")
            append_captions(captions, sentence, start + position / sample_rate, len(samples) / sample_rate)
            clips.extend((samples, pause))
            position += len(samples) + len(pause)
        frames = math.ceil((position / sample_rate + 0.92) * FPS)
        until_next = round(frames * sample_rate / FPS)
        clips.append(np.zeros(until_next - position, dtype=np.float32))
        track.extend(clips)
        timed_scenes.append(dict(scene, durationFrames=frames, duration=frames / FPS))
        frames_elapsed += frames

    waveform = np.concatenate(track)
    peak = np.max(np.abs(waveform))
    if peak == 0 or np.isnan(peak):
        raise ValueError(f"Synthesis failed for {episode['id']}")
    waveform *= 0.78 / peak
    audio = directory / "narration.wav"
    temporary = audio.with_suffix(".wav.partial")
    with wave.open(str(temporary), "wb") as wav:
        wav.setparams((1, 2, sample_rate, 0, "NONE", "not compressed"))
        wav.writeframes((waveform * 32767).astype("<i2").tobytes())
    os.replace(temporary, audio)
    atomic_write(directory / "captions.srt", "\n\n".join(captions) + "\n")
    # Timed JSON is written last so the renderer only sees complete input.
    timed = dict(episode, fps=FPS, width=1280, height=720, scenes=timed_scenes)
    atomic_write(directory / "episode.json", json.dumps(timed, ensure_ascii=False, indent=2) + "\n")
    print(f"{episode['id']} {frames_elapsed / FPS:.2f}s · {len(captions)} captions", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="+", help="Path directories under this series")
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--voices", type=Path, required=True)
    parser.add_argument("--speed", type=float, default=0.94)
    parser.add_argument("--threads", type=int, default=2)
    parser.add_argument("--episode", action="append", default=[])
    args = parser.parse_args()

    options = ort.SessionOptions()
    options.intra_op_num_threads = args.threads
    options.inter_op_num_threads = 1
    options.add_session_config_entry("session.intra_op.allow_spinning", "0")
    session = ort.InferenceSession(str(args.model), options, providers=["CPUExecutionProvider"])
    synth = Kokoro.from_session(session, str(args.voices))
    for path in args.paths:
        episodes = json.loads((HOME_DIR / path / "episodes.json").read_text(encoding="utf-8"))
        for episode in episodes:
            if args.episode and episode["id"] not in args.episode:
                continue
            directory = HOME_DIR / "work" / path / episode["id"]
            ready = (directory / "episode.json").is_file()
            if ready:
                timed = json.loads((directory / "episode.json").read_text(encoding="utf-8"))
                stripped = [
                    {key: value for key, value in scene.items() if key not in {"duration", "durationFrames"}}
                    for scene in timed["scenes"]
                ]
                unchanged = stripped == episode["scenes"] and all((directory / name).is_file() for name in ("narration.wav", "captions.srt"))
                if unchanged:
                    print(f"{episode['id']} narration already prepared", flush=True)
                    continue
                (directory / "episode.json").unlink()
            synthesize_episode(synth, episode, directory, args.speed)


if __name__ == "__main__":
    main()
