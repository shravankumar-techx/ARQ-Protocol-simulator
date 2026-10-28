/* app.js
   User interface: reads the form, animates the result of simulate(), draws the diagram,
   fills the log, results and comparison. Needs simulation.js to be loaded first. */

const $=id=>document.getElementById(id);
const LOSTF=.6; // a lost packet travels 60% of the way, then shows an X
const NAMES={sw:'One-Bit SW',gbn:'Go-Back-N',sr:'Selective Repeat'};
const C={fr:'#2563eb',rt:'#d97706',er:'#dc2626',ok:'#059669',mu:'#5d6b88',gr:'#e4ebf7',ink:'#12203a'};

/* ---------- UI ---------- */
let SIM=null,now=0,playing=false,last=0,logIdx=0,sig='',dpr=1,SC=.32;
const cv=$('cv'),ctx=cv.getContext('2d'),tl=$('tl');
const val=id=>+$(id).value;
function cfg(proto){
 const cl=(v,a,b)=>Math.min(b,Math.max(a,v||a));
 return{proto,N:cl(val('N'),1,16),total:cl(val('total'),1,60),tx:cl(val('tx'),10,2000),ack:cl(val('ack'),10,2000),pl:cl(val('pl'),0,90),al:cl(val('al'),0,90),to:cl(val('to'),50,10000),seed:Math.floor(val('seed'))||0};
}
const proto=()=>document.querySelector('input[name=p]:checked').value;
function hint(){
 $('N').disabled=proto()==='sw';
 const rtt=val('tx')+val('ack'),h=$('hint');
 h.className='hint'+(val('to')<=rtt?' warn':'');
 h.textContent='Round trip time: '+rtt+' ms. '+(val('to')<=rtt?'Timeout is not above the round trip time, so expect premature retransmissions.':'Timeout leaves '+(val('to')-rtt)+' ms of slack.');
}
document.querySelectorAll('input').forEach(i=>i.addEventListener('input',hint));hint();

function setupCanvas(){
 if(!SIM)return;
 dpr=Math.min(window.devicePixelRatio||1,2);
 SC=Math.min(.32,7500/Math.max(SIM.end,1));
 const w=tl.clientWidth,h=Math.max(440,SIM.end*SC+90);
 cv.width=w*dpr;cv.height=h*dpr;cv.style.height=h+'px';
 ctx.setTransform(dpr,0,0,dpr,0,0);
}
const Y=t=>56+t*SC;
function draw(){
 if(!SIM)return;
 const w=tl.clientWidth,h=cv.height/dpr,xs=72,xr=w-72;
 ctx.clearRect(0,0,w,h);
 ctx.font='11px system-ui';ctx.textBaseline='middle';
 const step=SIM.end>6000?1000:SIM.end>2500?500:200;
 for(let t=0;t<=SIM.end+step;t+=step){
  const y=Y(t);ctx.strokeStyle=C.gr;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();
  ctx.fillStyle='#9aa8c4';ctx.textAlign='left';ctx.fillText(t+' ms',4,y-7);
 }
 ctx.strokeStyle=C.ink;ctx.lineWidth=2;
 [xs,xr].forEach(x=>{ctx.beginPath();ctx.moveTo(x,36);ctx.lineTo(x,h-10);ctx.stroke()});
 ctx.fillStyle=C.ink;ctx.font='600 13px system-ui';ctx.textAlign='center';
 ctx.fillText('Sender',xs,18);ctx.fillText('Receiver',xr,18);ctx.font='11px system-ui';
 for(const p of SIM.pk){
  if(p.t0>now)continue;
  const fr=(now-p.t0)/(p.t1-p.t0),f=Math.min(fr,p.lost?LOSTF:1),ft=p.k==='f';
  const a=ft?xs:xr,b=ft?xr:xs,x1=a+(b-a)*f,y0=Y(p.t0),y1=Y(p.t0+(p.t1-p.t0)*f);
  const col=p.lost?C.er:!ft?C.ok:p.r?C.rt:C.fr;
  ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=2;ctx.setLineDash(ft?[]:[6,4]);
  ctx.beginPath();ctx.moveTo(a,y0);ctx.lineTo(x1,y1);ctx.stroke();ctx.setLineDash([]);
  if(p.lost&&fr>=LOSTF){ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x1-6,y1-6);ctx.lineTo(x1+6,y1+6);ctx.moveTo(x1+6,y1-6);ctx.lineTo(x1-6,y1+6);ctx.stroke()}
  else if(fr<1){ctx.beginPath();ctx.arc(x1,y1,4,0,7);ctx.fill()}
  ctx.fillStyle=col;ctx.textAlign=ft?'right':'left';ctx.fillText(ft?'F'+p.s:'ACK '+p.s,a+(ft?-9:9),y0);
 }
 for(const m of SIM.marks){if(m.t>now)continue;
  const y=Y(m.t);ctx.fillStyle=C.rt;ctx.beginPath();ctx.arc(xs,y,5,0,7);ctx.fill();ctx.textAlign='right';ctx.fillText(m.l,xs-10,y+12)}
 ctx.strokeStyle='#1d4ed855';ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(0,Y(now));ctx.lineTo(w,Y(now));ctx.stroke();ctx.setLineDash([]);
}

