/* Deterministic lesson demonstrations shared by all renderers. */
(function (root, create) {
  const inserts = create();
  if (typeof module === 'object' && module.exports) module.exports = inserts;
  else root.WorkshopFoundations = inserts;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  const mono = 'DejaVu Sans Mono,monospace';
  const palette = {
    shell: '#152421', chrome: '#203633', board: '#0e1e1c', edge: '#31504b',
    normal: '#f3f5ea', quiet: '#a6c0bc', mint: '#a6efc8', blue: '#adcfff',
    yellow: '#efd295', rose: '#f4a4a3', violet: '#cdbaf3',
  };

  function frame(h, name) {
    const {rect, circle, label, txt, line} = h;
    return rect(41,181,1200,382,'#101b1b',14)
      + rect(38,177,1204,386,palette.shell,14)
      + rect(38,177,1204,52,palette.chrome,14)
      + rect(38,204,1204,25,palette.chrome)
      + line(38,229,1242,229,palette.edge)
      + circle(64,203,5,palette.mint)
      + txt(83,210,name,19,palette.normal,700)
      + label(1067,208,'DEMONSTRATION',palette.quiet);
  }

  function caption(h, x, y, w, content, color=palette.mint) {
    const {rect, txt} = h;
    return rect(x,y,w,37,palette.board,7,'stroke="#345451"')
      + txt(x+14,y+24,content,16,color,600);
  }

  function edge(h, x, y, X, Y, progress, tone=palette.mint) {
    const {line, circle} = h;
    const p = h.clamp(progress);
    return line(x,y,X,Y,palette.edge,2)
      + line(x,y,x+(X-x)*p,y+(Y-y)*p,tone,2)
      + (p>0 && p<1 ? circle(x+(X-x)*p,y+(Y-y)*p,5,tone) : '');
  }

  function tokens(s,t,h) {
    const {rect, txt, label, transform, ease, line, circle} = h;
    const parts = [
      {text:'return', color:palette.mint, x:92, w:232},
      {text:' quantity', color:palette.blue, x:343, w:300},
      {text:' >', color:palette.yellow, x:662, w:192},
      {text:' 0', color:palette.violet, x:873, w:156},
    ];
    const at = s.resultAt;
    let view = frame(h,'Text enters as tokens');
    view += rect(70,252,1142,66,palette.board,10)
      + label(90,276,'SOURCE EXPRESSION',palette.quiet)
      + txt(90,304,'return quantity > 0',24,palette.normal,700,mono);
    view += line(106,337,1174,337,palette.edge,1)
      + label(92,364,'ILLUSTRATIVE SPLIT',palette.quiet);
    parts.forEach((part,i) => {
      const p = ease((t-at*(.20+i*.14))/.68);
      const marker = 94 + i*77;
      view += edge(h,marker,317,part.x+part.w*.5,378,p,part.color);
      view += transform(0,-18*(1-p),rect(part.x,380,part.w,77,palette.board,9,`stroke="${part.color}" stroke-width="2"`)
        + circle(part.x+23,401,4,part.color)
        + txt(part.x+part.w*.5,430,part.text,29,part.color,700,mono,'text-anchor="middle"'),p);
    });
    const p = ease((t-at)/.55);
    view += transform(0,10*(1-p),caption(h,90,489,1093,'A tokenizer can split the same expression differently.'),p);
    return view;
  }

  function contextWindow(s,t,h) {
    const {rect, txt, label, transform, ease, line, circle} = h;
    const items = [
      ['Request',palette.mint,181], ['Instructions',palette.blue,164],
      ['Relevant source',palette.yellow,205], ['Recent messages',palette.violet,169],
      ['Tool result',palette.rose,143],
    ];
    let view = frame(h,'What fits in a model request');
    view += label(76,278,'AVAILABLE INPUTS',palette.quiet)+label(634,278,'CONTEXT WINDOW',palette.quiet);
    view += rect(617,290,575,206,palette.board,10,'stroke="#52736b" stroke-width="2"')
      + txt(637,323,'Input for this turn',22,palette.normal,700);
    const at = s.resultAt;
    let filled = 0;
    items.forEach(([name,color,capacity],i) => {
      const y = 294+i*41;
      const p = ease((t-at*(.14+i*.13))/.7);
      view += rect(76,y,271,32,palette.board,5)+circle(92,y+16,4,color)
        + txt(107,y+22,name,17,palette.normal,600);
      view += edge(h,348,y+16,616,361,p,color);
      const actual = capacity*.49;
      view += rect(638+filled,345,actual*p,34,color,4);
      filled += actual+5;
    });
    view += line(638,406,1167,406,palette.edge,1)
      + txt(638,440,'The client selects what to send.',20,palette.normal,600)
      + txt(638,467,'The available space varies by model and product.',16,palette.quiet);
    const p = ease((t-at+.1)/.52);
    view += transform(0,12*(1-p),caption(h,76,508,1116,'Use the smallest set of sources that lets someone verify the answer.'),p);
    return view;
  }

  function modelLayers(s,t,h) {
    const {rect, txt, label, transform, ease, line, circle} = h;
    const stages = [
      {x:75, title:'MODEL MAKER', value:'Anthropic', clue:'Publishes Claude models', tone:palette.yellow},
      {x:457, title:'OFFERING / PLATFORM', value:'GitHub Copilot', clue:'Offers selected models', tone:palette.mint},
      {x:839, title:'WORKPLACE CLIENT', value:'VS Code', clue:'Shows eligible choices', tone:palette.blue},
    ];
    const at = s.resultAt;
    let view = frame(h,'Find the model you can actually select');
    stages.forEach((item,i) => {
      const appear = ease((t-at*(.15+i*.22))/.65);
      if(i) view += edge(h,item.x-42,359,item.x,359,appear,item.tone);
      view += transform(0,16*(1-appear),rect(item.x,275,340,168,palette.board,10,'stroke="#345451"')
        + rect(item.x+14,294,42,32,item.tone,6)
        + txt(item.x+35,317,String(i+1),20,palette.board,700,mono,'text-anchor="middle"')
        + label(item.x+71,314,item.title,item.tone)
        + txt(item.x+19,365,item.value,32,palette.normal,700)
        + txt(item.x+19,406,item.clue,17,palette.quiet),appear);
    });
    const p = ease((t-at)/.55);
    view += line(75,473,1180,473,palette.edge)+circle(82,504,5,palette.blue)
      + transform(0,8*(1-p),txt(100,511,'Open the model picker and record the exact label available to your account.',20,palette.normal,600),p);
    return view;
  }

  function retrieval(s,t,h) {
    const {rect, txt, label, transform, ease, line, circle} = h;
    const at = s.resultAt;
    const query = {x:293,y:383};
    const notes = [
      {x:415,y:352,label:'Order acceptance rules',tone:palette.mint},
      {x:112,y:470,label:'UI colors',tone:palette.violet},
      {x:549,y:455,label:'Release dates',tone:palette.blue},
    ];
    let view = frame(h,'Find the training note that can answer the question');
    view += rect(66,250,671,289,palette.board,11)
      + label(87,279,'VECTOR SIMILARITY · ILLUSTRATIVE',palette.quiet)
      + line(92,484,702,484,palette.edge,1)+line(92,484,92,300,palette.edge,1);
    for (let x=130;x<700;x+=42) view += line(x,308,x,483,palette.edge,.55,'opacity=".5"');
    for (let y=312;y<482;y+=34) view += line(92,y,700,y,palette.edge,.55,'opacity=".5"');
    const queryIn = ease((t-at*.15)/.55);
    view += transform(0,8*(1-queryIn),circle(query.x,query.y,8,palette.yellow)
      + txt(224,416,'Zero-item order',18,palette.yellow,700),queryIn);
    notes.forEach((note,i)=>{
      const appear=ease((t-at*(.28+i*.12))/.60);
      const connection=ease((t-at*(.71+i*.035))/.56);
      view += edge(h,query.x,query.y,note.x,note.y,connection,note.tone);
      view += transform(0,-10*(1-appear),circle(note.x,note.y,7,note.tone)
        + txt(note.x+12,note.y-7,note.label,16,note.tone,600),appear);
    });
    view += rect(764,250,449,289,palette.board,11)+label(786,279,'RANKED RESULTS',palette.quiet);
    notes.forEach((note,i)=>{
      const y=300+i*52;
      const p=ease((t-at-i*.12)/.53);
      view += transform(8*(1-p),0,rect(787,y,403,44,i===0?palette.chrome:palette.board,6,`stroke="${i===0?palette.mint:palette.edge}"`)
        + txt(803,y+28,String(i+1),18,note.tone,700,mono)
        + txt(839,y+28,note.label,19,palette.normal,600),p);
    });
    const p = ease((t-at-.45)/.55);
    view += transform(0,8*(1-p),caption(h,787,474,403,'Open the source and verify the rule.'),p);
    return view;
  }

  function modelRecord(s,t,h) {
    const {rect, txt, label, transform, ease, line} = h;
    const labels = [['Maker','Anthropic'],['Model label','Claude Sonnet 5.5'],['Surface','Copilot Chat in VS Code'],['Verified on','26 Nov 2026 · example']];
    let view = frame(h,'A reusable model inventory entry');
    view += rect(71,252,551,273,palette.board,11)
      + label(97,284,'EXAMPLE WORKPLACE SELECTOR',palette.quiet)
      + rect(97,311,500,59,palette.chrome,7,'stroke="#507269"')
      + txt(120,348,'Claude Sonnet 5.5',22,palette.normal,700)
      + txt(557,348,'⌄',25,palette.mint,700)
      + txt(98,421,'Catalog listing and account access',18,palette.quiet)
      + txt(98,448,'are separate observations.',18,palette.quiet);
    view += rect(679,252,530,273,palette.board,11)
      + label(702,284,'DATED INVENTORY',palette.quiet);
    labels.forEach(([key,value],i) => {
      const p=ease((t-s.resultAt*(.30+i*.19))/.64);
      const y=322+i*47;
      view += line(702,y+13,1185,y+13,palette.edge)
        + transform(8*(1-p),0,txt(704,y,key,17,palette.quiet,700)
          + txt(885,y,value,19,palette.mint,700),p);
    });
    view += edge(h,623,341,677,341,ease((t-s.resultAt*.31)/.6),palette.blue);
    return view;
  }

  function validator(s,t,h,kind) {
    const {rect, txt, label, transform, ease, circle, line, clamp} = h;
    const fixed = kind==='fixed';
    const sourceOnly = kind==='trace';
    const comparison = fixed ? '> 0' : '>= 0';
    const tone = fixed ? palette.mint : sourceOnly ? palette.blue : palette.rose;
    const resultAt = s.resultAt;
    let view = frame(h,sourceOnly?'Follow the value through the function':'Run the boundary regression');
    view += rect(61,249,708,291,palette.board,10)
      + label(80,280,'ORDER_QUANTITY.PY',palette.quiet)
      + txt(81,315,'def is_valid_quantity(quantity: int) -> bool:',20,palette.blue,700,mono)
      + rect(82,331,664,44,palette.chrome,5)
      + txt(101,359,`return quantity ${comparison}`,24,palette.normal,700,mono);
    if (!sourceOnly) {
      const p = ease((t-resultAt*.38)/.62);
      view += transform(0,10*(1-p),label(81,409,'REGRESSION ASSERTION',palette.quiet)
        + txt(82,451,'self.assertFalse(is_valid_quantity(0))',23,palette.yellow,700,mono)
        + txt(82,489,'Expected for zero: False',19,palette.quiet,600)
        + txt(82,519,'python -B -m unittest discover -s tests -v',18,palette.mint,600,mono),p);
    } else {
      const p = ease((t-resultAt*.56)/.62);
      view += transform(0,12*(1-p),txt(83,432,'0 is equal to 0, so it passes.',23,palette.mint,600)
        + txt(83,478,'1 is greater than 0, so it passes.',23,palette.mint,600),p);
    }
    view += rect(790,249,429,291,palette.board,10)
      + label(811,280,sourceOnly?'EVALUATE THE EXPRESSION':'OBSERVED VALUES',palette.quiet);
    const values = sourceOnly ? [0,1] : [-1,0,1,5];
    values.forEach((value,i)=>{
      const y=305+i*45;
      const show = ease((t-resultAt*.55-i*.09)/.54);
      const actual = fixed ? value>0 : value>=0;
      const isCase = value===0;
      const resultVisible = ease((t-resultAt-i*.09)/.5);
      view += transform(10*(1-show),0,rect(814,y,378,37,isCase?palette.chrome:palette.board,6,`stroke="${isCase?tone:palette.edge}"`)
        + circle(834,y+18,4,isCase?tone:palette.quiet)
        + txt(851,y+25,String(value),21,palette.normal,700,mono),show);
      view += transform(0,6*(1-resultVisible),txt(1175,y+25,actual?'True':'False',20,isCase?tone:palette.quiet,700,mono,'text-anchor="end"'),resultVisible);
      if(isCase) view += edge(h,769,354,791,y+18,clamp((t-resultAt*.73)/.58),tone);
    });
    if (!sourceOnly) {
      const p = ease((t-resultAt-.45)/.54);
      view += transform(0,7*(1-p),txt(811,515,fixed?'PASS · 4 tests passed':'FAIL · expected False, got True',20,tone,700,mono),p);
    } else {
      const p = ease((t-resultAt-.44)/.52);
      view += transform(0,8*(1-p),label(812,447,'CURRENT BEHAVIOR',palette.mint)
        + txt(813,480,'Both inputs return True.',22,palette.normal,600),p);
    }
    view += line(790,292,1219,292,palette.edge);
    return view;
  }

  function candidateScore(s,t,h) {
    const {rect, txt, label, line, circle, transform, ease} = h;
    const rows = [
      ['Cause: equality admits zero','Found','Found'],
      ['Signature preserved','Yes','Yes'],
      ['Zero regression proposed','Yes','Yes'],
      ['Unrelated refactor','None','Added'],
      ['Example response time','6 s','15 s'],
    ];
    let view=frame(h,'Compare the outputs against the same issue');
    view+=rect(68,251,1143,281,palette.board,10)
      + label(91,286,'OBSERVABLE CRITERION',palette.quiet)
      + label(637,286,'CANDIDATE A',palette.mint)+label(918,286,'CANDIDATE B',palette.blue)
      + line(90,300,1190,300,palette.edge,1);
    rows.forEach(([criterion,a,b],i)=>{
      const y=310+i*42, p=ease((t-s.resultAt*(.26+i*.17))/.55);
      view+=rect(88,y,1102,37,i===3?palette.chrome:palette.board,5)
        + circle(105,y+18,3,i===3?palette.yellow:palette.quiet)
        + txt(121,y+24,criterion,18,palette.normal,600)
        + transform(12*(1-p),0,txt(639,y+24,a,19,palette.mint,700,mono)
          + txt(919,y+24,b,19,i===3?palette.rose:palette.blue,700,mono),p);
    });
    return view;
  }

  function timeline(s,t,h,name,steps,final) {
    const {rect, txt, label, transform, ease, line, circle, blocks} = h;
    let view=frame(h,name);
    const w=(1113-(steps.length-1)*27)/steps.length;
    steps.forEach(([kind,detail,proof,tone],i)=>{
      const x=81+i*(w+27), y=288;
      const p=ease((t-s.resultAt*(.13+i*.22))/.63);
      if(i) view+=edge(h,x-27,y+68,x,y+68,p,tone);
      view+=rect(x,y,w,176,palette.board,9,'stroke="#345451"')
        + transform(0,15*(1-p),rect(x+15,y+17,26,24,tone,5)
          + txt(x+28,y+34,String(i+1),14,palette.board,700,mono,'text-anchor="middle"')
          + label(x+53,y+34,kind,tone)
          + blocks(detail,x+16,y+69,w-32,55,19,palette.normal,700)
          + line(x+16,y+121,x+w-16,y+121,palette.edge)
          + blocks(proof,x+16,y+143,w-32,38,15,palette.quiet),p);
    });
    const p=ease((t-s.resultAt)/.56);
    view+=transform(0,8*(1-p),caption(h,82,489,1112,final),p);
    return view;
  }

  function promptRepair(s,t,h) {
    const {rect, txt, label, transform, ease, line, circle} = h;
    const at=s.resultAt;
    let view=frame(h,'Revise the proposed plan using a concrete requirement');
    view+=rect(67,251,1145,283,palette.board,11)
      + label(91,283,'COPILOT PLAN',palette.quiet)
      + label(681,283,'ISSUE CONSTRAINT',palette.quiet)
      + line(663,277,663,515,palette.edge);
    const miss=ease((t-at*.22)/.56);
    view+=transform(0,8*(1-miss),rect(91,302,547,67,'#38292e',7)
      + txt(110,329,'Propose a new public parameter',20,palette.rose,700)
      + txt(109,353,'Does not match the task scope',16,palette.quiet),miss);
    const cue=ease((t-at*.48)/.54);
    view+=transform(0,8*(1-cue),rect(682,302,505,67,palette.chrome,7)
      + txt(698,329,'Preserve the existing signature',20,palette.mint,700)
      + txt(698,353,'Ask for one comparison and one test',16,palette.quiet),cue);
    view+=edge(h,640,335,682,335,cue,palette.yellow);
    const revised=ease((t-at)/.62);
    view+=transform(0,10*(1-revised),circle(100,415,5,palette.mint)
      + label(117,419,'REVISED PROPOSAL',palette.mint)
      + txt(117,453,'Change >= 0 to > 0, add one test for zero',23,palette.normal,700,mono)
      + txt(117,488,'The public signature stays the same.',17,palette.quiet),revised);
    return view;
  }

  function attachmentFlow(s,t,h) {
    const {rect, txt, label, transform, ease, line, circle} = h;
    const files=[['Issue #17','Expected behavior',palette.yellow],['order_quantity.py','Actual condition',palette.mint],['tests/test_order_quantity.py','Existing coverage',palette.blue]];
    const at=s.resultAt;
    let view=frame(h,'Assemble the context for one Copilot request');
    view+=rect(67,252,416,282,palette.board,11)+rect(716,252,496,282,palette.board,11)
      + label(87,283,'TRAINING CHECKOUT',palette.quiet)+label(737,283,'CHAT ATTACHMENTS',palette.quiet);
    files.forEach(([name,source,tone],i)=>{
      const y=305+65*i,appear=ease((t-at*(.19+i*.21))/.68);
      view+=rect(87,y,377,51,palette.chrome,6)+circle(105,y+22,4,tone)
        + txt(120,y+23,name,16,palette.normal,600,mono)+txt(120,y+43,source,14,palette.quiet);
      view+=edge(h,485,y+24,716,y+24,appear,tone);
      view+=transform(-16*(1-appear),0,rect(737,y,441,45,palette.chrome,6,`stroke="${tone}"`)
        + txt(756,y+28,name,18,tone,700,mono),appear);
    });
    const p=ease((t-at)/.5);
    view+=transform(0,8*(1-p),txt(737,517,'Ready: 3 current references',17,palette.mint,700),p);
    return view;
  }

  function discardHunk(s,t,h) {
    const {rect, txt, label, transform, ease, line, circle} = h;
    const at=s.resultAt, done=ease((t-at)/.67);
    let view=frame(h,'Undo only the change you have inspected');
    view+=rect(66,250,381,286,palette.board,11)+label(87,283,'SOURCE CONTROL',palette.quiet)
      + rect(468,250,746,286,palette.board,11)+label(492,283,'SELECTED DIFF · NOTES.MD',palette.quiet);
    const files=['order_quantity.py','tests/test_order_quantity.py','notes.md (example)'];
    files.forEach((file,i)=>{
      const y=299+i*61,p=i===2?1-done:1;
      view+=transform(-13*(1-p),0,rect(86,y,340,50,i===2?'#38292e':palette.chrome,7)
        + circle(103,y+22,4,i===2?palette.rose:palette.mint)
        + txt(116,y+30,file,16,palette.normal,600,mono),p);
    });
    const check=ease((t-at*.45)/.57);
    view+=transform(0,8*(1-check),rect(492,303,695,51,'#38292e',7)
      + txt(511,335,'+ Unrelated note from the agent',20,palette.rose,700,mono),check*(1-done));
    view+=line(492,375,1187,375,palette.edge);
    view+=transform(0,8*(1-done),txt(507,420,'Two intended changes remain',25,palette.mint,700)
      + txt(507,453,'Open their diffs and rerun the regression.',18,palette.quiet),done);
    return view;
  }

  function checks(s,t,h) {
    const {rect, txt, label, transform, ease, line, circle} = h;
    const at=s.resultAt;
    let view=frame(h,'Check the result for the revision you are reviewing');
    view+=rect(67,251,1145,281,palette.board,11)+label(91,283,'AUTHORIZED REVIEWER TERMINAL',palette.blue)
      + rect(90,302,1097,48,palette.chrome,7)
      + txt(110,333,'gh pr checks 42 --required',23,palette.mint,700,mono);
    const check=ease((t-at*.41)/.53);
    view+=transform(0,9*(1-check),label(92,387,'HEAD REVISION',palette.quiet)
      + txt(92,420,'PR #42 · current head',23,palette.normal,700)
      + label(581,387,'REQUIRED CHECK',palette.quiet)
      + txt(581,420,'Unit tests',23,palette.normal,700),check);
    view+=edge(h,393,411,555,411,check,palette.blue);
    const p=ease((t-at)/.60);
    view+=transform(0,8*(1-p),rect(978,386,176,50,palette.chrome,7,'stroke="#a6efc8"')
      + circle(1000,411,5,palette.mint)+txt(1015,419,'PASS',22,palette.mint,700,mono),p);
    view+=line(92,450,1186,450,palette.edge)
      + transform(0,8*(1-p),txt(92,486,'New head? Read the diff and checks again before reviewing.',19,palette.quiet,600),p);
    return view;
  }

  function checkpoint(s,t,h) {
    const {rect, txt, label, transform, ease} = h;
    const at=s.resultAt;
    let view=frame(h,'Let the test result determine the next handoff');
    const entries=[
      [329,'PASS · 4 tests','Attach output → author reviews the diff',palette.mint],
      [423,'FAIL · unexpected result','Return to the author → inspect and rerun',palette.rose],
    ];
    view+=rect(73,318,358,164,palette.board,10,'stroke="#345451"')
      + label(92,350,'CHECKPOINT',palette.quiet)+txt(92,390,'Rerun the same suite',24,palette.normal,700)
      + txt(92,433,'Use the approved runner.',16,palette.quiet);
    entries.forEach(([y,name,body,tone],i)=>{
      const p=ease((t-at*(i===0?.92:.42))/.62);
      view+=edge(h,431,399,668,y+33,p,tone);
      view+=transform(10*(1-p),0,rect(671,y,517,72,palette.board,8,`stroke="${tone}"`)
        + txt(689,y+29,name,20,tone,700)
        + txt(689,y+55,body,17,palette.quiet,600),p);
    });
    return view;
  }

  const inserts = {
    'B01:tokens':{view:tokens, phases:[.2,.34,.48,.62,1]},
    'B01:window':{view:contextWindow, phases:[.14,.27,.40,.53,.66,.99]},
    'B01:source':{view:(s,t,h)=>validator(s,t,h,'trace'), phases:[.55,.56,.73,1]},
    'B02:embeddings':{view:retrieval, phases:[.15,.28,.40,.52,.71,1]},
    'B03:layers':{view:modelLayers, phases:[.15,.37,.59,1]},
    'B03:record':{view:modelRecord, phases:[.30,.49,.68,.87]},
    'B04:criteria':{view:candidateScore, phases:[.26,.43,.60,.77,.94]},
    'B05:loop':{view:(s,t,h)=>timeline(s,t,h,'Trace feedback through a short agent run',[
      ['ISSUE','Read the requirement','Expected: reject zero.',palette.yellow],
      ['SOURCE','Read the validator','Observed: >= admits zero.',palette.mint],
      ['TESTS','Inspect existing coverage','Evidence: the zero case is missing.',palette.blue],
    ],'Stop after reporting the cause and the missing test.'), phases:[.13,.35,.57,1]},
    'B06:iterate':{view:promptRepair, phases:[.22,.48,1]},
    'B07:attach':{view:attachmentFlow, phases:[.19,.40,.61,1]},
    'B08:undo':{view:discardHunk, phases:[.45,1]},
    'M01:regression':{view:(s,t,h)=>validator(s,t,h,'red'), phases:[.38,.55,.73,1]},
    'M01:fix':{view:(s,t,h)=>validator(s,t,h,'fixed'), phases:[.38,.55,.73,1]},
    'M02:read-red':{view:(s,t,h)=>validator(s,t,h,'red'), phases:[.38,.55,.73,1]},
    'M02:fix-green':{view:(s,t,h)=>validator(s,t,h,'fixed'), phases:[.38,.55,.73,1]},
    'M03:checks':{view:checks, phases:[.41,1]},
    'M04:roles':{view:(s,t,h)=>timeline(s,t,h,'Place each kind of guidance where it belongs',[
      ['TASK PROMPT','Plan this issue','Filled template and current context',palette.blue],
      ['INSTRUCTIONS','Use the existing test suite','Versioned project convention',palette.mint],
      ['ENFORCEMENT','Run required checks','Access policy and CI decide what is allowed',palette.yellow],
    ],'A prompt gives a task. Required checks enforce a condition.'), phases:[.13,.35,.57,1]},
    'M05:invoke':{view:(s,t,h)=>timeline(s,t,h,'Load a reusable evidence procedure in Copilot',[
      ['DISCOVER','prepare-pr-evidence','The description identifies the use case.',palette.blue],
      ['INVOKE','/prepare-pr-evidence','The skill guides a defined procedure.',palette.mint],
      ['VERIFY','Read the draft','Check issue, diff and test output.',palette.yellow],
    ],'Result: zero is rejected and four tests passed in the supplied run.'), phases:[.13,.35,.57,1]},
    'M06:green':{view:checkpoint, phases:[.42,.92]},
  };

  const definition = s => inserts[`${s.episodeId}:${s.id}`];
  return {
    draw(s,t,h) { return definition(s)?.view(s,t,h) ?? ''; },
    beats(s) { return definition(s)?.phases.map(p=>p*s.resultAt) ?? []; },
  };
});
