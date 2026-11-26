(() => {
  const byId = (id) => document.getElementById(id);
  const {scenes, fps, durationFrames} = JSON.parse(byId('episode-data').textContent);
  const kindProperties = {
    editor: ['Editor workspace', 'Training file', 'Source', 'Observed result'],
    terminal: ['Terminal', 'Authorized training environment', 'Command', 'Terminal output'],
    diagram: ['Model workspace', 'Illustrative data', 'Input', 'Output'],
    github: ['Repository workspace', 'Training repository', 'Evidence to inspect', 'Repository result'],
    decision: ['Decision workspace', 'Illustrative team data', 'Evidence on screen', 'Decision or observation'],
  };
  const sections = scenes.map(() => {
    const marker = document.createElement('li');
    marker.append(document.createElement('i'));
    byId('rail').append(marker);
    return marker;
  });
  const workspace = byId('workspace');
  const panel = byId('result-panel');
  const input = byId('input');
  const output = byId('result');
  const numbers = byId('numbers');
  const caret = byId('caret');
  const clamp = (n) => Math.max(0, Math.min(1, n));
  const smooth = (n) => 1 - Math.pow(1 - clamp(n), 3);
  let active = null;

  function colorCode(node, content) {
    const lines = content.split('\n');
    const fragments = [];
    lines.forEach((line, index) => {
      if (index) fragments.push(document.createTextNode('\n'));
      const span = document.createElement('span');
      if (/^[+][^+]/.test(line)) span.className = 'diff-added';
      else if (/^[-][^-]/.test(line)) span.className = 'diff-removed';
      else if (/^[$>]/.test(line)) span.className = 'code-token';
      span.textContent = line;
      fragments.push(span);
    });
    node.replaceChildren(...fragments);
  }

  function setScene(scene, index) {
    active = scene;
    byId('film').dataset.kind = scene.kind;
    const [workspaceLabel, tab, inputLabel, resultLabel] = kindProperties[scene.kind] ?? kindProperties.editor;
    byId('eyebrow').textContent = scene.eyebrow;
    byId('scene-title').textContent = scene.title;
    byId('scene-title').dataset.compact = scene.title.length >= 29;
    byId('scene-body').textContent = scene.body;
    byId('workspace-label').textContent = workspaceLabel;
    byId('file-tab').textContent = tab;
    byId('input-label').textContent = inputLabel;
    byId('result-label').textContent = resultLabel;
    numbers.hidden = scene.kind !== 'editor' && scene.kind !== 'diagram';
    numbers.textContent = scene.code.split('\n').map((_, i) => String(i + 1).padStart(2, '0')).join('\n');
    byId('chapter-count').textContent = `Scene ${index + 1} of ${sections.length}`;
    colorCode(output, scene.result);
    panel.hidden = !scene.result;
    panel.dataset.tone = /\b(?:FAIL|FAILED|Error|DENIED)\b/.test(scene.result) ? 'bad'
      : /\b(?:pending|wait|review required)\b/i.test(scene.result) ? 'warn' : 'info';

    for (let i = 0; i < sections.length; i++) {
      sections[i].className = i < index ? 'previous' : '';
      sections[i].firstChild.style.removeProperty('transform');
    }
  }

  function draw(seconds) {
    const frame = Math.max(0, Math.min(Math.round(seconds * fps), durationFrames - 1));
    const index = scenes.findLastIndex((candidate) => candidate.startFrame <= frame);
    const scene = scenes[index];
    const local = frame - scene.startFrame;
    if (active !== scene) setScene(scene, index);

    const arrival = smooth(local / 15);
    workspace.style.transform = `translateX(${(1 - arrival) * 44}px) translateY(${(1 - arrival) * 13}px) scale(${0.957 + 0.043 * arrival})`;
    workspace.style.opacity = String(0.66 + 0.34 * arrival);
    byId('lesson').style.transform = `translateY(${(1 - arrival) * 12}px)`;

    const typing = clamp((local - scene.typeStart) / (scene.typeEnd - scene.typeStart));
    const length = Math.ceil(typing * scene.code.length);
    colorCode(input, scene.code.slice(0, length));
    input.append(caret);
    caret.style.visibility = length < scene.code.length ? 'visible' : 'hidden';

    const reveal = smooth((local - scene.reveal) / 13);
    panel.style.opacity = String(reveal);
    panel.style.transform = `translateY(${(1 - reveal) * 16}px)`;
    panel.style.clipPath = `inset(0 0 ${(1 - reveal) * 100}% 0)`;
    byId('status').textContent = local >= scene.reveal ? 'Inspect the evidence' : 'Follow the action';
    const stageProgress = clamp(local / Math.max(1, scene.durationFrames - 1));
    sections[index].firstChild.style.transform = `scaleX(${stageProgress})`;
  }

  window.drawTrainingTime = draw;
  window.addEventListener('hf-seek', (event) => draw(event.detail.time));
  draw(0);
})();
