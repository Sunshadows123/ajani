"use strict";
/* ===== Ajani MTG Commander engine (rules-faithful subset) ===== */
const STEPS=["untap","upkeep","draw","main1","begin","attack","block","damage","endcombat","main2","end","cleanup"];
const STEPL={untap:"Untap",upkeep:"Upkeep",draw:"Draw",main1:"Main 1",begin:"Begin combat",attack:"Attackers",block:"Blockers",damage:"Damage",endcombat:"End combat",main2:"Main 2",end:"End step",cleanup:"Cleanup"};
const COL=["W","U","B","R","G","C"],NUMW={a:1,an:1,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,x:0};
const nw=s=>NUMW[s]??(parseInt(s)||0);
let M=null;const opp=w=>w==="me"?"opp":"me";
/* ---------- sample deck ---------- */
function sampleMtg2(){const L=[],add=(k,c)=>{for(let i=0;i<k;i++)L.push({...c,ci:c.ci||[]})};
 add(18,{name:"Forest",type:"Basic Land — Forest",text:"({T}: Add {G}.)",prod:["G"],mc:"",cmc:0});add(17,{name:"Mountain",type:"Basic Land — Mountain",text:"({T}: Add {R}.)",prod:["R"],mc:"",cmc:0});
 add(2,{name:"Ember Grove",type:"Land",text:"{T}: Add {R} or {G}.",prod:["R","G"],mc:"",cmc:0});
 const cr=(k,n,mc,cmc,p,t,kw=[],text="")=>add(k,{name:n,type:"Creature — Beast",mc,cmc,pow:""+p,tou:""+t,kw,text:(kw.join(", ")+(text?"\n"+text:"")).trim(),ci:["R","G"]});
 cr(6,"Ashpaw Cub","{R}",1,2,1,["Haste"]);cr(7,"Thornback Boar","{1}{G}",2,3,2);cr(5,"Cinderhorn Ram","{1}{R}",2,2,3,[],"When Cinderhorn Ram enters, it deals 1 damage to any target.");
 cr(5,"Grovecaller Druid","{1}{G}",2,1,1,[],"{T}: Add {G}.");cr(6,"Pyrewing Hawk","{2}{R}",3,2,2,["Flying"]);cr(5,"Mossbark Bruiser","{2}{G}",3,2,5,["Reach"]);
 cr(6,"Stormtusk Mammoth","{3}{G}",4,5,4,["Trample"]);cr(5,"Emberclaw Alpha","{3}{R}{G}",5,5,5,[],"Whenever Emberclaw Alpha attacks, creatures you control get +1/+0 until end of turn.");cr(4,"Ancient Ridgeback","{4}{G}{G}",6,7,7,["Trample"]);
 add(6,{name:"Smolder Bolt",type:"Instant",mc:"{R}",cmc:1,text:"Smolder Bolt deals 3 damage to any target."});add(4,{name:"Wild Growth Rite",type:"Sorcery",mc:"{1}{G}",cmc:2,text:"Search your library for a basic land card, put it onto the battlefield tapped, then shuffle."});
 add(3,{name:"Feral Roar",type:"Instant",mc:"{G}",cmc:1,text:"Target creature gets +3/+3 and gains trample until end of turn."});
 return{name:"Feral Stampede (sample)",cmdr:{name:"Kragh, Ashmane Warlord",type:"Legendary Creature — Cat Warrior",mc:"{2}{R}{G}",cmc:4,pow:"5",tou:"5",kw:["Vigilance","Haste"],ci:["R","G"],text:"Vigilance, haste\nWhenever Kragh attacks, put a +1/+1 counter on each creature you control."},cards:L}}
