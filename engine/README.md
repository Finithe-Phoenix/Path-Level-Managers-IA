# Motion studio

The third-edition MP4 combines a seekable 1280 × 720 scene, one chapter per step, selectable English captions and two English audio tracks. The default track adds sparse sound cues to the narration. Select **English · Narration only** in your player to hear just the voice. The composition runs on a 24 fps clock. The native encoder captures controls, pointer movements, token flows, diagrams and chart transitions at scheduled frames, then holds their final state while the instructor speaks. Remotion and HyperFrames can evaluate the same scene at every individual frame.

## Film direction

Each episode has its own optical opening and a second evidence shot linked to a specific result. The four photographed-style plates are original generated illustrations. The Basic camera follows a prism splitting a signal into tokens. The intermediate film uses a routing mechanism, the advanced film uses an illuminated document field, and the managers’ film uses a calibrated balance.

- Edit the opening headlines in the `titles` map and the scene-specific evidence in the `inserts` map in `cold-open.cjs`. The surrounding functions draw the vector objects, move the camera and schedule each result close-up.
- Edit the code, command, prompt, retrieval, decision and review gestures in `lab-motion.cjs`. Episode-specific overrides live in that module and in the original diagram modules listed below.
- Edit the framing, result magnifier, reading band and optical scene cuts in `cinema.cjs`. Preview the time immediately before and after each narrated result.
- The four original full-resolution PNG plates are in `plates/`. Replace an illustration and run `node pack-plates.cjs` after installing the engine dependencies. Commit the original and the generated `plates.cjs` file together. The web, Remotion and native paths use the same packed pictures. No image host is required.
- Run `node qa.cjs --require-timed` from the engine directory to check master timing and text bounds with Chromium. Frame probes cover both sides of the optical edits, the action cues and the evidence shots.

## Render a distribution master

Run the production command from the repository root with the episode ID for your level. It builds the picture and both audio tracks, embeds subtitles and chapters, then verifies and writes `videos/<ID>.mp4`. The standalone caption file lives in `subtitles/<ID>.en.srt`.

```sh
npm ci --prefix engine
python3 studio.py render "$ID"
```

## Render one picture or reference frame

The low-level Node command accepts one audio stem and produces the single-track picture intermediate used by the production driver. In a Linux workspace with Node.js 22 or later and FFmpeg with libx264, run the following from the engine directory. Set the input paths to the files for your lesson.

```sh
npm ci
node render.cjs --episode "$EPISODE" --audio "$NARRATION" \
  --subtitles "$CAPTIONS" --output lesson.mp4
node render.cjs --episode "$EPISODE" --poster still.png --at-frame 168
```

The native renderer uses the bundled Open Sans and DejaVu Sans Mono fonts. Their redistribution notices are in `fonts/`. AAC stems in M4A containers are copied into the picture intermediate. Other audio inputs are encoded as AAC. The default encoder uses two capture jobs and writes a temporary file before replacing the destination. Use `--jobs 1` on a memory-limited worker.

## Edit the motion

- `stage.cjs` lays out the frame, converts scene lengths to a continuous timeline, estimates per-line reveal times from narration and draws shared components.
- `workbenches.cjs` animates the composer, file explorer, source buffer, terminal and repository record. These are simulations built from the text and files in the lesson.
- `foundations.cjs`, `architecture.cjs` and `manager-visuals.cjs` draw lesson-specific transformations, test runs, comparison matrices, retrieval traces, decision trees and pilot metrics. The stage first asks each lesson layer whether it handles the current scene.
- `web-project.cjs` exports the whole composition, media and typefaces to an editable HyperFrames directory. `remotion/src.jsx` registers the same stage in Remotion.

A timed episode has an `id`, `title`, and `scenes[]`. Each scene has an `id`, a `kind` (`editor`, `terminal`, `diagram`, `github` or `decision`), a `title`, the exact `code` or input being discussed, its observed `result`, and a `durationFrames` integer. Include a short `action` and `focus` plus the full `narration`. Optional `cues[]` contain `start`, `end` in seconds from the beginning of the scene, and spoken `text`. After a script or voice edit, regenerate the timed episode, audio and captions as a unit using the repository's main build command.

A bespoke layer exports `draw(scene, seconds, helpers)`. Draw the workbench at x 38–1242 and y 177–563 in its local coordinates. The stage maps that area to approximately y 148–535 in the finished 1280 × 720 frame. Film-level evidence overlays use the finished frame coordinates. For other episodes or scenes, return an empty string. The stage passes the prepared scene, including `episodeId`, duration in `sec` and `resultAt` in seconds. The optional `beats(scene)` array specifies the starting seconds of additional short movements for the native encoder to sample. Test frames before and after each result, with the longest labels you expect.

## HyperFrames

From the engine directory, export one episode. The resulting `preview.html` has a play button and a scrubber. Open that file in a browser to review it. The clean `index.html` is the entry point for the HyperFrames CLI.

```sh
node render.cjs --episode "$EPISODE" --audio "$NARRATION" \
  --subtitles "$CAPTIONS" --project-dir build/hyper
npm ci --prefix hyperframes
hyperframes/node_modules/.bin/hyperframes snapshot build/hyper --at 3,12 --no-end --timeout 150000
hyperframes/node_modules/.bin/hyperframes render build/hyper -o build/hyperframes.mp4
```

HyperFrames uses Chromium. If it is already installed in your workspace, set `PRODUCER_HEADLESS_SHELL_PATH` to its executable. The snapshot command allows up to 150 seconds for Chromium to prepare the composition on a shared render worker. For an edit, change the lesson and stage sources and export again. The generated project stores episode JSON and the seek callback in its HTML, with readable vector modules in the adjacent scripts folder.

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

With a preinstalled Chromium, append `--browser-executable=/path/to/chromium` to the Remotion command. HyperFrames and Remotion use their default video encoders. To build the distribution master with both English audio tracks, embedded subtitles and chapters, run `python3 studio.py render "$ID"` from the repository root. Remotion's licensing terms apply when using the optional Remotion adapter.

## Review the encoded master

```sh
ffprobe -v error -show_streams -show_chapters -of json "videos/$ID.mp4"
ffmpeg -v error -xerror -i "videos/$ID.mp4" -map 0:v:0 -map 0:a -f null -
```

From the repository root, measure text and panel bounds across the timed scenes with Chromium.

```sh
node engine/qa.cjs --require-timed --report build/visual-qa.json --screenshots build/visual-qa
```
