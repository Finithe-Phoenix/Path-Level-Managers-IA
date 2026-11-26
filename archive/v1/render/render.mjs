import { spawn } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const FPS = 24;
const WIDTH = 1280;
const HEIGHT = 720;

function getPuppeteer() {
  const require = createRequire(import.meta.url);
  const configured = process.env.VIDEO_TRAINING_PUPPETEER_CORE;
  if (configured) return require(configured);
  return require('puppeteer-core');
}

function escapeHtml(value) {
  return value.replace(/[&<>"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
  })[character]);
}

function prepareEpisode(data) {
  if (typeof data.title !== 'string' || !data.title.trim() || !data.scenes?.length) {
    throw new Error('The episode needs a title and at least one timed scene.');
  }

  let nextStartFrame = 0;
  const scenes = data.scenes.map((raw) => {
    const durationFrames = raw.durationFrames ?? Math.round(FPS * raw.duration);
    if (!Number.isInteger(durationFrames) || durationFrames < FPS) {
      throw new Error(`Scene ${raw.id} needs durationFrames or duration (seconds).`);
    }
    for (const name of ['title', 'code', 'result']) {
      if (typeof raw[name] !== 'string') throw new Error(`Scene ${raw.id} needs string ${name}.`);
    }

    const typeStart = 8;
    const typeEnd = Math.max(typeStart + 1, Math.min(55, Math.max(27, raw.code.length / 2.6), durationFrames - 15));
    const reveal = Math.min(durationFrames - 13, Math.max(typeEnd + 4,
      typeof raw.resultAt === 'number' ? Math.round(raw.resultAt * FPS) : Math.round(durationFrames * .42)));
    const scene = {
      ...raw,
      durationFrames,
      typeStart,
      typeEnd,
      reveal,
      startFrame: nextStartFrame,
    };
    nextStartFrame += durationFrames;
    return scene;
  });
  return { ...data, scenes, fps: FPS, durationFrames: nextStartFrame };
}

