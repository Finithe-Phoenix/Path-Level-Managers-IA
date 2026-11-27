"""Check one or more baked narration bundles, optionally measuring final AAC loudness."""
import argparse
import json
from pathlib import Path
import subprocess


def timestamp(seconds):
    seconds, ms = divmod(round(seconds * 1000), 1000)
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    return f"{hours:02}:{minutes:02}:{seconds:02},{ms:03}"


def report(directory, loudness):
    ep = json.loads((directory / "episode.json").read_text())
    audio = directory / "narration.m4a"
    data = json.loads(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "stream=codec_name,sample_rate,channels,duration", "-of", "json", str(audio)]
    ))["streams"][0]
    duration = ep["durationFrames"] / ep["fps"]
    if (data["codec_name"], data["channels"], int(data["sample_rate"])) != ("aac", 1, 48000):
        raise ValueError(f"Unexpected stem format in {directory}")
    if abs(duration - float(data["duration"])) > 1 / ep["fps"]:
        raise ValueError(f"Incorrect duration in {directory}")
    cues = []
    frames = 0
    for scene in ep["scenes"]:
        previous = 0
        for cue in scene["cues"]:
            if not 0 <= previous <= cue["start"] < cue["end"] <= scene["duration"] + .001:
                raise ValueError(f"Invalid cue in {ep['id']}/{scene['id']}")
            previous = cue["end"]
            start = timestamp(frames / ep["fps"] + cue["start"])
            end = timestamp(frames / ep["fps"] + cue["end"])
            cues.append(f"{len(cues) + 1}\n{start} --> {end}\n{cue['text']}")
        transcript = " ".join(cue["text"] for cue in scene["cues"])
        # A subtitle can wrap a hyphenated word at its existing hyphen.
        if transcript.replace("-\n", "-").split() != scene["narration"].split():
            raise ValueError(f"Caption transcript mismatch in {ep['id']}/{scene['id']}")
        frames += scene["durationFrames"]
    srt = (directory / "captions.srt").read_text()
    if "\n\n".join(cues) + "\n" != srt or frames != ep["durationFrames"]:
        raise ValueError(f"Inconsistent timed data in {directory}")
    if loudness:
        process = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-i", str(audio), "-af",
                                  "loudnorm=I=-18:TP=-1.5:LRA=8:print_format=json", "-f", "null", "-"],
                                 check=True, stderr=subprocess.PIPE, encoding="utf-8")
        stats = json.loads(process.stderr[process.stderr.rindex("{"):process.stderr.rindex("}") + 1])
        if not -19.0 <= float(stats["input_i"]) <= -17.0 or float(stats["input_tp"]) > -.5:
            raise ValueError(f"Master level out of range in {directory}: {stats}")
        print(f"{ep['id']} {duration:.2f}s {len(cues)} cues {stats['input_i']} LUFS {stats['input_tp']} dBTP")
    else:
        print(f"{ep['id']} {duration:.2f}s {len(cues)} cues")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("bundles", type=Path, nargs="+")
    parser.add_argument("--loudness", action="store_true")
    opts = parser.parse_args()
    for bundle in opts.bundles:
        report(bundle, opts.loudness)
