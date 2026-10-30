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
# transitions: a soft whoosh into every cut
for i,tc in enumerate(T): add(whoosh(1.15,.2),tc-0.62,-0.3 if i%2==0 else 0.3,1.0)
# S1 hook: low "wall" rumble ends with the cut to silence
add(riser(1.2,.2),T[0]-1.25,0,1.0)
# S2 logo
add(bell(Mn(81),5.0,.55),C[1]+0.72,0,1.0); add(bell(Mn(88),4.5,.2),C[1]+0.76,.3,1.0)
for k,n in enumerate([84,88,91]): add(pop(Mn(n)*2,.1),C[1]+1.7+k*.14,-.3+.3*k,1.0)
# S3 onboarding: chips tick in
for k,tt in enumerate([1.2,2.8,4.4,6.0]): add(pop(Mn(76+k*2)*2,.12),C[2]+tt+.1,-.2+.13*k,1.0)
# S4 report
for tt,n in [(3.1,79),(6.9,83)]: add(pop(Mn(n)*2,.14),C[3]+tt+.15,.25,1.0)
add(bell(Mn(76),2.5,.18),C[3]+6.05,.1,1.0)
# S5 sent: bars gather -> orb -> check
add(riser(1.0,.2),C[4]+0.5,0,1.0); add(thump(55,.7,.45),C[4]+1.5,0,1.0); add(bell(Mn(84),4.0,.5),C[4]+1.5,0,1.0); add(bell(Mn(91),3.6,.18),C[4]+1.56,.25,1.0)
add(pop(Mn(96),.15),C[4]+1.78,.2,1.0)
# S6 track: chips and status toasts
for k,tt in enumerate([1.7,4.5,7.3]): add(pop(Mn(79+k*2)*2,.12),C[5]+tt+.1,-.3+.3*k,1.0)
for tt in (2.0,5.4): add(bell(Mn(79),1.8,.22),C[5]+tt,.2,1.0); add(bell(Mn(86),1.6,.12),C[5]+tt+.1,-.2,1.0)
# S7 we listened: heartbeat + chord
add(thump(56,.55,.4),C[6]+0.9,0,1.0); add(thump(62,.45,.3),C[6]+1.14,0,1.0)
for k,n in enumerate([72,79,84,88,91]): add(bell(Mn(n),5.0,.26),C[6]+1.0+k*.28,-.4+.2*k,1.0)
# S8 closure
for k,n in enumerate([76,83,88]): add(bell(Mn(n),3.5,.24),C[7]+3.0+k*.22,-.2+.2*k,1.0)
for k,tt in enumerate([3.0,3.4,3.8]): add(pop(Mn(79+k*2)*2,.1),C[7]+tt+.1,.3,1.0)
# S9 / S10 chips
for k,tt in enumerate([2.4,2.8]): add(pop(Mn(81+k*2)*2,.11),C[8]+tt+.1,-.1,1.0)
for k,tt in enumerate([2.6,3.0,3.4]): add(pop(Mn(76+k*2)*2,.11),C[9]+tt+.1,.1,1.0)
# S11 outro
add(riser(.9,.2),C[10]+0.1,0,1.0)
for k,n in enumerate([72,76,79,84]): add(bell(Mn(n),6.0,.34),C[10]+1.0+k*.2,-.4+.27*k,1.0)
add(pop(Mn(96),.12),C[10]+1.9,.2,1.0); add(pop(Mn(100),.1),C[10]+2.6,-.2,1.0)
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
