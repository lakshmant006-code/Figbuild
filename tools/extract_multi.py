import sys,re,subprocess,pickle,numpy as np,pyproj
t=pyproj.Transformer.from_crs(4326,2263,always_xy=True)
AREAS={'williamsburg':(-73.9576,40.7178,2400),'greenpoint':(-73.9540,40.7302,2000),'les':(-73.9890,40.7187,2000),'eastvillage':(-73.9840,40.7270,2000),'dumbo':(-73.9897,40.7033,2000),'midtown':(-73.9857,40.7484,2000)}
C={k:(*t.transform(lo,la),R) for k,(lo,la,R) in AREAS.items()}
ATTR=['borough']
pos_re=re.compile(r'<gml:posList>([^<]*)</gml:posList>')
surf_re=re.compile(r'<bldg:(Ground|Roof|Wall)Surface .*?</bldg:\1Surface>',re.S)
id_re=re.compile(r'<bldg:Building gml:id="([^"]+)"')
out={k:{} for k in C}
for z in sys.argv[1:]:
    p=subprocess.Popen(['unzip','-p',z],stdout=subprocess.PIPE,bufsize=1<<20)
    buf=b'';end=b'</core:cityObjectMember>';n=0
    while True:
        d=p.stdout.read(1<<22)
        if not d: break
        buf+=d
        while True:
            i=buf.find(end)
            if i<0: break
            j=buf.rfind(b'<core:cityObjectMember>',0,i)
            if j>=0:
                ch=buf[j:i].decode('utf8','ignore');n+=1
                m=pos_re.search(ch)
                if m:
                    v=m.group(1).split();x=float(v[0]);y=float(v[1])
                    hit=[k for k,(cx,cy,R) in C.items() if abs(x-cx)<R and abs(y-cy)<R]
                    if hit:
                        gid=id_re.search(ch);gid=gid.group(1) if gid else str(n)+z
                        surf=[(sm.group(1),np.array(pm.group(1).split(),dtype=np.float64).reshape(-1,3)) for sm in surf_re.finditer(ch) for pm in pos_re.finditer(sm.group(0))]
                        for k in hit: out[k][gid]={'attr':{},'surf':surf}
            buf=buf[i+len(end):]
    print(z,'scanned',n,{k:len(v) for k,v in out.items()},file=sys.stderr,flush=True)
for k,v in out.items(): pickle.dump(list(v.values()),open('da/area_%s.pkl'%k,'wb'))
