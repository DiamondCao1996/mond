/*!
 * Fresh Life — vanta.js · a soft, breezy sakura haze behind the UI
 * Uses Vanta FOG (three.js) tinted in the sakura palette. Theme-aware and
 * disabled when the visitor prefers reduced motion. Fails silently to the
 * plain CSS background if WebGL / the CDN scripts are unavailable.
 */
(function(){
  if(!window.VANTA||!window.VANTA.FOG||!window.THREE)return;
  if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  var el=document.getElementById("vanta-bg");if(!el)return;

  var effect=null;
  function isDark(){var t=document.documentElement.getAttribute("data-theme");return t?t==="dark":(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches);}
  function palette(){
    return isDark()
      ? {highlightColor:0xd97ba6, midtoneColor:0x8f4a72, lowlightColor:0x4a3a68, baseColor:0x161016, blurFactor:0.66, speed:0.8,  zoom:0.8}
      : {highlightColor:0xffd9e6, midtoneColor:0xf7a9c0, lowlightColor:0xc3a9e8, baseColor:0xfff5f8, blurFactor:0.60, speed:0.85, zoom:0.85};
  }
  function build(){
    try{if(effect)effect.destroy();}catch(e){}
    var o=palette();
    o.el=el; o.THREE=window.THREE;
    o.mouseControls=true; o.touchControls=false; o.gyroControls=false;
    o.minHeight=200.0; o.minWidth=200.0;
    try{effect=window.VANTA.FOG(o);}catch(e){effect=null;}
  }
  build();

  // Re-tint the haze when the theme changes.
  var btn=document.getElementById("themeBtn");
  if(btn)btn.addEventListener("click",function(){setTimeout(build,60);});
  if(window.matchMedia){
    var mq=window.matchMedia("(prefers-color-scheme: dark)");
    if(mq.addEventListener)mq.addEventListener("change",build);
    else if(mq.addListener)mq.addListener(build);
  }
})();
