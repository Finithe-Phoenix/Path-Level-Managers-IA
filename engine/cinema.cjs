/* Film frame, camera, edits and evidence inserts. The same shot can be sought in any order. */
(function (root, create) {
  const cinema = create();
  if (typeof module === 'object' && module.exports) module.exports = cinema;
  else root.WorkshopCinema = cinema;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  const tracks = {
    B: {name:'Foundations', accent:'#9af5c3', flare:'#e8be6c', dark:'#073c37', shadow:'#061820', light:'#214646'},
    M: {name:'Applied engineering', accent:'#abc7ff', flare:'#ffb68f', dark:'#243468', shadow:'#101728', light:'#354868'},
    A: {name:'Advanced engineering', accent:'#d8b7ff', flare:'#8be9e4', dark:'#4f2c68', shadow:'#151221', light:'#533a65'},
    L: {name:'Management', accent:'#ffd59a', flare:'#8bdfca', dark:'#483720', shadow:'#19191a', light:'#5d4734'}
  };
  const mono = 'DejaVu Sans Mono,monospace', sans = 'Open Sans,DejaVu Sans,sans-serif';
  const cl = (x,a=0,b=1) => Math.min(b,Math.max(a,x));
  const ease = v => { const x=cl(v); return x*x*(3-2*x); };
  const round = x => Math.round(x*100)/100;
  const group = (attrs,body) => '<g '+attrs+'>'+body+'</g>';
  const attr = (str) => String(str).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  function theme(ep){return tracks[ep.id?.[0]] || tracks.B;}
  function definitions(ep){
    const p=theme(ep);
    return '<defs>'+
      '<linearGradient id="film-ground" x2=".95" y2="1"><stop stop-color="'+p.shadow+'"/><stop offset=".48" stop-color="#0c111b"/><stop offset="1" stop-color="'+p.shadow+'"/></linearGradient>'+
      '<radialGradient id="film-light" cx=".88" cy=".05" r=".73"><stop stop-color="'+p.light+'" stop-opacity=".88"/><stop offset=".42" stop-color="'+p.dark+'" stop-opacity=".36"/><stop offset="1" stop-opacity="0"/></radialGradient>'+
      '<linearGradient id="film-rim"><stop stop-color="'+p.accent+'" stop-opacity=".17"/><stop offset=".33" stop-color="'+p.accent+'" stop-opacity=".86"/><stop offset=".69" stop-color="'+p.flare+'" stop-opacity=".25"/><stop offset="1" stop-color="'+p.accent+'" stop-opacity=".34"/></linearGradient>'+
      '<linearGradient id="callout" x2="1" y2=".3"><stop stop-color="#233137"/><stop offset=".55" stop-color="#161f29"/><stop offset="1" stop-color="'+p.dark+'"/></linearGradient>'+
      '<linearGradient id="proofshade" x1="0" x2="1"><stop stop-color="#070d14" stop-opacity=".99"/><stop offset=".40" stop-color="#09101a" stop-opacity=".97"/><stop offset=".65" stop-color="#09101a" stop-opacity=".78"/><stop offset=".91" stop-color="#090f18" stop-opacity=".22"/><stop offset="1" stop-color="#090f18" stop-opacity=".45"/></linearGradient>'+
      '<linearGradient id="macro" x2="1" y2="1"><stop stop-color="'+p.dark+'"/><stop offset=".65" stop-color="#141f28"/><stop offset="1" stop-color="#0c121e"/></linearGradient>'+
      '<linearGradient id="edit-line"><stop stop-color="'+p.flare+'" stop-opacity="0"/><stop offset=".8" stop-color="'+p.accent+'" stop-opacity=".75"/><stop offset="1" stop-color="#f6ffed"/></linearGradient>'+
      '<clipPath id="film-header"><path d="M720 0 H1280 V139 H908 Z"/></clipPath>'+
      '<linearGradient id="header-shade"><stop offset=".50" stop-color="'+p.shadow+'"/><stop offset=".74" stop-color="'+p.shadow+'" stop-opacity=".85"/><stop offset="1" stop-color="'+p.shadow+'" stop-opacity=".12"/></linearGradient>'+
      '<clipPath id="film-screen"><rect x="38" y="177" width="1204" height="387" rx="13"/></clipPath>'+
      '</defs>';
  }
  function background(ep,s,t,h){
    const {rect,txt,line,circle,path}=h,p=theme(ep);
    let a=rect(0,0,1280,720,'url(#film-ground)')+rect(0,0,1280,720,'url(#film-light)');
    // Isometric wire contours cross the edge of the frame like light entering an optical bench.
    a+=group('clip-path="url(#film-header)"',h.plate(ep.id[0]+'-detail',742,-85,548,309,'opacity=".65"'));
    a+=rect(0,0,1280,139,'url(#header-shade)');
    let contours='';
    for(let i=0;i<12;i++) {
      const off=i*18;
      contours+=path('M '+(792+off)+' -26 C '+(952+off)+' 25 '+(831+off)+' 74 '+(1072+off)+' 123 S '+(1318+off)+' 204 '+(1370+off)+' 233','none',p.accent,i===5?1.6:.75);
    }
    a+=group('opacity=".115"',contours);
    for(let i=0;i<23;i++)a+=circle(877+i*15.3,28,1.1,i<(s.index+1)*3?p.accent:'#5f6574');
    a+=rect(32,20,7,7,p.accent,1)+rect(43,20,3,7,p.flare,1);
    a+=txt(58,28,ep.id+'   /   '+p.name.toUpperCase(),13,p.accent,700,mono);
    a+=txt(1244,28,String(s.index+1).padStart(2,'0')+'   /   '+String(ep.scenes.length).padStart(2,'0'),13,'#e1e6ed',600,mono,'text-anchor="end"');
    const titleW=1190, titleSize=Math.min(42,titleW/Math.max(1,h.width(s.title,1,sans)));
    a+=txt(34,82,s.title,titleSize,'#fff9e9',700,sans);
    a+=txt(36,112,ep.title,18,'#bccad1',400,sans);
    return a;
  }
  function frameRails(ep,s,t,h){
    const p=theme(ep),{rect,line,path}=h;
    let a=rect(27,150,1228,397,'#070a10',16)+rect(29,145,1222,399,'#10171e',16);
    a+=rect(29,143,1222,398,'none',16,'stroke="url(#film-rim)" stroke-width="1.5"');
    a+=line(59,143,307,143,p.accent,2.6)+line(971,541,1208,541,p.flare,1.25);
    // Recessed alignment corners remain outside the workspace and its text.
    for(const [x,y,dir] of [[20,165,1],[1261,165,-1]])a+=path('M '+x+' '+y+' v -19 l '+dir*8+' -8','none',p.accent,1);
    return a;
  }
  function stageCamera(ep,s,t,markup,h){
    const receiving=ease(t/.70);
    const scale=1-.021*(1-receiving);
    const x=640*(1-scale), y=370*(1-scale)-29+6*(1-receiving);
    return group('transform="translate('+round(x)+' '+round(y)+') scale('+round(scale)+')"',
      group('clip-path="url(#film-screen)"',markup));
  }
  function evidenceSchedule(s) {
    if (s.index===0 || s.index%3!==2 || !s.result || s.sec<10) return null;
    const start=Math.min(s.resultAt+.86,s.sec-4.7);
    if(start<=s.resultAt+.15)return null;
    return {start,end:Math.min(s.sec-.40,start+3.75)};
  }
  function evidence(ep,s,t,h) {
    const span=evidenceSchedule(s);
    if(!span||t<span.start||t>=span.end)return '';
    const {rect,txt,line,circle,path}=h,p=theme(ep);
    const d=t-span.start, f=ease(d/.30)*ease((span.end-t)/.40);
    const inputs=String(s.code||'').trim().split('\n').filter(Boolean);
    const result=String(s.result||s.body).trim();
    const last=inputs.at(-1)||s.title;
    const lens=1.077-.042*ease(d/2.4);
    let a=rect(0,0,1280,720,'url(#macro)');
    a+=group('transform="translate(976 346) scale('+round(lens)+') translate(-976 -346)"',h.plate(ep.id[0],0,0,1280,720));
    a+=rect(0,0,1280,720,'url(#proofshade)');
    a+=txt(63,89,ep.id+'    /    OBSERVED EVIDENCE',17,p.accent,700,mono,'letter-spacing="1.3"');
    a+=line(64,115,64+128*ease(d/.45),115,p.accent,2);
    const layout=h.fit(result,736,225,47,sans,1.18);
    const baseline=336-(layout.lines.length-1)*layout.step/2;
    layout.lines.forEach((row,i)=>{a+=txt(61,baseline+i*layout.step,row,layout.size,'#fff9e9',700,sans);});
    const lower=506;
    a+=line(65,lower,773,lower,'#6e8685',1)+txt(65,lower+33,'SOURCE',12,p.accent,700,mono,'letter-spacing="1.5"');
    const context=h.fit(last,786,80,22,mono,1.23);
    context.lines.forEach((str,i)=>{a+=txt(65,lower+66+i*context.step,str,context.size,'#d5e5e7',400,mono);});
    // On lens acquisition two split reticles close around the physical subject.
    const delta=28*(1-ease(d/.8)), cx=975,cy=335,r=108+delta;
    for(const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]]) {
      const x=cx+dx*r,y=cy+dy*r;
      a+=path('M '+(x-dx*25)+' '+y+' H '+x+' V '+(y-dy*25),'none',p.accent,1.65);
    }
    const x1=cx-r,y1=cy+r-17;
    a+=path('M '+x1+' '+y1+' l -38 41 h -70','none',p.accent,1);
    a+=circle(x1-108,y1+41,3,p.flare);
    return group('data-film-exposure="evidence" opacity="'+round(f)+'"',a);
  }
  function footer(ep,s,t,h){
    const {rect,txt,line,blocks,path}=h,p=theme(ep);
    const result=t>=s.resultAt, pulse=result?ease((t-s.resultAt)/.6):0;
    const ink=result?p.flare:p.accent;
    const cue=result?(s.focus||s.body):(s.action||s.body);
    let a=rect(30,565,1220,82,'url(#callout)',10)+rect(30,565,1220,82,'none',10,'stroke="#43505a" stroke-width="1"');
    const x=52,y=578;
    a+=path('M '+x+' '+y+' h 31 l 13 13 v 31 h -44 z','none',ink,1.2);
    if(result)a+=path('M 62 600 l 7 6 13 -15','none',ink,2.5);
    else a+=path('M 65 588 l 16 11 -8 1 -4 10 z',ink,'none',0);
    a+=txt(113,590,result?'OBSERVE':'ACTION',12,ink,700,mono,'letter-spacing="1.7"');
    a+=blocks(cue,112,621,1082,41,23,'#fbf7e9',600,sans,1.13);
    if(result && pulse<1)a+=rect(31,644,1218*pulse,2,ink,1);
    let pos=32, railWidth=1216, gap=5;
    for(const c of ep.scenes){
      const w=(railWidth-gap*(ep.scenes.length-1))*c.durationFrames/ep.durationFrames;
      const done=c.index<s.index?1:c.index===s.index?cl(t/s.sec):0;
      a+=rect(pos,666,w,3,'#35414b',1.5);
      if(done)a+=rect(pos,666,w*done,3,c.index<s.index?'#71828b':p.accent,1.5);
      if(c.index===s.index)a+=rect(pos+Math.max(0,w*done-1),663,2.5,9,'#fbf9d9',1);
      pos+=w+gap;
    }
    const secs=Math.floor((s.start+t*24)/24);
    const clock=String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0');
    a+=txt(32,694,'STEP '+String(s.index+1).padStart(2,'0')+'   /   '+String(ep.scenes.length).padStart(2,'0'),13,'#aabac4',400,mono);
    a+=txt(1246,694,clock,13,'#dbe5e5',400,mono,'text-anchor="end"');
    return a;
  }
  function wipe(previous,current,phase,accent){
    const q=ease(phase);
    if(q<=0)return previous;
    if(q>=1)return current;
    const x=-160+q*1620;
    const points=attr('-4,-4 '+round(x)+',-4 '+round(x-135)+',724 -4,724');
    const edge='M '+round(x)+' -3 L '+round(x-135)+' 724';
    return '<defs><clipPath id="edit-wipe"><polygon points="'+points+'"/></clipPath></defs>'+
      group('data-film-exposure="outgoing"',previous)+group('data-film-exposure="incoming" clip-path="url(#edit-wipe)"',current)+
      '<path d="'+edge+'" fill="none" stroke="'+accent+'" opacity=".22" stroke-width="11"/>'+
      '<path d="'+edge+'" fill="none" stroke="#faf0cf" stroke-width="2.3"/>';
  }
  return {theme,definitions,background,frameRails,stageCamera,evidence,evidenceSchedule,footer,wipe};
});
