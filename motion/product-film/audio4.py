# Music bed (supplied track) + synthesised SFX, beat-locked. python3 audio3.py -> build/score2.wav
import numpy as np, subprocess, wave
from timeline import T,C,END,P,U
SR=48000; DUR=END+1.6; N=int(SR*DUR); t=np.arange(N)/SR
rng=np.random.default_rng(11)
def sm(x): x=np.clip(x,0,1); return x*x*(3-2*x)
# ---------- music
raw=subprocess.run(['ffmpeg','-v','error','-i','build/music.mp3','-t',str(DUR+0.5),'-ac','2','-ar',str(SR),'-f','f32le','-'],capture_output=True).stdout
m=np.frombuffer(raw,dtype=np.float32).reshape(-1,2)[:N].astype(np.float64)
if len(m)<N: m=np.vstack([m,np.zeros((N-len(m),2))])
rms=np.sqrt(np.mean(m[int(12*SR):int(40*SR)]**2)); m*=0.085/rms     # sit the music at about -21 dBFS rms
def lp(x,fc):
    X=np.fft.rfft(x,axis=0); f=np.fft.rfftfreq(len(x),1/SR)[:,None]; return np.fft.irfft(X/np.sqrt(1+(f/fc)**6),len(x),axis=0)
seg=int(9*SR); mm=lp(m[:seg],650); w=sm((t[:seg]-(T[0]-0.35))/1.1)[:,None]   # muffled "through the wall" until the logo opens it up
m[:seg]=mm*(1-w)+m[:seg]*w
# the party stops dead for "And then, nothing." then swells back with the logo
g=np.ones(N)
g*=1-0.78*sm((t-4.6)/0.25)*(1-sm((t-(T[0]-0.45))/0.9))
g*=sm(t/1.6)*0.9+0.1*sm(t/0.1)
g*=1-sm((t-(END-1.0))/3.0)*1.0
m*=g[:,None]
# ---------- SFX
L=np.zeros(N); R=np.zeros(N)
def add(sig,at,pan=0.0,gain=1.0):
    i=int(at*SR); n=min(len(sig),N-i)
    if n<=0 or i<0: return
    L[i:i+n]+=sig[:n]*gain*np.cos((pan+1)*np.pi/4); R[i:i+n]+=sig[:n]*gain*np.sin((pan+1)*np.pi/4)
def bell(f,dur=4.0,amp=0.5):
    n=int(SR*dur); tt=np.arange(n)/SR; o=np.zeros(n)
    for k,(mm_,a,dk) in enumerate([(1,1,.9),(2.0,.45,1.5),(2.76,.3,1.9),(4.07,.16,2.6),(5.4,.1,3.2)]): o+=a*np.sin(2*np.pi*f*mm_*tt+.3*k)*np.exp(-tt*dk*1.1)
    return o*np.minimum(1,tt/0.008)*amp
def pop(f,amp=.2,dur=.22):
    n=int(SR*dur); tt=np.arange(n)/SR; return amp*np.sin(2*np.pi*f*(1+.5*np.exp(-tt*40))*tt)*np.exp(-tt*22)*np.minimum(1,tt/0.003)
def band(x,lo,hi):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); X[(f<lo)|(f>hi)]=0; return np.fft.irfft(X,len(x))
def whoosh(dur=1.1,amp=.22):
    n=int(SR*dur); tt=np.linspace(0,1,n); nz=rng.standard_normal(n); out=np.zeros(n)
    for lo,hi,c in [(160,700,.32),(700,2400,.5),(2400,7000,.68)]: out+=band(nz,lo,hi)*np.exp(-((tt-c)/.2)**2)
    out/= (np.max(np.abs(out))+1e-9); return out*amp*np.sin(np.pi*tt)**1.5
def riser(dur=1.0,amp=.16):
    n=int(SR*dur); tt=np.arange(n)/SR; k=tt/dur; f=70*(2**(1.8*k)); ph=2*np.pi*np.cumsum(f)/SR
    return amp*(np.sin(ph)*.7+band(rng.standard_normal(n),400,3000)*.12*k)*sm(k*1.2)*(1-sm((k-.92)/.08))
def thump(f=58,dur=.5,amp=.5):
    n=int(SR*dur); tt=np.arange(n)/SR; fr=f*(1+1.8*np.exp(-tt*25)); return amp*np.sin(2*np.pi*np.cumsum(fr)/SR)*np.exp(-tt*7)
