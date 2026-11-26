#!/usr/bin/env node
'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const {spawn} = require('node:child_process');
const {createHash} = require('node:crypto');
const {parseArgs} = require('node:util');

const components = [
  'manager-visuals.cjs', 'architecture.cjs', 'foundations.cjs',
  'workbenches.cjs', 'stage.cjs'
];
const fontFaces = [
  ['Open Sans', '400', 'OpenSans-Regular.ttf'],
  ['Open Sans', '600', 'OpenSans-Semibold.ttf'],
  ['Open Sans', '700', 'OpenSans-Bold.ttf'],
  ['DejaVu Sans Mono', '400', 'DejaVuSansMono.ttf']
];

async function openChromium(bin) {
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'fieldlab-qa-'));
  const browser = spawn(bin, [
    '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
    '--disable-background-networking', '--no-first-run', '--remote-debugging-pipe',
    '--user-data-dir=' + profile
  ], {stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe']});
  const tasks = new Map();
  let sequence = 0;
  let input = '';
  let alive = true;
  const fail = error => {
    alive = false;
    for (const task of tasks.values()) task.reject(error);
    tasks.clear();
  };
  browser.on('error', fail);
  browser.on('exit', code => fail(Error(`Chromium exited (${code})`)));
  browser.stdio[3].on('error', fail);
  browser.stdio[4].setEncoding('utf8');
  browser.stdio[4].on('data', data => {
    input += data;
    let delimiter;
    while ((delimiter = input.indexOf('\0')) >= 0) {
      const response = JSON.parse(input.slice(0, delimiter));
      input = input.slice(delimiter + 1);
      const task = tasks.get(response.id);
      if (!task) continue;
      tasks.delete(response.id);
      if (response.error) task.reject(Error(response.error.message));
      else task.resolve(response.result);
    }
  });
  function send(method, params = {}, sessionId) {
    return new Promise((resolve, reject) => {
      if (!alive) return reject(Error('Chromium session is closed'));
      const id = ++sequence;
      const timer = setTimeout(() => {
        tasks.delete(id);
        reject(Error(`Chromium timed out in ${method}`));
      }, 60_000);
      tasks.set(id, {
        resolve(value) { clearTimeout(timer); resolve(value); },
        reject(error) { clearTimeout(timer); reject(error); }
      });
      browser.stdio[3].write(JSON.stringify({id, method, params, sessionId}) + '\0');
    });
  }
  async function close() {
    if (alive) {
      const done = new Promise(resolve => browser.once('close', resolve));
      browser.kill('SIGTERM');
      await done;
    }
    await fs.rm(profile, {recursive: true, force: true});
  }
  return {send, close};
}

function installProbe() {
  const h = document.getElementById('screen');
  const stage = window.WorkshopStage;
  const width = stage.W;
  const height = stage.H;
  const ink = document.createElement('canvas').getContext('2d');
  let prepared;
  const round = x => Math.round(x * 10) / 10;
  function bounds(node) {
    const value = node.getBoundingClientRect();
    return {
      x: round(value.x), y: round(value.y),
      right: round(value.right), bottom: round(value.bottom),
      width: round(value.width), height: round(value.height)
    };
  }
  function visible(node) {
    let opacity = 1;
    for (let parent = node; parent && parent !== h; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      if (style.display === 'none' || style.visibility !== 'visible') return false;
      opacity *= Number(style.opacity);
      if (opacity < .08) return false;
    }
    return true;
  }
  function glyphBounds(node, box) {
    const transform = node.getScreenCTM();
    if (!transform || transform.d <= 0 || transform.b || transform.c) return box;
    const style = getComputedStyle(node);
    ink.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const metrics = ink.measureText(node.textContent);
    const baseline = transform.f + node.y.baseVal.getItem(0).value * transform.d;
    return {
      ...box,
      y: round(baseline - metrics.actualBoundingBoxAscent * transform.d),
      bottom: round(baseline + metrics.actualBoundingBoxDescent * transform.d)
    };
  }
  function inside(box, rect, tolerance = 0) {
    return box.x >= rect.x - tolerance && box.y >= rect.y - tolerance
      && box.right <= rect.right + tolerance && box.bottom <= rect.bottom + tolerance;
  }
  function probe(frame) {
    h.innerHTML = stage.frame(prepared, frame);
    const shapes = [...h.querySelectorAll('text')].filter(visible).map(node => {
      const box = bounds(node);
      return {node, text: node.textContent.trim(), box, glyph: glyphBounds(node, box)};
    }).filter(value => value.text && value.box.width > 0 && value.box.height > 0);
    const rectangles = [...h.querySelectorAll('rect')].filter(visible).map(node => ({
      node, box: bounds(node)
    })).filter(({box}) => box.width >= 82 && box.height >= 24
      && box.x >= 36 && box.y >= 226 && box.right <= 1249 && box.bottom <= 580);
    const result = [];
    for (let i = 0; i < shapes.length; i++) {
      const first = shapes[i];
      const box = first.box;
      if (!inside(box, {x: 0, y: 0, right: width, bottom: height}, 1)) {
        result.push({type: 'viewport', text: first.text, box});
      }
      if (box.y >= 177 && box.y < 563 && (box.x < 36 || box.right > 1246 || box.bottom > 574)) {
        result.push({type: 'panel', text: first.text, box});
      }
      const midY = (box.y + box.bottom) / 2;
      // Prefer the smallest preceding panel enclosing the first glyph. A
      // progress track, highlight strip, or later overlay is not a text box.
      const parents = rectangles.filter(({node, box: r}) =>
        (node.compareDocumentPosition(first.node) & Node.DOCUMENT_POSITION_FOLLOWING)
        && box.x >= r.x + 1 && box.x <= r.right - 10
        && midY >= r.y + 1 && midY <= r.bottom - 1
      ).sort((a, b) => a.box.width * a.box.height - b.box.width * b.box.height);
      if (parents.length && !inside(box, parents[0].box, 3)) {
        result.push({type: 'container', text: first.text, box, container: parents[0].box});
      }
      for (let j = 0; j < i; j++) {
        const second = shapes[j];
        const other = second.box;
        const dx = Math.min(box.right, other.right) - Math.max(box.x, other.x);
        const dy = Math.min(first.glyph.bottom, second.glyph.bottom) - Math.max(first.glyph.y, second.glyph.y);
        if (dx >= 8 && dy >= 3) {
          result.push({type: 'overlap', text: first.text, box: first.glyph,
            other: second.text, otherBox: second.glyph});
        }
      }
    }
    return result;
  }
  window.auditEpisode = input => {
    prepared = stage.prepare(input);
    return prepared.scenes.map(scene => {
      const samples = [...new Set([
        0, 12, ...scene.events.map(time => Math.round((time + .3) * stage.FPS)),
        Math.round(scene.resultAt * stage.FPS) + 5, scene.durationFrames - 1
      ].map(at => Math.min(scene.durationFrames - 1, at)))];
      const issues = [];
      for (const offset of samples) {
        for (const finding of probe(scene.start + offset)) issues.push({offset, ...finding});
      }
      return {scene: scene.id, steps: samples.length, issues, firstFrame: scene.start,
        finalFrame: scene.start + scene.durationFrames - 1};
    });
  };
  window.auditDraw = frame => {
    h.innerHTML = stage.frame(prepared, frame);
  };
}

async function optionalJSON(file) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}

