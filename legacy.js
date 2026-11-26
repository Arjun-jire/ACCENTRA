

(function(){
/*PURE*/
const SL=[[4e5,0],[8e5,.05],[12e5,.10],[16e5,.15],[2e6,.20],[2.4e6,.25],[Infinity,.30]];
function slabTax(t){let prev=0,tot=0;const rows=[];for(const [u,r] of SL){const a=Math.max(0,Math.min(t,u)-prev);rows.push({from:prev,to:u,r,a,tax:a*r});tot+=a*r;prev=u;if(t<=u)break;}return{tot,rows};}
function taxFull(t){
 const s=slabTax(t);let base=s.tot,rebate=0;
 if(t<=12e5){rebate=Math.min(base,60000);base-=rebate;}
 else if(base>t-12e5){rebate=base-(t-12e5);base=t-12e5;} // marginal relief just above ₹12L
 let sur=0;
 for(const [T,rt,pr] of [[2e7,.25,.15],[1e7,.15,.10],[5e6,.10,0]]){
  if(t>T){sur=base*rt;const allowed=slabTax(T).tot*(1+pr)+(t-T);if(base+sur>allowed)sur=Math.max(0,allowed-base);break;}}
 const cess=.04*(base+sur);return{s,rebate,base,sur,cess,total:base+sur+cess};
}
function pmt(P,i,n){return i===0?P/n:P*i/(1-Math.pow(1+i,-n));}
function sim(P,N,r0,rc,lumps,pm,pa,mode){
 let B=P,r=r0,emi=pmt(P,r0/1200,N),recalc=false,m=0,tI=0;const rows=[],rcM={},lM={};
 rc.forEach(x=>rcM[x.m]=x.r);lumps.forEach(x=>lM[x.m]=(lM[x.m]||0)+x.a);
 while(B>0.5&&m<1200){m++;
  if(rcM[m]!==undefined){r=rcM[m];recalc=true;}
  if(mode==='emi'&&recalc&&m>1)emi=pmt(B,r/1200,Math.max(1,N-m+1));
  recalc=false;
  const i=B*r/1200;let pay=Math.min(emi,B+i);if(mode==='emi'&&m>=N)pay=B+i;
  const pr=pay-i;let pre=(lM[m]||0)+pm+(m%12===0?pa:0);pre=Math.min(pre,Math.max(0,B-pr));
  const close=Math.max(0,B-pr-pre);tI+=i;rows.push({m,open:B,emi:pay,pre,i,pr,close});B=close;
  if(pre>0&&mode==='emi')recalc=true;}
 return{rows,tI,months:m,neg:B>0.5};
}
function sipSim(S,L,r,y,su){let inv=L,v=L,s=S;const i=r/1200,rows=[];for(let yr=1;yr<=y;yr++){for(let k=0;k<12;k++){v=(v+s)*(1+i);inv+=s;}rows.push({yr,inv,v,gain:v-inv,s});s*=1+su/100;}return rows;}
function acct(dep,timing,rate,dy,yrs){const w={apr:1,mon:78/144,mar:1/12}[timing];let b=0,inv=0;const rows=[];for(let y=1;y<=yrs;y++){const d=y<=dy?dep:0,it=rate/100*(b+d*w),c=b+d+it;inv+=d;rows.push({y,open:b,d,it,c,inv});b=c;}return rows;}
function fvm(a,rate,y){const i=rate/1200,n=12*y;return i?a*(Math.pow(1+i,n)-1)/i*(1+i):a*n;}
function gstCalc(o){const day=86400000,d=Math.max(0,Math.round((o.file-o.due)/day));const rate=o.nil?20:50,cap=o.nil?500:[2000,5000,10000][o.turn];const fee=Math.min(d*rate,cap);
 const pd=o.pay?Math.max(0,Math.round((o.pay-o.due)/day)):0;const int=o.type==='3b'&&o.tax>0?o.tax*.18*pd/365:0;return{d,fee,half:fee/2,int,pd,capHit:d*rate>=cap&&d>0,total:fee+int};}
/*ENDPURE*/

const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const inr=n=>'₹'+Math.round(n).toLocaleString('en-IN');
const inr2=n=>'₹'+n.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const Lk=n=>{const a=Math.abs(n);return a>=1e7?'₹'+(+(n/1e7).toFixed(2))+' Cr':a>=1e5?'₹'+(+(n/1e5).toFixed(2))+' L':null;};
const big=n=>inr(n)+(Lk(n)?'<small>'+Lk(n)+'</small>':'');
const yrmo=m=>Math.floor(m/12)+' yr '+(m%12)+' mo';
const tiles=a=>'<div class="fc-tiles">'+a.map(x=>'<div class="fc-t'+(x[2]?' hl':'')+'"><span>'+x[0]+'</span><b>'+x[1]+'</b></div>').join('')+'</div>';
const table=(h,rows,id)=>'<div class="fc-tw"><table class="fc-tbl"'+(id?' id="'+id+'"':'')+'><thead><tr>'+h.map(x=>'<th scope="col">'+x+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr'+(r.sum?' class="fc-sum"':'')+'>'+(r.c||r).map(x=>'<td>'+x+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
function F(id,label,o){const{min=0,max=1e10,smax=max,step=1,v=0,pre='',suf=''}=o;
 return '<div class="fc-f"><label for="'+id+'">'+label+'</label><div class="fc-in">'+(pre?'<span>'+pre+'</span>':'')+'<input type="number" inputmode="decimal" id="'+id+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+v+'" data-min="'+min+'" data-max="'+max+'"'+(pre==='₹'?' data-m="1"':'')+'>'+(suf?'<span>'+suf+'</span>':'')+'</div><input type="range" data-r="'+id+'" min="'+min+'" max="'+smax+'" step="'+step+'" value="'+Math.min(v,smax)+'" aria-label="'+label+' slider"><div class="fc-hint" id="'+id+'-h"></div></div>';}
function N(id){const e=$('#'+id),mn=+e.dataset.min,mx=+e.dataset.max;let x=parseFloat(e.value);const bad=isNaN(x)||x<mn||x>mx;e.closest('.fc-in').classList.toggle('fc-bad',bad);if(isNaN(x))x=mn;x=Math.min(mx,Math.max(mn,x));const h=$('#'+id+'-h');if(h)h.textContent=bad?'Enter a value between '+mn.toLocaleString('en-IN')+' and '+mx.toLocaleString('en-IN'):(e.dataset.m&&Lk(x)?'= '+Lk(x):'');return x;}
const sel=(id,label,opts,v)=>'<div class="fc-f"><label for="'+id+'">'+label+'</label><select id="'+id+'">'+opts.map(o=>'<option value="'+o[0]+'"'+(o[0]===v?' selected':'')+'>'+o[1]+'</option>').join('')+'</select></div>';
const out=(id,h)=>{$('#'+id).innerHTML=h;};

/* ---------- Panels ---------- */
const P={};
P.tax='<div class="fc-grid"><div class="fc-card"><h2>Income details</h2>'+F('ti-g','Gross annual income',{max:1e10,smax:5e7,step:10000,v:1500000,pre:'₹'})+sel('ti-t','Taxpayer type',[['s','Salaried / Pensioner (₹75,000 standard deduction)'],['n','Non-salaried (no standard deduction)']],'s')+'<p class="fc-note">New Tax Regime, FY 2026-27 (AY 2027-28), resident individual, all income treated as normal slab income. Employer-side items (PF, professional tax) are not modelled.</p></div><div class="fc-card" id="ti-o"></div></div>';
function calcTax(){const g=N('ti-g'),sal=$('#ti-t').value==='s',sd=sal?Math.min(75000,g):0,t=Math.max(0,g-sd),r=taxFull(t);
 const Ls=n=>n>=1e7?'₹'+(+(n/1e7).toFixed(2))+' Cr':n>=1e5?'₹'+(+(n/1e5).toFixed(2))+' L':inr(n);
 const rows=r.s.rows.map(x=>[x.to===Infinity?'Above '+Ls(x.from):Ls(x.from)+' – '+Ls(x.to),(x.r*100)+'%',inr(x.a),inr(x.tax)]);
 rows.push({sum:1,c:['Tax on slabs','','',inr(r.s.tot)]});
 if(r.rebate>0)rows.push(['Less: Section 87A rebate'+(t>12e5?' (marginal relief)':''),'','','− '+inr(r.rebate)]);
 if(r.sur>0)rows.push(['Surcharge','','',inr(r.sur)]);
 rows.push(['Health &amp; Education Cess','4%','',inr(r.cess)]);
 rows.push({sum:1,c:['Total tax payable','','',inr(r.total)]});
 out('ti-o',tiles([['Net taxable income',big(t)],['Total tax payable',big(r.total),1],['Effective tax rate',(g?r.total/g*100:0).toFixed(2)+'%'],['Monthly take-home (est.)',big((g-r.total)/12)]])+(sal&&g>0?'<p class="fc-note">Standard deduction applied: '+inr(sd)+'.</p>':'')+'<h3>Slab-wise breakdown</h3>'+table(['Slab','Rate','Income in slab','Tax'],rows));}

const rowHtml=k=>k==='hl-rc'?'<div class="fc-row"><label>From month<input type="number" class="rc-m" min="2" max="1200" value="61"></label><label>New rate % p.a.<input type="number" class="rc-r" min="1" max="30" step="0.05" value="9"></label><button type="button" class="fc-x" data-del aria-label="Remove">✕</button></div>':'<div class="fc-row"><label>In month<input type="number" class="lp-m" min="1" max="1200" value="24"></label><label>Amount (₹)<input type="number" class="lp-a" min="1" step="10000" value="200000"></label><button type="button" class="fc-x" data-del aria-label="Remove">✕</button></div>';
P.loan='<div class="fc-grid"><div class="fc-card"><h2>Loan details</h2>'+F('hl-p','Loan amount',{min:10000,max:1e10,smax:5e7,step:10000,v:5000000,pre:'₹'})+'<div class="fc-two"><div>'+F('hl-t','Tenure',{min:1,max:30,step:1,v:20})+'</div>'+sel('hl-u','Unit',[['y','Years'],['m','Months']],'y')+'</div>'+F('hl-r','Initial interest rate (floating)',{min:1,max:30,smax:15,step:.05,v:8.5,suf:'% p.a.'})
+sel('hl-mode','After prepayment / rate change',[['tenure','Reduce tenure (keep EMI)'],['emi','Reduce EMI (keep tenure)']],'tenure')
+'<div class="fc-sec"><span class="fc-lbl">Floating rate changes</span><div id="hl-rc"></div><button type="button" class="fc-add" data-add="hl-rc">+ Add rate change</button></div>'
+'<div class="fc-sec"><span class="fc-lbl">Lump-sum prepayments</span><div id="hl-lp"></div><button type="button" class="fc-add" data-add="hl-lp">+ Add prepayment</button></div>'
+'<div class="fc-sec"><span class="fc-lbl">Recurring extra payments</span><div class="fc-two"><div>'+F('hl-pm','Extra every month',{max:1e9,smax:100000,step:1000,v:0,pre:'₹'})+'</div><div>'+F('hl-pa','Extra every year (month 12, 24…)',{max:1e10,smax:1000000,step:10000,v:0,pre:'₹'})+'</div></div></div></div>'
+'<div class="fc-card" id="hl-o"></div></div><div class="fc-card" style="margin-top:16px"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px"><h2 style="margin:0">Month-by-month amortization</h2><button type="button" class="fc-btn" id="hl-csv">Download CSV</button></div><div id="hl-s"></div></div>';
let lastRows=[];
function calcLoan(){const um=$('#hl-u').value==='m',P0=N('hl-p'),tv=N('hl-t'),Nm=um?tv:tv*12,r0=N('hl-r'),mode=$('#hl-mode').value,pm=N('hl-pm'),pa=N('hl-pa');
 const rc=$$('#hl-rc .fc-row').map(e=>({m:Math.round(+$('.rc-m',e).value),r:+$('.rc-r',e).value})).filter(x=>x.m>=2&&x.m<=1200&&x.r>=1&&x.r<=30).sort((a,b)=>a.m-b.m);
 const lp=$$('#hl-lp .fc-row').map(e=>({m:Math.round(+$('.lp-m',e).value),a:+$('.lp-a',e).value})).filter(x=>x.m>=1&&x.m<=1200&&x.a>0);
 const base=sim(P0,Nm,r0,rc,[],0,0,mode),s=sim(P0,Nm,r0,rc,lp,pm,pa,mode);lastRows=s.rows;
 const emi0=pmt(P0,r0/1200,Nm),ms=base.months-s.months,saved=base.tI-s.tI;
 out('hl-o',(s.neg?'<div class="fc-warn">At these rates the EMI no longer covers the interest, so the loan does not clear within 100 years. Switch to "Reduce EMI" or lower the rate.</div>':'')
 +tiles([['Base EMI (month 1)',big(emi0),1],['Total interest payable',big(s.tI)],['Total amount payable',big(P0+s.tI)],['Interest saved vs baseline',big(Math.max(0,saved))],['Time saved',ms>0?yrmo(ms):'—'],['Loan ends after',yrmo(s.months)]])
 +'<p class="fc-note">Baseline = same loan and rate changes with no prepayments ('+yrmo(base.months)+', interest '+inr(base.tI)+'). '+(mode==='emi'?'EMI is recalculated over the remaining original term after each change.':'EMI stays fixed; tenure adjusts after each change.')+'</p>');
 out('hl-s',table(['Month','Opening balance','EMI','Prepayment','Interest','Principal','Closing balance'],s.rows.map(x=>[x.m,inr(x.open),inr(x.emi),x.pre?inr(x.pre):'—',inr(x.i),inr(x.pr),inr(x.close)])));}
function csv(){const h='Month,Opening balance,EMI,Prepayment,Interest,Principal,Closing balance\n';const b=new Blob([h+lastRows.map(x=>[x.m,x.open,x.emi,x.pre,x.i,x.pr,x.close].map((v,i)=>i?v.toFixed(2):v).join(',')).join('\n')],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='home_loan_amortization.csv';document.body.appendChild(a);a.click();a.remove();}

const yrTable=(h,rows)=>table(h,rows);
P.sip='<div class="fc-grid"><div class="fc-card"><h2>SIP &amp; goal planner</h2>'+F('sip-m','Monthly SIP',{max:1e8,smax:200000,step:500,v:10000,pre:'₹'})+F('sip-l','Lumpsum (optional)',{max:1e10,smax:1e7,step:10000,v:0,pre:'₹'})+F('sip-r','Expected return',{min:1,max:30,step:.1,v:12,suf:'% p.a.'})+F('sip-y','Duration',{min:1,max:50,step:1,v:15,suf:'years'})+F('sip-s','Annual step-up in SIP',{max:50,smax:25,step:1,v:0,suf:'%'})+F('sip-g','Target corpus (optional)',{max:1e11,smax:1e8,step:100000,v:0,pre:'₹'})+'<p class="fc-note">Contributions are invested at the start of each month. Returns are not guaranteed.</p></div><div class="fc-card" id="sip-o"></div></div>';
function calcSip(){const S=N('sip-m'),L=N('sip-l'),r=N('sip-r'),y=N('sip-y'),su=N('sip-s'),g=N('sip-g');const rows=sipSim(S,L,r,y,su),e=rows[rows.length-1];let tg='';
 if(g>0){const f=sipSim(1,0,r,y,su).slice(-1)[0].v,lf=sipSim(0,L,r,y,su).slice(-1)[0].v,req=Math.max(0,(g-lf)/f);tg='<p class="fc-note"><b>Goal '+inr(g)+':</b> '+(e.v>=g?'<span class="fc-up">your plan reaches it</span> ('+inr(e.v-g)+' above target)':'<span class="fc-dn">your plan falls short by '+inr(g-e.v)+'</span>')+'. Starting SIP needed: <b>'+inr(req)+'/month</b>'+(su?' with '+su+'% annual step-up':'')+'.</p>';}
 out('sip-o',tiles([['Total invested',big(e.inv)],['Estimated wealth gain',big(e.gain)],['Maturity value',big(e.v),1]])+tg+'<h3>Year-by-year growth</h3>'+yrTable(['Year','Monthly SIP','Invested','Gain','Value'],rows.map(x=>[x.yr,inr(x.s),inr(x.inv),inr(x.gain),inr(x.v)])));}

const TM=[['mon','Monthly deposits (by the 5th)'],['apr','Once a year, early April'],['mar','Once a year, late March']];
function acctPanel(p,title,rate,extra){return '<div class="fc-grid"><div class="fc-card"><h2>'+title+'</h2>'+F(p+'-d','Annual deposit',{min:250,max:150000,smax:150000,step:250,v:150000,pre:'₹'})+sel(p+'-t','Deposit pattern',TM,'mon')+F(p+'-r','Interest rate',{min:1,max:15,step:.05,v:rate,suf:'% p.a.'})+extra+'<p class="fc-note">Tax-free (EEE). Rates are reset by the Government every quarter, so keep the rate field current. Interest is modelled on the yearly balance with monthly timing of deposits.</p></div><div class="fc-card" id="'+p+'-o"></div></div>';}
P.ssy=acctPanel('ssy','Sukanya Samriddhi Yojana',8.2,'<p class="fc-note" style="margin:0 0 8px">Deposits for 15 years; the account matures at 21 years. Maximum ₹1.5 lakh per year per account.</p>');
P.ppf=acctPanel('ppf','Public Provident Fund',7.1,sel('ppf-e','Extension after 15 years',[['0','No extension (15 years)'],['1','Extend by 5 years'],['2','Extend by 10 years'],['3','Extend by 15 years']],'0')+'<label class="fc-chk"><input type="checkbox" id="ppf-c" checked> Continue deposits during extension</label>');
function calcSsy(){const d=N('ssy-d'),t=$('#ssy-t').value,r=N('ssy-r'),rows=acct(d,t,r,15,21),e=rows[20],a=acct(d,'apr',r,15,21)[20].c,m=acct(d,'mar',r,15,21)[20].c;
 out('ssy-o',tiles([['Total deposited',big(e.inv)],['Interest earned',big(e.c-e.inv)],['Maturity value (year 21)',big(e.c),1]])+'<p class="fc-note">Early-April benefit: depositing the full year in early April matures at <b>'+inr(a)+'</b>, versus <b>'+inr(m)+'</b> if deposited in late March, a difference of <b>'+inr(a-m)+'</b>.</p><h3>Year-by-year</h3>'+yrTable(['Year','Opening','Deposit','Interest','Closing'],rows.map(x=>[x.y,inr(x.open),x.d?inr(x.d):'—',inr(x.it),inr(x.c)])));}
function calcPpf(){const d=N('ppf-d'),t=$('#ppf-t').value,r=N('ppf-r'),ex=+$('#ppf-e').value,yrs=15+5*ex,dy=$('#ppf-c').checked?yrs:15,rows=acct(d,t,r,dy,yrs),e=rows[yrs-1],base=acct(d,t,r,15,15)[14];
 out('ppf-o',tiles([['Total deposited',big(e.inv)],['Interest earned',big(e.c-e.inv)],['Maturity value (year '+yrs+')',big(e.c),1]])+(ex?'<p class="fc-note">At the original 15-year maturity the balance is '+inr(base.c)+'.</p>':'')+'<h3>Year-by-year</h3>'+yrTable(['Year','Opening','Deposit','Interest','Closing'],rows.map(x=>[x.y,inr(x.open),x.d?inr(x.d):'—',inr(x.it),inr(x.c)])));}

P.plan='<div class="fc-grid"><div class="fc-card"><h2>Home loan surplus split</h2><p class="fc-note" style="margin:0 0 12px">After your regular EMI, see how a monthly surplus can be split across goals.</p>'+F('sp-s','Monthly investable surplus',{max:1e8,smax:300000,step:1000,v:30000,pre:'₹'})+F('sp-l','Home loan rate',{min:1,max:30,smax:15,step:.05,v:8.5,suf:'% p.a.'})+sel('sp-ef','Emergency fund (6 months of EMIs/expenses)',[['n','Not ready yet'],['y','Ready']],'n')+F('sp-y','Horizon',{min:1,max:25,step:1,v:15,suf:'years'})+'<div class="fc-two"><div>'+F('sp-e','Equity return',{min:1,max:30,step:.5,v:12,suf:'%'})+'</div><div>'+F('sp-f','FD rate',{min:1,max:15,step:.1,v:6.5,suf:'%'})+'</div><div>'+F('sp-ss','SSY rate',{min:1,max:15,step:.05,v:8.2,suf:'%'})+'</div><div>'+F('sp-pp','PPF rate',{min:1,max:15,step:.05,v:7.1,suf:'%'})+'</div></div>'+sel('sp-sl','Your tax slab (for FD interest)',[['0','0%'],['5','5%'],['10','10%'],['15','15%'],['20','20%'],['25','25%'],['30','30%']],'30')+'</div><div class="fc-card" id="sp-o"></div></div>';
function calcPlan(){const S=N('sp-s'),lr=N('sp-l'),H=N('sp-y'),er=N('sp-e'),fd=N('sp-f'),sl=+$('#sp-sl').value,sr=N('sp-ss'),pr=N('sp-pp'),ef=$('#sp-ef').value==='y';
 const p=ef?{eq:45,pre:30,ssy:20,buf:0,ppf:5}:{eq:40,pre:25,ssy:20,buf:10,ppf:5},a={};for(const k in p)a[k]=S*p[k]/100;
 let over=0;['ssy','ppf'].forEach(k=>{if(a[k]>12500){over+=a[k]-12500;a[k]=12500;}});a.eq+=over;
 const fdp=fd*(1-sl/100),sRows=acct(a.ssy*12,'mon',sr,Math.min(15,H),Math.min(21,H)),pRows=acct(a.ppf*12,'mon',pr,H,H);
 const val=(k,y)=>k==='eq'?fvm(a.eq,er,y):k==='pre'?fvm(a.pre,lr,y):k==='buf'?fvm(a.buf,fdp,y):k==='ssy'?sRows[Math.min(y,sRows.length)-1].c:pRows[y-1].c;
 const ret={eq:er*.875,pre:lr,ssy:sr,ppf:pr,buf:fdp},nm={eq:'Equity SIP',pre:'Home loan prepayment (reduces tenure)',ssy:'Sukanya Samriddhi (SSY)',buf:ef?'Emergency buffer (complete, redirected)':'FD / liquid emergency buffer',ppf:'PPF'};
 const keys=['eq','pre','ssy','buf','ppf'],inv=S*12*H,tot=keys.reduce((s,k)=>s+val(k,H),0);
 const bt=keys.map(k=>[nm[k],inr(a[k]),(a[k]/S*100).toFixed(1)+'%',inr(val(k,H)),ret[k].toFixed(2)+'%',k==='pre'?'Reference':ret[k]>lr?'<span class="fc-up">Above loan rate</span>':'<span class="fc-dn">Below loan rate</span>']);
 const yr=[];for(let y=1;y<=H;y++)yr.push([y,...keys.map(k=>inr(val(k,y))),inr(keys.reduce((s,k)=>s+val(k,y),0))]);
 out('sp-o',tiles([['Total invested',big(inv)],['Estimated wealth gain / interest saved',big(tot-inv)],['Maturity / saved value',big(tot),1]])+'<h3>Monthly split</h3>'+table(['Bucket','Monthly','Share','Value at '+H+' yrs','Post-tax return','vs loan rate'],bt)
 +'<p class="fc-note">'+(ef?'Emergency fund ready: the 10% buffer is moved to prepayment (+5%) and equity SIP (+5%). ':'Default split while the emergency fund is being built: 40% equity, 25% prepayment, 20% SSY, 10% buffer, 5% PPF. ')+'SSY and PPF are capped at ₹12,500/month each; any excess goes to equity. Equity post-tax return is approximated after 12.5% LTCG; prepayment value is the loan interest avoided, compounded at the loan rate.</p><h3>Year-by-year growth</h3>'+table(['Year','Equity','Prepayment','SSY','Buffer','PPF','Total'],yr));}

const dstr=d=>d.toISOString().slice(0,10);
(function(){const t=new Date(),due=new Date(Date.UTC(t.getFullYear(),t.getMonth()-1,20));P.gst='<div class="fc-grid"><div class="fc-card"><h2>Return details</h2><div class="fc-two">'+sel('g-type','Return type',[['3b','GSTR-3B'],['1','GSTR-1']],'3b')+sel('g-freq','Filing frequency',[['m','Monthly'],['q','Quarterly (QRMP)']],'m')+'</div><div class="fc-two"><div class="fc-f"><label for="g-due">Return due date</label><input type="date" id="g-due" value="'+dstr(due)+'"></div><div class="fc-f"><label for="g-file">Actual / expected filing date</label><input type="date" id="g-file" value="'+dstr(new Date(Date.UTC(t.getFullYear(),t.getMonth(),t.getDate())))+'"></div></div>'+sel('g-turn','Annual aggregate turnover',[['0','Up to ₹1.5 crore'],['1','₹1.5 crore to ₹5 crore'],['2','Above ₹5 crore']],'0')+'<label class="fc-chk"><input type="checkbox" id="g-nil"> Nil return (no sales, purchases or tax)</label><div id="g-taxbox">'+F('g-tax','Net tax payable in cash',{max:1e11,smax:5e6,step:1000,v:100000,pre:'₹'})+'<div class="fc-f"><label for="g-pay">Tax payment date (optional; blank = filing date)</label><input type="date" id="g-pay"></div></div><p class="fc-note">Enter the due date notified for you (for example the 20th, or the 22nd/24th for quarterly filers in notified states). Quarterly filers: use the quarterly due date.</p></div><div class="fc-card" id="g-o"></div></div>';})();
function calcGst(){const type=$('#g-type').value,due=$('#g-due').valueAsDate,file=$('#g-file').valueAsDate;$('#g-taxbox').hidden=type!=='3b';
 if(!due||!file){out('g-o','<div class="fc-warn">Please enter both the due date and the filing date.</div>');return;}
 const pay=$('#g-pay').valueAsDate||file,tax=type==='3b'?N('g-tax'):0,r=gstCalc({type,due,file,pay,nil:$('#g-nil').checked,turn:+$('#g-turn').value,tax});
 out('g-o',tiles([['Days delayed',r.d?r.d+' days':'On time'],['CGST late fee',inr(r.half)],['SGST late fee',inr(r.half)],['Total late fee',big(r.fee)],['Interest (18% p.a.)',type==='3b'?inr2(r.int):'n/a'],['Total payable',big(r.total),1]])
 +(r.capHit?'<p class="fc-note">Late fee is capped at '+inr(r.fee)+' for this return.</p>':'')
 +'<h3>Summary</h3>'+table(['Item','Basis','Amount'],[['Late fee: CGST','₹'+($('#g-nil').checked?10:25)+'/day, half of total',inr2(r.half)],['Late fee: SGST','₹'+($('#g-nil').checked?10:25)+'/day, half of total',inr2(r.half)],['Interest on delayed tax',type==='3b'?inr(tax)+' × 18% × '+r.pd+'/365':'GSTR-1 carries no tax payment',inr2(r.int)],{sum:1,c:['Total','',inr2(r.total)]}])
 +'<p class="fc-note">Late fee is paid in cash (not from credit ledger). Interest applies to net tax payable in cash, from the day after the due date until payment. Government waivers or amnesty notifications can change the amounts.</p>');}

/* ---------- Shell ---------- */
const tabs=[['tax','Income Tax'],['loan','Home Loan EMI'],['inv','Invest &amp; Save'],['gst','GST Late Fee']],subs=[['sip','SIP &amp; Goal'],['ssy','Sukanya (SSY)'],['ppf','PPF'],['plan','Surplus Planner']];
let active='tax',sub='sip';
const root=$('#fcApp');
root.innerHTML='<div class="fc-tabs" role="tablist" aria-label="Calculators">'+tabs.map(t=>'<button type="button" role="tab" data-t="'+t[0]+'">'+t[1]+'</button>').join('')+'</div>'
+'<section data-p="tax">'+P.tax+'</section><section data-p="loan">'+P.loan+'</section><section data-p="inv"><div class="fc-sub" role="tablist" aria-label="Investment calculators">'+subs.map(t=>'<button type="button" role="tab" data-s="'+t[0]+'">'+t[1]+'</button>').join('')+'</div>'+subs.map(t=>'<div data-sp="'+t[0]+'">'+P[t[0]]+'</div>').join('')+'</section><section data-p="gst">'+P.gst+'</section>'
+'<p class="fc-disc"><b>Disclaimer:</b> These calculators give estimates for planning purposes only and are not tax, legal or investment advice. Tax figures follow the New Tax Regime slabs for FY 2026-27 for resident individuals; interest rates, due dates, late-fee rules and waivers change by notification, so please verify current rules or consult a qualified professional before acting. Investment returns are not guaranteed.</p>';
function show(){$$('[data-p]',root).forEach(s=>s.hidden=s.dataset.p!==active);$$('[data-sp]',root).forEach(s=>s.hidden=s.dataset.sp!==sub);$$('[data-t]',root).forEach(b=>b.setAttribute('aria-selected',b.dataset.t===active));$$('[data-s]',root).forEach(b=>b.setAttribute('aria-selected',b.dataset.s===sub));run();}
function run(){try{({tax:calcTax,loan:calcLoan,gst:calcGst,inv:()=>({sip:calcSip,ssy:calcSsy,ppf:calcPpf,plan:calcPlan}[sub]())})[active]();}catch(e){console.error(e);}}
root.addEventListener('input',e=>{const t=e.target;if(t.dataset.r)$('#'+t.dataset.r).value=t.value;else if(t.type==='number'&&t.id){const r=$('[data-r="'+t.id+'"]');if(r)r.value=Math.min(Math.max(+t.value||0,+r.min),+r.max);}run();});
root.addEventListener('change',e=>{if(e.target.id==='hl-u'){const n=$('#hl-t'),r=$('[data-r=hl-t]'),m=e.target.value==='m',v=+n.value||0,mx=m?360:30,mn=m?6:1;n.value=m?Math.round(v*12):Math.max(1,Math.round(v/12));n.max=n.dataset.max=r.max=mx;n.min=n.dataset.min=r.min=mn;r.step=m?6:1;r.value=n.value;}run();});
root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.t){active=b.dataset.t;show();}else if(b.dataset.s){sub=b.dataset.s;show();}else if(b.dataset.add){$('#'+b.dataset.add).insertAdjacentHTML('beforeend',rowHtml(b.dataset.add));run();}else if(b.hasAttribute('data-del')){b.closest('.fc-row').remove();run();}else if(b.id==='hl-csv')csv();});
show();
})();

