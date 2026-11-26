# Production archive for v1.0.0

The published MP4s and English subtitles live at Git tag `v1.0.0`, commit `684f24707087cdc0b4199875e19ff4b05a3a934c`. The original storyboards, reference links, render inputs and editable composition for this path are preserved here. The checksums of the published files are in [provenance.json](provenance.json).

## Rebuild the original film

Run these commands from this directory on a Linux production runner with Node.js 22.12 or newer, FFmpeg, Chromium and the DejaVu fonts. Each `inputs` folder holds the timed scene JSON, captions and a lossless copy of the original 24 kHz mono voice track. The renderer supports FLAC directly.

```bash
npm ci --prefix render
episode=L01
node render/render.mjs --episode "inputs/$episode/timeline.json" \
  --audio "inputs/$episode/narration.flac" --subtitles "inputs/$episode/captions.en.srt" \
  --output "build/$episode.mp4" --project-dir "build/$episode-composition"
node render/qa.mjs --episode "inputs/$episode/timeline.json"
```

Set `CHROMIUM_PATH` to the executable if Chromium is installed outside `/usr/bin/chromium`. The HTML composition in the build directory can be opened in HyperFrames. Rendering results depend on browser, font and codec versions. Checkout the release tag for the exact original MP4.

## Change the narration or storyboard

Edit [catalog/episodes.json](catalog/episodes.json). Run the following commands on a production runner with Python 3.12. Download the ONNX model and voice bank from the upstream model release and compare their SHA-256 digests with [provenance.json](provenance.json). The ONNX model and voice bank are external production dependencies. [Kokoro ONNX model files](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.1)

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-voice.txt
episode=L01
.venv/bin/python narrate.py catalog --episode "$episode" \
  --model /path/to/kokoro-v1.0.onnx --voices /path/to/voices-v1.0.bin --speed 0.94
node render/render.mjs --episode "work/catalog/$episode/episode.json" \
  --audio "work/catalog/$episode/narration.wav" --subtitles "work/catalog/$episode/captions.srt" \
  --output "build/$episode-edited.mp4"
```

This archive uses the original `af_heart` English voice. The scene timings shipped in `inputs/` remain paired with their recorded voices. Rebuilding a changed script creates its new timings in `work/`.

## Check a release file

From the repository root, stream the original file from Git and compare the digest with the matching episode entry in `archive/v1/provenance.json`.

```bash
git show v1.0.0:videos/L01.mp4 | sha256sum
```
