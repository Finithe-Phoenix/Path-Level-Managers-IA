"""Edit, rebuild and check this learning path from a cloud checkout."""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

from display_captions import display_captions

ROOT = Path(__file__).resolve().parent
LESSONS = ROOT / "lessons" / "episodes.json"


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def digest(path):
    with path.open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


def select_episodes(identifier):
    episodes = read_json(LESSONS)
    ids = [episode["id"] for episode in episodes]
    if len(set(ids)) != len(ids) or not all(re.fullmatch(r"[A-Z][0-9]{2}", id_) for id_ in ids):
        raise ValueError("Each episode needs a unique letter and two-digit ID.")
    if identifier == "all":
        return episodes
    if identifier not in ids:
        raise ValueError(f"Choose one of {', '.join(ids)} or all.")
    return [episodes[ids.index(identifier)]]


def srt(id_):
    return ROOT / "subtitles" / f"{id_}.en.srt"


def video(id_):
    return ROOT / "videos" / f"{id_}.mp4"


def narration(id_):
    return ROOT / "narration" / id_


def script_hash(scene):
    return hashlib.sha256(scene["narration"].encode("utf-8")).hexdigest()


def pack_voice(episode, source):
    """Import a complete voice build, keeping one authoritative editable script."""
    id_ = episode["id"]
    raw = read_json(source / "episode.json")
    if raw["id"] != id_ or [s["id"] for s in raw["scenes"]] != [s["id"] for s in episode["scenes"]]:
        raise ValueError(f"{id_} voice build does not match the lesson order.")
    marks = []
    scenes, caption_text = display_captions(raw["scenes"], raw["fps"])
    for timed, scene in zip(scenes, episode["scenes"]):
        if timed["narration"] != scene["narration"]:
            raise ValueError(f"{id_}/{scene['id']} has stale speech.")
        marks.append(dict(id=scene["id"], scriptSha256=script_hash(scene),
                          durationFrames=timed["durationFrames"], cues=timed["cues"]))
    stem = source / "narration.m4a"
    target = narration(id_)
    target.mkdir(parents=True, exist_ok=True)
    srt(id_).parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=ROOT) as temp:
        staging = Path(temp)
        shutil.copyfile(stem, staging / "narration.m4a")
        captions = staging / "captions.srt"
        captions.write_text(caption_text, encoding="utf-8")
        write_json(staging / "timing.json", dict(audioEdition=3, fps=raw["fps"], voiceBuild=raw.get("voiceBuild"), paceBuild=raw.get("paceBuild"),
                   delivery=raw.get("delivery"), audioSha256=digest(stem),
                   captionsSha256=digest(captions), scenes=marks))
        os.replace(staging / "narration.m4a", target / "narration.m4a")
        os.replace(staging / "captions.srt", srt(id_))
        os.replace(staging / "timing.json", target / "timing.json")


def save_take(id_, source):
    target = ROOT / "takes" / id_
    target.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=target) as temporary:
        stage = Path(temporary)
        for name in ("narration.m4a", "captions.srt", "episode.json"):
            shutil.copyfile(source / name, stage / name)
        for name in ("narration.m4a", "captions.srt", "episode.json"):
            os.replace(stage / name, target / name)


def composition(episode):
    id_ = episode["id"]
    stem = narration(id_) / "narration.m4a"
    timing = read_json(narration(id_) / "timing.json")
    if digest(stem) != timing["audioSha256"] or digest(srt(id_)) != timing["captionsSha256"]:
        raise ValueError(f"{id_} audio or captions changed independently of timing. Run voice {id_}.")
    marks = timing["scenes"]
    if [m["id"] for m in marks] != [s["id"] for s in episode["scenes"]]:
        raise ValueError(f"{id_} scenes changed. Run voice {id_}.")
    fps = timing["fps"]
    scenes = []
    for scene, mark in zip(episode["scenes"], marks):
        if script_hash(scene) != mark["scriptSha256"]:
            raise ValueError(f"Speech changed in {id_}/{scene['id']}. Run voice {id_}.")
        frames = mark["durationFrames"]
        scenes.append(dict(scene, durationFrames=frames, duration=frames / fps, cues=mark["cues"]))
    return dict(episode, fps=fps, audioEdition=timing.get("audioEdition", 2), width=1280, height=720, scenes=scenes,
                durationFrames=sum(s["durationFrames"] for s in scenes))


def run(args):
    subprocess.run([str(arg) for arg in args], check=True, cwd=ROOT)


