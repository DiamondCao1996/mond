/*!
 * Fresh Life — companion.js · two-person P2P pairing + the Claude AI companion
 * Plain ES5-ish browser JS, loaded in order as classic scripts sharing a small
 * set of globals (state, save, HABITS, todayStr). No build step.
 */
"use strict";
/* ============ Companion: two-person pairing (P2P) + AI advisor ============ */
(function(){
  var $=function(id){return document.getElementById(id);};
  function today(){try{return todayStr();}catch(e){return "";}}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
  function totalHabits(){return (window.HABITS&&HABITS.length)||10;}
  function myDone(){var n=0,h=state.habits||{};for(var k in h)if(h[k])n++;return n;}
  function myStreakMax(){var m=0,s=state.streaks||{};for(var k in s)if(s[k]>m)m=s[k];return m;}
  function mySnap(){return {name:(state.name||TX("name_friend")),done:myDone(),total:totalHabits(),streak:myStreakMax(),rewards:(state.rewardsEarned||0),region:state.region,intention:(state.intention&&state.intentionDate===today())?state.intention:""};}
  function setName(n){state.name=n;save();var u=$("userName");if(u)u.textContent=n;}

  /* ---------- Collaboration (public MQTT broker, room-code pairing) ---------- */
  // Pairing goes through a public MQTT-over-WebSocket broker: a plain outbound
  // WSS connection that works through NAT and firewalls everywhere — far more
  // reliable than raw WebRTC, which needs a TURN relay to cross many networks.
  var BROKER="wss://broker.emqx.io:8084/mqtt";
  var P={client:null,connected:false,online:false,partner:null,me:null,topic:null,lastRx:0};
  function setChip(){
    var chip=$("pairChip"),txt=$("pcTxt");if(!chip)return;
    chip.classList.toggle("online",P.online);
    if(P.online)txt.textContent=TP("pc_online",{name:(state.partnerName||TX("p_partner"))});
    else if(state.pair&&state.pair.code)txt.textContent=TP("pc_paired",{code:state.pair.code});
    else txt.textContent=TX("pc_justyou");
  }
  function person(s,cls,online){
    var init=((s.name||"?").trim().charAt(0)||"?").toUpperCase();
    var st=online?'<span class="st">'+TX("p_online")+'</span>':'<span class="st off">'+TX("p_offline")+'</span>';
    return '<div class="tg-person '+cls+'"><div class="av">'+esc(init)+'</div><div class="info">'+
      '<div class="nm">'+esc(s.name||TX("p_someone"))+' '+st+'</div>'+
      '<div class="bars">🌱 '+TX("p_rituals")+' <b>'+s.done+'/'+s.total+'</b> · 🔥 '+TX("p_streak")+' <b>'+s.streak+'</b> · 🌸 '+TX("p_forest")+' <b>'+s.rewards+'</b></div>'+
      (s.intention?'<div class="bars">✨ '+esc(s.intention)+'</div>':'')+'</div></div>';
  }
  function renderTogether(){
    var ps=$("togetherPs"),empty=$("tgEmpty"),live=$("tgLive");if(!ps)return;
    var paired=!!(state.pair&&state.pair.code);
    if(!paired){ps.textContent=TX("tg_notpaired");empty.hidden=false;live.hidden=true;setChip();return;}
    empty.hidden=true;live.hidden=false;
    ps.textContent=P.online?TX("tg_connected"):TX("tg_waiting");
    var html=person(mySnap(),"me",true);
    if(P.partner)html+=person(P.partner,"partner",P.online);
    else html+='<div class="tg-note">'+TP("tg_waitfor",{name:esc(state.partnerName||TX("p_partner"))})+'</div>';
    html+='<div class="tg-note">'+TX("tg_synced")+'</div>';
    live.innerHTML=html;setChip();
  }
  function pub(){if(P.client&&P.connected&&P.topic){try{P.client.publish(P.topic,JSON.stringify({from:P.me,snap:mySnap()}));}catch(e){}}}
  function broadcast(){pub();}
  function onMsg(payload){
    var d;try{d=JSON.parse(payload.toString());}catch(e){return;}
    if(!d||!d.from||d.from===P.me)return;               // ignore our own echo
    if(d.snap){P.partner=d.snap;if(d.snap.name){state.partnerName=d.snap.name;save();}}
    P.lastRx=Date.now();
    var was=P.online;P.online=true;
    if(!was)pub();                                       // greet back so the partner sees us immediately
    status(TX("pm_status_conn"));renderTogether();
  }
  function status(t){var s=$("pmStatus");if(s)s.textContent=t;}
  function teardown(){try{P.client&&P.client.end(true);}catch(e){}P.client=null;P.connected=false;P.online=false;P.partner=null;}
  function connect(code){
    if(!window.mqtt){status(TX("pm_status_nolib"));return;}
    teardown();
    P.me="fl"+Math.random().toString(36).slice(2,10)+(Date.now()%100000);
    P.topic="freshlife/room/"+code;
    var isHost=!!(state.pair&&state.pair.role==="host");
    status(isHost?TP("pm_status_ready",{code:code}):TX("pm_status_relay"));
    try{P.client=mqtt.connect(BROKER,{clientId:("fl_"+P.me).slice(0,22),reconnectPeriod:3000,connectTimeout:9000,clean:true});}
    catch(e){status(TX("pm_status_nolib"));return;}
    P.client.on("connect",function(){P.connected=true;P.client.subscribe(P.topic,function(){});pub();renderTogether();});
    P.client.on("message",function(t,m){onMsg(m);});
    P.client.on("close",function(){P.connected=false;P.online=false;renderTogether();});
    P.client.on("error",function(){status(TX("pm_status_failed"));});
  }
  function startPair(){ if(state.pair&&state.pair.code)connect(state.pair.code); }
  var CODEC="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  function genCode(){var s="";for(var i=0;i<6;i++)s+=CODEC.charAt(Math.floor(Math.random()*CODEC.length));return s;}

  /* ---------- Pairing modal ---------- */
  function openPair(){var m=$("pairModal");if(!m)return;$("pmName").value=state.name||"";var code=(state.pair&&state.pair.code)||genCode();$("pmCode").textContent=code.split("").join(" ");m.dataset.code=code;m.hidden=false;}
  function closeModals(){if($("pairModal"))$("pairModal").hidden=true;if($("setModal"))$("setModal").hidden=true;}
  if($("pairChip"))$("pairChip").addEventListener("click",openPair);
  if($("tgPairBtn"))$("tgPairBtn").addEventListener("click",openPair);
  document.querySelectorAll("[data-close]").forEach(function(b){b.addEventListener("click",closeModals);});
  document.querySelectorAll(".modal-back").forEach(function(m){m.addEventListener("click",function(e){if(e.target===m)closeModals();});});
  if($("pmCreate"))$("pmCreate").addEventListener("click",function(){
    var name=($("pmName").value||"").trim();if(name)setName(name);
    var code=($("pairModal").dataset.code)||genCode();
    state.pair={code:code,role:"host"};save();
    $("pmCopy").hidden=false;startPair();renderTogether();
  });
  if($("pmCopy"))$("pmCopy").addEventListener("click",function(){var c=(($("pairModal").dataset.code)||"").replace(/\s/g,"");if(navigator.clipboard)navigator.clipboard.writeText(c);status(TX("pm_status_copied"));});
  if($("pmJoinBtn"))$("pmJoinBtn").addEventListener("click",function(){
    var code=($("pmJoin").value||"").trim().toUpperCase().replace(/[^A-Z0-9]/g,"");
    if(code.length<4){status(TX("pm_status_needcode"));return;}
    var name=($("pmName").value||"").trim();if(name)setName(name);
    state.pair={code:code,role:"guest"};save();startPair();renderTogether();status(TP("pm_status_join",{code:code}));
  });

  /* ---------- Settings modal ---------- */
  function openSet(){$("setName").value=state.name||"";$("setKey").value=state.apiKey||"";$("setModel").value=state.model||"claude-opus-4-8";$("setModal").hidden=false;}
  if($("settingsBtn"))$("settingsBtn").addEventListener("click",openSet);
  if($("setSave"))$("setSave").addEventListener("click",function(){
    setName(($("setName").value||"").trim()||state.name||TX("name_friend"));
    state.apiKey=($("setKey").value||"").trim();
    state.model=($("setModel").value||"").trim()||"claude-opus-4-8";
    save();updateAiPs();closeModals();broadcast();
  });
  if($("setClear"))$("setClear").addEventListener("click",function(){state.apiKey="";state.chat=[];save();renderChat();updateAiPs();});

  /* ---------- AI companion ---------- */
  function updateAiPs(){var el=$("aiPs");if(el)el.textContent=state.apiKey?TX("ai_ready"):TX("ai_needkey");}
  // markdown-lite → tidy HTML (bold headline + bullets), for a clean ADHD-friendly layout
  function inlineMd(s){return esc(s).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>");}
  function fmt(raw){
    var lines=String(raw).replace(/\r/g,"").split("\n"),html="",listType=null,buf=[];
    function flush(){if(listType){html+="<"+listType+">"+buf.join("")+"</"+listType+">";buf=[];listType=null;}}
    for(var i=0;i<lines.length;i++){
      var t=lines[i].trim(),ul=t.match(/^[-*•]\s+(.*)$/),ol=t.match(/^\d+[.)]\s+(.*)$/);
      if(ul){if(listType!=="ul")flush();listType="ul";buf.push("<li>"+inlineMd(ul[1])+"</li>");}
      else if(ol){if(listType!=="ol")flush();listType="ol";buf.push("<li>"+inlineMd(ol[1])+"</li>");}
      else if(t===""){flush();}
      else{flush();html+="<p>"+inlineMd(t)+"</p>";}
    }
    flush();return html||esc(raw);
  }
  function renderChat(){
    var w=$("chatwrap");if(!w)return;var chat=state.chat||[];
    if(!chat.length){w.innerHTML='<div class="chat-hint">'+esc(TX("chat_hint"))+'</div>';return;}
    w.innerHTML=chat.map(function(m){return '<div class="bubble '+(m.role==="user"?"me":"ai")+'">'+(m.role==="user"?esc(m.text):fmt(m.text))+'</div>';}).join("");
    w.scrollTop=w.scrollHeight;
  }
  function pushChat(role,text){state.chat=(state.chat||[]).concat([{role:role,text:text}]);if(state.chat.length>16)state.chat=state.chat.slice(-16);save();renderChat();}
  function buildContext(){
    var m=mySnap();
    var s="Here's how I'm doing right now — living in: "+(m.region==="china"?"China":"Sweden")+"; rituals done today: "+m.done+"/"+m.total+"; longest current streak: "+m.streak+" days; forest plantings earned: "+m.rewards+"; today's intention: "+(m.intention||"(none set yet)")+".";
    if(P.partner)s+=" I'm paired with "+(state.partnerName||"my partner")+", who has done "+P.partner.done+"/"+P.partner.total+" rituals today (streak "+P.partner.streak+"). We cheer each other on.";
    return s;
  }
  var SYS="You are Fresh Life's companion, talking with someone who has ADHD — so shape every reply for an ADHD brain. Rules: (1) Start with the single most important thing as one short **bold** headline. (2) Be concrete and specific — name the exact ritual, time, number, or streak from their day; never vague or generic. (3) Keep it short and simple: plain everyday words, short lines, no wall of text. (4) Give AT MOST 5 suggestions, and fewer is better — put each on its own line starting with \"- \", one short action per line. (5) Make the very first step tiny and obvious so it's easy to begin (e.g. \"do it for 2 minutes, right now\"). (6) Be warm and kind — celebrate small wins by name, no shame, no lectures, no long preamble. If they're paired with a partner, add one small way they can support each other. You are not a doctor or therapist; for medical concerns or emotional crises, gently and briefly suggest a professional or a local helpline. LAYOUT every reply as: one **bold** headline line, then (only if useful) up to 5 short \"- \" bullets. Keep the whole reply under ~110 words.";
  var busy=false;
  function send(text){
    if(busy)return;text=(text||"").trim();if(!text)return;
    if(!state.apiKey){pushChat("assistant",TX("chat_needkey"));openSet();return;}
    var prior=(state.chat||[]).map(function(m){return {role:m.role,content:m.text};});
    pushChat("user",text);
    var w=$("chatwrap"),think=document.createElement("div");think.className="bubble ai think";think.textContent="…";w.appendChild(think);w.scrollTop=w.scrollHeight;
    busy=true;
    var langName={en:"English",zh:"Simplified Chinese (简体中文)",sv:"Swedish (svenska)"}[window.FL_LANG]||"English";
    var sys=SYS+" Always write your reply in "+langName+" — keep the same ADHD-friendly layout (a bold headline, then up to 5 short bullets).";
    fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{"content-type":"application/json","x-api-key":state.apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
      body:JSON.stringify({model:state.model||"claude-opus-4-8",max_tokens:800,system:sys,output_config:{effort:"low"},messages:prior.concat([{role:"user",content:buildContext()+"\n\n"+text}])})
    }).then(function(r){return r.json();}).then(function(d){
      busy=false;
      if(d&&d.content){var t="";d.content.forEach(function(b){if(b.type==="text")t+=b.text;});pushChat("assistant",t||"(no reply)");}
      else if(d&&d.error){pushChat("assistant",TX("err_prefix")+((d.error.message)||TX("err_something"))+(d.error.type==="authentication_error"?TX("err_auth"):""));}
      else pushChat("assistant",TX("err_generic"));
    }).catch(function(){busy=false;pushChat("assistant",TX("err_network"));});
  }
  if($("chatSend"))$("chatSend").addEventListener("click",function(){var i=$("chatInput");send(i.value);i.value="";});
  if($("chatInput"))$("chatInput").addEventListener("keydown",function(e){if(e.key==="Enter"){var i=$("chatInput");send(i.value);i.value="";}});
  var QMAP={encourage:"q_send_encourage",patterns:"q_send_patterns",today:"q_send_today"};
  document.querySelectorAll("[data-ask]").forEach(function(b){b.addEventListener("click",function(){send(TX(QMAP[b.getAttribute("data-ask")]));});});

  /* ---------- AI: rebuild the whole day into a detailed routine ---------- */
  function parseRoutine(txt){
    if(!txt)return null;
    var s=txt.indexOf("["),e=txt.lastIndexOf("]");
    if(s<0||e<=s)return null;
    var arr;try{arr=JSON.parse(txt.slice(s,e+1));}catch(err){return null;}
    if(!arr||!arr.length)return null;
    var out=[];
    arr.forEach(function(x){
      if(!x)return;
      var time=String(x.time||x.t||"").trim();
      var title=String(x.title||x.name||"").trim();
      var note=String(x.note||x.desc||"").trim();
      if(/^\d{1,2}:\d{2}$/.test(time)&&title){if(time.length===4)time="0"+time;out.push([time,title,note]);}
    });
    return out.length?out:null;
  }
  function buildRoutine(){
    if(busy)return;
    if(!state.apiKey){pushChat("assistant",TX("chat_needkey"));openSet();return;}
    pushChat("user",TX("q_send_routine"));
    var w=$("chatwrap"),think=document.createElement("div");think.className="bubble ai think";think.textContent="…";w.appendChild(think);w.scrollTop=w.scrollHeight;
    busy=true;
    var lang=window.FL_LANG||"en";
    var langName={en:"English",zh:"Simplified Chinese (简体中文)",sv:"Swedish (svenska)"}[lang]||"English";
    var region=state.region==="china"?"China (timezone Asia/Shanghai)":"Sweden (timezone Europe/Stockholm)";
    var sched=(window.SCHEDULES&&SCHEDULES[state.region])||[];
    var cur=sched.map(function(it){return it[0]+"  "+it[1]+" — "+it[2];}).join("\n");
    var mine=(window.HABITS||[]).map(function(h){return h.name;}).concat((state.customHabits||[]).map(function(h){return h.name;})).join(", ");
    var m=mySnap(),intent=m.intention||"(none set)";
    var sys="You are a thoughtful daily-routine designer for a researcher-trader who lives between China and Sweden. Rebuild the person's day into a MORE DETAILED, realistic schedule. Keep their key anchors (wake + morning light, movement like tai chi / yoga / a forest run, protein-forward meals, deep-research focus blocks, the relevant market sessions, skincare, and a calm wind-down + sleep) and weave in their personal checklist items and today's intention. Use 12–16 time-blocks with sensible times for their region, each with a short, warm, practical note. Reply with ONLY a JSON array — no prose, no markdown, no code fences — written in "+langName+", shaped like: [{\"time\":\"HH:MM\",\"title\":\"short title\",\"note\":\"one short line\"}]. Use 24-hour HH:MM times sorted ascending.";
    var user="Region: "+region+"\n\nCurrent routine:\n"+cur+"\n\nMy checklist items: "+(mine||"(none)")+"\nToday's intention: "+intent+"\n\nRebuild this into a more detailed, realistic day for me. JSON array only.";
    fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{"content-type":"application/json","x-api-key":state.apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
      body:JSON.stringify({model:state.model||"claude-opus-4-8",max_tokens:2000,system:sys,output_config:{effort:"low"},messages:[{role:"user",content:user}]})
    }).then(function(r){return r.json();}).then(function(d){
      busy=false;
      if(d&&d.error){pushChat("assistant",TX("err_prefix")+((d.error.message)||TX("err_something"))+(d.error.type==="authentication_error"?TX("err_auth"):""));return;}
      var txt="";if(d&&d.content)d.content.forEach(function(b){if(b.type==="text")txt+=b.text;});
      var arr=parseRoutine(txt);
      if(arr&&arr.length>=4){
        state.customSchedule=state.customSchedule||{};
        state.customSchedule[state.region]={lang:lang,items:arr};
        save();
        if(window.renderTimeline)renderTimeline();
        pushChat("assistant",TX("routine_applied"));
      }else{
        pushChat("assistant",txt||TX("routine_fail"));
      }
    }).catch(function(){busy=false;pushChat("assistant",TX("err_network"));});
  }
  if($("buildRoutineBtn"))$("buildRoutineBtn").addEventListener("click",buildRoutine);

  /* ---------- Petals ---------- */
  (function(){var p=$("petals");if(!p)return;var em=["🌸","🌷","🌼","💮"],h="";for(var i=0;i<12;i++){var l=Math.random()*100,d=8+Math.random()*10,dl=-Math.random()*d,sz=10+Math.random()*12;h+='<span class="petal" style="left:'+l+'%;font-size:'+sz+'px;animation-duration:'+d+'s;animation-delay:'+dl+'s">'+em[i%em.length]+'</span>';}p.innerHTML=h;})();

  /* ---------- Language re-render hook ---------- */
  window.__flRerenderCompanion=function(){updateAiPs();renderChat();renderTogether();};

  /* ---------- Boot ---------- */
  updateAiPs();renderChat();renderTogether();
  if(state.pair&&state.pair.code)startPair();
  setInterval(function(){
    broadcast();
    if(P.online&&Date.now()-P.lastRx>18000){P.online=false;renderTogether();}  // partner went quiet
  },3000);
})();