;

const menuBtn=document.getElementById('menuBtn'),nav=document.getElementById('mainNav');
menuBtn.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuBtn.setAttribute('aria-expanded',String(open));});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menuBtn.setAttribute('aria-expanded','false');}));
document.getElementById('year').textContent=new Date().getFullYear();
// Set FORM_ENDPOINT to a form service URL (e.g. https://formspree.io/f/xxxxxxxx) to deliver enquiries
// directly to your inbox. While it is empty, the form falls back to the visitor's email app.
const FORM_ENDPOINT='';
const CONTACT_EMAIL='arjassociates2015@gmail.com';
const form=document.getElementById('enquiryForm'),statusEl=document.getElementById('formStatus'),submitBtn=document.getElementById('submitBtn');
function setStatus(msg,type){statusEl.textContent=msg;statusEl.className='form-note'+(type?' '+type:'');}
function validContact(v){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)||/^\+?[\d\s().-]{7,18}$/.test(v);}
// Pre-select a service when a call-to-action carries one
document.querySelectorAll('[data-service]').forEach(a=>a.addEventListener('click',()=>{
 const opt=[...form.service.options].find(o=>o.text===a.dataset.service);if(opt)form.service.value=opt.value;}));
function openMail(d){
 const subject='ACCENTRA enquiry — '+d.get('service');
 const body='Name: '+d.get('name')+'\nContact: '+d.get('contact')+'\nCountry / region: '+d.get('region')+'\nService: '+d.get('service')+'\n\nRequirement:\n'+d.get('message');
 window.location.href='mailto:'+CONTACT_EMAIL+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
}
form.addEventListener('submit',async function(e){
 e.preventDefault();
 const d=new FormData(form);
 if(d.get('website'))return; // honeypot: silently drop bots
 const name=(d.get('name')||'').trim(),contact=(d.get('contact')||'').trim();
 if(!name){setStatus('Please enter your name.','error');form.name.focus();return;}
 if(!validContact(contact)){setStatus('Please enter a valid email address or phone number.','error');form.contact.focus();return;}
 if(!FORM_ENDPOINT){setStatus('Your email application should open with the enquiry prepared. Please review and send it.','ok');openMail(d);return;}
 submitBtn.disabled=true;setStatus('Sending your enquiry…','');
 try{
  const r=await fetch(FORM_ENDPOINT,{method:'POST',headers:{'Accept':'application/json','Content-Type':'application/json'},
   body:JSON.stringify({name:name,contact:contact,region:d.get('region'),service:d.get('service'),message:d.get('message'),_subject:'ACCENTRA enquiry — '+d.get('service')})});
  if(!r.ok)throw new Error('HTTP '+r.status);
  form.reset();setStatus('Thank you — your enquiry has been sent. We will get back to you shortly.','ok');
 }catch(err){
  setStatus('We could not send this automatically, so your email application will open instead.','error');openMail(d);
 }finally{submitBtn.disabled=false;}
});

