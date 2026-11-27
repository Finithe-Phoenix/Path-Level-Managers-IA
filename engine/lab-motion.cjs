/* Deterministic instructional movement. The SVG is shared by all production engines. */
(function (root, build) {
  const lab = build();
  if (typeof module === 'object' && module.exports) module.exports = lab;
  else root.WorkshopLabMotion = lab;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  const mono = 'DejaVu Sans Mono,monospace';
  const face = 'Open Sans,DejaVu Sans,sans-serif';
  const colors = {
    B: ['#152e2d', '#9fefc3', '#f6c880', '#d7ece2'],
    M: ['#222b42', '#c2c6ff', '#ffad98', '#e5e5f0'],
    A: ['#30223c', '#e0b6ff', '#83dce2', '#eee2ef'],
    L: ['#2e302a', '#f4c786', '#74dbca', '#f0e7d4'],
  };
  const cream = '#f6f0df', ink = '#202e35', chalk = '#f7f7f1', muted = '#aebfcb';
  const thread = '#54676e', red = '#ffb2ab', green = '#a7edb4';
  const id = s => s.episodeId + '/' + s.id;
  const fixed = n => +n.toFixed(2);
  const bound = (n, a=0, b=1) => Math.max(a,Math.min(b,n));
  const smooth = n => { const v=bound(n); return v*v*(3-2*v); };
  const progress = (t, at, duration=.64) => smooth((t-at)/duration);
  const color = s => colors[(s.episodeId || 'B')[0]] || colors.B;
  const promptScenes = new Set(('B01/request B02/language B04/control B05/scope B06/vague B06/scope B06/output B07/baseline B07/inspect B07/followup M01/plan M04/discovery M05/invoke M06/scope A01/request A03/plan A06/generate A07/controls').split(' '));
  const editorialFiles = {
    'M02/red-test':'tests/test_order_quantity.py',
    'M04/prompt-template':'docs/prompts/plan-a-fix.md',
    'M04/instructions':'.github/copilot-instructions.md',
    'M05/create':'.github/skills/prepare-pr-evidence/SKILL.md',
    'M05/procedure':'.github/skills/prepare-pr-evidence/SKILL.md',
  };
  const boundary = {
    'M02/hypothesis':'before', 'M02/read-red':'red', 'M02/fix-green':'change',
    'M01/regression':'red', 'M01/fix':'fixed', 'B08/prove':'change',
    'M06/red':'red', 'A05/red':'red', 'A05/green':'fixed', 'B05/result':'red',
  };
  const firstCue = (s, exp, fallback, lo=0, hi=s.sec) => {
    const c=(s.cues||[]).find(c=>c.start>=lo && c.start<hi && exp.test(c.text.replace(/\s+/g,' ')));
    return c?c.start:fallback;
  };
  function roundedPanel(h,x,y,w,height,fill,r=12,outline) {
    const d=`M${x+r} ${y} H${x+w-r} Q${x+w} ${y} ${x+w} ${y+r} V${y+height-r} Q${x+w} ${y+height} ${x+w-r} ${y+height} H${x+r} Q${x} ${y+height} ${x} ${y+height-r} V${y+r} Q${x} ${y} ${x+r} ${y}Z`;
    return h.path(d,fill,outline||'none',outline?1.2:0);
  }
  function titleLine(h,str,x,y,max,px,fg,font=face,weight=650) {
    const size=Math.min(px,px*max/Math.max(1,h.width(str,px,font)*1.06));
    return h.txt(x,y,str,size,fg,weight,font);
  }
  function body(h,str,x,y,w,height,sz,fg,font=face,weight=500) {
    return h.blocks(str,x,y,w*.96,height,sz,fg,weight,font,1.27);
  }
  function pointer(h,x,y,tone,at) {
    const ring=at>.1 && at<.97 ? h.circle(x,y,4+15*at,'none',`stroke="${tone}" stroke-width="2" opacity="${fixed(1-at)}"`) : '';
    return ring+h.path(`M${x},${y} l16,6 -7,2 -2,8 Z`,tone,'#14252c',1.2);
  }
  function bracket(h,x,y,w,height,tone){
    const k=8;
    return h.path(`M${x+k} ${y}h-${k}v${k} M${x+w-k} ${y}h${k}v${k} M${x} ${y+height-k}v${k}h${k} M${x+w} ${y+height-k}v${k}h-${k}`,'none',tone,2);
  }
  function material(s,h,topLabel,mark){
    const [base,accent,warm]=color(s);
    const defs=`<defs><linearGradient id="lab-bed" x2=".95" y2="1"><stop stop-color="${base}"/><stop offset="1" stop-color="#101a24"/></linearGradient><linearGradient id="lab-metal" x2="0" y2="1"><stop stop-color="#536269"/><stop offset=".1" stop-color="#26323b"/><stop offset=".75" stop-color="#23313c"/><stop offset="1" stop-color="#111e29"/></linearGradient><linearGradient id="lab-paper" x2=".25" y2="1"><stop stop-color="#fff9e8"/><stop offset="1" stop-color="${color(s)[3]}"/></linearGradient></defs>`;
    let g=defs+roundedPanel(h,39,180,1202,381,'#080e14',14)+roundedPanel(h,38,177,1204,380,'url(#lab-bed)',14,'#596971');
    g+=h.path('M54 178 H1225 M49 553 H1230','none','#819197',.8);
    g+=h.path('M57 224 H1222','none','#53666d',1);
    for(const x of [54,1226])for(const y of [194,541]){
      g+=h.circle(x,y,3,'#0e161d')+h.line(x-1.6,y,x+1.6,y,'#748086',.7);
    }
    g+=h.path('M69 198 h5 v11 h-5z M78 194 h5 v15 h-5z M87 201 h5 v8 h-5z',accent);
    g+=titleLine(h,topLabel,108,210,810,19,chalk,face,700);
    g+=h.txt(1201,207,mark,12,warm,650,mono,'text-anchor="end" letter-spacing="1"');
    return g;
  }
  function command(s){return /^\s*(?:gh |git |python(?:3)?(?:\s|$)|pwd\b|claude --|opencode --|get_training_issue\()/m.test(s.code);}
  function semanticRows(s){
    return s.lines.map((text,i)=>({text,index:i})).filter(x=>x.text.trim());
  }
  function rowPlan(s,h,w,height,size,font=mono){
    const rows=semanticRows(s);
    let px=size,blocks;
    do{
      blocks=rows.map(r=>({...r,parts:h.wrap(r.text,px,w*.93,font)}));
      const count=blocks.reduce((n,r)=>n+r.parts.length,0);
      if(count*px*1.32+(rows.length-1)*5<=height||px<=13)break;
      px--;
    }while(px>=13);
    let offset=0;for(const r of blocks){r.offset=offset;r.height=r.parts.length*px*1.32;offset+=r.height+5;}
    return {rows:blocks,px};
  }
  function stageRows(s,t,h,x,y,w,height,options={}){
    const {font=mono,size=21,numbered=false,light=false,sealed=false,typed=true}=options;
    const accent=light?'#38645a':color(s)[1], fg=light?ink:chalk;
    const gutter=numbered?42:25;
    const layout=rowPlan(s,h,w-gutter-13,height,size,font);
    let g='';
    const visible=layout.rows.filter(r=>t>=s.events[r.index]);
    const active=visible.at(-1);
    for(const row of layout.rows){
      const at=s.events[row.index]??.4;
      const p=progress(t,at,typed?.82:.62);
      if(!p)continue;
      const xx=x+gutter, yy=y+row.offset;
      if(active===row){
        g+=h.path(`M${x} ${yy-layout.px+1} h${w} v${fixed(row.height+2)} H${x}Z`, light?'#d5ddcf':'#293a46');
        g+=h.line(x+2,yy-layout.px+2,x+2,yy-layout.px+row.height,accent,3.3);
      }
      if(numbered)g+=h.txt(x+10,yy,String(row.index+1).padStart(2,'0'),12,light?'#59645a':muted,550,mono);
      else g+=h.circle(x+12,yy-layout.px*.33,3.1,accent);
      let budget=Math.ceil(row.parts.reduce((n,p)=>n+p.length,0)*(typed?p:1));
      row.parts.forEach((part,j)=>{
        const printed=part.slice(0,Math.max(0,budget));budget-=part.length;
        let textInk=fg;
        if(sealed&&/^\+/.test(part))textInk='#b7efb9';
        if(sealed&&/^-/.test(part))textInk='#ffb1a3';
        if(printed)g+=h.transform(typed?0:8*(1-p),0,h.txt(xx,yy+j*layout.px*1.32,printed,layout.px,textInk,500,font),typed?1:p);
        if(typed&&printed&&printed.length<part.length){
          g+=h.line(xx+h.width(printed,layout.px,font)+2,yy+j*layout.px*1.32-layout.px*.82,xx+h.width(printed,layout.px,font)+2,yy+j*layout.px*1.32+2,accent,2);
        }
      });
    }
    return g;
  }
  // A receipt physically feeds up through a slot as the evidence becomes available.
  function printout(s,t,h,x,y,w,height,tag){
    const accent=color(s)[1], p=progress(t,s.resultAt,1.05);
    let g=roundedPanel(h,x,y,w,height,'#111c25',8,'#45555e');
    g+=h.label(x+18,y+27,tag,muted)+h.line(x+17,y+40,x+w-17,y+40,'#435461');
    const px=x+14, py=y+51, pw=w-28, ph=height-66;
    g+=roundedPanel(h,px,py,pw,ph,'#172730',5);
    if(p===0){
      const gx=px+pw/2,gy=py+ph*.48;
      g+=h.path(`M${gx-16} ${gy-4}h32v17h-32z M${gx-9} ${gy-4}v-11h17v11 M${gx-8} ${gy+12}v9h16v-9`,'none','#7b979d',1.4);
      return g;
    }
    const sheetH=Math.max(1,ph*p);
    g+=`<defs><clipPath id="receipt-feed"><path d="M${px},${py}h${pw}v${sheetH}h-${pw}Z"/></clipPath></defs>`;
    let paper=roundedPanel(h,px,py,pw,ph,'url(#lab-paper)',4);
    for(let i=10;i<pw-3;i+=12)paper+=h.circle(px+i,py+8,1.5,'#a4aaa0');
    const result=s.result||s.focus;
    const measured=h.fit(result,pw-47,ph-39,Math.min(24,ph*.22),face,1.26);
    const anchor=py+30+measured.size*.68;
    measured.lines.forEach((r,i)=>{paper+=h.txt(px+21,anchor+i*measured.step,r,measured.size,ink,620,face);});
    g+=h.group(paper,'clip-path="url(#receipt-feed)"');
    if(p<1)g+=h.line(px,py+sheetH,px+pw,py+sheetH,accent,2.4);
    return g;
  }
  function terminal(s,t,h){
    const isCommand=command(s),[base,accent]=color(s);
    let g=material(s,h,isCommand?'Terminal · approved workspace':'Inspection log',isCommand?'COMMAND / OUTPUT':'INPUT / OBSERVATION');
    g+=roundedPanel(h,62,243,695,296,'#101e28',8,'#455969');
    g+=h.circle(82,266,4,accent)+h.label(97,271,isCommand?'REMOTE SHELL':'INSPECT',accent);
    g+=h.line(81,286,739,286,'#354751');
    g+=stageRows(s,t,h,84,327,646,193,{size:23,font:mono});
    g+=printout(s,t,h,777,243,439,296,isCommand?'RUN OUTPUT':'OBSERVATION');
    const pulse=progress(t,s.resultAt-.62,.65);
    if(pulse>0&&pulse<1)g+=h.circle(744+43*pulse,363,4,accent);
    return g;
  }
  function editor(s,t,h){
    // Picker, original source-control undo and precise staged selection use their dedicated simulators.
    if(['B03/picker','B04/picker','B08/undo','B07/attach'].includes(id(s)))return '';
    const file=editorialFiles[id(s)];
    const dif=/^\s*-\s+return /m.test(s.code)&&/^\s*\+\s+return /m.test(s.code);
    const prompting=promptScenes.has(id(s));
    const [base,accent,warm]=color(s);
    const title=file?'Editor · '+file:dif?'Source control · compare changes':prompting?'Copilot · compose a request':'Working document';
    let g=material(s,h,title,file?'EDITABLE FILE':dif?'CODE DIFF':prompting?'PROMPT / RESPONSE':'INSPECT / VERIFY');
    g+=roundedPanel(h,62,243,689,296,file?'#172632':'#16232e',9,'#536670');
    const section=file?'FILE CONTENTS':dif?'PATCH':prompting?'MESSAGE DRAFT':'SOURCE MATERIAL';
    g+=h.path('M82 256 h14 l7 7 v15 h-21z M96 256v8h7','none',accent,1.5)+h.label(115,272,section,accent);
    g+=h.line(81,287,733,287,'#45565e');
    g+=stageRows(s,t,h,82,319,644,176,{size:22,font:file||dif?mono:face,numbered:file||dif,sealed:dif,typed:true});
    if(prompting){
      const at=Math.min(s.resultAt-.4,Math.max(s.events.at(-1)+.8,s.resultAt*.75));
      const dispatched=progress(t,at,.6);
      const buttonColor=dispatched>=1?'#526b66':accent;
      g+=roundedPanel(h,82,487,648,35,'#243440',7);
      g+=h.txt(100,510,dispatched>=1?'Sent':'Send message',15,dispatched>=1?chalk:muted,600,face);
      g+=roundedPanel(h,682,491,40,27,buttonColor,6)+h.path('M696 508l7 -8 6 8 M703 500v12','none','#192c39',2);
      if(t>=at-.65&&t<at+.65){
        const q=progress(t,at-.65,.66);g+=pointer(h,630+66*q,473+29*q,warm,q);
      }
    }else{
      g+=h.line(82,510,733,510,'#465a63')+h.txt(84,529,file?file.split('/').pop():dif?'Diff view':'Source excerpt',12,muted,500,mono);
    }
    g+=printout(s,t,h,768,243,448,296,prompting?'CHAT RESPONSE':file?'DOCUMENT STATE':dif?'OBSERVED CHANGE':'OBSERVATION');
    return g;
  }
  function record(s,t,h){
    if(command(s))return terminal(s,t,h);
    const [base,accent,warm,page]=color(s);
    let g=material(s,h,'Repository · evidence record','ISSUE / CHANGE');
    g+=roundedPanel(h,69,251,663,278,'#637178',5)+roundedPanel(h,64,247,663,278,'#a4aba8',5)+roundedPanel(h,59,243,663,278,'url(#lab-paper)',5);
    g+=h.path('M75 243h110l9 9H75z',warm)+h.label(82,278,'TRAINING CHECKOUT',ink);
    g+=h.line(82,293,702,293,'#a0aea6');
    g+=stageRows(s,t,h,79,327,622,171,{size:23,font:face,light:true,typed:false});
    g+=printout(s,t,h,753,243,457,284,'RECORD OUTCOME');
    return g;
  }
  function decision(s,t,h){
    if(command(s)&&!s.code.startsWith('Proposed:'))return terminal(s,t,h);
    const [base,accent,warm,page]=color(s);
    let g=material(s,h,'Decision bench','EVIDENCE / DECISION');
    g+=roundedPanel(h,62,242,672,296,'url(#lab-paper)',6);
    g+=h.label(86,274,'EVIDENCE IN VIEW',ink)+h.line(85,288,715,288,'#a0ada5');
    g+=stageRows(s,t,h,83,328,629,186,{size:22,font:face,light:true,typed:false});
    g+=printout(s,t,h,756,242,459,296,'RECORDED DECISION');
    return g;
  }
  function circuit(s,t,h){
    const [base,accent,warm]=color(s);
    let g=material(s,h,'Trace the flow','SIGNAL / OBSERVATION');
    const rows=semanticRows(s);
    g+=roundedPanel(h,61,243,692,293,'#13232c',9);
    const plan=rowPlan(s,h,570,205,22,face);
    const railX=96, startY=304;
    g+=h.label(88,272,'INPUT PATH',accent);
    if(rows.length>1)g+=h.line(railX,startY-4,railX,startY+plan.rows.at(-1).offset-3,'#566d75',2);
    for(const row of plan.rows){
      const baseY=startY+row.offset,at=s.events[row.index]||.45;
      const p=progress(t,at,.7);
      g+=h.circle(railX,baseY-5,9,'#14262f',`stroke="${p>.8?accent:'#52646b'}" stroke-width="2"`);
      if(!p)continue;
      g+=h.circle(railX,baseY-5,4,accent)+h.line(railX+10,baseY-5,123,baseY-5,accent,1.5);
      row.parts.forEach((line,i)=>{
        g+=h.transform(10*(1-p),0,h.txt(134,baseY+i*plan.px*1.32,line,plan.px,chalk,540,face),p);
      });
      if(row!==plan.rows[0]&&p<1){
        const last=plan.rows[plan.rows.indexOf(row)-1];
        g+=h.circle(railX,startY+last.offset+(row.offset-last.offset)*p-5,4,warm);
      }
    }
    g+=printout(s,t,h,776,243,438,293,'TRACE RESULT');
    return g;
  }
  function boundaryBench(s,t,h,mode){
    const [base,accent,warm]=color(s), evaluate=firstCue(s,/four (cases|tests)|rerun|run the same|now .* should pass/i,s.resultAt,1);
    const flip=mode==='change'?bound(firstCue(s,/greater than zero|after the (?:fix|change|edit)|one.line fix/i,s.resultAt*.40,0),1,s.resultAt-.72):0;
    const fixedNow=mode==='fixed'||(mode==='change'&&t>=flip+.32);
    const signal=fixedNow?green:mode==='before'?warm:red;
    const inputAt=firstCue(s,/zero|boundary|assert/i,.45,0,s.resultAt*.54);
    const depart=progress(t,inputAt,.94);
    const checkAt=mode==='change'?flip+.32:inputAt+1;
    let g=material(s,h,'Quantity validator · boundary probe','INPUT 0 / COMPARISON');
    g+=roundedPanel(h,62,242,709,296,'#101c27',9,'#475d64');
    g+=h.label(85,272,'CALLED WITH',muted)+h.txt(209,273,'is_valid_quantity(0)',20,chalk,600,mono);
    g+=h.line(84,290,746,290,'#40535f');
    const left=87,cy=377;
    // A printed circuit carries the integer into the comparison gate.
    g+=h.path('M96 403h62l22 -22h141l14 -14h54 M575 368h34l21 -21h89','none','#566b71',3);
    g+=h.path('M95 412h66l22 -22h148 M582 375h31l22 -21h83','none','#35454f',1.1);
    for(let x=102;x<346;x+=19)g+=h.line(x,444,x,448,'#61737a',1.1);
    const chipX=93+197*depart,chipY=384-19*depart;
    g+=h.path(`M${chipX} ${chipY-26}l12 -8h57v50l-11 7h-58z`,'#396266','#617c7e',1.1);
    g+=roundedPanel(h,chipX,chipY-27,59,48,'url(#lab-paper)',4);
    g+=h.txt(chipX+20,chipY+8,'0',30,ink,700,mono);
    const gx=384,gy=320,gw=177,gh=96;
    g+=h.path(`M${gx} ${gy}l13 -9h${gw}l-13 9z`,'#657783')
      +h.path(`M${gx+gw} ${gy}l13 -9v95l-13 10z`,'#324651')
      +roundedPanel(h,gx,gy,gw,gh,'url(#lab-metal)',7,'#86959c');
    for(let i=0;i<4;i++){
      g+=h.line(gx-8,gy+18+i*17,gx,gy+18+i*17,'#a7b6ba',3);
      g+=h.line(gx+gw+12,gy+13+i*17,gx+gw+19,gy+13+i*17,'#a7b6ba',3);
    }
    const symbol=fixedNow?'> 0':'>= 0';
    g+=h.txt(gx+gw/2,gy+62,symbol,37,chalk,700,mono,'text-anchor="middle"');
    if(mode==='change'&&t>=flip&&t<flip+.68){
      const q=progress(t,flip,.68);g+=h.line(gx+12,gy+11+(gh-22)*q,gx+gw-13,gy+11+(gh-22)*q,accent,1.8);
    }
    const state=progress(t,checkAt,.6);
    if(state>0){
      const yes=fixedNow?'False':'True';
      g+=roundedPanel(h,620,315,108,60,'#20333c',6,signal);
      g+=h.transform(0,5*(1-state),h.txt(674,355,yes,24,signal,700,mono,'text-anchor="middle"'),state);
    }
    g+=h.label(94,468,'ARGUMENT',muted)+h.label(407,468,'COMPARISON',muted)+h.txt(620,468,'Expected False',14,muted,550,mono);
    const cmd=s.lines.filter(line=>/^\s*(?:python|git)\s/.test(line)).join('   ·   ');
    g+=h.line(84,484,746,484,'#40535f');
    const bottom=cmd||((mode==='change'||mode==='fixed')?'is_valid_quantity(0)':'return quantity >= 0');
    g+=titleLine(h,bottom,87,515,645,16,accent,mono,550);
    g+=printout(s,t,h,792,242,425,296,mode==='before'?'PREDICTION':'RUN EVIDENCE');
    return g;
  }
  function attachments(s,t,h){
    const a=color(s)[1],fg='#263c3c',list=id(s)==='M04/context-run'?['Issue #17','order_quantity.py','tests/test_order_quantity.py']:['order_quantity.py','tests/test_order_quantity.py','Issue #17'];
    const from=[303,365,427],to=[331,381,431];
    let g=material(s,h,'Copilot · attach context','CHECKOUT / CURRENT REQUEST');
    g+=roundedPanel(h,62,243,485,292,'url(#lab-paper)',8);
    g+=h.label(85,273,'TRAINING CHECKOUT',fg);
    g+=roundedPanel(h,682,243,533,292,'#192a36',8,'#47616b');
    g+=h.label(704,273,'ATTACHED TO THIS REQUEST',a);
    list.forEach((name,i)=>{
      const at=s.events[Math.min(i,s.events.length-1)], p=progress(t,at,.92);
      const y=from[i],ey=to[i];
      g+=roundedPanel(h,81,y-10,443,40,i===0?'#e6e9da':'#e4e8da',5);
      g+=h.path(`M95 ${y-2} h11 l5 5v12h-16z`,'none',fg,1.5)
        +titleLine(h,name,123,y+17,378,20,fg,mono,600);
      g+=h.path(`M525 ${y+10}h34q16 0 32 ${(ey-y)*.5}t39 ${(ey-y)*.5}h52`,'none',p>0?'#72968e':'#3d5259',p>0?1.7:1);
      if(p>0&&p<1){
        const x=519+(699-519)*p, yy=y+11+(ey-y-4)*smooth(p);
        g+=h.circle(x,yy,9,a,'opacity=".20"')+h.circle(x,yy,4.5,a);
        if(p<.55)g+=pointer(h,485-12*p,y+6,a,p);
      }
      const q=progress(t,at+.64,.4);
      if(q>0)g+=h.transform(8*(1-q),0,
        h.path(`M705 ${ey-7}l3 3 7 -8`,'none',green,2)+titleLine(h,name,735,ey+1,450,20,chalk,mono,550),q);
    });
    g+=h.line(707,470,1193,470,'#425967');
    if(t>=s.resultAt)g+=body(h,s.result,707,497,467,35,16,chalk,face,550);
    return g;
  }
  function retrieval(s,t,h){
    const data=[];
    for(let i=0;i<s.lines.length;i++){
      const row=s.lines[i].match(/^\s*\d+\s+(\S+)\s+score\s+(0?\.\d+|1(?:\.0+)?)\s*$/);
      if(row)data.push({file:row[1],score:Number(row[2]),passage:(s.lines[i+1]||'').trim()});
    }
    if(data.length!==2)return '';
    const accent=color(s)[1],warm=color(s)[2];
    const at1=firstCue(s,/first candidate|order policy|order rule/i,.4,0,s.resultAt*.65);
    const at2=Math.max(at1+1,firstCue(s,/second candidate|delivery dates|shipping policy/i,s.resultAt*.66,.7));
    let g=material(s,h,'Retrieval · open the matching passage','RANKED CANDIDATES');
    const focus=progress(t,Math.max(.4,at1+.08),1.6), fieldW=344+802*(1-focus);
    g+=roundedPanel(h,62,241,fieldW,297,'#152331',9,'#4a5d6c');
    g+='<defs><clipPath id="semantic-field"><rect x="68" y="245" width="'+(fieldW-12)+'" height="286" rx="7"/></clipPath></defs>';
    let field=h.label(86,271,'SIMILARITY INDEX',muted);
    const cx=225+(1-focus)*267,cy=387;
    // Morph an unfocused scatter into the two document neighborhoods selected by this query.
    for(const r of [36,65,94]){
      const rx=r*(1+(1-focus)*1.7);
      field+='<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+(r*.68)+'" transform="rotate(-14 '+cx+' '+cy+')" fill="none" stroke="#465767" stroke-width="1"/>';
    }
    field+=h.line(cx-125,cy+33,cx+120,cy-33,'#525e6c',1)+h.line(cx-17,308,cx+19,469,'#525e6c',1);
    const dots=[[121,384],[157,344],[150,415],[197,449],[209,330],[264,414],[307,405],[323,364],[256,343],[187,389],[139,369],[200,352],[275,383],[234,443],[285,415],[168,413]];
    const projection=[];
    dots.forEach(([x,y],i)=>{
      const d=progress(t,.23+i*.049,1.18),ox=117+((i*139)%936),oy=309+((i*83)%149);
      const xx=ox*(1-d)+x*d,yy=oy*(1-d)+y*d;
      projection.push([xx,yy]);
      if(i%3 && !focus && i>0)field+=h.line(xx,yy,projection[i-1][0],projection[i-1][1],'#354a5d',1);
      field+=h.circle(xx,yy,2.7+(i%3)*.38,'#788396');
    });
    const query=progress(t,.1,1.2),qx=89+(cx-89)*query,qy=460+(cy-460)*query;
    field+=h.path('M'+(qx-7)+' '+qy+'l7 -7 7 7 -7 7z',warm);
    if(query>0&&query<1)field+=h.line(87,463,qx-5,qy+5,warm,1.5);
    const candidates=[[187,389,at1,accent],[307,405,at2,warm]];
    candidates.forEach(([x,y,at,c],i)=>{
      const q=progress(t,at+.6,.97);if(!q)return;
      field+=h.line(cx,cy,cx+(x-cx)*q,cy+(y-cy)*q,c,2.3)+h.circle(x,y,6,c);
      if(q<1)field+=h.circle(x,y,7+14*q,'none','stroke="'+c+'" opacity="'+(1-q)+'"');
    });
    field+=h.txt(84,488,'Can an order have quantity zero?',15,chalk,650,face)
      +h.txt(84,513,'Illustrative projection',13,muted,500,face);
    g+=h.group(field,'clip-path="url(#semantic-field)"');
    const sentenceAt=firstCue(s,/highlighted sentence|positive integer/i,at1+2);
    const handoffAt=firstCue(s,/keep the useful passage|feed it into/i,s.resultAt);
    data.forEach((r,i)=>{
      const at=i===0?at1:at2,q=progress(t,at,.96),reveal=progress(t,at+(i===0?.24:0),1.15);
      if(!reveal)return;
      const y=242+146*i,c=i===0?accent:warm;
      let ticket=roundedPanel(h,429,y,786,130,i===0?'url(#lab-paper)':'#d9dee0',8);
      ticket+=h.txt(449,y+35,String(i+1).padStart(2,'0'),18,'#687378',600,mono);
      const heading=r.file.split('@')[0],rev=r.file.split('@')[1]||'';
      ticket+=titleLine(h,heading,497,y+37,428,24,ink,mono,680)
        +h.txt(1036,y+35,'SIMILARITY',12,'#536568',650,mono);
      if(q>.78)ticket+=h.txt(1190,y+36,r.score.toFixed(2),23,ink,700,mono,'text-anchor="end"');
      ticket+=roundedPanel(h,497,y+54,685,7,'#bcc7c5',3)+roundedPanel(h,497,y+54,685*r.score*q,7,i===0?'#477f7a':'#89716b',3);
      if(i===0 && t>=sentenceAt){
        const light=progress(t,sentenceAt,.9);
        ticket+=h.path('M493 '+(y+70)+'h'+Math.max(.1,(h.width(r.passage,21,face)+19)*light)+'v27H493Z','#c9dcae');
      }
      ticket+=titleLine(h,r.passage,498,y+91,680,21,ink,face,600)+h.txt(499,y+114,'@'+rev,14,'#53686b',500,mono);
      if(i===0 && t>=handoffAt){
        const take=progress(t,handoffAt,.88);
        ticket+=h.transform(-11*(1-take),0,h.path('M1038 '+(y+108)+'h17m-7 -6l7 6 -7 6','none','#3e7066',1.7)+h.txt(1062,y+113,'To answer',15,'#3e7066',650,face),take);
      }
      g+=h.transform(0,(i===0?29:42)*(1-reveal),ticket,reveal);
    });
    return g;
  }
  function waitDials(s,t,h){
    const measures=s.lines.map(line=>line.match(/^(\w+):\s*(\d+)\s*(h|min)\s*→\s*(\d+)\s*(h|min)\s*\|\s*\w+\s*<=\s*(\d+)/));
    if(measures.length!==2||measures.some(m=>!m))return '';
    let g=material(s,h,'Pilot scorecard · time instruments','BASELINE / PILOT');
    const colors=['#638a86','#c97645'];
    measures.forEach((m,i)=>{
      const [_,name,before,unit,after,unit2,target]=m;
      const x=63+i*581,y=242,w=556;
      g+=roundedPanel(h,x,y,w,293,'url(#lab-paper)',8);
      g+=h.label(x+23,y+31,name.toUpperCase(),ink);
      const at=i?firstCue(s,/effort row|effort|active review/i,s.resultAt*.76,1):firstCue(s,/wait row|wait|eighteen/i,.38);
      const q=progress(t,at,1.02), r=progress(t,at+.84,1.04);
      const max=Math.ceil(Math.max(+before,+after,+target)*1.20/5)*5;
      const sx=x+93,sw=412,barY=y+111,extent=sw*Number(target)/max;
      const ticks=5;
      for(let j=0;j<=ticks;j++){
        const px=sx+j*sw/ticks;
        g+=h.line(px,y+71,px,y+186,'#b9c3b9',1);
        g+=h.txt(px,y+206,String(Math.round(j*max/ticks)),12,'#61706a',500,mono,'text-anchor="middle"');
      }
      g+=h.txt(x+22,barY+6,'Base',16,ink,620,face)+h.txt(x+22,barY+53,'Pilot',16,ink,620,face);
      const bx=sx+sw*(+before)/max*q, ax=sx+sw*(+after)/max*r;
      g+=roundedPanel(h,sx,barY-14,bx-sx,25,colors[0],4)+roundedPanel(h,sx,barY+33,ax-sx,25,colors[1],4);
      if(q>.7)g+=h.txt(bx-7,barY+5,before,15,'#fffceb',650,mono,'text-anchor="end"');
      if(r>.7)g+=h.txt(ax-7,barY+52,after,15,'#211f21',650,mono,'text-anchor="end"');
      g+=h.path(`M${sx+extent} ${y+64}v124`,'none','#775d40',1.8);
      g+=h.path(`M${sx+extent-4} ${y+64}l4 5 4 -5z`,'#775d40');
      g+=h.line(x+22,y+227,x+w-22,y+227,'#9eada6');
      g+=h.txt(x+22,y+262,`Target ≤ ${target} ${unit}`,20,ink,600,mono);
      if(r>.85)g+=h.txt(x+w-25,y+262,`${Number(after)>Number(before)?'+':'−'}${Math.abs(Number(after)-Number(before))} ${unit2}`,25,ink,700,mono,'text-anchor="end"');
    });
    return g;
  }
  function rework(s,t,h){
    const rows=s.lines.slice(0,2).map(line=>line.match(/(\d+)\s*÷\s*(\d+)\s*=\s*([\d.]+)%/));
    if(rows.length!==2||rows.some(m=>!m||+m[2]!==40))return '';
    let g=material(s,h,'Pilot quality · count every reviewed PR','REWORK / ELIGIBLE PRS');
    const colors=['#557d78','#ba6945'];
    rows.forEach((m,i)=>{
      const [_,n,total,percent]=m,x=62+i*582,y=242;
      const at=i?firstCue(s,/pilot|seven of|seven divided/i,s.resultAt*.60,1):.45;
      g+=roundedPanel(h,x,y,560,291,'url(#lab-paper)',8);
      g+=h.label(x+23,y+32,i?'PILOT':'BASELINE',ink);
      const q=progress(t,at,1.12);
      for(let k=0;k<40;k++){
        const xx=x+35+(k%10)*29, yy=y+85+Math.floor(k/10)*29;
        const v=progress(t,at+.034*k,.36);
        g+=h.circle(xx,yy,8.7,k<+n&&v>.48?colors[i]:'#c4ccbf');
        if(k<+n&&v>0&&v<1)g+=h.circle(xx,yy,10+6*v,'none',`stroke="${colors[i]}" opacity="${1-v}"`);
      }
      g+=h.line(x+325,y+62,x+325,y+195,'#acb8ae');
      g+=h.txt(x+345,y+114,`${n} / ${total}`,24,ink,620,mono)+h.txt(x+345,y+163,percent+'%',34,colors[i],700,mono);
      g+=h.line(x+23,y+213,x+535,y+213,'#a0aea5')+h.txt(x+24,y+250,'PRs requiring material revision',20,ink,600,face);
    });
    return g;
  }
  function cost(s,t,h){
    const pieces=[...s.lines[0].matchAll(/(Licenses|workspace|training)\s+\$(\d+)/gi)];
    const cap=s.lines[1]?.match(/Cap\s+\$(\d+)/i);
    if(pieces.length!==3||!cap)return '';
    const ceiling=+cap[1],total=pieces.reduce((n,p)=>n+Number(p[2]),0),shades=['#5f8986','#c18d50','#9f715f'];
    let g=material(s,h,'Pilot budget · allocate the spend','COST / CAP');
    g+=roundedPanel(h,62,242,1155,292,'url(#lab-paper)',9)+h.label(85,276,'SIMULATED BUDGET',ink);
    const barX=87,barW=1098, barY=368;
    g+=roundedPanel(h,barX,barY,barW,39,'#c8d2c6',5);
    let pos=barX;
    pieces.forEach((piece,i)=>{
      const at=firstCue(s,new RegExp(piece[1],'i'),.5+i*s.resultAt*.25);
      const q=progress(t,at,.88),w=Number(piece[2])*barW/ceiling,xx=88+i*366;
      g+=h.txt(xx,326,piece[1][0].toUpperCase()+piece[1].slice(1),22,ink,650,face)
        +h.txt(xx+254,327,'$'+piece[2],23,shades[i],700,mono,'text-anchor="end"');
      g+=h.line(xx,339,xx+252,339,'#b6c0b3',1);
      if(q>0)g+=roundedPanel(h,pos,barY,w*q,39,shades[i],3);
      if(q>0&&q<1)g+=h.circle(pos+w*q,barY+19,4,'#ffefbc');
      pos+=w;
    });
    g+=h.txt(barX,442,'$0',16,'#55655e',500,mono)+h.txt(barX+barW,442,'$'+ceiling+' cap',16,'#55655e',500,mono,'text-anchor="end"');
    if(t>=s.resultAt){
      const q=progress(t,s.resultAt,.55);
      g+=h.transform(0,6*(1-q),h.txt(88,502,'$'+total+' total',25,ink,700,mono)+h.txt(554,502,s.lines[2]||s.result,21,ink,600,face),q);
    }
    return g;
  }
  // Each reel advances on an actual spoken cue. Pausing any frame preserves the input, operation and evidence.
  const reels={
    'B02/tool':{title:'Trace a grounded answer',source:'Question about zero quantities',items:[
      ['Retrieve','Question → embedding','Find a related policy note.',/retrieve the most relevant|question about/i,'search'],
      ['Generate','Related note + question','Use the note to draft an answer.',/language model then|draft an answer/i,'text'],
      ['Verify','Answer → cited source','Open the citation and check whether the rule is current.',/final paragraph|trace it back/i,'link']]},
    'B03/layers':{title:'Inspect the label on a model picker',source:'A Claude model in Copilot',items:[
      ['Maker','Who makes the model?','Anthropic publishes the Claude model family.',/maker publishes|who makes/i,'chip'],
      ['Platform','Where is the model offered?','Identify the deployment or service that provides access.',/provider or platform|three questions/i,'link'],
      ['Client','Which tool are you using?','In this example, the model is selected in the Copilot workflow.',/client gives|approved picker/i,'window']]},
    'B06/iterate':{title:'Revise one part of a plan',source:'The first plan introduces a parameter.',items:[
      ['Inspect','A new parameter','Compare the proposal with the constraint in the issue.',/first plan|parameter/i,'search'],
      ['Correct','Preserve the signature','Ask for the original function signature to stay in place.',/preserve the existing signature/i,'gate'],
      ['Verify','Comparison + zero test','Open the revised plan and check both requested changes.',/updated plan|revise only/i,'test']]},
    'M03/exercise':{title:'Follow the evidence to the review decision',source:'Training pull request · two reviewer exercises',items:[
      ['Intent','Issue → acceptance criteria','Give the reviewer the issue and identify the behavior to verify.',/give each reviewer|swap author/i,'text'],
      ['Diff','Open the change','Check whether the code and its test address that behavior.',/check results|evidence is complete/i,'window'],
      ['Checks','Required results','In the second exercise, the test for the key input is missing.',/leave out the test|other, leave/i,'test'],
      ['Decision','Human reviewer','Explain what was verified or what the author needs to change.',/explain their|one sentence/i,'gate']]},
    'M05/missing-evidence':{title:'Rehearse a skill with incomplete input',source:'Skill input · issue and diff only',items:[
      ['Issue','Issue present','The issue gives the requested behavior.',/try again|test output missing/i,'text'],
      ['Diff','Diff present','The patch shows the proposed code change.',/read what the skill|verification/i,'window'],
      ['Gap','Test output missing','Mark verification as missing so the author can supply the observed output.',/visible gap|claims the tests/i,'gate']]},
    'A01/checkout':{title:'Read the identity of the checkout',source:'GCP workspace · synthetic training checkout',items:[
      ['Directory','pwd','/work/training-orders',/run p w d|in the terminal/i,'window'],
      ['Branch','git status --short --branch','## lab/a01  ·  no file entries',/status displays|lab branch/i,'link'],
      ['Revision','git rev-parse --short HEAD','27e4ab1',/short commit|twenty-seven/i,'chip']]},
    'A02/paths':{title:'Trace skill discovery from the repository root',source:'training-test-evidence / SKILL.md',items:[
      ['Claude Code','.claude/skills/','training-test-evidence/SKILL.md',/from the repository|dot claude/i,'window'],
      ['OpenCode','.opencode/skills/','training-test-evidence/SKILL.md',/dot opencode|base filename/i,'window'],
      ['Inspect','Loaded definition','Compare the file with the session discovery record and check precedence.',/compare the file contents|session reports/i,'search']]},
    'A03/scope':{title:'Route proposed edits against the issue scope',source:'Staged handoff · API call site',items:[
      ['Inspect','orders/api.py','The issue names an API caller and a behavior check.',/agent proposes|staged handoff/i,'window'],
      ['Hold','infra/deploy.yaml','The proposed deployment edit falls outside the task.',/pause on the deployment/i,'gate'],
      ['Revise','Keep the API call site','Exclude the deployment file and ask for a revised plan.',/tell the agent|revised plan/i,'link']]},
    'A04/purpose':{title:'Watch one read-only tool round trip',source:'GCP agent client · approved connection',items:[
      ['Connect','GCP agent client','The client connects to the approved MCP server.',/follow the arrows|client connects/i,'link'],
      ['Discover','MCP server','The server offers get_training_issue as a read-only tool.',/server offers|read-only/i,'chip'],
      ['Read','get_training_issue','The tool reads the synthetic training issue fixture.',/tool is called|synthetic issue/i,'text'],
      ['Return','Result → client','The server returns the training issue data to the session.',/sends a result back|check the contract/i,'link']]},
    'L02/prompt':{title:'Inspect an unexpected permission request',source:'Training repository · existing Python tests',items:[
      ['Request','Download a test dependency','Pause at the permission prompt and identify the proposed operation.',/permission prompt|assistant asks/i,'link'],
      ['Inspect','Python standard library','The repository already has what it needs to test the zero case.',/standard library|already has tests/i,'search'],
      ['Decide','Decline the network request','Use the existing test style. Inspect the diff for dependency edits.',/decline the network request/i,'gate']]},
    'L05/paths':{title:'Move from pilot evidence to a decision',source:'Three alternate scenarios · one decision per scenario',items:[
      ['Expand','All gates met','Extend the pilot to one comparable team and name its onboarding owner.',/follow.up meets|first,/i,'link'],
      ['Adjust','Correctable guardrail miss','Try a bounded change and retest it.',/second,|routine guardrail/i,'test'],
      ['Pause','Serious data or access incident','Pause the affected workflow and follow the existing incident process.',/third,|restricted data/i,'gate']]},
  };
  function markIcon(h,which,x,y,k,c){
    const diagrams={
      search:'M-19 -5 a13 13 0 1 0 26 0 a13 13 0 1 0 -26 0 M4 6l15 15',
      text:'M-14 -19h21l8 8v30h-29z M7 -19v9h8 M-8 -3h17 M-8 4h15 M-8 11h10',
      link:'M-15 4l-4 4a7 7 0 0 0 10 10l9 -9a7 7 0 0 0 0 -10 M13 -3l4 -4a7 7 0 0 0 -10 -10l-9 9a7 7 0 0 0 0 10 M-7 7l14 -14',
      chip:'M-15 -15h30v30h-30z M-8 -8h16v16h-16z M-7 -20v5 M3 -20v5 M13 -20v5 M-20 -7h5 M-20 3h5 M-20 12h5 M15 -7h5 M15 3h5 M15 12h5 M-7 15v5 M3 15v5 M13 15v5',
      gate:'M-19 10v-21h38v21 M-20 1h39 M-13 0l7 -8 M0 0l7 -8 M13 0l5 -6 M-13 14h7 M4 14h8',
      test:'M-9 -19h18 M-6 -19v15l-12 18q-2 4 3 4h30q5 0 3 -4l-12 -18v-15 M-12 8h24',
      window:'M-20 -15h40v30h-40z M-19 -8h38 M-12 -12h2 M-7 -12h2 M-12 -1l5 5 -5 5 M1 9h10',
    };
    return '<g transform="translate('+x+' '+y+') scale('+k+')">'+h.path(diagrams[which]||diagrams.text,'none',c,1.85)+'</g>';
  }
  function cueMarks(s,items){
    let prev=-1;
    return items.map((it,i)=>{
      const alternate=i===0?.42:Math.max(prev+.85,s.resultAt*i/items.length);
      const at=firstCue(s,it[3],alternate,Math.max(0,prev+.3));
      prev=Math.max(prev+.52,Math.min(s.sec-1,at));return prev;
    });
  }
  function reel(s,t,h,story){
    const [base,accent,warm]=color(s),n=story.items.length,at=cueMarks(s,story.items);
    const current=Math.max(0,at.filter(x=>t>=x).length-1), prev=Math.max(0,current-1);
    const q=progress(t,at[current],1.24);
    let g=material(s,h,story.title,'EVIDENCE TRANSPORT');
    g+=roundedPanel(h,61,242,1155,294,'#13212c',10,'#53656c')
      +h.path('M83 354 L150 318 H1127 L1194 354 V383 H83Z','#273843','#6b8184',1.3)
      +h.path('M84 354 H1192 V382H84Z','url(#lab-metal)','#798b8a',1);
    // Through-holes and the brass rail make the physical transport readable while the head moves.
    for(let i=100;i<1180;i+=16){g+=h.line(i,360,i+2,365,'#7d9092',.9);}
    g+=h.line(102,374,1175,374,'#bba679',2);
    const xs=story.items.map((_,i)=>162+i*(968/(n-1)));
    story.items.forEach((it,i)=>{
      const x=xs[i],seen=t>=at[i],c=seen?accent:'#71818a';
      g+=h.line(x,317,x,338,c,1.4)+h.circle(x,340,5,'#202f38','stroke="'+c+'" stroke-width="1.5"')
        +h.circle(x,290,25,seen?'#2f464e':'#20313d','stroke="'+c+'" stroke-width="1.4"')
        +markIcon(h,it[4],x,290,.68,c)
        +h.txt(x,260,it[0],17,seen?chalk:muted,650,face,'text-anchor="middle"');
    });
    const cx=xs[prev]+(xs[current]-xs[prev])*q;
    g+=h.path('M'+(cx-23)+' 347l8 -13h30l9 13v32h-47z','#ad9567','#ead6a6',1.3)
      +roundedPanel(h,cx-16,350,33,17,'#182a35',2,'#e1cb92')
      +h.line(cx-8,358,cx+8,358,accent,2.4);
    if(q>0&&q<1){g+=h.group(h.path('M'+cx+' 346L'+(cx-18)+' 300h36z',accent),'opacity=".12"');}
    g+=roundedPanel(h,81,399,1115,117,'url(#lab-paper)',6)+h.line(511,413,511,504,'#a7b7ad',1.2)
      +h.txt(102,425,story.source,14,'#516765',600,face);
    const card=story.items[current],opacity=t<at[0]?0:current===0?q:bound((q-.12)/.88);
    const content=titleLine(h,card[1],101,475,387,27,ink,mono,650)
      +body(h,card[2],535,455,628,53,23,ink,face,600);
    g+=h.transform(0,8*(1-opacity),content,opacity);
    return g;
  }
  function tokens(s,t,h){
    const accent=color(s)[1],warm=color(s)[2];
    let g=material(s,h,'Tokenization · split an input line','ILLUSTRATIVE TOKENIZER');
    g+=roundedPanel(h,62,242,1153,294,'#17252e',10,'#4f6567');
    const names=['return','quantity','>','0'],starts=[191,441,747,937],ws=[209,258,148,148];
    const parts=s.lines[0].replace(/^Text:\s*/,'');
    g+=h.label(91,274,'INPUT STRING',muted)+h.txt(90,317,parts,29,chalk,600,mono)+h.line(88,340,1187,340,'#526469',1);
    const cutAt=firstCue(s,/pieces of this text/,1.5), split=progress(t,cutAt,1.2);
    const spaceAt=firstCue(s,/space before/,s.sec*.30),opAt=firstCue(s,/operator is another/,s.sec*.48);
    names.forEach((nm,i)=>{
      const start=93+[0,107,263,299][i],y=370+(i%2?3:0);
      const d=progress(t,cutAt+i*.13,1.28);
      const x=start+(starts[i]-start)*d,yy=y+53*d;
      if(!d)return;
      g+=h.line(start+6,331,x+16,yy,'#74978b',1.2);
      g+=roundedPanel(h,x+3,yy+4,ws[i]*d+3,64,'#0a141c',6);
      g+=roundedPanel(h,x,yy,ws[i]*d+3,60,'url(#lab-paper)',5);
      const selected=i===1&&t>=spaceAt&&t<opAt||i===2&&t>=opAt;
      if(selected)g+=bracket(h,x-4,yy-4,ws[i]+8,68,warm);
      if(i>0 && d>.6)g+=h.path('M'+(x+14)+' '+(yy+32)+'v5h13v-5','none','#668375',1.7);
      const textX=x+(i?41:18);
      if(d>.55)g+=h.txt(textX,yy+40,nm,28,ink,650,mono);
    });
    if(split>.65)g+=h.txt(91,512,'Possible pieces for this tokenizer',16,muted,600,face);
    return g;
  }
  function readClocks(s,t,h){
    const [base,accent,warm]=color(s);
    let g=material(s,h,'Count business hours to the first review','PULL REQUEST TIMELINE');
    g+=roundedPanel(h,62,243,1153,292,'url(#lab-paper)',9);
    const left=116,w=982,days=[{name:'Monday',a:10,b:17,tag:'Ready · 10:00',c:'#428179'},{name:'Tuesday',a:9,b:14,tag:'First review · 14:00',c:'#ae754a'}];
    const at=[firstCue(s,/marked it ready|ten on/i,.6),firstCue(s,/two on tuesday/i,s.sec*.21)];
    days.forEach((d,i)=>{
      const x=left+i*(w/2+43),sw=443,y=335,step=sw/8;
      const q=progress(t,at[i],1.52);
      g+=h.txt(x,289,d.name,23,ink,700,face)+h.line(x,y,x+sw,y,'#b3bdaf',14);
      for(let j=0;j<=8;j++)g+=h.line(x+j*step,y-12,x+j*step,y+16,'#52655a',1)
        +(j%2===0?h.txt(x+j*step,y+43,String(9+j).padStart(2,'0')+':00',12,'#4e6560',540,mono,'text-anchor="middle"'):'');
      const a=x+(d.a-9)*step,b=x+(d.b-9)*step;
      if(q){g+=h.line(a,y,a+(b-a)*q,y,d.c,14)+h.circle(a+(b-a)*q,y,6,d.c)+h.txt(x,y+83,d.tag,21,ink,630,face);}
    });
    g+=h.line(90,442,1188,442,'#a6b5a7');
    const atSum=firstCue(s,/twelve in all|seven hours on monday/,s.sec*.49);
    if(t>=atSum)g+=h.txt(115,487,'7 h + 5 h = 12 h',30,'#305f57',680,mono);
    if(t>=firstCue(s,/baseline across/,s.sec*.63))g+=h.txt(658,486,'40-PR baseline median · 18 h',21,ink,620,face);
    return g;
  }
  const scorePairs={
    'B04/criteria':{name:'Compare the same prompt under two model settings',leg:['Example A','Example B'],rows:[
      ['Cause','Equality','Equality',/example a identifies|identifies equality/i],
      ['Scope','Focused zero test','Extra refactor',/example b also|extra refactor/i,true],
      ['Response time','6 seconds','15 seconds',/response times|look at the example/i]],footer:'Both identify the defect. Only A stays in scope.'},
    'L01/score':{name:'Release the pilot choice only after the gate clears',leg:['Model A','Model B'],rows:[
      ['Cases passed','7 of 8','8 of 8',/passes eight of eight|b passes/i],
      ['Median steering','2 min','3 min',/median steering time/i],
      ['Required gate','Below 8 of 8','Meets 8 of 8',/every case had to pass|agreed up front/i,true]],footer:'The pilot requires every case to pass. Choose B.'},
    'A07/compare':{name:'Track both runs through the evaluation gates',leg:['Run A','Run B'],rows:[
      ['Tests passed','4 tests','4 tests',/same result on the tests|scorecard from top/i],
      ['Outside-scope edits','0 edits','1 edit',/extra edit|stays inside the scope/i,true],
      ['Human redirects','1 redirect','2 redirects',/extra edit|failed gate/i],
      ['Reviewer time','4 min','7 min',/seven minutes|review effort/i]],footer:'A clears both required gates. B exceeds the agreed scope.'},
  };
  function comparator(s,t,h,story){
    const [base,accent,warm]=color(s),rows=story.rows,n=rows.length;
    let g=material(s,h,story.name,'SYNTHETIC RUN COMPARISON');
    const at=cueMarks(s,rows),current=Math.max(0,at.filter(x=>t>=x).length-1);
    const top=289,step=n===4?47:55;
    const q=progress(t,at[current],1.16),prev=Math.max(0,current-1);
    g+=roundedPanel(h,61,241,1155,296,'#19252f',9,'#485d67');
    const lane=(x,w)=>roundedPanel(h,x+3,252,w,241,'#0d1a23',5)+roundedPanel(h,x,250,w,240,'url(#lab-paper)',4);
    g+=lane(354,383)+lane(752,440);
    const x1=375,x2=777;
    g+=h.label(88,276,'MATCHED CRITERIA',muted)
      +h.label(x1,275,story.leg[0].toUpperCase(),ink)+h.label(x2,275,story.leg[1].toUpperCase(),ink);
    const headY=top+18+(prev+(current-prev)*q)*step;
    for(let i=0;i<n;i++){
      const entry=rows[i], y=top+step*i,show=progress(t,at[i],.89),active=i===current&&t>=at[i];
      g+=h.line(86,y,1184,y,'#919e95',.7);
      g+=h.txt(91,y+30,entry[0],19,active?chalk:muted,650,face);
      if(!show)continue;
      for(const [j,x] of [x1,x2].entries()){
        const tested=!!entry[4]||['Cause','Tests passed','Cases passed'].includes(entry[0]);
        const isMiss=tested&&((s.episodeId==='L01'&&j===0)||(s.episodeId!=='L01'&&entry[4]&&j===1));
        const fg=isMiss?'#893f36':tested?'#285e52':ink;
        const shift=(1-show)*13;
        g+=h.transform(0,shift,h.txt(x,y+32,entry[j+1],22,fg,650,mono),show);
        const sx=j===0?706:1161;
        g+=h.circle(sx,y+23,tested?8:3.5,isMiss?'#cc8c7c':tested?'#85ad9e':'#8a958c');
        if(isMiss)g+=h.path('M'+(sx-3)+' '+(y+20)+'l6 6m0 -6l-6 6','none','#663d33',1.5);
        else if(tested)g+=h.path('M'+(sx-4)+' '+(y+23)+'l3 3l5 -7','none','#254d43',1.5);
      }
    }
    if(t>=at[0]){
      g+=h.path('M316 '+(headY-14)+'h14l11 13 -11 13h-14z',warm,'#c8a77e',1)
        +h.line(333,headY,348,headY,'#abb591',1.5);
    }
    g+=roundedPanel(h,83,500,1108,25,'#25333d',4);
    if(t>=s.resultAt)g+=h.txt(97,518,story.footer,15,chalk,650,face);
    return g;
  }
  const featured = {'B01/tokens':tokens,'M04/context-run':attachments,'L03/flow':readClocks,'B07/attach':attachments,'A06/retrieve':retrieval,'L04/time':waitDials,'L04/quality':rework,'L04/cost':cost};
  function feature(s,t,h){
    const key=id(s);
    if(scorePairs[key])return comparator(s,t,h,scorePairs[key]);
    if(reels[key])return reel(s,t,h,reels[key]);
    if(boundary[key])return boundaryBench(s,t,h,boundary[key]);
    return featured[key]?featured[key](s,t,h):'';
  }
  function draw(s,t,h){
    const scenes={editor,terminal,github:record,decision,diagram:circuit};
    return scenes[s.kind]?.(s,t,h)||'';
  }
  function beats(s){
    const key=id(s);
    if(key==='A06/retrieve')return [.05,.6,1.2,1.8,...(s.cues||[]).filter(c=>/highlighted sentence|second candidate|keep the useful passage/i.test(c.text)).map(c=>c.start)];
    if(s.kind==='editor'&&promptScenes.has(key)){
      return [Math.max(0,Math.min(s.resultAt-.4,Math.max(s.events.at(-1)+.8,s.resultAt*.75))-.65)];
    }
    if(scorePairs[key])return cueMarks(s,scorePairs[key].rows);
    if(reels[key])return cueMarks(s,reels[key].items);
    if(boundary[key] || featured[key]){
      const cues=(s.cues||[]).filter(c=>/zero|greater than|after the fix|run the same|first candidate|second candidate|effort row|pilot|licenses|workspace|training|seven divided/i.test(c.text));
      return [.35,...cues.slice(0,5).map(c=>Math.max(0,c.start))];
    }
    return [];
  }
  return {draw,feature,beats};
});
