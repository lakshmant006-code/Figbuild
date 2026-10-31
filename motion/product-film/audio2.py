# Synthesised score for the Chime film: pad + heartbeat + bell chimes, no samples. python3 audio.py → build/score.wav
import numpy as np, wave
SR=44100
D=[6.43, 4.43, 8.23, 7.83, 4.63, 9.43, 6.23, 6.43, 6.63, 7.23, 7.53]
SC=[sum(D[:i])-0.4*i for i in range(len(D))]
TOT=sum(D)-0.4*(len(D)-1)
DUR=TOT+1.2
N=int(SR*DUR); t=np.arange(N)/SR
rng=np.random.default_rng(7)
L=np.zeros(N); R=np.zeros(N)
def add(sig,at,pan=0.0,gain=1.0):
    i=int(at*SR); n=min(len(sig),N-i)
    if n<=0: return
    L[i:i+n]+=sig[:n]*gain*(1-max(pan,0)); R[i:i+n]+=sig[:n]*gain*(1+min(pan,0))
def env(n,a,d,s=0.0,r=0.0):
    e=np.ones(n); a_=int(a*SR); 
    if a_>0: e[:a_]=np.linspace(0,1,a_)
    return e
def bell(f,dur=4.0,amp=0.5):
    n=int(SR*dur); tt=np.arange(n)/SR; out=np.zeros(n)
    for k,(m,a,dk) in enumerate([(1,1,1.0),(2.0,0.5,1.6),(2.76,0.35,2.0),(4.07,0.22,2.8),(5.4,0.15,3.4),(8.93,0.08,4.5)]):
        out+=a*np.sin(2*np.pi*f*m*tt+0.3*k)*np.exp(-tt*dk*1.15)
    out*=np.minimum(1,tt/0.003); return out*amp
def tick(f,amp=0.3): return bell(f,1.6,amp)
def thump(f=58,dur=0.35,amp=0.6):
    n=int(SR*dur); tt=np.arange(n)/SR; fr=f*(1+2.2*np.exp(-tt*28)); ph=2*np.pi*np.cumsum(fr)/SR
    return amp*np.sin(ph)*np.exp(-tt*9)
def lowpass(x,fc):
    a=np.exp(-2*np.pi*fc/SR); y=np.zeros_like(x); s=0.0
    for i in range(len(x)): s=(1-a)*x[i]+a*s; y[i]=s
    return y
def lp_fast(x,fc):  # vectorised 1-pole via FFT filter
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); X*=1/np.sqrt(1+(f/fc)**4); return np.fft.irfft(X,len(x))
# ---------- hook 0–6.2: muffled party through the wall, then it stops
beat=60/118
for i in range(int(4.9/beat)):
    at=0.1+i*beat
    if at>4.9: break
    k=thump(52,0.4,0.5)*(1-0.0); add(k,at,0,1.0)
    hat=lp_fast(rng.standard_normal(int(SR*0.08))*np.exp(-np.arange(int(SR*0.08))/SR*60),1800)*0.25; add(hat,at+beat/2,0.2,1.0)
mud=lp_fast(rng.standard_normal(int(SR*5.0)),600)*0.18*np.concatenate([np.linspace(0,1,int(SR*.8)),np.ones(int(SR*3.6)),np.linspace(1,0,int(SR*.6))]); add(mud,0,0,1.0)
# ---------- pad (chords) 6.0–end
chords=[(SC[1],[220,261.6,329.6,493.9]),(SC[2]+2,[174.6,220,261.6,329.6]),(SC[3]+2,[196,246.9,293.7,440]),(SC[4],[220,261.6,329.6,493.9]),(SC[6],[174.6,261.6,349.2,440]),(SC[7],[196,293.7,392,493.9]),(SC[8],[220,329.6,415.3,493.9]),(SC[9]+2,[174.6,261.6,329.6,440]),(SC[10],[196,261.6,329.6,392,523.3])]
bounds=[c[0] for c in chords]+[DUR]
pad=np.zeros(N)
for ci,(st,fs) in enumerate(chords):
    en=bounds[ci+1]+1.5; i0=int(st*SR); i1=min(N,int(en*SR)); n=i1-i0; tt=np.arange(n)/SR
    e=np.minimum(1,tt/2.0)*np.minimum(1,(en-st-tt)/1.5)
    for f in fs:
        for dtn in (-0.004,0.0,0.004):
            pad[i0:i1]+=np.sin(2*np.pi*f*(1+dtn)*tt+rng.random()*6.28)*e*0.035
            pad[i0:i1]+=0.4*np.sin(2*np.pi*f*2*(1+dtn)*tt+rng.random()*6.28)*e*0.012
