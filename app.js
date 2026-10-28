"use strict";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms*(S.anim==="off"?0:1)));
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const uid=()=>Math.random().toString(36).slice(2,10);
/* ---------- settings ---------- */
const PRESETS={"Pride Gold":["#f0b43c","#8b5cf6","#120d1c","#1d1530"],"Emerald Wilds":["#34d399","#0ea5e9","#08140f","#11261d"],"Crimson Forge":["#f87171","#f59e0b","#170a0a","#2a1212"],"Azure Tide":["#60a5fa","#a78bfa","#0a1020","#121c36"],"Void Night":["#e879f9","#22d3ee","#07060c","#16122a"],"Bone White":["#d6c7a1","#94a3b8","#141414","#262626"]};
const DEF={acc:"#f0b43c",acc2:"#8b5cf6",bg:"#120d1c",bg2:"#1d1530",anim:"full",bgStyle:"particles",cw:120,name:"Ajani",avatar:"",
 persona:"You are Ajani, a wise, warm lion-sage and expert deck-building coach for Magic: The Gathering Commander and Yu-Gi-Oh!. Be concise, practical and encouraging. Explain synergy clearly and suggest specific real cards.",
 model:"Qwen2.5-1.5B-Instruct-q4f16_1-MLC",apiBase:"",apiKey:"",apiModel:"gpt-4o-mini",temp:0.7,diff:"normal",oppMtg:"sample",oppYgo:"sample",
 sleeve:"#6d28d9",sleeveImg:"",mat:"#1a2a22",matImg:"",sound:true,defGame:"mtg"};
let S={...DEF,...JSON.parse(localStorage.ajaniS||"{}")};
const saveS=()=>{localStorage.ajaniS=JSON.stringify(S);applyS()};
function applyS(){const r=document.documentElement.style;
 r.setProperty("--acc",S.acc);r.setProperty("--acc2",S.acc2);r.setProperty("--bg",S.bg);r.setProperty("--bg2",S.bg2);r.setProperty("--cw",S.cw+"px");
 r.setProperty("--sleeve",S.sleeveImg?`url(${S.sleeveImg})`:S.sleeve);r.setProperty("--mat",S.matImg?`url(${S.matImg})`:S.mat);
 r.setProperty("--d",S.anim==="subtle"?0.5:1);
 document.body.classList.toggle("anim-off",S.anim==="off");document.body.classList.toggle("anim-force",S.anim==="full"&&S.forceMotion);
 document.body.classList.toggle("bg-gradient",S.bgStyle!=="solid");
 $("#hName").textContent=S.name;$("#hAva").innerHTML=avaHTML();$('meta[name=theme-color]').content=S.bg}
function avaHTML(){if(S.avatar&&/^(data:|https?:)/.test(S.avatar))return `<img src="${esc(S.avatar)}" alt="">`;
 if(S.avatar)return `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="${S.bg2}" stroke="${S.acc}" stroke-width="3"/><text x="50" y="66" font-size="48" text-anchor="middle">${esc(S.avatar)}</text></svg>`;
 return `<svg viewBox="0 0 100 100"><defs><radialGradient id="mg"><stop offset="0" stop-color="${S.acc}"/><stop offset="1" stop-color="${S.acc2}"/></radialGradient></defs>
 <g class="halo"><circle cx="50" cy="50" r="47" fill="none" stroke="${S.acc}" stroke-width="1.5" stroke-dasharray="4 7"/></g>
 <g class="mane"><path fill="url(#mg)" d="M50 8l8 10 12-5 2 13 13 2-5 12 10 9-10 8 5 12-13 2-2 13-12-5-8 10-8-10-12 5-2-13-13-2 5-12-10-8 10-9-5-12 13-2 2-13 12 5z"/></g>
 <ellipse cx="50" cy="54" rx="22" ry="24" fill="#f5deb3"/><path d="M36 40q6-6 12 0M52 40q6-6 12 0" stroke="#5b3b1a" stroke-width="2" fill="none"/>
 <ellipse class="eye" cx="42" cy="48" rx="3" ry="4" fill="#1f2937"/><ellipse cx="58" cy="48" rx="3" ry="4" fill="#1f2937"/>
 <path d="M60 37l4 14" stroke="#7c2d12" stroke-width="2"/><path d="M45 62h10l-5 5z" fill="#7c2d12"/><path d="M50 67q-6 6-10 2M50 67q6 6 10 2" stroke="#7c2d12" stroke-width="1.5" fill="none"/></svg>`}
/* ---------- sound ---------- */
let AC;function sfx(t){if(!S.sound)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain(),n=AC.currentTime;
 const p={click:[600,.05,"triangle"],add:[880,.12,"sine"],draw:[400,.08,"triangle"],play:[300,.18,"sawtooth"],hit:[120,.3,"square"],win:[1000,.6,"sine"],shuffle:[200,.25,"triangle"]}[t]||[500,.05,"sine"];
 o.type=p[2];o.frequency.setValueAtTime(p[0],n);o.frequency.exponentialRampToValueAtTime(p[0]*(t==="hit"?.5:1.5),n+p[1]);g.gain.setValueAtTime(.08,n);g.gain.exponentialRampToValueAtTime(.001,n+p[1]);o.connect(g).connect(AC.destination);o.start();o.stop(n+p[1])}catch{}}
/* ---------- background ---------- */
const cv=$("#bg"),cx=cv.getContext("2d");let parts=[];
function bgResize(){cv.width=innerWidth*devicePixelRatio;cv.height=innerHeight*devicePixelRatio;parts=Array.from({length:innerWidth<600?35:70},()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,r:(Math.random()*2+.5)*devicePixelRatio,v:Math.random()*.4+.1,p:Math.random()*6}))}
function bgLoop(t){cx.clearRect(0,0,cv.width,cv.height);
 if(S.anim!=="off"&&!matchMedia("(prefers-reduced-motion:reduce)").matches||S.forceMotion){const sp=S.anim==="subtle"?.4:1;
  if(S.bgStyle==="particles")for(const p of parts){p.y-=p.v*sp*devicePixelRatio;p.x+=Math.sin(t/1500+p.p)*.3*sp;if(p.y<-5){p.y=cv.height+5;p.x=Math.random()*cv.width}
   cx.globalAlpha=.35+.35*Math.sin(t/600+p.p);cx.fillStyle=p.p>3?S.acc:S.acc2;cx.beginPath();cx.arc(p.x,p.y,p.r,0,7);cx.fill()}
  else if(S.bgStyle==="aurora"){for(let i=0;i<3;i++){const g=cx.createRadialGradient(cv.width*(.5+.4*Math.sin(t/(4000+i*900)+i*2)),cv.height*(.4+.3*Math.cos(t/(5000+i*700)+i)),0,cv.width/2,cv.height/2,cv.width*.8);g.addColorStop(0,(i%2?S.acc:S.acc2)+"33");g.addColorStop(1,"transparent");cx.globalAlpha=1;cx.fillStyle=g;cx.fillRect(0,0,cv.width,cv.height)}}
  else if(S.bgStyle==="runes"){cx.globalAlpha=.12;cx.strokeStyle=S.acc;cx.lineWidth=1.5*devicePixelRatio;for(let i=0;i<4;i++){cx.beginPath();cx.arc(cv.width/2,cv.height/2,(80+i*70)*devicePixelRatio,t/(3000+i*1000)*(i%2?1:-1),t/(3000+i*1000)*(i%2?1:-1)+4.5);cx.stroke()}}}
 requestAnimationFrame(bgLoop)}
addEventListener("resize",bgResize);
/* ---------- UI helpers ---------- */
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove("on"),2200)}
function modal(html,ok){$("#mBody").innerHTML=html;$("#modal").classList.add("on");$("#mOk").style.display=ok?"":"none";
 return new Promise(res=>{$("#mOk").onclick=()=>{const v=ok?ok():true;$("#modal").classList.remove("on");res(v)};$("#mCancel").onclick=()=>{$("#modal").classList.remove("on");res(null)}})}
function banner(t){const b=document.createElement("div");b.className="banner";b.textContent=t;document.body.appendChild(b);setTimeout(()=>b.remove(),1700)}
function zoom(c){if(!c)return;const z=$("#zoom");z.innerHTML=`<div class="in">${c.img?`<img src="${esc(c.img)}">`:cardFace(c)}<p><b>${esc(c.name)}</b> — ${esc(c.type)}\n${esc(c.text||"")}</p></div>`;z.classList.add("on");z.onclick=()=>z.classList.remove("on");sfx("click")}
function cardFace(c){return `<div class="fake"><b>${esc(c.name)}</b><small>${esc(c.type||"")}</small><span class="pt">${G==="ygo"||c.atk!=null?`${c.atk??"?"}/${c.def??"?"}`:c.pow!=null?`${c.pow}/${c.tou}`:typeof c.cmc==="number"&&!/Land/.test(c.type||"")?c.cmc:""}</span></div>`}
function cardEl(c,o={}){const d=document.createElement("div");d.className="card"+(o.cls?" "+o.cls:"");if(o.delay!=null)d.style.animationDelay=o.delay+"s";
 d.innerHTML=(o.back?'<div class="back"></div>':c.img?`<img loading="lazy" src="${esc(c.img)}" alt="${esc(c.name)}">`:cardFace(c))+'<div class="glare"></div>'+(o.badge?`<span class="bad">${esc(o.badge)}</span>`:"");
 if(!o.noTilt&&S.anim!=="off"){d.onpointermove=e=>{if(e.pointerType==="touch")return;const r=d.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;d.style.transform=`rotateY(${(x-.5)*24}deg) rotateX(${(.5-y)*24}deg) scale(1.06)`;d.style.setProperty("--gx",x*100+"%");d.style.setProperty("--gy",y*100+"%")};d.onpointerleave=()=>d.style.transform=""}
 if(o.add){const b=document.createElement("button");b.className="add";b.textContent="+";b.title="Add";b.onclick=e=>{e.stopPropagation();o.add(d)};d.appendChild(b)}
 if(o.drag){d.draggable=true;d.ondragstart=e=>{e.dataTransfer.setData("text/plain",JSON.stringify(c));sfx("click")}}
 d.onclick=o.click?()=>o.click(d):()=>zoom(c);return d}
function fly(fromEl,toEl,c,back){if(!fromEl||!toEl||S.anim==="off")return;const a=fromEl.getBoundingClientRect?fromEl.getBoundingClientRect():fromEl,b=toEl.getBoundingClientRect();if(!a.width)return;
 const f=document.createElement("div");f.className="fly";f.style.cssText=`left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px`;
 f.innerHTML=back?'<div class="back"></div>':c&&c.img?`<img src="${esc(c.img)}" style="width:100%;height:100%;object-fit:cover">`:c?cardFace(c):'<div class="back"></div>';document.body.appendChild(f);
 requestAnimationFrame(()=>requestAnimationFrame(()=>{f.style.transform=`translate(${b.left+b.width/2-a.left-a.width/2}px,${b.top+b.height/2-a.top-a.height/2}px) scale(${Math.max(.3,Math.min(1,b.height/a.height))}) rotate(${Math.random()*20-10}deg)`;f.style.opacity=".2"}));
 setTimeout(()=>f.remove(),600*(S.anim==="subtle"?.5:1)+50)}
