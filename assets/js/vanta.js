/*!
 * Fresh Life — vanta.js · a glowing sakura HALO behind the UI
 * Uses Vanta HALO (three.js) tinted in the sakura palette — a rose halo over
 * a plum field at night, a soft rose glow by day. Theme-aware, disabled when
 * the visitor prefers reduced motion, and it fails silently to the plain CSS
 * background if WebGL / the CDN scripts are unavailable.
 */
(function(){
  if(!window.VANTA||!window.VANTA.HALO||!window.THREE)return;
  if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  var el=document.getElementById("vanta-bg");if(!el)return;

  var effect=null;
  function isDark(){var t=document.documentElement.getAttribute("data-theme");return t?t==="dark":(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches);}
  function palette(){
    return isDark()
      ? {backgroundColor:0x1a1015, baseColor:0xe0679a, amplitudeFactor:1.1, size:1.5, xOffset:0.10, yOffset:0.00}
      : {backgroundColor:0xf6c6d8, baseColor:0xc24e82, amplitudeFactor:1.0, size:1.5, xOffset:0.10, yOffset:0.00};
  }
  function build(){
    try{if(effect)effect.destroy();}catch(e){}
    var o=palette();
    o.el=el; o.THREE=window.THREE;
    o.mouseControls=true; o.touchControls=false; o.gyroControls=false;
    o.minHeight=200.0; o.minWidth=200.0;
    try{effect=window.VANTA.HALO(o);}catch(e){effect=null;}
  }
  build();

  // Re-tint the halo when the theme changes.
  var btn=document.getElementById("themeBtn");
  if(btn)btn.addEventListener("click",function(){setTimeout(build,60);});
  if(window.matchMedia){
    var mq=window.matchMedia("(prefers-color-scheme: dark)");
    if(mq.addEventListener)mq.addEventListener("change",build);
    else if(mq.addListener)mq.addListener(build);
  }
})();
