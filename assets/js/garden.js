/*!
 * Fresh Life — garden.js · the reward forest (grows a plant per completed ritual/timer)
 * Plain ES5-ish browser JS, loaded in order as classic scripts sharing a small
 * set of globals (state, save, HABITS, todayStr). No build step.
 */
"use strict";
var KEY="freshlife.v1";
var state=load();
if(state.theme)document.documentElement.setAttribute("data-theme",state.theme);
function load(){try{var s=JSON.parse(localStorage.getItem(KEY));if(s&&typeof s==="object")return s;}catch(e){}
  return {region:"china",habits:{},streaks:{}};}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}
function rand(a,b){return a+Math.random()*(b-a);}
function pick(list){return list[Math.floor(Math.random()*list.length)];}

/* ============ Species ============ */
// weighted deck: trees dominate; bunny/squirrel occasional; fox & mushroom rare
var DECK=[];
[["pine",26],["birch",16],["bush",13],["fern",9],["flower",4],["mushroom",5],
 ["bunny",10],["squirrel",9],["fox",3]].forEach(function(p){for(var i=0;i<p[1];i++)DECK.push(p[0]);});
var TREES={pine:1,birch:1}, GREEN={bush:1,fern:1,flower:1,mushroom:1}, CRITTERS={bunny:1,squirrel:1,fox:1};
var BASEW={pine:66,birch:60,bush:64,fern:46,flower:30,mushroom:34,bunny:48,squirrel:46,fox:64};

