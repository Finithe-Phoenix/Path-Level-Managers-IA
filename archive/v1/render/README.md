# Series video renderer

This renderer turns a timed teaching storyboard into a 1280 × 720 H.264 MP4. It builds the look of the training workspace as a HyperFrames HTML composition. The fast render path captures the camera move, typed input, and evidence reveal, then lets the video hold on readable frames while the narration continues. The file carries English AAC audio and selectable captions when those tracks are supplied.

## Install

Use Node.js 22 or later, FFmpeg, and Chromium. Install the Chromium driver here.

```bash
npm ci
```

Set `CHROMIUM_PATH` if Chromium is installed outside `/usr/bin/chromium`. The training workspace must allow Chromium to start. A separately provisioned driver can be selected with `VIDEO_TRAINING_PUPPETEER_CORE`.

## Render an episode

```bash
node render.mjs \
  --episode episode.timed.json \
  --audio narration.wav \
  --subtitles captions.en.srt \
  --output lesson.mp4 \
  --project-dir composition
```

The input JSON has an episode `id`, `title`, `subtitle`, and a `scenes` array. Each scene contains `id`, `kind`, `eyebrow`, `title`, `body`, `code`, and `result`. Set each scene's `durationFrames` at 24 frames per second, or give its `duration` in seconds. `resultAt` can specify the reveal time in seconds relative to the start of its scene.

The optional project directory contains the composition HTML and copies of supplied audio and captions. Open the HTML in HyperFrames for editing and rendering at its full timeline rate. Use `--silent` for a preview without narration.
