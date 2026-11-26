/* Seekable quantitative panels for the fictional order-service pilot. */
(function (root, makeVisuals) {
  const visuals = makeVisuals();
  if (typeof module === 'object' && module.exports) module.exports = visuals;
  else root.ManagerVisuals = visuals;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  const paper = '#edf0e4', sheet = '#f7f5ea', ink = '#203832';
  const muted = '#48645b', rule = '#bbcbbd', ghost = '#dce5d9';
  const green = '#246955', lightGreen = '#d9e9d8';
  const amber = '#895411', lightAmber = '#f7e8be';
  const x = 38, y = 177, width = 1204, height = 386;

  function right(h, x, y, value, size, color = ink, weight = 700) {
    return h.txt(x, y, value, size, color, weight, undefined, 'text-anchor="end"');
  }

  function center(h, x, y, value, size, color = ink, weight = 700) {
    return h.txt(x, y, value, size, color, weight, undefined, 'text-anchor="middle"');
  }

  function surface(h, title, kind = 'flow', caption = 'SYNTHETIC PILOT DATA') {
    return h.rect(x + 4, y + 7, width, height, '#0c1717', 14)
      + h.rect(x, y, width, height, paper, 14)
      + h.rect(x, y, width, 55, '#d3ded2', 14)
      + h.rect(x, y + 36, width, 19, '#d3ded2')
      + h.icon(kind, 60, 195, green, .84)
      + h.txt(92, 212, title, 21, ink, 700)
      + right(h, 1218, 211, caption, 13, muted);
  }

  function reveal(h, t, at, content, distance = 6) {
    const progress = h.ease((t - at) / .58);
    return h.transform(0, distance * (1 - progress), content, progress);
  }

  function card(h, left, top, w, hh, color = sheet) {
    return h.rect(left, top, w, hh, color, 9, `stroke="${rule}" stroke-width="1"`);
  }

  function modelBenchmark(h, t, [modelAAt, modelBAt, decisionAt]) {
    let g = surface(h, 'Same eight tasks and quality gate', 'decision', 'SYNTHETIC BENCHMARK')
      + right(h, 1218, 267, 'Quality gate: 8 of 8 cases meet every criterion', 17, green);
    const models = [
      {name:'Model A', passes:7, minutes:2, left:62, at:modelAAt},
      {name:'Model B', passes:8, minutes:3, left:652, at:modelBAt}
    ];
    for (const {name, passes, minutes, left, at} of models) {
      g += card(h, left, 285, 566, 170) + h.txt(left + 23, 321, name, 24, ink, 700);
      for (let idx = 0; idx < 8; idx++) {
        const wx = left + 24 + idx * 65, passed = idx < passes;
        const sampleAt = at + idx * .065;
        g += h.rect(wx, 335, 47, 46, ghost, 6);
        g += reveal(h, t, sampleAt, h.rect(wx, 335, 47, 46, passed ? lightGreen : lightAmber, 6)
          + center(h, wx + 23.5, 365, passed ? '✓' : '×', 23, passed ? green : amber), 2);
      }
      g += reveal(h, t, at + .25, h.txt(left + 24, 425, `${passes}/8 pass`, 23, passes === 8 ? green : amber, 700)
        + right(h, left + 541, 424, `${minutes} min median steering`, 19, muted, 600));
    }
    g += card(h, 62, 475, 1156, 66, '#e0ebdf');
    g += reveal(h, t, decisionAt, h.txt(85, 516, 'Choose B for the scoped pilot', 24, green, 700)
      + right(h, 1193, 516, 'Trade-off: 1 extra median minute of steering', 18, ink, 600));
    return g;
  }

  function permissionMatrix(h, t, [agentAt, authorAt, reviewerAt, verifyAt]) {
    let g = surface(h, 'Who can act on the training change?', 'branch', 'ILLUSTRATIVE ACCESS PLAN')
      + card(h, 62, 249, 1156, 294);
    for (const [label, pos] of [['Operation',86],['Who acts',395],['Scope',671]]) {
      g += h.txt(pos, 281, label, 16, muted, 700);
    }
    const rows = [
      ['Read context','Agent','Two files in the training checkout',agentAt],
      ['Propose edits','Agent','Scoped change on the working branch',agentAt + .24],
      ['Approve test run','Author','Approved test environment',authorAt],
      ['Publish branch and open PR','Author','Own authorized account',authorAt + .24],
      ['Submit review decision','Teammate','Separate authorized account',reviewerAt]
    ];
    for (const [idx, [operation, who, scope, at]] of rows.entries()) {
      const yy = 294 + idx * 39;
      g += h.line(79, yy, 1200, yy, rule);
      g += reveal(h, t, at,
        (idx === 4 ? h.rect(76, yy + 3, 1128, 34, lightGreen, 5) : '')
        + h.txt(86, yy + 25, operation, 18, ink, 600)
        + h.txt(395, yy + 25, who, 19, idx === 4 ? green : ink, 700)
        + h.txt(671, yy + 25, scope, 18, muted, 600), 2);
    }
    g += reveal(h, t, verifyAt, h.txt(86, 518, 'Verify that the person publishing the branch is different from the reviewer.', 17, green, 700));
    return g;
  }

  function waitTimeline(h, t, [readyAt, mondayAt, tuesdayAt, totalAt, baselineAt]) {
    const track = 490, start1 = 90, start2 = 700, barY = 324;
    const segment = (left, offset, hours, at) => h.rect(left, barY, track, 28, ghost, 7)
      + h.rect(left + track * offset / 8, barY, track * hours / 8 * h.ease((t - at) / .65), 28, green, 7);
    let g = surface(h, 'Business-hours timeline')
      + card(h, 62, 250, 551, 173) + card(h, 667, 250, 551, 173)
      + h.txt(90, 282, 'Monday', 22, ink, 700) + h.txt(700, 282, 'Tuesday', 22, ink, 700)
      + h.txt(start1 + track / 8, 310, '10:00 am', 17, muted, 600) + right(h, start1 + track, 310, '5:00 pm', 17, muted)
      + h.txt(start2, 310, '9:00 am', 17, muted, 600) + right(h, start2 + track * 5 / 8, 310, '2:00 pm', 17, muted)
      + segment(start1, 1, 7, mondayAt) + segment(start2, 0, 5, tuesdayAt)
      + h.line(617, 338, 663, 338, muted, 1.6, 'stroke-dasharray="4 4"')
      + center(h, 640, 452, 'Overnight hours excluded', 16, muted, 600);
    g += reveal(h, t, readyAt, h.txt(90, 386, 'PR marked ready', 19, ink, 600));
    g += reveal(h, t, mondayAt, right(h, 587, 386, '7 business hours', 22, green));
    g += reveal(h, t, tuesdayAt, h.txt(700, 386, 'First human review', 19, ink, 600)
      + right(h, 1190, 386, '5 business hours', 22, green));
    g += card(h, 62, 471, 1156, 67, '#e0ebdf')
      + reveal(h, t, totalAt, h.txt(86, 514, '7 + 5 = 12 business hours', 27, ink, 700))
      + reveal(h, t, baselineAt, right(h, 1193, 513, 'Baseline median: 18 h across 40 PRs', 21, green));
    return g;
  }

  function timeCard(h, t, opts) {
    const {left, title, unit, max, baseline, pilot, limit, delta, at, atDelta} = opts;
    const w = 566, barLeft = left + 125, track = 402;
    const atValue = value => barLeft + value / max * track;
    let g = card(h, left, 252, w, 280)
      + h.txt(left + 24, 286, title, 23, ink, 700)
      + h.txt(left + 24, 311, unit, 16, muted, 600)
      + right(h, left + w - 23, 285, `Limit  ≤ ${limit}`, 18, green);
    const bars = [['Baseline', baseline, 333, '#577c70'], ['Pilot', pilot, 394, green]];
    for (const [index, [name, value, yy, color]] of bars.entries()) {
      const from = at + index * .18;
      g += h.txt(left + 24, yy + 20, name, 17, ink, 600)
        + h.rect(barLeft, yy, track, 24, ghost, 5)
        + h.rect(barLeft, yy, (atValue(value) - barLeft) * h.ease((t - from) / .64), 24, color, 5)
        + reveal(h, t, from + .14, right(h, atValue(value) - 10, yy + 18, value, 16, '#ffffff'));
    }
    g += h.line(atValue(limit), 323, atValue(limit), 428, ink, 2, 'stroke-dasharray="5 5"')
      + h.txt(barLeft, 447, '0', 14, muted, 600) + right(h, barLeft + track, 447, max, 14, muted)
      + h.line(left + 24, 465, left + w - 24, 465, rule);
    g += reveal(h, t, atDelta, h.txt(left + 24, 503, delta, 19, ink, 700)
      + right(h, left + w - 24, 503, 'Meets target', 17, green));
    return g;
  }

  function reviewTime(h, t, [waitAt, waitDeltaAt, effortAt, effortDeltaAt]) {
    return surface(h, 'Review measures on separate scales')
      + timeCard(h, t, {left:62, title:'Wait for first human review', unit:'Business hours',
        max:20, baseline:18, pilot:13, limit:14, delta:'5 business hours fewer', at:waitAt, atDelta:waitDeltaAt})
      + timeCard(h, t, {left:652, title:'Active reviewer effort', unit:'Active minutes',
        max:30, baseline:24, pilot:26, limit:27, delta:'2 active minutes more', at:effortAt, atDelta:effortDeltaAt});
  }

  function reworkCard(h, t, left, title, count, rate, at) {
    let g = card(h, left, 251, 566, 212) + h.txt(left + 24, 284, title, 22, ink, 700);
    for (let idx = 0; idx < 40; idx++) {
      const px = left + 32 + (idx % 20) * 25.5, py = 326 + Math.floor(idx / 20) * 27;
      g += h.circle(px, py, 7, ghost, `stroke="${rule}" stroke-width="1"`);
      if (idx < count) {
        const excess = idx === 6;
        const progress = h.ease((t - at - idx * .045) / .28);
        g += h.circle(px, py, 7.5 * progress, excess ? amber : green);
        if (excess) g += h.circle(px, py, 11, 'none', `stroke="${amber}" stroke-width="1.7" opacity="${progress}"`);
      }
    }
    g += reveal(h, t, at + .35, h.txt(left + 24, 415, `${count} ÷ 40 = ${rate}%`, 31, count > 6 ? amber : green, 700));
    g += right(h, left + 541, 414, '40 eligible pull requests', 16, muted, 600);
    return g;
  }

  function reviewQuality(h, t, [baselineAt, pilotAt, missAt, defectsAt]) {
    return surface(h, 'Material rework by cohort')
      + reworkCard(h, t, 62, 'Baseline', 6, 15, baselineAt)
      + reworkCard(h, t, 652, 'Pilot', 7, 17.5, pilotAt)
      + card(h, 62, 479, 1156, 61, lightAmber)
      + reveal(h, t, missAt, h.txt(84, 516, 'Ceiling 15% · Pilot exceeded it by 2.5 percentage points', 19, amber, 700))
      + reveal(h, t, defectsAt, right(h, 1195, 516, 'Post-merge defects: 1 of 40 in each cohort', 16, muted, 600));
  }

  const costs = [
    {name:'Allocated licenses', amount:100, color:'#246955'},
    {name:'Approved remote workspace', amount:20, color:'#82a699'},
    {name:'Training and enablement', amount:120, color:'#a47832'}
  ];

  function spend(h, t, [licensesAt, workspaceAt, trainingAt, totalAt, perPrAt]) {
    const start = 89, track = 1102, cap = 300, timings = [licensesAt, workspaceAt, trainingAt];
    let g = surface(h, 'Incremental pilot expense ledger') + card(h, 62, 367, 1156, 175);
    let used = 0;
    for (const [idx, {name, amount, color}] of costs.entries()) {
      const left = 62 + idx * 393, at = timings[idx], progress = h.ease((t - at) / .62);
      g += card(h, left, 251, 370, 99)
        + h.rect(left + 21, 271, 7, 17, color, 2)
        + h.txt(left + 41, 285, name, 17, ink, 700)
        + reveal(h, t, at, h.txt(left + 21, 329, `$${amount}`, 30, color, 700));
      used += amount;
      g += h.rect(start + (used - amount) / cap * track, 413, amount / cap * track * progress, 27, color, 4);
    }
    g += h.rect(start, 413, track, 27, 'none', 5, `stroke="${rule}" stroke-width="1.4"`)
      + h.txt(start, 403, '$0', 15, muted, 600) + right(h, start + track, 403, '$300 cap', 16, muted);
    g += reveal(h, t, totalAt, h.txt(start, 472, '$240 spent', 23, green, 700)
      + right(h, start + track, 472, '$60 below cap', 21, green));
    g += reveal(h, t, perPrAt, h.txt(start, 515, '$240 ÷ 40 eligible pull requests = $6 per PR', 23, ink, 700));
    return g;
  }

  function scorecard(h, t, [waitAt, effortAt, costAt, reworkAt, incidentsAt]) {
    let g = surface(h, 'Criteria agreed at kickoff', 'decision') + card(h, 62, 249, 1156, 294);
    const rows = [
      ['Wait for review','13 business h','≤ 14 business h','Meets',waitAt],
      ['Active review','26 min','≤ 27 min','Meets',effortAt],
      ['Incremental cost','$240','≤ $300','Meets',costAt],
      ['Material rework','17.5%','≤ 15%','Misses',reworkAt]
    ];
    for (const [label, pos] of [['Metric',86],['Pilot',518],['Threshold',749],['Decision rule',995]]) {
      g += h.txt(pos, 282, label, 16, muted, 700);
    }
    for (const [idx, [name, value, limit, status, at]] of rows.entries()) {
      const rowY = 295 + idx * 46, miss = status === 'Misses';
      g += h.line(79, rowY, 1200, rowY, rule);
      const row = (miss ? h.rect(76, rowY + 3, 1128, 39, lightAmber, 5) : '')
        + h.txt(86, rowY + 28, name, 19, ink, 600)
        + h.txt(518, rowY + 28, value, 21, miss ? amber : ink, 700)
        + h.txt(749, rowY + 28, limit, 19, ink, 600)
        + h.txt(995, rowY + 28, status, 19, miss ? amber : green, 700);
      g += reveal(h, t, at, row, 3);
    }
    g += reveal(h, t, incidentsAt, h.txt(86, 517, 'Defects: 1 in each cohort', 17, muted, 600)
      + right(h, 1194, 517, 'Serious data or access incidents: 0', 17, muted, 600));
    return g;
  }

  function denominator(h, t, [setupAt, fortyAt, thirtyAt, takeawayAt]) {
    let g = surface(h, 'Same 15% rework ceiling, different sample sizes', 'decision');
    const scenarios = [
      {left:62, requests:40, meets:'6 of 40 = 15.0%', misses:'7 of 40 = 17.5%', at:fortyAt},
      {left:652, requests:30, meets:'4 of 30 ≈ 13.3%', misses:'5 of 30 ≈ 16.7%', at:thirtyAt}
    ];
    for (const {left, requests, meets, misses, at} of scenarios) {
      g += card(h, left, 252, 566, 227)
        + reveal(h, t, setupAt, h.txt(left + 25, 290, `${requests} eligible pull requests`, 25, ink, 700))
        + h.rect(left + 24, 310, 518, 67, lightGreen, 7)
        + h.rect(left + 24, 390, 518, 67, lightAmber, 7)
        + reveal(h, t, at, h.txt(left + 43, 352, meets, 24, green, 700)
          + right(h, left + 522, 352, 'Meets', 19, green))
        + reveal(h, t, at + .25, h.txt(left + 43, 432, misses, 24, amber, 700)
          + right(h, left + 522, 432, 'Misses', 19, amber));
    }
    g += reveal(h, t, takeawayAt, h.txt(85, 519, 'Use the actual number of eligible pull requests.', 23, ink, 700));
    return g;
  }

  const panels = {
    'L01/score': [modelBenchmark, [[.10,/a passes seven of eight/i],[.20,/b passes eight of eight/i],[.54,/choose b for the pilot/i]]],
    'L02/access': [permissionMatrix, [[.10,/assistant may read/i],[.25,/author inspects/i],[.44,/different authorized teammate/i],[.64,/same identity/i]]],
    'L03/flow': [waitTimeline, [[.07,/marked it ready/i],[.24,/seven hours on monday/i],[.31,/five on tuesday/i],[.38,/twelve in all/i],[.50,/eighteen business hours/i]]],
    'L04/time': [reviewTime, [[.09,/eighteen minus thirteen/i],[.24,/fourteen-hour target/i],[.35,/twenty-six minus twenty-four/i],[.50,/twenty-seven minute limit/i]]],
    'L04/quality': [reviewQuality, [[.11,/six divided by forty/i],[.27,/seven divided by forty/i],[.42,/percentage points above/i],[.63,/defect count is one/i]]],
    'L04/cost': [spend, [[.09,/allocated licenses/i],[.16,/twenty for approved/i],[.23,/twenty for enablement/i],[.36,/gives two hundred and forty/i],[.49,/six dollars per request/i]]],
    'L05/outcomes': [scorecard, [[.08,/thirteen business hours/i],[.17,/twenty-six minutes/i],[.26,/forty dollars against/i],[.43,/seven of forty/i],[.62,/zero serious data/i]]],
    'L05/adjust': [denominator, [[.08,/next four weeks/i],[.38,/at forty requests/i],[.54,/thirty requests qualify/i],[.70,/actual denominator/i]]]
  };

  const panelFor = s => panels[`${s.episodeId}/${s.id}`];

  function beats(s) {
    const panel = panelFor(s);
    if (!panel) return [];
    let previous = 0;
    return panel[1].map(([fraction, cue]) => {
      const match = (s.cues || []).find(item => Number.isFinite(item.start) && cue.test(item.text || ''));
      const at = Math.min(s.sec - .85, Math.max(previous + .3, match?.start ?? s.sec * fraction));
      previous = at;
      return at;
    });
  }

  function draw(s, t, helpers) {
    const panel = panelFor(s);
    return panel ? panel[0](helpers, t, beats(s)) : '';
  }

  return {draw, beats};
});
