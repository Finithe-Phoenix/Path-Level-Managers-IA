/* Timed vector layouts for the retrieval and evaluation labs. */
(function (root, create) {
  const architecture = create();
  if (typeof module === 'object' && module.exports) module.exports = architecture;
  else root.WorkshopArchitecture = architecture;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  const palette = {
    surface: '#dce9e3', toolbar: '#c5d9d0', paper: '#f5f5e9',
    ink: '#183739', muted: '#456764', line: '#a3bdb1', accent: '#14736c',
    tint: '#bce3d0', warm: '#985d32', pale: '#f3e3c9', dark: '#163132'
  };
  const p = palette;
  const mono = 'DejaVu Sans Mono,monospace';

  function panel(h, title, status) {
    return h.rect(42, 184, 1204, 386, '#0c1717', 14)
      + h.rect(38, 177, 1204, 386, p.surface, 14)
      + h.rect(38, 177, 1204, 58, p.toolbar, 14)
      + h.rect(38, 213, 1204, 22, p.toolbar)
      + h.icon('flow', 61, 196, p.accent, .82)
      + h.txt(95, 214, title, 22, p.ink, 700)
      + h.txt(1217, 211, status, 12, p.muted, 700, 'Open Sans,DejaVu Sans,sans-serif',
        'text-anchor="end" letter-spacing="1.1"');
  }

  function card(h, x, y, w, height, color = p.paper) {
    return h.rect(x, y, w, height, color, 11, `stroke="${p.line}" stroke-width="1.15"`);
  }

  function arrival(h, t, at, g, duration = .58) {
    const show = h.ease((t - at) / duration);
    return h.transform(0, 9 * (1 - show), g, show);
  }

  function drawRoute(h, d, t, at, color = p.accent) {
    const progress = h.clamp((t - at) / .76);
    return `<path d="${d}" pathLength="1" fill="none" stroke="${p.line}" stroke-width="2.5"/>`
      + (progress > 0 ? `<path d="${d}" pathLength="1" fill="none" stroke="${color}" stroke-width="3.1" stroke-linecap="round" stroke-dasharray="${progress.toFixed(3)} 1"/>` : '');
  }

  function sourceLabel(h, x, y, file, revision) {
    const document = h.path('M2 1 H13 L20 8 V25 H2 Z M13 1 V8 H20 M6 13 H16 M6 18 H16',
      'none', p.accent, 1.7);
    return h.transform(x, y - 21, document)
      + h.txt(x + 34, y, file, 22, p.ink, 700, mono)
      + h.label(x + 35, y + 27, `COMMIT · ${revision.toUpperCase()}`, p.muted);
  }

  function sourceCards(s, t, h) {
    const [meta1, quote1, meta2, quote2] = s.lines;
    const docs = [[meta1, quote1], [meta2, quote2]];
    let g = panel(h, 'Source passages', 'SYNTHETIC DOCUMENTS');
    for (const [i, pair] of docs.entries()) {
      const [file, revision] = (pair[0] || '').split(' @ ');
      const x = 61 + i * 586;
      const content = card(h, x, 256, 562, 231)
        + sourceLabel(h, x + 25, 303, file || 'Repository source', revision || 'unknown')
        + h.line(x + 26, 353, x + 535, 353, p.line)
        + h.blocks((pair[1] || '').trim(), x + 27, 399, 510, 70, 26, p.ink, 600);
      g += arrival(h, t, s.events[i * 2] || .4 + i, content);
    }
    g += h.label(64, 527, 'SOURCE PATH AND REVISION STAY WITH EACH PASSAGE', p.accent);
    return g;
  }

  function vectorTiles(h, x, y, members, t, at) {
    const shades = ['#4f9385', '#77b5a1', '#a2caba', '#387d73', '#bedbce'];
    return members.map((member, i) => {
      const cell = h.rect(x + i * 56, y, 49, 40, shades[(i + member) % shades.length], 5);
      return arrival(h, t, at + i * .10, cell, .37);
    }).join('');
  }

  function embeddingFlow(s, t, h) {
    const [textAt, indexAt, searchAt] = s.events;
    let g = panel(h, 'Embedding and search', 'ILLUSTRATIVE VECTOR FRAGMENTS');
    g += card(h, 61, 259, 279, 219) + card(h, 387, 259, 330, 219)
      + card(h, 765, 259, 455, 219);
    g += h.label(84, 295, 'APPROVED TEXT', p.muted)
      + h.label(412, 295, 'EMBEDDING MODEL', p.muted)
      + h.label(790, 295, 'SIMILARITY SEARCH', p.muted);
    g += arrival(h, t, textAt, h.txt(84, 352, 'Query', 24, p.ink, 700)
      + h.txt(84, 422, 'Source passage', 24, p.ink, 700));
    g += drawRoute(h, 'M340 343 H386 M340 413 H386', t, textAt + .20);
    g += vectorTiles(h, 412, 322, [1, 3, 0, 1, 1], t, indexAt)
      + vectorTiles(h, 412, 392, [1, 3, 1, 0, 1], t, indexAt + .25);
    g += drawRoute(h, 'M717 343 C740 343 738 376 765 376 M717 413 C741 413 740 376 765 376',
      t, searchAt + .12);
    g += arrival(h, t, searchAt, h.txt(790, 367, 'Rank candidate passages', 25, p.ink, 700)
      + h.blocks('Open the text to verify relevance.', 790, 411, 405, 44, 20, p.muted, 600));
    g += h.label(64, 527, 'BOTH TEXT INPUTS USE THE MATCHING EMBEDDING MODEL', p.accent);
    return g;
  }

  function rankedCandidates(s, t, h) {
    const [first, firstQuote, second, secondQuote] = s.lines;
    let g = panel(h, 'Ranked retrieval results', 'SYNTHETIC SIMILARITY SCORES');
    const rows = [[first, firstQuote], [second, secondQuote]];
    for (const [i, row] of rows.entries()) {
      const at = s.events[i * 2];
      const match = (row[0] || '').match(/^(\d+)\s+(.+?)\s+score\s+([\d.]+)$/);
      if (!match) return '';
      const [, rank, file, score] = match;
      const y = 250 + i * 126;
      const active = i === 0;
      const tone = active ? p.accent : p.warm;
      const fill = h.clamp(Number(score)) * 285 * h.ease((t - at - .36) / .82);
      let rowBody = card(h, 61, y, 1159, 113, active ? '#edf7ed' : p.paper);
      rowBody += h.circle(100, y + 49, 22, active ? p.accent : p.pale)
        + h.txt(100, y + 56, rank, 21, active ? '#f8fbef' : p.warm, 700,
          mono, 'text-anchor="middle"')
        + h.txt(139, y + 40, file, 21, p.ink, 700, mono)
        + h.blocks((row[1] || '').trim(), 139, y + 80, 600, 45, 21, p.muted, 600)
        + h.txt(1124, y + 38, score, 24, tone, 700, mono)
        + h.rect(825, y + 51, 285, 8, '#d2e0d8', 4)
        + h.rect(825, y + 51, fill, 8, tone, 4);
      rowBody += arrival(h, t, s.resultAt, h.label(825, y + 87,
        active ? 'RELEVANT TO QUANTITY' : 'SHIPPING CONTEXT', tone));
      g += arrival(h, t, at, rowBody);
    }
    g += h.label(64, 525, 'REVIEW THE TEXT AND REVISION BEFORE USING A RESULT', p.accent);
    return g;
  }

  function answerMap(s, t, h, missing) {
    const [question, evidence, rule] = s.lines;
    const badge = missing ? p.warm : p.accent;
    const quote = missing ? question : rule;
    const title = missing ? 'Evidence check' : 'Evidence grounded answer';
    let g = panel(h, title, 'SYNTHETIC REPOSITORY');
    g += card(h, 61, 256, 555, 235) + card(h, 679, 256, 541, 235,
      missing ? p.pale : '#d1eddb');
    g += h.label(85, 289, 'RETRIEVED INPUT', p.muted)
      + h.label(704, 289, missing ? 'MISSING SUPPORT' : 'VERIFIED RESPONSE', badge);
    g += arrival(h, t, s.events[0], h.blocks(missing ? evidence : question,
      85, 327, 501, 65, 23, p.ink, 700));
    g += arrival(h, t, s.events[1], h.blocks(quote, 85, 395, 501, 72, 20, p.muted, 600)
      + h.blocks(missing ? rule : evidence, 85, 450, 501, 32, 15, p.muted, 600, mono));
    if (t >= s.resultAt) {
      const answer = h.blocks(s.result, 705, 352, 472, 104, 28, p.ink, 700);
      g += arrival(h, t, s.resultAt, answer);
    } else {
      g += h.rect(706, 344, 274, 7, '#b7d4c4', 3) + h.rect(706, 373, 173, 7, '#b7d4c4', 3);
    }
    g += drawRoute(h, 'M616 373 H679', t, s.resultAt, badge);
    g += h.label(64, 527, missing ? 'CHECK WHETHER THE SOURCE ACTUALLY ANSWERS THE QUESTION'
      : 'QUESTION + RETRIEVED PASSAGE → RESPONSE WITH A SOURCE', p.accent);
    return g;
  }

  function splitBaseline(s, t, h) {
    let g = panel(h, 'Controlled starting point', 'SYNTHETIC COMPARISON');
    const branches = s.result.split('\n');
    const commit = branches[0]?.match(/[a-f0-9]{7,12}/i)?.[0];
    if (!commit || branches.length < 2) return '';
    const reveal = Math.min(s.resultAt, Math.max(s.events[1] + .5, 2.0));
    g += card(h, 61, 287, 409, 167) + h.label(88, 322, 'BASELINE CHECKOUT', p.muted)
      + h.blocks(s.lines[0], 87, 360, 353, 41, 19, p.ink, 600, mono)
      + h.blocks(s.lines[1], 87, 407, 353, 41, 19, p.ink, 600, mono);
    for (const [i, description] of branches.entries()) {
      const y = 253 + i * 133;
      g += card(h, 700, y, 520, 116, i === 0 ? '#e9f5eb' : p.paper);
      g += drawRoute(h, `M470 372 H567 Q592 372 592 ${y + 58} H700`,
        t, reveal - .32 + .15 * i);
      g += arrival(h, t, reveal + .15 * i, h.label(726, y + 37,
        `ISOLATED CHECKOUT ${i === 0 ? 'A' : 'B'}`, p.accent)
        + h.txt(726, y + 80, description, 22, p.ink, 700, mono));
    }
    g += h.label(64, 527, 'BOTH RUNS MUST AGREE ON THE STARTING COMMIT', p.accent);
    return g;
  }

  function evaluationRuns(s, t, h) {
    let g = panel(h, 'Independent test evidence', 'SAME REFERENCE SUITE');
    const evidence = s.result.split('\n');
    if (evidence.length !== 2) return '';
    const tests = card(h, 61, 253, 1159, 70, p.dark) + h.txt(87, 297,
      s.lines.at(-1), 21, '#e4f4e7', 500, mono);
    g += arrival(h, t, s.events[0], tests);
    for (const [i, entry] of evidence.entries()) {
      const x = 61 + i * 586;
      const heading = i === 0 ? 'RUN A' : 'RUN B';
      const tone = i === 0 ? p.accent : p.warm;
      g += card(h, x, 342, 562, 155, i === 0 ? '#eaf5eb' : p.pale)
        + h.label(x + 24, 382, heading, tone)
        + arrival(h, t, s.resultAt + i * .25, h.txt(x + 24, 449, entry.replace(/^Run [AB]:\s*/, ''),
          29, p.ink, 700, mono));
    }
    g += h.label(64, 532, 'COMPARE THE ACTUAL FILE LIST AND THE TEST RESULTS', p.accent);
    return g;
  }

  function scorecard(s, t, h) {
    let g = panel(h, 'Review scorecard', 'SYNTHETIC OUTCOMES');
    g += card(h, 61, 250, 1159, 285);
    g += h.rect(61, 250, 1159, 48, p.dark, 10) + h.rect(61, 280, 1159, 18, p.dark);
    g += h.label(87, 281, 'OBSERVED EVIDENCE', '#e0eee4')
      + h.label(661, 281, 'RUN A', '#e0eee4') + h.label(1012, 281, 'RUN B', '#e0eee4');
    const rows = s.lines.slice(1);
    for (const [i, line] of rows.entries()) {
      const row = line.trim().split(/\s{2,}/);
      if (row.length !== 3) return '';
      const [name, a, b] = row;
      const y = 298 + i * 58;
      const scope = /^Outside-scope/i.test(name);
      const passes = scope && b === '0';
      g += h.rect(63, y, 1155, 58, i % 2 ? '#edf2e8' : p.paper);
      g += h.line(82, y + 57, 1199, y + 57, p.line);
      let rowBody = h.txt(87, y + 37, name, 23, p.ink, scope ? 700 : 600)
        + h.txt(661, y + 37, a, 24, p.accent, 700, mono)
        + h.txt(1012, y + 37, b, 24, scope && !passes ? p.warm : p.ink, 700, mono);
      if (scope && !passes) {
        rowBody += h.rect(1063, y + 16, 117, 29, p.pale, 5)
          + h.label(1077, y + 36, 'MISSED GATE', p.warm);
      }
      g += arrival(h, t, s.events[i + 1], rowBody);
    }
    return g;
  }

  function permissionMatrix(s, t, h) {
    let g = panel(h, 'Effective session policy', 'SYNTHETIC GCP WORKSPACE');
    g += card(h, 61, 252, 1159, 270);
    g += h.label(86, 284, 'PROPOSED OPERATION', p.muted) + h.label(841, 284, 'ACCESS', p.muted);
    for (const [i, entry] of s.lines.entries()) {
      const [name, access] = entry.trim().split(/\s{2,}/);
      if (!access) return '';
      const y = 302 + 52 * i;
      const approved = access === 'allowed';
      const status = approved ? p.accent : p.warm;
      const row = h.txt(86, y + 32, name, 22, p.ink, 600)
        + h.rect(824, y + 6, 217, 36, approved ? p.tint : p.pale, 7)
        + h.txt(841, y + 31, access, 18, status, 700);
      g += h.line(85, y, 1195, y, p.line) + arrival(h, t, s.events[i], row);
    }
    return g;
  }

  function instructionPaths(s, t, h) {
    const [claude, openCode] = s.lines;
    if (!claude || !openCode) return '';
    let g = panel(h, 'Project-relative discovery', 'EXAMPLE CLIENT PATHS');
    g += card(h, 62, 318, 215, 130, p.tint)
      + h.label(81, 358, 'PROJECT ROOT', p.accent)
      + h.txt(81, 405, 'training-orders', 19, p.ink, 700, mono);
    for (const [i, location] of [claude, openCode].entries()) {
      const y = 255 + 131 * i;
      const at = s.events[i];
      g += drawRoute(h, `M277 383 H320 Q341 383 341 ${y + 59} H386`, t, at + .18);
      const branch = card(h, 386, y, 834, 118)
        + h.label(413, y + 36, i === 0 ? 'CLAUDE CODE' : 'OPENCODE', p.accent)
        + h.txt(413, y + 82, location, 22, p.ink, 600, mono);
      g += arrival(h, t, at, branch);
    }
    g += h.label(64, 534, 'CHECK WHAT THE INSTALLED CLIENT ACTUALLY LOADS', p.accent);
    return g;
  }

  function stagedChange(s, t, h) {
    let g = panel(h, 'Staged refactor', 'SYNTHETIC WORK PLAN');
    const y = 270;
    g += card(h, 61, y, 436, 216, '#e8f3e9')
      + card(h, 783, y, 437, 216)
      + card(h, 530, y + 45, 220, 125, p.pale);
    const [stageOne, stageTwo] = s.lines;
    if (!stageOne || !stageTwo) return '';
    g += drawRoute(h, 'M497 378 H530 M750 378 H783', t, s.events[1]);
    g += arrival(h, t, s.events[0], h.label(88, y + 39, 'STAGE 1', p.accent)
      + h.blocks(stageOne.replace(/^\d+\.\s*/, ''), 88, y + 86, 385, 93, 26, p.ink, 700));
    g += arrival(h, t, s.events[1], h.label(550, y + 78, 'HUMAN CHECKPOINT', p.warm)
      + h.blocks('Inspect diff and tests', 550, y + 114, 180, 36, 17, p.ink, 600));
    g += arrival(h, t, s.events[1] + .25, h.label(809, y + 39, 'STAGE 2', p.accent)
      + h.blocks(stageTwo.replace(/^\d+\.\s*/, ''), 809, y + 86, 385, 108, 25, p.ink, 700));
    g += h.label(64, 531, 'AUTHORIZE THE FIRST STAGE BEFORE THE SECOND', p.accent);
    return g;
  }

  function scopedIntegration(s, t, h) {
    let g = panel(h, 'MCP request path', 'SYNTHETIC READ-ONLY INTEGRATION');
    const steps = [
      ['01 / REQUEST', 'GCP agent client', 'Ask for the training issue.'],
      ['02 / TOOL CALL', 'Approved MCP server', 'get_training_issue'],
      ['03 / RECORD', 'Synthetic issue fixture', 'Read one record by number.']
    ];
    for (const [i, [eyebrow, title, detail]] of steps.entries()) {
      const at = s.events[i * 2] || 1 + i;
      const x = 61 + i * 398;
      const component = card(h, x, 267, 364, 213, i === 1 ? '#def0e2' : p.paper)
        + h.label(x + 23, 310, eyebrow, p.accent)
        + h.blocks(title, x + 23, 362, 320, 63, 24, p.ink, 700)
        + h.blocks(detail, x + 23, 426, 320, 52, 18, p.muted, 600,
          i === 1 ? mono : undefined);
      if (i > 0) g += drawRoute(h, `M${x - 34} 374 H${x}`, t, at - .27);
      g += arrival(h, t, at, component);
    }
    g += h.label(64, 529, 'THE SERVER RETURN SUPPLIES EVIDENCE FOR THE AGENT', p.accent);
    return g;
  }

  function postFixGate(s, t, h) {
    let g = panel(h, 'Post-fix decision gate', 'SYNTHETIC WORKFLOW');
    const paths = s.lines.slice(1).map(line => line.split('→').map(value => value.trim()));
    if (paths.length !== 3 || paths.some(parts => parts.length !== 2)) return '';
    g += card(h, 61, 317, 262, 123, p.tint)
      + h.label(88, 356, 'POST-FIX EVIDENCE', p.accent)
      + h.blocks('Tests and changed files', 88, 393, 215, 44, 19, p.ink, 700);
    for (const [i, [condition, decision]] of paths.entries()) {
      const y = 253 + 92 * i;
      const at = s.events[i + 1];
      const tone = i === 0 ? p.accent : p.warm;
      const outcome = card(h, 451, y, 769, 76, i === 0 ? '#e4f3e8' : p.paper)
        + h.txt(479, y + 45, condition, 20, p.ink, 600)
        + h.label(877, y + 44, decision.toUpperCase(), tone);
      g += drawRoute(h, `M323 379 H369 Q395 379 395 ${y + 38} H451`, t, at)
        + arrival(h, t, at, outcome);
    }
    g += h.label(64, 547, 'ONLY THE VERIFIED BRANCH MOVES TO REVIEW', p.accent);
    return g;
  }

  const layouts = {
    'A01:access': permissionMatrix,
    'A02:paths': instructionPaths,
    'A03:plan': stagedChange,
    'A04:purpose': scopedIntegration,
    'A05:gate': postFixGate,
    'A06:input': sourceCards,
    'A06:embed': embeddingFlow,
    'A06:retrieve': rankedCandidates,
    'A06:generate': (s, t, h) => answerMap(s, t, h, false),
    'A06:stale': (s, t, h) => answerMap(s, t, h, true),
    'A07:baseline': splitBaseline,
    'A07:run': evaluationRuns,
    'A07:compare': scorecard
  };
  const layout = scene => layouts[`${scene.episodeId}:${scene.id}`];

  function draw(scene, t, helpers) {
    return layout(scene)?.(scene, t, helpers) || '';
  }

  function beats(scene) {
    if (!layout(scene)) return [];
    const points = [...scene.events, scene.resultAt, scene.resultAt + .25];
    if (scene.id === 'baseline') points.push(Math.min(scene.resultAt, Math.max(scene.events[1] + .5, 2)));
    return points.map(point => Math.max(0, point - .28));
  }

  return {draw, beats};
});
