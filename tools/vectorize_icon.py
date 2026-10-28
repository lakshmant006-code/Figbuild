import cv2,numpy as np,sys
im=cv2.imread('icon/src.png')[:,:,::-1].astype(int)
H,W,_=im.shape
d=lambda c:((im-np.array(c))**2).sum(-1)
cream=d((248,245,233));orange=d((253,72,3));black=d((5,6,5))
lab=np.argmin(np.stack([cream,orange,black]),0)  # 0 cream 1 orange 2 black
# rounded square = non-black region bbox
nb=(lab!=2).astype(np.uint8)
ys,xs=np.where(nb);x0,x1,y0,y1=xs.min(),xs.max(),ys.min(),ys.max()
S=256/(x1-x0)
def paths(mask,eps):
    mask=cv2.morphologyEx(mask.astype(np.uint8)*255,cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
    cs,hier=cv2.findContours(mask,cv2.RETR_CCOMP,cv2.CHAIN_APPROX_NONE)
    out=[]
    for c in cs:
        if cv2.contourArea(c)<60: continue
        a=cv2.approxPolyDP(c,eps,True)[:,0,:]
        pts=[((p[0]-x0)*S,(p[1]-y0)*S) for p in a]
        n=len(pts);mid=lambda i:((pts[i%n][0]+pts[(i+1)%n][0])/2,(pts[i%n][1]+pts[(i+1)%n][1])/2)
        dd='M%.1f %.1f'%mid(0)
        for i in range(1,n+1): dd+='Q%.1f %.1f %.1f %.1f'%(pts[i%n][0],pts[i%n][1],*mid(i))
        out.append(dd+'Z')
    return ''.join(out)
eps=float(sys.argv[1]) if len(sys.argv)>1 else 1.6
inner=np.zeros_like(nb);inner[y0:y1+1,x0:x1+1]=1
blackin=(lab==2)&(inner==1)
# exclude the corners outside rounded square: black regions touching bbox edges
n,cc=cv2.connectedComponents(blackin.astype(np.uint8))
keep=np.zeros_like(blackin)
for i in range(1,n):
    m=cc==i;yy,xx=np.where(m)
    if xx.min()<=x0+2 or xx.max()>=x1-2 or yy.min()<=y0+2 or yy.max()>=y1-2: continue
    keep|=m
r=round(0.205*256,1)
svg=('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">'
 f'<rect width="256" height="256" rx="{r}" fill="#F8F5E9"/>'
 f'<path fill="#FD4802" fill-rule="evenodd" d="{paths(lab==1,eps)}"/>'
 f'<path fill="#0B0B0B" fill-rule="evenodd" d="{paths(keep,eps)}"/></svg>')
open('icon/hello-icon.svg','w').write(svg);print(len(svg),'bytes', (x1-x0),(y1-y0))
