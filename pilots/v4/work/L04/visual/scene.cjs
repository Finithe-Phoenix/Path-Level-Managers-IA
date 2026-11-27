'use strict';
const fs = require('node:fs');
const path = require('node:path');
const D = require('./evidence/scorecard.json');
const room = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'assets/review-room.jpg'), 'base64');
const slips = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'assets/case-slips.jpg'), 'base64');

const terminal={
  opened:'data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'assets/ledger-opened.png'),'base64'),
  formula:'data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'assets/ledger-formula.png'),'base64'),
  total:'data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'assets/ledger-total.png'),'base64'),
  headroom:'data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'assets/ledger-headroom.png'),'base64'),
  unit:'data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'assets/ledger-unit.png'),'base64')
};

const C={ink:'#122435',navy:'#102337',deep:'#101e2e',blue:'#214fbb',sky:'#83aafa',paper:'#f4f1e9',white:'#fffdf6',muted:'#506374',fine:'#c8d0ca',teal:'#17675c',mint:'#99d6b1',orange:'#bf492c',hot:'#ff987b',sand:'#ded5bb',dim:'#b5c4cf'};
const diffSource=fs.readFileSync(path.join(__dirname, 'evidence/P020.diff'), 'utf8');
const addedValidator=diffSource.split('\n').find(row=>/^\+  return/.test(row));
const removedValidator=diffSource.split('\n').find(row=>/^-  return/.test(row));
const originalFormat=diffSource.split('\n').find(row=>/^-\{/.test(row));
const expandedFormat=diffSource.split('\n').find(row=>/^\+  \"width/.test(row));
const sans="'Open Sans',Arial,sans-serif", serif="'Liberation Serif',Georgia,serif", mono="'DejaVu Sans Mono',monospace";
const ids=['question','wait','effort','quality','cost','decision','transfer','debrief'];
const titles=['Review meeting','Wait time','Reviewer effort','Quality threshold','Incremental spend','Decision record','Practice case','Debrief'];
const clamp=(v,l=0,h=1)=>Math.min(h,Math.max(l,v));
const ease=v=>{v=clamp(v);return v*v*(3-2*v);};
const r2=n=>Number(n.toFixed(2));
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const rect=(x,y,w,h,fill,rx=0,extra='')=>'<rect x="'+r2(x)+'" y="'+r2(y)+'" width="'+r2(w)+'" height="'+r2(h)+'" rx="'+rx+'" fill="'+fill+'" '+extra+'/>';
const line=(x,y,X,Y,color,w=2,extra='')=>'<line x1="'+r2(x)+'" y1="'+r2(y)+'" x2="'+r2(X)+'" y2="'+r2(Y)+'" stroke="'+color+'" stroke-width="'+w+'" '+extra+'/>';
const circ=(x,y,r,fill,stroke='none',sw=0)=>'<circle cx="'+r2(x)+'" cy="'+r2(y)+'" r="'+r2(r)+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+sw+'"/>';
const poly=(d,fill,stroke='none',sw=0,more='')=>'<path d="'+d+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+sw+'" '+more+'/>';
const text=(x,y,s,size=40,fill=C.ink,weight=400,opt={})=>'<text x="'+r2(x)+'" y="'+r2(y)+'" fill="'+fill+'" font-family="'+(opt.family||sans)+'" font-size="'+size+'" font-weight="'+weight+'" text-anchor="'+(opt.anchor||'start')+'" '+(opt.spacing?'letter-spacing="'+opt.spacing+'" ':'')+(opt.italic?'font-style="italic" ':'')+'>'+esc(s)+'</text>';
const eyebrow=(x,y,s,fill=C.muted,size=23)=>text(x,y,s.toUpperCase(),size,fill,700,{spacing:2.6});
const number=(x,y,s,size,fill=C.ink,opt={})=>text(x,y,s,size,fill,400,{family:serif,...opt});
const mon=(x,y,s,size=27,fill=C.ink,opt={})=>text(x,y,s,size,fill,400,{family:mono,...opt});
const group=(s,o=1,extra='')=>o<=0?'':'<g opacity="'+r2(o)+'" '+extra+'>'+s+'</g>';
const move=(s,x=0,y=0)=>'<g transform="translate('+r2(x)+' '+r2(y)+')">'+s+'</g>';
const photo=(img,x,y,w,h,clip,zoom=1,dx=0,dy=0)=>'<g clip-path="url(#'+clip+')"><image x="'+r2(x-(w*(zoom-1))/2+dx)+'" y="'+r2(y-(h*(zoom-1))/2+dy)+'" width="'+r2(w*zoom)+'" height="'+r2(h*zoom)+'" preserveAspectRatio="xMidYMid slice" xlink:href="'+img+'"/></g>';
const footer=(idx,dark=false)=>{const edge=dark?'#93a5b2':'#8c9c98',fg=dark?'#e3e7e1':C.muted;return line(86,983,1834,983,edge,1)+text(88,1020,'Pilot decision workshop',22,fg,600)+text(1833,1020,'L04   /   '+titles[idx],22,fg,600,{anchor:'end'});};
const mast=(label,dark=false)=>eyelet(90,78,dark?C.hot:C.orange)+eyebrow(125,86,label,dark?C.dim:C.muted);
function eyelet(x,y,c){return circ(x,y,9,'none',c,3)+line(x-5,y,x+5,y,c,2);}
function paper(){let a=rect(0,0,1920,1080,C.paper);for(let i=0;i<28;i++){const x=66+(i*1771)%1791,y=130+(i*167)%791;a+=line(x,y,x+8+(i%4),y-.45,'#6d7868',.65,'opacity=".18"');}return a;}
const defs='<defs><clipPath id="whole"><rect width="1920" height="1080"/></clipPath><clipPath id="q-photo"><rect x="0" y="0" width="1920" height="1080"/></clipPath><clipPath id="case-photo"><rect x="0" y="0" width="1920" height="1080"/></clipPath><clipPath id="record-photo"><rect x="1165" y="140" width="666" height="725"/></clipPath><linearGradient id="vignette"><stop stop-color="#09131e" stop-opacity=".88"/><stop offset=".40" stop-color="#0a1723" stop-opacity=".79"/><stop offset=".68" stop-color="#0b1720" stop-opacity=".10"/><stop offset="1" stop-color="#0e1821" stop-opacity=".03"/></linearGradient><linearGradient id="footshade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#0a1720" stop-opacity="0"/><stop offset="1" stop-color="#0a1720" stop-opacity=".77"/></linearGradient><linearGradient id="bluepanel" x2=".9" y2="1"><stop stop-color="#123657"/><stop offset="1" stop-color="#14212e"/></linearGradient><linearGradient id="paperline"><stop stop-color="#e9e2d4"/><stop offset="1" stop-color="#fffdf5"/></linearGradient></defs>';

// Timed captions provide the spoken anchors. Use a proportional fallback for silent storyboard exports.
function cue(scene,words,fallback,progress,seconds){
  const duration=scene.duration||scene.durationFrames/24||scene.sec||0;
  const re=new RegExp(words,'i'),found=(scene.cues||[]).find(c=>re.test(c.text||''));
  if(found&&duration>0)return ease((seconds-found.start+.18)/.75);
  return ease((progress-fallback)/.052);
}
// Several narrated actions can live inside one aligned subtitle. Locate a spoken
// number within that subtitle so the typed expression gets its own screen time.
function spokenPhrase(scene, phrase, fallback, progress, seconds){
  const words=[];
  for(const c of scene.cues||[]){
    const pieces=(c.text.toLowerCase().match(/[a-z0-9]+/g)||[]);
    pieces.forEach((word,index)=>words.push({word,time:c.start+(c.end-c.start)*index/pieces.length}));
  }
  const target=phrase.split(' ');
  for(let k=0;k<=words.length-target.length;k++){
    if(target.every((w,j)=>words[k+j].word===w))return ease((seconds-words[k].time+.05)/.35);
  }
  return ease((progress-fallback)/.052);
}
function ticket(x,y,flagged,color,unit=22){
  let s=rect(x,y,unit,unit,flagged?color:'none',2,'stroke="'+color+'" stroke-width="'+(flagged?1.6:1.2)+'" opacity="'+(flagged?1:.65)+'"');
  if(flagged)s+=line(x+unit*.25,y+unit*.68,x+unit*.71,y+unit*.26,C.white,2.4);
  return s;
}
function cohortSlips(x,y,label,ink,g,shown=1){
  let a=eyebrow(x,y,label,ink,24)+number(x,y+125,String(g.n),134,ink);
  for(let i=0;i<40;i++){const col=i%10,row=Math.floor(i/10);a+=group(rect(x+4+col*30,y+161+row*24,23,17,'none',1,'stroke="'+ink+'" stroke-width="1.5"'),clamp(shown*1.48-i*.012));}
  return a+text(x,y+281,'eligible pull requests',31,ink,600);
}
function question(ctx){
  const {p,sec,s}=ctx, evidence=cue(s,'forty eligible|forty pull|two groups|sample size|each cohort|each group|the baseline and',.43,p,sec);
  let a=photo(room,0,0,1920,1080,'q-photo',1.015+.052*ease(p),-4*ease(p),0)+rect(0,0,1920,1080,'url(#vignette)')+rect(0,770,1920,310,'url(#footshade)');
  a+=mast('Decision workshop / engineering management',true);
  a+=group(number(83,337,'Would you',154,C.white)+number(83,493,'scale this pilot?',150,C.white)+line(92,559,477,559,C.hot,5)+text(92,666,'Decide what a faster review queue',46,C.white,400)+text(92,731,'is worth when rework rises.',46,C.white,400),1-evidence);
  const q=paper()+mast('Eligibility / matched comparison')+number(83,259,'Who enters the scorecard?',107)+cohortSlips(104,394,'Baseline',C.ink,D.baseline,evidence)+cohortSlips(638,394,'Pilot',C.blue,D.pilot,evidence)+line(1156,329,1156,867,C.fine,2)+eyebrow(1218,410,'Count one row per PR',C.orange)+text(1218,521,'Same service',47,C.ink,600)+text(1218,625,'Same eligibility',47,C.ink,600)+text(1218,729,'Same follow-up',47,C.ink,600)+line(1218,555,1760,555,C.fine)+line(1218,658,1760,658,C.fine)+text(104,887,'Public synthetic case',30,C.muted,500);
  return (evidence===1?'':a)+group(q,evidence)+footer(0,evidence<.55);
}

function histogram(x,y,w,h,items,color,draw,centers,sort=1){
  const max=42,bw=w/40;
  let a=line(x,y+h,x+w,y+h,'#9aa7a2',2);
  items.forEach((v,i)=>{
    const hh=(v.v/max)*h*draw, center=i===19||i===20;
    const fill=center?C.orange:color;
    const sourceIndex=Number(v.id.slice(1))-1,rank=sourceIndex+(i-sourceIndex)*sort;
    a+=rect(x+rank*bw+2,y+h-hh,Math.max(1,bw-5),hh,fill,1,'opacity="'+(center?1:.8)+'"');
  });
  const cx=x+19*bw+1;
  a+=group(poly('M'+r2(cx)+' '+r2(y+h+5)+' v15 h'+r2(2*bw-3)+' v-15','none',C.orange,3)+mon(cx+bw,y+h+55,items[19].v+'h + '+items[20].v+'h',25,C.orange,{anchor:'middle'}),centers);
  return a;
}
function waitTime({s,p,sec}){
  const ctx={s,p,sec};
  const median=beat(ctx,'median',.44),interpret=beat(ctx,'interpret',.76);
  const pilot=cue(s,'pilot median is thirteen|median is thirteen|other group',.57,p,sec),threshold=interpret;
  let a=paper()+mast('Measurement / first human review')+number(83,259,interpret>.5?'The wait fell by five hours.':'Find the two middle requests.',103);
  a+=eyebrow(96,352,'Business hours to first review',C.muted,23)+line(96,391,1810,391,C.ink,2);
  const chartX=448,chartW=750;
  a+=eyebrow(101,498,'Baseline',C.ink)+number(95,615,'18 h',108,C.ink)+histogram(chartX,407,chartW,156,D.baseline.wait,'#758894',1,median,median);
  a+=line(96,654,1810,654,C.fine,1)+eyebrow(101,760,'Pilot',C.blue)+group(number(95,871,'13 h',108,C.blue),.22+.78*pilot)+histogram(chartX,667,chartW,156,D.pilot.wait,C.blue,.18+.82*pilot,pilot,median);
  const central=(g,yy)=>g.wait.slice(19,21).map((row,i)=>mon(1330,yy+i*44,(20+i)+'   '+row.id+'    '+row.v+' h',25,C.ink)).join('');
  a+=group(line(1278,432,1278,895,C.fine,2)+eyebrow(1330,470,'Middle ranks',C.orange,21)+central(D.baseline,534)+central(D.pilot,776)+text(1331,881,'Average the pair in each cohort.',25,C.muted,500),(1-threshold)*median);
  a+=group(line(1278,432,1278,895,C.fine,2)+eyebrow(1350,509,'Target',C.teal)+number(1344,625,'≤ 14 h',99,C.teal)+text(1350,755,'Pilot median',35,C.ink,500)+text(1350,812,'meets target.',44,C.teal,700),threshold);
  return a+footer(1);
}

function polar(x,y,r,deg){const a=(deg-90)*Math.PI/180;return [r2(x+r*Math.cos(a)),r2(y+r*Math.sin(a))];}
function arc(x,y,r,a,b){const p1=polar(x,y,r,a),p2=polar(x,y,r,b);return 'M'+p1.join(' ')+' A'+r+' '+r+' 0 '+(b-a>180?1:0)+' 1 '+p2.join(' ');}
function effort({s,p,sec}){
  const pilot=cue(s,'twenty.six|pilot effort|two more|two minutes',.32,p,sec),limit=cue(s,'twenty.seven|limit|under the ceiling',.62,p,sec);
  let a=rect(0,0,1920,1080,'url(#bluepanel)')+mast('Measurement / active human review',true)+number(84,242,'Time spent reviewing',110,C.white);
  const cx=500,cy=643,r=245,lo=16,hi=32,angle=v=>-127+(v-lo)/(hi-lo)*254;
  a+=circ(cx,cy,288,'#233b50','#7791a1',2)+circ(cx,cy,264,'#152735','#b5c4c0',1.5)+poly(arc(cx,cy,r,angle(27),angle(32)),'none',C.hot,9);
  for(let v=16;v<=32;v+=.5){let t=angle(v),major=v%2===0;const q=polar(cx,cy,r-6,t),z=polar(cx,cy,r-(major?28:14),t);a+=line(...q,...z,major?C.white:'#8192a0',major?3:1.6);
    if(major){const [x,y]=polar(cx,cy,r-48,t);a+=text(x,y+10,String(v),25,C.white,500,{anchor:'middle'});}}
  let [nx,ny]=polar(cx,cy,r-79,angle(24+2*pilot));const [tx,ty]=polar(cx,cy,44,angle(24+2*pilot)+180);
  a+=line(tx,ty,nx,ny,C.hot,6,'stroke-linecap="round"')+circ(cx,cy,18,C.white)+circ(cx,cy,8,C.orange)+eyebrow(cx-48,cy+102,'Minutes',C.dim,18);
  a+=eyebrow(898,385,'Median active effort',C.dim)+line(895,422,1814,422,'#718494',1.4);
  a+=text(896,505,'Baseline',42,C.white,600)+number(1777,517,'24 min',71,C.white,{anchor:'end'})+line(896,566,1814,566,'#506575',1.4);
  a+=group(text(896,644,'Pilot',42,C.white,600)+number(1777,657,'26 min',71,C.white,{anchor:'end'}),.24+.76*pilot);
  a+=group(line(896,711,1814,711,'#506575',1.4)+text(896,790,'Limit',42,C.mint,700)+number(1777,803,'≤ 27 min',71,C.mint,{anchor:'end'}),limit);
  a+=text(898,905,'Measure effort separately from queue time.',35,C.dim,400);
  return a+footer(2,true);
}
function qualitySheet(s,p,sec){
  const tally=cue(s,'six of the forty|six of forty|baseline requests',.28,p,sec);
  const answer=cue(s,'seventeen and a half|seventeen point five',.60,p,sec);
  const defects=cue(s,'post.merge|one out of forty in each|defect',.82,p,sec);
  let a=paper()+mast('Quality / material rework')+number(83,249,'What counts as rework?',108);
  a+=group(eyebrow(103,364,'Request P020 · review notes',C.orange)+line(104,399,1818,399,C.ink,2)+
    mon(102,515,'01',37,C.muted)+text(224,516,'“Remove the unrelated formatting edit.”',56,C.ink,500)+
    mon(102,627,'02',37,C.muted)+text(224,626,'Follow-up comment on the same change',41,C.muted,400)+
    mon(102,733,'03',37,C.muted)+text(224,732,'Second follow-up on the same request',41,C.muted,400)+
    line(102,782,1818,782,C.fine)+text(105,878,'One request ID',44,C.ink,700)+text(548,878,'→',56,C.orange,500)+text(658,878,'One material-rework case',44,C.ink,700),1-tally);
  function matrix(g,x,label,accent){
    let z=eyebrow(x,378,label,accent)+line(x,413,x+780,413,accent,2);
    const sorted=[...g.rework,...g.ids.filter(id=>!g.rework.includes(id))];
    sorted.forEach((id,i)=>{const col=i%10,row=Math.floor(i/10),hot=g.rework.includes(id),xx=x+col*67,yy=475+row*63;
      z+=ticket(xx,yy,false,'#647e80',38);if(hot)z+=group(ticket(xx,yy,true,C.orange,38),clamp(tally*1.55-i*.082));});
    z+=number(x,848,g.rework.length+' / '+g.n,91,accent);
    const isPilot=g===D.pilot;z+=group(text(x+345,844,isPilot?'17.5%':'15%',74,isPilot?C.orange:C.teal,700),isPilot?answer:1);
    return z;
  }
  a+=group(matrix(D.baseline,104,'Baseline',C.ink)+matrix(D.pilot,998,'Pilot',C.blue)+
    group(text(998,922,'2.5 percentage points above the 15% ceiling.',31,C.orange,600),answer),tally*(1-defects));
  a+=group(eyebrow(104,374,'Post-merge defects / same follow-up',C.muted)+line(104,413,1818,413,C.ink,2)+
    eyebrow(109,531,'Baseline',C.ink)+number(99,703,'1 / 40',162)+eyebrow(893,531,'Pilot',C.blue)+number(884,703,'1 / 40',162,C.blue)+
    line(104,779,1818,779,C.fine)+text(104,886,'Two events in total. Too little evidence for a trend.',46,C.muted,500),defects);
  return a+footer(3);
}

function cost({s,p,sec}){
  const t1=cue(s,'twenty for|approved workspace',.13,p,sec),t2=cue(s,'one hundred and twenty|training',.22,p,sec);
  const total=spokenPhrase(s,'two hundred and forty',.35,p,sec),cap=cue(s,'agreed cap|three hundred',.52,p,sec),unit=cue(s,'six dollars per request|divide the total',.67,p,sec);
  let a=rect(0,0,1920,1080,'#e5e0d3')+rect(98,54,1727,877,'#d5d1c5')+rect(79,40,1726,877,'url(#paperline)'); 
  a+=line(194,69,194,891,'#e0a79a',2)+line(203,69,203,891,'#e9beb0',1);
  a+=eyebrow(250,114,'Finance ledger / synthetic pilot')+number(242,251,'The cost of forty reviews',101)+line(247,302,1727,302,C.ink,3);
  a+=mon(255,356,'LINE',22,C.muted)+mon(392,356,'INCREMENTAL EXPENSE',22,C.muted)+mon(1147,356,'USD',22,C.muted,{anchor:'end'});
  const names=['Temporary licenses','Remote workspace','Training and enablement'];
  D.spend.forEach((item,i)=>{const y=443+i*91,opacity=[1,t1,t2][i];a+=line(247,y+23,1149,y+23,'#b4bfba',1)+group(mon(257,y,'0'+(i+1),28,C.muted)+text(391,y,names[i],40,C.ink,500)+mon(1141,y,'$'+item.usd,39,C.ink,{anchor:'end'}),.25+.75*opacity);});
  a+=group(line(390,686,1149,686,C.ink,3)+eyebrow(391,752,'Total',C.ink)+number(1142,775,'$'+D.totalUsd,84,C.ink,{anchor:'end'}),total);
  a+=line(1213,323,1213,822,C.fine,2);
  a+=group(eyebrow(1286,391,'Cap / $300',C.teal)+rect(1289,434,395,18,'#c6d1c7',9)+rect(1289,434,395*(240/300)*cap,18,C.teal,9)+text(1286,537,'$60 remaining',46,C.teal,600),cap);
  a+=group(eyebrow(1287,669,'Per eligible PR',C.blue)+number(1281,790,'$6',107,C.blue)+text(1423,783,'per request',32,C.muted,500)+mon(1288,847,'240 ÷ 40 = 6',28,C.blue),unit);
  a+=group(text(250,857,'Reviewer effort is reported separately in minutes.',31,C.muted,500),unit);
  const enter=cue(s,'add the three entries|the total is',.28,p,sec),leave=cue(s,'reviewer labor|pricing that labor',.88,p,sec);
  const show=enter*(1-leave);
  if(show>0){
    const sixty=spokenPhrase(s,'sixty',.56,p,sec),six=spokenPhrase(s,'six dollars per request',.73,p,sec);
    let state='opened',label='Read the three entries',equation='USD in the ledger',answer='';
    if(enter>.42){state='formula';label='Add the entries';equation='100 + 20 + 120';}
    if(total>.28){state='total';label='Incremental spend';equation='100 + 20 + 120';answer='$240';}
    if(sixty>.25){state='headroom';label='Remaining budget';equation='300 − 240';answer='$60';}
    if(six>.29){state='unit';label='Cost per eligible PR';equation='240 ÷ 40';answer='$6';}
    const q=paper()+mast('Working session / original terminal capture')+number(83,233,'Calculate from the ledger.',102)+
           rect(93,299,1139,593,C.navy,8)+rect(106,354,1111,526,'#000',3)+
           mon(122,338,'Xfce Terminal',25,C.dim)+mon(1200,337,'evidence / spend.csv',23,C.dim,{anchor:'end'})+
           '<svg x="126" y="367" width="1069" height="497" viewBox="-5 -3 733 412" preserveAspectRatio="xMinYMin meet"><image x="0" y="0" width="932" height="542" xlink:href="'+terminal[state]+'"/></svg>'+
           line(1288,310,1288,883,C.fine,2)+eyebrow(1340,400,'From the source',C.blue,22)+text(1338,508,label,35,C.ink,600)+
           mon(1339,594,equation,31,C.muted)+number(1331,757,answer,104,C.blue)+text(102,938,'The terminal reads the same public CSV as the editable workbook.',27,C.muted,500);
    a=(show>.999?'':a)+group(q,show);
  }
  return a+footer(4);
}

function caseRecord(s,p,sec){
  const example=cue(s,'read the review reason|the ticket asks|validator fix',.29,p,sec), action=cue(s,'recommend one adjustment|ask authors|intended files',.64,p,sec),four=cue(s,'four of the seven|four of seven',.52,p,sec);
  let a=photo(slips,0,0,1920,1080,'case-photo',1.025+.035*ease(p),-8*ease(p))+rect(0,0,1920,1080,'url(#vignette)');
  a+=group(mast('Decision meeting / evidence check',true)+number(84,294,'Open the seven',107,C.white)+number(84,405,'rework cases.',107,C.white)+
    line(92,472,770,472,'#a1acac',2)+text(96,570,'Wait, effort, spend',41,C.white,600)+text(757,570,'Met',41,C.mint,700,{anchor:'end'})+
    line(94,609,773,609,'#71838c',1)+text(96,685,'Material rework',41,C.white,600)+text(757,685,'Missed',41,C.hot,700,{anchor:'end'})+
    line(94,724,773,724,'#71838c',1)+text(96,800,'Serious incidents',41,C.white,600)+text(757,800,'0',41,C.white,700,{anchor:'end'}),1-example);
  const x=D.scopeExample;
  let z=paper()+mast('Decision meeting / inspect changed files')+number(84,242,'Read the patch behind the count.',94)+
    eyebrow(105,331,'Review '+x.id+' / actual synthetic diff',C.orange)+line(105,365,1805,365,C.ink,2);
  z+=mon(108,441,x.requested,33,C.ink)+text(1758,438,'Requested validator fix',29,C.teal,700,{anchor:'end'})+
    rect(105,466,1699,62,'#eee0d8')+mon(137,509,removedValidator,31,C.orange)+rect(105,531,1699,62,'#d9e7d7')+mon(137,574,addedValidator,31,C.teal);
  z+=mon(108,663,x.unrelated,33,C.ink)+text(1758,659,'Outside the ticket',29,C.orange,700,{anchor:'end'})+
    mon(135,722,originalFormat,29,C.muted)+mon(135,771,expandedFormat,29,C.muted)+text(868,735,'“Remove the unrelated edit before review.”',34,C.ink,500)+line(104,802,1805,802,C.fine,2);
  z+=group(text(110,881,'4 / 7 cases',45,C.orange,700)+mon(440,879,D.pilot.scope.join('  ·  '),30,C.ink),four);
  if(example===1) a='';
  a+=group(z,example*(1-action));
  const record=paper()+photo(slips,1165,140,666,725,'record-photo',1.12+.025*ease(p),-7)+mast('Decision record / scoped retest')+
    number(88,314,'Adjust the pilot.',105,C.blue)+line(93,377,1069,377,C.blue,3)+
    eyebrow(96,456,'One change',C.orange)+text(95,530,'Name the intended files.',51,C.ink,600)+text(95,603,'Check the final diff against that list.',44,C.ink,400)+
    eyebrow(96,732,'Retest',C.orange)+text(95,808,'Same service. Same thresholds.',45,C.ink,600)+text(95,903,'A pattern to investigate; causation is unresolved.',31,C.muted,500);
  a+=group(record,action);
  return a+footer(5,example<.55);
}

function transfer({s,p,sec}){
  const challenge=cue(s,'pause here|what is the rework|largest whole',.40,p,sec);
  let a=rect(0,0,1920,1080,C.deep)+mast('Practice / independent cohort',true)+number(82,250,'Fifty new requests.',111,C.white);
  a+=eyebrow(105,354,'Each mark is one eligible request',C.dim,22);
  for(let i=0;i<50;i++){
    const col=i%10,row=Math.floor(i/10),x=103+col*70,y=416+row*72;
    a+=ticket(x,y,i<D.transfer.rework,i<D.transfer.rework?C.hot:'#96adba',43);
  }
  a+=text(105,854,'8 marked for material rework',40,C.white,600)+text(105,921,'All other thresholds are met by assumption.',29,C.dim,500);
  a+=line(856,330,856,916,'#627788',1.4)+eyebrow(928,361,'Rework ceiling',C.mint)+number(924,482,'15%',114,C.white);
  a+=group(eyebrow(931,587,'Work it out',C.hot)+text(930,663,'1.  What is the rate?',40,C.white,500)+
    text(930,751,'2.  How many cases could pass?',40,C.white,500)+text(930,839,'3.  Which evidence would you open?',40,C.white,500)+line(930,878,930+476*challenge,878,'#8b9cab',2),challenge);
  return a+footer(6,true);
}
function debrief({s,p,sec}){
  const next=cue(s,'would you prescribe|we have only a count|read the review requests',.28,p,sec),close=cue(s,'a defensible update|eight of fifty requests needed|short update',.73,p,sec);
  let a=paper()+mast('Debrief / whole-number ceiling')+number(84,253,'Seven is the last passing count.',92);
  a+=eyebrow(109,369,'With 50 eligible requests',C.muted)+line(109,403,1808,403,C.ink,2);
  const left=129,right=1240,axis=755;
  const px=v=>left+(v-10)*(right-left)/10;
  a+=line(left,axis,right,axis,C.ink,3);
  for(let v=10;v<=20;v++){const xp=px(v);a+=line(xp,axis-3,xp,axis+17,C.ink,2)+mon(xp,axis+60,v+'%',22,C.muted,{anchor:'middle'});}
  const ceiling=px(15);a+=line(ceiling,471,ceiling,axis,C.orange,3,'stroke-dasharray="9 10"')+eyebrow(ceiling-77,457,'15% limit',C.orange,21);
  a+=line(px(14),623,px(14),axis,C.teal,5)+circ(px(14),axis,11,C.teal)+text(px(14)-28,594,'7 / 50',51,C.teal,700,{anchor:'end'})+text(px(14)-29,650,'14% · meets',30,C.teal,600,{anchor:'end'});
  a+=line(px(16),622,px(16),axis,C.orange,5)+circ(px(16),axis,11,C.orange)+text(px(16)+28,594,'8 / 50',51,C.orange,700)+text(px(16)+29,650,'16% · misses',30,C.orange,600);
  a+=line(1340,468,1340,842,C.fine,2)+eyebrow(1390,535,'Maximum',C.teal)+number(1387,678,'7',144,C.teal)+text(1389,755,'whole cases',42,C.ink,600)+mon(1390,827,'50 × 0.15 = 7.5',25,C.muted);
  let n=paper()+mast('Debrief / choose the next evidence')+number(83,249,'A rate cannot name the cause.',102)+eyebrow(105,378,'Next evidence',C.blue)+
       mon(102,481,'8 review requests',47,C.ink)+line(109,526,1061,526,C.fine,2)+mon(102,624,'8 corresponding diffs',47,C.ink)+
       line(109,670,1061,670,C.fine,2)+text(104,808,'Look for a documented, correctable pattern.',42,C.ink,600)+
       rect(1168,338,638,515,C.navy)+eyebrow(1217,414,'Decision',C.mint)+text(1216,517,'Pattern found?',52,C.white,600)+text(1217,603,'Try one change and retest.',34,C.white,400)+
       line(1217,667,1750,667,'#5a7180',1)+text(1216,752,'Cause still unclear?',39,C.white,600)+text(1217,809,'Investigate the cases.',34,C.white,400);
  a+=group(n,next*(1-close));
  const end=photo(room,0,0,1920,1080,'q-photo',1.13+.018*ease(p),10)+rect(0,0,1920,1080,'url(#vignette)')+mast('Decision meeting / final update',true)+
       number(84,316,'Hold expansion.',111,C.white)+line(94,399,831,399,C.hot,4)+text(95,503,'Eight of fifty requests needed rework,',43,C.white,500)+
       text(95,567,'above the agreed limit.',43,C.white,500)+text(95,731,'Examine those eight cases before',43,C.white,500)+text(95,794,'choosing the next intervention.',43,C.white,500);
  return a+group(end,close)+footer(7,close>.5);
}
function beat(ctx,id,defaultStart){
  const found=(ctx.s.beats||[]).find(b=>b.id===id);
  const start=found&&Number.isFinite(found.start)?found.start:found&&Number.isFinite(found.startFrame)?found.startFrame/24:null;
  return start!==null?ease((ctx.sec-start+.09)/.7):ease((ctx.p-defaultStart)/.045);
}
function queueClock(ctx){
  const {s,p,sec}=ctx,ack=cue(s,'bot check|quick acknowledgment',.13,p,sec), stop=cue(s,'working hours|use working',.20,p,sec);
  const events=D.scopeExample.clockEvents;
  let a=paper()+mast('Wait measurement / request '+D.scopeExample.id)+number(82,249,'When does the clock stop?',104);
  a+=eyebrow(105,374,'Example business calendar · 09:00–17:00',C.blue)+line(105,407,1811,407,C.ink,2);
  const x=[126,600,1091,1744],labels=['Marked ready','Bot check','Acknowledged','Human review'],sub=['Start','Clock keeps running','Clock keeps running','Examines the change'];
  a+=line(x[0],597,x[3],597,'#b3bcb8',4)+line(x[0],597,x[1]+(x[3]-x[1])*ack,597,C.blue,5);
  x.forEach((xx,i)=>{const on=i===0?1:i===3?.25+.75*stop:.23+.77*ack,anch=i===3?'end':'start',labelcolor=i===0?C.blue:i===3?C.teal:C.muted;
    a+=group(circ(xx,597,13,i===0||i===3?labelcolor:C.paper,labelcolor,3)+text(xx,542,events[i].when,33,C.ink,700,{anchor:anch})+text(xx,689,labels[i],i===2?38:40,labelcolor,700,{anchor:anch})+text(xx,745,sub[i],28,C.muted,500,{anchor:anch}),on);});
  a+=group(eyebrow(103,856,'One example request',C.muted)+text(555,856,D.scopeExample.hours+' business hours elapsed',38,C.blue,700),stop);
  return a+footer(1);
}
function effortReport(){
  const a=paper()+mast('Interpretation / separate the measures')+number(84,248,'A shorter queue. More review work.',88)+
    eyebrow(106,381,'Observed in these cohorts',C.muted)+line(104,414,1809,414,C.ink,2)+
    text(105,541,'Wait to first review',45,C.ink,600)+number(996,554,'18 h → 13 h',71,C.blue)+
    line(104,594,1809,594,C.fine)+text(105,702,'Active reviewer effort',45,C.ink,600)+number(996,718,'24 min → 26 min',71,C.orange)+
    line(104,756,1809,756,C.fine)+text(105,870,'Staffing and change mix are possible explanations to investigate.',36,C.muted,500);
  return a+footer(2);
}
function questionRule(){
  return paper()+mast('Decision agreement / set before the pilot')+number(83,249,'What must clear before expansion?',90)+
    eyebrow(103,367,'Eligible comparison',C.muted)+eyebrow(1008,367,'Agreed thresholds',C.blue)+line(104,401,1817,401,C.ink,2)+
    text(106,510,'40 baseline / 40 pilot',54,C.ink,600)+text(105,601,'One row per pull request.',39,C.ink,500)+
    text(105,693,'Same service and eligibility.',39,C.ink,500)+text(105,784,'Same post-merge follow-up.',39,C.ink,500)+
    line(930,441,930,856,C.fine,2)+
    [['Wait','≤ 14 h'],['Effort','≤ 27 min'],['Rework','≤ 15%'],['Spend','≤ $300']].map((v,i)=>text(1009,505+i*87,v[0],38,C.muted,600)+text(1753,505+i*87,v[1],44,C.blue,700,{anchor:'end'})+line(1008,529+i*87,1757,529+i*87,C.fine,1)).join('')+
    text(105,901,'Require the time benefit and every guardrail.',35,C.teal,700)+footer(0);
}
function sceneFrame(ctx){
  switch(ctx.id){
    case 'question':{const b=beat(ctx,'rule',.76);return b===1?questionRule():question(ctx)+group(questionRule(),b);}
    case 'wait':{const b=beat(ctx,'median',.44);return (b===1?'':queueClock(ctx))+group(waitTime(ctx),b);}
    case 'effort':{const b=beat(ctx,'report',.71);return (b===1?'':effort(ctx))+group(effortReport(),b);}
    case 'quality':return qualitySheet(ctx.s,ctx.p,ctx.sec);
    case 'cost':return cost(ctx);
    case 'decision':return caseRecord(ctx.s,ctx.p,ctx.sec);
    case 'transfer':return transfer(ctx);
    case 'debrief':return debrief(ctx);
    default:throw new Error('Unknown L04 scene '+ctx.id);
  }
}
function frame({scene,progress=0,seconds=0,index=0,episode={}}){
  const s=typeof scene==='string'?{id:scene}:scene || (episode.scenes||[])[index]||{id:ids[index]};
  const p=clamp(Number(progress)||0),sec=Math.max(0,Number(seconds)||0),id=s.id||ids[index];
  return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1920" height="1080" viewBox="0 0 1920 1080" role="img" aria-label="'+esc('Pilot decision workshop: '+(s.title||id))+'">'+defs+sceneFrame({s,p,sec,id})+'</svg>';
}
module.exports={frame,ids};
