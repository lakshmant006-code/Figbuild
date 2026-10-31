# Calm score + a soft lo-fi beat for the Remotion launch film, with quiet tick/tap SFX on every card, chip, word and icon.
# Same harmony as music_calm.py (8 bars resolving on the end card). python3 music_beats.py -> build/score_beats.wav
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
# ---- soft lo-fi beat (~69 bpm, swung 16ths): hats from bar 1, full kit bars 2-7, drops out a beat before the end card
Q=BAR/4; S=Q/4; SW=0.035
def kick(amp=.5):
    n=int(SR*.45); tt=np.arange(n)/SR; f=48*(1+1.6*np.exp(-tt*28))
    o=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*7.5)+0.15*band(rng.standard_normal(n),80,900)*np.exp(-tt*120)
    return amp*np.tanh(1.4*o)
def snare(amp=.22):                                          # brushed lo-fi snare / rim
    n=int(SR*.32); tt=np.arange(n)/SR
    o=band(rng.standard_normal(n),900,5200)*np.exp(-tt*16)*.7+np.sin(2*np.pi*190*tt)*np.exp(-tt*30)*.5
    return amp*lp(o,4200)
def hat(amp=.05,open_=False):
    n=int(SR*(.22 if open_ else .06)); tt=np.arange(n)/SR
    o=band(rng.standard_normal(n),6000,14000)*np.exp(-tt*(14 if open_ else 70)); return amp*o/(np.max(np.abs(o))+1e-9)
def sub(f,dur,amp=.13):
    n=int(SR*dur); tt=np.arange(n)/SR; return amp*np.sin(2*np.pi*f*tt)*sm(tt/.03)*np.exp(-tt*.9)*sm((dur-tt)/.08)
drum_bus_L=np.zeros(N); drum_bus_R=np.zeros(N)
def dadd(sig,at,pan=0.0,gain=1.0):
    i=int(at*SR); n=min(len(sig),N-i)
    if n<=0 or i<0: return
    drum_bus_L[i:i+n]+=sig[:n]*gain*np.cos((pan+1)*np.pi/4); drum_bus_R[i:i+n]+=sig[:n]*gain*np.sin((pan+1)*np.pi/4)
for b in range(1,8):
    t0=b*BAR; full=b>=2; last=b==7
    for s in range(16):
        at=t0+s*S+(SW if s%2 else 0)+rng.normal(0,.004)
        if last and s>=12: break                                     # leave the last beat empty before the resolution
        dadd(hat(.045*(1.0 if s%4==0 else .6 if s%2==0 else .42)*(.7 if not full else 1)),at,.35,1.0)
        if s==14 and b%2==1: dadd(hat(.04,True),at,.35,1.0)
    if full:
        for s,g in ((0,1),(7,.45),(8,.85),(10,.5)):
            if last and s>=12: continue
            dadd(kick(.5*g),t0+s*S+(SW if s%2 else 0),0,1.0)
        for s in (4,12):
            if last and s==12: continue
            dadd(snare(),t0+s*S,-.08,1.0)
        if b%2==0: dadd(snare(.06),t0+15*S+SW,-.08,1.0)              # ghost note
        root=prog[b][1][0]
        add(sub(M(root-12),BAR*.5-.05),t0,0,1.0); add(sub(M(root-12),BAR*.25),t0+BAR*.5+S*2+SW,0,.8)
