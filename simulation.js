/* simulation.js
   Protocol engine only: no DOM code here.
   simulate(config) runs a discrete-event simulation of One-Bit SW, Go-Back-N or Selective Repeat
   and returns packets, log lines, window history and the final statistics. */

const GAP=20; // ms between two frames leaving the sender

/* Deterministic loss decision: same (seed, kind, seq, attempt) always gives the same number */
function rnd(s,a,b,c){let h=s^Math.imul(a+1,0x9E3779B1)^Math.imul(b+7,0x85EBCA6B)^Math.imul(c+13,0xC2B2AE35);
 h=Math.imul(h^(h>>>16),0x45d9f3b);h=Math.imul(h^(h>>>16),0x45d9f3b);h^=h>>>16;return(h>>>0)/4294967296}

/* Discrete-event simulation. Returns everything needed for animation and statistics. */
function simulate(c){
 const N=c.proto==='sw'?1:c.N,T=c.total;
 const pk=[],log=[],marks=[],st=[],rv=[],win=[{t:0,base:0}];
 const q=[];let qn=0,base=0,next=0,free=0,tok=0,sends=0,retx=0,fl=0,as=0,al=0,ar=0,end=0,exp=0,rb=0;
 const acked=Array(T).fill(false),cnt=Array(T).fill(0),gen=Array(T).fill(0),ac=Array(T).fill(0),buf=Array(T).fill(false);
 const push=(t,type,d={})=>q.push({t,type,n:qn++,...d});
 const L=(t,m,k)=>log.push({t,m,k});
 function sendF(s,t){
  const at=Math.max(t,free);free=at+GAP;
  const r=cnt[s]++>0;sends++;if(r)retx++;
  const lost=rnd(c.seed,0,s,cnt[s]-1)<c.pl/100;if(lost)fl++;
  pk.push({k:'f',s,t0:at,t1:at+c.tx,lost,r});
  st.push({t:at,s,v:r?'r':'s'});
  L(at,(r?'Retransmit':'Send')+' Frame '+s+(lost?' (lost in transit)':''),lost?'er':r?'rt':'fr');
  if(!lost)push(at+c.tx,'F',{s});
  if(c.proto==='gbn'){if(s===base){tok++;push(at+c.to,'T',{tok})}}
  else push(at+c.to,'T',{s,g:++gen[s]});
 }
 function sendA(k,t){
  as++;const lost=rnd(c.seed,1,k,ac[k]++)<c.al/100;if(lost)al++;
  pk.push({k:'a',s:k,t0:t,t1:t+c.ack,lost});
  L(t,'Receiver sends ACK '+k+(lost?' (lost in transit)':''),lost?'er':'mu');
  if(!lost)push(t+c.ack,'A',{k});
 }
 function fill(t){while(next<base+N&&next<T){sendF(next,t);next++}win.push({t,base})}
 fill(0);
 while(q.length&&base<T&&sends<5000){
  q.sort((a,b)=>a.t-b.t||a.n-b.n);const e=q.shift(),t=e.t;
  if(e.type==='F'){
   const s=e.s;
   if(c.proto==='sr'){
    if(s<rb){L(t,'Receiver: duplicate Frame '+s+', ACK again','mu');sendA(s,t)}
    else{buf[s]=true;rv.push({t,s});L(t,'Receiver: got Frame '+s+(s>rb?' (buffered, out of order)':''),'ok');sendA(s,t);while(buf[rb])rb++}
   }else if(s===exp){exp++;rv.push({t,s});L(t,'Receiver: accepted Frame '+s,'ok');sendA(s,t)}
   else{L(t,'Receiver: discarded Frame '+s+' (expected '+exp+')','er');if(exp>0)sendA(exp-1,t)}
  }else if(e.type==='A'){
   const k=e.k;ar++;L(t,'Sender: ACK '+k+' received','ok');
   if(c.proto==='sr'){if(!acked[k]){acked[k]=true;st.push({t,s:k,v:'a'})}while(base<T&&acked[base])base++}
   else if(k>=base){for(let i=base;i<=k;i++){acked[i]=true;st.push({t,s:i,v:'a'})}base=k+1;tok++;if(base<next)push(t+c.to,'T',{tok})}
   if(base>=T){end=t;win.push({t,base});break}
   fill(t);
  }else{
   if(c.proto==='gbn'){
    if(e.tok!==tok||base>=next)continue;
    marks.push({t,l:'T/O F'+base});L(t,'Timeout: go back to Frame '+base+', resend '+base+' to '+(next-1),'rt');
    for(let i=base;i<next;i++)sendF(i,t);
   }else{
    if(acked[e.s]||gen[e.s]!==e.g)continue;
    marks.push({t,l:'T/O F'+e.s});L(t,'Timeout: Frame '+e.s+' unacknowledged','rt');sendF(e.s,t);
   }
  }
 }
 const fail=base<T;if(fail)end=q.length?q[0].t:0;
 log.sort((a,b)=>a.t-b.t);
 const secs=end/1000;
 return{c,N,pk,log,marks,st,rv,win,end,fail,stats:{sends,retx,fl,al,ar,as,time:end,fps:T/secs,thr:Math.min(100,T*GAP/end*100),eff:T/sends*100}};
}