/* ---------- game / view switching ---------- */
let G=S.defGame||"mtg",V="build";
function setGame(g){G=g;$("#gameSw").classList.toggle("ygo",g==="ygo");$$("#gameSw button").forEach(b=>b.classList.toggle("on",b.dataset.g===g));
 $("#sQ").placeholder=g==="mtg"?"Search Scryfall… e.g. t:legendary c:g lifegain":"Search YGOPRODeck… e.g. Blue-Eyes";
 $("#sHint").textContent=g==="mtg"?"Drag cards onto your deck or tap +. Set a commander first; search auto-filters to its colour identity.":"Drag cards onto your deck or tap +. Fusion/Synchro/Xyz/Link go to the Extra Deck automatically.";
 $("#results").innerHTML="";game=null;renderDeckSel();renderDeck();resetChat();if(V==="play")startGame();if(V==="stats")$("#simOut").innerHTML=""}
const TRANS={build:[[{opacity:0,transform:"translateX(60%) rotateY(-70deg) scale(.7)"},{opacity:1,transform:"none"}],"slide-through-deck"],
 ajani:[[{opacity:0,transform:"scale(.1) rotate(-540deg)",filter:"blur(12px)"},{opacity:1,transform:"none",filter:"blur(0)"}],"portal vortex"],
 play:[[{opacity:0,clipPath:"polygon(50% 50%,50% 50%,50% 50%,50% 50%,50% 50%,50% 50%)",transform:"scale(1.15)"},{opacity:1,clipPath:"polygon(-60% -60%,60% -80%,160% -60%,180% 60%,40% 180%,-80% 120%)",transform:"none"}],"shatter"],
 stats:[[{opacity:0,transform:"perspective(900px) rotateX(-95deg)",transformOrigin:"top"},{opacity:1,transform:"perspective(900px) rotateX(0)",transformOrigin:"top"}],"page turn"],
 set:[[{opacity:0,transform:"rotate(200deg) scale(.4)",filter:"hue-rotate(180deg) saturate(3)"},{opacity:1,transform:"none",filter:"none"}],"mana swirl"]};
const OUT={build:{transform:"translateX(-60%) rotateY(70deg) scale(.7)"},ajani:{transform:"scale(2.5) rotate(180deg)",filter:"blur(10px)"},play:{transform:"scale(1.3) rotate(8deg)",filter:"brightness(3)"},stats:{transform:"perspective(900px) rotateX(95deg)",transformOrigin:"bottom"},set:{transform:"rotate(-200deg) scale(.3)"}};
const motionOK=()=>S.anim!=="off"&&(S.forceMotion||!matchMedia("(prefers-reduced-motion:reduce)").matches);
function setView(v){const prev=$(".view.on"),next=$("#v-"+v);if(motionOK()&&prev&&prev!==next&&next.animate){const d=S.anim==="subtle"?350:650;
  prev.animate([{opacity:1,transform:"none"},{opacity:0,...OUT[v]}],{duration:d*.7,easing:"ease-in"});next.animate(TRANS[v][0],{duration:d,easing:"cubic-bezier(.2,.9,.3,1.1)"})}
 V=v;$("#fabL").textContent={build:"Build",ajani:"Ajani",play:"Play",stats:"Stats",set:"Settings"}[v];$$(".view").forEach(x=>x.classList.toggle("on",x.id==="v-"+v));$$("#tabs button").forEach(b=>b.classList.toggle("on",b.dataset.v===v));sfx("click");
 if(v==="play"&&!game)startGame();if(v==="set")renderSettings()}
/* ---------- card data ---------- */
const SF="https://api.scryfall.com",YG="https://db.ygoprodeck.com/api/v7/cardinfo.php";
function nMtg(c){const f=c.card_faces&&c.card_faces[0];const iu=c.image_uris||(f&&f.image_uris)||{};
 return{id:c.id,name:c.name,img:iu.normal||iu.small||"",type:c.type_line||(f&&f.type_line)||"",cmc:c.cmc||0,ci:c.color_identity||[],legal:(c.legalities||{}).commander,mc:c.mana_cost??(f&&f.mana_cost)??"",prod:c.produced_mana||[],
  pow:c.power??(f&&f.power),tou:c.toughness??(f&&f.toughness),text:c.oracle_text||(f&&f.oracle_text)||"",kw:c.keywords||[]}}
const EXTRA=/fusion|synchro|xyz|link/;
function nYgo(c){const ban=(c.banlist_info||{}).ban_tcg;return{id:c.id,name:c.name,img:(c.card_images&&c.card_images[0].image_url_small)||"",type:c.type,ft:c.frameType||"",
 atk:c.atk,def:c.def,lvl:c.level||c.linkval||0,arch:c.archetype||"",race:c.race,attr:c.attribute,text:c.desc||"",lim:ban==="Forbidden"?0:ban==="Limited"?1:ban==="Semi-Limited"?2:3,ban:ban||""}}
