/* Seeded, seekable vector composition. All coordinates are in a 1280 × 720 design space.
 * This module has no dependency on Node or a browser; the three renderers share it. */
(function (root, makeStage) {
  const isNode=typeof module==='object'&&module.exports;
  const plugins=isNode
    ? [require('./manager-visuals.cjs'),require('./architecture.cjs'),require('./foundations.cjs'),require('./workbenches.cjs')]
    : [root.ManagerVisuals,root.WorkshopArchitecture,root.WorkshopFoundations,root.WorkshopWorkbenches];
  const stage = makeStage(plugins);
  if (typeof module === 'object' && module.exports) module.exports = stage;
  else root.WorkshopStage = stage;
})(typeof globalThis === 'object' ? globalThis : this, function (plugins) {
  const W = 1280, H = 720, FPS = 24;
  const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
  const ease = t => 1 - (1 - clamp(t)) ** 3;
  const n = v => Number(v.toFixed(2));
  const esc = s => String(s ?? '').replace(/[<>&"']/g, c => ({'<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&apos;'}[c]));
  const rect = (x,y,w,h,c,r=0,more='') => `<rect x="${n(x)}" y="${n(y)}" width="${n(Math.max(0,w))}" height="${n(Math.max(0,h))}" rx="${r}" fill="${c}" ${more}/>`;
  const line = (x,y,X,Y,c,width=1,more='') => `<path d="M${n(x)} ${n(y)} L${n(X)} ${n(Y)}" fill="none" stroke="${c}" stroke-width="${width}" ${more}/>`;
  const circle = (x,y,r,c,more='') => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${c}" ${more}/>`;
  const path = (d,c='none',stroke='none',w=1) => `<path d="${d}" fill="${c}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const group = (contents,options='') => `<g ${options}>${contents}</g>`;
  const transform = (x,y,contents,opacity=1) => group(contents,`transform="translate(${n(x)} ${n(y)})" opacity="${n(clamp(opacity))}"`);
  const face = 'Open Sans,DejaVu Sans,sans-serif', mono = 'DejaVu Sans Mono,monospace';
  const txt = (x,y,s,size,color,weight=400,font=face,more='') => `<text x="${n(x)}" y="${n(y)}" font-family="${font}" font-size="${n(size)}" font-weight="${weight}" fill="${color}" xml:space="preserve" ${more}>${esc(s)}</text>`;
  const label = (x,y,s,c) => txt(x,y,s,13,c,700,face,'letter-spacing="1.2"');
  const colors = {
    B: ['#c6f78b','#254b42','#9cf4d4','FOUNDATIONS'],
    M: ['#a7d7ff','#213857','#a9dfed','APPLIED ENGINEERING'],
    A: ['#ffc09b','#503344','#f4bcdd','ADVANCED ENGINEERING'],
    L: ['#f6d47c','#404b3a','#d3e49c','MANAGEMENT']
  };
  function width(s,size,f=face) {
    if(f===mono) return [...s].length*size*.606;
    return [...s].reduce((w,ch)=>w+('ilI|.,!\'\’:; '.includes(ch)?.34:'mwMW%@&'.includes(ch)?.92:/[A-Z0-9]/.test(ch)?.69:.57),0)*size;
  }
  function wrap(text,size,max,f=face) {
    const out=[];
    for(const original of String(text??'').split('\n')){
      if(!original){out.push('');continue;}
      let remaining=original; let indent='';
      while(width(remaining,size,f)>max){
        let end=1;
        while(end<remaining.length && width(remaining.slice(0,end+1),size,f)<=max) end++;
        const candidate=remaining.slice(0,end), sp=candidate.lastIndexOf(' ');
        if(sp>Math.floor(end*.42)) end=sp;
        out.push(remaining.slice(0,end).trimEnd());
        remaining=indent+remaining.slice(end).trimStart();
      }
      out.push(remaining);
    }
    return out;
  }
  function fit(text,maxW,maxH,startSize,f=face,lead=1.46) {
    let size=startSize,lines;
    for(;;size--){lines=wrap(text,size,maxW,f);if(lines.length*size*lead<=maxH||size<=10)break;}
    if(lines.length*size*lead>maxH) throw Error('Text exceeds visual capacity: '+text);
    return {lines,size,step:Math.round(size*lead)};
  }
  function blocks(str,x,y,maxW,maxH,size,col,weight=500,f=face,lead=1.32) {
    const layout=fit(str,maxW,maxH,size,f,lead);
    return layout.lines.map((s,i)=>txt(x,y+i*layout.step,s,layout.size,col,weight,f)).join('');
  }
  const rowColors=['#9ce0c6','#ebbd87','#b4c9ff','#dbb8f8','#ade1eb'];
  const themes={
    editor:{name:'Source workspace', tab:'Inspect source',icon:'editor',tone:'#bba5ff',paper:false},
    terminal:{name:'Terminal session',tab:'Run command',icon:'terminal',tone:'#90e4b6',paper:false},
    diagram:{name:'Process trace',tab:'Trace the flow',icon:'flow',tone:'#99d9e8',paper:true},
    decision:{name:'Decision record',tab:'Weigh evidence',icon:'decision',tone:'#f8c574',paper:true},
    github:{name:'Repository timeline',tab:'Inspect evidence',icon:'branch',tone:'#a8baff',paper:false}
  };
  function icon(type,x,y,c,scale=1){
    let d='';
    if(type==='terminal')d=path('M3 4 L11 12 L3 20 M13 20 H22','none',c,2.5);
    if(type==='editor')d=path('M7 4 L1 12 L7 20 M17 4 L23 12 L17 20 M15 2 L9 22','none',c,2);
    if(type==='branch')d=path('M6 4 V21 M6 15 C16 15 18 12 18 5','none',c,2)+circle(6,4,2.5,c)+circle(18,4,2.5,c)+circle(6,21,2.5,c);
    if(type==='flow')d=path('M2 12 H22','none',c,2)+rect(0,8,7,8,c,2)+rect(9,8,7,8,c,2)+rect(18,8,6,8,c,2);
    if(type==='decision')d=path('M12 1 L23 12 L12 23 L1 12 Z','none',c,2)+path('M7 12 L10 15 L16 8','none',c,2);
    return group(d,`transform="translate(${x} ${y}) scale(${scale})"`);
  }
  function prepare(data) {
    let start=0;
    const scenes=data.scenes.map((s,i)=>{
      const durationFrames=s.durationFrames??Math.round(s.duration*FPS);
      if(!Number.isInteger(durationFrames)||durationFrames<1)throw Error('Missing scene duration: '+s.id);
      const kind=themes[s.kind]?s.kind:'editor';
      const lines=String(s.code||'').trimEnd().split('\n');
      const sec=durationFrames/FPS;
      // Reveal claims near the first narration cue sharing the result's distinctive words.
      const words=(s.result||'').toLowerCase().match(/[a-z0-9_]{4,}/g)||[];
      const cues=(s.cues||[]).filter(c=>Number.isFinite(c.start)&&c.start>sec*.37&&c.start<sec*.84);
      let resultAt=sec*.63,best=0;
      for(const c of cues){const lc=(c.text||'').toLowerCase();const score=new Set(words.filter(w=>lc.includes(w))).size;if(score>best){best=score;resultAt=c.start;}}
      resultAt=clamp(resultAt,sec*.46,sec*.78);
      // Align successive manipulations to narration when source tokens are mentioned.
      // The fallback spaces operations across the explanation, leaving room to read each item.
      const events=[.45];
      for(let j=1;j<lines.length;j++){
        const pct=j/Math.max(1,lines.length-1),ideal=.50+resultAt*.76*pct;
        const low=Math.max(events[j-1]+.40,ideal-resultAt*.18),high=Math.max(low,Math.min(resultAt*.89,ideal+resultAt*.11));
        const tokens=lines[j].toLowerCase().match(/[a-z0-9_]{3,}/g)||[];
        const nearby=(s.cues||[]).filter(c=>c.start>=low&&c.start<=high&&tokens.some(k=>String(c.text).toLowerCase().includes(k)));
        events.push(nearby.length?nearby[0].start:clamp(ideal,low,high));
      }
      const scene={...s,kind,lines,events,resultAt,sec,start,durationFrames,index:i,episodeId:data.id};
      start+=durationFrames;return scene;
    });
    return {...data,scenes,durationFrames:start,fps:FPS,theme:colors[(data.id||'B')[0]]||colors.B};
  }
  function logo(x,y,c) {
    return group(path('M0 20 L11 0 H17 L6 20 Z',c)+path('M13 20 L24 0 H30 L19 20 Z',c),`transform="translate(${x} ${y})"`);
  }
  function bg(ep,s,t) {
    const [ac,base]=ep.theme;
    let g=rect(0,0,W,H,'url(#ground)')+path('M870 0 L1280 0 L1280 430 Z',base);
    // Fine spatial grid and two contour paths give the working surface depth.
    for(let i=0;i<14;i++)g+=line(835+i*39,0,1180+i*39,340,'#d0e6d6',.65,'opacity=".08"');
    g+=logo(38,23,ac)+label(83,39,'AI FIELD LAB', '#f3f4e9')+line(210,22,210,43,'#69807a')+label(231,39,ep.theme[3],ac);
    const right=`${ep.id}   /   ${String(s.index+1).padStart(2,'0')} · ${String(ep.scenes.length).padStart(2,'0')}`;
    g+=txt(1241,40,right,16,'#f4f3e9',400,mono,'text-anchor="end"');
    g+=line(38,60,1241,60,'#566864',1);
    const titleSize=Math.min(43,1120/Math.max(1,width(s.title,1)));
    const arrival=ease(t/.44);
    g+=transform(0,2*(1-arrival),txt(40,118,s.title,titleSize,'#fbf8ed',700),.58+.42*arrival);
    g+=txt(40,151,ep.title,19,'#b6c9c7',400);
    return g;
  }
  function cursor(x,y,c,pulse){
    let g='';
    if(pulse>0&&pulse<1)g+=circle(x,y,6+pulse*23,'none',`stroke="${c}" stroke-width="2" opacity="${n(1-pulse)}"`);
    g+=path(`M${n(x)} ${n(y)} l3 21 5 -7 7 8 4 -4 -7 -7 8 -3 z`,c,'#162625',1.8);
    return g;
  }
  function inputDisplay(s,t,maxW,maxH,size,font=mono,lead=1.38){
    let layout;
    for(let use=size;use>=10;use--){
      const rows=s.lines.map((v,i)=>({parts:wrap(v,use,maxW,font),source:i}));
      const count=rows.reduce((a,r)=>a+r.parts.length,0);
      if(count*use*lead<=maxH){layout={rows,size:use,step:Math.round(use*lead),count};break;}
    }
    if(!layout)throw Error('Source does not fit in '+s.id);
    return layout;
  }
  function activeLine(s,t) {return Math.max(0,s.events.filter(at=>t>=at).length-1);}
  function codeColor(v,theme) {
    if(/^\s*[-][^-]/.test(v))return '#ffaeb0';
    if(/^\s*\+[^+]/.test(v))return '#a6ebba';
    if(/^\s*(?:def |class |return |if |assert |import |from |pytest|python|gh |git |\$)/.test(v))return theme;
    return '#edf0f6';
  }
  function sourceView(s,t,x,y,w,h,theme,mode){
    const layout=inputDisplay(s,t,w-81,h-11,22,mono,1.48);
    let g='',offset=0,point={x:x+20,y:y+10},active=activeLine(s,t);
    const dim=mode==='terminal'?'#85b5a1':'#92a4b7';
    for(const row of layout.rows){
      const reveal=ease((t-s.events[row.source])/.38),firstY=y+offset*layout.step;
      const rowH=row.parts.length*layout.step;
      if(row.source===active){g+=rect(x,firstY-21,w,Math.max(28,rowH+2),mode==='terminal'?'#233e35':'#30354a',5)+rect(x,firstY-20,3,Math.max(26,rowH),theme,1);}
      const gutter=mode==='terminal'?(row.source===0?'❯':'·'):String(row.source+1).padStart(2,'0');
      if(mode==='github')g+=circle(x+17,firstY-7,4,theme);
      else g+=txt(x+13,firstY,gutter,15,dim,400,mono);
      let inner='';for(const part of row.parts){inner+=txt(x+49,y+offset*layout.step,part,layout.size,codeColor(part,theme),400,mono);offset++;}
      g+=transform(8*(1-reveal),0,inner,reveal);
      if(row.source===active)point={x:x+w-32,y:firstY-13};
    }
    if(t>=s.events[0] && t<s.resultAt+.1) {
      const elapsed=t-s.events[active];let cy=point.y;
      if(active>0&&elapsed<.35)cy-=layout.step*(1-ease(elapsed/.35));
      g+=cursor(point.x,cy,theme,clamp(elapsed/.58));
    }
    return g;
  }
  function receipt(s,t,x,y,w,h,tone,paper=false) {
    const lift=ease((t-s.resultAt)/.56),base=paper?'#f4f3e7':'#202c34',fg=paper?'#132d2f':'#eff3e9';
    let g=rect(x,y,w,h,base,12);
    const labelText=s.kind==='terminal'?'TERMINAL OUTPUT':s.kind==='decision'?'RECORDED DECISION':'OBSERVED RESULT';
    const innerColor=paper?'#386361':tone;
    g+=icon(s.kind==='terminal'?'terminal':'decision',x+22,y+17,innerColor,.72)+label(x+50,y+32,labelText,innerColor);
    g+=line(x+22,y+49,x+w-22,y+49,paper?'#c6d0c8':'#43545a');
    if(t<s.resultAt){
      const ghost=paper?'#d8dfd6':'#314347';
      g+=rect(x+23,y+73,w*.61,6,ghost,3)+rect(x+23,y+92,w*.40,6,ghost,3);
    } else {
      const layout=fit(s.result||s.body,w-52,h-75,Math.min(24,h*.22),s.kind==='terminal'?mono:face,1.30);
      const font=s.kind==='terminal'?mono:face;
      let result='';
      layout.lines.forEach((r,j)=>{
        const p=ease((t-s.resultAt-j*.18)/.40);
        result+=transform(0,8*(1-p),txt(x+25,y+52+layout.size+j*layout.step,r,layout.size,fg,600,font),p);
      });
      g+=result+rect(x,y+12,4,(h-24)*lift,innerColor,2);
    }
    return g;
  }
  function windowFrame(s,t,x,y,w,h) {
    const theme=themes[s.kind],paper=theme.paper, ink=paper?'#243d40':'#dce1ed';
    let g=rect(x+4,y+7,w,h,'#0c1717',14)+rect(x,y,w,h,paper?'#e0e9e3':'#171f2c',14);
    g+=rect(x,y,w,55,paper?'#cddbd4':'#293143',14)+rect(x,y+35,w,20,paper?'#cddbd4':'#293143');
    g+=icon(theme.icon,x+21,y+17,paper?'#284648':theme.tone,.85)+txt(x+55,y+35,theme.name,21,ink,700);
    g+=txt(x+w-24,y+34,'SIMULATED WORKSPACE',12,paper?'#425e58':'#bcc7d1',700,face,'text-anchor="end" letter-spacing="1.2"');
    return g;
  }
  function darkWorkspace(s,t) {
    const x=38,y=177,w=1204,h=386,theme=themes[s.kind],tone=theme.tone;
    let g=windowFrame(s,t,x,y,w,h);
    if(s.kind==='terminal'){
      g+=rect(x+15,y+68,w-30,h-82,'#10211e',9);
      g+=label(x+32,y+99,'COMMAND BUFFER',tone)+line(x+32,y+114,x+712,y+114,'#35534b');
      g+=sourceView(s,t,x+31,y+151,703,h-165,tone,'terminal');
      g+=receipt(s,t,x+753,y+85,w-778,h-110,tone);
    }else if(s.kind==='github'){
      g+=line(x+49,y+135,x+49,y+h-34,'#3b4c69',2);
      g+=label(x+32,y+96,'REPOSITORY EVIDENCE',tone);
      g+=sourceView(s,t,x+32,y+139,685,h-155,tone,'github');
      g+=receipt(s,t,x+743,y+77,w-765,h-99,tone);
    }else{
      g+=rect(x+17,y+69,713,h-88,'#202637',9);
      g+=label(x+35,y+98,'SOURCE BUFFER',tone)+line(x+35,y+114,x+709,y+114,'#43485e');
      g+=sourceView(s,t,x+30,y+148,677,h-164,tone,'editor');
      g+=receipt(s,t,x+750,y+75,w-773,h-97,tone);
    }
    return g;
  }
  function diagram(s,t) {
    const x=38,y=177,w=1204,h=386;
    let g=windowFrame(s,t,x,y,w,h);
    // Route each source line as a graph node; arrows move along the edges.
    const rows=s.lines.filter(v=>v.trim()), count=rows.length;
    const columns=count<=4?Math.max(1,count):Math.min(4,Math.ceil(count/2));
    const rowCount=Math.ceil(count/columns),gap=24,left=x+24,top=y+75,areaWidth=w-48;
    const cw=(areaWidth-(columns-1)*gap)/columns;
    const ch=Math.min(91,173/rowCount-6);
    for(let i=0;i<count;i++){
      const col=i%columns,r=Math.floor(i/columns),xx=left+col*(cw+gap), yy=top+r*(ch+12);
      const sourceIndex=s.lines.indexOf(rows[i]),at=s.events[Math.max(0,sourceIndex)];
      const visible=ease((t-at)/.44),active=activeLine(s,t)===sourceIndex;
      if(col>0){
        g+=line(xx-gap,yy+ch/2,xx,yy+ch/2,'#68817d',2);
        const travel=clamp((t-at+.42)/.52);
        if(travel>0&&travel<1)g+=circle(xx-gap+gap*travel,yy+ch/2,4,'#006b72');
      }
      g+=rect(xx,yy,cw,ch,active?'#c3e2d5':'#f2f4e9',8,`stroke="${active?'#207273':'#baccc3'}" stroke-width="${active?2:1}"`);
      g+=circle(xx+17,yy+19,5,active?'#147978':'#849e95');
      let inner=blocks(rows[i],xx+30,yy+24,cw-44,ch-11,Math.min(21,ch*.35),'#203f40',600,face,1.18);
      g+=transform(7*(1-visible),0,inner,visible);
    }
    const bottom=top+rowCount*(ch+12);
    const outY=Math.max(bottom+4,y+193);
    g+=receipt(s,t,x+24,outY,w-48,y+h-outY-18,'#236164',true);
    return g;
  }
  function decision(s,t) {
    const x=38,y=177,w=1204,h=386;
    let g=windowFrame(s,t,x,y,w,h);
    const ax=x+20,ay=y+69,aw=685,ah=h-86;
    g+=rect(ax,ay,aw,ah,'#f5f0df',9)+label(ax+22,ay+30,'EVIDENCE REGISTER','#6a5941');
    const layout=inputDisplay(s,t,aw-90,ah-62,22,face,1.43);
    let offset=0;
    for(const row of layout.rows){
      const base=ay+63+offset*layout.step,p=ease((t-s.events[row.source])/.46),current=activeLine(s,t)===row.source;
      g+=line(ax+20,base-24,ax+aw-20,base-24,'#d6ceba');
      const sz=9,mx=ax+32,my=base-9;
      g+=rect(mx-sz,my-sz,sz*2,sz*2,p>.85?'#3f7561':'none',3,'stroke="#55705e" stroke-width="1.4"');
      if(p>.6)g+=path(`M${mx-5} ${my} l3 3 7 -7`,'none','#f8f5dd',2);
      let content='';for(const part of row.parts){content+=txt(ax+57,ay+63+offset*layout.step,part,layout.size,'#283c37',current?700:500);offset++;}
      g+=transform(4*(1-p),0,content,p);
    }
    g+=receipt(s,t,x+725,y+69,w-745,h-86,'#eec877');
    return g;
  }
  function frame(ep,atFrame){
    const f=clamp(Math.floor(atFrame),0,ep.durationFrames-1);
    const s=ep.scenes.find(row=>f<row.start+row.durationFrames)||ep.scenes.at(-1);
    const t=(f-s.start)/FPS,[ac,base]=ep.theme;
    let body=bg(ep,s,t);
    const arrival=ease(t/.52);
    const helpers={rect,line,circle,path,group,transform,txt,label,blocks,fit,wrap,width,icon,ease,clamp,receipt,windowFrame,cursor};
    let content='';
    for(const plugin of plugins){content=plugin.draw?.(s,t,helpers)||'';if(content)break;}
    if(!content)content=s.kind==='diagram'?diagram(s,t):s.kind==='decision'?decision(s,t):darkWorkspace(s,t);
    body+=transform(0,13*(1-arrival),content,.64+.36*arrival);
    const result=t>=s.resultAt;
    const footColor=result?ac:'#d2dedb';
    const footerTitle=result?'What to notice':'Your move';
    const footerContent=result?(s.focus||s.body):(s.action||s.body);
    body+=rect(38,584,1204,67,'#182c2b',12);
    body+=rect(54,599,4,37,footColor,2)+txt(70,625,footerTitle,17,footColor,700);
    body+=line(220,598,220,637,'#4f6761');
    body+=blocks(footerContent,242,625,965,49,22,'#f2f4ea',600,face,1.17);
    let pos=38;
    const spans=ep.scenes.length,gw=1204,gap=6;
    for(const other of ep.scenes){
      const width=(gw-gap*(spans-1))*other.durationFrames/ep.durationFrames;
      const done=other.index<s.index?1:other.index===s.index?clamp(t/s.sec):0;
      body+=rect(pos,675,width,4,'#40544f',2)+rect(pos,675,width*done,4,ac,2);pos+=width+gap;
    }
    const stop=Math.floor(f/FPS),mm=String(Math.floor(stop/60)).padStart(2,'0'),ss=String(stop%60).padStart(2,'0');
    body+=txt(38,701,`STEP ${String(s.index+1).padStart(2,'0')} / ${String(spans).padStart(2,'0')}`,12,'#bfd1c7',400,mono);
    body+=txt(1241,701,mm+':'+ss,12,'#bfd1c7',400,mono,'text-anchor="end"');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="ground" x1="0" y1="1" x2="1" y2="0" gradientUnits="objectBoundingBox"><stop stop-color="#102321"/><stop offset=".62" stop-color="#192a29"/><stop offset="1" stop-color="${base}"/></linearGradient></defs>${body}</svg>`;
  }
  function captureFrames(ep){
    const frames=new Set();
    for(const s of ep.scenes){
      const add=(sec)=>frames.add(s.start+clamp(Math.round(sec*FPS),0,s.durationFrames-1));
      // Densely sample purposeful movement; speech-led holds use sparse samples.
      const motion=(sec,span)=>{for(let j=0;j<=Math.ceil(span*FPS);j+=2)add(sec+j/FPS);};
      motion(0,.65);s.events.forEach(v=>motion(Math.max(0,v-.15),1.45));
      for(const plugin of plugins)for(const beat of plugin.beats?.(s)||[])motion(beat,.82);
      motion(Math.max(0,Math.max(s.events.at(-1)+.75,s.resultAt*.62)-.65),1.52);
      motion(s.resultAt,Math.min(2.9,.65+.18*Math.max(s.result.split('\n').length,3)));
      for(let v=0;v<s.sec;v+=1.25)add(v);
      add(s.sec-1/FPS);
    }
    return [...frames].sort((a,b)=>a-b);
  }
  return {W,H,FPS,prepare,frame,captureFrames};
});