async function loadInputs(options) {
  const lessons = path.resolve(options.lessons || path.join(__dirname, '..', 'lessons'));
  const narrated = path.resolve(options.narrated || path.join(__dirname, '..', 'mastered'));
  const narration = path.resolve(options.narration || path.join(__dirname, '..', 'narration'));
  const selected = new Set((options.episodes || '').split(',').filter(Boolean));
  const files = (await fs.readdir(lessons)).filter(name => name.endsWith('.json')).sort();
  const inputs = [];
  for (const file of files) {
    const catalog = JSON.parse(await fs.readFile(path.join(lessons, file), 'utf8'));
    const entries = Array.isArray(catalog) ? catalog : catalog.episodes;
    if (!Array.isArray(entries)) throw Error(`Expected a lesson list in ${file}`);
    for (const ep of entries) {
      if (selected.size && !selected.has(ep.id)) continue;
      const ready = await optionalJSON(path.join(narrated, ep.id, 'episode.json'));
      const marks = ready || await optionalJSON(path.join(narration, ep.id, 'timing.json'));
      if (!marks && options['require-timed']) throw Error(`Missing narrated timeline for ${ep.id}`);
      if (marks && marks.scenes.length !== ep.scenes.length) throw Error(`Timing scene count differs for ${ep.id}`);
      const scenes = ep.scenes.map((scene, index) => {
        if (!marks) return {...scene, durationFrames: 32 * 24};
        const mark = marks.scenes[index];
        const digest = createHash('sha256').update(scene.narration).digest('hex');
        if (scene.id !== mark.id || (ready ? scene.narration !== mark.narration : digest !== mark.scriptSha256)) {
          throw Error(`Speech timing out of sync for ${ep.id}/${scene.id}`);
        }
        return {...scene, durationFrames: mark.durationFrames, cues: mark.cues};
      });
      inputs.push({episode: {...ep, scenes}, timed: !!marks});
    }
  }
  if (!inputs.length) throw Error('No lessons selected');
  return inputs.sort((a, b) => a.episode.id.localeCompare(b.episode.id));
}

