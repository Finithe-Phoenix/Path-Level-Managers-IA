# English narration

The guide uses a blend of the British English Kokoro voices Emma (72%) and Isabella (28%). The narrator reads a complete thought across consecutive caption pages. A question leaves a little more time to think. Clause pauses let the viewer follow the cursor or read a result. The learning scripts, technical pronunciation dictionary and delivery settings are all editable.

## Rebuild

Use Python 3.12 on Linux and FFmpeg with the AAC encoder and loudnorm filter. The pinned Python packages reproduce the production toolchain. From the repository root, run the following in the approved remote workspace. Supply the path to this repository’s lesson JSON.

```bash
python3.12 -m venv .venv
. .venv/bin/activate
python -m pip install -r voice/requirements.txt
python voice/assets.py
python voice/narrate.py --lessons PATH_TO_LESSON_LIST.json --out build/narrated --episode EPISODE_ID
python voice/pace.py --input build/narrated/EPISODE_ID --out build/mastered/EPISODE_ID
python voice/verify.py --loudness build/mastered/EPISODE_ID
```

Omit `--episode` to synthesize every lesson in the list. Use `--profile path/to/profile.json` to select a different blend or adjust pace. To keep model weights in a custom directory, pass that directory to `assets.py` as its positional argument and to `narrate.py` as `--assets DIRECTORY`.

The default cache is `~/.cache/ai-training-voice`. The two model files come from a specific upstream release. The downloader compares their SHA-256 hashes to `model-lock.json`; synthesis verifies both hashes again before opening the model. The full-precision English checkpoint and voice bank occupy approximately 354 MB in decimal units. The maintained release audio stems can be used offline to reconstruct the edit. A fresh synthesis can vary slightly with the inference runtime and platform.

## Listening pace

The first pass creates the actor’s take. The second pass sets the delivery pace to a target of 146 words per minute. It preserves pitch, leaves a short reading hold after the action in a scene, and moves the captions and scene cuts with the voice. Slower takes keep their pace. Adjust the pacing later with `pace.py --target-wpm 142` using the original first-pass stem and timing file. This second pass uses only Python and FFmpeg. The delivery bundle is ready once its `episode.json` exists.

## Episode outputs

| File | Purpose |
| --- | --- |
| `narration.m4a` | Frame-aligned mono AAC stem at 48 kHz. The delivery stem uses 144 kb/s with extra peak headroom after tempo adjustment. A measured two-pass EBU R128 master targets −18 LUFS and a −1.5 dBTP ceiling before encoding. |
| `captions.srt` | UTF-8 English subtitles. Original spelling is preserved. |
| `episode.json` | Source scenes with duration in seconds and 24 fps frames. Each scene contains subtitle cues with start/end times in seconds relative to that scene. |

The caption pages are phonemized individually, grouped into natural speech takes, and aligned to the acoustic model’s phoneme durations. The `voiceBuild` fingerprint identifies the script, model manifest, settings and episode input. Outputs are staged in the destination and the timing file is replaced last. The pronunciation map in `narrate.py` controls how abbreviations and commands sound. A future editor can also replace the stem with a human recording and adjust the caption cues and scene durations to match.

[English voice descriptions](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md) · [Model distribution](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.1) · [Upstream inference library](https://github.com/thewh1teagle/kokoro-onnx).