function chips(){
 const n=SIM.c.total;let a='',b='';
 for(let i=0;i<n;i++){a+='<i>'+i+'</i>';b+='<i>'+i+'</i>'}
 $('sch').innerHTML=a;$('rch').innerHTML=b;sig='';
}
function updChips(){
 const n=SIM.c.total,S=Array(n).fill(''),R=Array(n).fill('');
 for(const e of SIM.st)if(e.t<=now)S[e.s]=e.v;
 for(const e of SIM.rv)if(e.t<=now)R[e.s]='a';
 let base=0;for(const w of SIM.win)if(w.t<=now)base=w.base;
 const s=S.join('')+'|'+R.join('')+base;if(s===sig)return;sig=s;
 const sc=$('sch').children,rc=$('rch').children;
 for(let i=0;i<n;i++){sc[i].className=(S[i]||'')+(i>=base&&i<base+SIM.N?' w':'');rc[i].className=R[i]}
}
function updLog(){
 const el=$('log');let add=false;
 while(logIdx<SIM.log.length&&SIM.log[logIdx].t<=now){
  const e=SIM.log[logIdx++],d=document.createElement('div');
  d.className='k-'+e.k;d.textContent=Math.round(e.t)+' ms  '+e.m;el.appendChild(d);add=true;
 }
 if(add)el.scrollTop=el.scrollHeight;
}
function render(){
 draw();updChips();updLog();$('clock').textContent=Math.min(Math.round(now),Math.round(SIM.end))+' ms';
 if(playing)tl.scrollTop=Math.max(0,Y(now)-tl.clientHeight*.7);
}
function loop(ts){
 if(!playing)return;
 const dt=Math.min(ts-last,60);last=ts;now=Math.min(SIM.end+60,now+dt*val('speed'));render();
 if(now>=SIM.end+60){playing=false;finish()}else requestAnimationFrame(loop);
}
function btn(){
 $('pause').disabled=!SIM||now>=SIM.end+60;$('skip').disabled=$('pause').disabled;$('reset').disabled=!SIM;
 $('pause').textContent=playing?'Pause':'Resume';
}
function finish(){
 const s=SIM.stats;
 const card=(l,v)=>'<div class="stat"><span>'+l+'</span><b>'+v+'</b></div>';
 $('res').innerHTML=(SIM.fail?'<p class="hint warn">The run stopped early: the link was too lossy to finish all frames.</p>':'')+
  '<p style="margin:0 0 8px"><b>'+NAMES[SIM.c.proto]+'</b>, window '+SIM.N+', '+SIM.c.total+' frames</p><div class="stats">'+
  card('Total frames transmitted',s.sends)+card('Retransmissions',s.retx)+card('Packets lost (frames)',s.fl)+card('ACKs received',s.ar+' of '+s.as)+
  card('Total transmission time',s.time+' ms')+card('Throughput',s.thr.toFixed(1)+'%<small style="font:12px system-ui;color:#5d6b88"> ('+s.fps.toFixed(1)+' fps)</small>')+
  card('Efficiency',s.eff.toFixed(1)+'%')+card('ACKs lost',s.al)+'</div>';
 compare();btn();
}
function compare(){
 const R=['sw','gbn','sr'].map(p=>simulate(cfg(p)));
 const row=(l,f,best)=>{const v=R.map(r=>f(r.stats)),m=best==='min'?Math.min(...v):Math.max(...v);
  return'<tr><td>'+l+'</td>'+v.map((x,i)=>'<td class="'+(x===m?'best':'')+'">'+(Number.isInteger(x)?x:x.toFixed(1))+'</td>').join('')+'</tr>'};
 $('ctab').innerHTML='<tr><th></th>'+R.map(r=>'<th>'+NAMES[r.c.proto]+'</th>').join('')+'</tr>'+
  row('Frames transmitted',s=>s.sends,'min')+row('Retransmissions',s=>s.retx,'min')+row('Frames lost',s=>s.fl,'min')+row('Total time (ms)',s=>s.time,'min')+
  row('Throughput (%)',s=>s.thr,'max')+row('Efficiency (%)',s=>s.eff,'max');
 const mx=Math.max(...R.map(r=>r.stats.thr),1);
 $('bars').innerHTML=R.map(r=>'<div><span style="background:transparent;height:auto">'+NAMES[r.c.proto]+'</span><span style="width:'+(r.stats.thr/mx*100)+'%"></span><b>'+r.stats.thr.toFixed(1)+'%</b></div>').join('');
 const pad=n=>(n+' ').padEnd(17,' ');
 $('ctxt').textContent='PROTOCOL COMPARISON\n\n'+R.map(r=>pad(NAMES[r.c.proto])+': Retransmissions: '+r.stats.retx).join('\n')+
  '\n\nThroughput:\n\n'+R.map(r=>pad(NAMES[r.c.proto])+': '+r.stats.thr.toFixed(1)+'%').join('\n');
 $('cmpCard').hidden=false;
}
function start(){
 SIM=simulate(cfg(proto()));now=0;logIdx=0;$('log').innerHTML='';
 $('res').innerHTML='<div class="empty">Simulation running…</div>';$('cmpCard').hidden=true;
 chips();setupCanvas();tl.scrollTop=0;render();
 playing=true;last=performance.now();btn();requestAnimationFrame(loop);
}
$('start').onclick=start;
$('cmp').onclick=()=>{compare();$('cmpCard').scrollIntoView({behavior:'smooth'})};
$('rnd').onclick=()=>{$('seed').value=Math.floor(Math.random()*9000)+1};
$('pause').onclick=()=>{playing=!playing;if(playing){last=performance.now();requestAnimationFrame(loop)}btn()};
$('skip').onclick=()=>{if(!SIM)return;now=SIM.end+60;playing=false;render();finish()};
$('reset').onclick=()=>{if(!SIM)return;SIM=null;playing=false;now=0;$('log').innerHTML='';$('sch').innerHTML=$('rch').innerHTML='';
 ctx.clearRect(0,0,cv.width,cv.height);cv.style.height='0';$('clock').textContent='0 ms';$('res').innerHTML='<div class="empty">Run a simulation to see the statistics for the chosen protocol.</div>';$('cmpCard').hidden=true;btn()};
addEventListener('resize',()=>{if(SIM){setupCanvas();draw()}});