# Beat-locked timeline for the 61 s cut. 87 bpm, phase 0.006 s. Transitions land on 2-beat units.
BPM=87.0; PH=0.006; P=60/BPM; U=2*P
UNITS=[4,3,5,5,3,6,4,4,3,4]          # scene lengths in 2-beat units (S1..S10); S11 gets 3.5 units
OV=0.7                                # eased crossfade length
T=[]; acc=0
for u in UNITS: acc+=u; T.append(PH+acc*U)   # T[k] = centre of transition k -> k+1
END=T[-1]+3.5*U
C=[0.0]+[t-OV/2 for t in T]           # clip start times (global)
L=[(T[k]+OV/2)-C[k] for k in range(10)]+[END-C[10]]