def verify(timed, path, decode=False):
    probe = subprocess.check_output(["ffprobe", "-v", "error", "-show_chapters", "-show_format",
                                     "-show_streams", "-of", "json", path])
    media = json.loads(probe)
    streams = {s["codec_type"]: s for s in media["streams"]}
    v, a, sub = (streams[k] for k in ("video", "audio", "subtitle"))
    if (v["codec_name"], a["codec_name"], sub["codec_name"]) != ("h264", "aac", "mov_text"):
        raise ValueError(f"Unexpected codecs in {path.name}")
    if (v["width"], v["height"]) != (timed["width"], timed["height"]):
        raise ValueError(f"Unexpected picture size in {path.name}")
    if sub.get("tags", {}).get("language") != "eng":
        raise ValueError(f"English subtitle language missing in {path.name}")
    expected = timed["durationFrames"] / timed["fps"]
    lengths = [float(media["format"]["duration"]), float(a["duration"]), float(v["duration"])]
    if any(not math.isclose(length, expected, abs_tol=0.15) for length in lengths):
        raise ValueError(f"{path.name} expected {expected:.2f}s, found {lengths}")
    names = [c["tags"]["title"] for c in media["chapters"]]
    if names != [s["title"] for s in timed["scenes"]]:
        raise ValueError(f"{path.name} chapter mismatch")
    if timed.get("audioEdition", 2) >= 3:
        tracks = [s for s in media["streams"] if s["codec_type"] == "audio"]
        expected_tracks = ["English · Sound design", "English · Narration only"]
        if [t["tags"].get("handler_name") for t in tracks] != expected_tracks:
            raise ValueError(f"Audio tracks differ in {path.name}")
        if not tracks[0]["disposition"]["default"] or tracks[1]["disposition"]["default"]:
            raise ValueError(f"Audio selection differs in {path.name}")
        if any(t["codec_name"] != "aac" or t["tags"].get("language") != "eng"
               or abs(float(t["duration"]) - expected) > 0.15 for t in tracks):
            raise ValueError(f"Unexpected audio codec, language or duration in {path.name}")
    if decode:
        run(["ffmpeg", "-v", "error", "-xerror", "-threads", "1", "-i", path, "-map", "0:v:0",
             "-map", "0:a", "-threads", "1", "-f", "null", "-"])
    return expected


def build(timed, work, project):
    id_ = timed["id"]
    source = work / "episode.json"
    write_json(source, timed)
    clean = narration(id_) / "narration.m4a"
    mix = work / "film-mix.m4a"
    run([sys.executable, ROOT / "sound/sounddesign.py", "--episode", source,
         "--voice", clean, "--output", mix])
    args = ["node", ROOT / "engine/render.cjs", "--episode", source,
            "--audio", mix, "--subtitles", srt(id_)]
    if project:
        dest = ROOT / "build" / id_
        run(args + ["--project-dir", dest])
        shutil.copyfile(source, dest / "episode.json")
        shutil.copyfile(clean, dest / "narration-clean.m4a")
        return dest
    picture = work / "picture.mp4"
    run(args + ["--output", picture])
    final = work / "final.mp4"
    # Both tracks share the same edit. Stream copy keeps the mastered voice intact.
    run(["ffmpeg", "-v", "error", "-y", "-i", picture, "-i", clean, "-map", "0:v:0",
         "-map", "0:a:0", "-map", "1:a:0", "-map", "0:s:0", "-map_metadata", "0",
         "-map_chapters", "0", "-c", "copy", "-disposition:a:0", "default", "-disposition:a:1", "0",
         "-metadata:s:a:0", "language=eng", "-metadata:s:a:1", "language=eng",
         "-metadata:s:a:0", "handler_name=English · Sound design",
         "-metadata:s:a:1", "handler_name=English · Narration only", "-movflags", "+faststart", final])
    verify(timed, final)
    output = video(id_)
    output.parent.mkdir(exist_ok=True)
    os.replace(final, output)
    return output


def release_manifest():
    records = []
    for ep in select_episodes("all"):
        id_ = ep["id"]
        timed = composition(ep)
        verify(timed, video(id_))
        assets = [video(id_), srt(id_), narration(id_) / "narration.m4a", narration(id_) / "timing.json"]
        take = ROOT / "takes" / id_
        assets += [take / name for name in ("episode.json", "narration.m4a", "captions.srt")]
        records.append(dict(id=id_, title=ep["title"], frames=timed["durationFrames"],
                            fps=timed["fps"], chapters=len(timed["scenes"]),
                            sha256={str(p.relative_to(ROOT)): digest(p) for p in assets}))
    return dict(lessonsSha256=digest(LESSONS), episodes=records)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("list", "render", "project", "voice", "pace", "verify", "manifest"))
    parser.add_argument("episode", nargs="?", default="all", help="Episode ID or all")
    parser.add_argument("--assets", type=Path, help="Directory with the pinned narration model and voice presets")
    parser.add_argument("--decode", action="store_true", help="Decode each frame and audio packet during verify")
    parser.add_argument("--target-wpm", type=int, help="Target instructional pace for voice or pace")
    parser.add_argument("--release", action="store_true", help="Also compare the entire path to release-manifest.json")
    args = parser.parse_args()
    manifest = ROOT / "release-manifest.json"
    if args.command == "manifest":
        write_json(manifest, release_manifest())
        return
    if args.release and release_manifest() != read_json(manifest):
        raise ValueError("Release manifest differs from the checked-out media or lesson sources.")
    for episode in select_episodes(args.episode):
        id_ = episode["id"]
        if args.command == "list":
            print(id_, episode["title"])
            continue
        with tempfile.TemporaryDirectory(prefix=".studio-", dir=ROOT) as temp:
            work = Path(temp)
            if args.command in ("voice", "pace"):
                source = ROOT / "takes" / id_
                if args.command == "voice":
                    options = ["--assets", args.assets.resolve()] if args.assets else []
                    raw = work / "takes"
                    run([sys.executable, ROOT / "voice/narrate.py", "--lessons", LESSONS, "--out", raw,
                         "--episode", id_, *options])
                    source = raw / id_
                final = work / "mastered" / id_
                pace = ["--target-wpm", str(args.target_wpm)] if args.target_wpm else []
                run([sys.executable, ROOT / "voice/pace.py", "--input", source, "--out", final, *pace])
                pack_voice(episode, final)
                if args.command == "voice":
                    save_take(id_, source)
                continue
            timed = composition(episode)
            if args.command == "verify":
                seconds = verify(timed, video(id_), args.decode)
                print(f"{id_}  {seconds:.2f}s  {len(timed['scenes'])} chapters")
            else:
                print(build(timed, work, args.command == "project"))


if __name__ == "__main__":
    main()
