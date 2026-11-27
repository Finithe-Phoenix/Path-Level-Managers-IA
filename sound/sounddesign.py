"""Add three short, original foley gestures to an existing narration master."""
import argparse
from array import array
from dataclasses import dataclass
import json
import math
import os
from pathlib import Path
import random
import re
import subprocess
import sys
import tempfile
import wave

RATE = 24000
MASTER_RATE = 48000
TAU = 2 * math.pi


@dataclass(frozen=True)
class Stroke:
    offset: float
    length: float
    hz: float
    material: str
    amplitude: float


# Each signature has its own physical gesture and space for the opening words.
SIGNATURES = {
    "B": [Stroke(0, .66, 261.63, "glass", .067), Stroke(.28, .67, 392., "glass", .046)],
    "M": [Stroke(0, .27, 162., "switch", .071), Stroke(.14, .41, 243., "metal", .043),
          Stroke(.34, .54, 324., "metal", .032)],
    "A": [Stroke(0, .62, 136., "scan", .067), Stroke(.32, .72, 272., "glass", .047)],
    "L": [Stroke(0, .5, 175., "wood", .082), Stroke(.24, .61, 262.5, "wood", .062),
          Stroke(.42, .57, 350., "glass", .021)],
}
ACTION = {"editor": (330., "switch"), "terminal": (245., "switch"), "github": (390., "metal"),
          "diagram": (350., "wood"), "decision": (295., "wood")}


def reveal(scene, seconds):
    # Mirrors engine/stage.cjs prepare(): a result appears near a matching spoken cue.
    words = set(re.findall(r"[a-z0-9_]{4,}", scene.get("result", "").lower()))
    when, best = .63 * seconds, 0
    for cue in scene.get("cues", []):
        start = cue["start"]
        if .37 * seconds < start < .84 * seconds:
            score = sum(word in cue["text"].lower() for word in words)
            if score > best:
                when, best = start, score
    return min(.78 * seconds, max(.46 * seconds, when))


def schedule(episode):
    fps = int(episode["fps"])
    scenes = episode["scenes"]
    frames = int(episode["durationFrames"])
    if fps <= 0 or not scenes or frames != sum(s["durationFrames"] for s in scenes):
        raise ValueError("Episode frame count must agree with its scenes")
    if any(s["durationFrames"] <= 0 for s in scenes):
        raise ValueError("Each scene needs a positive frame count")
    starts, speech = [], []
    frame = 0
    for scene in scenes:
        start = frame / fps
        starts.append(start)
        speech.extend((start + cue["start"], start + cue.get("speechEnd", cue["end"])) for cue in scene.get("cues", []))
        frame += scene["durationFrames"]
    ident = episode["id"]
    if ident[0] not in SIGNATURES:
        raise ValueError("Expected a B, M, A or L episode ID")
    events = [(.04, "opening", SIGNATURES[ident[0]])]
    if len(scenes) >= 3:
        middle = (len(scenes) - 1) * .38
        eligible = [i for i, s in enumerate(scenes[1:-1], 1) if s["kind"] in ("editor", "terminal", "github")]
        middle_index = min(eligible or list(range(1, len(scenes) - 1)), key=lambda i: abs(i - middle))
        middle_scene = scenes[middle_index]
        hz, material = ACTION[middle_scene["kind"]]
        events.append((starts[middle_index] + .45, "first action in " + middle_scene["id"],
                       [Stroke(0, .14, hz, material, .044)]))
        later = [i for i in range(middle_index + 1, len(scenes)) if scenes[i].get("result")]
        if later:
            i = min(later, key=lambda j: abs(j - (len(scenes) - 1) * .78))
            s = scenes[i]
            at = starts[i] + reveal(s, s["durationFrames"] / fps)
            # A neutral touch on the displayed evidence (even when a test fails).
            events.append((at, "result in " + s["id"],
                           [Stroke(0, .22, 284., "wood", .043), Stroke(.085, .23, 426., "glass", .026)]))
    return events, speech, frames / fps


def smooth(x):
    x = min(1., max(0., x))
    return x * x * (3. - 2. * x)


def ring(material, t, hz, noise):
    phase = TAU * hz * t
    if material == "glass":
        return (math.sin(phase) + .43 * math.sin(2.35 * phase) * math.exp(-5*t)
                + .18 * math.sin(4.14 * phase) * math.exp(-15*t)) / 1.45 * math.exp(-5.9*t)
    if material == "wood":
        return (.81 * math.sin(phase + .6 * math.exp(-44*t)) * math.exp(-14*t)
                + .26 * math.sin(2.61*phase) * math.exp(-28*t) + .18 * noise * math.exp(-105*t))
    if material == "metal":
        return (.64 * math.sin(phase) * math.exp(-7*t) + .32 * math.sin(2.72*phase) * math.exp(-16*t)
                + .12 * math.sin(4.31*phase) * math.exp(-27*t))
    if material == "switch":
        return (.68 * math.sin(phase + .9 * math.exp(-57*t)) * math.exp(-27*t)
                + .24 * math.sin(4.24*phase) * math.exp(-55*t) + .35 * noise * math.exp(-135*t))
    # A short upward head sweep, with a soft motor harmonic and a brushed edge.
    sweep = TAU * hz * (t + .24 * t * t)
    return (.66 * math.sin(sweep) + .20 * math.sin(2*sweep + .4)
            + .09 * noise * math.exp(-3*t)) * math.exp(-5*t)


