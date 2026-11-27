"""Make a self-contained delivery master from a generated take without new inference."""
import argparse
import copy
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile

TARGET_WPM = 146
SAMPLE_RATE = 48000
MANUAL_ACTIONS = {"terminal", "editor", "diff", "decision", "review", "workflow"}


def srt_time(seconds):
    rest, ms = divmod(round(seconds * 1000), 1000)
    rest, sec = divmod(rest, 60)
    hours, minutes = divmod(rest, 60)
    return f"{hours:02d}:{minutes:02d}:{sec:02d},{ms:03d}"


def plan(take, target_wpm):
    scene_list = take["scenes"]
    fps = take["fps"]
    total_seconds = take["durationFrames"] / fps
    word_count = sum(len(scene["narration"].split()) for scene in scene_list)
    desired_seconds = max(total_seconds, 60 * word_count / target_wpm)
    available = desired_seconds - total_seconds
    beats = [(.65 if s["kind"] in MANUAL_ACTIONS else .38) for s in scene_list]
    beats[-1] = .36
    share = min(1, available / sum(beats))
    holds = [beat * share for beat in beats]
    tempo = min(1, total_seconds / (desired_seconds - sum(holds)))
    master = copy.deepcopy(take)
    master["delivery"] = {
        "targetWordsPerMinute": target_wpm,
        "inputWordsPerMinute": round(word_count * 60 / total_seconds, 2),
        "tempo": round(tempo, 8),
    }
    exact_frames, output_start, input_start = 0., 0, 0
    segments = []
    captions = []
    for original, revised, hold in zip(scene_list, master["scenes"], holds, strict=True):
        original_frames = original["durationFrames"]
        exact_frames += original_frames / tempo + hold * fps
        output_end = round(exact_frames)
        new_frames = output_end - output_start
        revised["durationFrames"] = new_frames
        revised["duration"] = new_frames / fps
        revised["readingHoldSeconds"] = round(hold, 3)
        for cue in revised["cues"]:
            cue["start"] = round(cue["start"] / tempo, 3)
            cue["end"] = round(min(cue["end"] / tempo, revised["duration"]), 3)
            start = srt_time(output_start / fps + cue["start"])
            end = srt_time(output_start / fps + cue["end"])
            captions.append(f"{len(captions) + 1}\n{start} --> {end}\n{cue['text']}")
        segments.append((input_start, original_frames, new_frames))
        input_start += original_frames
        output_start = output_end
    master["durationFrames"] = output_start
    master["delivery"]["outputWordsPerMinute"] = round(60 * word_count / (output_start / fps), 2)
    return master, captions, segments, tempo


def render(audio, output, fps, segments, tempo):
    # Trim by decoded samples. It keeps AAC priming and end padding outside the editing timeline.
    unit = SAMPLE_RATE // fps
    if unit * fps != SAMPLE_RATE:
        raise ValueError(f"Frame rate {fps} does not divide the master sample rate")
    count = len(segments)
    labels = "".join(f"[src{i}]" for i in range(count))
    filters = [f"[0:a]aresample={SAMPLE_RATE},asplit={count}{labels}"]
    for i, (start, original_length, out_length) in enumerate(segments):
        filters.append(
            f"[src{i}]atrim=start_sample={start * unit}:end_sample={(start + original_length) * unit},"
            f"asetpts=PTS-STARTPTS,atempo={tempo:.10f},apad=whole_len={out_length * unit},"
            f"atrim=end_sample={out_length * unit},asetpts=PTS-STARTPTS[s{i}]"
        )
    labels = "".join(f"[s{i}]" for i in range(count))
    filters.append(f"{labels}concat=n={count}:v=0:a=1,alimiter=limit=0.81:level=0:latency=1[out]")
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", str(audio), "-filter_complex_threads", "1",
                    "-filter_complex", ";".join(filters), "-map", "[out]", "-ar", str(SAMPLE_RATE),
                    "-c:a", "aac", "-b:a", "144k", "-movflags", "+faststart", str(output)], check=True)


def finish(source, dest, target_wpm=TARGET_WPM):
    if source.resolve() == dest.resolve():
        raise ValueError("Choose separate directories for the take and delivery master")
    if not 100 <= target_wpm <= 190:
        raise ValueError("Use a target between 100 and 190 words per minute")
    take = json.loads((source / "episode.json").read_text())
    audio = source / "narration.m4a"
    with audio.open("rb") as file:
        sound_hash = hashlib.file_digest(file, "sha256").digest()
    build = hashlib.sha256(json.dumps(take, sort_keys=True).encode() + Path(__file__).read_bytes()
                           + str(target_wpm).encode() + sound_hash).hexdigest()
    dest.mkdir(exist_ok=True, parents=True)
    marker = dest / "episode.json"
    if marker.exists() and json.loads(marker.read_text()).get("paceBuild") == build and all(
        (dest / item).is_file() for item in ("captions.srt", "narration.m4a")
    ):
        return
    master, captions, segments, tempo = plan(take, target_wpm)
    master["paceBuild"] = build
    with tempfile.TemporaryDirectory(dir=dest) as directory:
        stage = Path(directory)
        render(audio, stage / "narration.m4a", take["fps"], segments, tempo)
        (stage / "captions.srt").write_text("\n\n".join(captions) + "\n", encoding="utf-8")
        (stage / "episode.json").write_text(json.dumps(master, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        for name in ("narration.m4a", "captions.srt", "episode.json"):
            os.replace(stage / name, dest / name)
    delivery = master["delivery"]
    print(f"{master['id']} {delivery['inputWordsPerMinute']} -> {delivery['outputWordsPerMinute']} wpm", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--target-wpm", type=int, default=TARGET_WPM)
    arguments = parser.parse_args()
    finish(arguments.input, arguments.out, arguments.target_wpm)
