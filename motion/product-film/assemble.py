# Stitch the Figma-exported scenes with eased crossfades (and white/black dips at light/dark cuts) + the mixed score.
import subprocess
from timeline import T,C,L,END,OV
dur=[6.4333,4.4333,8.2333,7.8333,4.6333,9.4333,6.2333,6.4333,6.6333,7.2333,7.5333]
DIP={0:'fadewhite',5:'fadeblack',6:'fadewhite'}      # S1->S2, S6->S7, S7->S8 change between dark and light
inp=[]
for i in range(11): inp+=['-i',f'build/figmaexp/v2/s{i+1}.mp4']
inp+=['-i','build/score2.wav']
fc=[]
for k in range(11):
    pad=max(0,L[k]-dur[k])
    fc.append(f'[{k}:v]fps=30,trim=duration={L[k]:.3f},setpts=PTS-STARTPTS'+(f',tpad=stop_mode=clone:stop_duration={pad+0.1:.3f}' if pad>0 else '')+f'[c{k}]')
s='((1-P)*(1-P)*(3-2*(1-P)))'
prev='[c0]'
for k in range(10):
    out=f'[x{k}]'; tr=DIP.get(k)
    if tr: fc.append(f"{prev}[c{k+1}]xfade=transition={tr}:duration={OV}:offset={C[k+1]:.3f}{out}")
    else: fc.append(f"{prev}[c{k+1}]xfade=transition=custom:duration={OV}:offset={C[k+1]:.3f}:expr='A*(1-{s})+B*{s}'{out}")
    prev=out
fc.append(f'{prev}fade=t=out:st={END-0.9:.2f}:d=0.9[vout]')
fc.append('[11:a]loudnorm=I=-15:TP=-1.5:LRA=9[aout]')
cmd=['ffmpeg','-y','-loglevel','error']+inp+['-filter_complex',';'.join(fc),'-map','[vout]','-map','[aout]','-c:v','libx264','-preset','slow','-crf','17','-pix_fmt','yuv420p','-r','30','-c:a','aac','-b:a','192k','-t',f'{END+0.6:.2f}','-movflags','+faststart','chime-film-61s.mp4']
subprocess.run(cmd,check=True); print('ok',END)