async function sfSearch(q){const r=await fetch(SF+"/cards/search?unique=cards&order=edhrec&q="+encodeURIComponent(q));if(r.status===404)return[];if(!r.ok)throw Error("Scryfall "+r.status);return (await r.json()).data.map(nMtg)}
async function ygSearch(p){const r=await fetch(YG+"?"+p);if(r.status===400)return[];if(!r.ok)throw Error("YGOPRODeck "+r.status);return (await r.json()).data.slice(0,80).map(nYgo)}
/* ---------- decks ---------- */
let D=JSON.parse(localStorage.ajaniD||'{"mtg":[],"ygo":[]}'),cur={mtg:localStorage.ajaniCm||"",ygo:localStorage.ajaniCy||""};
const saveD=()=>{localStorage.ajaniD=JSON.stringify(D);localStorage.ajaniCm=cur.mtg;localStorage.ajaniCy=cur.ygo};
function deck(){let d=D[G].find(x=>x.id===cur[G]);if(!d){d=D[G][0];if(!d){d=newDeck("My first deck")}cur[G]=d.id;saveD()}return d}
function newDeck(name){const d={id:uid(),name,cmdr:null,main:[],extra:[],side:[]};D[G].push(d);cur[G]=d.id;saveD();return d}
const count=l=>l.reduce((a,c)=>a+c.q,0);
function renderDeckSel(){const s=$("#deckSel");const d=deck();s.innerHTML=D[G].map(x=>`<option value="${x.id}" ${x.id===d.id?"selected":""}>${esc(x.name)}</option>`).join("")}
$("#deckSel").onchange=e=>{cur[G]=e.target.value;saveD();renderDeck()};
$("#newDeck").onclick=async()=>{const n=await modal('<h3>New deck</h3><input id="nd" style="width:100%" placeholder="Deck name">',()=>$("#nd").value.trim());if(n){newDeck(n);renderDeckSel();renderDeck();sfx("add")}};
$("#renDeck").onclick=async()=>{const d=deck();const n=await modal(`<h3>Rename</h3><input id="nd" style="width:100%" value="${esc(d.name)}">`,()=>$("#nd").value.trim());if(n){d.name=n;saveD();renderDeckSel()}};
$("#delDeck").onclick=async()=>{const d=deck();if(await modal(`<h3>Delete “${esc(d.name)}”?</h3>`,()=>1)){D[G]=D[G].filter(x=>x!==d);cur[G]="";saveD();renderDeckSel();renderDeck()}};
function isBasic(c){return/Basic/.test(c.type)||/relentless|persistent petitioners|shadowborn apostle|rat colony|dragon's approach|seven dwarves|slime against humanity/i.test(c.text+c.name)&&/any number|A deck can have/i.test(c.text)}
function zoneFor(c){return EXTRA.test(c.ft)?"extra":"main"}
function addCard(c,el,zone){const d=deck();sfx("add");
 if(G==="mtg"){if(!d.cmdr&&/Legendary.*Creature|can be your commander/i.test(c.type+c.text)&&!zone){setCmdr(c,el);return}
  const ex=d.main.find(x=>x.name===c.name);if(ex){if(!isBasic(c)){toast("Singleton: already in deck");return}ex.q++}else d.main.push({...c,q:1})}
 else{zone=zone||zoneFor(c);const tot=["main","extra","side"].reduce((a,z)=>a+(d[z].find(x=>x.id===c.id)?.q||0),0);
  if(tot>=Math.min(3,c.lim)){toast(c.lim<3?`${c.ban}: max ${c.lim}`:"Max 3 copies");return}
  const ex=d[zone].find(x=>x.id===c.id);if(ex)ex.q++;else d[zone].push({...c,q:1})}
 saveD();const prevEl=el;renderDeck(c.name);const tgt=$(`#deckList [data-n="${CSS.escape(c.name)}"]`)||$("#deckPane");fly(prevEl,tgt,c)}
function setCmdr(c,el){const d=deck();d.cmdr=c;d.main=d.main.filter(x=>x.name!==c.name);saveD();renderDeck();fly(el,$("#cmdr"),c);banner("Commander: "+c.name.split(",")[0]);sfx("win")}
function delCard(z,name){const d=deck(),l=d[z],i=l.findIndex(x=>x.name===name);if(i<0)return;if(--l[i].q<=0)l.splice(i,1);saveD();renderDeck();sfx("click")}
function incCard(z,name){const d=deck(),c=d[z].find(x=>x.name===name);if(c)addCard(c,null,z)}
function validate(d){const out=[];
 if(G==="mtg"){const n=count(d.main)+(d.cmdr?1:0);out.push([n===100,`${n}/100 cards`]);out.push([!!d.cmdr,d.cmdr?"Commander set":"No commander chosen (add a legendary creature)"]);
  const ci=d.cmdr?d.cmdr.ci:null;const badCi=ci?d.main.filter(c=>c.ci.some(x=>!ci.includes(x))):[];out.push([!badCi.length,badCi.length?`${badCi.length} card(s) outside colour identity`:"Colour identity OK"]);
  const il=d.main.concat(d.cmdr?[d.cmdr]:[]).filter(c=>c.legal&&c.legal!=="legal");out.push([!il.length,il.length?`Not Commander-legal: ${il.map(c=>c.name).join(", ")}`:"All cards legal"]);
  const dup=d.main.filter(c=>c.q>1&&!isBasic(c));out.push([!dup.length,dup.length?"Singleton broken: "+dup.map(c=>c.name).join(", "):"Singleton OK"]);
  return{out,bad:new Set([...badCi,...il,...dup].map(c=>c.name))}}
 const m=count(d.main),e=count(d.extra),s=count(d.side);out.push([m>=40&&m<=60,`Main ${m} (40–60)`],[e<=15,`Extra ${e} (0–15)`],[s<=15,`Side ${s} (0–15)`]);
 const tally={};["main","extra","side"].forEach(z=>d[z].forEach(c=>tally[c.id]=(tally[c.id]||0)+c.q));
 const over=Object.values(Object.fromEntries(["main","extra","side"].flatMap(z=>d[z].map(c=>[c.id,c])))).filter(c=>tally[c.id]>Math.min(3,c.lim));
 out.push([!over.length,over.length?"Over limit/banlist: "+over.map(c=>`${c.name} (${tally[c.id]}/${Math.min(3,c.lim)})`).join(", "):"Copy limits & TCG banlist OK"]);
 const wrong=d.main.filter(c=>EXTRA.test(c.ft));if(wrong.length)out.push([false,"Extra Deck monsters in Main: "+wrong.map(c=>c.name).join(", ")]);
 return{out,bad:new Set([...over,...wrong].map(c=>c.name))}}
function chart(title,obj){const mx=Math.max(1,...Object.values(obj));return `<div class="chart"><h4>${title}</h4><div class="bars">${Object.entries(obj).map(([k,v],i)=>`<div><small>${v||""}</small><i style="height:${v/mx*100}%;animation-delay:${i*.05}s"></i>${esc(k)}</div>`).join("")}</div></div>`}
function charts(d){const all=d.main;const ex=(l,f)=>{const o={};l.forEach(c=>{const k=f(c);if(k!=null)o[k]=(o[k]||0)+c.q});return o};
 if(G==="mtg"){const nl=all.filter(c=>!/Land/.test(c.type));const curve={};for(let i=0;i<=7;i++)curve[i===7?"7+":i]=0;nl.forEach(c=>curve[c.cmc>=7?"7+":c.cmc|0]+=c.q);
  const col={W:0,U:0,B:0,R:0,G:0,C:0};all.forEach(c=>{if(!c.ci.length)col.C+=c.q;c.ci.forEach(x=>col[x]+=c.q)});
  const ty=ex(all,c=>(c.type.match(/Creature|Land|Instant|Sorcery|Artifact|Enchantment|Planeswalker|Battle/)||["Other"])[0].slice(0,5));
  return chart("Mana curve",curve)+chart("Colour identity",col)+chart("Types",ty)+chart("Avg CMC "+(nl.length?(nl.reduce((a,c)=>a+c.cmc*c.q,0)/count(nl)).toFixed(2):"–"),{lands:count(all)-count(nl),spells:count(nl)})}
 const ty=ex(d.main,c=>/Spell/.test(c.type)?"Spell":/Trap/.test(c.type)?"Trap":"Monster");const lv=ex(d.main.filter(c=>c.lvl),c=>c.lvl>=7?"7+":c.lvl);
 const at=ex(d.main.filter(c=>c.attr),c=>c.attr.slice(0,4));const ext=ex(d.extra,c=>(c.ft.match(EXTRA)||["?"])[0]);
 return chart("Card types",ty)+chart("Monster levels",lv)+chart("Attributes",at)+chart("Extra deck",ext)}
function renderDeck(flashName){const d=deck(),v=validate(d);
 $("#cmdr").innerHTML="";if(G==="mtg"){if(d.cmdr){const e=cardEl(d.cmdr);$("#cmdr").append(e);const i=document.createElement("div");i.innerHTML=`<div class="sec">Commander</div><b>${esc(d.cmdr.name)}</b><br><small>${esc(d.cmdr.ci.join("")||"Colourless")}</small><br><button class="sm" id="clrC">Change</button>`;$("#cmdr").append(i);$("#clrC").onclick=()=>{d.main.push({...d.cmdr,q:1});d.cmdr=null;saveD();renderDeck()}}
  else $("#cmdr").innerHTML='<div class="hint">Search e.g. <b>t:legendary t:creature</b> and add one to set your commander.</div>'}
 $("#valid").innerHTML=v.out.map(([ok,t])=>`<div class="${ok?"ok":"no"}">${ok?"✔":"✖"} ${esc(t)}</div>`).join("");
 $("#charts").innerHTML=charts(d);
 const L=$("#deckList");L.innerHTML="";const zones=G==="mtg"?[["main","Deck"]]:[["main","Main"],["extra","Extra"],["side","Side"]];let k=0;
 for(const[z,t]of zones){const list=[...d[z]];if(!list.length&&G==="mtg")L.innerHTML+='<div class="hint">Your deck is empty. Drop cards here.</div>';
  const groups={};list.forEach(c=>{const g=G==="mtg"?(c.type.match(/Creature|Land|Instant|Sorcery|Artifact|Enchantment|Planeswalker|Battle/)||["Other"])[0]:z;(groups[g]=groups[g]||[]).push(c)});
  if(G==="ygo")L.insertAdjacentHTML("beforeend",`<div class="sec drop-z" data-z="${z}">${t} (${count(list)})</div>`);
  for(const[g,cs]of Object.entries(groups)){if(G==="mtg")L.insertAdjacentHTML("beforeend",`<div class="sec">${g} (${count(cs)})</div>`);
   cs.sort((a,b)=>(a.cmc||a.lvl||0)-(b.cmc||b.lvl||0)||a.name.localeCompare(b.name)).forEach(c=>{const r=document.createElement("div");r.className="row"+(v.bad.has(c.name)?" err":"")+(c.name===flashName?" flash":"");r.dataset.n=c.name;r.style.animationDelay=Math.min(k++*.015,.4)+"s";
    r.innerHTML=`<span class="q">${c.q}</span><span class="n">${esc(c.name)}</span>${G==="ygo"&&c.lim<3?`<small class="no">${c.ban}</small>`:""}${G==="ygo"?`<button class="sm mv" title="Move to side/main">⇄</button>`:""}<button class="sm mi">−</button><button class="sm pl">+</button>`;
    r.querySelector(".n").onclick=()=>zoom(c);r.querySelector(".mi").onclick=()=>delCard(z,c.name);r.querySelector(".pl").onclick=()=>incCard(z,c.name);
    const mv=r.querySelector(".mv");if(mv)mv.onclick=()=>{const to=z==="side"?zoneFor(c):"side";delCard(z,c.name);const ex=d[to].find(x=>x.id===c.id);ex?ex.q++:d[to].push({...c,q:1});saveD();renderDeck(c.name)};L.append(r)})}}}
const dp=$("#deckPane");dp.ondragover=e=>{e.preventDefault();dp.classList.add("over")};dp.ondragleave=()=>dp.classList.remove("over");
dp.ondrop=e=>{e.preventDefault();dp.classList.remove("over");try{const c=JSON.parse(e.dataTransfer.getData("text/plain"));const z=e.target.closest(".drop-z")?.dataset.z;addCard(c,null,z==="side"?"side":undefined);dp.animate?.([{transform:"scale(1.02)"},{transform:"none"}],300)}catch{}};
function showResults(cards,box=$("#results")){box.innerHTML="";if(!cards.length){box.innerHTML='<div class="hint">No cards found.</div>';return}
 const d=deck(),ci=G==="mtg"&&d.cmdr?d.cmdr.ci:null;
 cards.forEach((c,i)=>{let badge="";if(G==="mtg"){if(c.legal&&c.legal!=="legal")badge=c.legal.replace("_"," ");else if(ci&&c.ci.some(x=>!ci.includes(x)))badge="off-colour"}else if(c.lim<3)badge=c.ban;
  box.append(cardEl(c,{delay:Math.min(i*.03,.6),drag:true,add:el=>addCard(c,el),badge,cls:badge?"illegal":""}))})}
$("#sForm").onsubmit=async e=>{e.preventDefault();const q=$("#sQ").value.trim();if(!q)return;$("#results").innerHTML='<div class="typing"><i></i><i></i><i></i></div>';
 try{if(G==="mtg"){const d=deck();showResults(await sfSearch(q+(d.cmdr&&!/id[<:=]/.test(q)?` id<=${d.cmdr.ci.join("")||"c"}`:"")+" game:paper"))}
  else{const m=q.match(/^archetype:(.+)/i);showResults(await ygSearch(m?"archetype="+encodeURIComponent(m[1].trim()):"fname="+encodeURIComponent(q)))}}
 catch(err){$("#results").innerHTML=`<div class="hint no">Search failed: ${esc(err.message)}</div>`}};
/* ---------- import / export ---------- */
function exportText(d){if(G==="mtg")return (d.cmdr?`Commander\n1 ${d.cmdr.name}\n\nDeck\n`:"")+d.main.map(c=>`${c.q} ${c.name}`).join("\n");
 return "#created by Ajani\n#main\n"+d.main.flatMap(c=>Array(c.q).fill(c.id)).join("\n")+"\n#extra\n"+d.extra.flatMap(c=>Array(c.q).fill(c.id)).join("\n")+"\n!side\n"+d.side.flatMap(c=>Array(c.q).fill(c.id)).join("\n")+"\n"}
function download(name,text,type="text/plain"){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
$("#expDeck").onclick=async()=>{const d=deck(),t=exportText(d);await modal(`<h3>Export ${G==="mtg"?"decklist":".ydk"}</h3><textarea id="et" readonly>${esc(t)}</textarea><div class="bar"><button id="cpy" class="sm">Copy</button><button id="dl" class="sm">Download</button></div>`);};
document.addEventListener("click",e=>{if(e.target.id==="cpy"){navigator.clipboard?.writeText($("#et").value);toast("Copied")}if(e.target.id==="dl"){const d=deck();download(d.name.replace(/\W+/g,"_")+(G==="mtg"?".txt":".ydk"),$("#et").value)}if(e.target.id==="upl")$("#file").click()});
$("#impDeck").onclick=async()=>{$("#file").onchange=async e=>{const f=e.target.files[0];if(f)$("#it").value=await f.text();e.target.value=""};
 const t=await modal(`<h3>Import ${G==="mtg"?"decklist (e.g. “1 Sol Ring”, MTGA/Moxfield text)":".ydk"}</h3><textarea id="it" placeholder="Paste here"></textarea><div class="bar"><button id="upl" class="sm">Load file…</button></div><label><input type="checkbox" id="inew" checked> Import as new deck</label>`,()=>[$("#it").value,$("#inew").checked]);
 if(!t||!t[0].trim())return;toast("Importing…");try{await importDeck(t[0],t[1]);toast("Imported!");sfx("win")}catch(err){toast("Import failed: "+err.message)}};
async function importDeck(text,asNew){
 if(G==="mtg"){let sec="";const lines=[];for(let l of text.split(/\r?\n/)){l=l.trim();if(!l)continue;if(/^(commander|deck|sideboard|maybeboard|companion)\b/i.test(l)&&!/^\d/.test(l)){sec=l.toLowerCase();continue}
   const m=l.match(/^(\d+)x?\s+(.+?)(\s+\([A-Z0-9]+\).*)?(\s+\*CMDR\*)?$/i);if(m)lines.push({q:+m[1],name:m[2].replace(/\s+\*.*$/,"").trim(),cmd:sec.startsWith("commander")||/\*CMDR\*/i.test(l)})}
  const out=[];for(let i=0;i<lines.length;i+=75){const r=await fetch(SF+"/cards/collection",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({identifiers:lines.slice(i,i+75).map(x=>({name:x.name.split(" // ")[0]}))})});const j=await r.json();out.push(...j.data.map(nMtg));await new Promise(r=>setTimeout(r,120))}
  const d=asNew?newDeck("Imported "+new Date().toLocaleDateString()):deck();if(!asNew){d.main=[];d.cmdr=null}
  for(const l of lines){const c=out.find(x=>x.name.toLowerCase()===l.name.toLowerCase()||x.name.toLowerCase().startsWith(l.name.toLowerCase()+" //"));if(!c)continue;if(l.cmd&&!d.cmdr)d.cmdr=c;else{const ex=d.main.find(x=>x.name===c.name);ex?ex.q+=l.q:d.main.push({...c,q:l.q})}}}
 else{let z="main";const ids={main:[],extra:[],side:[]};for(let l of text.split(/\r?\n/)){l=l.trim();if(l==="#main")z="main";else if(l==="#extra")z="extra";else if(l==="!side")z="side";else if(/^\d+$/.test(l))ids[z].push(+l)}
  const all=[...new Set([...ids.main,...ids.extra,...ids.side])];const cards={};for(let i=0;i<all.length;i+=50){(await ygSearch("id="+all.slice(i,i+50).join(","))).forEach(c=>cards[c.id]=c)}
  const d=asNew?newDeck("Imported "+new Date().toLocaleDateString()):deck();if(!asNew){d.main=[];d.extra=[];d.side=[]}
  for(const zz of ["main","extra","side"])for(const id of ids[zz]){const c=cards[id];if(!c)continue;const ex=d[zz].find(x=>x.id===id);ex?ex.q++:d[zz].push({...c,q:1})}}
 saveD();renderDeckSel();renderDeck()}
/* ---------- Ajani AI ---------- */
const MODELS=[["Qwen2.5-0.5B-Instruct-q4f16_1-MLC","Qwen 0.5B – fastest (~400 MB)"],["Llama-3.2-1B-Instruct-q4f16_1-MLC","Llama 3.2 1B (~880 MB)"],["Qwen2.5-1.5B-Instruct-q4f16_1-MLC","Qwen 1.5B – balanced (~1.1 GB)"],["gemma-2-2b-it-q4f16_1-MLC","Gemma 2 2B (~1.9 GB)"],["Llama-3.2-3B-Instruct-q4f16_1-MLC","Llama 3.2 3B – smartest, desktop (~2.3 GB)"]];
let engine=null,gen=null,hist=[],busy=false;
const prog=(p,t)=>{$("#pb").style.width=Math.round(p*100)+"%";$("#st").textContent=t;if(p>=1)setTimeout(()=>$("#pb").style.width="0",600)};
async function loadAI(){if(S.apiKey&&S.apiBase){gen=apiGen;prog(1,"Using your API endpoint ("+S.apiModel+")");return}
 if(!navigator.gpu){prog(0,"WebGPU not available on this device/browser (needs iOS 26+ Safari or desktop Chrome). Rule-based mode active.");return}
 try{$("#loadAI").disabled=true;const webllm=await import("https://esm.run/@mlc-ai/web-llm@0.2.79");
  const cb=r=>prog(r.progress,"Loading "+S.model.split("-q4")[0]+"… "+Math.round(r.progress*100)+"% (downloads once)");
  if(engine)await engine.reload(S.model);else engine=await webllm.CreateMLCEngine(S.model,{initProgressCallback:cb});
  gen=async function*(h){const s=await engine.chat.completions.create({messages:h,stream:true,temperature:+S.temp,max_tokens:600});for await(const c of s)yield c.choices[0]?.delta?.content||""};
  prog(1,"On-device AI ready: "+S.model.split("-q4")[0])}catch(e){prog(0,"Model failed to load: "+e.message+". Rule-based mode active.")}finally{$("#loadAI").disabled=false}}
async function*apiGen(h){const r=await fetch(S.apiBase.replace(/\/$/,"")+"/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+S.apiKey},body:JSON.stringify({model:S.apiModel,messages:h,stream:true,temperature:+S.temp})});
 if(!r.ok)throw Error("API "+r.status+" "+(await r.text()).slice(0,200));const rd=r.body.getReader(),dec=new TextDecoder();let buf="";
 while(true){const{done,value}=await rd.read();if(done)break;buf+=dec.decode(value,{stream:true});const ls=buf.split("\n");buf=ls.pop();for(const l of ls){const m=l.match(/^data:\s*(.*)/);if(!m||m[1]==="[DONE]")continue;try{yield JSON.parse(m[1]).choices[0]?.delta?.content||""}catch{}}}}
$("#loadAI").onclick=loadAI;
function md(t){return esc(t).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/\[\[(.+?)\]\]/g,"<b>$1</b>").replace(/^[-*] (.*)$/gm,"• $1").replace(/\n/g,"<br>")}
function addMsg(role,html){const c=$("#chat"),w=document.createElement("div");w.className="mrow";w.style.alignSelf=role==="u"?"flex-end":"flex-start";
 w.innerHTML=(role==="a"?`<span class="ava xs">${avaHTML()}</span>`:"")+`<div class="msg ${role}">${html}</div>`;c.append(w);w.scrollIntoView({behavior:S.anim==="off"?"auto":"smooth",block:"end"});return w.querySelector(".msg")}
const CHIPS={mtg:["Suggest ramp for my commander","What synergy does my commander want?","Find card draw in my colours","Rate my mana curve","Suggest removal"],ygo:["Suggest cards for my archetype","Find hand traps","What's my brick rate?","Suggest Extra Deck options","Explain my deck's combo plan"]};
function resetChat(){hist=[];const c=$("#chat");c.innerHTML=`<div class="hero"><span class="ava" id="bigAva">${avaHTML()}</span><h2>I'm ${esc(S.name)}</h2><p class="hint">Your ${G==="mtg"?"Commander":"Yu-Gi-Oh!"} deck-building companion. I can search real cards for you, and with an AI model loaded I'll explain synergies in depth.</p><div class="chips">${CHIPS[G].map((t,i)=>`<button style="animation-delay:${i*.08}s">${t}</button>`).join("")}</div></div>`;
 c.querySelectorAll(".chips button").forEach(b=>b.onclick=()=>{$("#cQ").value=b.textContent;$("#cForm").requestSubmit()})}
const THEMES=[["token","tokens|create .* token","t:creature o:\"token\"|o:\"populate\"|o:\"tokens you control\""],["counters","\\+1/\\+1 counter|proliferate","o:\"+1/+1 counter\""],["graveyard","graveyard|mill|return .* from your graveyard","o:\"from your graveyard\""],["artifacts","artifact","t:artifact o:\"artifact\""],["enchantments","enchantment|aura","o:\"enchantment\" t:enchantment"],["lifegain","gain .* life|lifelink","o:\"gain\" o:\"life\""],["spellslinger","instant or sorcery|noncreature spell","o:\"instant or sorcery\""],["sacrifice","sacrifice","o:\"sacrifice a creature\""],["flyers","flying","kw:flying t:creature"],["dragons","dragon","t:dragon"],["elves","elf|elves","t:elf"],["zombies","zombie","t:zombie"],["goblins","goblin","t:goblin"],["landfall","landfall|land enters","o:landfall"],["cats","cat","t:cat"]];
const INTENTS=[[/ramp|mana|accel/i,"(o:\"add {\" t:artifact cmc<=3) or (o:\"search your library for\" o:\"land\" cmc<=3)","ramp"],[/draw|card advantage/i,"o:\"draw\" o:\"card\" -t:land","card draw"],[/removal|kill|destroy|answer/i,"(o:destroy or o:exile) o:target (t:instant or t:sorcery)","removal"],[/wipe|board ?wipe|wrath/i,"o:\"destroy all\" or o:\"exile all\"","board wipes"],[/tutor|search/i,"o:\"search your library for a card\"","tutors"],[/protect|hexproof|indestructible/i,"o:hexproof or o:indestructible t:instant","protection"],[/land/i,"t:land -t:basic","utility lands"],[/win|finisher|combo/i,"o:\"you win the game\" or o:\"double\"","finishers"]];
async function ruleReply(q){const d=deck();let cards=[],why="";
 if(G==="mtg"){const ci=d.cmdr?d.cmdr.ci.join("")||"c":"wubrg";const base=` id<=${ci} f:commander -t:basic`;
  const it=INTENTS.find(x=>x[0].test(q));const th=d.cmdr?THEMES.filter(t=>new RegExp(t[1],"i").test(d.cmdr.text+" "+d.cmdr.type)):[];
  if(/curve|rate|analy|review/i.test(q))return {text:analyse(d)};
  if(it){cards=await sfSearch(`(${it[1]})`+base);why=`Top-played **${it[2]}** in your colour identity (${ci.toUpperCase()}), ranked by EDHREC popularity:`}
  else if(th.length&&/synergy|want|theme|suggest|recommend/i.test(q)){cards=await sfSearch(`(${th[0][2]})`+base);why=`${d.cmdr.name} looks like a **${th.map(t=>t[0]).join(" / ")}** commander. Cards that support that plan:`}
  else{const kw=q.replace(/[^\w\s'-]/g," ").replace(/\b(suggest|find|me|some|cards?|for|my|deck|good|the|a|in|with|what|is|are|best|commander)\b/gi," ").trim();
   cards=kw?await sfSearch(`(${kw.split(/\s+/).map(w=>`o:${w}`).join(" ")} or ${kw.split(/\s+/).map(w=>`t:${w}`).join(" ")})`+base).catch(()=>[]):[];
   if(!cards.length)cards=await sfSearch((d.cmdr?"":"is:commander ")+base);why=cards.length?(kw?`Cards matching “${esc(kw)}” in your colours:`:d.cmdr?"Popular staples in your colours:":"Popular commanders to start with:"):"I couldn't find matches – try other words."}
  const have=new Set(d.main.map(c=>c.name).concat(d.cmdr?d.cmdr.name:[]));cards=cards.filter(c=>!have.has(c.name)).slice(0,12)}
 else{const archs=[...new Set(d.main.concat(d.extra).map(c=>c.arch).filter(Boolean))];
  if(/brick|rate|analy|review|ratio/i.test(q))return {text:analyse(d)};
  if(/hand ?trap/i.test(q)){cards=(await Promise.all(["Ash Blossom & Joyous Spring","Effect Veiler","Infinite Impermanence","Ghost Ogre & Snow Rabbit","Maxx \"C\"","Nibiru, the Primal Being","Droll & Lock Bird","Ghost Belle & Haunted Mansion"].map(n=>ygSearch("name="+encodeURIComponent(n)).catch(()=>[])))).flat();why="Popular **hand traps** that fit almost any deck:"}
  else if(/extra/i.test(q)&&archs[0]){cards=(await ygSearch("archetype="+encodeURIComponent(archs[0]))).filter(c=>EXTRA.test(c.ft));why=`Extra Deck monsters in the **${archs[0]}** archetype:`}
  else if(archs[0]&&!/find|search/i.test(q)){cards=await ygSearch("archetype="+encodeURIComponent(archs[0]));why=`More **${archs[0]}** support for your deck:`}
  else{const kw=q.replace(/\b(suggest|find|me|some|cards?|for|my|deck|good|the|a|search)\b/gi," ").trim();cards=kw?await ygSearch("fname="+encodeURIComponent(kw)).catch(()=>[]):[];
   if(!cards.length&&kw)cards=await ygSearch("archetype="+encodeURIComponent(kw)).catch(()=>[]);why=cards.length?`Cards matching “${esc(kw)}”:`:"Add some cards from an archetype first, or ask me to find a name (e.g. “find Blue-Eyes”)."}
  const have=new Set(d.main.concat(d.extra,d.side).map(c=>c.id));cards=cards.filter(c=>!have.has(c.id)).slice(0,12)}
 return{text:why,cards}}
function analyse(d){if(G==="mtg"){const lands=count(d.main.filter(c=>/Land/.test(c.type))),nl=d.main.filter(c=>!/Land/.test(c.type)),n=count(nl);const avg=n?nl.reduce((a,c)=>a+c.cmc*c.q,0)/n:0;
  const ramp=count(nl.filter(c=>/add \{|search your library for .*land/i.test(c.text))),draw=count(nl.filter(c=>/draw/i.test(c.text))),rem=count(nl.filter(c=>/(destroy|exile) target/i.test(c.text)));
  return `**Deck check** (${count(d.main)+(d.cmdr?1:0)}/100)\n- Lands: ${lands} ${lands<35?"→ low; most decks want 35–38":lands>40?"→ high":"→ good"}\n- Average CMC: ${avg.toFixed(2)} ${avg>3.5?"→ heavy, add cheap ramp":"→ healthy"}\n- Ramp: ${ramp} ${ramp<8?"(aim ~10)":"✓"}\n- Card draw: ${draw} ${draw<8?"(aim ~10)":"✓"}\n- Targeted removal: ${rem} ${rem<6?"(aim 8+)":"✓"}`}
 const m=count(d.main),mon=d.main.filter(c=>!/Spell|Trap/.test(c.type)),starters=count(mon.filter(c=>c.lvl&&c.lvl<=4));const p=m?1-hyper(m,starters,5):0;
 return `**Deck check**\n- Main ${m}, Extra ${count(d.extra)}, Side ${count(d.side)}\n- Monsters: ${count(mon)}, Spells: ${count(d.main.filter(c=>/Spell/.test(c.type)))}, Traps: ${count(d.main.filter(c=>/Trap/.test(c.type)))}\n- Level 1-4 normal-summonable monsters: ${starters}\n- Chance to open at least one (5 cards): **${(p*100).toFixed(1)}%** → brick rate ${(100-p*100).toFixed(1)}%\n${m>40?"- Tip: cutting to 40 cards improves consistency.":""}`}
function hyper(N,K,n){let p=1;for(let i=0;i<n;i++)p*=(N-K-i)/(N-i);return Math.max(0,p)}
function deckSummary(){const d=deck();if(G==="mtg")return `Game: MTG Commander. Commander: ${d.cmdr?d.cmdr.name+" — "+d.cmdr.text.slice(0,300):"none yet"}. Deck (${count(d.main)} cards): ${d.main.slice(0,80).map(c=>c.name).join("; ")}`;
 return `Game: Yu-Gi-Oh! TCG. Main: ${d.main.map(c=>c.q+"x "+c.name).join("; ")}. Extra: ${d.extra.map(c=>c.name).join("; ")}`}
$("#cForm").onsubmit=async e=>{e.preventDefault();const q=$("#cQ").value.trim();if(!q||busy)return;$("#cQ").value="";busy=true;$("#chat .hero")?.remove();
 addMsg("u",esc(q));sfx("click");const m=addMsg("a",'<span class="typing"><i></i><i></i><i></i></span>');$$(".ava").forEach(a=>a.classList.add("think"));
 let rb;try{rb=await ruleReply(q)}catch(err){rb={text:"Card lookup failed ("+esc(err.message)+")."}}
 const cardsBox=()=>{if(rb.cards&&rb.cards.length){const g=document.createElement("div");g.className="grid";m.append(g);rb.cards.forEach((c,i)=>g.append(cardEl(c,{delay:i*.05,drag:true,add:el=>addCard(c,el)})))}};
 if(gen){try{hist.push({role:"user",content:q});const sys={role:"system",content:S.persona+`\nYour name is ${S.name}. Current deck: ${deckSummary()}\nCard search results the app found for this question (prefer recommending these, they are real and legal): ${(rb.cards||[]).map(c=>c.name).join("; ")||"none"}. Keep answers under 200 words. Bold card names with **.`};
   let out="";for await(const t of gen([sys,...hist.slice(-8)])){out+=t;m.innerHTML=md(out)}hist.push({role:"assistant",content:out});cardsBox()}
  catch(err){m.innerHTML=md(rb.text)+`<br><small class="no">AI error: ${esc(err.message)}</small>`;cardsBox()}}
 else{await sleep(400);m.innerHTML=md(rb.text)+(rb.cards?'<br><small class="hint">Tip: tap “Load AI” for deeper synergy explanations.</small>':"");cardsBox()}
 $$(".ava").forEach(a=>a.classList.remove("think"));m.scrollIntoView({behavior:"smooth",block:"end"});busy=false};
/* ---------- sample opponent decks (original placeholder cards) ---------- */
function sampleMtg(){const L=[],c=(n,cmc,p,t,k,txt="")=>{for(let i=0;i<k;i++)L.push({name:n,type:"Creature — Beast",cmc,pow:p,tou:t,text:txt,ci:["G","R"]})};
 for(let i=0;i<37;i++)L.push({name:i%2?"Wildwood Forest":"Ember Peak",type:"Basic Land",cmc:0,ci:[]});
 c("Ashpaw Cub",1,2,1,7);c("Thornback Boar",2,3,2,9);c("Cinderhorn Ram",2,2,3,6);c("Pyrewing Hawk",3,3,3,8);c("Mossbark Bruiser",3,2,5,6);c("Stormtusk Mammoth",4,5,4,7);c("Emberclaw Alpha",5,6,5,6);c("Ancient Ridgeback",6,7,7,6);
 for(let i=0;i<7;i++)L.push({name:"Smolder Bolt",type:"Instant",cmc:1,text:"Deal 3 damage to target creature.",ci:["R"]});
 return{name:"Feral Stampede (sample)",cmdr:{name:"Kragh, Ashmane Warlord",type:"Legendary Creature — Cat Warrior",cmc:4,pow:5,tou:5,ci:["G","R"],text:"Original sample commander."},cards:L}}
function sampleYgo(){const L=[],m=(n,l,a,d,k,attr="FIRE")=>{for(let i=0;i<k;i++)L.push({name:n,type:"Effect Monster",lvl:l,atk:a,def:d,attr,ft:"effect"})};
 m("Lantern Imp",3,1200,800,3);m("Rune Squire",4,1600,1200,3);m("Glass Wyvern",4,1800,1000,3);m("Shade Duelist",4,1700,1500,3);m("Iron Golemkin",4,1400,2000,3,"EARTH");m("Ember Knight",4,1900,600,3);
 m("Storm Chimera",6,2400,1800,2);m("Abyssal Leviathan",7,2700,2200,2,"WATER");m("Twilight Seraph",8,3000,2500,1,"LIGHT");
 for(let i=0;i<6;i++)L.push({name:"Arcane Insight",type:"Spell Card",text:"Draw 2 cards."});for(let i=0;i<5;i++)L.push({name:"Flame Burst",type:"Spell Card",text:"Inflict 600 damage to your opponent."});
 for(let i=0;i<6;i++)L.push({name:"Mirror Ward",type:"Trap Card",text:"(not simulated)"});return{name:"Arcane Legion (sample)",cards:L}}
function deckCards(dk){const L=[];dk.main.forEach(c=>{for(let i=0;i<c.q;i++)L.push({...c})});return L}
function oppDeck(){const id=G==="mtg"?S.oppMtg:S.oppYgo;const dk=D[G].find(x=>x.id===id);if(!dk||id==="sample")return G==="mtg"?sampleMtg():sampleYgo();return{name:dk.name,cmdr:dk.cmdr,cards:deckCards(dk)}}
/* ---------- playtest engine (simplified) ---------- */
let game=null;const num=v=>{const n=parseInt(v);return isNaN(n)?1:n};
const isLand=c=>/Land/.test(c.type),isCre=c=>/Creature/.test(c.type),isRock=c=>/Artifact/.test(c.type)&&/\{T\}: Add/.test(c.text||"");
const isMon=c=>c.atk!=null&&!/Spell|Trap/.test(c.type);
function mkP(cards,cmdr,nm){const lib=shuffle(cards.map(c=>({...c,u:uid()})));return{nm,life:G==="mtg"?40:8000,lib,hand:[],bf:[],gy:[],cmd:cmdr?[{...cmdr,u:uid(),cmdr:1}]:[],tax:0,land:0,ns:0,mull:0}}
function startGame(){const d=deck();const me=deckCards(d);if(G==="mtg"&&me.length>=30){mtgStart();return}if(me.length<(G==="mtg"?30:20)){game=null;$("#table").innerHTML=`<div class="pane hero"><span class="ava">${avaHTML()}</span><h3>Build a deck first</h3><p class="hint">Your current deck has ${me.length} cards. Add at least ${G==="mtg"?30:20} cards (or import a list), then come back to test it against ${esc(S.name)}'s AI.</p><button onclick="setView('build')">Go to Build</button></div>`;return}
 const o=oppDeck();game={turn:0,act:"me",P:{me:mkP(me,G==="mtg"?d.cmdr:null,"You"),opp:mkP(o.cards,o.cmdr,o.name)},log:[],sel:null,over:false,phase:"mull"};
 for(const k of["me","opp"])for(let i=0;i<(G==="mtg"?7:5);i++)game.P[k].hand.push(game.P[k].lib.pop());
 render();shufAnim();banner("Opening hand");logp(`Game start vs ${o.name} (${S.diff} AI). Keep or mulligan?`)}
function logp(t){game.log.unshift(t);const l=$("#glog");if(l){l.insertAdjacentHTML("afterbegin",`<div>${esc(t)}</div>`)}}
function shufAnim(){const p=$('.pile[data-z="me-lib"]');if(p){p.classList.remove("shuf");void p.offsetWidth;p.classList.add("shuf")}sfx("shuffle")}
const elU=u=>document.querySelector(`[data-u="${u}"]`);
function move(c,from,to,who){const P=game.P[who],i=P[from].indexOf(c);if(i>=0)P[from].splice(i,1);P[to].push(c)}
function animMove(fn,u,srcFallback){const s0=elU(u)||srcFallback;const s=s0&&s0.getBoundingClientRect();const r=fn();render();const t=elU(u);if(s&&t)fly(s,t,null,false);return r}
function draw(who,n=1){const P=game.P[who];for(let i=0;i<n;i++){if(!P.lib.length){if(G==="ygo"){endGame(who==="me"?"opp":"me","deck-out");return}continue}const c=P.lib.pop();P.hand.push(c);
 const src0=$(`.pile[data-z="${who}-lib"]`),src=src0&&src0.getBoundingClientRect();render();const t=elU(c.u);if(src&&t)fly(src,t,null,true);sfx("draw")}}
function avail(P){return P.bf.filter(c=>(isLand(c)||isRock(c))&&!c.tap).length}
function payMana(P,n){for(const c of P.bf)if(n>0&&(isLand(c)||isRock(c))&&!c.tap){c.tap=1;n--}}
function cost(c,P){return (c.cmc|0)+(c.cmdr?P.tax*2:0)}
function playCard(c,who){const P=game.P[who],from=c.cmdr&&P.cmd.includes(c)?"cmd":"hand";
 if(G==="mtg"){if(isLand(c)){if(P.land){who==="me"&&toast("One land per turn");return false}P.land=1;animMove(()=>move(c,from,"bf",who),c.u);logp(`${P.nm} play ${c.name}`);sfx("play");return true}
  const k=cost(c,P);if(avail(P)<k){who==="me"&&toast(`Need ${k} mana (have ${avail(P)})`);return false}payMana(P,k);if(c.cmdr)P.tax++;
  if(/Instant|Sorcery/.test(c.type)){animMove(()=>move(c,from,"gy",who),c.u);resolveSpell(c,who)}else{c.sick=1;c.tap=0;animMove(()=>move(c,from,"bf",who),c.u)}logp(`${P.nm} cast ${c.name}`);sfx("play");return true}
 if(isMon(c)){if(EXTRA.test(c.ft)){if(P.bf.filter(isMon).length<2){who==="me"&&toast("Simplified rule: tribute 2 monsters to summon from the Extra Deck");return false}trib(P,2,who)}
  else{if(P.ns){who==="me"&&toast("Already Normal Summoned this turn");return false}const need=c.lvl>=7?2:c.lvl>=5?1:0;if(P.bf.filter(isMon).length<need){who==="me"&&toast(`Needs ${need} tribute(s)`);return false}trib(P,need,who);P.ns=1}
  if(P.bf.filter(isMon).length>=5){who==="me"&&toast("Monster zones full");return false}
  c.sick=1;c.pos=who==="opp"&&shouldDef(c)?"def":"atk";animMove(()=>move(c,from,"bf",who),c.u);logp(`${P.nm} summon ${c.name} (${c.pos.toUpperCase()})`);sfx("play");return true}
 animMove(()=>move(c,from,"gy",who),c.u);resolveSpell(c,who);logp(`${P.nm} activate ${c.name}`);sfx("play");return true}
function trib(P,n,who){P.bf.filter(isMon).sort((a,b)=>a.atk-b.atk).slice(0,n).forEach(t=>{move(t,"bf","gy",who);logp(`${P.nm} tribute ${t.name}`)})}
function shouldDef(c){const mx=Math.max(0,...game.P.me.bf.filter(isMon).map(x=>x.atk));return c.atk<mx&&c.def>c.atk}
function resolveSpell(c,who){const o=who==="me"?"opp":"me",t=c.text||"";let m;
 if((m=t.match(/draw (\w+) cards?/i))){const n={a:1,one:1,two:2,three:3}[m[1].toLowerCase()]||parseInt(m[1])||1;draw(who,Math.min(n,3))}
 else if((m=t.match(/(\d+) damage to (your opponent|any target|each opponent|target player)/i)))dmg(o,+m[1]);
 else if((m=t.match(/(\d+) damage to target creature/i))||/(destroy|exile) target (creature|monster)/i.test(t)){const tg=game.P[o].bf.filter(x=>isCre(x)||isMon(x)).sort((a,b)=>(b.pow??b.atk)-(a.pow??a.atk)).find(x=>!m||num(x.tou)<=+m[1]);if(tg){kill(tg,o);logp(`${c.name} destroys ${tg.name}`)}}
 else logp(`(${c.name}'s effect is not simulated)`)}
function kill(c,who){const e=elU(c.u);if(e&&S.anim!=="off"){e.animate?.([{transform:"scale(1)",opacity:1,filter:"brightness(1)"},{transform:"scale(1.3) rotate(15deg)",opacity:0,filter:"brightness(3)"}],400)}move(c,"bf","gy",who);if(c.cmdr){move(c,"gy","cmd",who)}}
function dmg(who,n){if(n<=0)return;const P=game.P[who];P.life-=n;logp(`${P.nm} take ${n} damage → ${P.life}`);sfx("hit");render();const l=$(`#life-${who}`);l&&l.classList.add("hit");if(P.life<=0)endGame(who==="me"?"opp":"me","damage")}
function endGame(w,why){if(game.over)return;game.over=true;render();banner(w==="me"?"Victory!":"Defeat");sfx(w==="me"?"win":"hit");logp(w==="me"?`You win (${why})!`:`${game.P.opp.nm} wins (${why}).`)}
function mulligan(){const P=game.P.me;P.lib.push(...P.hand);P.hand=[];shuffle(P.lib);P.mull++;render();shufAnim();setTimeout(()=>{for(let i=0;i<(G==="mtg"?7:5);i++)draw("me");logp(G==="mtg"?`Mulligan ${P.mull} – put ${P.mull} card(s) on the bottom by tapping Keep.`:"Mulligan (house rule).")},400)}
function keep(){const P=game.P.me;if(G==="mtg"&&P.mull){const n=Math.min(P.mull,P.hand.length);P.hand.sort((a,b)=>(isLand(a)-isLand(b))||b.cmc-a.cmc);const lands=P.hand.filter(isLand).length;
  const bottom=lands>4?P.hand.filter(isLand).slice(0,n):P.hand.filter(c=>!isLand(c)).slice(0,n);bottom.forEach(c=>{P.hand.splice(P.hand.indexOf(c),1);P.lib.unshift(c)});logp(`Bottomed ${bottom.map(c=>c.name).join(", ")}`)}
 game.phase="main";game.turn=1;banner("Turn 1 – your move");logp("Turn 1 (you go first, no draw).");render()}
function beginTurn(who){const P=game.P[who];P.land=0;P.ns=0;P.bf.forEach(c=>{c.tap=0;c.sick=0;c.atk_=0;c.attacked=0});game.act=who;if(game.turn>1||who==="opp")draw(who)}
async function endTurn(){if(game.over||game.act!=="me")return;game.sel=null;game.act="opp";render();await sleep(300);banner(game.P.opp.nm.split(" (")[0]+"'s turn");beginTurn("opp");await sleep(700);await aiTurn();if(game.over)return;game.turn++;beginTurn("me");banner("Turn "+game.turn);logp(`— Turn ${game.turn} —`);render()}
async function aiTurn(){const P=game.P.opp,O=game.P.me,D_=S.diff;
 if(G==="mtg"){const l=P.hand.find(isLand);if(l){playCard(l,"opp");await sleep(500)}
  let guard=0;while(guard++<10){const castable=P.hand.concat(P.cmd).filter(c=>!isLand(c)&&cost(c,P)<=avail(P)).sort((a,b)=>cost(b,P)-cost(a,P));
   const pick=D_==="easy"?castable[Math.random()*castable.length|0]:castable.find(c=>!/Instant|Sorcery/.test(c.type)||O.bf.some(isCre));if(!pick)break;playCard(pick,"opp");await sleep(600)}
  const blockers=O.bf.filter(c=>isCre(c)&&!c.tap);const myPow=P.bf.filter(c=>isCre(c)&&!c.sick).reduce((a,c)=>a+num(c.pow),0);
  const atk=P.bf.filter(c=>isCre(c)&&!c.sick&&!c.tap).filter(c=>D_==="easy"?Math.random()<.6:(D_==="hard"&&myPow>=O.life)||!blockers.some(b=>num(b.pow)>=num(c.tou)&&num(b.tou)>num(c.pow))||blockers.length===0);
  if(atk.length)await combat(atk,"opp")}
 else{let g=0;while(g++<6){const sp=P.hand.find(c=>/Spell/.test(c.type));if(!sp)break;playCard(sp,"opp");await sleep(500)}
  const mons=P.hand.filter(isMon).sort((a,b)=>b.atk-a.atk);for(const m of mons){if(P.ns)break;if(playCard(m,"opp")){await sleep(600);break}}
  if(game.turn>=1){for(const a of P.bf.filter(c=>isMon(c)&&c.pos==="atk"&&!c.sick)){if(game.over)break;const tg=O.bf.filter(isMon);
   const beat=tg.filter(t=>a.atk>(t.pos==="def"?t.def:t.atk)).sort((x,y)=>y.atk-x.atk)[0];
   if(!tg.length)await ygoAttack(a,null,"opp");else if(beat)await ygoAttack(a,beat,"opp");else if(D_==="easy"&&Math.random()<.3)await ygoAttack(a,tg[0],"opp");await sleep(300)}}}
 render()}
async function combat(atk,who){const o=who==="me"?"opp":"me",P=game.P[who],O=game.P[o];atk.forEach(c=>{c.tap=1;c.atk_=1});render();atk.forEach(c=>elU(c.u)?.classList.add("atk"));sfx("play");await sleep(650);
 const free=O.bf.filter(c=>isCre(c)&&!c.tap);let dealt=0;const hard=S.diff==="hard"||o==="me";
 for(const a of atk){let b=null;const total=atk.reduce((s,c)=>s+num(c.pow),0);
  if(o==="opp"&&S.diff==="easy")b=Math.random()<.3?free[0]:null;
  else b=free.find(x=>num(x.pow)>=num(a.tou)&&num(x.tou)>num(a.pow))||free.find(x=>num(x.tou)>num(a.pow))||(total>=O.life||hard&&num(a.pow)>=4?free.find(x=>num(x.pow)>=num(a.tou))||free[0]:null);
  if(b){free.splice(free.indexOf(b),1);logp(`${O.nm} block ${a.name} with ${b.name}`);if(num(b.pow)>=num(a.tou))kill(a,who);if(num(a.pow)>=num(b.tou))kill(b,o)}else dealt+=num(a.pow)}
 render();dmg(o,dealt)}
async function ygoAttack(a,t,who){const o=who==="me"?"opp":"me";a.attacked=1;a.sick=1;render();elU(a.u)?.classList.add("atk");sfx("play");await sleep(550);
 if(!t){logp(`${a.name} attacks directly!`);dmg(o,a.atk);return}
 if(t.pos==="def"){logp(`${a.name} (${a.atk}) attacks ${t.name} (DEF ${t.def})`);if(a.atk>t.def)kill(t,o);else if(a.atk<t.def)dmg(who,t.def-a.atk)}
 else{logp(`${a.name} (${a.atk}) attacks ${t.name} (${t.atk})`);if(a.atk>t.atk){kill(t,o);dmg(o,a.atk-t.atk)}else if(a.atk<t.atk){kill(a,who);dmg(who,t.atk-a.atk)}else{kill(a,who);kill(t,o)}}render()}
function myAttack(){const P=game.P.me;const atk=P.bf.filter(c=>c.selA);if(!atk.length){toast("Tap your untapped creatures to choose attackers");return}atk.forEach(c=>c.selA=0);combat(atk,"me")}
function onCard(c,zone,who){if(game.over)return;if(game.phase==="mull"){zoom(c);return}
 if(who==="me"&&game.act==="me"){if(zone==="hand"||zone==="cmd"){playCard(c,"me");return}
  if(zone==="bf"){if(G==="mtg"){if(isCre(c)&&!c.tap&&!c.sick){c.selA=!c.selA;render()}else if(isLand(c)||isRock(c)){c.tap=!c.tap;render()}else zoom(c);return}
   if(isMon(c)){if(game.turn===1){toast("No attacks on turn 1");return}if(c.sick||c.attacked||c.pos==="def"){if(!c.attacked&&!c.sick&&c.pos==="def"){c.pos="atk";render()}else toast("Can't attack with this monster now");return}
    game.sel=game.sel===c?null:c;render();if(game.sel&&!game.P.opp.bf.some(isMon))toast("Tap opponent's LP to attack directly");return}}}
 if(who==="opp"&&zone==="bf"&&G==="ygo"&&game.sel){const a=game.sel;game.sel=null;ygoAttack(a,c,"me");return}
 zoom(c)}
function render(){if(!game||game.mtg)return;const T=$("#table");const sideH=(who)=>{const P=game.P[who];const zoneH=(z,cls)=>`<div class="zone ${cls||""}" data-z="${who}-${z}"></div>`;
  return `<div class="side ${who}"><div class="hud"><span class="life" id="life-${who}" ${who==="opp"?'data-direct="1"':""}>${P.life}</span><b>${esc(P.nm)}</b>
   <span class="pile" data-z="${who}-lib">${'<div class="back"></div>'.repeat(Math.min(3,P.lib.length))}<span>${P.lib.length}</span></span>
   <small>Hand ${P.hand.length} · GY ${P.gy.length}${G==="mtg"?` · Mana ${avail(P)}`:""}</small></div>
   ${G==="mtg"&&P.cmd.length?`<div class="zone" data-z="${who}-cmd" style="min-height:0"></div>`:""}${zoneH("bf","bfz")}${who==="me"?`<div class="hand" data-z="me-hand"></div>`:`<div class="hand" data-z="opp-hand" style="min-height:0;transform:scale(.6);margin:-10px 0"></div>`}</div>`};
 const me=game.P.me;T.innerHTML=sideH("opp")+`<div class="bar" id="ctl"></div><div class="log" id="glog">${game.log.slice(0,40).map(l=>`<div>${esc(l)}</div>`).join("")}</div>`+sideH("me");
 const ctl=$("#ctl");const btn=(t,f,cls="")=>{const b=document.createElement("button");b.textContent=t;b.className=cls;b.onclick=f;ctl.append(b)};
 if(game.over)btn("New game",startGame);else if(game.phase==="mull"){btn("Keep",keep);btn("Mulligan",mulligan,"ghost")}
 else if(game.act==="me"){if(G==="mtg")btn("Attack ⚔",myAttack);btn("End turn",endTurn);btn("Restart",startGame,"ghost")}else ctl.innerHTML='<span class="typing"><i></i><i></i><i></i></span> AI is thinking…';
 for(const who of["me","opp"]){const P=game.P[who];
  const put=(z,list,opts={})=>{const box=T.querySelector(`[data-z="${who}-${z}"]`);if(!box)return;list.forEach((c,i)=>{const hidden=who==="opp"&&z==="hand";
    const e=cardEl(c,{back:hidden,noTilt:z!=="hand",cls:[c.tap&&"tap",c.pos==="def"&&"def",(c.selA||game.sel===c)&&"sel"].filter(Boolean).join(" "),click:hidden?()=>{}:()=>onCard(c,z,who)});e.dataset.u=c.u;e.style.animation="none";
    if(c.selA||game.sel===c)e.style.boxShadow="0 0 0 3px var(--acc),0 0 20px var(--acc)";
    if(z==="bf"&&(c.pow!=null||c.atk!=null)&&c.img)e.insertAdjacentHTML("beforeend",`<span class="bad" style="left:auto;right:2px;top:auto;bottom:2px;background:#000b">${c.atk!=null?c.atk+"/"+c.def:c.pow+"/"+c.tou}</span>`);
    if(z==="hand"){const n=list.length,m=(i-(n-1)/2);e.style.setProperty("--r",m*Math.min(6,40/n)+"deg");e.style.setProperty("--y",Math.abs(m)*Math.min(6,30/n)+"px");
     if(who==="me"){e.draggable=true;e.ondragstart=ev=>ev.dataTransfer.setData("u",c.u)}}
    box.append(e)})};
  put("bf",P.bf.slice().sort((a,b)=>isLand(a)-isLand(b)));put("hand",P.hand);put("cmd",P.cmd)}
 const bz=T.querySelector('[data-z="me-bf"]');bz.ondragover=e=>{e.preventDefault();bz.classList.add("over")};bz.ondragleave=()=>bz.classList.remove("over");
 bz.ondrop=e=>{e.preventDefault();bz.classList.remove("over");const c=me.hand.find(x=>x.u===e.dataTransfer.getData("u"));if(c&&game.act==="me"&&game.phase==="main")playCard(c,"me")};
 const ol=$("#life-opp");ol.style.cursor="pointer";ol.onclick=()=>{if(G==="ygo"&&game.sel){if(game.P.opp.bf.some(isMon)){toast("Opponent has monsters – attack one of them");return}const a=game.sel;game.sel=null;ygoAttack(a,null,"me")}};
 $('.pile[data-z="me-lib"]').onclick=()=>{if(game.act==="me"&&!game.over&&game.phase==="main"){draw("me");logp("You draw an extra card (manual)")}}}
/* ---------- goldfish stats ---------- */
function simMtg(N){const d=deck(),L=deckCards(d),cm=d.cmdr;const res={kill:[],cmdT:[],land:[0,0,0,0,0],mull:0,flood:0,screw:0};
 for(let g=0;g<N;g++){let lib=shuffle(L.slice()),hand=lib.splice(0,7);let lands=hand.filter(isLand).length;if(lands<2||lands>5){res.mull++;lib=shuffle(L.slice());hand=lib.splice(0,7);hand.sort((a,b)=>isLand(b)-isLand(a));if(hand.filter(isLand).length>4)lib.push(hand.shift());else lib.push(hand.pop())}
  let bfL=0,rocks=0,pow=0,dealt=0,cmdCast=false,killT=0;
  for(let t=1;t<=20;t++){if(t>1)hand.push(lib.shift());const li=hand.findIndex(isLand);if(li>=0){hand.splice(li,1);bfL++;if(t<=4)res.land[t]++}
   dealt+=pow;if(dealt>=40&&!killT)killT=t;let mana=bfL+rocks;
   if(cm&&!cmdCast&&mana>=cm.cmc){mana-=cm.cmc;cmdCast=true;res.cmdT.push(t);pow+=num(cm.pow)}
   hand.sort((a,b)=>b.cmc-a.cmc);for(let i=0;i<hand.length;i++){const c=hand[i];if(isLand(c)||c.cmc>mana)continue;mana-=c.cmc;hand.splice(i--,1);if(isRock(c)){rocks++;mana++}if(isCre(c))pow+=num(c.pow)}
   if(t===6){if(bfL<=3)res.screw++;if(bfL>=8)res.flood++}if(killT)break}
  res.kill.push(killT||21)}
 const avg=a=>a.length?(a.reduce((x,y)=>x+y,0)/a.length):0;const k=res.kill.filter(x=>x<=20);
 return[["Avg turn to deal 40 (goldfish)",k.length?avg(k).toFixed(1):"–",`${(k.length/N*100).toFixed(0)}% of games within 20 turns`],["Commander cast by turn",cm?avg(res.cmdT).toFixed(1):"–",cm?cm.name:"no commander"],
  ...[1,2,3,4].map(t=>[`Land drop on turn ${t}`,(res.land[t]/N*100).toFixed(0)+"%","hit rate"]),["Mulligan rate",(res.mull/N*100).toFixed(1)+"%","hands with <2 or >5 lands"],["Mana screw T6",(res.screw/N*100).toFixed(1)+"%","≤3 lands on turn 6"],["Mana flood T6",(res.flood/N*100).toFixed(1)+"%","≥8 lands on turn 6"]]}
function simYgo(N){const d=deck(),L=deckCards(d);let st=0,mon=0,sp=0,brick=0,kills=[];
 for(let g=0;g<N;g++){const lib=shuffle(L.slice()),hand=lib.splice(0,5);const s=hand.filter(c=>isMon(c)&&c.lvl<=4).length;st+=s;if(!s)brick++;mon+=hand.filter(isMon).length;sp+=hand.filter(c=>/Spell|Trap/.test(c.type)).length;
  let bf=[],dealt=0,kt=0;for(let t=1;t<=15;t++){if(t>1)hand.push(...lib.splice(0,1));const m=hand.filter(c=>isMon(c)&&!EXTRA.test(c.ft)).sort((a,b)=>b.atk-a.atk);
   const ok=m.find(c=>c.lvl<=4||(c.lvl<=6&&bf.length>=1)||bf.length>=2);if(ok){const need=ok.lvl>=7?2:ok.lvl>=5?1:0;bf.sort((a,b)=>a.atk-b.atk).splice(0,need);bf.push(ok);hand.splice(hand.indexOf(ok),1)}
   if(t>1)dealt+=bf.reduce((a,c)=>a+(c.atk||0),0);if(dealt>=8000){kt=t;break}}kills.push(kt||16)}
 const k=kills.filter(x=>x<=15);
 return[["Opening hand with a starter",((1-brick/N)*100).toFixed(1)+"%","≥1 Level 1–4 monster in 5 cards"],["Brick rate",(brick/N*100).toFixed(1)+"%","no normal-summonable monster"],["Avg monsters in hand",(mon/N).toFixed(2),"opening 5"],["Avg spells/traps in hand",(sp/N).toFixed(2),"opening 5"],["Avg turn to deal 8000",k.length?(k.reduce((a,b)=>a+b,0)/k.length).toFixed(1):"–","goldfish, 1 normal summon/turn, direct attacks"]]}
$("#runSim").onclick=async()=>{const N=Math.max(10,Math.min(20000,+$("#nSim").value||1000));const d=deck();if(deckCards(d).length<20){$("#simOut").innerHTML='<div class="hint">Add at least 20 cards to your deck first.</div>';return}
 $("#simOut").innerHTML='<div class="typing"><i></i><i></i><i></i></div>';await sleep(50);const r=G==="mtg"?simMtg(N):simYgo(N);sfx("win");
 $("#simOut").innerHTML=`<p class="hint">${N} simulated solo games of “${esc(d.name)}”. Only lands/creatures/monsters are modelled; card effects are ignored.</p><div class="simgrid">${r.map(([a,b,c],i)=>`<div class="stat" style="animation-delay:${i*.07}s"><span>${esc(a)}</span><b>${esc(b)}</b><span>${esc(c)}</span></div>`).join("")}</div>`};
/* ---------- settings ---------- */
function renderSettings(){const opp=g=>`<option value="sample">Built-in sample deck</option>`+D[g].map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("");
 const sel=(k,opts)=>`<select data-k="${k}">${opts.map(([v,t])=>`<option value="${v}" ${S[k]==v?"selected":""}>${t}</option>`).join("")}</select>`;
 $("#settings").innerHTML=`<div class="set">
 <fieldset><legend>Theme</legend><div class="presets">${Object.entries(PRESETS).map(([n,c])=>`<button title="${n}" data-p="${n}" style="background:linear-gradient(135deg,${c[0]},${c[1]})"></button>`).join("")}</div>
  <label>Accent<input type="color" data-k="acc"></label><label>Secondary accent<input type="color" data-k="acc2"></label><label>Background<input type="color" data-k="bg"></label><label>Panel / glow<input type="color" data-k="bg2"></label>
  <label>Background style${sel("bgStyle",[["particles","Floating embers"],["aurora","Aurora"],["runes","Rotating runes"],["gradient","Gradient only"],["solid","Solid"]])}</label>
  <label>Animation${sel("anim",[["full","Full"],["subtle","Subtle"],["off","Off"]])}</label><label>Animate even if “Reduce Motion” is on<input type="checkbox" data-k="forceMotion"></label>
  <label>Card size<input type="range" min="70" max="200" data-k="cw"></label><label>Sound effects<input type="checkbox" data-k="sound"></label>
  <label>Default game${sel("defGame",[["mtg","Commander"],["ygo","Yu-Gi-Oh!"]])}</label></fieldset>
 <fieldset><legend>Playmat & sleeves</legend><label>Sleeve colour<input type="color" data-k="sleeve"></label><label>Sleeve image<input type="file" accept="image/*" data-img="sleeveImg"></label>
  <label>Playmat colour<input type="color" data-k="mat"></label><label>Playmat image<input type="file" accept="image/*" data-img="matImg"></label><button class="sm ghost" id="clrImg">Remove images</button></fieldset>
 <fieldset><legend>Assistant</legend><label>Name<input data-k="name"></label><label>Avatar (emoji, image URL, or upload)<input data-k="avatar" placeholder="default lion"></label><label>Upload avatar<input type="file" accept="image/*" data-img="avatar"></label>
  <label style="display:block">Personality / system prompt<textarea data-k="persona"></textarea></label><label>Creativity<input type="range" min="0" max="1.5" step="0.1" data-k="temp"></label>
  <label>On-device model${sel("model",MODELS)}</label>
  <label>Own API base URL (OpenAI-compatible)<input data-k="apiBase" placeholder="https://api.openai.com/v1"></label><label>API key (stored only on this device)<input type="password" data-k="apiKey"></label><label>API model<input data-k="apiModel"></label>
  <button class="sm" id="reAI">Apply AI settings</button></fieldset>
 <fieldset><legend>AI opponent</legend><label>Difficulty${sel("diff",[["easy","Easy"],["normal","Normal"],["hard","Hard"]])}</label>
  <label>Commander opponent<select data-k="oppMtg">${opp("mtg")}</select></label><label>Yu-Gi-Oh! opponent<select data-k="oppYgo">${opp("ygo")}</select></label></fieldset>
 <fieldset><legend>Data</legend><div class="bar"><button class="sm" id="expAll">Export all data</button><button class="sm" id="impAll">Import data</button><button class="sm ghost" id="resetS">Reset settings</button></div></fieldset>
 <p class="hint">Ajani is an unofficial fan tool. Card data & images © their owners via Scryfall and YGOPRODeck. Not affiliated with Wizards of the Coast or Konami.</p></div>`;
 $$("#settings [data-k]").forEach(i=>{const k=i.dataset.k;if(i.type==="checkbox")i.checked=!!S[k];else i.value=S[k]??"";
  i.oninput=()=>{S[k]=i.type==="checkbox"?i.checked:i.type==="range"?+i.value:i.value;saveS();if(k==="name"||k==="avatar"||k==="persona")resetChat()}});
 $$("#settings [data-p]").forEach(b=>b.onclick=()=>{const c=PRESETS[b.dataset.p];[S.acc,S.acc2,S.bg,S.bg2]=c;saveS();renderSettings();sfx("add")});
 $$("#settings [data-img]").forEach(i=>i.onchange=()=>{const f=i.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement("canvas"),s=Math.min(1,800/Math.max(im.width,im.height));c.width=im.width*s;c.height=im.height*s;c.getContext("2d").drawImage(im,0,0,c.width,c.height);S[i.dataset.img]=c.toDataURL("image/jpeg",.8);saveS();resetChat();toast("Image saved")};im.src=r.result};r.readAsDataURL(f)});
 $("#clrImg").onclick=()=>{S.sleeveImg=S.matImg="";saveS()};$("#reAI").onclick=()=>{gen=null;loadAI();setView("ajani")};
 $("#resetS").onclick=()=>{S={...DEF};saveS();renderSettings();resetChat()};
 $("#expAll").onclick=()=>download("ajani-backup.json",JSON.stringify({ajani:1,settings:{...S,apiKey:""},decks:D},null,1),"application/json");
 $("#impAll").onclick=()=>{$("#file").onchange=async e=>{try{const j=JSON.parse(await e.target.files[0].text());if(!j.ajani)throw 0;if(j.decks)D={mtg:[],ygo:[],...j.decks};if(j.settings)S={...DEF,...j.settings,apiKey:S.apiKey};saveD();saveS();setGame(G);renderSettings();toast("Data imported")}catch{toast("Not an Ajani backup file")}e.target.value=""};$("#file").click()}}
/* ---------- init ---------- */
$$("#gameSw button").forEach(b=>b.onclick=()=>{setGame(b.dataset.g);sfx("click");$("#views").animate?.([{opacity:.3,transform:"translateX(30px)"},{opacity:1,transform:"none"}],{duration:400*(S.anim==="off"?0:1),easing:"ease-out"})});
$$("#tabs button").forEach(b=>b.onclick=()=>setView(b.dataset.v));
/* ---------- card-deal navigation ---------- */
const NAV=[["build","Forge of Decks","Sorcery — Workshop","Search cards, choose a commander, build and validate your deck.","#f0b43c",'<rect x="20" y="14" width="34" height="46" rx="4"/><rect x="34" y="26" width="34" height="46" rx="4"/><path d="M51 40v18M42 49h18"/>'],
 ["ajani","Counsel of Ajani","Instant — Advisor","Ask Ajani for card suggestions, synergies and deck checks.","#8b5cf6",'<path d="M14 18h56v34H34l-14 12V52h-6z"/><circle cx="32" cy="35" r="3"/><circle cx="44" cy="35" r="3"/><circle cx="56" cy="35" r="3"/>'],
 ["play","Duel of Champions","Sorcery — Battle","Playtest your deck on a shared tabletop against the AI.","#f87171",'<path d="M18 66L58 26M58 26l6-12-12 6M66 66L26 26M26 26l-6-12 12 6M14 58l8 8M70 58l-8 8"/>'],
 ["stats","Scrying Pool","Enchantment — Oracle","Simulate hundreds of goldfish games for curve and speed stats.","#34d399",'<path d="M16 66V44M32 66V28M48 66V38M64 66V18"/><path d="M12 68h60"/>'],
 ["set","Runes of Shaping","Artifact — Customisation","Themes, animations, playmats, AI model and opponent settings.","#60a5fa",'<circle cx="42" cy="42" r="10"/><path d="M42 14v10M42 60v10M14 42h10M60 42h10M22 22l7 7M55 55l7 7M22 62l7-7M55 29l7-7"/>']];
function navCard([v,t,ty,tx,col,ic]){return `<div class="ncard" data-v="${v}" style="--nc:${col}"><div class="ninner"><div class="nface"><div class="ntitle">${t}</div><div class="nart"><svg viewBox="0 0 84 84">${ic}</svg></div><div class="ntype">${ty}</div><div class="ntext">${tx}</div></div><div class="nback"></div></div></div>`}
function openDeal(){const o=$("#dealer");if(o.classList.contains("on")){closeDeal();return}o.innerHTML=`<div class="fan">${NAV.map(navCard).join("")}</div>`;o.classList.add("on");$("#fab").classList.add("open");sfx("shuffle");
 const cs=[...o.querySelectorAll(".ncard")],n=cs.length,mot=motionOK(),fab=$("#fab").getBoundingClientRect();
 cs.forEach((c,i)=>{const m=i-(n-1)/2,r=c.getBoundingClientRect();c.style.setProperty("--rot",m*12+"deg");c.style.setProperty("--ty",Math.abs(m)*14+"px");c.classList.toggle("cur",c.dataset.v===V);
  if(mot&&c.animate)c.animate([{transform:`translate(${fab.left+fab.width/2-r.left-r.width/2}px,${fab.top-r.top}px) rotate(0) scale(.2)`,opacity:0},{opacity:1,offset:.3},{transform:`rotate(${m*12}deg) translateY(${Math.abs(m)*14}px)`}],{duration:520*(S.anim==="subtle"?.5:1),delay:i*85,easing:"cubic-bezier(.2,.9,.3,1.2)",fill:"backwards"});
  setTimeout(()=>sfx("draw"),i*85);
  c.onpointermove=e=>{if(e.pointerType==="touch"||!mot)return;const b=c.getBoundingClientRect(),x=(e.clientX-b.left)/b.width-.5,y=(e.clientY-b.top)/b.height-.5;c.querySelector(".ninner").style.transform=`rotateY(${x*30}deg) rotateX(${-y*30}deg) translateY(-24px) scale(1.08)`};
  c.onpointerleave=()=>c.querySelector(".ninner").style.transform="";
  c.onclick=e=>{e.stopPropagation();pick(c,cs)}})}
function pick(c,cs){const v=c.dataset.v;sfx("win");if(!motionOK()){closeDeal(true);setView(v);return}
 const d=S.anim==="subtle"?.5:1;cs.forEach((o,i)=>{if(o!==c)o.animate([{},{transform:`translate(${(i-2)*160}px,${innerHeight}px) rotate(${(i-2)*60}deg)`,opacity:0}],{duration:450*d,easing:"ease-in",fill:"forwards"})});
 const r=c.getBoundingClientRect();c.style.zIndex=9;c.animate([{transform:getComputedStyle(c).transform},{transform:`translate(${innerWidth/2-r.left-r.width/2}px,${innerHeight/2-r.top-r.height/2}px) rotate(0) scale(1.4)`,offset:.45},{transform:`translate(${innerWidth/2-r.left-r.width/2}px,${innerHeight/2-r.top-r.height/2}px) rotateY(180deg) scale(${Math.max(innerWidth/r.width,innerHeight/r.height)*1.1})`,opacity:.0}],{duration:800*d,easing:"cubic-bezier(.5,0,.3,1)",fill:"forwards"});
 setTimeout(()=>{setView(v)},450*d);setTimeout(()=>closeDeal(true),800*d)}
function closeDeal(now){const o=$("#dealer");$("#fab").classList.remove("open");if(now||!motionOK()){o.classList.remove("on");o.innerHTML="";return}
 o.querySelectorAll(".ncard").forEach((c,i)=>c.animate([{},{transform:"translateY(120vh) rotate(30deg)",opacity:0}],{duration:350,delay:i*40,fill:"forwards"}));setTimeout(()=>{o.classList.remove("on");o.innerHTML=""},560)}
$("#fab").onclick=openDeal;$("#dealer").onclick=e=>{if(e.target.id==="dealer"||e.target.classList.contains("fan"))closeDeal()};
applyS();bgResize();requestAnimationFrame(bgLoop);setGame(G);setView("build");
if(S.apiKey&&S.apiBase)loadAI();
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");