/* ---------- parsing ---------- */
const TGT="(any target|any other target|target creature or planeswalker|target creature or player|target creature you don't control|target creature an opponent controls|target attacking or blocking creature|target attacking creature|target creature|target player or planeswalker|target player|target opponent|each opponent|each creature you don't control|each creature|each other creature)";
function tgtKind(s){if(/any/.test(s)||/creature or player/.test(s))return"any";if(/you don't control|opponent controls/.test(s))return"opp_creature";if(/attacking/.test(s))return"attacking";if(/creature/.test(s)&&!/each/.test(s))return"creature";if(/target opponent/.test(s))return"opponent";if(/player/.test(s))return"player";
 if(/each opponent/.test(s))return"each_opp";if(/each creature you don't control/.test(s))return"each_opp_creature";if(/each (other )?creature/.test(s))return"each_creature";return null}
function parseSentence(s){const E=[];let m;const N="(a|an|one|two|three|four|five|x|\\d+)";
 if((m=s.match(new RegExp("deals? (\\d+|x) damage to "+TGT))))E.push({t:"dmg",n:nw(m[1]),k:tgtKind(m[2])});
 if((m=s.match(new RegExp("(?:you |target player )?draws? "+N+" cards?")))&&!/each player/.test(s))E.push({t:"draw",n:nw(m[1])});
 else if(/draw a card/.test(s))E.push({t:"draw",n:1});
 if((m=s.match(/you gain (\d+) life/)))E.push({t:"gain",n:+m[1]});
 if((m=s.match(/(each opponent|target opponent|target player) loses (\d+) life/)))E.push({t:"lose",n:+m[2],k:m[1]==="each opponent"?"each_opp":"opponent"});
 if((m=s.match(/destroy target (creature you don't control|creature an opponent controls|nonland permanent|artifact or enchantment|creature|artifact|enchantment|permanent|land)/)))E.push({t:"destroy",k:m[1].includes("control")?"opp_creature":m[1]});
 if((m=s.match(/destroy all (creatures|nonland permanents|artifacts|enchantments)/)))E.push({t:"wrath",k:m[1]});
 if((m=s.match(/exile target (creature you don't control|creature an opponent controls|nonland permanent|artifact or enchantment|creature|artifact|enchantment|permanent)/)))E.push({t:"exile",k:m[1].includes("control")?"opp_creature":m[1]});
 if((m=s.match(/return target (creature|nonland permanent|permanent|artifact|enchantment)[^.]*to its owner's hand/)))E.push({t:"bounce",k:m[1]});
 if((m=s.match(new RegExp("create "+N+" (\\d+)/(\\d+) ([a-z' -]+?) (?:artifact )?creature tokens?(?: with ([a-z, ]+?))?(?:\\.|$| that| and|,)"))))E.push({t:"token",n:nw(m[1])||1,p:+m[2],q:+m[3],nm:m[4].replace(/\b\w/g,x=>x.toUpperCase()),kw:(m[5]||"").split(/,? and |, /).map(x=>x.trim()).filter(Boolean)});
 if((m=s.match(new RegExp("put "+N+" \\+1/\\+1 counters? on (target creature you control|target creature|~|it|each creature you control|each other creature you control)"))))E.push({t:"ctr",n:nw(m[1])||1,k:/each/.test(m[2])?"each_own":/target/.test(m[2])?(m[2].includes("you control")?"own_creature":"creature"):"self"});
 if((m=s.match(/(target creature(?: you control)?|~) gets ([+-]\d+)\/([+-]\d+)(?: and gains ([a-z ]+?))? until end of turn/)))E.push({t:"pump",p:+m[2],q:+m[3],kw:m[4]?[m[4].trim()]:[],k:m[1]==="~"?"self":m[1].includes("you control")?"own_creature":"creature"});
 else if((m=s.match(/(?:other )?creatures you control get ([+-]\d+)\/([+-]\d+)(?: and gain ([a-z ]+?))? until end of turn/)))E.push({t:"pump",p:+m[1],q:+m[2],kw:m[3]?[m[3].trim()]:[],k:"each_own"});
 if((m=s.match(/counter target (noncreature spell|creature spell|instant or sorcery spell|spell)/)))E.push({t:"counter",k:"spell",f:m[1]});
 if((m=s.match(/search your library for (?:a|up to (one|two)) basic land cards?[^.]*?(onto the battlefield|into your hand)/)))E.push({t:"ramp",n:nw(m[1]||"a"),bf:m[2].includes("battlefield"),tapped:/tapped/.test(s)});
 if(/^tap target creature/.test(s)||/, tap target creature/.test(s))E.push({t:"tap",k:"creature"});
 if((m=s.match(new RegExp("target (?:player|opponent) discards "+N+" cards?"))))E.push({t:"discard",n:nw(m[1])});
 return E}
function parseCard(c){if(c._p)return c._p;let t=(c.text||"").replace(/\([^)]*\)/g,"");const full=c.name.split(" // ")[0],short=full.split(",")[0];
 t=t.split(full).join("~").split(short).join("~").replace(/this (creature|artifact|enchantment|permanent)/gi,"~").toLowerCase();
 const P={spell:[],etb:[],atk:[],anth:null,un:[]};const kws=(c.kw||[]).map(k=>k.toLowerCase());const isSp=/Instant|Sorcery/.test(c.type);
 for(let L of t.split("\n").map(x=>x.trim()).filter(Boolean)){
  if(L.split(/,\s*/).every(w=>kws.some(k=>w.startsWith(k))))continue;
  if(/^\{t\}: add/.test(L))continue;
  if(/^(other )?creatures you control get \+(\d+)\/\+(\d+)\.?$/.test(L)){const m=L.match(/\+(\d+)\/\+(\d+)/);P.anth={p:+m[1],q:+m[2],other:/^other/.test(L)};continue}
  let m,E;
  if(isSp){E=L.split(/\.\s*/).flatMap(parseSentence);if(E.length)P.spell.push(...E);else P.un.push(L);continue}
  if((m=L.match(/^when(?:ever)? ~ enters(?: the battlefield)?( or attacks)?,?\s*(.*)$/))){E=parseSentence(m[2]);if(E.length){P.etb.push(...E);if(m[1])P.atk.push(...E)}else P.un.push(L);continue}
  if((m=L.match(/^whenever ~ attacks,?\s*(.*)$/))){E=parseSentence(m[1]);if(E.length)P.atk.push(...E);else P.un.push(L);continue}
  if(/^(enchant|equip|ward|protection)/.test(L))continue;
  P.un.push(L)}
 Object.defineProperty(c,"_p",{value:P,enumerable:false});return P}
/* ---------- mana ---------- */
function parseCost(mc){const o={g:0,s:[]};(mc||"").match(/\{[^}]+\}/g)?.forEach(t=>{const x=t.slice(1,-1);if(/^\d+$/.test(x))o.g+=+x;else if(x==="X")0;else o.s.push(x.replace("/P","").replace(/^2\//,""))});return o}
function manaOut(c){if(c.ctrl&&isCre(c)&&c.sick&&!kw(c,"haste"))return null;const t=c.text||"";const m=t.match(/(?:^|\n|\()\{T\}: Add ([^.\n]+)/);
 if(!m){if(isLand(c)&&c.prod&&c.prod.length)return{ch:c.prod};const bt={Plains:"W",Island:"U",Swamp:"B",Mountain:"R",Forest:"G"};const b=Object.keys(bt).filter(k=>c.type.includes(k)).map(k=>bt[k]);return b.length?{ch:b}:null}
 const s=m[1];if(/any (one )?colou?r|any type/i.test(s))return{ch:["W","U","B","R","G"]};const sy=(s.match(/\{([WUBRGC])\}/g)||[]).map(x=>x[1]);if(!sy.length)return c.prod&&c.prod.length?{ch:c.prod}:null;
 if(/ or /.test(s))return{ch:[...new Set(sy)]};return{fx:sy}}
function sources(P){return P.bf.filter(c=>!c.tapped&&manaOut(c))}
function pay(P,cost,commit,extra=0){const pool={...P.pool},src=sources(P).map(c=>({c,o:manaOut(c)})),used=[];
 const tap=s=>{src.splice(src.indexOf(s),1);used.push(s.c);if(s.o.fx)s.o.fx.forEach(x=>pool[x]++)};
 const take=col=>{if(pool[col]>0){pool[col]--;return true}const cand=src.filter(s=>s.o.fx?s.o.fx.includes(col):s.o.ch.includes(col)).sort((a,b)=>(a.o.fx?0:a.o.ch.length)-(b.o.fx?0:b.o.ch.length));const s=cand[0];if(!s)return false;tap(s);if(s.o.ch)pool[col]++;pool[col]--;return true};
 const syms=[...cost.s].sort((a,b)=>a.length-b.length);
 for(const x of syms){if(x.includes("/")){const[a,b]=x.split("/");if(!take(a)&&!take(b))return false}else if(!take(x))return false}
 for(let i=0;i<cost.g+extra;i++){const c=["C","W","U","B","R","G"].find(k=>pool[k]>0);if(c){pool[c]--;continue}src.sort((a,b)=>(a.o.fx?-a.o.fx.length:a.o.ch.length)-(b.o.fx?-b.o.fx.length:b.o.ch.length));const s=src[0];if(!s)return false;tap(s);if(s.o.ch)pool[s.o.ch[0]]++;const k=["C","W","U","B","R","G"].find(k=>pool[k]>0);pool[k]--}
 if(commit){used.forEach(c=>c.tapped=true);P.pool=pool}return true}
function totalCost(c,P){const k=parseCost(c.mc);if(c.cmdr)k.g+=P.tax*2;return k}
/* ---------- card helpers ---------- */
const kw=(c,k)=>(c.kw||[]).some(x=>x.toLowerCase()===k)||(c.tkw||[]).includes(k);
const PL=w=>M.P[w];
function anth(c){let p=0,q=0;for(const x of PL(c.ctrl).bf){const a=parseCard(x).anth;if(a&&(!a.other||x!==c)){p+=a.p;q+=a.q}}return[p,q]}
const pw=c=>{const a=anth(c);return (parseInt(c.pow)||0)+c.ctr+c.tp+a[0]},tg=c=>{const a=anth(c);return (parseInt(c.tou)||0)+c.ctr+c.tq+a[1]};
function inst(c,own){return{...c,u:uid(),own,ctrl:own,tapped:false,sick:true,ctr:0,dmg:0,tp:0,tq:0,tkw:[],dt:false}}
function allBf(){return M.P.me.bf.concat(M.P.opp.bf)}
function findU(u){for(const w of["me","opp"])for(const z of["hand","bf","gy","ex","cmd","lib"]){const c=PL(w)[z].find(x=>x.u===u);if(c)return[c,w,z]}const s=M.stack.find(x=>x.u===u);return s?[s,null,"stack"]:[null]}
function moveTo(c,z,who){const[,w0,z0]=findU(c.u);if(z0&&z0!=="stack"){const a=PL(w0)[z0];a.splice(a.indexOf(c),1)}
 const o=c.own;if(z0==="bf"){Object.assign(c,{tapped:false,sick:true,ctr:0,dmg:0,tp:0,tq:0,tkw:[],dt:false,atk:false,ctrl:o})}
 if(c.token&&z!=="bf"){logm(`${c.name} token ceases to exist`);return}
 if(c.cmdr&&(z==="gy"||z==="ex"||z==="hand"||z==="lib")){z="cmd";logm(`${c.name} returns to the command zone`)}
 const w=who||o;c.ctrl=w;if(z==="lib")PL(o).lib.push(c);else PL(z==="bf"?w:o)[z].push(c)}
function logm(t){M.log.unshift(t);if(M.log.length>200)M.log.length=200;const l=$("#mlog");l&&l.insertAdjacentHTML("afterbegin",`<div>${esc(t)}</div>`)}
function drawN(w,n){for(let i=0;i<n;i++){const P=PL(w);if(!P.lib.length){P.drewEmpty=true;logm(`${P.nm} tried to draw from an empty library`);continue}const c=P.lib.pop();P.hand.push(c);sfx("draw")}}
/* ---------- targets ---------- */
const HARM=new Set(["dmg","destroy","exile","bounce","tap","counter","discard","lose"]);
function canTarget(c,who){return !(c.ctrl!==who&&(kw(c,"hexproof")||kw(c,"shroud")))&&!(kw(c,"shroud"))}
function wardCost(c,who){if(c.ctrl===who)return 0;const m=(c.text||"").match(/Ward \{(\d+)\}/);return kw(c,"ward")&&m?+m[1]:0}
function legal(k,who,e){const cre=allBf().filter(c=>isCre(c)&&canTarget(c,who));
 switch(k){case"creature":return cre;case"opp_creature":return cre.filter(c=>c.ctrl!==who);case"own_creature":return cre.filter(c=>c.ctrl===who);
  case"attacking":return cre.filter(c=>c.atk||c.blk);case"any":return [...cre,{p:"me"},{p:"opp"}];case"player":return[{p:"me"},{p:"opp"}];case"opponent":return[{p:opp(who)}];
  case"spell":return M.stack.filter(s=>s.kind==="spell"&&s.ctrl!==who&&(!e||e.f==="spell"||(e.f==="creature spell")===isCre(s.card)||(e.f==="noncreature spell"&&!isCre(s.card))||(e.f.startsWith("instant")&&/Instant|Sorcery/.test(s.card.type))));
  case"nonland permanent":return allBf().filter(c=>!isLand(c)&&canTarget(c,who));case"permanent":return allBf().filter(c=>canTarget(c,who));
  case"land":return allBf().filter(c=>isLand(c)&&canTarget(c,who));
  case"artifact":case"enchantment":return allBf().filter(c=>c.type.toLowerCase().includes(k)&&canTarget(c,who));
  case"artifact or enchantment":return allBf().filter(c=>/Artifact|Enchantment/.test(c.type)&&canTarget(c,who));}return null}
const needsT=e=>["creature","opp_creature","own_creature","attacking","any","player","opponent","spell","nonland permanent","permanent","land","artifact","enchantment","artifact or enchantment"].includes(e.k);
function aiPick(e,who,list){const harm=HARM.has(e.t),foe=opp(who);const val=x=>x.p?0:pw(x)+tg(x)+(x.cmdr?5:0)+x.ctr;
 if(e.t==="counter")return list.sort((a,b)=>b.card.cmc-a.card.cmc)[0];
 if(harm){const en=list.filter(x=>x.p?x.p===foe:x.ctrl===foe);if(e.t==="dmg"){const kill=en.filter(x=>!x.p&&(tg(x)-x.dmg)<=e.n&&!kw(x,"indestructible")).sort((a,b)=>val(b)-val(a));if(kill[0]&&(S.diff!=="easy"))return kill[0];if(en.find(x=>x.p))return en.find(x=>x.p)}
  return en.filter(x=>!x.p).sort((a,b)=>val(b)-val(a))[0]||en[0]||null}
 const mine=list.filter(x=>x.p?x.p===who:x.ctrl===who);return mine.filter(x=>!x.p).sort((a,b)=>(b.atk?10:0)+val(b)-(a.atk?10:0)-val(a))[0]||mine[0]||null}
function chooseTarget(e,who,srcName){const list=legal(e.k,who,e)||[];if(!list.length)return Promise.resolve(undefined);
 if(who==="opp")return Promise.resolve(aiPick(e,who,list));
 return new Promise(r=>{M.tgt={list,e,src:srcName,res:x=>{M.tgt=null;r(x);mrender()}};mrender()})}
const refKey=x=>x.p?"p:"+x.p:x.u;
/* ---------- effects ---------- */
function stillLegal(t,who,e){if(t==null)return false;if(t.p)return true;const l=legal(e.k,who,e)||[];return l.some(x=>x.u===t.u)}
function dmgTo(t,n,src){if(n<=0)return;if(t.p){PL(t.p).life-=n;logm(`${PL(t.p).nm} take ${n} damage (${PL(t.p).life})`);sfx("hit");flashLife(t.p)}else{t.dmg+=n;if(src&&kw(src,"deathtouch"))t.dt=true;logm(`${t.name} is dealt ${n} damage`)}
 if(src&&kw(src,"lifelink")){PL(src.ctrl).life+=n;logm(`${PL(src.ctrl).nm} gain ${n} life (lifelink)`)}}
async function applyEff(e,who,src,t){const P=PL(who),O=PL(opp(who));
 if(needsT(e)&&!stillLegal(t,who,e)){logm(`${src.name}: target no longer legal`);return}
 switch(e.t){case"draw":drawN(who,e.n);logm(`${P.nm} draw ${e.n}`);break;
  case"dmg":if(e.k==="each_opp")dmgTo({p:opp(who)},e.n,src);else if(e.k==="each_creature"||e.k==="each_opp_creature")allBf().filter(c=>isCre(c)&&(e.k==="each_creature"||c.ctrl!==who)).forEach(c=>dmgTo(c,e.n,src));else dmgTo(t,e.n,src);break;
  case"gain":P.life+=e.n;logm(`${P.nm} gain ${e.n} life`);break;
  case"lose":O.life-=e.n;logm(`${O.nm} lose ${e.n} life`);flashLife(opp(who));break;
  case"destroy":if(kw(t,"indestructible"))logm(`${t.name} is indestructible`);else{moveTo(t,"gy");logm(`${t.name} destroyed`)}break;
  case"wrath":allBf().filter(c=>e.k==="creatures"?isCre(c):e.k==="artifacts"?/Artifact/.test(c.type):e.k==="enchantments"?/Enchantment/.test(c.type):!isLand(c)).filter(c=>!kw(c,"indestructible")).forEach(c=>moveTo(c,"gy"));logm("Destroy all "+e.k);break;
  case"exile":moveTo(t,"ex");logm(`${t.name} exiled`);break;
  case"bounce":moveTo(t,"hand");logm(`${t.name} returned to hand`);break;
  case"token":for(let i=0;i<e.n;i++){const k=inst({name:e.nm+" Token",type:"Token Creature — "+e.nm,pow:""+e.p,tou:""+e.q,kw:e.kw.map(x=>x[0].toUpperCase()+x.slice(1)),text:e.kw.join(", "),mc:"",cmc:0,ci:[]},who);k.token=true;P.bf.push(k)}logm(`${P.nm} create ${e.n} ${e.p}/${e.q} ${e.nm} token(s)`);break;
  case"ctr":(e.k==="each_own"?P.bf.filter(isCre):e.k==="self"?[src]:[t]).forEach(c=>{if(c&&P.bf.concat(O.bf).includes(c))c.ctr+=e.n});logm(`+1/+1 counter(s) from ${src.name}`);break;
  case"pump":(e.k==="each_own"?P.bf.filter(isCre):e.k==="self"?[src]:[t]).forEach(c=>{if(!c)return;c.tp+=e.p;c.tq+=e.q;c.tkw.push(...e.kw)});logm(`${src.name}: +${e.p}/+${e.q} until end of turn`);break;
  case"counter":{const i=M.stack.indexOf(t);if(i>=0){M.stack.splice(i,1);moveTo(t.card,"gy");logm(`${t.card.name} is countered`)}break}
  case"ramp":for(let i=0;i<e.n;i++){const l=P.lib.find(c=>/Basic/.test(c.type)&&isLand(c));if(!l)break;if(e.bf){moveTo(l,"bf",who);l.tapped=e.tapped}else moveTo(l,"hand");logm(`${P.nm} search for ${l.name}`)}shuffle(P.lib);break;
  case"tap":t.tapped=true;logm(`${t.name} tapped`);break;
  case"discard":for(let i=0;i<e.n&&O.hand.length;i++){const c=O.hand[Math.random()*O.hand.length|0];moveTo(c,"gy");logm(`${O.nm} discard ${c.name}`)}break}}
function flashLife(w){setTimeout(()=>{const l=$(`#mlife-${w}`);if(l){l.classList.remove("hit");void l.offsetWidth;l.classList.add("hit")}},30)}
/* ---------- stack ---------- */
async function pushAbility(src,who,effs,label){const tg=[];for(const e of effs){if(needsT(e)){const t=await chooseTarget(e,who,src.name);if(t===undefined||t===null){if(t===undefined)logm(`${src.name}: no legal target, trigger skipped`);return}tg.push(t)}else tg.push(null)}
 M.stack.push({u:uid(),kind:"ability",card:src,ctrl:who,eff:effs,tg,label});logm(`${PL(who).nm}: ${label} trigger on the stack`);M.passes=0}
function instantSpeed(c){return /Instant/.test(c.type)||kw(c,"flash")}
function canCast(c,who){const P=PL(who);if(isLand(c))return false;if(!(P.hand.includes(c)||P.cmd.includes(c)))return false;
 if(!instantSpeed(c)&&!(M.active===who&&(STEPS[M.step]==="main1"||STEPS[M.step]==="main2")&&!M.stack.length))return false;
 const e=parseCard(c).spell.find(needsT);if(e&&!(legal(e.k,who,e)||[]).length)return false;return pay(P,totalCost(c,P),false)}
function canLand(c,who){const P=PL(who);return isLand(c)&&P.hand.includes(c)&&!P.landDrop&&M.active===who&&/main/.test(STEPS[M.step])&&!M.stack.length}
function playLand(c,who){moveTo(c,"bf",who);c.sick=false;PL(who).landDrop=true;logm(`${PL(who).nm} play ${c.name}`);sfx("play")}
async function cast(c,who){const P=PL(who),p=parseCard(c),tgs=[];let extra=0;
 if(/Instant|Sorcery/.test(c.type))for(const e of p.spell){if(needsT(e)){const t=await chooseTarget(e,who,c.name);if(!t)return false;tgs.push(t);if(!t.p&&t.ctrl)extra+=wardCost(t,who)}else tgs.push(null)}
 const cost=totalCost(c,P);if(!pay(P,cost,true,extra)){who==="me"&&toast(extra?"Can't pay ward cost":"Not enough mana");return false}
 if(c.cmdr&&P.cmd.includes(c))P.tax++;const[,w0,z0]=findU(c.u);PL(w0)[z0].splice(PL(w0)[z0].indexOf(c),1);
 M.stack.push({u:c.u,kind:"spell",card:c,ctrl:who,eff:p.spell,tg:tgs});c.u=c.u;logm(`${P.nm} cast ${c.name}${tgs.filter(Boolean).length?" → "+tgs.filter(Boolean).map(t=>t.p?PL(t.p).nm:t.name||t.card?.name).join(", "):""}`);sfx("play");M.passes=0;
 if(p.un.length&&who==="me")toast("Some text isn't automated – use ⓘ to apply manually");return true}
async function resolveTop(){const s=M.stack.pop();if(!s)return;sfx("add");
 if(s.kind==="spell"){const c=s.card;if(/Instant|Sorcery/.test(c.type)){const anyT=s.eff.some(needsT);const ok=!anyT||s.eff.some((e,i)=>needsT(e)&&stillLegal(s.tg[i],s.ctrl,e));
   if(!ok)logm(`${c.name} fizzles (no legal targets)`);else for(let i=0;i<s.eff.length;i++)await applyEff(s.eff[i],s.ctrl,c,s.tg[i]);PL(c.own).gy.push(c);if(c.cmdr){PL(c.own).gy.pop();PL(c.own).cmd.push(c)}}
  else{Object.assign(c,{tapped:false,sick:true,ctr:0,dmg:0,tp:0,tq:0,tkw:[],dt:false,ctrl:s.ctrl});PL(s.ctrl).bf.push(c);logm(`${c.name} enters the battlefield`);const p=parseCard(c);if(p.etb.length)await pushAbility(c,s.ctrl,p.etb,"ETB")}}
 else{for(let i=0;i<s.eff.length;i++)await applyEff(s.eff[i],s.ctrl,s.card,s.tg[i])}
 mrender()}
/* ---------- state-based actions ---------- */
function sba(){let again=true;while(again){again=false;
 for(const c of allBf())if(isCre(c)){const T=tg(c);if(T<=0||(!kw(c,"indestructible")&&(c.dmg>=T||(c.dt&&c.dmg>0)))){logm(`${c.name} dies`);moveTo(c,"gy");again=true}}}
 for(const w of["me","opp"]){const P=PL(w);const cd=Object.entries(P.cdmg).find(([,v])=>v>=21);
  if(P.life<=0||P.drewEmpty||cd){endM(opp(w),P.life<=0?"life total 0":P.drewEmpty?"drew from empty library":"21 commander damage");return true}}return false}
function endM(w,why){if(M.over)return;M.over=true;logm(w==="me"?`You win – ${why}!`:`${PL("opp").nm} wins – ${why}.`);banner(w==="me"?"Victory!":"Defeat");sfx(w==="me"?"win":"hit");if(M.wait)M.wait("pass");mrender()}
/* ---------- combat ---------- */
const canAttack=c=>isCre(c)&&!c.tapped&&(!c.sick||kw(c,"haste"))&&!kw(c,"defender");
function canBlock(b,a){if(!isCre(b)||b.tapped)return false;if(kw(a,"flying")&&!kw(b,"flying")&&!kw(b,"reach"))return false;return true}
async function declareAttacks(list,who){for(const c of list){c.atk=true;if(!kw(c,"vigilance"))c.tapped=true}M.atk=list.map(c=>c.u);
 if(list.length){logm(`${PL(who).nm} attack with ${list.map(c=>c.name).join(", ")}`);sfx("play");mrender();list.forEach(c=>$(`[data-u="${c.u}"]`)?.classList.add("lunge"));await sleep(500)}
 for(const c of list){const p=parseCard(c);if(p.atk.length)await pushAbility(c,who,p.atk,"attack")}}
function attackers(){return allBf().filter(c=>c.atk)}
function blockersOf(a){return allBf().filter(b=>b.blk===a.u)}
function fixMenace(){for(const a of attackers())if(kw(a,"menace")){const bs=blockersOf(a);if(bs.length===1){bs[0].blk=null;logm(`${a.name} has menace – a single blocker isn't allowed`)}}}
function combatDamage(first){const ev=[];
 for(const a of attackers()){const fs=kw(a,"first strike"),ds=kw(a,"double strike");if(first?!(fs||ds):(fs&&!ds))continue;
  const bs=blockersOf(a);let rem=pw(a);if(rem<=0)continue;const def=opp(a.ctrl);
  if(!a.wasBlocked){ev.push([{p:def},rem,a]);continue}
  if(!bs.length){if(kw(a,"trample"))ev.push([{p:def},rem,a]);continue}
  bs.forEach((b,i)=>{const lethal=kw(a,"deathtouch")?1:Math.max(0,tg(b)-b.dmg);const last=i===bs.length-1;const give=last&&!kw(a,"trample")?rem:Math.min(rem,lethal);if(give>0)ev.push([b,give,a]);rem-=give});
  if(rem>0&&kw(a,"trample"))ev.push([{p:def},rem,a])}
 for(const b of allBf().filter(x=>x.blk)){const fs=kw(b,"first strike"),ds=kw(b,"double strike");if(first?!(fs||ds):(fs&&!ds))continue;const a=allBf().find(x=>x.u===b.blk);if(a&&pw(b)>0)ev.push([a,pw(b),b])}
 for(const[t,n,s]of ev){dmgTo(t,n,s);if(t.p&&s.cmdr){PL(t.p).cdmg[s.name]=(PL(t.p).cdmg[s.name]||0)+n}}return ev.length}
async function doCombatDamage(){const any=attackers().concat(allBf().filter(x=>x.blk)).some(c=>kw(c,"first strike")||kw(c,"double strike"));
 if(any){logm("First-strike damage");combatDamage(true);mrender();await sleep(500);if(sba())return}
 combatDamage(false);mrender();await sleep(400);sba()}
/* ---------- turn structure ---------- */
function newTurn(){M.turn++;M.active=opp(M.active);M.step=0;M.autoEnd=false;const P=PL(M.active);P.landDrop=false;banner((M.active==="me"?"Your":PL("opp").nm.split(" (")[0]+"'s")+" turn "+Math.ceil(M.turn/2));logm(`— Turn ${M.turn}: ${P.nm} —`)}
async function enterStep(){while(true){const st=STEPS[M.step],A=M.active,P=PL(A);M.prio=A;M.passes=0;mrender();
 if(st==="untap"){P.bf.forEach(c=>{c.tapped=false;c.sick=false});M.step++;continue}
 if(st==="draw"){if(M.turn>1)drawN(A,1);if(sba())return}
 if(st==="attack"){let list=[];if(A==="me"){M.decl="atk";M.sel=new Set();mrender();await new Promise(r=>M.declRes=r);list=P.bf.filter(c=>M.sel.has(c.u)&&canAttack(c));M.decl=null}else list=aiAttacks();
  await declareAttacks(list,A);if(!list.length){M.step=STEPS.indexOf("endcombat");continue}}
 if(st==="block"){const D=opp(A);if(D==="me"){M.decl="blk";M.bsel=null;mrender();await new Promise(r=>M.declRes=r);M.decl=null}else aiBlocks();fixMenace();
  for(const a of attackers()){a.wasBlocked=blockersOf(a).length>0}const b=allBf().filter(x=>x.blk);if(b.length)logm("Blocks: "+b.map(x=>`${x.name} → ${allBf().find(y=>y.u===x.blk)?.name}`).join(", "));else logm("No blocks")}
 if(st==="damage"){await doCombatDamage();if(M.over)return}
 if(st==="endcombat"){allBf().forEach(c=>{c.atk=false;c.blk=null;c.wasBlocked=false});M.atk=[]}
 if(st==="cleanup"){const H=PL(A).hand;if(H.length>7){if(A==="me"){M.disc=H.length-7;mrender();await new Promise(r=>M.discRes=r);M.disc=0}else{H.sort((a,b)=>(isLand(b)-isLand(a))||a.cmc-b.cmc);while(H.length>7){const c=H.shift();moveTo(c,"gy");logm(`${P.nm} discard ${c.name} (hand size)`)}}}
  allBf().forEach(c=>{c.dmg=0;c.dt=false;c.tp=0;c.tq=0;c.tkw=[]});newTurn();continue}
 mrender();return}}
async function advance(){for(const w of["me","opp"])PL(w).pool={W:0,U:0,B:0,R:0,G:0,C:0};M.step++;await enterStep()}
async function doPass(who){M.passes++;if(M.passes>=2){M.passes=0;if(M.stack.length){await resolveTop();sba();M.prio=M.active}else await advance()}else M.prio=opp(who);mrender()}
function hasInstant(){const P=PL("me");return P.hand.concat(P.cmd).some(c=>instantSpeed(c)&&canCast(c,"me"))}
function needStop(){const st=STEPS[M.step];if(M.over)return true;
 const top=M.stack[M.stack.length-1];if(M.autoEnd&&!(top&&top.ctrl==="opp"))return false;if(S.stopAll)return true;
 if(top)return top.ctrl==="opp"?(hasInstant()?true:"peek"):hasInstant();
 if(M.active==="me")return st==="main1"||st==="main2"||(hasInstant()&&(st==="block"||st==="begin"&&false));
 return hasInstant()&&((st==="attack"&&M.atk.length>0)||st==="block"||st==="end")}
async function drive(){if(M.driving)return;M.driving=true;const id=M.id;
 try{while(!M.over&&M.id===id){if(M.prio==="opp"){await sleep(280);await aiPriority();if(M.over||M.id!==id)break;await doPass("opp");continue}
  const ns=needStop();if(ns===true){mrender();const a=await new Promise(r=>M.wait=r);M.wait=null;if(M.id!==id)break;if(a==="pass")await doPass("me")}
  else{if(ns==="peek"){mrender();await sleep(900)}await doPass("me")}}}finally{M.driving=false;mrender()}}
const wake=a=>{if(M&&M.wait)M.wait(a)};
/* ---------- AI ---------- */
async function aiPriority(){const P=PL("opp"),st=STEPS[M.step],D_=S.diff;if(M.over)return false;const top=M.stack[M.stack.length-1];
 const cands=P.hand.concat(P.cmd).filter(c=>canCast(c,"opp"));
 if(top){if(top.ctrl==="me"&&D_!=="easy"){const cs=cands.find(c=>parseCard(c).spell.some(e=>e.t==="counter")&&top.kind==="spell"&&top.card.cmc>=(D_==="hard"?2:3));if(cs){await cast(cs,"opp");return true}}return false}
 if(M.active==="opp"&&/main/.test(st)){const land=P.hand.filter(c=>canLand(c,"opp"));if(land.length){const need=new Set(P.hand.flatMap(c=>parseCard(c)&&parseCost(c.mc).s.join("").split("")));land.sort((a,b)=>((manaOut(b)?.ch||manaOut(b)?.fx||[]).filter(x=>need.has(x)).length)-((manaOut(a)?.ch||manaOut(a)?.fx||[]).filter(x=>need.has(x)).length));playLand(land[0],"opp");return true}
  let pool=cands.filter(c=>!(/Instant/.test(c.type)&&D_!=="easy"&&!parseCard(c).spell.some(e=>e.t==="ramp"||e.t==="draw"))&&!parseCard(c).spell.some(e=>e.t==="counter"||(e.t==="pump"&&st==="main1")));
  if(D_==="easy"&&Math.random()<.25)return false;
  pool.sort((a,b)=>{const r=x=>(manaOut(x)||parseCard(x).spell.some(e=>e.t==="ramp"))&&M.turn<10?100:0;return r(b)+b.cmc+(b.cmdr?1:0)-(r(a)+a.cmc+(a.cmdr?1:0))});
  if(D_==="easy")shuffle(pool);for(const c of pool){if(await cast(c,"opp"))return true}return false}
 if(M.active==="me"&&D_!=="easy"&&!M.aiUsed[M.turn+st]){M.aiUsed[M.turn+st]=1;
  const rem=cands.find(c=>/Instant/.test(c.type)&&parseCard(c).spell.some(e=>e.t==="dmg"||e.t==="destroy"||e.t==="exile")&&(st==="attack"||st==="end"));if(rem&&(st==="end"||attackers().length)){if(await cast(rem,"opp"))return true}
  if(st==="end"){const f=cands.find(c=>kw(c,"flash")||parseCard(c).spell.some(e=>e.t==="draw"));if(f&&await cast(f,"opp"))return true}}
 if(M.active==="opp"&&st==="block"&&D_!=="easy"){const pump=cands.find(c=>parseCard(c).spell.some(e=>e.t==="pump"));const a=attackers().find(x=>x.wasBlocked);if(pump&&a&&!M.aiUsed["p"+M.turn]){M.aiUsed["p"+M.turn]=1;if(await cast(pump,"opp"))return true}}
 return false}
function aiAttacks(){const P=PL("opp"),O=PL("me"),D_=S.diff;const mine=P.bf.filter(canAttack);const bl=O.bf.filter(c=>isCre(c)&&!c.tapped);
 const total=mine.reduce((a,c)=>a+pw(c),0);if(D_!=="easy"&&total>=O.life&&mine.every(a=>!bl.some(b=>canBlock(b,a))))return mine;
 return mine.filter(a=>{if(D_==="easy")return Math.random()<.6;const can=bl.filter(b=>canBlock(b,a));if(!can.length)return true;
  const dies=can.some(b=>pw(b)>=tg(a)-a.dmg||kw(b,"deathtouch"));const kills=can.every(b=>pw(a)>=tg(b)||kw(a,"deathtouch"));if(kw(a,"indestructible"))return true;
  return !dies||(D_==="hard"&&kills&&O.life<=total*2)||(kw(a,"vigilance")&&!dies)})}
function aiBlocks(){const P=PL("opp"),D_=S.diff;const free=P.bf.filter(c=>isCre(c)&&!c.tapped);const atks=attackers().sort((a,b)=>pw(b)-pw(a));let incoming=atks.reduce((s,a)=>s+pw(a),0);
 for(const a of atks){const ok=free.filter(b=>canBlock(b,a));if(!ok.length)continue;if(D_==="easy"&&Math.random()<.5)continue;
  const good=ok.find(b=>(pw(b)>=tg(a)||kw(b,"deathtouch"))&&(tg(b)>pw(a)||kw(b,"indestructible"))&&!kw(a,"deathtouch"))||ok.find(b=>tg(b)>pw(a)&&!kw(a,"deathtouch")&&!kw(a,"trample"));
  const lethal=incoming>=P.life;const trade=ok.find(b=>pw(b)>=tg(a)&&(pw(a)+(a.cmc||0))>=(pw(b)+(b.cmc||0)));
  let b=good||(D_==="hard"&&trade)||(lethal?ok.sort((x,y)=>pw(x)-pw(y))[0]:null);
  if(b&&kw(a,"menace")){const b2=ok.find(x=>x!==b);if(!b2)continue;b2.blk=a.u;free.splice(free.indexOf(b2),1)}
  if(b){b.blk=a.u;free.splice(free.indexOf(b),1);if(!kw(a,"trample"))incoming-=pw(a)}}}
/* ---------- start / mulligan ---------- */
async function enrich(d){const miss=d.main.concat(d.cmdr?[d.cmdr]:[]).filter(c=>c.mc===undefined);if(!miss.length)return;
 $("#table").innerHTML='<div class="hint">Fetching mana costs & abilities from Scryfall… <span class="typing"><i></i><i></i><i></i></span></div>';
 for(let i=0;i<miss.length;i+=75){const r=await fetch(SF+"/cards/collection",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({identifiers:miss.slice(i,i+75).map(c=>({id:c.id}))})});const j=await r.json();
  for(const x of j.data||[]){const n=nMtg(x);miss.filter(c=>c.id===n.id).forEach(c=>Object.assign(c,{mc:n.mc,prod:n.prod,kw:n.kw,text:n.text,pow:n.pow,tou:n.tou}))}}
 miss.forEach(c=>{if(c.mc===undefined)c.mc=""});saveD()}
async function mtgStart(){game={mtg:1};const d=deck();try{await enrich(d)}catch(e){toast("Couldn't refresh card data: "+e.message)}
 const dk=D.mtg.find(x=>x.id===S.oppMtg);let o;if(dk&&dk.id!==d.id){try{await enrich(dk)}catch{}o={name:dk.name,cmdr:dk.cmdr,cards:deckCards(dk)}}else o=sampleMtg2();
 const mk=(cards,cmdr,nm,w)=>{const P={k:w,nm,life:40,lib:shuffle(cards.map(c=>inst(c,w))),hand:[],bf:[],gy:[],ex:[],cmd:[],pool:{W:0,U:0,B:0,R:0,G:0,C:0},tax:0,cdmg:{},landDrop:false,mull:0};if(cmdr){const c=inst(cmdr,w);c.cmdr=true;P.cmd.push(c)}return P};
 M={id:Math.random(),P:{me:mk(deckCards(d),d.cmdr,"You","me"),opp:mk(o.cards,o.cmdr,o.name,"opp")},active:"me",turn:1,step:0,prio:"me",passes:0,stack:[],log:[],atk:[],aiUsed:{},phase:"mull",showLog:false};
 for(const w of["me","opp"])drawN(w,7);aiMull();mrender();shufM();banner("Opening hand");logm(`Commander game vs ${o.name} (${S.diff}). Simplified-but-rules-based engine; see ⓘ on any card for manual control.`)}
function aiMull(){const P=PL("opp");const l=P.hand.filter(isLand).length;if(l<2||l>5){P.lib.push(...P.hand);P.hand=[];shuffle(P.lib);drawN("opp",7);P.hand.sort((a,b)=>isLand(a)-isLand(b));const ex=P.hand.filter(isLand).length>4?P.hand.find(isLand):P.hand.find(c=>!isLand(c));P.hand.splice(P.hand.indexOf(ex),1);P.lib.unshift(ex);logm(`${P.nm} mulligans to 6`)}}
function shufM(){const p=$('[data-pile="me-lib"]');if(p){p.classList.remove("shuf");void p.offsetWidth;p.classList.add("shuf")}sfx("shuffle")}
function mMull(){const P=PL("me");P.mull++;P.lib.push(...P.hand);P.hand=[];shuffle(P.lib);mrender();shufM();setTimeout(()=>{drawN("me",7);M.bottom=P.mull;logm(`Mulligan ${P.mull}: drew 7 – after keeping, choose ${P.mull} card(s) to put on the bottom.`);mrender()},400)}
function mKeep(){if(M.bottom){M.phase="bottom";mrender();return}M.phase="play";M.step=0;logm("— Turn 1: You —");banner("Your turn 1");enterStep().then(drive)}
/* ---------- render ---------- */
const PIPC={W:"#f8f1d0",U:"#5aa3e8",B:"#8a7a8c",R:"#e8664a",G:"#4fb36b",C:"#c9c3d6"};
function pips(mc){return (mc||"").match(/\{[^}]+\}/g)?.map(t=>{const x=t.slice(1,-1);return `<i class="pip" style="background:${PIPC[x[0]]||"#bbb"}">${/^\d+$|X/.test(x)?x:""}</i>`}).join("")||""}
function mcard(c,zone,owner){const hidden=owner==="opp"&&(zone==="hand"||zone==="lib");const cls=[c.tapped&&"tap",c.atk&&"atkg",c.blk&&"blkg",M.sel&&M.sel.has(c.u)&&"sel",M.bsel===c&&"sel",M.tgt&&M.tgt.list.some(x=>x.u===c.u)&&"tgl",zone==="bf"&&c.sick&&isCre(c)&&!kw(c,"haste")&&"sick"].filter(Boolean).join(" ");
 const e=cardEl(c,{back:hidden,noTilt:zone!=="hand",cls,click:()=>onC(c,zone,owner)});e.dataset.u=c.u;e.style.animation="none";
 if(!hidden){let b="";if(isCre(c)&&zone!=="hand"&&zone!=="lib"){const P=pw(c),T=tg(c);b+=`<span class="pt ${P!==(parseInt(c.pow)||0)||T!==(parseInt(c.tou)||0)?"mod":""}">${P}/${T-(c.dmg||0)!==T?`<s>${T}</s>${T-c.dmg}`:T}</span>`}
  if(c.ctr)b+=`<span class="ctr">+${c.ctr}</span>`;if(zone==="hand"||zone==="cmd")b+=`<span class="mc">${pips(c.mc)}</span>`;if(c.cmdr&&zone==="cmd"&&PL(owner).tax)b+=`<span class="ctr">tax ${PL(owner).tax*2}</span>`;
  if(c.blk)b+=`<span class="bl">⛨</span>`;b+=`<button class="info" title="Details & manual actions">i</button>`;e.insertAdjacentHTML("beforeend",b);e.querySelector(".info").onclick=ev=>{ev.stopPropagation();cardMenu(c,zone,owner)}}
 if(zone==="hand"&&owner==="me"&&M.phase==="play"&&(canCast(c,"me")||canLand(c,"me")))e.classList.add("playable");return e}
function mrender(){if(!M||G!=="mtg"||!$("#table"))return;const T=$("#table");const old={};if(S.anim!=="off")T.querySelectorAll("[data-u]").forEach(e=>old[e.dataset.u]=e.getBoundingClientRect());
 const piles={};T.querySelectorAll("[data-pile]").forEach(e=>piles[e.dataset.pile]=e.getBoundingClientRect());
 const side=w=>{const P=PL(w);const pool=COL.filter(k=>P.pool[k]).map(k=>`<i class="pip" style="background:${PIPC[k]}">${P.pool[k]}</i>`).join("");const cd=Object.entries(P.cdmg).map(([k,v])=>`<span class="cd">⚔ ${esc(k.split(",")[0])} ${v}/21</span>`).join("");
  const info=`<div class="binfo"><span class="life ${M.tgt&&M.tgt.list.some(x=>x.p===w)?"tgl":""}" id="mlife-${w}" data-p="${w}">${P.life}</span><b>${esc(P.nm)}</b>${M.active===w?'<span class="turnb">turn</span>':""}${M.prio===w&&M.phase==="play"?'<span class="prio">priority</span>':""}
   <span class="pool">${pool}</span>${cd}<span class="piles"><span class="pile" data-pile="${w}-lib" title="Library">${'<div class="back"></div>'.repeat(Math.min(3,P.lib.length))}<span>${P.lib.length}</span></span>
   <span class="pile gy" data-pile="${w}-gy" title="Graveyard">${P.gy.length?`<img src="${esc(P.gy[P.gy.length-1].img||"")}">`:""}<span>GY ${P.gy.length}</span></span><span class="pile gy" data-pile="${w}-ex" title="Exile"><span>EX ${P.ex.length}</span></span></span></div>`;
  const z=(n,cls)=>`<div class="brow ${cls}" data-z="${w}-${n}"></div>`;
  return w==="opp"?`<div class="bs opp">${info}<div class="bhand" data-z="opp-hand"></div><div class="bzr">${z("cmd","cmdz")}<div class="bzc">${z("lands","lands")}${z("perms","perms")}</div></div></div>`
   :`<div class="bs me"><div class="bzr">${z("cmd","cmdz")}<div class="bzc">${z("perms","perms")}${z("lands","lands")}</div></div>${info}<div class="hand mhand ${S.handCollapsed?"col":""}" data-z="me-hand"></div></div>`};
 const st=STEPS[M.step];
 const mid=`<div class="bmid"><div class="steps">${STEPS.map((s,i)=>`<span class="${i===M.step&&M.phase==="play"?"on":""} ${M.active==="opp"?"o":""}">${STEPL[s]}</span>`).join("")}</div>
  <div class="stack" data-z="stack">${M.stack.length?"<small>Stack ▸</small>":""}</div><div class="prompt" id="mprompt"></div><div class="mbtns" id="mbtns"></div></div>`;
 T.innerHTML=`<div class="board" style="--bz:${S.bz||64}px">${side("opp")}${mid}${side("me")}</div><div class="mtools"><button class="sm ghost" id="zo">−</button><button class="sm ghost" id="zi">+</button><button class="sm ghost" id="hc">${S.handCollapsed?"Show":"Hide"} hand</button><button class="sm ghost" id="lg">Log</button><button class="sm ghost" id="rs">Restart</button><label class="hint"><input type="checkbox" id="sa" ${S.stopAll?"checked":""}> stop at every step</label></div><div class="log" id="mlog" style="display:${M.showLog?"block":"none"}">${M.log.slice(0,80).map(l=>`<div>${esc(l)}</div>`).join("")}</div>`;
 for(const w of["me","opp"]){const P=PL(w);const put=(z,l)=>{const b=T.querySelector(`[data-z="${w}-${z}"]`);if(b)l.forEach(c=>b.append(mcard(c,z==="lands"||z==="perms"?"bf":z,w)))};
  put("lands",P.bf.filter(isLand));put("perms",P.bf.filter(c=>!isLand(c)).sort((a,b)=>isCre(b)-isCre(a)));put("cmd",P.cmd);put("hand",P.hand);
  T.querySelector(`#mlife-${w}`).onclick=()=>{if(M.tgt){const h=M.tgt.list.find(x=>x.p===w);if(h)M.tgt.res(h);else toast("Not a legal target");return}playerMenu(w)};
  ["lib","gy","ex"].forEach(z=>T.querySelector(`[data-pile="${w}-${z}"]`).onclick=()=>pileMenu(w,z))}
 const H=T.querySelector('[data-z="me-hand"]'),n=PL("me").hand.length;[...H.children].forEach((e,i)=>{const m=i-(n-1)/2;e.style.setProperty("--r",m*Math.min(5,36/n)+"deg");e.style.setProperty("--y",Math.abs(m)*Math.min(5,26/n)+"px")});
 const SB=T.querySelector('[data-z="stack"]');M.stack.forEach((s,i)=>{const e=cardEl(s.card,{noTilt:true,click:()=>{if(M.tgt){const h=M.tgt.list.find(x=>x.u===s.u);if(h)M.tgt.res(h);else toast("Not a legal target")}else cardMenu(s.card,"stack",s.ctrl)}});e.dataset.u=s.u;e.style.animation="none";if(M.tgt&&M.tgt.list.includes(s))e.classList.add("tgl");
  e.insertAdjacentHTML("beforeend",`<span class="slab ${s.ctrl}">${s.kind==="spell"?"":"⚡"+esc(s.label)}${i===M.stack.length-1?" (top)":""}</span>`);SB.append(e)});
 // prompt & buttons
 const pr=$("#mprompt"),bt=$("#mbtns");const B=(t,f,c="")=>{const b=document.createElement("button");b.textContent=t;b.className="sm "+c;b.onclick=f;bt.append(b)};
 if(M.over){pr.textContent=M.log[0];B("New game",mtgStart)}
 else if(M.phase==="mull"){pr.textContent="Opening hand – keep or mulligan (London).";B("Keep",mKeep);B("Mulligan",mMull,"ghost")}
 else if(M.phase==="bottom"){pr.textContent=`Tap ${M.bottom} card(s) in your hand to put on the bottom of your library.`}
 else if(M.tgt){pr.textContent=`Choose a target for ${M.tgt.src} (glowing).`;B("Cancel",()=>M.tgt.res(null),"ghost")}
 else if(M.disc){pr.textContent=`Cleanup: discard ${M.disc} card(s) down to 7.`}
 else if(M.decl==="atk"){pr.textContent="Declare attackers: tap creatures to attack (vigilance won't tap).";B(`Attack (${M.sel.size})`,()=>M.declRes());B("No attack",()=>{M.sel.clear();M.declRes()},"ghost")}
 else if(M.decl==="blk"){pr.textContent=M.bsel?`Now tap the attacker ${M.bsel.name} will block.`:"Declare blockers: tap your untapped creature, then an attacker. Tap a blocker again to cancel.";B("Confirm blocks",()=>M.declRes())}
 else if(M.wait&&M.prio==="me"){const top=M.stack[M.stack.length-1];pr.textContent=top?`${top.ctrl==="opp"?PL("opp").nm+"'s":"Your"} ${top.card.name} is on the stack – respond with an instant or pass to let it resolve.`:`${M.active==="me"?"Your":"Opponent's"} ${STEPL[st]} – you have priority.${M.active==="me"&&/main/.test(st)?" Play a land, cast spells, tap lands for mana.":""}`;
  B(top?"Pass (resolve)":`Pass → ${STEPL[STEPS[(M.step+1)%12]]}`,()=>wake("pass"));if(M.active==="me"&&!top)B("End turn ⏭",()=>{M.autoEnd=true;wake("pass")},"ghost")}
 else pr.innerHTML='<span class="typing"><i></i><i></i><i></i></span> '+esc(PL(M.prio).nm)+(M.prio==="opp"?" is thinking…":"…");
 $("#zo").onclick=()=>{S.bz=Math.max(36,(S.bz||64)-8);saveS();mrender()};$("#zi").onclick=()=>{S.bz=Math.min(140,(S.bz||64)+8);saveS();mrender()};$("#hc").onclick=()=>{S.handCollapsed=!S.handCollapsed;saveS();mrender()};
 $("#lg").onclick=()=>{M.showLog=!M.showLog;mrender()};$("#rs").onclick=()=>{M.id=-1;mtgStart()};$("#sa").onchange=e=>{S.stopAll=e.target.checked;saveS()};
 // FLIP animations
 if(S.anim!=="off")T.querySelectorAll("[data-u]").forEach(e=>{const r=e.getBoundingClientRect(),o=old[e.dataset.u];let from=o;
  if(!o){const[c,w,z]=findU(e.dataset.u);from=z==="hand"?piles[(w||"me")+"-lib"]:null}
  if(from&&e.animate){const dx=from.left+from.width/2-r.left-r.width/2,dy=from.top+from.height/2-r.top-r.height/2;if(Math.abs(dx)+Math.abs(dy)>4)e.animate([{translate:`${dx}px ${dy}px`,scale:String(Math.max(.4,Math.min(1.6,from.width/(r.width||1))))},{translate:"0 0",scale:"1"}],{duration:450*(S.anim==="subtle"?.5:1),easing:"cubic-bezier(.3,.9,.3,1.1)"})}
  else if(!o&&e.animate)e.animate([{opacity:0,scale:"1.6"},{opacity:1,scale:"1"}],{duration:350})})}
/* ---------- interaction ---------- */
function onC(c,zone,owner){if(M.over)return;
 if(M.tgt){const h=M.tgt.list.find(x=>x.u===c.u);if(h)M.tgt.res(h);else toast("Not a legal target");return}
 if(M.phase==="mull"){cardMenu(c,zone,owner);return}
 if(M.phase==="bottom"&&owner==="me"&&zone==="hand"){const P=PL("me");P.hand.splice(P.hand.indexOf(c),1);P.lib.unshift(c);if(--M.bottom<=0)mKeep();else mrender();return}
 if(M.disc&&owner==="me"&&zone==="hand"){moveTo(c,"gy");logm(`You discard ${c.name}`);if(--M.disc<=0)M.discRes();mrender();return}
 if(M.decl==="atk"&&owner==="me"&&zone==="bf"){if(canAttack(c)){M.sel.has(c.u)?M.sel.delete(c.u):M.sel.add(c.u);sfx("click")}else toast(isCre(c)?(c.tapped?"Tapped":kw(c,"defender")?"Defender can't attack":"Summoning sick"):"Not a creature");mrender();return}
 if(M.decl==="blk"){if(owner==="me"&&zone==="bf"&&isCre(c)){if(c.blk){c.blk=null;M.bsel=null}else if(!c.tapped)M.bsel=c;else toast("Tapped creatures can't block");mrender();return}
  if(c.atk&&M.bsel){if(canBlock(M.bsel,c)){M.bsel.blk=c.u;M.bsel=null;sfx("click")}else toast("Can't block it (flying needs flying/reach)");mrender();return}}
 if(owner==="me"&&M.wait&&M.prio==="me"&&!M.busy){
  if(zone==="hand"||zone==="cmd"){if(isLand(c)){if(canLand(c,"me")){playLand(c,"me");wake("acted")}else toast("One land per turn, in your main phase, with an empty stack");return}
   if(canCast(c,"me")){M.busy=true;cast(c,"me").then(ok=>{M.busy=false;if(ok)wake("pass");else mrender()})}
   else toast(!instantSpeed(c)&&!(M.active==="me"&&/main/.test(STEPS[M.step])&&!M.stack.length)?"Sorcery speed: your main phase with an empty stack":"Can't pay "+(c.mc||"cost")+(c.cmdr&&PL("me").tax?` + tax ${PL("me").tax*2}`:"")+" (or no legal target)");return}
  if(zone==="bf"&&!c.tapped&&manaOut(c)){tapMana(c);return}}
 cardMenu(c,zone,owner)}
async function tapMana(c){const o=manaOut(c),P=PL(c.ctrl);let add=o.fx;
 if(!add){if(o.ch.length===1)add=o.ch;else{const k=await modal(`<h3>${esc(c.name)}: add which mana?</h3><div class="bar">${o.ch.map(x=>`<button class="sm" data-col="${x}" style="background:${PIPC[x]}">${x}</button>`).join("")}</div>`);const pick=M._col;M._col=null;if(!pick)return;add=[pick]}}
 c.tapped=true;add.forEach(x=>P.pool[x]++);sfx("click");logm(`${P.nm} tap ${c.name} for ${add.map(x=>"{"+x+"}").join("")}`);mrender()}
document.addEventListener("click",e=>{const b=e.target.closest("[data-col]");if(b){M._col=b.dataset.col;$("#mCancel").click()}});
function effText(e){return ({dmg:`deal ${e.n} damage (${e.k})`,draw:`draw ${e.n}`,gain:`gain ${e.n} life`,lose:`opponent loses ${e.n}`,destroy:`destroy ${e.k}`,wrath:`destroy all ${e.k}`,exile:`exile ${e.k}`,bounce:`bounce ${e.k}`,token:`create ${e.n} ${e.p}/${e.q} ${e.nm}`,ctr:`+1/+1 counter ×${e.n} (${e.k})`,pump:`+${e.p}/+${e.q} (${e.k})`,counter:"counter target spell",ramp:`fetch ${e.n} basic land`,tap:"tap target creature",discard:`opponent discards ${e.n}`})[e.t]||e.t}
async function cardMenu(c,zone,owner){const p=parseCard(c);const aut=[["Spell",p.spell],["ETB",p.etb],["Attack",p.atk]].filter(x=>x[1].length);
 const kws=(c.kw||[]).join(", ");const ctrl=c.ctrl||owner;
 const acts=[["tap",c.tapped?"Untap":"Tap"],["c+","+1/+1 counter"],["c-","−1/+1 counter"],["d+","+1 damage"],["hand","→ Hand"],["bf","→ Battlefield"],["gy","→ Graveyard"],["ex","→ Exile"],["lib","→ Library top"],["libb","→ Library bottom"],["ctl","Give control"]];
 const h=`<div style="display:flex;gap:12px;flex-wrap:wrap"><div style="width:180px">${c.img?`<img src="${esc(c.img)}" style="width:100%;border-radius:10px">`:cardFace(c)}</div><div style="flex:1;min-width:200px"><h3 style="margin:0">${esc(c.name)} ${pips(c.mc)}</h3><small>${esc(c.type)}</small>
  <p style="white-space:pre-wrap;font-size:13px">${esc(c.text||"")}</p>${kws?`<p class="ok" style="font-size:12px">Keywords (automated): ${esc(kws)}</p>`:""}
  ${aut.map(([k,l])=>`<p class="ok" style="font-size:12px">Automated ${k}: ${l.map(effText).join("; ")}</p>`).join("")}${p.anth?`<p class="ok" style="font-size:12px">Static anthem automated</p>`:""}
  ${p.un.length?`<p class="no" style="font-size:12px">Not automated – resolve by hand: ${esc(p.un.join(" | "))}</p>`:""}</div></div>
  <div class="sec">Manual actions</div><div class="bar">${acts.map(([a,t])=>`<button class="sm ghost" data-ma="${a}">${t}</button>`).join("")}</div>
  ${aut.length?`<div class="bar">${aut.map(([k],i)=>`<button class="sm" data-mx="${i}">Apply ${k} effect now</button>`).join("")}</div>`:""}`;
 M._ma=null;const pr=modal(h);document.querySelectorAll("[data-ma],[data-mx]").forEach(b=>b.onclick=()=>{M._ma=b.dataset.ma||("x"+b.dataset.mx);$("#mCancel").click()});await pr;const a=M._ma;if(!a)return;
 const inZone=findU(c.u)[2];
 if(a[0]==="x"){const[,l]=aut[+a.slice(1)];const tgs=[];for(const e of l){tgs.push(needsT(e)?await chooseTarget(e,ctrl,c.name):null)}for(let i=0;i<l.length;i++)await applyEff(l[i],ctrl,c,tgs[i]);logm(`(manual) ${c.name} effect applied`)}
 else if(a==="tap"){c.tapped=!c.tapped}else if(a==="c+")c.ctr++;else if(a==="c-")c.ctr--;else if(a==="d+")c.dmg=(c.dmg||0)+1;
 else if(a==="ctl"){if(inZone==="bf"){const P=PL(c.ctrl);P.bf.splice(P.bf.indexOf(c),1);c.ctrl=opp(c.ctrl);PL(c.ctrl).bf.push(c)}}
 else{if(inZone==="stack"){M.stack.splice(M.stack.findIndex(s=>s.card===c),1);c.u=c.u}
  if(a==="libb"){moveTo(c,"lib");const L=PL(c.own).lib;L.unshift(L.pop())}else moveTo(c,a,a==="bf"?ctrl:undefined);if(a==="bf"){c.sick=true}logm(`(manual) ${c.name} → ${a}`)}
 sba();mrender()}
async function playerMenu(w){const P=PL(w);M._ma=null;const pr=modal(`<h3>${esc(P.nm)} – ${P.life} life</h3><div class="bar">${[["-5","−5"],["-1","−1"],["+1","+1"],["+5","+5"],["draw","Draw a card"],["shuf","Shuffle library"],["mill","Mill 1"],["pool","Empty mana pool"]].map(([a,t])=>`<button class="sm ghost" data-ma="${a}">${t}</button>`).join("")}</div><p class="hint">Commander damage taken: ${esc(JSON.stringify(P.cdmg))}</p>`);
 document.querySelectorAll("[data-ma]").forEach(b=>b.onclick=()=>{M._ma=b.dataset.ma;$("#mCancel").click()});await pr;const a=M._ma;if(!a)return;
 if(/^[+-]\d/.test(a)){P.life+=+a;flashLife(w)}else if(a==="draw")drawN(w,1);else if(a==="shuf"){shuffle(P.lib);shufM()}else if(a==="mill"&&P.lib.length)moveTo(P.lib[P.lib.length-1],"gy");else if(a==="pool")P.pool={W:0,U:0,B:0,R:0,G:0,C:0};
 logm(`(manual) ${P.nm}: ${a}`);sba();mrender()}
async function pileMenu(w,z){const P=PL(w);if(z==="lib"&&w==="opp"){toast(`${P.lib.length} cards in library`);return}const list=z==="lib"?P.lib.slice().reverse():P[z];
 $("#mBody").innerHTML="";const pr=modal(`<h3>${esc(P.nm)} – ${({lib:"Library (top first)",gy:"Graveyard",ex:"Exile"})[z]} (${list.length})</h3><div class="grid" id="pileG" style="--cw:80px"></div>`);
 const g=$("#pileG");list.forEach(c=>g.append(cardEl(c,{noTilt:true,click:()=>{$("#mCancel").click();setTimeout(()=>cardMenu(c,z,w),350)}})));await pr}