/* ---------- ACCENTRA assistant (rule-based; runs fully in the browser) ---------- */
(function(){
const PHONE='+91 94217 26696',TEL='tel:+919421726696',MAIL='arjassociates2015@gmail.com';
const WA_NUMBER='919421726696'; // WhatsApp number, country code first, digits only
const KB=[
 {k:['hello','hi ','hey','namaste','good morning','good evening'],a:'Hello! I can tell you about our accounting, reporting, India compliance and trademark services. What would you like to know?',c:['Analytics services','Power BI dashboards','SQL analysis','Pricing']},
 {k:['service','what do you do','offer','help with','what can'],a:'Data analytics is our primary focus. ACCENTRA can support:\n• Power BI dashboards and KPI scorecards\n• SQL data extraction and analysis\n• Excel and Power Query automation\n• Data cleaning and transformation\n• Sales, operations and finance analytics\n• Management reporting and MIS\nAccounting, India compliance and trademark coordination are supporting services.',c:['Analytics services','Power BI dashboards','SQL analysis','Pricing'],svc:'Power BI dashboards'},
 {k:['bookkeep','ledger','accounting','books','reconcil'],a:'Our primary focus is helping teams analyse business data and improve reporting. We build dashboards, automate recurring Excel reports, analyse datasets with SQL and organise KPIs into useful management views.',c:['Month-end close','MIS reporting','Pricing','Talk to a person'],svc:'Power BI dashboards'},
 {k:['payable','receivable','invoice','vendor','customer ledger','ageing','aging'],a:'We support vendor and customer ledgers, invoice tracking, ageing schedules and payment-status reporting.',c:['Pricing','Talk to a person'],svc:'Accounts payable / receivable'},
 {k:['month-end','month end','close','financial statement','balance sheet','p&l'],a:'We prepare close checklists, support trial-balance review, and produce management accounts and financial reporting packs.',c:['MIS reporting','Pricing','Talk to a person'],svc:'Reconciliation & month-end close'},
 {k:['mis','report','dashboard','kpi','cash flow','margin'],a:'We deliver monthly reporting on revenue, costs, margins, working capital and cash-flow indicators, with dashboards where useful.',c:['Power BI / SAP','Pricing','Talk to a person'],svc:'Financial reporting & MIS'},
 {k:['power bi','powerbi','excel','sql','analytics','data'],a:'We focus on Power BI dashboards, SQL analysis, Excel and Power Query automation, data preparation and recurring business reporting. Tell us the data source and the decisions you want the report to support.',c:['SAP FICO','Pricing','Talk to a person'],svc:'Power BI / Excel / SQL'},
 {k:['sap','fico','erp'],a:'We provide SAP FICO finance-process support: reporting assistance, reconciliation workflows and documentation.',c:['Power BI / SAP','Pricing','Talk to a person'],svc:'SAP FICO support'},
 {k:['gst','gstr'],a:'For India we support GST data preparation, GSTR reconciliation, return-support workflows and compliance reporting. Returns and regulated filings are handled only where permitted and, where required, through authorised professionals.',c:['India compliance','Pricing','Talk to a person'],svc:'India GST / Income Tax / TDS'},
 {k:['income tax','itr','tax return','notice'],a:'We support income-tax data organisation, return preparation and notice-document coordination, within applicable professional and authorisation requirements.',c:['India compliance','Pricing','Talk to a person'],svc:'India GST / Income Tax / TDS'},
 {k:['tds','tcs','challan'],a:'We help with deduction data, challan tracking, return-preparation support and TDS/TCS reconciliation.',c:['India compliance','Pricing','Talk to a person'],svc:'India GST / Income Tax / TDS'},
 {k:['payroll','pf','esi','professional tax','salary'],a:'We provide payroll processing support and organised PF, ESI and professional-tax data.',c:['India compliance','Talk to a person'],svc:'India GST / Income Tax / TDS'},
 {k:['llp','company law','roc','compliance','statutory','india'],a:'Our India services cover GST, income tax, TDS/TCS, company & LLP compliance coordination, payroll and statutory records, and accounts finalisation support. Regulated filings and attestations go through appropriately authorised professionals.',c:['GST support','Trademark help','Pricing','Talk to a person'],svc:'India GST / Income Tax / TDS'},
 {k:['trademark','trade mark','brand','logo','ip ','registration of name','tm '],a:'Trademark support includes:\n• Search & availability check\n• Application preparation\n• Objection & hearing support\n• Opposition & rectification coordination\n• Renewal & portfolio tracking\n• Assignment, licensing & record updates\nFilings and representation are handled through a registered trademark agent or advocate. Registration is subject to examination and no outcome is guaranteed.',c:['Pricing','Talk to a person'],svc:'Trademark search & registration support',link:['See trademark section','#trademark']},
 {k:['calculator','emi ','sip ','ppf','ssy','sukanya','late fee','tax calc','compute','calculate'],a:'We have free calculators on this page: income tax (FY 2026-27 new regime), home loan EMI with prepayments, SIP, SSY, PPF, a surplus planner and a GST late fee and interest calculator. All figures are estimates for planning only.',c:['Accounting services','India compliance','Talk to a person'],link:['Open calculators','#calculators']},
 {k:['price','pricing','cost','fee','charge','quote','rate','how much'],a:'Fees depend on transaction volume, complexity, systems, frequency and agreed deliverables. You receive a written proposal before work starts. We don’t publish fixed prices yet.',c:['Talk to a person','Our services']},
 {k:['outside india','international','abroad','overseas','global','usa','uk ','uae','dubai','singapore','country'],a:'Yes — we work remotely with clients outside India on bookkeeping, reconciliations, finance operations and reporting. Local tax filing and regulated advice are limited to where authorisation is confirmed, or handled with a suitably authorised local professional.',c:['Our services','Talk to a person']},
 {k:['tool','software','tally','quickbooks','xero','zoho','busy'],a:'Tools and file formats are confirmed in the first discussion. We work with Excel, SQL, Power BI and SAP FICO-related reporting; tell us your system and we’ll confirm what fits.',c:['Talk to a person']},
 {k:['document','secure','security','confidential','privacy','password','share'],a:'We agree a suitable document-sharing method during onboarding. Please don’t send passwords, bank credentials, PAN, Aadhaar or other sensitive information through this chat or the public enquiry form.',c:['Talk to a person']},
 {k:['due date','due dates','deadline','calendar','last date','when is','compliance date'],a:'Our Finance & Tax Calendar has a live India Compliance view that counts down to upcoming deadlines for Income Tax, GST, Companies Act (MCA), TDS and TCS. Dates are indicative, so please verify on the official portals before filing.',c:['Accounting services','India compliance','Talk to a person'],link:['Open compliance calendar','#calendar']},
 {k:['turnaround','how long','timeline','deadline','how fast','time'],a:'Timelines are agreed per engagement, based on scope and volume. Share your requirement and we’ll confirm what is realistic.',c:['Talk to a person']},
 {k:['contact','call','phone','email','reach','whatsapp','address'],a:'You can reach ACCENTRA at '+PHONE+' or '+MAIL+'. Or send an enquiry using the form on this page.',c:['Talk to a person'],human:1},
 {k:['human','person','someone','agent','expert','consultant','talk','speak','enquir','inquir','book','call me'],a:'Happy to connect you with the team. Choose how you’d like to reach us:',human:1},
 {k:['thank','thanks','ok thanks','great'],a:'You’re welcome! Anything else I can help with?',c:['Our services','Talk to a person']}
];
const CHIPMAP={'Analytics services':'data analytics services','Power BI dashboards':'power bi dashboards','SQL analysis':'sql data analysis','Accounting services':'bookkeeping accounting','Our services':'services','India compliance':'india compliance','Trademark help':'trademark','Pricing':'pricing','Talk to a person':'talk to a person','Power BI / SAP':'power bi','Month-end close':'month-end close','MIS reporting':'mis reporting','GST support':'gst','SAP FICO':'sap fico'};
const launch=document.getElementById('botLaunch'),panel=document.getElementById('botPanel'),closeB=document.getElementById('botClose'),log=document.getElementById('botLog'),chips=document.getElementById('botChips'),form=document.getElementById('botForm'),input=document.getElementById('botInput');
const BOT_ENDPOINT=''; // URL of the deployed assistant backend (see worker.js); empty = built-in answers only
let started=false,lastSvc='',transcript=[],hist=[];
function setChips(list){chips.textContent='';chips.style.paddingBottom=list.length?'10px':'0';list.forEach(t=>{const b=document.createElement('button');b.type='button';b.textContent=t;b.addEventListener('click',()=>ask(t));chips.appendChild(b);});}
function add(role,text,acts){
 const m=document.createElement('div');m.className='msg '+role;m.textContent=text;hist.push({role:role==='user'?'user':'assistant',content:text});transcript.push((role==='user'?'Me: ':'Assistant: ')+text);
 if(acts&&acts.length){const w=document.createElement('div');w.className='acts';acts.forEach(x=>{let el;if(x.href){el=document.createElement('a');el.href=x.href;if(x.href.startsWith('http')){el.target='_blank';el.rel='noopener';}}else{el=document.createElement('button');el.type='button';}
  el.textContent=x.label;if(x.fn)el.addEventListener('click',x.fn);w.appendChild(el);});m.appendChild(w);}
 log.appendChild(m);log.scrollTop=log.scrollHeight;return m;}
function gotoForm(){
 if(lastSvc){const sel=document.querySelector('#enquiryForm select[name=service]');const o=[...sel.options].find(o=>o.text===lastSvc);if(o)sel.value=o.value;}
 if(window.matchMedia('(max-width:520px)').matches)close();
 document.getElementById('contact').scrollIntoView({behavior:'smooth'});setTimeout(()=>{const n=document.querySelector('#enquiryForm input[name=name]');if(n)n.focus({preventScroll:true});},600);}
function humanActs(){
 const body='Hello ACCENTRA,\n\nI was chatting with your website assistant and would like to talk to someone.\n\n--- Chat summary ---\n'+transcript.slice(-12).join('\n');
 return [{label:'Open enquiry form',fn:gotoForm},{label:'WhatsApp',href:'https://wa.me/'+WA_NUMBER+'?text='+encodeURIComponent('Hello ACCENTRA, I found you through your website and would like to discuss my requirement.')},{label:'Call '+PHONE,href:TEL},{label:'Email us',href:'mailto:'+MAIL+'?subject='+encodeURIComponent('Website chat enquiry')+'&body='+encodeURIComponent(body)}];}
function match(q){
 const t=' '+q.toLowerCase().replace(/[^a-z0-9&+ ]/g,' ').replace(/\s+/g,' ')+' ';let best=null,score=0;
 KB.forEach(e=>{let sc=0;e.k.forEach(w=>{if(t.includes(w.length<=3?' '+w.trim()+' ':w))sc+=w.length;});if(sc>score){score=sc;best=e;}});return best;}
function reply(q){
 if(!BOT_ENDPOINT)return ruleReply(q);
 const ty=document.createElement('div');ty.className='msg bot typing';ty.setAttribute('aria-hidden','true');ty.innerHTML='<i></i><i></i><i></i>';log.appendChild(ty);log.scrollTop=log.scrollHeight;setChips([]);
 fetch(BOT_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({history:hist.slice(-8)})})
  .then(r=>{if(!r.ok)throw 0;return r.json();}).then(d=>{if(!d.reply)throw 0;ty.remove();add('bot',d.reply,d.handoff?humanActs():[]);setChips(['Our services','Pricing','Talk to a person']);})
  .catch(()=>{ty.remove();ruleReply(q);});}
function ruleReply(q){
 const e=match(q);let text,acts=[],cs;
 if(!e){text='I’m not sure I have that one. I can help with our services, India compliance, trademarks and pricing — or connect you with the team.';cs=['Our services','India compliance','Trademark help','Talk to a person'];}
 else{text=e.a;cs=e.c||['Our services','Talk to a person'];if(e.svc)lastSvc=e.svc;if(e.link)acts.push({label:e.link[0],href:e.link[1],fn:()=>{if(window.matchMedia('(max-width:520px)').matches)close();}});if(e.human)acts=acts.concat(humanActs());}
 const ty=document.createElement('div');ty.className='msg bot typing';ty.setAttribute('aria-hidden','true');ty.innerHTML='<i></i><i></i><i></i>';log.appendChild(ty);log.scrollTop=log.scrollHeight;
 setChips([]);
 setTimeout(()=>{ty.remove();add('bot',text,acts);setChips(cs);},450);}
function ask(label){const q=CHIPMAP[label]||label;add('user',label);reply(q);}
function open(){panel.classList.add('open');launch.setAttribute('aria-expanded','true');if(!started){started=true;add('bot','Hi, I’m the ACCENTRA assistant. I can help with data analytics, Power BI, Excel automation, SQL and business reporting. What would you like to explore?');setChips(['Analytics services','Power BI dashboards','SQL analysis','Pricing','Talk to a person']);}input.focus();}
function close(){panel.classList.remove('open');launch.setAttribute('aria-expanded','false');launch.focus();}
launch.addEventListener('click',()=>panel.classList.contains('open')?close():open());
closeB.addEventListener('click',close);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.classList.contains('open'))close();});
form.addEventListener('submit',e=>{e.preventDefault();const v=input.value.trim();if(!v)return;input.value='';add('user',v);reply(v);});
})();

