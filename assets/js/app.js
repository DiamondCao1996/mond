/*!
 * Fresh Life — app.js · the engine (state, storage, clocks, rituals, timers, markets, diet, tips, rebalance, jet-lag)
 * Plain ES5-ish browser JS, loaded in order as classic scripts sharing a small
 * set of globals (state, save, HABITS, todayStr). No build step.
 */
"use strict";
/* ================= State & storage ================= */
var KEY="freshlife.v1";
var state=load();
if(state.theme)document.documentElement.setAttribute("data-theme",state.theme);
var FL_LANG=(window.FL_LANG)||(state.lang)||"en"; window.FL_LANG=FL_LANG;
function load(){
  try{var s=JSON.parse(localStorage.getItem(KEY));if(s&&typeof s==="object")return s;}catch(e){}
  return {region:"china",habits:{},streaks:{},lastReset:null,dietDay:null,jetDir:"toSweden"};
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}

/* ================= Time helpers (IANA, DST-safe) ================= */
function parts(tz,date){
  var f=new Intl.DateTimeFormat("en-US",{timeZone:tz,hour12:false,weekday:"short",
    year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"});
  var o={};f.formatToParts(date).forEach(function(p){o[p.type]=p.value;});
  if(o.hour==="24")o.hour="00";
  return o;
}
function tzMinutesNow(tz,date){var p=parts(tz,date);return (+p.hour)*60+(+p.minute);}
function tzWeekday(tz,date){return parts(tz,date).weekday;} // "Mon"..
function offsetMin(tz,date){
  var p=parts(tz,date);
  var asUTC=Date.UTC(+p.year,(+p.month)-1,+p.day,+p.hour,+p.minute,+p.second);
  return (asUTC-date.getTime())/60000;
}
// Convert a wall-clock minute-of-day in srcTz (today) into minute-of-day in dstTz
function convertWall(srcTz,dstTz,mins,ref){
  var p=parts(srcTz,ref);
  var guess=Date.UTC(+p.year,(+p.month)-1,+p.day,Math.floor(mins/60),mins%60,0);
  var off=offsetMin(srcTz,new Date(guess));
  var instant=new Date(guess-off*60000);
  return tzMinutesNow(dstTz,instant);
}
function fmtMin(m){m=((m%1440)+1440)%1440;var h=Math.floor(m/60),mm=m%60;return (h<10?"0":"")+h+":"+(mm<10?"0":"")+mm;}
function pad(n){return (n<10?"0":"")+n;}

/* ================= Header clocks ================= */
function locale(){return FL_LANG==="zh"?"zh-CN":FL_LANG==="sv"?"sv-SE":"en-GB";}
function dayPhase(min){
  var k=min<300?"ph_rest":min<420?"ph_dawn":min<720?"ph_morning":min<1020?"ph_afternoon":min<1290?"ph_evening":"ph_wind";
  return TX(k);
}
function tickClocks(){
  var now=new Date(),loc=locale();
  document.querySelectorAll(".clock").forEach(function(c){
    var tz=c.querySelector(".time").getAttribute("data-tz");
    var p=parts(tz,now);
    c.querySelector(".hm").textContent=p.hour+":"+p.minute;
    c.querySelector(".sec").textContent=":"+p.second;
    var min=(+p.hour)*60+(+p.minute);
    var df=new Intl.DateTimeFormat(loc,{timeZone:tz,weekday:"short",day:"numeric",month:"short"});
    c.querySelector("[data-date]").textContent=df.format(now);
    c.querySelector("[data-phase]").textContent=dayPhase(min);
  });
  // dateline in header from active region tz
  var tz=state.region==="china"?"Asia/Shanghai":"Europe/Stockholm";
  var dl=new Intl.DateTimeFormat(loc,{timeZone:tz,weekday:"long",day:"numeric",month:"long",year:"numeric"});
  document.getElementById("dateline").textContent=dl.format(now);
  var h=tzMinutesNow(tz,now);
  var gk=h<300?"gr_night":h<420?"gr_dawn":h<720?"gr_morning":h<1020?"gr_afternoon":h<1290?"gr_evening":"gr_late";
  document.getElementById("greeting").textContent=TX(gk);
}

/* ================= Region toggle ================= */
function setRegion(r){
  state.region=r;save();
  document.querySelectorAll(".clock").forEach(function(c){
    var on=c.getAttribute("data-region")===r;
    c.classList.toggle("active",on);c.setAttribute("aria-pressed",on?"true":"false");
  });
  renderTimeline();
  document.getElementById("routineSub").textContent = TX(r==="china"?"routine_cn":"routine_se");
  tickClocks();
}

/* ================= Data: schedules ================= */
var SCHEDULES={
  china:[
    ["06:30","Wake + morning light","Open the curtains, 5 slow breaths on the balcony. Light sets the clock."],
    ["06:45","Tai chi / mobility","15 min of slow form — grounding before the noise."],
    ["07:15","Warm breakfast","Protein-forward, sit down, no screens."],
    ["08:00","Deep research block","Freshest mind. One 50/10 focus block, phone away."],
    ["09:30","A-share / HK session","Trade the plan, not the feeling."],
    ["12:00","Lunch + short walk","Eat, then 10 min outdoors to reset."],
    ["14:00","Focused work / research","Second deep block; hydrate, green tea."],
    ["17:30","Move: yoga or a forest run","15 min is plenty — just begin."],
    ["18:30","Cook a light dinner","Colorful, protein + veg, gentle portion."],
    ["20:00","Facial care + tidy","Wash dishes, wipe surfaces, skin routine."],
    ["21:30","US pre-market watch","Only if trading tonight — dim the lights."],
    ["22:30","Wind-down + sleep","Screens off, stretch, gratitude, lights out."]
  ],
  sweden:[
    ["07:00","Wake + daylight lamp","Nordic mornings are dark half the year — get bright light early."],
    ["07:20","Tai chi / mobility","Slow form by the window; wake the body kindly."],
    ["07:50","Warm breakfast","Rye, eggs or skyr, berries. Sit, sip, no screens."],
    ["08:30","Deep research block","Protected morning focus — one 50/10 block."],
    ["11:00","Friluftsliv: step outside","Even 15 min of nature light lifts mood + focus."],
    ["12:30","Lunch (lagom)","Balanced, not too much — the Nordic middle way."],
    ["14:00","Focused work / research","Second block; tea, water, posture check."],
    ["15:30","HK close / A-share wrap","Review, journal the trades, close the tab."],
    ["17:00","Move: yoga or forest run","Into the trees before dusk — 15 min."],
    ["18:30","Cook a light dinner","Salmon, veg, wholegrain. Colorful plate."],
    ["20:00","Sauna / bath + skincare","Warm, unwind, facial care, wash dishes."],
    ["22:00","US session watch","If trading — keep lights warm and low."],
    ["23:00","Wind-down + sleep","Cool, dark room. Same time nightly."]
  ]
};
function nowMinRegion(){return tzMinutesNow(state.region==="china"?"Asia/Shanghai":"Europe/Stockholm",new Date());}
function renderTimeline(){
  var list=SCHEDULES[state.region],nowM=nowMinRegion(),html="";
  // find current block: last item whose time <= now
  var curIdx=-1;
  list.forEach(function(it,i){var m=(+it[0].slice(0,2))*60+(+it[0].slice(3));if(m<=nowM)curIdx=i;});
  list.forEach(function(it,i){
    html+='<div class="tl-item'+(i===curIdx?' now':'')+'">'+
      '<div class="tl-time tnum">'+it[0]+'</div>'+
      '<div class="tl-body"><div class="tl-title">'+it[1]+'</div><div class="tl-note">'+it[2]+'</div></div></div>';
  });
  document.getElementById("timeline").innerHTML=html;
}

/* ================= Data: habits ================= */
var HABITS=[
  {id:"sleep",name:"Sleep on time",nudges:["Same bedtime nightly is the single biggest lever for mood, weight & focus.","Future-you at the desk tomorrow is begging you to close the laptop now."]},
  {id:"cook",name:"Cook a real meal",nudges:["Cooking = you decide the salt, oil and portion. Control tastes like freedom.","A colorful home-cooked plate beats any takeout for your waistline and skin."]},
  {id:"teeth_am",name:"Brush teeth · morning",nudges:["Two clean-teeth moments a day — the tiniest ritual with lifelong payoff.","30 seconds now saves an afternoon in a dentist chair later."]},
  {id:"teeth_pm",name:"Brush + floss · night",nudges:["Nighttime brushing matters most — don't let the day sit on your teeth.","Floss is the daily habit dentists actually notice."]},
  {id:"dishes",name:"Wash the dishes",nudges:["A clear sink is a clear mind — 5 minutes buys tomorrow's calm.","Do it now while it's easy; crusted plates are a tax on future-you."]},
  {id:"clean",name:"Tidy the home",nudges:["A calm space lowers cortisol — your environment shapes your mood.","One 10-minute reset a day keeps the big clean-up away."]},
  {id:"yoga",name:"Yoga / stretch",nudges:["15 min of mobility keeps the trader's back and neck happy for decades.","Your body sits all day — give it 15 minutes to undo it."]},
  {id:"taichi",name:"Tai chi",nudges:["Slow movement + breath lowers stress and sharpens balance — proven with age.","The oldest focus practice you own. Flow, don't force."]},
  {id:"run",name:"Forest run / walk",nudges:["Nature + light + movement — the trifecta for a fresh, focused brain.","Just 15 minutes among trees measurably lowers stress hormones."]},
  {id:"facial",name:"Facial care",nudges:["Cleanse, moisturize, SPF — future skin is built on today's small ritual.","Consistency beats any expensive serum. Show up for your face."]}
];
function todayStr(){
  var tz=state.region==="china"?"Asia/Shanghai":"Europe/Stockholm";
  var p=parts(tz,new Date());return p.year+"-"+p.month+"-"+p.day;
}
function dailyReset(){
  var t=todayStr();
  if(state.lastReset!==t){
    // break streaks for habits missed yesterday
    if(state.lastReset){
      HABITS.forEach(function(h){if(!state.habits[h.id])state.streaks[h.id]=0;});
    }
    state.habits={};state.lastReset=t;save();
  }
}
function dayIndex(){ // 0..6 rotate nudges/diet by day
  var tz=state.region==="china"?"Asia/Shanghai":"Europe/Stockholm";
  var wd=tzWeekday(tz,new Date());
  return {Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[wd]||0;
}
function renderHabits(){
  var di=dayIndex(),html="";
  HABITS.forEach(function(h){
    var done=!!state.habits[h.id],st=state.streaks[h.id]||0;
    var nudge=h.nudges[di%h.nudges.length];
    html+='<div class="habit'+(done?' done':'')+'" data-id="'+h.id+'" role="checkbox" tabindex="0" aria-checked="'+done+'">'+
      '<span class="box"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>'+
      '<span class="txt"><span class="name">'+h.name+'</span><br><span class="nudge">'+nudge+'</span></span>'+
      '<span class="streak'+(st>0?' on':'')+'" title="'+TX("streak_title")+'">◇'+st+'</span></div>';
  });
  document.getElementById("habits").innerHTML=html;
  updateHabitProgress();
}
function updateHabitProgress(){
  var done=HABITS.filter(function(h){return state.habits[h.id];}).length;
  document.getElementById("habitProg").style.width=(done/HABITS.length*100)+"%";
  document.getElementById("habitCount").textContent=done+" / "+HABITS.length;
}
function toggleHabit(id){
  var was=!!state.habits[id];
  state.habits[id]=!was;
  if(!was){state.streaks[id]=(state.streaks[id]||0)+1;state.rewardsEarned=(state.rewardsEarned||0)+1;}
  else{state.streaks[id]=Math.max(0,(state.streaks[id]||0)-1);state.rewardsEarned=Math.max(0,(state.rewardsEarned||0)-1);}
  save();renderHabits();
}
document.getElementById("habits").addEventListener("click",function(e){
  var el=e.target.closest(".habit");if(el)toggleHabit(el.getAttribute("data-id"));
});
document.getElementById("habits").addEventListener("keydown",function(e){
  if(e.key===" "||e.key==="Enter"){var el=e.target.closest(".habit");if(el){e.preventDefault();toggleHabit(el.getAttribute("data-id"));}}
});

/* ================= Timers ================= */
var TIMERS=[
  {id:"yoga",name:"Yoga flow",min:15,desc:"Loosen the desk-bound body",steps:["Cat–cow & gentle spine rolls","Downward dog → low lunge, both sides","Standing forward fold, soften the neck","Seated twist + hip opener","Savasana: 2 min of stillness"]},
  {id:"taichi",name:"Tai chi",min:15,desc:"Slow form, calm breath",steps:["Stand: feet rooted, knees soft, 5 breaths","Commencing form — raise & lower arms","Part the wild horse's mane, both sides","Wave hands like clouds, slow & even","Close: hands to dantian, settle"]},
  {id:"run",name:"Forest run",min:15,desc:"Nature light + easy cardio",steps:["Step outside — trees or green if you can","3 min easy walk to warm up","Alternate 2 min jog / 1 min walk","Look far, breathe through the nose","Cool-down walk, notice one beautiful thing"]},
  {id:"facial",name:"Facial care",min:12,desc:"Cleanse → glow",steps:["Cleanse with lukewarm water","Gentle facial massage / gua sha, upward","Hydrating serum, pat don't rub","Moisturize; SPF if it's daytime","Smile — you showed up for your skin"]},
  {id:"clean",name:"Cleaning burst",min:15,desc:"Reset the space",steps:["Set the timer, pick one zone","Clear surfaces top to bottom","Wash the dishes, wipe the sink","Quick floor sweep / vacuum","Open a window, fresh air in"]},
  {id:"focus",name:"Deep focus (50/10)",min:50,desc:"Research / trading prep",steps:["Phone in another room, one tab open","Write the single outcome for this block","Work — no switching, no feeds","At the bell: stand, water, look far 20s","10 min real break before the next block"]},
  {id:"eyes",name:"Eye rest 20-20-20",min:20,desc:"Screen-break reminder",steps:["Every 20 min, look 20 ft away for 20 s","Blink fully 10 times, unclench the jaw","Roll shoulders back and down","Sip water","Back to it, softer gaze"]}
];
var timer={preset:TIMERS[0],remaining:TIMERS[0].min*60,total:TIMERS[0].min*60,running:false,handle:null};
var CIRC=2*Math.PI*86;
document.getElementById("dialProg").style.strokeDasharray=CIRC;
function renderPresets(){
  var html="";
  TIMERS.forEach(function(t){
    html+='<button class="preset'+(t.id===timer.preset.id?' active':'')+'" data-id="'+t.id+'">'+
      '<span class="p-min tnum">'+t.min+TX("unit_min")+'</span>'+
      '<span><span class="p-name">'+t.name+'</span><br><span class="p-desc">'+t.desc+'</span></span></button>';
  });
  document.getElementById("presets").innerHTML=html;
  var steps="";timer.preset.steps.forEach(function(s,i){steps+='<li><b>'+(i+1)+'</b><span>'+s+'</span></li>';});
  document.getElementById("steps").innerHTML=steps;
}
function fmtClock(s){var m=Math.floor(s/60);return pad(m)+":"+pad(s%60);}
function paintDial(){
  document.getElementById("dialTime").textContent=fmtClock(timer.remaining);
  document.getElementById("dialLbl").textContent=timer.preset.name;
  var frac=timer.total? timer.remaining/timer.total:0;
  document.getElementById("dialProg").style.strokeDashoffset=CIRC*(1-frac);
}
function selectPreset(id){
  stopTimer();
  timer.preset=TIMERS.filter(function(t){return t.id===id;})[0];
  timer.total=timer.remaining=timer.preset.min*60;
  renderPresets();paintDial();
  document.getElementById("tStart").textContent=TX("t_start");
}
function tick(){
  if(timer.remaining>0){timer.remaining--;paintDial();}
  else{stopTimer();chime();state.rewardsEarned=(state.rewardsEarned||0)+1;save();document.getElementById("tStart").textContent=TX("t_start");flashDone();}
}
function startTimer(){
  if(timer.running)return;
  if(timer.remaining<=0){timer.remaining=timer.total;}
  timer.running=true;timer.handle=setInterval(tick,1000);
  document.getElementById("tStart").textContent=TX("t_pause");
}
function pauseTimer(){timer.running=false;clearInterval(timer.handle);document.getElementById("tStart").textContent=TX("t_resume");}
function stopTimer(){timer.running=false;clearInterval(timer.handle);}
function flashDone(){
  var lbl=document.getElementById("dialLbl");var old=lbl.textContent;
  lbl.textContent=TX("t_done");setTimeout(function(){lbl.textContent=timer.preset.name;},4000);
}
document.getElementById("tStart").addEventListener("click",function(){timer.running?pauseTimer():startTimer();});
document.getElementById("tReset").addEventListener("click",function(){stopTimer();timer.remaining=timer.total;paintDial();document.getElementById("tStart").textContent=TX("t_start");});
document.getElementById("presets").addEventListener("click",function(e){var b=e.target.closest(".preset");if(b)selectPreset(b.getAttribute("data-id"));});
// gentle chime via WebAudio (no assets)
function chime(){
  try{
    var Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
    var ac=new Ctx();var t=ac.currentTime;
    [523.25,659.25,783.99].forEach(function(f,i){
      var o=ac.createOscillator(),g=ac.createGain();o.type="sine";o.frequency.value=f;
      o.connect(g);g.connect(ac.destination);
      var s=t+i*0.16;g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(0.18,s+0.02);
      g.gain.exponentialRampToValueAtTime(0.001,s+0.9);o.start(s);o.stop(s+0.95);
    });
  }catch(e){}
}

/* ================= Markets ================= */
var MARKETS=[
  {name:"US · NYSE/Nasdaq",tz:"America/New_York",sub:"New York",sessions:[[570,960]]},
  {name:"Hong Kong · HKEX",tz:"Asia/Hong_Kong",sub:"HKEX",sessions:[[570,720],[780,960]]},
  {name:"China A · SSE/SZSE",tz:"Asia/Shanghai",sub:"Shanghai / Shenzhen",sessions:[[570,690],[780,900]]}
];
function isWeekday(tz,d){var w=tzWeekday(tz,d);return w!=="Sat"&&w!=="Sun";}
function marketState(m,now){
  var open=isWeekday(m.tz,now),cur=tzMinutesNow(m.tz,now),inSession=false,nextEdge=null,edgeLabel="";
  if(open){
    for(var i=0;i<m.sessions.length;i++){
      var s=m.sessions[i];
      if(cur>=s[0]&&cur<s[1]){inSession=true;nextEdge=s[1];edgeLabel="closes";break;}
    }
    if(!inSession){
      for(var j=0;j<m.sessions.length;j++){if(cur<m.sessions[j][0]){nextEdge=m.sessions[j][0];edgeLabel="opens";break;}}
    }
  }
  var status=inSession?"open":(open&&edgeLabel==="opens"?"pre":"closed");
  var countdown="";
  if(nextEdge!=null){
    var diff=nextEdge-cur,hh=Math.floor(diff/60),mm=diff%60,dur=(hh>0?hh+"h ":"")+mm+"m";
    countdown=TP(edgeLabel==="opens"?"mkt_opens":"mkt_closes",{t:dur});
  }else if(status==="closed"){
    countdown = open ? TX("mkt_closed_day") : TX("mkt_weekend");
  }
  return {status:status,countdown:countdown};
}
function renderMarkets(){
  var now=new Date(),html="";
  MARKETS.forEach(function(m){
    var st=marketState(m,now);
    var pcls=st.status==="open"?"open":(st.status==="pre"?"pre":"closed");
    var ptxt=st.status==="open"?TX("mkt_open"):(st.status==="pre"?TX("mkt_pre"):TX("mkt_closed"));
    // convert first & last session edges into China + Sweden local
    var first=m.sessions[0][0], last=m.sessions[m.sessions.length-1][1];
    var cnOpen=convertWall(m.tz,"Asia/Shanghai",first,now), cnClose=convertWall(m.tz,"Asia/Shanghai",last,now);
    var seOpen=convertWall(m.tz,"Europe/Stockholm",first,now), seClose=convertWall(m.tz,"Europe/Stockholm",last,now);
    html+='<div class="card market">'+
      '<div class="m-top"><span class="m-name">'+m.name+'</span><span class="pill '+pcls+'">'+ptxt+'</span></div>'+
      '<div class="m-sub">'+m.sub+' · '+TX("mkt_localrange")+' '+fmtMin(first)+'–'+fmtMin(last)+'</div>'+
      '<div class="m-count tnum">'+st.countdown+'</div>'+
      '<div class="m-local">'+
        '<div class="row"><span>'+TX("mkt_cn")+'</span><span class="val tnum">'+fmtMin(cnOpen)+'–'+fmtMin(cnClose)+'</span></div>'+
        '<div class="row"><span>'+TX("mkt_se")+'</span><span class="val tnum">'+fmtMin(seOpen)+'–'+fmtMin(seClose)+'</span></div>'+
      '</div></div>';
  });
  document.getElementById("markets").innerHTML=html;
}

/* ================= Diet (7-day rotation) ================= */
var DIET=[
  {d:"Sunday",meals:[
    ["Breakfast","Congee-swap oat bowl","Steel-cut oats, edamame, soft egg, sesame, scallion","~350 kcal"],
    ["Lunch","Steamed sea bass + greens","Ginger-scallion fish, bok choy, half bowl brown rice","~450 kcal"],
    ["Dinner","Nordic veg soup","Root veg & white bean soup, rye crisp","~350 kcal"],
    ["Snack","Skyr + berries","Plain skyr, blueberries, walnuts","~180 kcal"]]},
  {d:"Monday",meals:[
    ["Breakfast","Tofu & rye scramble","Silken tofu scramble, spinach, rye toast","~340 kcal"],
    ["Lunch","Chicken & buckwheat bowl","Poached chicken, cucumber, buckwheat, chili-vinegar","~470 kcal"],
    ["Dinner","Salmon & dill","Baked salmon, roasted broccoli, lemon","~400 kcal"],
    ["Snack","Green tea + almonds","Sencha and a small handful of almonds","~150 kcal"]]},
  {d:"Tuesday",meals:[
    ["Breakfast","Berry protein smoothie","Skyr, frozen berries, flax, spinach","~300 kcal"],
    ["Lunch","Mapo-style tofu (light)","Tofu, mushrooms, doubanjiang-light, brown rice","~460 kcal"],
    ["Dinner","Herring & potato salad","Pickled herring, new potatoes, dill, greens","~380 kcal"],
    ["Snack","Orange + pumpkin seeds","Citrus and seeds for crunch","~140 kcal"]]},
  {d:"Wednesday",meals:[
    ["Breakfast","Savory soy-milk bowl","Warm soy milk, shrimp, seaweed, whole-grain youtiao-swap","~330 kcal"],
    ["Lunch","Rye wrap, chicken & veg","Rye tortilla, chicken, rainbow veg, yogurt sauce","~450 kcal"],
    ["Dinner","Steamed egg & greens","Chawanmushi-style egg custard, garlic gai-lan","~340 kcal"],
    ["Snack","Kiwi + cottage cheese","Two kiwis, cottage cheese","~170 kcal"]]},
  {d:"Thursday",meals:[
    ["Breakfast","Oat & lingonberry","Oats, lingonberry, chia, pumpkin seeds","~340 kcal"],
    ["Lunch","Poke-style tuna bowl","Seared tuna, edamame, seaweed, brown rice, half portion","~470 kcal"],
    ["Dinner","Napa cabbage hot-pot (light)","Clear broth, tofu, mushrooms, thin-sliced lean beef","~380 kcal"],
    ["Snack","Apple + peanut butter","One apple, thin PB","~180 kcal"]]},
  {d:"Friday",meals:[
    ["Breakfast","Veg & egg-white omelet","Egg whites + 1 yolk, tomato, herbs, rye crisp","~320 kcal"],
    ["Lunch","Soba & sesame greens","Buckwheat soba, edamame, sesame, wakame","~450 kcal"],
    ["Dinner","Baked cod, Nordic style","Cod, cauliflower mash, peas, dill","~400 kcal"],
    ["Snack","Dark chocolate + tea","2 squares 85%, green tea","~130 kcal"]]},
  {d:"Saturday",meals:[
    ["Breakfast","Shakshuka-lite","Eggs poached in tomato-pepper, side of greens","~340 kcal"],
    ["Lunch","Ginger chicken & rainbow veg","Stir-fried lean chicken, peppers, snap peas, brown rice","~470 kcal"],
    ["Dinner","Miso-glazed salmon","Salmon, roasted brussels sprouts, edamame","~410 kcal"],
    ["Snack","Pear + yogurt","Pear slices, plain yogurt, cinnamon","~160 kcal"]]}
];
var dayNames=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var dayInitials=["S","M","T","W","T","F","S"];
function renderDaypicker(sel){
  var html="";dayInitials.forEach(function(l,i){
    html+='<button class="'+(i===sel?"sel":"")+'" data-i="'+i+'" title="'+dayNames[i]+'">'+l+'</button>';
  });
  document.getElementById("daypicker").innerHTML=html;
}
function renderDiet(sel){
  var day=DIET[sel];
  document.getElementById("dietDayName").textContent=day.d+" "+TX("diet_sub");
  var html="";
  day.meals.forEach(function(m){
    html+='<div class="meal"><div class="m-when">'+m[0]+'</div><div class="m-dish">'+m[1]+'</div>'+
      '<div class="m-desc">'+m[2]+'</div><div class="m-kcal tnum">'+m[3]+'</div></div>';
  });
  document.getElementById("meals").innerHTML=html;
  renderDaypicker(sel);
}
document.getElementById("daypicker").addEventListener("click",function(e){
  var b=e.target.closest("button");if(!b)return;
  state.dietDay=+b.getAttribute("data-i");save();renderDiet(state.dietDay);
});

/* ================= Tips ================= */
var TIPS=[
  {tag:"Circadian",title:"Light in, then light out",why:"Morning daylight anchors your internal clock; dim, warm evenings let melatonin rise on time.",local:"Pair it with a dawn <b>tai chi</b> set outdoors — old practice, modern chronobiology."},
  {tag:"Sleep",title:"Same hours, every night",why:"A regular sleep–wake window improves mood, appetite control and recovery more than total hours alone.",local:"The Nordic <b>lagom</b> — not too late, not too little, the balanced middle."},
  {tag:"Nutrition",title:"Protein & fiber first",why:"Front-loading protein and vegetables blunts glucose spikes and keeps you full on fewer calories.",local:"Chinese <b>qing dan</b> cooking — steam, poach, lightly stir-fry; let the ingredient shine."},
  {tag:"Movement",title:"Mix easy cardio + strength",why:"Zone-2 cardio builds the aerobic base; resistance work protects muscle and metabolism as you age.",local:"A 15-min <b>forest run</b> plus bodyweight sets — nature does half the work."},
  {tag:"Stress",title:"Breathe slow to think clear",why:"Slow, mindful movement lowers stress hormones and measurably improves balance and focus.",local:"<b>Tai chi</b> and <b>qigong</b> — centuries of proof, now backed by trials."},
  {tag:"Recovery",title:"Nature & warmth restore you",why:"Time in green space lowers cortisol; regular sauna use is linked to better cardiovascular health.",local:"Swedish <b>friluftsliv</b> and the evening <b>sauna</b> — recovery as a way of life."}
];
function renderTips(){
  var html="";
  TIPS.forEach(function(t){
    html+='<div class="card tip"><div class="t-tag">'+t.tag+'</div><div class="t-title">'+t.title+'</div>'+
      '<div class="t-why">'+t.why+'</div><div class="t-local">'+t.local+'</div></div>';
  });
  document.getElementById("tips").innerHTML=html;
}

/* ================= Rebalance (interruption recovery) ================= */
var REBALANCE=[
 {key:"nosleep",label:"Missed / short sleep",
  intro:"You barely slept. Today isn't about feeling great — it's about protecting tonight's rhythm and not compounding the deficit. Choose light and gentle fuel over caffeine and sugar.",
  reassure:"One rough night doesn't undo anything. Hold the routine today and you're fully reset by tomorrow.",
  blocks:[
   {n:"Right now",t:"Wake the clock",items:["Bright daylight in the first 30 minutes","One coffee early — none after midday","10-min walk to shake off the fog"]},
   {n:"Through the day",t:"Fuel steady",items:["Protein + water each meal, skip sugar crashes","If wiped: one 20-min nap before 15:00, no longer","Batch the easy tasks, defer the hard calls"]},
   {n:"Trading",t:"Lower the stakes",items:["No big new positions on a tired brain","Trade the plan at smaller size","Short 50/10 blocks, not marathons"]},
   {n:"Tonight",t:"Protect the rhythm",items:["Bed only ~30–60 min early, not hours","Dark, cool room; screens off early","Same wake time tomorrow, anchored with light"]}
  ]},
 {key:"latemeal",label:"Ate too late / heavy",
  intro:"Dinner ran late or heavy. Digestion and sleep take the hit tonight — soften it now, then simply return to normal tomorrow. No skipping meals to ‘make up’.",
  reassure:"One late, heavy meal is a blip, not a setback. The fix is just your next ordinary day.",
  blocks:[
   {n:"Right now",t:"Aid digestion",items:["Gentle 10–15 min walk","Warm water or ginger / peppermint tea","Stay upright — don't lie down for 2–3h"]},
   {n:"Tonight",t:"Sleep softer",items:["Cool room; raise the pillow if reflux","Expect lighter sleep — don't stress it","No late-night snacking on top"]},
   {n:"Tomorrow",t:"Reset gently",items:["Light protein breakfast — don't skip","Protein + fiber first, lighter earlier dinner","Eating window back within daylight"]}
  ]},
 {key:"lateus",label:"Late US session",
  intro:"A late US session ate into your night. The bell is always late for you — the move is to build recovery in, not to fight it.",
  reassure:"Late sessions are part of the job. Repay the sleep debt in the morning and you stay ahead of it.",
  blocks:[
   {n:"During",t:"Ease the load",items:["Warm, dim lights + blue-light filter on","Hydrate; no caffeine after the first hour","Trade the plan — fatigue clouds judgment"]},
   {n:"At close",t:"Close the loop",items:["Write tomorrow's plan in 5 minutes","No doom-scrolling the P&L","Shut the tab — the day is done"]},
   {n:"Sleep",t:"Guard the wake time",items:["Protect your wake time over bedtime","Dark, cool room straight after","No ‘one more chart’"]},
   {n:"Tomorrow",t:"Repay it",items:["10 min outdoor light on waking","Lighter training, not a hard run","Earlier wind-down tonight"]}
  ]},
 {key:"nomove",label:"Skipped exercise",
  intro:"A few days without moving. Don't try to make it up — the only rep that counts is the next one. Restart tiny and let momentum rebuild.",
  reassure:"Fitness isn't lost in a few days. One 15-minute session today restarts everything.",
  blocks:[
   {n:"Right now",t:"Restart tiny",items:["Do ONE 15-min session — use a timer above","Pick yoga, tai chi or an easy walk","Momentum beats intensity today"]},
   {n:"Ease back",t:"Be kind",items:["Expect stiffness — go gentle the first day","No hero workout to ‘punish’ the gap","A forest walk counts fully"]},
   {n:"Make it stick",t:"Stack it",items:["Attach it to an anchor — after breakfast","Lay the mat / shoes out the night before","Same time daily so it restarts itself"]}
  ]},
 {key:"overload",label:"Stressed / unfocused",
  intro:"Stressed, scattered, can't focus. A scattered hour isn't a scattered day — one deliberate reset changes the whole trajectory.",
  reassure:"You're one breath and one walk away from clear again. Reset, then single-task.",
  blocks:[
   {n:"Right now",t:"Downshift",items:["Stop. 5 slow breaths, long exhales","Step outside — even 5 min of daylight","Unclench the jaw and shoulders"]},
   {n:"Reset the brain",t:"Move it out",items:["15-min tai chi or a short forest walk","Then single-task — phone away","One 50/10 focus block, one goal"]},
   {n:"Tonight",t:"Break the spiral",items:["Dim early; no heavy screens","Protect sleep — stress and poor sleep feed each other","Tomorrow's list down to 3 real items"]}
  ]},
 {key:"social",label:"Night out / drinks",
  intro:"A night out or a few drinks. Enjoying life is part of a balanced, colorful one — just cushion the edges so tomorrow stays bright.",
  reassure:"Balance includes the fun. Hydrate, get light, go gentle — you'll be back to fresh fast.",
  blocks:[
   {n:"That night",t:"Cushion it",items:["Water between drinks + a big glass before bed","Alcohol fragments sleep — expect a lighter night","A little food, not a heavy 3am meal"]},
   {n:"Next morning",t:"Rehydrate",items:["Daylight + a walk + water","Protein breakfast, easy on sugar","Gentle movement, not a hard workout"]},
   {n:"Trading",t:"Go easy",items:["Reactions are slower the morning after","Smaller size, stick strictly to the plan","No revenge trades"]}
  ]}
];
function renderRebalance(key){
  var r=REBALANCE.filter(function(x){return x.key===key;})[0]||REBALANCE[0];
  var sw="";REBALANCE.forEach(function(x){sw+='<button data-key="'+x.key+'" class="'+(x.key===r.key?"sel":"")+'">'+x.label+'</button>';});
  document.getElementById("rebSwitch").innerHTML=sw;
  document.getElementById("rebIntro").textContent=r.intro;
  var html="";r.blocks.forEach(function(b){var items="";b.items.forEach(function(i){items+="<li>"+i+"</li>";});
    html+='<div class="jet-day"><div class="jd-n">'+b.n+'</div><div class="jd-t">'+b.t+'</div><ul>'+items+'</ul></div>';});
  document.getElementById("rebDays").innerHTML=html;
  document.getElementById("rebReassure").textContent="♥  "+r.reassure;
}
document.getElementById("rebSwitch").addEventListener("click",function(e){
  var b=e.target.closest("button");if(!b)return;state.rebKey=b.getAttribute("data-key");save();renderRebalance(state.rebKey);
});

/* ================= Jet lag ================= */
var JET={
  toSweden:{intro:"Flying China → Sweden you gain hours (a phase delay — the easier direction). Your body wants to stay up late, so lean into evening light and a later bedtime, then nudge earlier.",days:[
    {n:"Day 0 · flight",t:"On the plane",items:["Set your watch to Stockholm now","Sleep on the plane only if it's night in Sweden","Hydrate, skip alcohol, walk the aisle"]},
    {n:"Day 1",t:"Seek evening light",items:["Get bright light in the afternoon/evening","Push bedtime later, toward Swedish night","First deep-work block late morning, not dawn"]},
    {n:"Day 2",t:"Anchor meals",items:["Eat on Sweden's schedule, protein breakfast","10-min outdoor walk after lunch","Avoid naps after 15:00"]},
    {n:"Day 3+",t:"Settle",items:["Consistent wake time with morning light","Normal training + market routine resumes","You should feel synced within ~3–4 days"]}
  ]},
  toChina:{intro:"Flying Sweden → China you lose hours (a phase advance — the harder direction). Your body resists an earlier bedtime, so chase morning light and protect an earlier, darker evening.",days:[
    {n:"Day 0 · flight",t:"On the plane",items:["Set your watch to Shanghai now","Sleep when it's night in China","Hydrate; consider evening melatonin (ask a clinician)"]},
    {n:"Day 1",t:"Chase morning light",items:["Bright light early; avoid late-evening light","Go to bed earlier than feels natural","Dim screens 2h before target bedtime"]},
    {n:"Day 2",t:"Advance the clock",items:["Wake with an alarm + immediate daylight","Front-load calories earlier in the day","Short tai chi to wake the body, no late naps"]},
    {n:"Day 3+",t:"Lock it in",items:["Keep the early wake time even if tired","Trade the plan; expect sharper focus by day 4","Full sync usually within ~4–5 days going east"]}
  ]}
};
function renderJet(dir){
  var j=JET[dir];
  document.getElementById("jetIntro").textContent=j.intro;
  var html="";
  j.days.forEach(function(d){
    var items="";d.items.forEach(function(i){items+="<li>"+i+"</li>";});
    html+='<div class="jet-day"><div class="jd-n">'+d.n+'</div><div class="jd-t">'+d.t+'</div><ul>'+items+'</ul></div>';
  });
  document.getElementById("jetDays").innerHTML=html;
  document.querySelectorAll("#jetSwitch button").forEach(function(b){b.classList.toggle("sel",b.getAttribute("data-dir")===dir);});
}
document.getElementById("jetSwitch").addEventListener("click",function(e){
  var b=e.target.closest("button");if(!b)return;state.jetDir=b.getAttribute("data-dir");save();renderJet(state.jetDir);
});

/* ================= Theme toggle ================= */
document.getElementById("themeBtn").addEventListener("click",function(){
  var cur=document.documentElement.getAttribute("data-theme");
  var isDark=cur? cur==="dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  state.theme=isDark?"light":"dark";save();
  document.documentElement.setAttribute("data-theme",state.theme);
});

/* ================= Clear ================= */
document.getElementById("clearAll").addEventListener("click",function(){
  if(confirm(TX("confirm_reset"))){
    state.habits={};state.streaks={};save();renderHabits();
  }
});

/* ================= Region clicks ================= */
document.getElementById("clocks").addEventListener("click",function(e){
  var c=e.target.closest(".clock");if(c)setRegion(c.getAttribute("data-region"));
});

/* ================= i18n data swap + boot ================= */
var EN_DATA={SCHEDULES:SCHEDULES,HABITS:HABITS,TIMERS:TIMERS,MARKETS:MARKETS,DIET:DIET,TIPS:TIPS,REBALANCE:REBALANCE,JET:JET,dayNames:dayNames,dayInitials:dayInitials};
function loadData(){
  var d=(FL_LANG!=="en"&&window.FL_DATA&&window.FL_DATA[FL_LANG])||EN_DATA;
  SCHEDULES=d.SCHEDULES||EN_DATA.SCHEDULES;HABITS=d.HABITS||EN_DATA.HABITS;TIMERS=d.TIMERS||EN_DATA.TIMERS;
  MARKETS=d.MARKETS||EN_DATA.MARKETS;DIET=d.DIET||EN_DATA.DIET;TIPS=d.TIPS||EN_DATA.TIPS;
  REBALANCE=d.REBALANCE||EN_DATA.REBALANCE;JET=d.JET||EN_DATA.JET;dayNames=d.dayNames||EN_DATA.dayNames;dayInitials=d.dayInitials||EN_DATA.dayInitials;
}
function reRenderAll(){
  setRegion(state.region);
  renderHabits();
  renderPresets();paintDial();
  renderMarkets();
  renderTips();
  renderRebalance(state.rebKey||"nosleep");
  renderJet(state.jetDir);
  renderDiet(state.dietDay==null?dayIndex():state.dietDay);
  tickClocks();
}
// called by i18n.js flSetLang when the language changes
window.__flRerender=function(){
  FL_LANG=window.FL_LANG;state.lang=FL_LANG;save();
  loadData();
  var pid=timer.preset&&timer.preset.id;
  var fresh=(timer.running===false&&timer.remaining===timer.total);
  timer.preset=TIMERS.filter(function(x){return x.id===pid;})[0]||TIMERS[0];
  if(fresh){timer.total=timer.remaining=timer.preset.min*60;}
  reRenderAll();
};

loadData();
timer.preset=TIMERS.filter(function(x){return x.id===timer.preset.id;})[0]||TIMERS[0];
timer.total=timer.remaining=timer.preset.min*60;
dailyReset();
reRenderAll();
setInterval(tickClocks,1000);
setInterval(function(){renderMarkets();renderTimeline();},30000);