def foley(event_start, strokes, speech, pitch, seed, total_frames):
    count = min(total_frames, round(RATE * max(s.offset + s.length for s in strokes)))
    fragment = [0.] * count
    random_source = random.Random(seed)
    for stroke in strokes:
        offset = round(stroke.offset * RATE)
        for i in range(min(round(stroke.length * RATE), count - offset)):
            t = i / RATE
            envelope = smooth(t / .006) * smooth((stroke.length - t) / .045)
            fragment[offset + i] += stroke.amplitude * envelope * ring(
                stroke.material, t, stroke.hz * pitch, random_source.uniform(-1., 1.))
    # Give the consonant band and the centers of spoken syllables extra headroom.
    near = [(a, b) for a, b in speech if a < event_start + count/RATE + .065 and b > event_start - .095]
    for i, x in enumerate(fragment):
        t = event_start + i / RATE
        covered = max((smooth((t - a + .065)/.065) * smooth((b + .095 - t)/.095)
                       for a, b in near), default=0.)
        fragment[i] = round(x * (1. - .48 * covered) * 32767)
    encoded = array("h", fragment)
    if sys.byteorder != "little":
        encoded.byteswap()
    return encoded.tobytes()


def write_cues(path, episode, events, speech, duration):
    total = round(duration * RATE)
    seed = sum((i + 1) * ord(c) for i,c in enumerate(episode["id"]))
    pitch = 2 ** (((seed % 3) - 1) / 12.)
    with wave.open(str(path), "wb") as out:
        out.setparams((1, 2, RATE, total, "NONE", "not compressed"))
        cursor = 0
        for idx, (at, _, strokes) in enumerate(events):
            start = min(total, round(at * RATE))
            if start < cursor:
                continue
            out.writeframesraw(bytes(2 * (start - cursor)))
            block = foley(start / RATE, strokes, speech, pitch, seed + idx, total - start)
            out.writeframesraw(block)
            cursor = start + len(block)//2
        out.writeframesraw(bytes(2 * (total - cursor)))


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--episode", required=True, type=Path)
    cli.add_argument("--voice", required=True, type=Path)
    cli.add_argument("--output", required=True, type=Path)
    cli.add_argument("--events-json", type=Path, help="Optional report with event timing and design")
    args = cli.parse_args()
    episode = json.loads(args.episode.read_text(encoding="utf-8"))
    events, speech, duration = schedule(episode)
    if args.output.resolve() == args.voice.resolve():
        raise ValueError("Choose a separate output for the mix")
    args.output.parent.mkdir(exist_ok=True, parents=True)
    samples = round(duration * MASTER_RATE)
    with tempfile.TemporaryDirectory(dir=args.output.parent) as temp:
        work = Path(temp)
        effects = work / "foley.wav"
        write_cues(effects, episode, events, speech, duration)
        # Original speech remains at unity except for peak protection just before AAC encoding.
        filters = (f"[0:a]aresample={MASTER_RATE},aformat=channel_layouts=mono[speech];"
                   f"[1:a]aresample={MASTER_RATE}[effects];[speech][effects]"
                   f"amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.81:attack=4:"
                   f"release=70:level=0:latency=1,apad,atrim=end_sample={samples},asetpts=N/SR/TB[out]")
        result = work / "mix.m4a"
        subprocess.run(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y","-i",str(args.voice),
                        "-i",str(effects),"-filter_complex",filters,"-map","[out]","-c:a","aac","-b:a","144k",
                        "-ar",str(MASTER_RATE),"-ac","1","-movie_timescale",str(MASTER_RATE),"-movflags","+faststart",
                        str(result)],check=True)
        os.replace(result,args.output)
    if args.events_json:
        info = [{"start": round(t,4), "event": k, "material": [s.material for s in strokes],
                 "duration": round(max(s.offset+s.length for s in strokes), 3)} for t,k,strokes in events]
        args.events_json.write_text(json.dumps({"episode":episode["id"],"duration":duration,"events":info},
                                               indent=2)+"\n")
    print(f"{episode['id']}: {len(events)} sound cues, {duration:.3f} seconds", flush=True)


if __name__ == "__main__":
    main()
