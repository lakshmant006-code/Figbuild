# Calm, emotional score for the Remotion launch film: felt piano + warm pads + low strings, 8 bars resolving on the end card,
# with SFX cut down to soft transition air and three quiet chimes. python3 music_calm.py -> build/score_calm.wav
import numpy as np, wave
SR=48000; FPS=30; END=970/FPS; DUR=END+2.0; N=int(SR*DUR); t=np.arange(N)/SR
rng=np.random.default_rng(3)
def sm(x): x=np.clip(x,0,1); return x*x*(3-2*x)
L=np.zeros(N); R=np.zeros(N)
def add(sig,at,pan=0.0,gain=1.0):
    i=int(at*SR); n=min(len(sig),N-i)
    if n<=0 or i<0: return
    L[i:i+n]+=sig[:n]*gain*np.cos((pan+1)*np.pi/4); R[i:i+n]+=sig[:n]*gain*np.sin((pan+1)*np.pi/4)
M=lambda n:440*2**((n-69)/12)
def lp(x,fc):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); return np.fft.irfft(X/np.sqrt(1+(f/fc)**4),len(x))
def piano(f,dur=4.0,vel=.5):
    n=int(SR*dur); tt=np.arange(n)/SR; o=np.zeros(n); B=0.00012
    for k in range(1,9):
        fk=f*k*np.sqrt(1+B*k*k); a=vel/(k**1.35)*(1 if k<5 else .6)
        o+=a*np.sin(2*np.pi*fk*tt+rng.random())*np.exp(-tt*(0.9+0.55*k))
    o+=0.02*vel*rng.standard_normal(n)*np.exp(-tt*90)       # felt hammer
    o=lp(o,2600+1600*vel)
    return o*np.minimum(1,tt/0.004)*np.minimum(1,(dur-tt)/0.3)
def pad(freqs,dur,amp=.05,bright=900):
    n=int(SR*dur); tt=np.arange(n)/SR; o=np.zeros(n)
    for f in freqs:
        for d in (-0.006,0,0.006):
            ph=2*np.pi*f*(1+d)*tt+rng.random()*6.28
            o+=np.sin(ph)+0.35*np.sin(2*ph)+0.18*np.sin(3*ph)
    o=lp(o,bright); env=sm(tt/1.6)*sm((dur-tt)/1.4); return amp*o*env/len(freqs)
def strings(freqs,dur,amp=.05):
    n=int(SR*dur); tt=np.arange(n)/SR; o=np.zeros(n)
    for f in freqs:
        vib=1+0.004*np.sin(2*np.pi*5.2*tt)
        ph=2*np.pi*np.cumsum(f*vib)/SR
        for h,a in ((1,1),(2,.5),(3,.33),(4,.25),(5,.2)): o+=a*np.sin(h*ph)
    o=lp(o,1400); env=sm(tt/2.2)*sm((dur-tt)/1.6); return amp*o*env/len(freqs)
def bell(f,dur=5.0,amp=.2):
    n=int(SR*dur); tt=np.arange(n)/SR; o=np.zeros(n)
    for m,a,dk in [(1,1,.8),(2.0,.4,1.3),(2.76,.25,1.8),(4.07,.12,2.6)]: o+=a*np.sin(2*np.pi*f*m*tt)*np.exp(-tt*dk)
    return amp*o*np.minimum(1,tt/0.01)
def band(x,lo,hi):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); X[(f<lo)|(f>hi)]=0; return np.fft.irfft(X,len(x))
def air(dur=1.2,amp=.05):
    n=int(SR*dur); tt=np.linspace(0,1,n); o=band(rng.standard_normal(n),300,4000); o/=np.max(np.abs(o))+1e-9; return amp*o*np.sin(np.pi*tt)**2