/* ---------- Icons, testimonials, calendar download ---------- */
(function(){
const P=['M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4zM8 9h8M8 13h6','M6 3h12v18l-3-2-3 2-3-2-3 2V3zM9 8h6M9 12h6','M4 20V8m6 12V4m6 16v-9m4 9H2','M3 12a9 9 0 1 1 18 0M12 12l4-4M5 12h2m10 0h2','M8 8l-5 4 5 4m8-8l5 4-5 4M14 5l-4 14','M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z'];
document.querySelectorAll('.cards').forEach(g=>{if(g.id==='ttCards')return;g.querySelectorAll('.card').forEach((c,i)=>{const d=document.createElement('div');d.className='icon';d.setAttribute('aria-hidden','true');d.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="'+P[i%6]+'"/></svg>';c.insertBefore(d,c.firstChild);});});
// Add real, permitted client quotes / logos here. The section stays hidden while both lists are empty.
const TESTIMONIALS=[]; // e.g. {quote:'…',name:'Name',role:'Role, Company'}
const CLIENT_LOGOS=[]; // e.g. {src:'logos/client.png',alt:'Client name'}
if(TESTIMONIALS.length||CLIENT_LOGOS.length){document.getElementById('testimonials').hidden=false;
 TESTIMONIALS.forEach(t=>{const a=document.createElement('article');a.className='card quote';const q=document.createElement('p');q.textContent='“'+t.quote+'”';const s=document.createElement('small');s.textContent=t.name+(t.role?' · '+t.role:'');a.append(q,s);document.getElementById('ttCards').appendChild(a);});
 CLIENT_LOGOS.forEach(l=>{const i=document.createElement('img');i.src=l.src;i.alt=l.alt;i.loading='lazy';document.getElementById('ttLogos').appendChild(i);});}
document.getElementById('icsBtn').addEventListener('click',()=>{
 const ev=[['TDS / TCS deposit (previous month)','20261207','FREQ=MONTHLY;BYMONTHDAY=7'],['GSTR-1 due (monthly filers)','20261211','FREQ=MONTHLY;BYMONTHDAY=11'],['PF and ESI contribution due','20261215','FREQ=MONTHLY;BYMONTHDAY=15'],['GSTR-3B due (monthly filers)','20261220','FREQ=MONTHLY;BYMONTHDAY=20'],['Advance tax instalment due','20261215','FREQ=YEARLY;BYMONTH=3,6,9,12;BYMONTHDAY=15']];
 let o='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//ACCENTRA//Compliance Calendar//EN\r\nCALSCALE:GREGORIAN\r\n';
 ev.forEach((e,i)=>{o+='BEGIN:VEVENT\r\nUID:accentra-'+i+'@accentra\r\nDTSTAMP:20261124T000000Z\r\nDTSTART;VALUE=DATE:'+e[1]+'\r\nRRULE:'+e[2]+'\r\nSUMMARY:'+e[0]+'\r\nDESCRIPTION:Indicative date. Confirm current due dates before relying on it. - ACCENTRA\r\nEND:VEVENT\r\n';});
 o+='END:VCALENDAR\r\n';const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([o],{type:'text/calendar'}));a.download='ACCENTRA_India_Compliance_Calendar.ics';document.body.appendChild(a);a.click();a.remove();});
})();

/* ---------- India Compliance Due Dates (date-aware) ---------- */
(function(){
const $=(s,r=document)=>r.querySelector(s);
const MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],MF=['January','February','March','April','May','June','July','August','September','October','November','December'],WD=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const SN={it:'Income Tax',gst:'GST',mca:'Companies Act (MCA)',tds:'TDS',tcs:'TCS'};
const D=(y,m,d)=>new Date(y,m,d),lastD=(y,m)=>new Date(y,m+1,0).getDate(),U=d=>Date.UTC(d.getFullYear(),d.getMonth(),d.getDate());
const fyEnded=y=>'FY '+(y-1)+'-'+String(y).slice(2),fyS=y=>'FY '+y+'-'+String(y+1).slice(2);
const nf=(d,o,n)=>d<D(2026,6,1)?o:n;
const QE=pm=>pm%3===2,QP={2:'Jan–Mar',5:'Apr–Jun',8:'Jul–Sep',11:'Oct–Dec'};
const prev=(y,m)=>m?[y,m-1]:[y-1,11];
const mon=(day,filter,per)=>y=>{const r=[];for(let m=0;m<12;m++){const[py,pm]=prev(y,m);if(filter&&!filter(pm))continue;r.push({d:D(y,m,Math.min(day,lastD(y,m))),p:per?per(py,pm):MN[pm]+' '+py});}return r;};
const qp=(py,pm)=>QP[pm]+' '+py;
const depo=y=>{const r=[];for(let m=0;m<12;m++){const[py,pm]=prev(y,m);r.push(m===3?{d:D(y,3,30),p:'March '+py+' (year-end month)'}:{d:D(y,m,7),p:MF[pm]+' '+py});}return r;};
const TQ=(y,day,k)=>[[6,'Apr–Jun '+y],[9,'Jul–Sep '+y],[0,'Oct–Dec '+(y-1)],[4,'Jan–Mar '+y]].map(([m,p])=>({d:D(y,m,day(m)),p}));
const CERT=y=>[[7,'Apr–Jun '+y],[10,'Jul–Sep '+y],[1,'Oct–Dec '+(y-1)],[5,'Jan–Mar '+y]].map(([m,p])=>({d:D(y,m,15),p}));
const R=[
{s:'it',n:'Advance tax instalment',f:'Online challan (no return form)',w:'Taxpayers whose estimated tax for the year is ₹10,000 or more. Resident senior citizens without business income are exempt; presumptive (44AD/44ADA) taxpayers pay once, by 15 March.',r:'Interest at 1% per month on shortfall or deferment (ss. 234B/234C, or the corresponding provisions of the 2025 Act).',gen:y=>[[5,'1st instalment: 15% of estimated tax',y,'Apr–Jun'],[8,'2nd instalment: cumulative 45%',y,'Apr–Sep'],[11,'3rd instalment: cumulative 75%',y,'Apr–Dec'],[2,'4th instalment: cumulative 100%',y-1,'Full year']].map(([m,n,fy,per])=>({d:D(y,m,15),n:'Advance tax, '+n,p:fyS(fy)+' ('+per+')'}))},
{s:'it',n:'ITR: non-audit individuals and HUFs',f:'ITR-1 / ITR-2',w:'Salaried individuals, pensioners, investors and HUFs without business income and not subject to audit.',r:'Late fee up to ₹5,000 (₹1,000 if total income is ₹5 lakh or less) plus 1% per month interest on unpaid tax; some loss carry-forward is lost.',gen:y=>[{d:D(y,6,31),p:fyEnded(y)}]},
{s:'it',n:'ITR: non-audit business and professional income',f:'ITR-3 / ITR-4',w:'Individuals and HUFs with business or professional income (including presumptive) not subject to tax audit.',r:'Late fee up to ₹5,000 plus 1% per month interest on unpaid tax; loss carry-forward may be restricted.',gen:y=>[{d:D(y,7,31),p:fyEnded(y)}]},
{s:'it',n:'Tax audit report',f:d=>d<D(2027,0,1)?'Form 3CA/3CB-3CD':'Form 26 (earlier 3CA/3CB-3CD)',w:'Businesses and professionals whose turnover or receipts exceed the tax-audit limits.',r:'Penalty of 0.5% of turnover or receipts, up to ₹1.5 lakh, for default.',gen:y=>[{d:D(y,8,30),p:fyEnded(y)}]},
{s:'it',n:'ITR: audit cases',f:'ITR-3 / ITR-5 / ITR-6',w:'Companies, and firms, LLPs and individuals whose accounts are required to be audited.',r:'Late fee up to ₹5,000 plus 1% per month interest; delay can also lead to loss of carry-forward benefits.',gen:y=>[{d:D(y,9,31),p:fyEnded(y)}]},
{s:'it',n:'Transfer pricing report',f:'Form 3CEB (accountant’s report)',w:'Taxpayers with international or specified domestic transactions.',r:'Penalty of ₹1 lakh for failure to furnish the report.',gen:y=>[{d:D(y,9,31),p:fyEnded(y)}]},
{s:'it',n:'ITR: transfer pricing cases',f:'ITR-3 / ITR-6 (as applicable)',w:'Taxpayers required to furnish a transfer pricing report.',r:'Late fee and interest as for other late returns.',gen:y=>[{d:D(y,10,30),p:fyEnded(y)}]},
{s:'it',n:'Belated ITR: last date',f:'Applicable ITR form',w:'Anyone who missed the original due date.',r:'Late fee (up to ₹5,000) and 1% per month interest apply; most losses cannot be carried forward.',gen:y=>[{d:D(y,11,31),p:fyEnded(y)}]},
{s:'it',n:'Revised ITR: last date',f:'Applicable ITR form',w:'Taxpayers who need to correct a return already filed.',r:'After this date the return cannot be revised; an updated return (ITR-U) with extra tax may still be possible.',gen:y=>[{d:D(y,2,31),p:fyEnded(y-1)}]},
{s:'gst',n:'GSTR-1 (monthly filers)',f:'GSTR-1',w:'Regular taxpayers filing monthly (turnover above ₹5 crore, or not opted into QRMP).',r:'Late fee of ₹50 a day (₹20 for nil returns), capped by turnover, split equally into CGST and SGST.',gen:mon(11)},
{s:'gst',n:'IFF: Invoice Furnishing Facility (optional)',f:'GSTR-1 IFF',w:'QRMP quarterly filers, for months 1 and 2 of each quarter. Optional.',r:'Optional facility; if skipped, invoices go in the quarterly GSTR-1 and the buyer’s input tax credit is delayed.',gen:mon(13,pm=>!QE(pm))},
{s:'gst',n:'GSTR-1 (QRMP quarterly filers)',f:'GSTR-1 (quarterly)',w:'Taxpayers with turnover up to ₹5 crore who opted for QRMP.',r:'Late fee of ₹50 a day (₹20 for nil returns), capped by turnover.',gen:mon(13,QE,qp)},
{s:'gst',n:'GSTR-3B (monthly filers)',f:'GSTR-3B',w:'Monthly filers (due on the 20th).',r:'Late fee of ₹50 a day (₹20 nil), capped by turnover, plus 18% p.a. interest on tax paid late.',gen:mon(20)},
{s:'gst',n:'GSTR-3B (QRMP, 22nd: Category X states/UTs)',f:'GSTR-3B (quarterly)',w:'QRMP filers in Chhattisgarh, Madhya Pradesh, Gujarat, Maharashtra, Karnataka, Goa, Kerala, Tamil Nadu, Telangana, Andhra Pradesh, Daman & Diu, Dadra & Nagar Haveli, Puducherry, Andaman & Nicobar and Lakshadweep.',r:'Late fee of ₹50 a day (₹20 nil), capped by turnover, plus 18% p.a. interest on late tax.',gen:mon(22,QE,qp)},
{s:'gst',n:'GSTR-3B (QRMP, 24th: other states/UTs)',f:'GSTR-3B (quarterly)',w:'QRMP filers in all other states and union territories.',r:'Late fee of ₹50 a day (₹20 nil), capped by turnover, plus 18% p.a. interest on late tax.',gen:mon(24,QE,qp)},
{s:'gst',n:'PMT-06: monthly tax payment (QRMP)',f:'PMT-06 (cash ledger challan)',w:'QRMP filers, for months 1 and 2 of each quarter.',r:'Interest at 18% p.a. on tax paid late; wrong or missed payment can block return filing.',gen:mon(25,pm=>!QE(pm))},
{s:'gst',n:'GSTR-7: TDS under GST',f:'GSTR-7',w:'Government departments and notified persons who deduct GST TDS.',r:'Late fee per day under s.47 (capped) plus interest on tax paid late.',gen:mon(10)},
{s:'gst',n:'GSTR-8: TCS by e-commerce operators',f:'GSTR-8',w:'E-commerce operators who collect GST TCS.',r:'Late fee per day under s.47 (capped) plus interest on tax paid late.',gen:mon(10)},
{s:'gst',n:'GSTR-9: annual return',f:'GSTR-9',w:'Regular taxpayers; mandatory above ₹2 crore aggregate turnover, optional below.',r:'Late fee per day, capped as a percentage of turnover (turnover-slab based).',gen:y=>[{d:D(y,11,31),p:fyEnded(y)}]},
{s:'gst',n:'GSTR-9C: reconciliation statement',f:'GSTR-9C',w:'Taxpayers with aggregate turnover above ₹5 crore (self-certified).',r:'Treated with GSTR-9; non-filing invites notices and penalty exposure.',gen:y=>[{d:D(y,11,31),p:fyEnded(y)}]},
{s:'mca',n:'Annual General Meeting (statutory limit)',f:'AGM (notice under s.101)',w:'Companies with a 31 March year end (gap between AGMs must not exceed 15 months).',r:'Penalty on the company and officers in default; extension needs ROC approval.',gen:y=>[{d:D(y,8,30),p:fyEnded(y)}]},
{s:'tds',n:'TDS deposit',f:'Online challan (ITNS 281 / equivalent)',w:'All deductors. Due 7th of the next month; 30 April for March deductions (government offices follow separate rules).',r:'Interest at 1.5% per month from deduction to deposit; possible 30% expense disallowance.',gen:depo},
{s:'tds',n:'TDS on property, rent and VDA: challan-cum-statement',f:d=>nf(d,'Form 26QB / 26QC / 26QD / 26QE','Form 141 (earlier 26QB-26QE)'),w:'Buyers of property, tenants and payers covered by ss. 194-IA, 194-IB, 194-IM and virtual digital asset payments. Certificate (Form 132) follows within 15 days.',r:'Late fee of ₹200 a day (capped at the TDS amount) plus interest.',gen:y=>{const r=[];for(let m=0;m<12;m++){const[py,pm]=prev(y,m);r.push({d:D(y,m,Math.min(30,lastD(y,m))),p:MF[pm]+' '+py});}return r;}},
{s:'tds',n:'TDS quarterly return',f:d=>nf(d,'Form 24Q / 26Q / 27Q','Form 138 / 140 / 144 (earlier 24Q / 26Q / 27Q)'),w:'All deductors: salary (24Q/138), resident non-salary (26Q/140) and non-resident payments (27Q/144).',r:'Late fee of ₹200 a day (capped at the TDS amount) plus penalty of ₹10,000 to ₹1 lakh.',gen:y=>TQ(y,()=>31)},
{s:'tds',n:'TDS certificates (non-salary)',f:d=>nf(d,'Form 16A','Form 131 (earlier 16A)'),w:'Deductors, within 15 days of the quarterly return due date.',r:'₹100 a day of delay for each certificate.',gen:CERT},
{s:'tds',n:'TDS certificate (salary), annual',f:d=>nf(d,'Form 16','Form 130 (earlier 16)'),w:'Employers, for every employee from whom tax was deducted.',r:'₹100 a day of delay for each certificate.',gen:y=>[{d:D(y,5,15),p:fyEnded(y)}]},
{s:'tcs',n:'TCS deposit',f:'Online challan (ITNS 281 / equivalent)',w:'Collectors. Due 7th of the next month; 30 April for March collections.',r:'Interest at 1% per month on late deposit; interest on late collection; possible penalty.',gen:depo},
{s:'tcs',n:'TCS quarterly return',f:d=>nf(d,'Form 27EQ','Form 143 (earlier 27EQ)'),w:'All collectors. From FY 2026-27 the due dates match TDS returns (31 Jul, 31 Oct, 31 Jan, 31 May).',r:'Late fee of ₹200 a day (capped at the TCS amount) plus penalty of ₹10,000 to ₹1 lakh.',gen:y=>TQ(y,m=>m===4&&y===2026?15:31)},
{s:'tcs',n:'TCS certificate',f:d=>nf(d,'Form 27D','Form 133 (earlier 27D)'),w:'Collectors, within 15 days of the quarterly return due date.',r:'₹100 a day of delay for each certificate.',gen:y=>CERT(y).map(x=>y===2026&&x.d.getMonth()===5?{d:D(2026,4,30),p:x.p}:x)}
];
const EV=[
{s:'mca',n:'DIR-3 KYC Web (periodic)',f:'DIR-3 KYC Web',w:'Every individual holding a DIN on 31 March. Now once every three financial years, by 30 June of the relevant year (directors who filed in FY 2025-26 are generally next due by 30 June 2028; confirm your own cycle).',r:'DIN can be deactivated for non-filing, which blocks director filings.'},
{s:'mca',n:'DIR-3 KYC Web (change of details)',f:'DIR-3 KYC Web',w:'Directors whose mobile number, email or residential address changes: within 30 days of the change.',r:'Same DIN deactivation risk if not updated.'},
{s:'mca',n:'Director appointment or cessation',f:'DIR-12',w:'Companies: within 30 days of the appointment, resignation or change.',r:'Additional fee per day of delay plus penalty exposure for the company and officers.'},
{s:'mca',n:'Board or shareholder resolutions that must be filed',f:'MGT-14',w:'Companies: within 30 days of passing the resolution.',r:'Additional fee per day of delay plus penalty exposure.'},
{s:'mca',n:'Return of allotment of shares',f:'PAS-3',w:'Companies: within 30 days of allotment.',r:'Additional fee per day of delay plus penalty exposure.'},
{s:'tds',n:'Certificate for TDS on property, rent, VDA',f:d=>'Form 132 (earlier 16B-16E)',w:'Within 15 days of the due date of the challan-cum-statement.',r:'₹100 a day of delay for each certificate.'}
];
const wrap=$('#crIndia');
wrap.innerHTML='<div class="cr-sum" id="crSum"></div><p class="cr-next" id="crNext"></p><div class="cr-ctl" role="group" aria-label="Filter by compliance stream"><button class="cr-pill" type="button" data-st="all" aria-pressed="true">All Streams</button>'+Object.keys(SN).map(k=>'<button class="cr-pill" type="button" data-st="'+k+'" aria-pressed="false">'+SN[k]+'</button>').join('')+'<div class="cr-seg" role="group" aria-label="Date range"><button type="button" data-rg="up" aria-pressed="true">Upcoming Only</button><button type="button" data-rg="full" aria-pressed="false" id="crFull">Full Annual Cycle</button></div></div><div class="cr-agm"><label for="crAgm">Your AGM date (sets ADT-1, AOC-4 and MGT-7 dates):</label><input type="date" id="crAgm"> <button class="btn btn-outline" type="button" id="crIcs" style="padding:8px 14px;font-size:13px">Download these dates (.ics)</button></div><div id="crList"></div><div class="cr-ev" id="crEv"></div><p class="cr-disc"><b>Please note:</b> due dates are subject to notifications and extensions by the CBDT, CBIC and the Ministry of Corporate Affairs, and may shift for weekends and holidays. Late-fee and interest notes are summaries only. Always verify on the official portals (incometax.gov.in, gst.gov.in, mca.gov.in, TRACES) before filing or paying. Last reviewed against public sources in November 2026.</p>';
const now=new Date(),T=D(now.getFullYear(),now.getMonth(),now.getDate());
$('#crAgm').value=now.getFullYear()+'-09-30';
let st='all',rg='up',shown=[];
const fy0=T.getMonth()>=3?T.getFullYear():T.getFullYear()-1;
$('#crFull').textContent='Full Annual Cycle (FY '+fy0+'-'+String(fy0+1).slice(2)+')';
const qs=T.getMonth()>=9?D(T.getFullYear(),9,1):T.getMonth()>=6?D(T.getFullYear(),6,1):T.getMonth()>=3?D(T.getFullYear(),3,1):D(T.getFullYear(),0,1),qe=new Date(qs.getFullYear(),qs.getMonth()+3,0);
function gen(ws,we){const out=[];const add=(r,g)=>{const d=g.d;if(U(d)<U(ws)||U(d)>U(we))return;out.push({s:r.s,n:g.n||r.n,f:typeof r.f==='function'?r.f(d):r.f,w:g.w||r.w,r:g.r||r.r,d,p:g.p});};
 for(let y=ws.getFullYear()-1;y<=we.getFullYear()+1;y++)R.forEach(r=>r.gen(y).forEach(g=>add(r,g)));
 const a=$('#crAgm').valueAsDate;if(a){const a0=D(a.getUTCFullYear(),a.getUTCMonth(),a.getUTCDate());[0,1].forEach(k=>{const ag=D(a0.getFullYear()+k,a0.getMonth(),a0.getDate()),fy=ag.getMonth()>=3?ag.getFullYear():ag.getFullYear()-1,per=fyS(fy-1)+' (AGM '+ag.getDate()+' '+MN[ag.getMonth()]+' '+ag.getFullYear()+')';
  [['ADT-1: auditor appointment',15,'ADT-1','Companies appointing or re-appointing an auditor at the AGM. Due within 15 days of the AGM.','Additional fee per day of delay (typically ₹100) plus penalty exposure for the company and officers.'],['AOC-4: financial statements',30,'AOC-4 (AOC-4 XBRL / CFS as applicable)','All companies. Due within 30 days of the AGM.','Additional fee of about ₹100 per day of delay, with no cap, plus penalty for the company and officers.'],['MGT-7 / MGT-7A: annual return',60,'MGT-7 (MGT-7A for small companies and OPCs)','All companies. Due within 60 days of the AGM.','Additional fee of about ₹100 per day of delay, with no cap, plus penalty for the company and officers.']].forEach(([n,dd,f,w,r])=>add({s:'mca',f,w,r},{d:D(ag.getFullYear(),ag.getMonth(),ag.getDate()+dd),n,p:per}));});}
 return out.sort((x,y)=>x.d-y.d||x.s.localeCompare(y.s));}
const days=d=>Math.round((U(d)-U(T))/864e5),fmt=d=>d.getDate()+' '+MN[d.getMonth()]+' '+d.getFullYear();
function item(x){const k=days(x.d),cl=k<0?'past':k<=7?'soon':k<=30?'n30':(x.d<=qe?'qtr':'');
 const badge=k<0?'<span class="cr-c pa">Passed</span>':k===0?'<span class="cr-c soon">Due today</span>':k<=7?'<span class="cr-c soon">Due Soon · '+k+' day'+(k>1?'s':'')+' left</span>':k<=30?'<span class="cr-c n30">Next 30 days · '+k+' days left</span>':(x.d<=qe?'<span class="cr-c qtr">This quarter · '+k+' days left</span>':'<span class="cr-c pa">In '+k+' days</span>');
 const wk=x.d.getDay()===0||x.d.getDay()===6?'<span class="cr-c wk">Falls on a '+WD[x.d.getDay()]+': check for a shift</span>':'';
 return '<article class="cr-i '+cl+'"><div class="cr-d"><b>'+x.d.getDate()+'</b><span>'+MN[x.d.getMonth()]+' '+String(x.d.getFullYear()).slice(2)+'</span></div><div><div class="cr-t">'+x.n+'</div><div class="cr-f">'+x.f+'</div><span class="cr-c '+x.s+'">'+SN[x.s]+'</span>'+badge+wk+'<div class="cr-m"><b>Due:</b> '+WD[x.d.getDay()]+', '+fmt(x.d)+'</div><div class="cr-m"><b>Period:</b> '+x.p+'</div><div class="cr-m"><b>Applies to:</b> '+x.w+'</div><div class="cr-rk"><b>Risk if late:</b> '+x.r+'</div></div></article>';}
function render(){
 const all=gen(T,D(T.getFullYear()+1,T.getMonth(),T.getDate())).filter(x=>st==='all'||x.s===st),up=all.filter(x=>days(x.d)>=0);
 const c7=up.filter(x=>days(x.d)<=7).length,c30=up.filter(x=>days(x.d)<=30).length,cq=up.filter(x=>x.d<=qe).length,qn=Math.floor(((T.getMonth()+9)%12)/3)+1;
 $('#crSum').innerHTML='<div class="cr-st soon"><b>'+c7+'</b><span>Due Soon (next 7 days)</span></div><div class="cr-st n30"><b>'+c30+'</b><span>Upcoming next (30 days)</span></div><div class="cr-st qtr"><b>'+cq+'</b><span>This quarter (Q'+qn+', '+MN[qs.getMonth()]+'–'+MN[qe.getMonth()]+' '+qe.getFullYear()+')</span></div>';
 const nx=up[0];$('#crNext').textContent=nx?'Next up: '+nx.n+' on '+fmt(nx.d)+' ('+(days(nx.d)===0?'today':days(nx.d)+' days')+').':'No upcoming items for this filter.';
 shown=rg==='up'?up.filter(x=>days(x.d)<=365):gen(D(fy0,3,1),D(fy0+1,2,31)).filter(x=>st==='all'||x.s===st);
 let h='',lm='';shown.forEach(x=>{const m=MF[x.d.getMonth()]+' '+x.d.getFullYear();if(m!==lm){h+='<h3 class="cr-mh">'+m+'</h3>';lm=m;}h+=item(x);});
 $('#crList').innerHTML=h||'<p class="form-note">Nothing due for this selection.</p>';
 const ev=EV.filter(e=>st==='all'||e.s===st);$('#crEv').innerHTML=ev.length?'<h3 class="cr-mh">Event-based and periodic filings (no fixed calendar date)</h3>'+ev.map(e=>'<article class="cr-i"><div class="cr-d"><b>•</b><span>Event</span></div><div><div class="cr-t">'+e.n+'</div><div class="cr-f">'+(typeof e.f==='function'?e.f():e.f)+'</div><span class="cr-c '+e.s+'">'+SN[e.s]+'</span><div class="cr-m"><b>Applies to:</b> '+e.w+'</div><div class="cr-rk"><b>Risk if late:</b> '+e.r+'</div></div></article>').join(''):'';}
wrap.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.st){st=b.dataset.st;wrap.querySelectorAll('[data-st]').forEach(x=>x.setAttribute('aria-pressed',x===b));render();}else if(b.dataset.rg){rg=b.dataset.rg;wrap.querySelectorAll('[data-rg]').forEach(x=>x.setAttribute('aria-pressed',x===b));render();}else if(b.id==='crIcs')ics();});
$('#crAgm').addEventListener('change',render);
function ics(){const esc=s=>String(s).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');let o='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//ACCENTRA//India Compliance//EN\r\n';
 shown.filter(x=>days(x.d)>=0).forEach((x,i)=>{const p=n=>String(n).padStart(2,'0'),ds=x.d.getFullYear()+p(x.d.getMonth()+1)+p(x.d.getDate());o+='BEGIN:VEVENT\r\nUID:accentra-in-'+ds+'-'+i+'@accentra\r\nDTSTAMP:'+now.getFullYear()+p(now.getMonth()+1)+p(now.getDate())+'T000000Z\r\nDTSTART;VALUE=DATE:'+ds+'\r\nSUMMARY:'+esc(x.n+' ('+SN[x.s]+')')+'\r\nDESCRIPTION:'+esc('Form: '+x.f+'. Period: '+x.p+'. Indicative date; verify on the official portal before filing. - ACCENTRA')+'\r\nEND:VEVENT\r\n';});
 o+='END:VCALENDAR\r\n';const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([o],{type:'text/calendar'}));a.download='ACCENTRA_India_Compliance_Dates.ics';document.body.appendChild(a);a.click();a.remove();}
/* region + tab logic */
const reg=$('#crRegion');
function tab(t){$('#crOv').hidden=t!=='ov';$('#crIn').hidden=t!=='in';$('#crT-ov').setAttribute('aria-selected',t==='ov');$('#crT-in').setAttribute('aria-selected',t==='in');}
reg.addEventListener('change',()=>{$('#crOther').hidden=reg.value==='in';tab(reg.value==='in'?'in':'ov');});
$('#crT-ov').addEventListener('click',()=>tab('ov'));
$('#crT-in').addEventListener('click',()=>{reg.value='in';$('#crOther').hidden=true;tab('in');});
tab('in');render();
})();
