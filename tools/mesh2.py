import pickle,json,base64,numpy as np,mapbox_earcut as ec,pyproj,math,os
CX,CY=996003.57,200793.26;FT=0.3048
blds=pickle.load(open('da/DA19.pkl','rb'))
P=[];I=[];B=[];F=[];H=[];base=0;GR=[];GRN=[]
def add(v,tris,bi,flag):
    global base
    P.append(v);B.append(np.full(len(v),bi,dtype=np.uint16));F.append(np.full(len(v),flag,dtype=np.uint8))
    I.append((tris+base).ravel());base+=len(v)
def cyl(cx,cy,z0,r,h,n=10):
    th=np.linspace(0,2*np.pi,n,endpoint=False)
    bot=np.column_stack([cx+r*np.cos(th),cy+r*np.sin(th),np.full(n,z0)])
    top=bot.copy();top[:,2]=z0+h
    v=np.vstack([bot,top,[[cx,cy,z0+h]]]);t=[]
    for i in range(n):
        j=(i+1)%n
        t+= [[i,j,n+j],[i,n+j,n+i],[n+i,n+j,2*n]]
    return v,np.array(t)
def cone(cx,cy,z0,r,h,n=10):
    th=np.linspace(0,2*np.pi,n,endpoint=False)
    bot=np.column_stack([cx+r*np.cos(th),cy+r*np.sin(th),np.full(n,z0)])
    v=np.vstack([bot,[[cx,cy,z0+h]]]);t=[[i,(i+1)%n,n] for i in range(n)]
    return v,np.array(t)
rng=np.random.default_rng(7)
for bi,b in enumerate(blds):
    gz=None;pts=[]
    for k,a in b['surf']:
        if k=='Ground': gz=a[:,2].min() if gz is None else min(gz,a[:,2].min())
        pts.append(a[:,:2])
    if gz is None: gz=min(a[:,2].min() for k,a in b['surf'])
    allp=np.vstack(pts);cx,cy=allp.mean(0)
    grounds=[a[:,:2] for k,a in b['surf'] if k=='Ground']
    for k,a in b['surf']:
        if k=='Ground' and len(a)>=3:
            r=np.column_stack([(a[:,0]-CX)*FT,(a[:,1]-CY)*FT,np.full(len(a),0.05)])
            if not np.allclose(r[0],r[-1]): r=np.vstack([r,r[:1]])
            GR.append(r);GRN.append(len(r))
    top=0;roofs=[]
    for k,a in b['surf']:
        if k=='Ground': continue
        a=a[:-1] if np.allclose(a[0],a[-1]) else a
        if len(a)<3: continue
        n=np.zeros(3)
        for i in range(len(a)):
            p,q=a[i],a[(i+1)%len(a)]
            n+=[(p[1]-q[1])*(p[2]+q[2]),(p[2]-q[2])*(p[0]+q[0]),(p[0]-q[0])*(p[1]+q[1])]
        L=np.linalg.norm(n)
        if L<1e-9: continue
        n/=L
        if k=='Roof' and n[2]<0: n=-n
        if k=='Wall':
            c=a.mean(0);probe=c[:2]+n[:2]*1.5;ins=False
            for g in grounds:
                x=probe[0];y=probe[1];inside=False;j=len(g)-1
                for i in range(len(g)):
                    if ((g[i,1]>y)!=(g[j,1]>y)) and (x<(g[j,0]-g[i,0])*(y-g[i,1])/(g[j,1]-g[i,1])+g[i,0]): inside=not inside
                    j=i
                if inside: ins=True;break
            if ins: n=-n
        ax=np.argmax(np.abs(n));keep=[i for i in range(3) if i!=ax]
        tri=ec.triangulate_float64(a[:,keep].astype(np.float64),np.array([len(a)],dtype=np.uint32)).reshape(-1,3)
        if len(tri)==0: continue
        for t in tri:
            if np.dot(np.cross(a[t[1]]-a[t[0]],a[t[2]]-a[t[0]]),n)<0: t[1],t[2]=t[2],t[1]
        v=np.column_stack([(a[:,0]-CX)*FT,(a[:,1]-CY)*FT,(a[:,2]-gz)*FT])
        top=max(top,v[:,2].max())
        if k=='Roof' and abs(n[2])>0.9:
            area=abs(np.cross(v[1]-v[0],v[2]-v[0])[2])
            roofs.append((len(v),v))
        add(v,tri,bi,0)
    H.append(round(float(top),1))
    # rooftop water tower on some mid-rise buildings
    if top>11 and rng.random()<0.28 and roofs:
        v=max(roofs,key=lambda r:r[0])[1]
        c=v.mean(0);zt=top
        # nudge toward the roof's first vertex to stay on the roof
        c=c*0.7+v[0]*0.3
        legs,lt=cyl(c[0],c[1],zt,0.9,1.6,6);body,bt=cyl(c[0],c[1],zt+1.6,1.7,2.6,12);roof,rt=cone(c[0],c[1],zt+4.2,1.9,1.3,12)
        for vv,tt in ((legs,lt),(body,bt),(roof,rt)):
            for t in tt:
                m=vv[t].mean(0)
            add(vv,tt,bi,1)
P=np.vstack(P);I=np.concatenate(I).astype(np.uint32);B=np.concatenate(B);F=np.concatenate(F)
q=np.round(P*10).astype(np.int16);assert np.abs(P*10).max()<32000
lon,lat=pyproj.Transformer.from_crs(2263,4326,always_xy=True).transform(CX,CY)
d={'anchor':[lon,lat],'n':len(blds),'nv':int(len(P)),'pos':base64.b64encode(q.tobytes()).decode(),'idx':base64.b64encode(I.tobytes()).decode(),'bid':base64.b64encode(B.tobytes()).decode(),'fl':base64.b64encode(F.tobytes()).decode(),
 'ol':base64.b64encode(np.round(np.vstack(GR)*10).astype(np.int16).tobytes()).decode(),'oln':base64.b64encode(np.array(GRN,dtype=np.uint16).tobytes()).decode(),'h':H}
json.dump(d,open('mesh2.json','w'),separators=(',',':'))
print(d['nv'],len(I)//3,'tris',os.path.getsize('mesh2.json')//1024,'KB','tanks',int((F==1).sum()))
