import pickle,json,glob,gzip,base64,struct,numpy as np,mapbox_earcut as ec,pyproj,os,collections
FT=0.3048
to_sp=pyproj.Transformer.from_crs(4326,2263,always_xy=True); to_ll=pyproj.Transformer.from_crs(2263,4326,always_xy=True)
rows={r['bin']:r for r in json.load(open('geo/tall.json'))}
model={}
for f in glob.glob('official/DA*_sky.pkl'):
    for k,v in pickle.load(open(f,'rb')).items(): model.setdefault(k,v)
AREAS={'williamsburg':(-73.9576,40.7178,2400),'greenpoint':(-73.9540,40.7302,2000),'les':(-73.9890,40.7187,2000),'eastvillage':(-73.9840,40.7270,2000),'dumbo':(-73.9897,40.7033,2000),'midtown':(-73.9857,40.7484,2000),
 'fidi':(-74.0090,40.7075,2000),'chinatown':(-73.9970,40.7158,1800),'soho':(-74.0000,40.7233,1800),'village':(-74.0000,40.7336,1800),'chelsea':(-73.9997,40.7465,1800),'timessq':(-73.9855,40.7580,1800),'lic':(-73.9480,40.7447,2000),'dtbk':(-73.9870,40.6930,2000),'bushwick':(-73.9210,40.6944,2000)}
AC={k:(*to_sp.transform(lo,la),R) for k,(lo,la,R) in AREAS.items()}
def tri_poly(a,n):
    ax=np.argmax(np.abs(n));keep=[i for i in range(3) if i!=ax]
    t=ec.triangulate_float64(a[:,keep].astype(np.float64),np.array([len(a)],dtype=np.uint32)).reshape(-1,3)
    for x in t:
        if np.dot(np.cross(a[x[1]]-a[x[0]],a[x[2]]-a[x[0]]),n)<0: x[1],x[2]=x[2],x[1]
    return t
def newell(a):
    n=np.zeros(3)
    for i in range(len(a)):
        p,q=a[i],a[(i+1)%len(a)]
        n+=[(p[1]-q[1])*(p[2]+q[2]),(p[2]-q[2])*(p[0]+q[0]),(p[0]-q[0])*(p[1]+q[1])]
    L=np.linalg.norm(n);return n/L if L>1e-9 else None
def inside(pt,g):
    x,y=pt;ins=False;j=len(g)-1
    for i in range(len(g)):
        if ((g[i,1]>y)!=(g[j,1]>y)) and (x<(g[j,0]-g[i,0])*(y-g[i,1])/(g[j,1]-g[i,1])+g[i,0]): ins=not ins
        j=i
    return ins
blds=[]  # (center_xy, surfaces[(kind,array ft xyz with base z already relative ft)], from_model)
for b,r in rows.items():
    if b in model and model[b]:
        surf=model[b];gz=min(a[:,2].min() for k,a in surf)
        blds.append({'surf':[(k,np.column_stack([a[:,0],a[:,1],a[:,2]-gz])) for k,a in surf],'model':True})
    else:
        geom=r['the_geom']['coordinates'];H=float(r['height_roof'])
        surf=[]
        for poly in geom:
            ring=np.array(poly[0]);x,y=to_sp.transform(ring[:,0],ring[:,1]);g=np.column_stack([x,y])
            if np.allclose(g[0],g[-1]): g=g[:-1]
            if len(g)<3: continue
            surf.append(('Roof',np.column_stack([g,np.full(len(g),H)])))
            for i in range(len(g)):
                p,q=g[i],g[(i+1)%len(g)]
                surf.append(('Wall',np.array([[p[0],p[1],0],[q[0],q[1],0],[q[0],q[1],H],[p[0],p[1],H]])))
            surf.append(('Ground',np.column_stack([g,np.zeros(len(g))])))
        if surf: blds.append({'surf':surf,'model':False})
print('buildings',len(blds),'from model',sum(b['model'] for b in blds))
groups=collections.defaultdict(list)
clean=[]
for b in blds:
    pts=np.vstack([a[:,:2] for k,a in b['surf']]);mx,my=np.median(pts,axis=0)
    b['surf']=[(k,a) for k,a in b['surf'] if np.all(np.abs(a[:,0]-mx)<2500) and np.all(np.abs(a[:,1]-my)<2500) and np.all(np.abs(a[:,2])<2000)]
    if b['surf']: clean.append(b)
blds=clean
for b in blds:
    pts=np.vstack([a[:,:2] for k,a in b['surf']]);cx,cy=pts.mean(0);b['c']=(cx,cy)
    key=None
    if b['model']:
        for k,(ax,ay,R) in AC.items():
            if abs(cx-ax)<R and abs(cy-ay)<R: key='area:'+k;break
    if key is None: key='cell:%d:%d'%(int(cx//9000),int(cy//9000))
    groups[key].append(b)
G=[];bufs=[];off=0
def addbuf(a):
    global off
    off=(off+3)//4*4;o=off;bufs.append((o,a));off+=a.nbytes;return [o,int(a.size)]
for key,bl in groups.items():
    if key.startswith('area:'):
        ox,oy,_=AC[key[5:]]
    else:
        ox,oy=np.mean([b['c'] for b in bl],axis=0)
    P=[];I=[];B=[];H=[];base=0
    for bi,b in enumerate(bl):
        grounds=[a[:,:2] for k,a in b['surf'] if k=='Ground'];cx,cy=b['c'];top=0
        for k,a in b['surf']:
            if k=='Ground': continue
            a=a[:-1] if len(a)>3 and np.allclose(a[0],a[-1]) else a
            if len(a)<3: continue
            n=newell(a)
            if n is None: continue
            if k=='Roof' and n[2]<0: n=-n
            if k=='Wall':
                c=a.mean(0);pr=c[:2]+n[:2]*1.5
                if any(inside(pr,g) for g in grounds): n=-n
            t=tri_poly(a,n)
            if len(t)==0: continue
            v=np.column_stack([(a[:,0]-ox)*FT,(a[:,1]-oy)*FT,a[:,2]*FT]);top=max(top,v[:,2].max())
            P.append(v);B.append(np.full(len(v),bi,dtype=np.uint16));I.append((t+base).ravel());base+=len(v)
        H.append(round(float(top),1))
    if not P: continue
    P=np.vstack(P);q=np.round(P*10)
    assert np.abs(q).max()<32767,(key,np.abs(q).max())
    lon,lat=to_ll.transform(ox,oy)
    G.append({'key':key,'anchor':[lon,lat],'nv':int(len(P)),'h':H,'b':{'pos':addbuf(q.astype(np.int16)),'idx':addbuf(np.concatenate(I).astype(np.uint32)),'bid':addbuf(np.concatenate(B).astype(np.uint16))}})
hj=json.dumps({'groups':G},separators=(',',':')).encode();hj+=b' '*((-len(hj))%4)
body=bytearray(off)
for o,a in bufs: body[o:o+a.nbytes]=a.tobytes()
raw=struct.pack('<I',len(hj))+hj+bytes(body)
open('/home/user/Figbuild/areas/skyline.txt','w').write(base64.b64encode(gzip.compress(raw,9)).decode())
print('groups',len(G),'verts',sum(g['nv'] for g in G),'raw',len(raw)//1024,'KB','file',os.path.getsize('/home/user/Figbuild/areas/skyline.txt')//1024,'KB')