async function buildHtml(episode, audioFile) {
  const [css, script] = await Promise.all([
    readFile(new URL('./composition.css', import.meta.url), 'utf8'),
    readFile(new URL('./composition.js', import.meta.url), 'utf8'),
  ]);
  const title = escapeHtml(episode.title);
  const subtitle = escapeHtml(episode.subtitle ?? 'AI-assisted engineering');
  const compositionId = escapeHtml(episode.id ?? 'training-episode');
  const duration = episode.durationFrames / FPS;
  const audio = audioFile
    ? `<audio id="narration" src="${escapeHtml(audioFile)}" data-start="0" data-duration="${duration}" data-track-index="1"></audio>`
    : '';
  const data = JSON.stringify(episode).replaceAll('<', '\\u003c');

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${title}</title><style>${css}</style></head>
<body>
<main id="film" data-composition-id="${compositionId}" data-start="0" data-duration="${duration}" data-width="${WIDTH}" data-height="${HEIGHT}" data-fps="${FPS}" data-no-timeline>
  <header class="film-head">
    <span class="logo" aria-hidden="true"></span>
    <span class="audience">${subtitle}</span>
    <span class="episode-title">${title}</span>
  </header>
  <div class="content">
    <section class="lesson" id="lesson">
      <p class="cap" id="eyebrow"></p>
      <h1 id="scene-title"></h1>
      <p class="body" id="scene-body"></p>
    </section>
    <section class="workspace" id="workspace">
      <div class="chrome">
        <div class="traffic" aria-hidden="true"><i></i><i></i><i></i></div>
        <span class="tag" id="workspace-label"></span>
        <span class="sandbox">Training example</span>
      </div>
      <div class="bar"><span class="line-mark"></span><span class="file-tab" id="file-tab"></span></div>
      <div class="workspace-main">
        <div class="pane">
          <p class="pane-label" id="input-label"></p>
          <pre id="numbers" class="numbers" aria-hidden="true"></pre>
          <pre id="input"><span id="caret" class="caret"></span></pre>
        </div>
        <div class="result-panel" id="result-panel">
          <span class="signal-label" id="result-label"></span>
          <pre id="result"></pre>
        </div>
      </div>
      <div class="app-foot"><span class="step-status" id="status"></span><span class="step-status">${compositionId}</span></div>
    </section>
  </div>
  <footer class="film-foot"><ol class="rail" id="rail" aria-label="Episode progress"></ol><span id="chapter-count"></span></footer>
  ${audio}
</main>
<script id="episode-data" type="application/json">${data}</script>
<script>${script}</script>
</body>
</html>`;
}

function framesToCapture(episode) {
  const all = [];
  for (const scene of episode.scenes) {
    const end = scene.durationFrames - 1;
    const selected = new Set([0, 3, 7, 12, 16, Math.ceil(scene.typeEnd), end]);
    for (let frame = scene.typeStart; frame < scene.typeEnd; frame += 4) selected.add(frame);
    if (scene.result) {
      for (const offset of [1, 3, 6, 10, 13]) selected.add(scene.reveal + offset);
    }
    // Frequent static-hold samples keep ordinary web players responsive to seeking.
    for (let frame = FPS * 4; frame < end; frame += FPS * 4) selected.add(frame);

    all.push(...[...selected].filter((frame) => frame <= end).sort((a, b) => a - b)
      .map((frame) => frame + scene.startFrame));
  }
  return all;
}

async function capture(episode, html, workDir) {
  const browser = await getPuppeteer().launch({
    executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium',
    headless: true,
    pipe: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  const frames = framesToCapture(episode);
  const manifest = ['ffconcat version 1.0'];
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT });
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const imageFile = `frame-${String(i).padStart(4, '0')}.jpg`;
      await page.evaluate((seconds) => window.drawTrainingTime(seconds), frame / FPS);
      await page.screenshot({ path: join(workDir, imageFile), type: 'jpeg', quality: 93 });
      const duration = ((frames[i + 1] ?? episode.durationFrames) - frame) / FPS;
      manifest.push(`file ${imageFile}`, `option framerate ${FPS}`, `duration ${duration.toFixed(9)}`);
    }
  } finally {
    await browser.close();
  }
  // The concat demuxer needs one terminal sample to preserve the preceding duration.
  manifest.push(`file frame-${String(frames.length - 1).padStart(4, '0')}.jpg`, `option framerate ${FPS}`);
  const path = join(workDir, 'frames.ffconcat');
  await writeFile(path, manifest.join('\n') + '\n');
  console.log(`${episode.id ?? episode.title}: captured ${frames.length} keyframes.`);
  return path;
}

async function encode(episode, manifest, audio, subtitles, output) {
  const args = ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', manifest];
  if (audio) args.push('-i', audio);
  if (subtitles) args.push('-i', subtitles);
  args.push('-map', '0:v:0');
  if (audio) args.push('-map', '1:a:0', '-af', 'apad', '-c:a', 'aac', '-ar', '48000', '-b:a', '112k', '-metadata:s:a:0', 'language=eng');
  if (subtitles) args.push('-map', `${audio ? 2 : 1}:s:0`, '-c:s', 'mov_text', '-metadata:s:s:0', 'language=eng');
  args.push('-t', String(episode.durationFrames / FPS),
    '-vf', 'scale=in_range=full:out_range=tv,format=yuv420p', '-fps_mode', 'vfr', '-enc_time_base', '1:24',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-threads', '2',
    '-bf', '0', '-force_key_frames', 'expr:gte(t,n_forced*4)',
    '-video_track_timescale', '24000', '-movflags', '+faststart',
    '-metadata', `title=${episode.title}`, output);

  await mkdir(dirname(output), { recursive: true });
  await new Promise((done, fail) => {
    const process = spawn('ffmpeg', args, { stdio: ['ignore', 'inherit', 'inherit'] });
    process.once('error', fail);
    process.once('exit', (code) => code === 0 ? done() : fail(new Error(`FFmpeg exited ${code}`)));
  });
}

async function main() {
  const { values } = parseArgs({
    options: {
      episode: { type: 'string' },
      audio: { type: 'string' },
      subtitles: { type: 'string' },
      output: { type: 'string' },
      'project-dir': { type: 'string' },
      'visual-only': { type: 'boolean' },
      silent: { type: 'boolean' },
    },
  });
  if (!values.episode || (!values.output && !values['project-dir'])) {
    throw new Error('Use --episode PATH and at least one of --output MP4 or --project-dir DIR.');
  }
  const episode = prepareEpisode(JSON.parse(await readFile(values.episode, 'utf8')));
  const audio = !values['visual-only'] && !values.silent && values.audio ? resolve(values.audio) : undefined;
  const subtitles = !values['visual-only'] && values.subtitles ? resolve(values.subtitles) : undefined;

  if (values['project-dir']) {
    const project = resolve(values['project-dir']);
    await mkdir(project, { recursive: true });
    if (audio) await copyFile(audio, join(project, basename(audio)));
    if (subtitles) await copyFile(subtitles, join(project, basename(subtitles)));
    await writeFile(join(project, 'index.html'), await buildHtml(episode, audio && basename(audio)));
  }

  if (values.output) {
    const work = await mkdtemp(join(tmpdir(), 'training-render-'));
    try {
      const manifest = await capture(episode, await buildHtml(episode), work);
      await encode(episode, manifest, audio, subtitles, resolve(values.output));
      console.log(`${episode.id ?? episode.title}: ${(episode.durationFrames / FPS).toFixed(2)} s to ${values.output}`);
    } finally {
      await rm(work, { recursive: true, force: true });
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