Mn=lambda n:440*2**((n-69)/12)
# ---------- UI sound kit: crisp clicks, card slides, banner knocks (no droplet pops)
def click(amp=.3,f=3200,dur=.07):
    n=int(SR*dur); tt=np.arange(n)/SR
    nz=band(rng.standard_normal(n),f*.6,f*1.7)*np.exp(-tt*330); nz/=np.max(np.abs(nz))+1e-9
    body=np.sin(2*np.pi*190*tt)*np.exp(-tt*95)*.55
    return amp*(nz*.85+body)*np.minimum(1,tt/0.0006)
def key(amp=.1):
    return click(amp*rng.uniform(.7,1.2),rng.uniform(1800,3600),.05)
def thud(f=92,dur=.22,amp=.3):
    n=int(SR*dur); tt=np.arange(n)/SR; return amp*np.sin(2*np.pi*f*(1+.6*np.exp(-tt*50))*tt)*np.exp(-tt*26)*np.minimum(1,tt/0.002)
def swish(dur=.45,amp=.2,bright=1.0):
    n=int(SR*dur); tt=np.linspace(0,1,n); nz=rng.standard_normal(n)
    hi=band(nz,1800,7500)*np.exp(-tt*5.5); lo=band(nz,260,1500)*np.exp(-((tt-.35)/.28)**2)
    o=(hi*bright+lo*1.2); o/=np.max(np.abs(o))+1e-9
    return amp*o*np.minimum(1,tt/.06)*(1-sm((tt-.78)/.22))
def mallet(f,dur=.35,amp=.25):
    n=int(SR*dur); tt=np.arange(n)/SR
    return amp*(np.sin(2*np.pi*f*tt)*np.exp(-tt*13)+.35*np.sin(2*np.pi*f*3.99*tt)*np.exp(-tt*45))*np.minimum(1,tt/0.002)
def card(at,pan=0,amp=1.0,d=.38):                         # a card / chip slides in and lands
    add(swish(d,.16*amp),at,pan,1.0); add(click(.2*amp,2600),at+d*.62,pan,1.0); add(thud(110,.16,.12*amp),at+d*.62,pan,1.0)
def banner(at,pan=0,amp=1.0):                              # notification banner drops in: swipe, then a two-note knock
    add(swish(.3,.18*amp,1.4),at,pan,1.0); add(mallet(Mn(83),.4,.22*amp),at+.17,pan,1.0); add(mallet(Mn(88),.45,.2*amp),at+.27,pan,1.0)
def phone_in(at,pan=0,amp=1.0,d=.9):                       # a phone glides in and settles
    add(swish(d,.2*amp,.7),at,pan,1.0); add(thud(80,.3,.2*amp),at+d*.86,pan,1.0); add(click(.14*amp,1500),at+d*.86,pan,1.0)
