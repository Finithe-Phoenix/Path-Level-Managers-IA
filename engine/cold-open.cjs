/* Seekable, full-bleed opening photography drawn as original vector objects.
 * The four sets use light, material and camera motion to introduce each lesson's
 * first question. No browser, external image, font server or random state is used. */
(function(root,build){
  const api=build();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.StudioColdOpen=api;
})(typeof globalThis==='object'?globalThis:this,function(){
  const titles={
    B01:[['What can the','model see?'],'One question. The source file is still missing.','Question','Source file'],
    B02:[['One issue.','Three outputs.'],'Choose an output before you choose a model.','Issue','Output'],
    B03:[['Who made','this model?'],'Read the maker, the platform and the client separately.','Model','Client'],
    B04:[['Same issue.','Two models.'],'Use the same four boundary cases for both.','Task','Evidence'],
    B05:[['When does','an agent act?'],'Follow the path from a request to a tool call.','Request','Tool call'],
    B06:[['What needs','to change?'],'Turn “fix validation” into a testable request.','Prompt','Scope'],
    B07:[['Which context','is enough?'],'Trace a claim about zero back to the source.','Question','Evidence'],
    B08:[['Which edits','belong here?'],'Start with the current state of the branch.','Baseline','Patch'],
    M01:[['From issue','to reviewed PR.'],'Trace one zero-quantity order through the fix.','Issue','Review'],
    M02:[['Make the','failure visible.'],'At zero, the validator returns the wrong answer.','Expected','Observed'],
    M03:[['Review from','the terminal.'],'Establish whose account is reviewing the change.','Identity','Revision'],
    M04:[['What should','be reusable?'],'Separate a task-specific prompt from a repository rule.','Task','Repository'],
    M05:[['Turn a routine','into a skill.'],'Build a repeatable procedure for a PR handoff.','Inputs','Evidence'],
    M06:[['Where should','work stop?'],'Put a review checkpoint into the path of a change.','Gate','Decision'],
    A01:[['Where does','the agent run?'],'Locate the remote terminal before starting the session.','Workspace','Session'],
    A02:[['Can a rule','be verified?'],'A useful handoff records which command actually ran.','Instruction','Evidence'],
    A03:[['One rule.','Two callers.'],'Move the shared quantity check in reviewable stages.','CLI','API'],
    A04:[['Follow one','tool request.'],'Trace a scoped read from the client to the issue.','Client','Tool'],
    A05:[['What proves','the fix?'],'Follow a regression through an independent review.','Test','Review'],
    A06:[['Where is','the evidence?'],'Trace a claim about zero back to a source and revision.','Question','Passage'],
    A07:[['Which run is','easier to review?'],'Give both setups the same starting revision and issue.','Run A','Run B'],
    L01:[['Which outcome','matters?'],'Follow a routine fix from ready to first review.','Ready','Review'],
    L02:[['Set the','permission line.'],'Decide which actions issue seventeen actually needs.','Task','Access'],
    L03:[['Where is','the wait?'],'Mark the moment a change first receives a review.','Ready','First review'],
    L04:[['Measure the','same work.'],'Compare forty eligible requests in each group.','Baseline','Pilot'],
    L05:[['Expand, adjust','or pause?'],'Read the agreed benefit and guardrails before the score.','Benefit','Guardrails'],
  };
  const palettes={
    B:{field:'#051a1b',shade:'#0b2527',ink:'#b8f7e1',light:'#e7ffab',accent:'#61e9c7',second:'#c5f782',set:'FOUNDATIONS'},
    M:{field:'#101a30',shade:'#1c2843',ink:'#b6d6ff',light:'#fff0af',accent:'#87b9ff',second:'#ffa486',set:'APPLIED ENGINEERING'},
    A:{field:'#11152b',shade:'#252343',ink:'#d7c8ff',light:'#d9ffff',accent:'#c5a6ff',second:'#84eadd',set:'ADVANCED ENGINEERING'},
    L:{field:'#221c18',shade:'#312923',ink:'#f4d9a5',light:'#fff4b8',accent:'#eec381',second:'#79e0c4',set:'MANAGEMENT'},
  };
  const PI=Math.PI, sin=Math.sin,cos=Math.cos;
  const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
  const ease=x=>1-Math.pow(1-clamp(x),3);
  const mix=(a,b,p)=>a+(b-a)*p;
  const lerp=(a,b,p)=>a.map((v,i)=>mix(v,b[i],p));
  const fmt=x=>Number(x.toFixed(2));
  const pt=v=>v.map(fmt).join(',');
  const group=(v,attrs='')=>'<g '+attrs+'>'+v+'</g>';
  const tr=(x,y,children,scale=1)=>group(children,'transform="translate('+fmt(x)+' '+fmt(y)+') scale('+fmt(scale)+')"');
  const path=(d,stroke,width=1,fill='none',a='')=>'<path d="'+d+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+fmt(width)+'" stroke-linecap="round" stroke-linejoin="round" '+a+'/>';
  const poly=(points,fill,stroke='none',w=1,more='')=>path('M'+points.map(pt).join(' L')+' Z',stroke,w,fill,more);
  const line=(a,b,color,w=1,more='')=>path('M'+pt(a)+' L'+pt(b),color,w,'none',more);
  const ell=(x,y,rx,ry,fill,stroke='none',w=1,more='')=>'<ellipse cx="'+fmt(x)+'" cy="'+fmt(y)+'" rx="'+fmt(rx)+'" ry="'+fmt(ry)+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+fmt(w)+'" '+more+'/>';
  const txt=(x,y,value,size,color,weight=400,more='')=>'<text x="'+fmt(x)+'" y="'+fmt(y)+'" font-family="Open Sans,DejaVu Sans,sans-serif" font-size="'+size+'" font-weight="'+weight+'" fill="'+color+'" '+more+'>'+String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</text>';
  const opacity=x=>'opacity="'+fmt(clamp(x))+'"';
  const url=id=>'url(#co-'+id+')';
  const grad=(name,colors,x1=0,y1=0,x2=1,y2=1)=>'<linearGradient id="co-'+name+'" x1="'+x1*100+'%" y1="'+y1*100+'%" x2="'+x2*100+'%" y2="'+y2*100+'%">'+colors.map(([at,c,o=1])=>'<stop offset="'+at+'%" stop-color="'+c+'" stop-opacity="'+o+'"/>').join('')+'</linearGradient>';
  const rad=(name,colors)=>'<radialGradient id="co-'+name+'">'+colors.map(([at,c,o=1])=>'<stop offset="'+at+'%" stop-color="'+c+'" stop-opacity="'+o+'"/>').join('')+'</radialGradient>';
  function defs(p){
    return '<defs>'+
      grad('base',[[0,'#080e14'],[50,p.field],[82,p.shade],[100,'#0a1119']],0,1,1,0)+
      grad('glass',[[0,'#45616d',.9],[22,'#173d44',.94],[41,'#449c91',.72],[60,'#a9fff0',.68],[63,'#57a198',.76],[85,'#1c6861',.88],[100,'#a2cab7',.8]])+
      grad('side',[[0,'#102f3b'],[40,'#2a6e70'],[65,'#a5fbd3'],[100,'#2f6370']],0,1,1,.1)+
      grad('rail',[[0,'#6e819d'],[18,'#cad7ea'],[38,'#8192b3'],[52,'#364962'],[83,'#8194ae'],[100,'#b8cae6']],0,0,0,1)+
      grad('paper',[[0,'#3b3c59'],[45,'#737595'],[66,'#c3b8dd'],[100,'#ede5ee']],0,1,1,0)+
      grad('leaf',[[0,'#aa99bf'],[24,'#626079'],[72,'#353143'],[100,'#a8a3be']])+
      grad('gold',[[0,'#594126'],[18,'#c5a16e'],[40,'#fff0b7'],[54,'#a6804e'],[76,'#5a4834'],[100,'#e4bd80']],0,0,1,.28)+
      grad('brass',[[0,'#63482c'],[25,'#d2ad71'],[43,'#fff1be'],[70,'#b18a55'],[100,'#5e4734']],0,0,0,1)+
      rad('wash',[[0,p.accent,.19],[45,p.accent,.075],[100,p.accent,0]])+
      rad('glow',[[0,'#fff6ce',.74],[10,p.light,.36],[38,p.accent,.14],[100,p.accent,0]])+
      rad('contact',[[0,'#02070b',.88],[58,'#05080c',.3],[100,'#000',0]])+
      grad('typewash',[[0,'#05090f',.88],[32,'#05090f',.78],[49,'#05090f',.23],[66,'#05090f',0],[100,'#05090f',0]],0,0,1,0)+
      grad('type',[[0,'#fff9eb'],[52,'#f2f2e8'],[100,p.ink]],0,0,1,0)+
      '</defs>';
  }
  function set(p,t,chapter){
    let s='<rect width="1280" height="720" fill="'+url('base')+'"/>';
    s+=ell(925,325,570,405,url('wash'));
    // Glancing bands of light are in the set, behind the teaching object.
    for(let i=0;i<7;i++){
      const x=553+i*122+8*t;
      s+=poly([[x,-10],[x+2,-10],[x+234,720],[x+214,720]],p.accent,'none',0,opacity(.013+(i%3)*.006));
    }
    // Dust catches only the raking backlight; positions are deterministic.
    const salt=chapter.charCodeAt(0);
    for(let i=0;i<44;i++){
      const x=556+(i*139.7+salt*3)%745+sin(i*.89+t*.34)*5;
      const y=85+(i*109.3+salt)%535+cos(i*.91+t*.4)*4;
      s+=ell(x,y,i%7===0?2.1:.82,i%7===0?2.1:.82,p.ink,'none',0,opacity(.09+(i%5)*.045));
    }
    s+=ell(923,594,365,56,url('contact'));
    return s;
  }
  function segment(a,b,progress,thickness,col){
    const point=lerp(a,b,clamp(progress));
    return line(a,point,col,thickness);
  }
  function sparkle(x,y,p,size){
    let s=ell(x,y,size*3,size*3,url('glow'));
    s+=line([x-size,y],[x+size,y],p.light,1.1)+line([x,y-size*.65],[x,y+size*.65],p.light,1);
    return s+ell(x,y,2,2,'#ffffec');
  }
  function prism(t,p){
    const settle=ease((t+.25)/2.25), tilt=1-settle;
    const a=[891+23*tilt,164+17*tilt],b=[749-24*tilt,482-4*tilt],c=[1053-13*tilt,521+8*tilt];
    const dx=62+19*tilt,dy=-40+5*tilt,back=v=>[v[0]+dx,v[1]+dy];
    let s='';
    // Rear face and bevels. Each following polygon has its own surface normal.
    s+=poly([back(a),back(b),back(c)],'#173e42','#7ccebf',1.25);
    s+=poly([a,back(a),back(b),b],url('side'),'#9ae4d3',1);
    s+=poly([a,back(a),back(c),c],url('side'),'#b1ebd3',1);
    s+=poly([b,c,back(c),back(b)],'#26534e','#aad7a5',1.2);
    const face=[a,b,c];
    s+=poly(face,url('glass'),'#cbfff0',1.8);
    // Caustics are broken by the angled boundary of the polished glass.
    for(let i=1;i<15;i++){
      const q=i/16, start=lerp(a,b,q), end=lerp(a,c,clamp(q*.23+.045));
      s+=line(start,end,'#d6fff0',i%3===0?1.2:.65,opacity(i%3===0?.25:.15));
    }
    for(let i=1;i<6;i++){
      const q=i/8;s+=line(lerp(b,c,q),lerp(a,c,.84*q+.12),'#cbf8c1',.72,opacity(.27));
    }
    s+=line(lerp(a,b,.035),lerp(a,b,.97),'#edffed',4.5,opacity(.55));
    s+=line(lerp(a,c,.023),lerp(a,c,.985),'#d7ffe8',3,opacity(.6));
    const source=[564,461],enter=lerp(a,b,.64),inside=[901,369],exit=lerp(a,c,.63);
    const pulse=ease((t+.05)/1.35);
    s+=segment(source,enter,pulse,13,'#9bfad735')+segment(source,enter,pulse,4,'#adffde')+
       segment(source,enter,pulse,1.2,'#ffffef');
    s+=segment(enter,inside,ease((t-.24)/.78),4,'#edfdaa')+
       segment(inside,exit,ease((t-.55)/.70),3.2,'#efefac');
    const beams=['#f0f995','#abffc9','#63e7d3','#60cce7','#94aedf'];
    for(let i=0;i<beams.length;i++){
      const end=[1252,246+i*40], prog=ease((t-.72-i*.045)/.98);
      const sum=lerp(exit,end,prog);
      s+=poly([exit,[sum[0],sum[1]-4-i*.35],[sum[0],sum[1]+6+i*.5]],beams[i],'none',0,opacity(.10));
      s+=segment(exit,end,prog,2,beams[i]);
    }
    s+=sparkle(...enter,p,5+8*sin(clamp((t-.25)/1.3)*PI));
    s+=sparkle(...exit,p,6+9*sin(clamp((t-.72)/1.4)*PI));
    return s;
  }
  // Parallel test tracks in a perspective stage. Rails and sleepers follow the
  // same cubic so a moving signal remains physically attached around the fork.
  function spline(points,u){
    const v=1-u;
    return [0,1].map(k=>v*v*v*points[0][k]+3*v*v*u*points[1][k]+3*v*u*u*points[2][k]+u*u*u*points[3][k]);
  }
  function offset(points,u,d){
    const a=spline(points,u),b=spline(points,Math.min(1,u+.002)),c=spline(points,Math.max(0,u-.002));
    const vx=b[0]-c[0],vy=b[1]-c[1],n=Math.hypot(vx,vy)||1;
    return [a[0]-vy/n*d,a[1]+vx/n*d];
  }
  function track(splineData,col,t,branch){
    let s='';
    for(let i=0;i<20;i++){
      const u=i/19,w=mix(15,33,u);
      const a=offset(splineData,u,-w-5),b=offset(splineData,u,w+5);
      const z=[0,5+u*5];
      s+=poly([a,b,[b[0]+z[0],b[1]+z[1]],[a[0]+z[0],a[1]+z[1]]],'#23334c','#3e4f6c',1);
      s+=line(a,b,'#8292a9',2);
    }
    for(const side of [-1,1]){
      const pts=[],base=[];
      for(let i=0;i<=28;i++){
        const u=i/28,v=offset(splineData,u,mix(13,28,u)*side);
        pts.push(v);base.push([v[0],v[1]+6+u*5]);
      }
      s+=poly([...pts,...base.reverse()],url('rail'),'#19273a',.8);
      s+=path('M'+pts.map(pt).join(' L'),'#c5d4e7',2.2);
    }
    const progress=clamp((t-.16-branch*.18)/2.28),u=branch===1?Math.min(progress,.54):progress;
    const trail=[];for(let i=0;i<=20;i++)trail.push(spline(splineData,Math.max(0,u-i*.012)));
    s+=path('M'+trail.map(pt).join(' L'),col,9,'none',opacity(.19));
    s+=path('M'+trail.map(pt).join(' L'),col,2.7);
    const v=spline(splineData,u);s+=ell(v[0],v[1],19,19,url('glow'))+ell(v[0],v[1],5,5,col)+ell(v[0],v[1],2,2,'#fff7e6');
    return s;
  }
  function railway(t,p){
    const main=[[667,215],[752,255],[837,329],[955,393]],left=[[955,393],[1047,419],[1110,362],[1224,397]],right=[[955,393],[1026,429],[1057,508],[1181,560]];
    let s='';
    for(let i=0;i<8;i++){
      const a=lerp(main[0],main[3],i/7),width=17+2*i;
      s+=poly([[a[0]-width,a[1]+2],[a[0]+width,a[1]-6],[a[0]+width,a[1]+39],[a[0]-width,a[1]+45]],'#233047','#34405b',1);
    }
    s+=track(main,p.accent,t*1.4,0)+track(left,'#ffa48d',t-.05,1)+track(right,'#a4ead4',t-.45,0);
    // Two deliberately different signal shapes can be distinguished without color.
    for(const [x,y,col,pass,delay] of [[1120,298,'#ff997c',false,.5],[1165,465,'#aff1c7',true,1.7]]){
      const on=ease((t-delay)/.55);
      s+=poly([[x-7,y+28],[x+6,y+24],[x+6,y+68],[x-6,y+73]],url('rail'),'#23334c',1);
      s+=ell(x+4,y,34,37,'#152133','#5b6a88',2)+ell(x,y,33,37,'#2f3e53','#b5bdce',2)+ell(x,y,25,28,'#12202e',col,2);
      if(on>.01){s+=ell(x,y,25,27,col,'none',0,opacity(on*.16));s+=group(pass?path('M'+pt([x-12,y])+' l8 8 15 -17',col,4):path('M'+pt([x-9,y-9])+' l17 18 m0 -18 -17 18',col,3),opacity(on));}
    }
    return s;
  }
  function sheets(t,p){
    let s='';const lift=ease((t+.12)/2.2);
    for(let i=0;i<7;i++){
      const y=439-i*(7+5*lift), shift=i*1.9;
      const a=[652+shift,y+3],b=[821+shift,y-112],c=[1101+shift,y-41],d=[940+shift,y+74];
      s+=poly([a,d,c,[c[0],c[1]+6],[d[0],d[1]+8],[a[0],a[1]+6]],url('leaf'),'#9990a9',.65);
      s+=poly([a,b,c,d],url('paper'),'#bdb5cc',1);
      if(i===6){
        const pos=(u,v)=>lerp(lerp(a,b,u),lerp(d,c,u),v);
        for(let q=0;q<9;q++)s+=line(pos(.18+q*.073,.15),pos(.18+q*.073,q%4===2?.54:.77),'#49465d',q===7?2.9:1.65,opacity(.74));
        s+=poly([pos(.74,.08),pos(.91,.08),pos(.91,.51),pos(.74,.51)],'#8882a5','none',0);
      }
    }
    const nodes=[[722,300],[768,220],[842,284],[896,175],[934,244],[1009,201],[1060,280],[1138,223],[1188,292],[1132,351]];
    const links=[[0,1],[0,2],[1,2],[1,3],[2,3],[2,4],[3,4],[3,5],[4,5],[4,6],[5,6],[5,7],[6,7],[6,9],[7,8],[8,9],[6,8],[2,6]];
    for(const [a,b] of links)s+=line(nodes[a],nodes[b],'#a29ddd',1.2,opacity(.42));
    const crawl=ease((t-.13)/2.25);
    const route=[0,2,4,5,7];
    for(let i=0;i<route.length-1;i++)s+=segment(nodes[route[i]],nodes[route[i+1]],clamp(crawl*4-i),3.2,'#c6aafa');
    nodes.forEach((v,i)=>{const hit=route.indexOf(i),r=(hit>=0&&crawl*4>=hit?6:3.2);
      s+=ell(...v,r+6,r+6,p.accent,'none',0,opacity(r>5?.10:.035))+ell(...v,r,r,i===7?'#a5ffde':r>5?'#e4d7ff':'#b4a7cf','#342f50',1);
    });
    const dock=[991,356],target=nodes[7];
    s+=segment(target,dock,ease((t-1.05)/1.1),1.6,'#88dec8');
    const sink=lerp(target,dock,ease((t-1.13)/1.1));
    s+=sparkle(...sink,p,9);
    return s;
  }
  function scales(t,p){
    const tilt=mix(-.125,.025,ease((t+.05)/2.35))+sin(t*4.2)*.018*Math.exp(-t*1.3);
    const hub=[923,335],left=[hub[0]-185*cos(tilt),hub[1]-185*sin(tilt)],right=[hub[0]+185*cos(tilt),hub[1]+185*sin(tilt)];
    let s='';
    s+=ell(923,571,108,28,'#342b25','#90785b',1)+ell(923,562,106,24,url('brass'),'#c8a373',1.3);
    s+=ell(923,556,81,19,'#725d40','#e5cd93',1)+ell(923,552,72,16,url('gold'));
    s+=poly([[903,553],[942,553],[930,291],[915,292]],url('gold'),'#d1b27d',1);
    for(let q=0;q<3;q++)s+=ell(923,528+q*5,23-q,5,url('brass'),'#e3be82',.6);
    s+=path('M'+pt([left[0],left[1]-2])+' Q850 290 923 322 Q1015 333 '+pt([right[0],right[1]-2]),'#493c2d',13);
    s+=path('M'+pt([left[0],left[1]-5])+' Q850 287 923 319 Q1015 330 '+pt([right[0],right[1]-5]),url('brass'),9);
    for(const [idx,v] of [left,right].entries()){
      const x=v[0], y=v[1], bottom=y+126+idx*6,width=77;
      s+=line(v,[x-width,bottom],'#b59e78',1.8)+line(v,[x+width,bottom],'#e9c789',1.8)+line(v,[x+8,bottom-8],'#a28864',1);
      s+=ell(x,y,6,7,url('gold'),'#edcc86',.8);
      s+=path('M'+pt([x-width,bottom])+' Q'+pt([x,bottom+64])+' '+pt([x+width,bottom])+' Z','#a78b5c',1.2,url('gold'));
      s+=ell(x,bottom,width,13,'#796749','#f6db99',1.3);
      const tint=idx?p.second:'#e7bf7e';
      for(let k=0;k<4;k++){
        const cx=x-34+k*19,cy=bottom-5-(k%2)*2;
        s+=ell(cx,cy,11,4,tint,'#655c46',.65);
      }
    }
    s+=ell(...hub,27,27,url('gold'),'#ebc584',1.65)+ell(...hub,15,15,'#463d31','#f2d8a8',1.3)+ell(...hub,7,7,url('brass'));
    s+=path('M923 294 Q930 258 979 221',p.accent,.9,'none',opacity(.7));
    return s;
  }
  const art={B:prism,M:railway,A:sheets,L:scales};
  function duration(){return 3.72;}
  function draw(ep,scene,t,helpers={}){
    if(scene.index!==0 || t<0 || t>duration()+.75)return '';
    const id=ep.id,chapter=id[0],p=palettes[chapter],data=titles[id];
    if(!data||!p)return '';
    const [words,sub,first,last]=data;
    let content=defs(p)+set(p,t,chapter);
    const zoom=1.035-.035*ease(t/2.9),cx=940,cy=365;
    content+=group(art[chapter](t,p),'transform="translate('+fmt(cx)+' '+fmt(cy)+') scale('+fmt(zoom)+') translate(-'+cx+' -'+cy+')"');
    const level={B:'basico',M:'medio',A:'avanzado',L:'managers'}[chapter];
    const plate=helpers.plate&&t<3.14?helpers.plate(level,0,0,1280,720):'';
    if(plate){
      // The physical shot acquires an analytical overlay from left to right.
      // Dark type backing is independent of the picture's material and exposure.
      const progress=clamp((t-1.50)/1.60),smooth=progress*progress*(3-2*progress);
      const px=mix(-360,1490,smooth), lens=1.075-.062*ease(t/3.2);
      const mask='<clipPath id="co-plate-mask">'+poly([[px,-8],[1540,-8],[1540,730],[px+240,730]],'white')+'</clipPath>';
      content+='<defs>'+mask+'</defs>'+group(group(plate,'transform="translate(927 355) scale('+fmt(lens)+') translate(-927 -355)"')+'<rect width="1280" height="720" fill="'+url('typewash')+'"/>','clip-path="url(#co-plate-mask)"');
      if(progress>0&&progress<1){content+=line([px,0],[px+240,720],p.accent,1.3,opacity(.32*sin(progress*PI)));}
    }
    const slide=10*(1-ease(t/.65));
    const sizes=words.some(w=>w.length>14)?58:words.some(w=>w.length>11)?67:77;
    let copy=txt(70,100,id+'  /  '+p.set,17,p.ink,600,'letter-spacing="2.1"');
    copy+=line([70,129],[70+mix(28,146,ease(t/.8)),129],p.accent,2);
    words.forEach((w,i)=>{copy+=txt(65,306+i*83,w,sizes,i===0?'#fff7e9':url('type'),700,'letter-spacing="-2.5"');});
    // A two-line prompt is easier to read than a footer-width line on mobile.
    const parts=sub.split(' '),rows=[''];for(const word of parts){
      const prev=rows.length-1; const width=(rows[prev]+' '+word).length;
      if(width>42&&rows[prev])rows.push(word);else rows[prev]+=(rows[prev]?' ':'')+word;
    }
    rows.forEach((w,i)=>{copy+=txt(71,449+i*29,w,21.5,'#d3dcd7',400);});
    content+=tr(-slide,0,copy);
    const state=ease((t-.22)/1.2);
    const footerY=625,fx=704,toX=1056;
    let tags=line([fx,footerY-20],[toX+124,footerY-20],p.ink,.7,opacity(.43));
    tags+=ell(fx,footerY-20,3.2,3.2,p.accent)+ell(toX+124,footerY-20,3.2,3.2,p.second);
    tags+=txt(fx,footerY+9,first,20,p.ink,600)+txt(toX+124,footerY+9,last,20,p.ink,600,'text-anchor="end"');
    return content+group(tags,opacity((plate?ease((t-2.10)/.88):1)*(.52+.48*state)));
  }
  // Each selected shot magnifies a piece of evidence that has already appeared
  // in the walk-through. Numeric scales are authored in the unit of the source.
  const inserts={
    B01:['tokens','tokens','An illustrative token split',['return','quantity','>','0'],'The tokenizer determines the actual split.'],
    B02:['embeddings','flow','Similarity search',[['Query','zero item order'],['Top match','order acceptance rules']],'Open the original note to verify the rule.'],
    B03:['microsoft','flow','Read the model card',[['Model publisher','Microsoft · MAI, Phi'],['Catalog','Foundry also lists other publishers']],'The publisher identifies who made a model.'],
    B04:['criteria','chart','Response time',[['Model A',6],['Model B',15]],'Both found the cause. Only A stayed within scope.',15,' s'],
    B05:['loop','flow','Trace the tool evidence',[['Read','Order validator'],['Inspect','Tests for the boundary case']],'Stop after collecting the requested evidence.'],
    B06:['iterate','flow','Keep the public signature',[['Initial plan','Change the public signature'],['Revised plan','Change the comparison and test']],'Check the revised plan against the issue.'],
    B07:['attach','flow','The request has three references',[['Source','order_quantity.py'],['Test','tests/test_order_quantity.py'],['Requirement','Synthetic issue text']],'Inspect the attached files in the request.'],
    B08:['undo','flow','Undo one extra change',[['Remove','Unwanted notes edit'],['Keep','Validator and regression test']],'Recheck the remaining diff.'],
    M01:['fix','pass','Boundary test',['test_rejects_zero','4 tests passed'],'The fix removes equality from the comparison.'],
    M02:['fix-green','diff','The one-line fix',['return quantity >= 0','return quantity > 0'],'Run the same four tests after the edit.'],
    M03:['checks','flow','Review the current head',[['Required check','Unit tests · pass'],['Revision','Record the reviewed head']],'The check must apply to the reviewed revision.'],
    M04:['roles','flow','Three kinds of guidance',[['Template','Task request'],['Instructions','Project conventions'],['Checks','Enforcement']],'Review each role where its behavior is observable.'],
    M05:['invoke','pass','Evidence in the PR handoff',['Issue #17 · zero is rejected','4 unit tests passed'],'The summary must match the supplied diff and tests.'],
    M06:['red','fail','The regression fails',['test_rejects_zero','True is not false'],'The test detects the original defect.'],
    A01:['access','flow','Read the session boundary',[['Read training files','Allowed'],['Edits and test runs','Ask first'],['External integrations','Unavailable']],'Keep the first task within inspection scope.'],
    A02:['paths','flow','Find the same skill',[['Claude Code','.claude/skills/'],['OpenCode','.opencode/skills/']],'Inspect the complete skill path from the repository root.'],
    A03:['plan','flow','One shared quantity rule',[['Stage 1','Extract the rule and migrate the CLI'],['Stage 2','Migrate the API after review']],'The human reviewer approves one stage at a time.'],
    A04:['call','flow','Inspect the argument',[['Tool','get_training_issue'],['Argument','issue_number = 17']],'The proposed operation reads one training issue.'],
    A05:['gate','flow','Evaluate the current revision',[['Test exit 0 + scoped diff','Ready for review'],['Assertion failure','Inspect and repair']],'A failed post-fix test blocks the handoff.'],
    A06:['retrieve','chart','Illustrative similarity scores',[['order-policy.md',.86],['shipping-policy.md',.24]],'Read the passage at revision 27e4ab1.',1,'',2],
    A07:['compare','chart','Outside-scope edits',[['Run A',0],['Run B',1]],'Both runs passed four tests. Only A met the scope gate.',1,''],
    L01:['score','chart','Benchmark cases passed',[['Model A',7],['Model B',8]],'The pilot requires eight out of eight.',8,'/8'],
    L02:['access','flow','Separate agent and human roles',[['Agent','Propose scoped edits'],['Author','Approve tests and publish'],['Reviewer','Inspect and decide']],'Publishing and approval have distinct owners.'],
    L03:['baseline','chart','Eligible pull requests',[['Baseline',40],['Pilot',40]],'Each cohort covers four weeks in the same service.',40,' PRs'],
    L04:['time','chart','Median wait for review',[['Baseline',18],['Pilot',13]],'Target: at most 14 business hours.',20,' h'],
    L05:['outcomes','chart','Rework changes the decision',[['Agreed limit',15],['Observed rework',17.5]],'The 17.5% rework rate crosses the 15% limit.',20,'%']
  };
  function cueWindow(ep,s){
    const item=inserts[ep.id];if(!item||item[0]!==s.id)return null;
    // Leave room to see the unmodified workspace on both sides of the cutaway.
    const len=Math.min(4.4,s.sec*.24), at=Math.max(.4,Math.min(s.sec-len-.5,s.resultAt+1.1));
    return [at,len];
  }
  function beats(ep,s){
    const window=cueWindow(ep,s);if(!window)return [];
    const [at,len]=window;return [at-.12,at+.35,at+1.15,at+2.05,at+len-.56,at+len];
  }
  function illuminatedDetail(level,t,p){
    // The traveling highlight follows the photographed object while the matching
    // evidence is exposed. Only its moving head glows; previous positions settle.
    const paths={
      B:[[[650,457],[766,425],[879,352],[949,321]],[[949,321],[1014,314],[1110,283],[1200,212]]],
      M:[[[691,263],[811,260],[856,279],[913,324]],[[913,324],[1004,353],[1044,423],[1207,408]]],
      A:[[[694,440],[783,414],[852,409],[909,385]],[[909,385],[1026,369],[1092,310],[1176,251]]],
      L:[[[706,240],[775,249],[862,274],[930,302]],[[930,302],[1009,323],[1099,352],[1178,376]]]
    };
    const lanes=paths[level];if(!lanes)return '';
    const head=clamp((t-.12)/2.65)*2,out=ease((4.05-t)/.66);
    let g='';
    lanes.forEach((route,i)=>{
      const progress=clamp(head-i);if(progress<=0)return;
      const pts=[];for(let j=0;j<=17;j++)pts.push(spline(route,progress*j/17));
      const drawPath='M'+pts.map(pt).join(' L');
      g+=path(drawPath,i?p.second:p.accent,4.2,'none',opacity(.18*out))+path(drawPath,i?p.second:p.accent,1.3,'none',opacity(.72*out));
      const v=spline(route,progress);
      if(head>=i&&head<i+1)g+=sparkle(v[0],v[1],p,5.8);
      if(progress>.99)g+=ell(v[0],v[1],4,4,'none',p.light,1,opacity(.86*out));
    });
    return g;
  }
  function cutaway(ep,s,t,helpers={}){
    const window=cueWindow(ep,s);if(!window)return null;
    const [at,len]=window,local=t-at;
    if(local<0||local>len)return null;
    const [scene,kind,heading,rows,note,max,suffix,dec]=inserts[ep.id];
    const p=palettes[ep.id[0]], level={B:'basico',M:'medio',A:'avanzado',L:'managers'}[ep.id[0]];
    const alpha=ease(local/.34)*ease((len-local)/.34);
    const img=helpers.plate&&helpers.plate(level,0,0,1280,720);
    let g=defs(p)+'<defs><clipPath id="co-window"><rect x="38" y="174" width="1204" height="388" rx="15"/></clipPath>'+
      grad('sleeve',[[0,'#0a1017',.99],[40,'#0a1017',.98],[51,'#0a1017',.92],[60,'#0a1017',.65],[78,'#0a1017',.04],[100,'#0a1017',.03]],0,0,1,0)+'</defs>';
    let b=img?group(img,'transform="translate(942 347) scale('+fmt(1.12+.035*ease(local/len))+') translate(-942 -347)"'):set(p,local,ep.id[0])+art[ep.id[0]](local,p);
    b+='<rect x="38" y="173" width="1204" height="390" fill="'+url('sleeve')+'"/>';
    if(img)b+=illuminatedDetail(ep.id[0],local,p);
    b+=txt(81,237,heading,32,'#fff6e8',700,'letter-spacing="-.8"');
    b+=line([81,260],[81+mix(50,600,ease(local/.75)),260],p.accent,1.1,opacity(.72));
    if(kind==='tokens'){
      const xs=[82,223,402,480], widths=[128,160,59,59];
      b+=txt(84,319,'return quantity > 0',26,'#d3e0d7',600);
      rows.forEach((value,i)=>{
        const pp=ease((local-.14-i*.17)/.72),x=xs[i],y=345+(1-pp)*22;
        b+=group(poly([[x,y],[x+widths[i]-7,y],[x+widths[i],y+7],[x+widths[i],y+58],[x+7,y+58],[x,y+50]],i%2===0?'#234641':'#2a453a',p.accent,1.1)+
          txt(x+widths[i]/2,y+39,value,26,p.light,600,'text-anchor="middle"'),opacity(pp));
      });
    }else if(kind==='chart'){
      rows.forEach(([label,value],i)=>{
        const y=322+i*82, pp=ease((local-.14-i*.28)/1.05);
        const val=dec===undefined?String(value):value.toFixed(dec);
        b+=txt(83,y-10,label,19,'#dce6dd',600)+txt(606,y-10,val+(suffix||''),26,i?p.light:p.ink,700,'text-anchor="end"');
        b+=line([84,y+8],[603,y+8],'#40505a',8)+line([84,y+8],[84+519*(value/max)*pp,y+8],i?p.second:p.accent,8);
        if(value>0)b+=ell(84+519*(value/max)*pp,y+8,5,5,'#fff8dd');
      });
    }else if(kind==='flow'){
      const stack=rows.length===3?49:73;
      const valueX=rows.some(row=>row[0].length>18)?338:279;
      rows.forEach(([label,value],i)=>{
        const pp=ease((local-i*.23)/.60), yy=316+i*stack;
        b+=group(ell(87,yy-6,4,4,i?p.second:p.accent)+txt(103,yy,label,18.5,p.ink,600)+
          txt(valueX,yy,value,19.5,'#fffaea',600),opacity(.26+.74*pp));
        if(i+1<rows.length)b+=line([87,yy+3],[87,yy+stack-14],p.accent,1,opacity(.42));
      });
    }else{
      const badge=kind==='diff'?['−','+']:kind==='pass'?['›','✓']:['›','×'];
      rows.forEach((value,i)=>{
        const pp=ease((local-.12-i*.37)/.76), y=307+i*71,color=kind==='diff'?(i?'#aff1cf':'#ffb5a0'):(i?(kind==='fail'?'#ffab99':'#a9efd2'):'#c4d1e2');
        b+=group(line([84,y+18],[83+Math.max(30,512*pp),y+18],color,.8,opacity(.45))+
          txt(86,y,badge[i],30,color,700)+txt(123,y,value,27,color,600),opacity(.22+.78*pp));
      });
    }
    b+=txt(83,491,note,19.3,'#dde5da',400);
    b+=line([82,516],[621,516],'#506365',.8);
    g+=group(b,'clip-path="url(#co-window)"')+'<rect x="38.5" y="174.5" width="1203" height="387" rx="15" fill="none" stroke="'+p.accent+'" stroke-width="1.3" opacity=".58"/>';
    return {svg:group(g,'transform="translate(0 -26)"'),opacity:alpha};
  }

  const hasCutaway=(ep,s)=>!!cueWindow(ep,s);
  return {draw,duration,cutaway,beats,hasCutaway};
});
