"""Build the README's silent excerpt from the checked-in chaptered movie."""
import json
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent


def main():
    spec = json.loads((ROOT / "preview-scenes.json").read_text())
    id_ = spec["episode"]
    lesson = next(ep for ep in json.loads((ROOT / "lessons/episodes.json").read_text()) if ep["id"] == id_)
    timing = json.loads((ROOT / "narration" / id_ / "timing.json").read_text())
    fps, cursor, bounds = timing["fps"], 0, {}
    for scene in timing["scenes"]:
        duration = scene["durationFrames"] / fps
        bounds[scene["id"]] = (cursor, duration)
        cursor += duration
    if len(bounds) != len(lesson["scenes"]):
        raise ValueError("Lesson and timing differ")
    with tempfile.TemporaryDirectory() as temp:
        args = ["ffmpeg", "-v", "error", "-y", "-threads", "1", "-filter_complex_threads", "1"]
        for scene, fraction in spec["shots"]:
            start, duration = bounds[scene]
            args += ["-ss", str(start + min(duration - 2.8, duration * fraction)),
                     "-t", "2.8", "-i", str(ROOT / "videos" / f"{id_}.mp4")]
        inputs = "".join(f"[{i}:v]" for i in range(len(spec["shots"])))
        graph = (inputs + f"concat=n={len(spec['shots'])}:v=1:a=0,fps=10,scale=768:-2:flags=lanczos,"
                 "split[a][b];[a]palettegen=max_colors=160[p];[b][p]paletteuse=dither=bayer")
        output = Path(temp) / "preview.gif"
        subprocess.run(args + ["-filter_complex", graph, "-threads", "1", "-loop", "0", str(output)], check=True)
        (ROOT / "preview.gif").write_bytes(output.read_bytes())


if __name__ == "__main__":
    main()
