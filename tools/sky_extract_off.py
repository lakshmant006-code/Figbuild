import sys,re,subprocess,pickle,json,numpy as np
z=sys.argv[1];member=sys.argv[2]
bins=set(r['bin'] for r in json.load(open('geo/tall.json')))
pos_re=re.compile(r'<gml:posList>([^<]*)</gml:posList>')
surf_re=re.compile(r'<bldg:(Ground|Roof|Wall)Surface .*?</bldg:\1Surface>',re.S)
bin_re=re.compile(r'name="BIN">\s*<gen:value>(\d+)</gen:value>')
out={}
p=subprocess.Popen(['unzip','-p',z,member],stdout=subprocess.PIPE,bufsize=1<<20)
buf=b'';end=b'</core:cityObjectMember>'
while True:
    d=p.stdout.read(1<<22)
    if not d: break
    buf+=d
    while True:
        i=buf.find(end)
        if i<0: break
        j=buf.rfind(b'<core:cityObjectMember>',0,i)
        if j>=0:
            head=buf[j:j+600].decode('utf8','ignore')
            m=bin_re.search(head)
            if m and m.group(1) in bins and m.group(1) not in out:
                ch=buf[j:i].decode('utf8','ignore')
                out[m.group(1)]=[(sm.group(1),np.array(pm.group(1).split(),dtype=np.float64).reshape(-1,3)) for sm in surf_re.finditer(ch) for pm in pos_re.finditer(sm.group(0))]
        buf=buf[i+len(end):]
pickle.dump(out,open('official/'+member.split('/')[-1].split('_')[0]+'_sky.pkl','wb'))
print(member,len(out),flush=True)
