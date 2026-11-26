import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    episode: { type: 'string', multiple: true },
    storyboard: { type: 'string', multiple: true },
    project: { type: 'string', multiple: true },
    report: { type: 'string' },
  },
});
if (!(values.episode?.length || values.storyboard?.length || values.project?.length)) {
  throw new Error('Supply one or more --episode JSON, --storyboard JSON, or --project DIRECTORY arguments.');
}

const require = createRequire(import.meta.url);
const chromiumDriver = process.env.VIDEO_TRAINING_PUPPETEER_CORE;
const puppeteer = require(chromiumDriver ?? 'puppeteer-core');

const temp = await mkdtemp(join(tmpdir(), 'training-qa-'));
const renderer = fileURLToPath(new URL('./render.mjs', import.meta.url));
const jobs = [];

async function run(command, args) {
  await new Promise((done, fail) => {
    const process = spawn(command, args, { stdio: ['ignore', 'ignore', 'inherit'] });
    process.once('error', fail);
    process.once('exit', (code) => code === 0 ? done() : fail(new Error(`Child process exited ${code}`)));
  });
}

async function check(page, project) {
  const html = await readFile(join(project, 'index.html'), 'utf8');
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);

  return page.evaluate(() => {
    const { id, title, fps, scenes } = JSON.parse(document.getElementById('episode-data').textContent);
    const viewport = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    const node = (selector) => document.querySelector(selector);
    const issues = [];
    const tolerance = 3;
    const exceeded = (inner, outer) => {
      const excess = {
        left: outer.left - inner.left,
        top: outer.top - inner.top,
        right: inner.right - outer.right,
        bottom: inner.bottom - outer.bottom,
      };
      return Object.fromEntries(Object.entries(excess).filter(([, value]) => value > tolerance)
        .map(([edge, value]) => [edge, Math.ceil(value)]));
    };

    function inspect(scene, selector, boundary, label, phase) {
      const element = node(selector);
      const outer = boundary ? node(boundary).getBoundingClientRect() : viewport;
      if (!element?.getClientRects().length || !element.textContent.trim()) return;
      const range = new Range();
      range.selectNodeContents(element);
      const content = range.getBoundingClientRect();
      const overflow = exceeded(content, outer);
      if (Object.keys(overflow).length) {
        issues.push({ scene: scene.id, label, phase, overflow, text: element.textContent.slice(0, 72) });
      }
    }

    for (const scene of scenes) {
      window.drawTrainingTime(scene.startFrame / fps);
      const camera = exceeded(node('#workspace').getBoundingClientRect(), viewport);
      if (Object.keys(camera).length) issues.push({ scene: scene.id, label: 'Workspace', phase: 'Entry', overflow: camera });
      window.drawTrainingTime((scene.startFrame + scene.durationFrames - 1) / fps);
      inspect(scene, '#eyebrow', '.content', 'Eyebrow', 'Settled');
      inspect(scene, '#scene-title', '.content', 'Title', 'Settled');
      inspect(scene, '#scene-body', '.content', 'Explanation', 'Settled');
      inspect(scene, '#input', '.pane', 'Code or input', 'Settled');
      inspect(scene, '#numbers', '.pane', 'Line numbers', 'Settled');
      inspect(scene, '#result', '.result-panel', 'Evidence or result', 'Settled');
      inspect(scene, '#status', '.app-foot', 'Workspace control', 'Settled');
      inspect(scene, '#chapter-count', '.film-foot', 'Chapter indicator', 'Settled');
      inspect(scene, '.audience', '.film-head', 'Header subtitle', 'Settled');
      const lesson = exceeded(node('.lesson').getBoundingClientRect(), node('.content').getBoundingClientRect());
      if (Object.keys(lesson).length) issues.push({ scene: scene.id, label: 'Lesson block', phase: 'Settled', overflow: lesson });
      const header = node('.episode-title');
      if (header.scrollWidth > header.clientWidth + tolerance) {
        issues.push({ scene: scene.id, label: 'Header title truncated', phase: 'Settled', text: title });
      }
    }
    return { id, title, scenes: scenes.length, issues };
  });
}

let browser;
try {
  for (const file of values.episode ?? []) jobs.push({ file: resolve(file) });
  for (const file of values.storyboard ?? []) {
    const records = JSON.parse(await readFile(file, 'utf8'));
    if (!Array.isArray(records)) throw new Error(`Storyboard ${file} must be an episode array.`);
    for (const record of records) {
      const episode = { ...record, scenes: record.scenes.map((scene) => ({ ...scene, durationFrames: 24 * 24 })) };
      const copy = join(temp, `episode-${jobs.length}.json`);
      await writeFile(copy, JSON.stringify(episode));
      jobs.push({ file: copy });
    }
  }
  for (const project of values.project ?? []) jobs.push({ project: resolve(project) });

  browser = await puppeteer.launch({
    executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium',
    headless: true,
    pipe: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  const results = [];
  for (const [index, job] of jobs.entries()) {
    const project = job.project ?? join(temp, `composition-${index}`);
    if (!job.project) await run(process.execPath, [renderer, '--episode', job.file, '--project-dir', project]);
    const result = await check(page, project);
    results.push(result);
    process.stderr.write(`${result.id} · ${result.scenes} scenes · ${result.issues.length} layout issues\n`);
  }

  const report = {
    episodes: results.length,
    scenes: results.reduce((count, result) => count + result.scenes, 0),
    issues: results.reduce((count, result) => count + result.issues.length, 0),
    results,
  };
  const json = JSON.stringify(report, null, 2) + '\n';
  if (values.report) await writeFile(values.report, json);
  else process.stdout.write(json);
  if (report.issues > 0) process.exitCode = 1;
} finally {
  await browser?.close();
  await rm(temp, { recursive: true, force: true });
}
