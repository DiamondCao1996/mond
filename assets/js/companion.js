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
  function mySnap(){return {name:(state.name||"friend"),done:myDone(),total:totalHabits(),streak:myStreakMax(),rewards:(state.rewardsEarned||0),region:state.region,intention:(state.intention&&state.intentionDate===today())?state.intention:""};}
  function setName(n){state.name=n;save();var u=$("userName");if(u)u.textContent=n;}

  /* ---------- Collaboration (PeerJS, room-code pairing) ---------- */
  var P={peer:null,conn:null,online:false,partner:null,retry:0};
  function setChip(){
    var chip=$("pairChip"),txt=$("pcTxt");if(!chip)return;
    chip.classList.toggle("online",P.online);
    if(P.online)txt.textContent=(state.partnerName||"Partner")+" · online";
    else if(state.pair&&state.pair.code)txt.textContent="Paired ("+state.pair.code+") · offline";
    else txt.textContent="Just you — invite a partner";
  }
  function person(s,cls,online){
    var init=((s.name||"?").trim().charAt(0)||"?").toUpperCase();
    var st=online?'<span class="st">online</span>':'<span class="st off">offline</span>';
    return '<div class="tg-person '+cls+'"><div class="av">'+esc(init)+'</div><div class="info">'+
      '<div class="nm">'+esc(s.name||"Someone")+' '+st+'</div>'+
      '<div class="bars">🌱 rituals <b>'+s.done+'/'+s.total+'</b> · 🔥 streak <b>'+s.streak+'</b> · 🌸 forest <b>'+s.rewards+'</b></div>'+
      (s.intention?'<div class="bars">✨ '+esc(s.intention)+'</div>':'')+'</div></div>';
  }
  function renderTogether(){
    var ps=$("togetherPs"),empty=$("tgEmpty"),live=$("tgLive");if(!ps)return;
    var paired=!!(state.pair&&state.pair.code);
    if(!paired){ps.textContent="Not paired";empty.hidden=false;live.hidden=true;setChip();return;}
    empty.hidden=true;live.hidden=false;
    ps.textContent=P.online?"Connected 🌸":"Waiting for partner…";
    var html=person(mySnap(),"me",true);
    if(P.partner)html+=person(P.partner,"partner",P.online);
    else html+='<div class="tg-note">Waiting for '+esc(state.partnerName||"your partner")+' to open Fresh Life…</div>';
    html+='<div class="tg-note">Synced directly between the two of you — nothing is stored on a server.</div>';
    live.innerHTML=html;setChip();
  }
  function broadcast(){if(P.conn&&P.conn.open){try{P.conn.send({t:"snap",snap:mySnap()});}catch(e){}}}
  function onData(msg){if(!msg||msg.t!=="snap")return;P.partner=msg.snap;if(msg.snap&&msg.snap.name){state.partnerName=msg.snap.name;save();}renderTogether();}
  function wireConn(conn){
    P.conn=conn;
    conn.on("open",function(){P.online=true;P.retry=0;broadcast();renderTogether();status("Connected 🌸");});
    conn.on("data",onData);
    conn.on("close",function(){P.online=false;renderTogether();});
    conn.on("error",function(){P.online=false;renderTogether();});
  }
  function status(t){var s=$("pmStatus");if(s)s.textContent=t;}
  function host(code){
    if(!window.Peer){status("Realtime library didn't load — check your connection and reload.");return;}
    try{P.peer=new Peer("fl-"+code);}catch(e){status("Could not start — try again.");return;}
    P.peer.on("open",function(){status("Space ready. Share code "+code+" with your partner.");});
    P.peer.on("connection",wireConn);
    P.peer.on("error",function(err){
      if(err&&err.type==="unavailable-id"){var c=genCode();state.pair={code:c,role:"host"};save();if($("pmCode"))$("pmCode").textContent=c.split("").join(" ");if($("pairModal"))$("pairModal").dataset.code=c;host(c);}
      else status("Connection issue: "+((err&&err.type)||"unknown"));
    });
  }
  function join(code){
    if(!window.Peer){status("Realtime library didn't load — check your connection and reload.");return;}
    try{P.peer=new Peer();}catch(e){status("Could not start — try again.");return;}
    P.peer.on("open",function(){status("Looking for "+code+"…");wireConn(P.peer.connect("fl-"+code,{reliable:true}));});
    P.peer.on("error",function(err){
      P.online=false;
      if(err&&err.type==="peer-unavailable"){status("Partner isn't online yet — I'll keep trying.");P.retry++;if(P.retry<60&&state.pair){setTimeout(function(){try{P.peer&&P.peer.destroy();}catch(e){}join(code);},5000);}}
      else status("Connection issue: "+((err&&err.type)||"unknown"));
      renderTogether();
    });
  }
  function startPair(){
    if(!state.pair||!state.pair.code)return;
    try{P.peer&&P.peer.destroy();}catch(e){}
    P.peer=null;P.conn=null;P.online=false;
    if(state.pair.role==="host")host(state.pair.code);else join(state.pair.code);
  }
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
  if($("pmCopy"))$("pmCopy").addEventListener("click",function(){var c=(($("pairModal").dataset.code)||"").replace(/\s/g,"");if(navigator.clipboard)navigator.clipboard.writeText(c);status("Code copied — send it to your partner.");});
  if($("pmJoinBtn"))$("pmJoinBtn").addEventListener("click",function(){
    var code=($("pmJoin").value||"").trim().toUpperCase().replace(/[^A-Z0-9]/g,"");
    if(code.length<4){status("Enter the code your partner shared.");return;}
    var name=($("pmName").value||"").trim();if(name)setName(name);
    state.pair={code:code,role:"guest"};save();startPair();renderTogether();status("Joining "+code+"…");
  });

  /* ---------- Settings modal ---------- */
  function openSet(){$("setName").value=state.name||"";$("setKey").value=state.apiKey||"";$("setModel").value=state.model||"claude-opus-4-8";$("setModal").hidden=false;}
  if($("settingsBtn"))$("settingsBtn").addEventListener("click",openSet);
  if($("setSave"))$("setSave").addEventListener("click",function(){
    setName(($("setName").value||"").trim()||state.name||"friend");
    state.apiKey=($("setKey").value||"").trim();
    state.model=($("setModel").value||"").trim()||"claude-opus-4-8";
    save();updateAiPs();closeModals();broadcast();
  });
  if($("setClear"))$("setClear").addEventListener("click",function(){state.apiKey="";state.chat=[];save();renderChat();updateAiPs();});

  /* ---------- AI companion ---------- */
  function updateAiPs(){var el=$("aiPs");if(el)el.textContent=state.apiKey?"ready":"add a key in ⚙ Settings";}
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
    if(!chat.length){w.innerHTML='<div class="chat-hint">Say hello, or tap a prompt below. Your companion already knows how your day is going 🌸</div>';return;}
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
    if(!state.apiKey){pushChat("assistant","I'd love to chat — add your Claude API key in ⚙ Settings first (it stays private in your browser).");openSet();return;}
    var prior=(state.chat||[]).map(function(m){return {role:m.role,content:m.text};});
    pushChat("user",text);
    var w=$("chatwrap"),think=document.createElement("div");think.className="bubble ai think";think.textContent="…";w.appendChild(think);w.scrollTop=w.scrollHeight;
    busy=true;
    fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{"content-type":"application/json","x-api-key":state.apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
      body:JSON.stringify({model:state.model||"claude-opus-4-8",max_tokens:800,system:SYS,output_config:{effort:"low"},messages:prior.concat([{role:"user",content:buildContext()+"\n\n"+text}])})
    }).then(function(r){return r.json();}).then(function(d){
      busy=false;
      if(d&&d.content){var t="";d.content.forEach(function(b){if(b.type==="text")t+=b.text;});pushChat("assistant",t||"(no reply)");}
      else if(d&&d.error){pushChat("assistant","Hmm — "+((d.error.message)||"something went wrong")+(d.error.type==="authentication_error"?" (check your API key in ⚙ Settings).":""));}
      else pushChat("assistant","Sorry, I couldn't reach the companion just now.");
    }).catch(function(){busy=false;pushChat("assistant","Network hiccup — I couldn't reach the companion. Try again in a moment.");});
  }
  if($("chatSend"))$("chatSend").addEventListener("click",function(){var i=$("chatInput");send(i.value);i.value="";});
  if($("chatInput"))$("chatInput").addEventListener("keydown",function(e){if(e.key==="Enter"){var i=$("chatInput");send(i.value);i.value="";}});
  var QUICK={encourage:"Give me a little encouragement for today.",patterns:"Look at my rituals, streaks and intention and tell me — kindly — what patterns you notice and what might help.",today:"Help me plan a calm, focused day around my rituals."};
  document.querySelectorAll("[data-ask]").forEach(function(b){b.addEventListener("click",function(){send(QUICK[b.getAttribute("data-ask")]);});});

  /* ---------- Petals ---------- */
  (function(){var p=$("petals");if(!p)return;var em=["🌸","🌷","🌼","💮"],h="";for(var i=0;i<12;i++){var l=Math.random()*100,d=8+Math.random()*10,dl=-Math.random()*d,sz=10+Math.random()*12;h+='<span class="petal" style="left:'+l+'%;font-size:'+sz+'px;animation-duration:'+d+'s;animation-delay:'+dl+'s">'+em[i%em.length]+'</span>';}p.innerHTML=h;})();

  /* ---------- Boot ---------- */
  updateAiPs();renderChat();renderTogether();
  if(state.pair&&state.pair.code)startPair();
  setInterval(function(){if(P.conn&&P.conn.open)broadcast();},3000);
})();
