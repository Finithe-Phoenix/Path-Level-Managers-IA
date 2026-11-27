# Motion studio

The released MP4 combines a seekable 1280 × 720 vector scene, a mastered English narration track, chapter markers and selectable English captions. The composition runs on a 24 fps clock. The native encoder captures controls, pointer movements, token flows, diagrams and chart transitions at scheduled frames, then holds their final state while the instructor speaks. Remotion and HyperFrames can evaluate the same scene at every individual frame.

## Render one timed lesson

In a Linux workspace with Node.js 22 or later and FFmpeg with libx264, run these commands from the engine directory. Set the three input paths to a single lesson's files.

```sh
npm ci
node render.cjs --episode "$EPISODE" --audio "$NARRATION" \
  --subtitles "$CAPTIONS" --output lesson.mp4
node render.cjs --episode "$EPISODE" --poster still.png --at-frame 168
```

The native renderer uses the bundled Open Sans and DejaVu Sans Mono fonts. Their redistribution notices are in `fonts/`. AAC stems in M4A containers are copied into the master. Other audio inputs are encoded as AAC. The default encoder uses two capture jobs and writes a temporary file before replacing the destination. Use `--jobs 1` on a memory-limited worker.

## Edit the motion

- `stage.cjs` lays out the frame, converts scene lengths to a continuous timeline, estimates per-line reveal times from narration and draws shared components.
- `workbenches.cjs` animates the composer, file explorer, source buffer, terminal and repository record. These are simulations built from the text and files in the lesson.
- `foundations.cjs`, `architecture.cjs` and `manager-visuals.cjs` draw lesson-specific transformations, test runs, comparison matrices, retrieval traces, decision trees and pilot metrics. The stage first asks each lesson layer whether it handles the current scene.
- `web-project.cjs` exports the whole composition, media and typefaces to an editable HyperFrames directory. `remotion/src.jsx` registers the same stage in Remotion.

A timed episode has an `id`, `title`, and `scenes[]`. Each scene has an `id`, a `kind` (`editor`, `terminal`, `diagram`, `github` or `decision`), a `title`, the exact `code` or input being discussed, its observed `result`, and a `durationFrames` integer. Include a short `action` and `focus` plus the full `narration`. Optional `cues[]` contain `start`, `end` in seconds from the beginning of the scene, and spoken `text`. After a script or voice edit, regenerate the timed episode, audio and captions as a unit using the repository's main build command.

A bespoke layer exports `draw(scene, seconds, helpers)`. Return an SVG fragment within the central panel covering x 38–1242 and y 177–563. For other episodes or scenes, return an empty string. The stage passes the prepared scene, including `episodeId`, duration in `sec` and `resultAt` in seconds. The optional `beats(scene)` array specifies the starting seconds of additional short movements for the native encoder to sample. Test frames before and after each result, with the longest labels you expect.

## HyperFrames

From the engine directory, export one episode. The resulting `preview.html` has a play button and a scrubber. Open that file in a browser to review it. The clean `index.html` is the entry point for the HyperFrames CLI.

```sh
node render.cjs --episode "$EPISODE" --audio "$NARRATION" \
  --subtitles "$CAPTIONS" --project-dir build/hyper
npm ci --prefix hyperframes
hyperframes/node_modules/.bin/hyperframes snapshot build/hyper --at 3,12 --no-end
hyperframes/node_modules/.bin/hyperframes render build/hyper -o build/hyperframes.mp4
```

HyperFrames uses Chromium. If it is already installed in your workspace, set `PRODUCER_HEADLESS_SHELL_PATH` to its executable. For an edit, change the lesson and stage sources and export again. The generated project stores episode JSON and the seek callback in its HTML, with readable vector modules in the adjacent scripts folder.

## Remotion

From the engine directory, run the following with absolute paths for `EPISODE` and `NARRATION`. The prepare command copies the fonts and narration into Remotion's public folder and prints the path to the generated props file.

```sh
cd remotion
npm ci
PROPS=$(node prepare.cjs --episode "$EPISODE" --audio "$NARRATION")
npm run still -- build/selected-frame.png --props="$PROPS" --frame=168
npm run studio -- --props="$PROPS"
npm run render -- build/remotion.mp4 --props="$PROPS"
```

With a preinstalled Chromium, append `--browser-executable=/path/to/chromium` to the Remotion command. HyperFrames and Remotion use their default video encoders. For a distributable master with the canonical sidecar captions, internal English subtitle track and chapters, use the native command at the top of this page. Remotion's licensing terms apply when using the optional Remotion adapter.

## Review the encoded master

```sh
ffprobe -v error -show_streams -show_chapters -of json lesson.mp4
ffmpeg -v error -i lesson.mp4 -map 0:v:0 -map 0:a:0 -f null -
```

From the repository root, measure text and panel bounds across the timed scenes with Chromium.

```sh
node engine/qa.cjs --require-timed --report build/visual-qa.json --screenshots build/visual-qa
```