# ---- harmony: 8 bars, the 9th (resolution) lands exactly on the end card (frame 836)
END_CARD=836/FPS; BAR=END_CARD/8
prog=[("F",[53,57,60,64],[65,69,72,76]),("Am7",[45,57,60,64],[64,67,69,72]),("Dm9",[50,57,60,64],[62,65,69,72]),("Bbmaj9",[46,57,60,62],[62,65,69,74]),
      ("F/A",[45,53,60,64],[65,69,72,77]),("Gm9",[43,58,62,65],[62,65,70,74]),("Bbmaj7",[46,57,62,65],[65,69,70,74]),("Csus",[48,55,60,65],[67,72,74,77])]
melody=[[72,None,76,74],[72,None,69,None],[69,72,74,None],[74,None,72,69],[72,None,77,76],[74,None,70,72],[74,76,77,None],[79,None,77,76]]
for b,(name,low,up) in enumerate(prog):
    t0=b*BAR
    add(pad([M(n) for n in low[1:]],BAR+1.6,amp=.07 if b>0 else .05,bright=700+60*b),t0,0,1.0)
    add(piano(M(low[0]),BAR+1.2,.42),t0,-.2,1.0); add(piano(M(low[0]-12),BAR+1.2,.25),t0,-.3,1.0)
    for k,n in enumerate(low[1:]): add(piano(M(n),BAR,.22),t0+0.03+k*0.05,-.1+.1*k,1.0)   # gentle rolled chord
    for k,n in enumerate(melody[b]):
        if n: add(piano(M(n),2.8,.36 if b<6 else .42),t0+k*BAR/4+0.02,.25,1.0)
    if b>=2: add(strings([M(n) for n in (low[0],low[0]+12)],BAR+1.4,amp=.045+0.012*(b-2)),t0,-.15,1.0)
    if b>=4: add(strings([M(n) for n in up[1:3]],BAR+1.4,amp=.03+0.01*(b-4)),t0,.2,1.0)
# heartbeat-soft pulse from bar 2 to 7
for b in range(2,8):
    for q in range(4):
        n=int(SR*.35); tt=np.arange(n)/SR; k=np.sin(2*np.pi*55*(1+.9*np.exp(-tt*30))*tt)*np.exp(-tt*10)*0.18*(0.6+0.1*b/2)
        add(k,b*BAR+q*BAR/4,0,1.0 if q%2==0 else .55)
# resolution: Fmaj9 with a soft bell, ringing out under the end card
t0=END_CARD
add(pad([M(n) for n in (53,60,64,67,69)],DUR-t0,amp=.085,bright=1100),t0,0,1.0)
add(strings([M(n) for n in (41,53,60)],DUR-t0,amp=.07),t0,0,1.0)
for k,n in enumerate([41,53,60,64,67,72]): add(piano(M(n),DUR-t0,.34),t0+k*0.06,-.3+.12*k,1.0)
add(piano(M(76),4.0,.42),t0+0.55,.25,1.0); add(piano(M(79),4.0,.36),t0+1.2,.25,1.0)
# ---- SFX, deliberately quiet: soft air into each cut and three chimes
for f in [68,198,292,390,470,592,668,752,836]: add(air(1.1,.035),f/FPS-.6,0,1.0)
add(bell(M(84),4.5,.11),5/FPS,0,1.0); add(bell(M(81),4.5,.1),(198+46)/FPS,0,1.0); add(bell(M(88),5.0,.12),(836+8)/FPS,.15,1.0)
# reverb + master
imp=rng.standard_normal(int(SR*2.6))*np.exp(-np.arange(int(SR*2.6))/SR*1.9); imp[0]=0
def verb(x):
    nf=1<<int(np.ceil(np.log2(len(x)+len(imp)))); y=np.fft.irfft(np.fft.rfft(x,nf)*np.fft.rfft(imp,nf),nf)[:len(x)]; return y/(np.max(np.abs(y))+1e-9)*np.max(np.abs(x))
oL=L*.78+.32*verb(L); oR=R*.78+.32*verb(R)
fade=sm(t/0.6)*sm((DUR-t)/1.6); out=np.stack([oL*fade,oR*fade],1); out=out/np.max(np.abs(out))*0.9
with wave.open('build/score_calm.wav','wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out*32767).astype(np.int16).tobytes())
print('ok',round(DUR,2),'bar',round(BAR,3))