# resolution: Fmaj9 with a soft bell, ringing out under the end card
t0=END_CARD
add(pad([M(n) for n in (53,60,64,67,69)],DUR-t0,amp=.085,bright=1100),t0,0,1.0)
add(strings([M(n) for n in (41,53,60)],DUR-t0,amp=.07),t0,0,1.0)
for k,n in enumerate([41,53,60,64,67,72]): add(piano(M(n),DUR-t0,.34),t0+k*0.06,-.3+.12*k,1.0)
add(piano(M(76),4.0,.42),t0+0.55,.25,1.0); add(piano(M(79),4.0,.36),t0+1.2,.25,1.0)
# ---- SFX: soft air into each cut, three chimes, and quiet tick/tap on every UI moment
for f in [68,198,292,390,470,592,668,752,836]: add(air(1.0,.025),f/FPS-.55,0,1.0)
add(bell(M(84),4.5,.09),5/FPS,0,1.0); add(bell(M(81),4.5,.08),(198+46)/FPS,0,1.0); add(bell(M(88),5.0,.1),(836+8)/FPS,.15,1.0)
def tick(amp=.06,f=3400,body=1.0):                           # a short glassy click: filtered noise snap + tiny pitched body
    n=int(SR*.06); tt=np.arange(n)/SR
    o=band(rng.standard_normal(n),f*.6,f*1.8)*np.exp(-tt*260); o/=np.max(np.abs(o))+1e-9
    o+=.55*body*np.sin(2*np.pi*f*.5*tt)*np.exp(-tt*120)+.35*body*np.sin(2*np.pi*230*tt)*np.exp(-tt*60)
    return amp*o*np.minimum(1,tt/.0008)
def tap(at,amp=.06,f=2600,pan=0): add(tick(amp,f),at,pan,1.0)
def card(at,amp=.07,pan=0):                                  # a card lands: tiny swish then a soft tap
    add(air(.28,amp*.35),at-.2,pan,1.0); add(tick(amp,2100,1.4),at,pan,1.0)
F=lambda fr:fr/FPS
for i in range(6): tap(F(14+i*3+4),.03,4200+250*i,-.5+.2*i)                   # orbit dots around the mark
card(F(68+10),.06)                                                              # composer card arrives
for k in range(26):                                                             # typing, very soft keys
    if "Loud music upstairs, again"[k]!=" ": tap(F(68+78+k*1.7)+rng.normal(0,.004),.022+.008*rng.random(),3000+600*rng.random(),.1)
tap(F(68+78+26*1.7+6),.06,2400)                                                 # send
for i in range(5): tap(F(198+2+i*3+4),.035,3600-120*i,-.3+.15*i)               # "noise" letters
card(F(198+40+4),.06)                                                           # wordmark
card(F(292+34+4),.07,.1)                                                        # "Is the city listening?" card
for i in range(6): tap(F(390+i*3+4),.035,3500-100*i,-.3+.12*i)                 # "Report"
for i in range(4): tap(F(390+40+i*5+3),.045,2900,-.2+.13*i)                    # Turn noise into answers
card(F(470+12),.07)                                                             # phone settles
for i in range(4): tap(F(592+2+i*5+3),.045,2900,-.2+.13*i)                     # From Noise to Answer
for i in range(4): tap(F(592+26+i*5+4),.055,2300+180*i,-.3+.2*i)               # tab icons
card(F(668+10),.065)                                                            # tablet
for i in range(5): tap(F(752+2+i*3+4),.035,3500-100*i,-.3+.15*i)               # "Heard"
for i in range(5): tap(F(752+42+i*4+4),.04,3600-100*i,-.3+.15*i)               # "Ready"
card(F(836+4+4),.07); tap(F(836+30+4),.04,2600); tap(F(836+46+3),.04,3000); tap(F(836+62+3),.035,3200)
# reverb + master (drums stay mostly dry)
imp=rng.standard_normal(int(SR*2.6))*np.exp(-np.arange(int(SR*2.6))/SR*1.9); imp[0]=0
def verb(x):
    nf=1<<int(np.ceil(np.log2(len(x)+len(imp)))); y=np.fft.irfft(np.fft.rfft(x,nf)*np.fft.rfft(imp,nf),nf)[:len(x)]; return y/(np.max(np.abs(y))+1e-9)*np.max(np.abs(x))
oL=L*.78+.32*verb(L)+drum_bus_L*.85+.08*verb(drum_bus_L); oR=R*.78+.32*verb(R)+drum_bus_R*.85+.08*verb(drum_bus_R)
fade=sm(t/0.6)*sm((DUR-t)/1.6); out=np.stack([oL*fade,oR*fade],1); out=out/np.max(np.abs(out))*0.9
with wave.open('build/score_beats.wav','wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out*32767).astype(np.int16).tobytes())
print('ok',round(DUR,2),'bar',round(BAR,3))
