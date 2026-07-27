/*!
 * Fresh Life — i18n.js · English / 中文 / Svenska
 * Loaded FIRST. Holds the UI dictionary + the 中文/Svenska content data
 * (English content lives in app.js as the fallback). Exposes TX/TP,
 * flApplyStatic, flSetLang and FL_DATA on window.
 */
"use strict";
(function(){
  function readLang(){
    try{var s=JSON.parse(localStorage.getItem("freshlife.v1"));if(s&&(s.lang==="zh"||s.lang==="sv"||s.lang==="en"))return s.lang;}catch(e){}
    return "en";
  }
  window.FL_LANG=readLang();

  /* ============ UI strings ============ */
  var UI={
    en:{
      nav_today:"Today",nav_companion:"Companion",nav_timers:"Rituals & Timers",nav_markets:"Markets",nav_rebalance:"Rebalance",nav_diet:"Diet",nav_insights:"Insights",nav_jetlag:"Jet lag",nav_forest:"Our Forest",
      side_set:"⚙  Settings",promo_title:"Grow it together 🌸",promo_text:"Pair up and cheer each other on. Rituals you both finish grow your shared forest.",promo_btn:"Pair & chat →",
      intention_ph:"What matters most today?",intention_btn:"＋ Set intention",chip_focus:"⏱️ Start a focus block",chip_plate:"🥗 Today's plate",chip_forest:"🌲 Open my forest",hero_hello:"Hello,",
      clock_home:"home base",clock_china:"🇨🇳 China",clock_sweden:"🇸🇪 Sweden",
      ph_rest:"deep rest",ph_dawn:"dawn",ph_morning:"morning focus",ph_afternoon:"afternoon",ph_evening:"evening",ph_wind:"wind-down",
      gr_night:"The world is asleep — so should you be. Rest is the first ritual.",gr_dawn:"Dawn. Meet the light — it sets your whole clock.",gr_morning:"Fresh morning. Best hours of the mind — spend them on what matters.",gr_afternoon:"Steady afternoon. Move a little, eat light, stay bright.",gr_evening:"Evening. Cook, unwind, let the screens dim.",gr_late:"Late. Close the loop and protect tomorrow's you.",
      routine_eyebrow:"The day, gently anchored",routine_h2:"Today's rhythm & rituals",routine_cn:"China profile — anchored to an early, bright morning and a warm, early dinner. Tick each ritual as you go.",routine_se:"Sweden profile — shifted to the Nordic light and later dusk. Friluftsliv woven through the day. Tick each ritual as you go.",
      panel_tasks:"My Tasks",panel_today:"Today",panel_goals:"My Goals",goals_foot:"Daily rituals · tick as you go",streak_title:"day streak",
      comp_eyebrow:"Someone in your corner",comp_h2:"You & your companion",comp_p:"Pair with someone you love and keep each other bright — and talk to a gentle AI companion for encouragement and a kind read on your patterns.",
      tg_title:"Together",tg_notpaired:"Not paired",tg_empty:"Fresh Life is lovelier with two. Create a shared space and send your partner the code — you'll see each other's rituals, streaks, and forest, wherever you both are. Your progress syncs live between you and isn't stored anywhere.",tg_pairbtn:"＋ Pair with your partner",
      comp_your:"Your companion",chat_hint:"Say hello, or tap a prompt below. Your companion already knows how your day is going 🌸",q_encourage:"💗 Encourage me",q_patterns:"🔍 Read my patterns",q_today:"🌱 Plan my day",chat_ph:"Tell your companion anything…",chat_send:"Send",disclaimer:"A caring AI, not a medical professional. In a crisis, please contact local emergency services or a helpline.",
      tm_eyebrow:"15 minutes is enough",tm_h2:"Move, breathe, glow",tm_p:"Pick a ritual and press start. Short and consistent beats long and rare — every one of these fits in a coffee break.",t_start:"Start",t_pause:"Pause",t_resume:"Resume",t_reset:"Reset",t_done:"Done — well done ♥",unit_min:"m",
      mk_eyebrow:"The trader's clock",mk_h2:"Markets, in your two local times",mk_p:"Live open / closed status, with each session translated into China and Sweden wall-clock time so you always know when to sit down — and when to sleep instead.",
      mkt_open:"Open",mkt_pre:"Pre-open",mkt_closed:"Closed",mkt_opens:"opens in {t}",mkt_closes:"closes in {t}",mkt_closed_day:"closed for the day",mkt_weekend:"weekend — markets rest",mkt_localrange:"local",mkt_cn:"🇨🇳 China time",mkt_se:"🇸🇪 Sweden time",
      focus_k:"Focus",focus_body:"Guard your morning for deep research — mind is freshest before the US bell. Run one or two <b>50 / 10 focus blocks</b> (start a timer above), then trade. Because the US session lands late in both your zones, treat a late night as a loan: repay it the next morning with 10 minutes of outdoor light and an earlier wind-down.",
      rb_eyebrow:"When the day goes sideways",rb_h2:"Interruption rebalance",rb_p:"Life happens — a lost night, a late heavy dinner, a midnight trade. Pick what threw you off and get a calm, science-based way back. No guilt, just the next right move.",
      dt_eyebrow:"Eat to lose, eat to glow",dt_h2:"Today's plate — lighter, brighter",dt_p:"A rotating weight-loss menu that blends Chinese and Nordic kitchens: protein and fiber first, lots of color, gentle portions — never bland.",diet_sub:"· lighter, brighter",chip_pf:"Protein + fiber first",chip_kcal:"~1500–1700 kcal",chip_daylight:"Eat within daylight",chip_hydrate:"Hydrate: 2L + green tea",diet_swap:"Swap freely — the goal is a colorful, satisfying plate you'll actually keep.",
      tp_eyebrow:"Science, met by old wisdom",tp_h2:"Why the rhythm works",tp_p:"Each card pairs a well-established finding with a living practice from your two homes.",
      jl_eyebrow:"Crossing seven hours",jl_h2:"Jet-lag reset plan",jl_p:"China and Sweden sit ~6–7 hours apart. Light is your strongest lever — here's how to aim it.",jet_toSweden:"China → Sweden (going west)",jet_toChina:"Sweden → China (going east)",
      foot_1:"Made with ♥ for a fresh, healthy, focused life. Your progress is saved privately in this browser.",foot_2:"General wellness guidance grounded in circadian, nutrition & exercise research — not personalized medical advice.",foot_reset:"Reset today's data",confirm_reset:"Reset today's habit checks and streaks?",
      pm_title:"Pair with your partner 🌸",pm_intro:"Two devices, one rhythm. Create a space and share the code, or enter a code you were given. Your progress passes live between the two of you and isn't stored anywhere.",pm_yourname:"Your name",pm_create:"Create shared space",pm_copy:"Copy code",pm_or:"— or —",pm_partnercode:"Partner's code",pm_join:"Join their space",
      set_title:"Settings ⚙",set_lang:"Language",set_name:"Your name",set_key:"Companion — Claude API key",set_keynote:"Stored only in this browser — never uploaded to us or shared with your partner. Get a key at console.anthropic.com. The companion uses Claude Opus 4.8 by default.",set_model:"Model",set_save:"Save",set_clear:"Clear chat & key",
      pc_justyou:"Just you — invite a partner",pc_paired:"Paired ({code}) · offline",pc_online:"{name} · online",tg_connected:"Connected 🌸",tg_waiting:"Waiting for partner…",tg_waitfor:"Waiting for {name} to open Fresh Life…",tg_synced:"Syncing live between the two of you — kept in your browsers, not stored anywhere.",p_rituals:"rituals",p_streak:"streak",p_forest:"forest",p_online:"online",p_offline:"offline",p_someone:"Someone",p_partner:"Partner",
      ai_ready:"ready",ai_needkey:"add a key in ⚙ Settings",chat_needkey:"I'd love to chat — add your Claude API key in ⚙ Settings first (it stays private in your browser).",err_prefix:"Hmm — ",err_auth:" (check your API key in ⚙ Settings).",err_generic:"Sorry, I couldn't reach the companion just now.",err_network:"Network hiccup — I couldn't reach the companion. Try again in a moment.",err_something:"something went wrong",
      q_send_encourage:"Give me a little encouragement for today.",q_send_patterns:"Look at my rituals, streaks and intention and tell me — kindly — what patterns you notice and what might help.",q_send_today:"Help me plan a calm, focused day around my rituals.",
      name_friend:"friend",name_prompt:"What should I call you?",intention_today:"🌱 Today's intention:",
      pm_status_ready:"Space ready. Share code {code} with your partner.",pm_status_look:"Looking for {code}…",pm_status_join:"Joining {code}…",pm_status_conn:"Connected 🌸",pm_status_copied:"Code copied — send it to your partner.",pm_status_wait:"Partner isn't online yet — I'll keep trying.",pm_status_needcode:"Enter the code your partner shared.",pm_status_nolib:"Realtime library didn't load — check your connection and reload.",pm_status_issue:"Connection issue: {t}",pm_status_relay:"Connecting… this can take a few seconds.",pm_status_failed:"Couldn't connect. Make sure you're both online at the same time, then try again — some networks block direct connections.",
      g_grown:"grown from your rituals",g_back:"← Dashboard",g_trees:"🌲 Trees planted",g_shrubs:"🌿 Shrubs & blooms",g_friends:"🐰 Friends befriended",g_living:"✦ Living things",g_empty_big:"A quiet, waiting meadow 🌱",g_empty_sm:"Complete a ritual or finish a timer on the dashboard — your first tree takes root here.",g_l_trees:"Trees",g_l_shrubs:"Shrubs & ferns",g_l_squirrel:"Squirrel",g_l_bunny:"Bunny",g_l_fox:"Fox",g_l_rare:"(rare)",g_reshuffle:"Reshuffle the meadow",g_note:"Your forest grows one small act at a time. There's no losing it — whatever you plant stays, season after season. <b>Come back and watch it fill in.</b>",g_foot:"Made with ♥ — a living reward for a fresh, focused life. Your forest is saved privately in this browser.",g_title:"Your Forest",g_intro:"Every ritual you finish plants something living here. Trees, mostly — but keep it up and a bunny, a squirrel, sometimes a fox will come to stay.",
      g_greet_empty:"Your meadow is quiet and waiting. Finish a ritual or a focus timer on the dashboard, and the first tree takes root right here.",g_greet1:"A forest of {n} living things, each one a promise you kept.",g_greet2:"Look what your small, steady acts have grown.",g_greet3:"Every tree here is a ritual you finished. Keep going — the critters follow the trees.",g_toast:"🌿 {n} new friends took root in your forest"
    }
  };
  // 中文 and Svenska are attached below (i18n-ui-zh.js merges into UI).
  window.FL_UI=UI;
  window.FL_UI_MERGE=function(lang,obj){UI[lang]=obj;};

  /* ============ Content data (中文 / Svenska); English lives in app.js ============ */
  window.FL_DATA={};
  window.FL_DATA_MERGE=function(lang,obj){window.FL_DATA[lang]=obj;};

  /* ============ Lookup ============ */
  window.TX=function(k){var L=window.FL_LANG;var d=UI[L]||UI.en;return (d&&d[k]!=null)?d[k]:(UI.en[k]!=null?UI.en[k]:k);};
  window.TP=function(k,vars){var s=window.TX(k);if(vars)for(var v in vars)s=s.replace(new RegExp("\\{"+v+"\\}","g"),vars[v]);return s;};

  /* ============ Apply to static DOM ============ */
  window.flApplyStatic=function(root){
    root=root||document;
    root.querySelectorAll("[data-i18n]").forEach(function(el){var v=window.TX(el.getAttribute("data-i18n"));if(v!=null)el.textContent=v;});
    root.querySelectorAll("[data-i18n-ph]").forEach(function(el){var v=window.TX(el.getAttribute("data-i18n-ph"));if(v!=null)el.setAttribute("placeholder",v);});
    root.querySelectorAll("[data-i18n-html]").forEach(function(el){var v=window.TX(el.getAttribute("data-i18n-html"));if(v!=null)el.innerHTML=v;});
    document.documentElement.setAttribute("lang",window.FL_LANG==="zh"?"zh-Hans":window.FL_LANG);
  };

  /* ============ Switch language ============ */
  window.flSetLang=function(l){
    window.FL_LANG=l;
    try{var s=JSON.parse(localStorage.getItem("freshlife.v1"))||{};s.lang=l;localStorage.setItem("freshlife.v1",JSON.stringify(s));}catch(e){}
    window.flApplyStatic();
    if(window.__flRerender)window.__flRerender();
    if(window.__flRerenderCompanion)window.__flRerenderCompanion();
    if(window.__flRerenderGarden)window.__flRerenderGarden();
    ["langSel","langSel2"].forEach(function(id){var s=document.getElementById(id);if(s)s.value=l;});
  };

  function boot(){
    ["langSel","langSel2"].forEach(function(id){
      var s=document.getElementById(id);
      if(s){s.value=window.FL_LANG;s.addEventListener("change",function(){window.flSetLang(s.value);});}
    });
    window.flApplyStatic();
  }
  // These scripts sit at the end of <body>, so every element already exists.
  // Run now (before app/shell/companion boot) so their dynamic text isn't clobbered.
  boot();
})();