sw=np.interp(t,[0,SC[1],SC[2],SC[6],SC[7],SC[10],DUR],[0,0,.7,1,.8,1,0]); pad*=sw
add(pad,0,0,1.0)
# ---------- heartbeat pulse 10→66 (lub-dub at 72bpm), swells with the heard scene
hb=60/72
for i in range(int((SC[10]-SC[2])/hb)):
    at=SC[2]+i*hb
    g=0.22+0.3*(SC[6]<=at<=SC[7])
    add(thump(62,0.32,0.55)*g,at,0,1.0); add(thump(70,0.25,0.4)*g*0.8,at+0.24,0,1.0)
# ---------- chimes
M=lambda n:440*2**((n-69)/12)
add(bell(M(81),5.5,0.6),SC[1]+0.6,0,1.0); add(bell(M(88),5.5,0.28),SC[1]+0.64,0.3,1.0)      # logo reveal
for k,n in enumerate([76,79,83]): add(tick(M(n),0.14),SC[2]+7.0+k*0.2,-0.3+0.3*k,1.0)   # onboarding ready
add(bell(M(84),4.5,0.5),SC[4]+1.35,0,1.0); add(bell(M(91),4.5,0.2),SC[4]+1.4,0.2,1.0)         # sent
for st in (SC[5]+1.9,SC[5]+5.3): add(tick(M(79),0.33),st,0.2,1.0); add(tick(M(86),0.2),st+0.1,-0.2,1.0)   # status toasts
for k,n in enumerate([72,79,84,88,91]): add(bell(M(n),6.0,0.34),SC[6]+0.9+k*0.35,-0.4+0.2*k,1.0)   # we listened
add(bell(M(76),4.0,0.3),SC[7]+2.9,0,1.0); add(bell(M(83),4.0,0.3),SC[7]+3.15,0.2,1.0); add(bell(M(88),4.5,0.34),SC[7]+3.4,-0.2,1.0)   # closure
for k,n in enumerate([72,76,79,84]): add(bell(M(n),7.0,0.4),SC[10]+1.0+k*0.18,-0.4+0.27*k,1.0)   # outro
# ---------- simple reverb
imp=rng.standard_normal(int(SR*1.8))*np.exp(-np.arange(int(SR*1.8))/SR*2.4); imp[0]=0
def verb(x): 
    nfft=1<<int(np.ceil(np.log2(len(x)+len(imp)))); y=np.fft.irfft(np.fft.rfft(x,nfft)*np.fft.rfft(imp,nfft),nfft)[:len(x)]; return y/np.max(np.abs(y)+1e-9)
wetL=verb(L); wetR=verb(R)
outL=L*0.8+wetL*0.22*np.max(np.abs(L)); outR=R*0.8+wetR*0.22*np.max(np.abs(R))
# duck/stop: the party cuts dead at 4.9s (already ends); master fade
fade=np.minimum(1,t/0.05)*np.minimum(1,(DUR-t)/2.0)
outL*=fade; outR*=fade
m=max(np.max(np.abs(outL)),np.max(np.abs(outR))); outL/=m; outR/=m
pcm=(np.stack([outL,outR],1)*0.85*32767).astype(np.int16)
import os; os.makedirs('build',exist_ok=True)
with wave.open('build/score.wav','wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok',DUR)