async function main() {
  const {values: options} = parseArgs({options: {
    lessons: {type: 'string'}, narrated: {type: 'string'}, narration: {type: 'string'}, chromium: {type: 'string'},
    episodes: {type: 'string'}, report: {type: 'string'}, screenshots: {type: 'string'},
    'require-timed': {type: 'boolean'}, help: {type: 'boolean'}
  }});
  if (options.help) {
    console.log('node qa.cjs [--lessons dir] [--narrated dir] [--narration dir] [--episodes A01,A06] [--chromium path] [--require-timed] [--report report.json] [--screenshots dir]');
    return;
  }
  const inputs = await loadInputs(options);
  const [scripts, faces] = await Promise.all([
    Promise.all(components.map(file => fs.readFile(path.join(__dirname, file), 'utf8'))),
    Promise.all(fontFaces.map(async ([family, weight, filename]) => {
      const bytes = await fs.readFile(path.join(__dirname, 'fonts', filename));
      return `@font-face{font-family:"${family}";font-weight:${weight};src:url(data:font/ttf;base64,${bytes.toString('base64')}) format("truetype")}`;
    }))
  ]);
  const browser = await openChromium(options.chromium || process.env.CHROMIUM_BIN || 'chromium');
  try {
    const {targetId} = await browser.send('Target.createTarget', {url: 'about:blank'});
    const {sessionId} = await browser.send('Target.attachToTarget', {targetId, flatten: true});
    const send = (method, params) => browser.send(method, params, sessionId);
    await send('Page.enable', {});
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280, height: 720, deviceScaleFactor: 1, mobile: false
    });
    const {frameTree} = await send('Page.getFrameTree', {});
    await send('Page.setDocumentContent', {
      frameId: frameTree.frame.id,
      html: '<!doctype html><style>' + faces.join('\n')
        + 'body{margin:0}svg{display:block}</style><div id="screen"></div><script>'
        + scripts.join('\n') + '\n(' + installProbe + ')();</script>'
    });
    async function run(expression) {
      const result = await send('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true});
      if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || 'Browser probe failed');
      return result.result.value;
    }
    await run('Promise.all([document.fonts.load(\'400 20px "Open Sans"\'),document.fonts.load(\'600 20px "Open Sans"\'),document.fonts.load(\'700 20px "Open Sans"\'),document.fonts.load(\'400 20px "DejaVu Sans Mono"\')])');
    if (options.screenshots) await fs.mkdir(options.screenshots, {recursive: true});
    const report = [];
    for (const {episode, timed} of inputs) {
      const scenes = await run('auditEpisode(' + JSON.stringify(episode) + ')');
      const issueCount = scenes.reduce((sum, scene) => sum + scene.issues.length, 0);
      const frameCount = scenes.reduce((sum, scene) => sum + scene.steps, 0);
      if (options.screenshots) {
        const snapshot = scenes[Math.floor(scenes.length / 2)];
        await run(`auditDraw(${snapshot.finalFrame})`);
        const {data} = await send('Page.captureScreenshot', {format: 'png', fromSurface: true});
        await fs.writeFile(path.join(options.screenshots, `${episode.id}-${snapshot.scene}.png`), Buffer.from(data, 'base64'));
        const candidate = scenes.find(scene => scene.issues.length > 0);
        if (candidate) {
          await run(`auditDraw(${candidate.firstFrame + candidate.issues[0].offset})`);
          const {data} = await send('Page.captureScreenshot', {format: 'png', fromSurface: true});
          await fs.writeFile(path.join(options.screenshots, `${episode.id}-${candidate.scene}-candidate.png`), Buffer.from(data, 'base64'));
        }
      }
      report.push({episode: episode.id, timed, scenes});
      console.log(`${episode.id} · ${scenes.length} scenes · ${frameCount} frames · ${issueCount} candidates · ${timed ? 'narrated timing' : 'provisional timing'}`);
    }
    if (options.report) {
      await fs.mkdir(path.dirname(path.resolve(options.report)), {recursive: true});
      await fs.writeFile(options.report, JSON.stringify(report, null, 2) + '\n');
    }
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