function svg(type){
  switch(type){
    case "pine": return '<svg viewBox="0 0 80 124">\
      <ellipse cx="40" cy="120" rx="19" ry="4.5" fill="rgba(20,40,30,.14)"/>\
      <rect x="35.5" y="90" width="9" height="27" rx="3" fill="#7c5636"/>\
      <polygon points="40,6 62,50 18,50" fill="#347e59"/>\
      <polygon points="40,30 69,80 11,80" fill="#2b6f4d"/>\
      <polygon points="40,56 76,104 4,104" fill="#317b57"/>\
      <polygon points="40,6 40,50 18,50" fill="#43976f" opacity=".65"/>\
      <polygon points="40,30 40,80 11,80" fill="#3a8965" opacity=".5"/></svg>';
    case "birch": return '<svg viewBox="0 0 88 124">\
      <ellipse cx="44" cy="120" rx="18" ry="4.5" fill="rgba(20,40,30,.14)"/>\
      <path d="M40 118 Q37 78 42 44 L49 44 Q47 80 47 118 Z" fill="#eef2ee"/>\
      <g fill="#3a463f"><rect x="42" y="56" width="6" height="2.4" rx="1"/><rect x="42" y="72" width="5" height="2.4" rx="1"/><rect x="43" y="90" width="5" height="2.4" rx="1"/><rect x="42" y="104" width="6" height="2.4" rx="1"/></g>\
      <circle cx="44" cy="34" r="24" fill="#6fae5a"/><circle cx="24" cy="44" r="15" fill="#5f9e4f"/><circle cx="64" cy="42" r="15" fill="#7cbb64"/>\
      <circle cx="54" cy="24" r="9" fill="#e2b24c"/><circle cx="30" cy="30" r="7" fill="#ecc768"/></svg>';
    case "bush": return '<svg viewBox="0 0 88 62">\
      <ellipse cx="44" cy="58" rx="24" ry="4.5" fill="rgba(20,40,30,.12)"/>\
      <circle cx="28" cy="42" r="18" fill="#3f8a5c"/><circle cx="60" cy="40" r="20" fill="#347a50"/><circle cx="44" cy="30" r="17" fill="#4a976a"/>\
      <circle cx="30" cy="34" r="2.4" fill="#d65b52"/><circle cx="56" cy="46" r="2.4" fill="#d65b52"/><circle cx="46" cy="24" r="2.4" fill="#d65b52"/></svg>';
    case "fern": return '<svg viewBox="0 0 60 64">\
      <ellipse cx="30" cy="60" rx="16" ry="3.5" fill="rgba(20,40,30,.10)"/>\
      <g stroke-linecap="round" fill="none"><path d="M30 62 C24 44 22 30 18 14" stroke="#4a9a68" stroke-width="4"/>\
      <path d="M30 62 C30 44 30 30 30 8" stroke="#57a874" stroke-width="4"/>\
      <path d="M30 62 C36 44 40 32 44 18" stroke="#3f8f60" stroke-width="4"/>\
      <path d="M30 60 C22 52 16 48 8 46" stroke="#4a9a68" stroke-width="3.4"/>\
      <path d="M30 60 C38 52 44 48 52 46" stroke="#3f8f60" stroke-width="3.4"/></g></svg>';
    case "flower": return '<svg viewBox="0 0 44 66">\
      <ellipse cx="22" cy="62" rx="12" ry="3" fill="rgba(20,40,30,.10)"/>\
      <path d="M22 62 C22 46 22 40 22 30" stroke="#4a9a68" stroke-width="3.4" fill="none" stroke-linecap="round"/>\
      <path d="M22 46 C16 44 14 40 13 36" stroke="#4a9a68" stroke-width="3" fill="none" stroke-linecap="round"/>\
      <g fill="#e78bb0"><circle cx="22" cy="14" r="7"/><circle cx="11" cy="22" r="7"/><circle cx="33" cy="22" r="7"/><circle cx="15" cy="34" r="7"/><circle cx="29" cy="34" r="7"/></g>\
      <circle cx="22" cy="24" r="6" fill="#f2c14e"/></svg>';
    case "mushroom": return '<svg viewBox="0 0 50 62">\
      <ellipse cx="25" cy="58" rx="14" ry="3.5" fill="rgba(20,40,30,.12)"/>\
      <path d="M18 56 Q17 40 25 38 Q33 40 32 56 Z" fill="#f3ece0"/>\
      <path d="M6 36 Q25 6 44 36 Q25 46 6 36 Z" fill="#c9524a"/>\
      <circle cx="18" cy="30" r="3" fill="#fff"/><circle cx="30" cy="26" r="3.4" fill="#fff"/><circle cx="35" cy="34" r="2.4" fill="#fff"/><circle cx="24" cy="36" r="2.4" fill="#fff"/></svg>';
    case "bunny": return '<svg viewBox="0 0 66 74">\
      <ellipse cx="34" cy="70" rx="18" ry="4" fill="rgba(20,40,30,.14)"/>\
      <ellipse cx="16" cy="20" rx="5" ry="15" fill="#e7e1d7"/><ellipse cx="27" cy="18" rx="5" ry="16" fill="#e7e1d7"/>\
      <ellipse cx="16" cy="20" rx="2.2" ry="9" fill="#e7a9b4"/><ellipse cx="27" cy="18" rx="2.2" ry="10" fill="#e7a9b4"/>\
      <circle cx="52" cy="54" r="8" fill="#fdfdfb"/>\
      <ellipse cx="34" cy="52" rx="18" ry="16" fill="#ece6dc"/>\
      <circle cx="22" cy="40" r="12" fill="#f1ebe1"/>\
      <circle cx="19" cy="38" r="1.9" fill="#33413a"/>\
      <path d="M14 42 q-1 2 -4 2" stroke="#c7a06a" stroke-width="1.4" fill="none"/>\
      <circle cx="13" cy="41" r="1.6" fill="#d98b96"/></svg>';
    case "squirrel": return '<svg viewBox="0 0 74 74">\
      <ellipse cx="38" cy="70" rx="18" ry="4" fill="rgba(20,40,30,.14)"/>\
      <path d="M50 64 Q80 52 66 20 Q58 2 40 8 Q62 12 58 34 Q54 54 42 56 Z" fill="#b5673a"/>\
      <path d="M52 60 Q72 50 62 26" stroke="#c9834f" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/>\
      <ellipse cx="38" cy="52" rx="14" ry="16" fill="#c47844"/>\
      <circle cx="28" cy="36" r="11" fill="#cd8350"/>\
      <path d="M20 28 q-3 -6 2 -8 q4 4 2 9 Z" fill="#b5673a"/>\
      <circle cx="24" cy="35" r="1.9" fill="#33272099"/><circle cx="24" cy="35" r="1.9" fill="#2b1f18"/>\
      <ellipse cx="20" cy="40" rx="2.6" ry="3" fill="#5a3a26"/>\
      <ellipse cx="34" cy="60" rx="5" ry="6" fill="#8a5230"/></svg>';
    case "fox": return '<svg viewBox="0 0 88 66">\
      <ellipse cx="46" cy="62" rx="24" ry="4" fill="rgba(20,40,30,.14)"/>\
      <path d="M20 50 Q-6 44 8 24 Q18 12 30 24 Q22 34 30 46 Z" fill="#e07a3c"/>\
      <path d="M12 42 Q0 38 6 26" stroke="#fbf3ea" stroke-width="6" fill="none" stroke-linecap="round"/>\
      <path d="M22 50 Q42 22 72 34 Q66 52 42 54 Q30 54 22 50 Z" fill="#e07a3c"/>\
      <path d="M40 52 Q52 50 60 44 Q52 54 42 54 Z" fill="#fbf3ea"/>\
      <path d="M64 40 L80 30 L74 46 Z" fill="#e07a3c"/>\
      <path d="M76 34 L82 30 L80 39 Z" fill="#2b1f18"/>\
      <path d="M64 24 L70 12 L76 26 Z" fill="#e07a3c"/><path d="M67 21 L70 14 L73 22 Z" fill="#2b1f18"/>\
      <circle cx="72" cy="34" r="2" fill="#2b1f18"/>\
      <circle cx="82" cy="42" r="2.2" fill="#2b1f18"/></svg>';
  }
  return "";
}

