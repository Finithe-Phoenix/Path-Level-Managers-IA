/* Practical workstation choreography, shared by Chromium, Remotion, and the native renderer. */
(function(root,factory){
  const desk=factory();
  if(typeof module==='object'&&module.exports)module.exports=desk;else root.WorkshopWorkbenches=desk;
})(typeof globalThis==='object'?globalThis:this,function(){
  function draw(s,t,h){
    const {rect:box,line,circle:dot,path,txt,label,fit,wrap,blocks,icon,ease,clamp,transform,cursor,windowFrame}=h;
    const kind=s.kind;
    if(!['github','editor','terminal'].includes(kind))return '';
    const paper='#f4f4e6',mono='DejaVu Sans Mono,monospace',face='Open Sans,DejaVu Sans,sans-serif';
    const compact=(str,limit=52)=>str.length>limit?str.slice(0,limit-1)+'…':str;
    const result=ease((t-s.resultAt)/.65);
    const last=Math.max(0,s.events.filter(v=>v<=t).length-1);
    const files=[...new Set((s.code+' '+s.action).match(/(?:[\w.-]+\/)*[\w-]+\.(?:py|md|json|yml|yaml|txt|ts|js|csv|srt)\b/g)||[])];
    const fail=/\b(fail(?:ed|ure)?|AssertionError|changes_requested|blocked|denied)\b/i.test(s.result);
    const status=fail?'#ffb8a5':'#b3f3bb';
    const token=(str)=>{
      const m=str.match(/>=|<=|===|==|\b(?:[A-Za-z_]+\.py|\d+\/\d+|zero|quantity|passed|required|claims?|evidence)\b/i);
      return m?{i:m.index,s:m[0]}:null;
    };
    const reveal=(lineText,i)=>{
      const start=s.events[Math.min(i,s.events.length-1)];
      const pct=clamp((t-start)/Math.min(1.15,Math.max(.38,lineText.length*.018)));
      return {text:lineText.slice(0,Math.ceil(pct*lineText.length)),pct};
    };
    const point=(x1,y1,x2,y2,at,accent)=>{
      const p=ease((t-at)/.72);
      return cursor(x1+(x2-x1)*p,y1+(y2-y1)*p,accent,clamp((t-at-.65)/.65));
    };
    const bubbleIcon=(x,y,c)=>path(`M${x} ${y} h19 q3 0 3 3 v10 q0 3 -3 3 h-10 l-6 5 v-5 h-3 q-3 0 -3 -3 v-10 q0 -3 3 -3Z`,'none',c,1.7);
    function actionLine(x,y,lead,value,tone,p=1){
      return transform(0,8*(1-p),dot(x+4,y-6,4,tone)+txt(x+17,y,lead,15,tone,700)+txt(x+17,y+23,compact(value,45),17,'#eef1ec',500),p);
    }
    function drawLines(rows,x,y,w,hgt,startSize,color,f=mono,leading=1.29,output=false){
      const lays=fit(rows.join('\n'),w,hgt,startSize,f,leading);
      let markup='',offset=0;
      rows.forEach((r,i)=>{
        const fullParts=wrap(r,lays.size,w,f),rAt=s.resultAt+i*.28;
        const p=output?ease((t-rAt)/.43):reveal(r,i).pct;
        const chars=Math.ceil(r.length*p);
        let used=0;
        for(const part of fullParts){
          const partial=part.slice(0,Math.max(0,chars-used));used+=part.length;
          let c=color;
          if(f===mono){
            if(/^\s*\+[^+]|\b(PASS|OK)\b/.test(part))c='#a8edbd';
            else if(/^\s*-[^-]|\b(FAIL|FAILED|AssertionError)\b/.test(part))c='#ffb6b9';
          }
          markup+=txt(x,y+offset*lays.step,partial,lays.size,c,500,f);
          if(!output&&i===last&&partial&&partial.length===part.length&&t<s.resultAt){
            const key=token(part);
            if(key){
              const kx=x+h.width(part.slice(0,key.i),lays.size,f);
              const ww=h.width(key.s,lays.size,f);
              markup+=line(kx,y+offset*lays.step+5,kx+ww*ease((t-s.events[i]-.5)/.5),y+offset*lays.step+5,'#b7d5a0',2.1);
            }
          }
          offset++;
        }
      });return markup;
    }
    function focusFoot(x,y,sizing,tone){
      const idx=last+1;
      return txt(x,y,String(idx).padStart(2,'0')+' / '+String(s.lines.length).padStart(2,'0'),sizing,tone,400,mono);
    }
    function modelPicker(){
      const comparing=s.episodeId==='B04',tone='#c7adff',at=s.resultAt;
      const open=ease((t-at*.18)/.55),first=ease((t-at*.46)/.47),second=ease((t-at*.76)/.49);
      let g=windowFrame(s,t,38,177,1204,386)+box(54,244,1169,301,'#1b2435',9);
      g+=bubbleIcon(84,261,tone)+txt(120,278,'Copilot Chat',21,paper,700);
      g+=txt(790,277,'Illustrative picker',15,'#c0cada',500,face,'text-anchor="end"');
      g+=line(78,291,794,291,'#46546b')+label(82,319,'MODEL SELECTOR',tone);
      g+=box(81,335,692,43,'#354056',7,'stroke="#7d72a6" stroke-width="1.5"');
      g+=txt(99,363,first?'Approved option A':'Select model',20,paper,600);
      g+=path('M745 352 l7 7 7 -7','none',tone,2);
      if(open>0){
        let menu=box(98,388,659,127,'#293345',10,'stroke="#697696" stroke-width="1.5"');
        menu+=txt(114,412,'Example entries · your account shows its own names',15,'#bdc9dc',500);
        [['Approved option A',first],['Approved option B',comparing?second:0]].forEach(([text,p],i)=>{
          const y=426+i*39;menu+=box(111,y,633,34,p?'#394b50':'#242e3f',4);
          menu+=dot(129,y+16,6,p?'#b1e4bc':'#748493')+txt(146,y+24,text,19,paper,600);
          if(p)menu+=path(`M706 ${y+17} l4 4 9 -10`,'none','#b1e4bc',2);
        });
        g+=transform(0,9*(1-open),menu,open);
      }
      g+=box(824,254,379,279,'#23303e',10)+label(846,285,comparing?'COMPARISON RECORD':'SESSION RECORD',tone)+line(846,301,1181,301,'#485363');
      const entry=(y,k,v,p)=>transform(0,7*(1-p),label(847,y,k,'#abcebc')+txt(847,y+29,v,20,paper,600),p);
      g+=entry(334,comparing?'ATTEMPT 01':'VS CODE · COPILOT','Copy the displayed label',first);
      g+=entry(418,comparing?'ATTEMPT 02':'GCP · REMOTE CLIENT',comparing?'Record the second label':'Check the remote selector',second);
      if(result>0)g+=transform(0,0,txt(847,504,comparing?'One model? Repeat it twice.':'Lists can differ by client.',16,'#c3d9c8',500),result);
      if(t<at*.46)g+=point(694,479,750,354,at*.17,tone);
      else if(t<at*.76)g+=point(750,354,684,442,at*.44,tone);
      else if(t<at+.65)g+=point(684,442,comparing?684:853,comparing?480:412,at*.74,tone);
      return g;
    }
    function editor(){
      const realCode=/^\s*(?:[+-]\s{2,}|def\s|import\s|from\s|return\s|const\s|function\s|assert\s|class\s|\{\s*$)/m.test(s.code);
      if(realCode)return sourceEditor();
      const isPrompt=/\b(?:ask|chat|prompt|request|attach|agent|plan mode|Copilot)\b/i.test(s.action+' '+s.code);
      if(!isPrompt)return sourceEditor();
      const tone='#c7adff',outX=833;
      let g=windowFrame({...s,kind:'editor'},t,38,177,1204,386);
      g+=box(55,244,1169,302,'#20283b',11);
      const mode=/\bplan\b/i.test(s.action)?'Plan':/\bagent\b/i.test(s.action)?'Agent':'Chat';
      g+=bubbleIcon(80,260,tone)+txt(113,278,mode,19,paper,700);
      if(files.length)g+=txt(803,277,'Referenced files · '+files.slice(0,2).map(v=>v.split('/').pop()).join(', '),14,'#bac4d5',500,face,'text-anchor="end"');
      g+=line(75,291,806,291,'#465069');
      const selected=s.lines.filter(Boolean);
      const pLines=fit(selected.join('\n'),671,150,25,face,1.23);
      const bh=Math.max(67,Math.min(174,pLines.lines.length*pLines.step+26)),yy=305;
      g+=box(83,yy,711,bh,'#334054',13)+box(83,yy+9,3,bh-18,tone,1);
      g+=drawLines(selected,103,yy+18+pLines.size,669,bh-19,25,'#f1f2ed',face,1.23);
      const sendAt=Math.max(s.events.at(-1)+.75,s.resultAt*.62);
      const sent=t>=sendAt;
      const composerY=497;
      g+=box(83,composerY,712,36,'#1b2333',9,'stroke="#536177" stroke-width="1.3"');
      g+=path('M97 515 l8 -8 q6 -6 10 -2 q4 4 -2 10 l-7 7 q-5 4 -8 0 q-2 -3 1 -6 l8 -8','none','#c6cadd',1.7);
      g+=txt(126,521,sent?'Prompt sent':'Draft prompt',15,'#bac6d8',500);
      g+=box(749,503,34,24,sent?'#405148':tone,6)+path('M760 516 L766 510 L772 516 M766 511 V522','none',sent?'#bcdfc7':'#293445',1.7);
      if(!sent)g+=point(680,composerY-13,764,composerY+17,sendAt-.65,tone);
      g+=box(outX,256,369,275,'#1a2431',10)+label(outX+22,286,t>=s.resultAt?'RESPONSE':'CONVERSATION',tone);
      g+=line(outX+21,301,outX+348,301,'#435066');
      if(t<s.resultAt){
        g+=bubbleIcon(outX+30,324,'#a5c4b1')+actionLine(outX+31,371,'Current request',selected.length+' '+(selected.length===1?'line':'lines'),tone);
        const pct=ease((t-sendAt)/.5);
        if(pct>0)g+=actionLine(outX+31,445,'Status','Awaiting response','#a9d9bc',pct);
      }else{
        g+=drawLines(s.result.split('\n'),outX+22,341,323,168,23,'#eff5e7',face,1.25,true);
        g+=line(outX+21,515,outX+348,515,'#44574c')+dot(outX+32,505,3,'#a9d9bc');
      }
      return g;
    }
    function sourceEditor(){
      const tone='#c7adff',isDiff=/^[-+]\s/m.test(s.code);
      let g=windowFrame(s,t,38,177,1204,386);
      let file=files[0]||(isDiff?'Patch':/\b(?:evaluation|cases|score|criteria)\b/i.test(s.code)?'Case notes':'Working notes');
      g+=box(54,243,1169,303,'#1c2433',8);
      g+=box(67,254,132,281,'#252d40',6);
      g+=label(80,278,isDiff?'CHANGES':'EXPLORER','#a7b6c9');
      const items=[...new Set([file,...files.slice(1,4)])];
      items.forEach((name,i)=>{
        const yy=309+i*44;
        g+=box(74,yy-16,120,37,i===0?'#39415a':'#2d3548',5);
        const lines=wrap(name.replaceAll('/','/ '),13,105,face);
        lines.slice(0,2).forEach((v,j)=>{g+=txt(81,yy+j*14,v,13,i===0?'#f1eafa':'#b2c3ce',600);});
      });
      const available=595;
      g+=label(219,279,isDiff?'UNIFIED DIFF':'ACTIVE DOCUMENT',tone)+line(216,292,823,292,'#444d60');
      const layout=fit(s.code,available-42,215,21,mono,1.4);let off=0;
      s.lines.forEach((v,i)=>{
        const parts=wrap(v,layout.size,available-42,mono),start=off,y=323+off*layout.step;
        const active=i===last,add=/^\+[^+]/.test(v),del=/^-[^-]/.test(v);
        const shade=add?'#26453b':del?'#4d333c':active?'#30394e':null;
        if(shade)g+=box(218,y-22,601,parts.length*layout.step+2,shade,3);
        g+=txt(224,y,String(i+1).padStart(2,'0'),14,'#a7abc0',400,mono);
        const p=reveal(v,i);let used=0;
        for(const part of parts){
          const visible=part.slice(0,Math.max(0,p.text.length-used));used+=part.length;
          g+=txt(258,323+off*layout.step,visible,layout.size,add?'#aef0b9':del?'#ffc2c3':'#e2e9ef',400,mono);off++;
        }
        if(active&&t<s.resultAt)g+=cursor(798,323+start*layout.step-16,tone,clamp((t-s.events[i])/.64));
      });
      const x=840,w=365;g+=box(x,255,w,280,'#293745',9);
      g+=label(x+21,281,'INSPECTOR','#a7d6d0')+line(x+20,296,x+w-20,296,'#4b636a');
      if(t<s.resultAt){
        g+=icon('editor',x+22,317,tone,1.0)+txt(x+64,335,'Selection',20,paper,700);
        g+=txt(x+24,374,'Line '+String(last+1)+' of '+s.lines.length,24,paper,600);
        const excerpt=s.lines[last]||file;
        g+=blocks(excerpt,x+24,410,w-48,93,18,'#c4d9e0',500,mono,1.30);
      }else{
        g+=drawLines(s.result.split('\n'),x+22,337,w-45,181,22,'#eef3df',face,1.28,true);
        g+=dot(x+24,514,4,'#acd9bd')+txt(x+36,519,'Observation',15,'#b4cfc1',500);
      }return g;
    }
    function terminal(){
      const isShell=/^\s*(?:\$\s|git |gh |python|pytest|cat |pwd\b|ls\b|cd |claude\b|opencode\b|npm |node |sed |rg |echo |test |diff |make |curl |sh |bash |[A-Za-z0-9_.-]+\/)/m.test(s.code);
      const tone='#9ee9c3';
      let g=windowFrame(s,t,38,177,1204,386);
      g+=box(54,242,1172,304,'#0f221f',9);
      const commandW=isShell?708:677,ox=isShell?807:781,ow=1210-ox,xx=78;
      g+=txt(xx,272,isShell?'remote workspace':'Training data',18,tone,700,mono);
      g+=txt(ox,272,isShell?'stdout / stderr':'Observed output',16,'#a3c6b8',500,mono);
      g+=line(xx,288,1202,288,'#36544c')+line(ox-18,302,ox-18,526,'#34574a');
      const header=isShell?'$':'›';g+=txt(xx,329,header,26,tone,700,mono);
      g+=drawLines(s.lines,xx+32,329,commandW-37,185,22,'#dceee7',mono,1.38);
      const commandReady=Math.max(s.events.at(-1)+.80,s.resultAt*.43);
      if(t<s.resultAt){
        const p=ease((t-commandReady)/.5);
        const state=t<commandReady?(isShell?'Composing command':'Reading evidence'):(isShell?'Command submitted':'Checking the input');
        g+=box(ox,306,ow-7,190,'#192e28',9)+label(ox+18,334,'SESSION STATE',tone);
        g+=txt(ox+18,377,state,23,paper,600);
        const end=ox+ow-33;
        g+=line(ox+24,422,end,422,'#476b59',2);
        [0,.5,1].forEach((k,i)=>{g+=dot(ox+24+(end-ox-24)*k,422,6,i===0||i===1&&p>.7?tone:'#395447');});
        if(isShell)g+=txt(ox+16,458,'Input     Enter     Output',15,'#c0dac9',400,mono);
        if(t>commandReady-.7&&t<commandReady+.9)g+=point(650,484,721,513,commandReady-.6,tone);
      }else{
        g+=box(ox-2,302,ow-3,218,'#1b3029',8)+box(ox-2,309,4,203*result,status,1);
        g+=drawLines(s.result.split('\n'),ox+15,333,ow-36,164,22,'#eef7e7',mono,1.3,true);
      }
      g+=txt(xx,520,'›',20,tone,700,mono);
      g+=box(xx+23,501,7,21,t<s.resultAt?'#81c0a1':'#c5ffd7',1);
      if(isShell)g+=box(690,496,72,30,t>=commandReady?'#29503a':'#263f36',6)+txt(703,516,'Enter ↵',13,tone,600);
      return g;
    }
    function github(){
      const theme='#b7c6ff',gnd='#1d2736';
      let g=windowFrame(s,t,38,177,1204,386);
      g+=box(54,243,1170,301,gnd,8);
      const issue=s.code.match(/(?:issue|PR|pull request)\s*#?\d+/i);
      const sourceTitle=issue?issue[0]:/\b(?:checks|status)\b/i.test(s.code)?'Required checks':'Repository record';
      g+=icon('branch',80,260,theme,.91)+txt(113,277,sourceTitle,21,paper,700);
      g+=line(76,292,1200,292,'#475464');
      const rows=fit(s.code,690,204,22,face,1.34);
      let offset=0;const items=[];
      s.lines.forEach((v,i)=>{
        const parts=wrap(v,rows.size,690,face), yy=324+offset*rows.step,p=ease((t-s.events[i])/.48);
        items.push(yy);
        g+=dot(92,yy-7,7,i===last?theme:'#5d6a84')+dot(92,yy-7,2,gnd);
        let inner='';for(const part of parts){inner+=txt(116,324+offset*rows.step,part,rows.size,'#e9ecf4',500);offset++;}
        g+=transform(7*(1-p),0,inner,p);
      });
      for(let i=0;i<items.length-1;i++)g+=line(92,items[i]+1,92,items[i+1]-15,'#56647d',1.5);
      const ox=862;
      g+=box(ox,305,342,220,'#293344',9)+label(ox+22,333,t>=s.resultAt?'RECORDED EVIDENCE':'CURRENT ITEM',theme)+line(ox+20,350,1184,350,'#546076');
      if(t<s.resultAt){
        g+=icon('branch',ox+22,373,theme,1)+txt(ox+66,390,'Entry '+(last+1),22,paper,700);
        g+=blocks(s.lines[last],ox+22,426,293,74,18,'#bacbdd',500);
      }else g+=drawLines(s.result.split('\n'),ox+20,389,300,134,22,paper,face,1.25,true);
      return g;
    }
    if(s.id==='picker'&&['B03','B04'].includes(s.episodeId))return modelPicker();
    return kind==='terminal'?terminal():kind==='github'?github():editor();
  }
  return {draw,beats(s){return s.id==='picker'&&['B03','B04'].includes(s.episodeId)?[.17,.44,.74,.99].map(v=>v*s.resultAt):[];}};
});
