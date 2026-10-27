import pickle,json,base64,numpy as np,mapbox_earcut as ec,pyproj,sys
CX,CY=996003.57,200793.26;FT=0.3048
blds=pickle.load(open('da/DA19.pkl','rb'))
P=[];I=[];B=[];H=[];base=0;OL=[];OLN=[]
for bi,b in enumerate(blds):
    gz=None;pts=[]
    for k,a in b['surf']:
        if k=='Ground': gz=a[:,2].min() if gz is None else min(gz,a[:,2].min())
        pts.append(a[:,:2])
    if gz is None: gz=min(a[:,2].min() for k,a in b['surf'])
    allp=np.vstack(pts);cx,cy=allp.mean(0)
    grounds=[a[:,:2] for k,a in b['surf'] if k=='Ground']
    top=0
    for k,a in b['surf']:
        if k in ('Roof','Ground') and len(a)>=3:
            r=np.column_stack([(a[:,0]-CX)*FT,(a[:,1]-CY)*FT,(a[:,2]-gz)*FT+(0.05 if k=='Ground' else 0)])
            if not np.allclose(r[0],r[-1]): r=np.vstack([r,r[:1]])
            OL.append(r);OLN.append(len(r))
    for k,a in b['surf']:
        if k=='Ground': continue
        a=a[:-1] if np.allclose(a[0],a[-1]) else a
        if len(a)<3: continue
        # newell normal
        n=np.zeros(3)
        for i in range(len(a)):
            p,q=a[i],a[(i+1)%len(a)]
            n+=[(p[1]-q[1])*(p[2]+q[2]),(p[2]-q[2])*(p[0]+q[0]),(p[0]-q[0])*(p[1]+q[1])]
        L=np.linalg.norm(n)
        if L<1e-9: continue
        n/=L
        if k=='Roof' and n[2]<0: n=-n
        if k=='Wall':
            c=a.mean(0);probe=c[:2]+n[:2]*1.5
            ins=False
            for g in grounds:
                x=probe[0];y=probe[1];inside=False;j=len(g)-1
                for i in range(len(g)):
                    if ((g[i,1]>y)!=(g[j,1]>y)) and (x<(g[j,0]-g[i,0])*(y-g[i,1])/(g[j,1]-g[i,1])+g[i,0]): inside=not inside
                    j=i
                if inside: ins=True;break
            if ins: n=-n
        ax=np.argmax(np.abs(n));keep=[i for i in range(3) if i!=ax]
        flat=a[:,keep].astype(np.float64)
        tri=ec.triangulate_float64(flat,np.array([len(a)],dtype=np.uint32)).reshape(-1,3)
        if len(tri)==0: continue
        # fix winding to match normal
        for t in tri:
            e1=a[t[1]]-a[t[0]];e2=a[t[2]]-a[t[0]]
            if np.dot(np.cross(e1,e2),n)<0: t[1],t[2]=t[2],t[1]
        v=np.column_stack([(a[:,0]-CX)*FT,(a[:,1]-CY)*FT,(a[:,2]-gz)*FT])
        top=max(top,v[:,2].max())
        P.append(v);B.append(np.full(len(v),bi,dtype=np.uint16))
        I.append((tri+base).ravel());base+=len(v)
    H.append(round(float(top),1))
P=np.vstack(P);I=np.concatenate(I).astype(np.uint32);B=np.concatenate(B)
q=np.round(P*10).astype(np.int16)
assert np.abs(P*10).max()<32000
lon,lat=pyproj.Transformer.from_crs(2263,4326,always_xy=True).transform(CX,CY)
d={'anchor':[lon,lat],'n':len(blds),'nv':int(len(P)),'ni':int(len(I)),
 'pos':base64.b64encode(q.tobytes()).decode(),'idx':base64.b64encode(I.tobytes()).decode(),'bid':base64.b64encode(B.tobytes()).decode(),
 'ol':base64.b64encode(np.round(np.vstack(OL)*10).astype(np.int16).tobytes()).decode(),'oln':base64.b64encode(np.array(OLN,dtype=np.uint16).tobytes()).decode(),'h':H,'hmax':max(H)}
json.dump(d,open('mesh.json','w'),separators=(',',':'))
import os;print(d['nv'],d['ni']//3,'tris',os.path.getsize('mesh.json')//1024,'KB','hmax',max(H),'anchor',lon,lat)