def tap(at,pan=0,amp=1.0): add(click(.26*amp,2300),at,pan,1.0)
Mn=lambda n:440*2**((n-69)/12)
# transitions: a soft whoosh into every cut
for i,tc in enumerate(T): add(whoosh(1.15,.2),tc-0.62,-0.3 if i%2==0 else 0.3,1.0)
# S1 hook: tension riser into the logo
add(riser(1.2,.2),T[0]-1.25,0,1.0)
for tt in (3.6,): banner(C[0]+tt+0.25,-.2,.6)                    # the "Status: Received" chip drops in
# S2 logo
add(bell(Mn(81),5.0,.55),C[1]+0.72,0,1.0); add(bell(Mn(88),4.5,.2),C[1]+0.76,.3,1.0); add(thud(60,.5,.35),C[1]+0.78,0,1.0)
for k in range(5): add(click(.22,2400+k*260),C[1]+1.68+k*.1,-.3+.15*k,1.0)   # wordmark letters spring in
add(swish(.5,.14),C[1]+2.4,.2,1.0)                               # tagline
# S3 onboarding
phone_in(C[2]+.2,.2,1.0)
for k,tt in enumerate([1.2,2.8,4.4,6.0]): card(C[2]+tt+.1,-.25+.1*k)
for tt in (1.5,3.2,4.8,6.6): tap(C[2]+tt,.2)
# S4 report
phone_in(C[3]+.2,.2,1.0)
for tt in (1.3,2.8,4.1,5.4): tap(C[3]+tt,.2)
card(C[3]+3.1+.2,.3); card(C[3]+6.9+.2,.3)
n=58
for k in range(n): add(key(.1),C[3]+5.9+k*(2.6/n)+rng.uniform(-.01,.012),-.1,1.0)   # transcript typing
add(click(.3,1900),C[3]+6.3-0.0+2.5,.1,1.0)
# S5 sent: bars gather -> orb -> check, then the phone slides in
add(riser(1.0,.2),C[4]+0.5,0,1.0); add(thud(55,.7,.45),C[4]+1.5,0,1.0); add(bell(Mn(84),4.0,.5),C[4]+1.5,0,1.0); add(bell(Mn(91),3.6,.18),C[4]+1.56,.25,1.0)
add(click(.3,3000),C[4]+1.78,.2,1.0)
phone_in(C[4]+2.15,-.2,.9,.8)
card(C[4]+3.2+.1,.3); 
# S6 track: phone, chips and the two status banners
phone_in(C[5]+.2,.2,1.0)
for k,tt in enumerate([1.7,4.5,7.3]): card(C[5]+tt+.1,-.3+.1*k)
for tt in (1.8,3.6,5.2,6.4): tap(C[5]+tt,.2,.8)
for tt in (2.0,5.4): banner(C[5]+tt,.25,.9)
# S7 we listened
phone_in(C[6]+.2,-.2,1.0)
add(thud(56,.55,.4),C[6]+0.9,0,1.0); add(thud(62,.45,.3),C[6]+1.14,0,1.0)
for k,n in enumerate([72,79,84,88,91]): add(bell(Mn(n),5.0,.26),C[6]+1.0+k*.28,-.4+.2*k,1.0)
card(C[6]+3.2+.2,.3)
# S8 closure
phone_in(C[7]+.2,.2,1.0); tap(C[7]+2.8,.2)
for k,tt in enumerate([3.0,3.4,3.8]): card(C[7]+tt+.1,-.3+.15*k)
for k,n in enumerate([76,83,88]): add(bell(Mn(n),3.5,.2),C[7]+3.0+k*.22,-.2+.2*k,1.0)
# S9 beyond the app
phone_in(C[8]+.2,-.3,1.0); phone_in(C[8]+.5,.3,1.0); banner(C[8]+1.1,-.3,.9)
for k,tt in enumerate([2.4,2.8]): card(C[8]+tt+.1,.1)
# S10 city and insights
phone_in(C[9]+.2,-.3,1.0); phone_in(C[9]+.5,.3,1.0)
for tt in (2.2,4.4): tap(C[9]+tt,.3,.8)
for k,tt in enumerate([2.6,3.0,3.4]): card(C[9]+tt+.1,.1)
# S11 outro
add(riser(.9,.2),C[10]+0.1,0,1.0)
for k in range(5): phone_in(C[10]+.1+k*.1,-.5+.25*k,.55,.9)
for k,n in enumerate([72,76,79,84]): add(bell(Mn(n),6.0,.34),C[10]+1.0+k*.2,-.4+.27*k,1.0)
add(click(.25,3200),C[10]+1.9,.2,1.0); add(swish(.5,.14),C[10]+1.85,0,1.0)
# SFX bus reverb
imp=rng.standard_normal(int(SR*1.6))*np.exp(-np.arange(int(SR*1.6))/SR*2.8); imp[0]=0
def verb(x):
    nf=1<<int(np.ceil(np.log2(len(x)+len(imp)))); y=np.fft.irfft(np.fft.rfft(x,nf)*np.fft.rfft(imp,nf),nf)[:len(x)]; return y/(np.max(np.abs(y))+1e-9)*np.max(np.abs(x))
sL=L+0.22*verb(L); sR=R+0.22*verb(R)
# music ducks softly under the big chimes
duck=np.ones(N)
for tc in [C[1]+.72,C[4]+1.5,C[6]+1.0,C[7]+3.0,C[10]+1.0]: duck*=1-0.32*np.exp(-((t-tc-.6)/.9)**2)
m*=duck[:,None]
out=np.stack([m[:,0]+sL,m[:,1]+sR],1)
out*=sm((DUR-t)/1.2)[:,None]
pk=np.max(np.abs(out)); out=out/pk*0.9
with wave.open('build/score2.wav','wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out*32767).astype(np.int16).tobytes())
print('ok',round(DUR,2),'transitions',[round(x,2) for x in T])
