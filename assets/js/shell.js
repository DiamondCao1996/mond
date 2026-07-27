/*!
 * Fresh Life — shell.js · the chrome (editable name, daily intention, sidebar nav, mobile menu)
 * Plain ES5-ish browser JS, loaded in order as classic scripts sharing a small
 * set of globals (state, save, HABITS, todayStr). No build step.
 */
"use strict";
/* ================= Shell: greeting name, intention, nav, mobile menu ================= */
(function(){
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
  function today(){try{return todayStr();}catch(e){return "";}}

  /* --- editable name --- */
  var nameEl=document.getElementById("userName");
  nameEl.textContent=state.name||"friend";
  document.getElementById("editName").addEventListener("click",function(){
    var n=prompt("What should I call you?",state.name||"");
    if(n!==null){state.name=(n.trim()||"friend");save();nameEl.textContent=state.name;}
  });

  /* --- today's intention --- */
  var input=document.getElementById("intentionInput");
  var show=document.getElementById("intentionShow");
  function renderIntention(){
    if(state.intention&&state.intentionDate===today()){
      show.innerHTML='<span class="tag">🌱 Today’s intention: '+esc(state.intention)+' <button id="clrInt" title="Clear intention" aria-label="Clear intention">✕</button></span>';
      input.value="";
      document.getElementById("clrInt").addEventListener("click",function(){state.intention="";save();renderIntention();});
    }else{show.innerHTML="";}
  }
  function setInt(){var v=input.value.trim();if(!v)return;state.intention=v;state.intentionDate=today();save();renderIntention();}
  document.getElementById("intentionBtn").addEventListener("click",setInt);
  input.addEventListener("keydown",function(e){if(e.key==="Enter")setInt();});
  renderIntention();

  /* --- mobile sidebar --- */
  var sb=document.getElementById("sidebar"),scrim=document.getElementById("scrim");
  function toggle(open){sb.classList.toggle("open",open);scrim.classList.toggle("on",open);}
  document.getElementById("menuBtn").addEventListener("click",function(){toggle(!sb.classList.contains("open"));});
  scrim.addEventListener("click",function(){toggle(false);});
  document.querySelectorAll(".nav-i").forEach(function(a){a.addEventListener("click",function(){if(window.innerWidth<=960)toggle(false);});});

  /* --- active nav on scroll --- */
  var links=[].slice.call(document.querySelectorAll('.nav-i[href^="#"]'));
  var map={};links.forEach(function(a){var el=document.getElementById(a.getAttribute("href").slice(1));if(el)map[el.id]=a;});
  var ids=Object.keys(map);
  if("IntersectionObserver" in window && ids.length){
    var obs=new IntersectionObserver(function(ents){
      ents.forEach(function(en){if(en.isIntersecting){links.forEach(function(l){l.classList.remove("active");});map[en.target.id].classList.add("active");}});
    },{rootMargin:"-42% 0px -52% 0px"});
    ids.forEach(function(id){obs.observe(document.getElementById(id));});
  }
})();