/* ============ Forest state ============ */
function ensureForest(){
  if(state.rewardsEarned==null){
    // seed for returning users: credit rituals already ticked today
    var done=0,h=state.habits||{};for(var k in h){if(h[k])done++;}
    state.rewardsEarned=done;
  }
  if(!state.forest||!Array.isArray(state.forest.plants))state.forest={plants:[],seen:0};
  var f=state.forest, target=state.rewardsEarned||0;
  while(f.plants.length<target)f.plants.push(newPlant());
  // forest only grows — we never remove plants when a task is un-ticked
  save();
  return f;
}
function newPlant(){
  var t=pick(DECK);
  var y=rand(55,93);                 // depth: higher y = nearer/front
  return {t:t, x:Math.round(rand(5,95)*10)/10, y:Math.round(y*10)/10, f:Math.random()<.5?1:0};
}
function scaleFor(y){return 0.55+(y-55)/(93-55)*0.72;} // far small -> near large

function render(){
  var f=state.forest, box=document.getElementById("plants");
  document.getElementById("empty").hidden = f.plants.length>0;
  var newFrom=f.seen||0, html="";
  f.plants.forEach(function(p,i){
    var sc=scaleFor(p.y), w=Math.round(BASEW[p.t]*sc);
    var z=Math.round(p.y*10);
    var isCrit=CRITTERS[p.t]?1:0;
    var cls="plant "+(isCrit?"hop":("sway"+(p.f?" b":"")))+(i>=newFrom?" pop":"");
    var flip=(!isCrit||p.f)?"":" scaleX(-1)";
    var delay=isCrit? (i%5)*0.6 : (i%7)*0.9;
    html+='<div class="'+cls+'" style="left:'+p.x+'%; top:'+p.y+'%; width:'+w+'px; z-index:'+z+
      '; animation-delay:'+((i>=newFrom)?( (i-newFrom)*0.08):(-delay))+'s">'+
      '<div style="transform:'+(flip||"none")+'">'+svg(p.t)+'</div></div>';
  });
  box.innerHTML=html;

  // stats
  var tr=0,gr=0,cr=0;
  f.plants.forEach(function(p){if(TREES[p.t])tr++;else if(CRITTERS[p.t])cr++;else gr++;});
  document.getElementById("sTrees").textContent=tr;
  document.getElementById("sGreen").textContent=gr;
  document.getElementById("sCritters").textContent=cr;
  document.getElementById("sTotal").textContent=f.plants.length;

  // greeting + toast on new growth
  var added=f.plants.length-(f.seen||0);
  if(added>0 && (f.seen||0)>=0 && f.plants.length>added){
    toast("🌿 "+added+" new "+(added===1?"friend":"friends")+" took root in your forest");
  }
  if(f.plants.length===0){
    document.getElementById("greeting").textContent="Your meadow is quiet and waiting. Finish a ritual or a focus timer on the dashboard, and the first tree takes root right here.";
  }else{
    var g=["A forest of "+f.plants.length+" living things, each one a promise you kept.",
      "Look what your small, steady acts have grown.",
      "Every tree here is a ritual you finished. Keep going — the critters follow the trees."];
    document.getElementById("greeting").textContent=pick(g);
  }
  f.seen=f.plants.length; save();
}

/* ============ Toast ============ */
var toastT;
function toast(msg){
  var el=document.getElementById("toast");el.textContent=msg;el.classList.add("show");
  clearTimeout(toastT);toastT=setTimeout(function(){el.classList.remove("show");},3600);
}

/* ============ Motes (ambient) ============ */
(function motes(){
  var m=document.getElementById("motes"),html="";
  for(var i=0;i<14;i++){
    var dur=rand(14,30),delay=-rand(0,dur),left=rand(0,100),sz=rand(3,7),op=rand(.25,.7);
    html+='<i class="mote" style="left:'+left+'%; width:'+sz+'px; height:'+sz+'px; opacity:'+op+
      '; animation-duration:'+dur+'s; animation-delay:'+delay+'s"></i>';
  }
  m.innerHTML=html;
})();

/* ============ Controls ============ */
document.getElementById("themeBtn").addEventListener("click",function(){
  var cur=document.documentElement.getAttribute("data-theme");
  var isDark=cur? cur==="dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  state.theme=isDark?"light":"dark";save();
  document.documentElement.setAttribute("data-theme",state.theme);
});
document.getElementById("reshuffle").addEventListener("click",function(){
  state.forest.plants.forEach(function(p){var n=newPlant();p.x=n.x;p.y=n.y;p.f=n.f;});
  state.forest.seen=state.forest.plants.length; // no pop animation on reshuffle
  save();render();
});

/* ============ Boot ============ */
ensureForest();
render();
// live-refresh if rituals are completed in another tab
window.addEventListener("storage",function(e){if(e.key===KEY){state=load();ensureForest();render();}});
