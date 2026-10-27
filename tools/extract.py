import sys,re,subprocess,json,numpy as np,mapbox_earcut as ec,pyproj
zipf=sys.argv[1]; out=sys.argv[2]
CX,CY=996003.57,200793.26; R=float(sys.argv[3]) if len(sys.argv)>3 else 1500.0
FT=0.3048
ATTR=['borough','address','yearbuilt','numfloors','bldgclass','landuse','zipcode','bldgarea','lot','block']
pos_re=re.compile(r'<gml:posList>([^<]*)</gml:posList>')
surf_re=re.compile(r'<bldg:(Ground|Roof|Wall)Surface .*?</bldg:\1Surface>',re.S)
at_re=re.compile(r'<gen:stringAttribute name="(\w+)">\s*<gen:value>([^<]*)</gen:value>')
p=subprocess.Popen(['unzip','-p',zipf],stdout=subprocess.PIPE,bufsize=1<<20)
buf=b'';blds=[];scanned=0
def handle(chunk):
    global scanned
    scanned+=1
    m=pos_re.search(chunk)
    if not m: return
    v=m.group(1).split()
    x=float(v[0]);y=float(v[1])
    if abs(x-CX)>R or abs(y-CY)>R: return
    b={'attr':{},'surf':[]}
    head=chunk[:chunk.find('<bldg:boundedBy>')] if '<bldg:boundedBy>' in chunk else chunk
    tail=chunk[chunk.rfind('</bldg:boundedBy>'):]
    for k,val in at_re.findall(tail):
        if k in ATTR: b['attr'][k]=val
    for sm in surf_re.finditer(chunk):
        kind=sm.group(1)
        for pm in pos_re.finditer(sm.group(0)):
            a=np.array(pm.group(1).split(),dtype=np.float64).reshape(-1,3)
            b['surf'].append((kind,a))
    blds.append(b)
end=b'</core:cityObjectMember>'
while True:
    d=p.stdout.read(1<<22)
    if not d: break
    buf+=d
    while True:
        i=buf.find(end)
        if i<0: break
        j=buf.rfind(b'<core:cityObjectMember>',0,i)
        if j>=0: handle(buf[j:i].decode('utf8','ignore'))
        buf=buf[i+len(end):]
print('scanned',scanned,'in window',len(blds),file=sys.stderr)
bor={}
for b in blds: bor[b['attr'].get('borough')]=bor.get(b['attr'].get('borough'),0)+1
print('boroughs',bor,file=sys.stderr)
import pickle;pickle.dump(blds,open(out,'wb'))
