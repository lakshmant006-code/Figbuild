#!/usr/bin/env python3
"""Extracts the 3D city map engine from copy-that.html into app/public/map.html,
restyled (blue/white/black, system font) and driven by postMessage from the app.
Run from the repo root: python3 app/scripts/make-map.py"""
import re
L = open('copy-that.html').read().split('\n')
end = max(i for i, l in enumerate(L) if l.strip() == '})();')
js = '\n'.join([L[302], L[303], L[304]] + L[428:end + 1])

def sub(old, new, count=1):
    global js
    assert js.count(old) >= 1, 'missing: ' + old[:60]
    if count == 1:
        assert js.count(old) == 1, 'ambiguous (%d): %s' % (js.count(old), old[:60])
    js = js.replace(old, new)

SYS = "-apple-system, BlinkMacSystemFont, Inter, Helvetica, Arial, sans-serif"
# palette: pale blue -> blue -> black (density), neutral buildings, quiet water and land
sub("var range=[[255,236,170],[255,214,107],[255,170,70],[255,122,26],[214,80,20]];",
    "var range=[[214,229,255],[140,180,255],[8,102,255],[14,38,130],[4,8,28]];")
sub("var PAL=[[181,86,68],[205,128,88],[218,182,128],[232,208,166],[118,134,150],[160,178,194],[150,64,58],[236,222,190]];",
    "var PAL=[[228,231,238],[216,221,231],[240,242,246],[203,210,224],[190,199,216],[233,236,242],[210,216,228],[246,247,250]];")
sub("getFillColor:[128,190,230]", "getFillColor:[196,214,240]")
sub("getFillColor:[178,176,170]", "getFillColor:[236,238,242]")
sub("getColor:[236,240,242],getWidth:2", "getColor:[255,255,255],getWidth:2")
sub("getColor:[196,192,184,255],getWidth:5", "getColor:[214,218,226,255],getWidth:5")
sub("getColor:[160,156,150,255],getWidth:.5", "getColor:[190,196,208,255],getWidth:.5")
js = js.replace("Bricolage Grotesque, Helvetica, Arial, sans-serif", SYS)
sub("outlineColor:[255,214,107,240]", "outlineColor:[255,255,255,240]")
sub("getLineColor:[255,122,26],lineWidthMinPixels:4", "getLineColor:[8,102,255],lineWidthMinPixels:3")
sub("font:'12px IBM Plex Mono, monospace',background:'#171b23'", "font:'12px -apple-system, Inter, sans-serif',background:'#0a0f1f'")
sub("var o=info&&info.object; if(!o)return;",
    "var o=info&&info.object; if(!o)return;try{parent.postMessage({type:'hex',count:o.count},'*')}catch(e){}")

# live complaints: pulsing rings that also feed the density hexagons
sub("    ls.push(new deck.ScatterplotLayer({id:'ring'",
    """    if(live.length){
      var T=liveTick;
      ls.push(new deck.ScatterplotLayer({id:'live-pulse',data:live,getPosition:function(d){return d.p},radiusUnits:'meters',stroked:true,filled:true,
        getRadius:function(d){return 30+300*Math.min(1,(performance.now()-d.t0)/4200)},
        getFillColor:function(d){return [255,255,255,Math.max(0,110*(1-(performance.now()-d.t0)/4200))]},
        getLineColor:function(d){return [8,102,255,Math.max(0,255*(1-(performance.now()-d.t0)/4200))]},lineWidthMinPixels:3,
        updateTriggers:{getRadius:T,getFillColor:T,getLineColor:T},parameters:{depthTest:false}}));
      ls.push(new deck.ScatterplotLayer({id:'live-core',data:live,getPosition:function(d){return d.p},getRadius:16,radiusUnits:'meters',radiusMinPixels:5,stroked:true,filled:true,
        getFillColor:[8,102,255,255],getLineColor:[255,255,255,255],lineWidthMinPixels:2,parameters:{depthTest:false}}));
    }
    ls.push(new deck.ScatterplotLayer({id:'ring'""")
sub("  var is3d=true, deckInst=null, picked=null;",
    """  var is3d=true, deckInst=null, picked=null, live=[], liveTick=0, liveRaf=0;
  function addLive(p){
    live.push({p:p,t0:performance.now()}); if(live.length>40)live.shift();
    pts=pts.concat([{p:p,w:1}]);
    if(!liveRaf)(function tick(){var now=performance.now();live=live.filter(function(l){return now-l.t0<4200});liveTick++;draw();liveRaf=live.length?requestAnimationFrame(tick):0})();
  }""")
# message API for the host app
sub("    loadSkyline();loadArea(cur);",
    """    loadSkyline();loadArea(cur);
    var qa=new URLSearchParams(location.search).get('area');
    if(qa){var a0=AREAS.filter(function(x){return x.id===qa})[0];if(a0)setTimeout(function(){selectArea(a0)},300)}
    addEventListener('message',function(e){
      var m=e.data;if(!m||!m.cmd)return;
      if(m.cmd==='area'){var a=AREAS.filter(function(x){return x.id===m.id})[0];if(a)selectArea(a)}
      else if(m.cmd==='city')$('#city').click();
      else if(m.cmd==='sky')$('#skyview').click();
      else if(m.cmd==='street')$('#street').click();
      else if(m.cmd==='tilt')$('#tilt').click();
      else if(m.cmd==='complaint'){
        var c=m.p||[cur.c[0]+(Math.random()-.5)*.006,cur.c[1]+(Math.random()-.5)*.004];
        addLive(c);
      }
    });
    try{parent.postMessage({type:'ready',areas:AREAS.map(function(a){return {id:a.id,name:a.name,c:a.c}})},'*')}catch(e){}""")

html = """<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>HUSH city map</title>
<style>
html,body{margin:0;height:100%;background:#d4e2f6;overflow:hidden;font:13px -apple-system,BlinkMacSystemFont,Inter,Helvetica,Arial,sans-serif}
#deckwrap{position:fixed;inset:0;background:linear-gradient(180deg,#b9d0f0 0%,#d9e6f8 40%,#eef3fb 100%)}
#deckmap{position:absolute;inset:0}
#mapstatus{position:absolute;left:12px;top:12px;z-index:2;background:#fff;color:#0a0f1f;border-radius:99px;padding:7px 12px;font-weight:600;box-shadow:0 1px 6px rgba(0,0,0,.15)}
.deckfail{position:absolute;inset:0;display:grid;place-items:center;color:#5b6475;padding:20px;text-align:center}
#ui{display:none}
</style></head><body>
<div id="deckwrap"><div id="deckmap" role="img" aria-label="3D map of noise complaints built on the NYC 3D Building Model"></div><div id="mapstatus" role="status" hidden></div></div>
<div id="ui"><button id="tilt" aria-pressed="true">3D</button><button id="city"></button><button id="skyview"></button><button id="street"></button><button id="reset"></button><div id="areas"></div><div id="sBlock"></div><div id="sBlockP"></div></div>
<script src="https://cdn.jsdelivr.net/npm/deck.gl@8.9.35/dist.min.js"></script>
<script>
""" + js + """
</script>
</body></html>
"""
open('app/public/map.html', 'w').write(html)
print('wrote app/public/map.html', len(html) // 1024, 'KB')
