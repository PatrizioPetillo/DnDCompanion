# Estrae gli incantesimi dall'SRD 5.2 (pp. 107-175) in JSON. Uso: python3 -I incantesimi.py srd.txt out.json
import re,sys,json
lines=open(sys.argv[1],encoding='utf-8').read().split('\n')
pat=re.compile(r'^(\d+) System Reference Document 5\.2\s*$')
page=0;rows=[]
for l in lines:
    m=pat.match(l)
    if m: page=int(m.group(1)); continue
    if 107<=page<=175: rows.append((page,l.rstrip()))
LV=re.compile(r'^(?:Level (\d) (\w+)|(\w+) Cantrip) \((.*)$')
out=[]
i=0
while i<len(rows):
    p,l=rows[i]
    if i+1<len(rows):
        m=LV.match(rows[i+1][1])
        if m and l and not l.startswith(('Level','Casting')):
            lvl=int(m.group(1)) if m.group(1) else 0
            school=m.group(2) or m.group(3)
            cls=m.group(4); j=i+1
            while not cls.endswith(')'):
                j+=1; cls+=' '+rows[j][1].strip()
            cls=[c.strip() for c in cls.rstrip(')').split(',')]
            f={}
            k=j+1; key=None
            while k<len(rows) and len(f)<4 or (key=='Components' and not rows[k][1].startswith('Duration')):
                t=rows[k][1]
                mm=re.match(r'^(Casting Time|Range|Components?|Duration): ?(.*)$',t)
                if mm: key=mm.group(1).rstrip('s')+('s' if mm.group(1).startswith('Comp') else ''); key='Components' if key.startswith('Comp') else key; f[key]=mm.group(2).strip()
                elif key: f[key]+=' '+t.strip()
                k+=1
                if 'Duration' in f and len(f)>=4: break
            comp=f.get('Components','')
            mat=re.search(r'M \((.*)\)',comp)
            costo=None; cons=False
            if mat:
                c=re.search(r'([\d,]+)\+? GP',mat.group(1)); costo=int(c.group(1).replace(',','')) if c else None
                cons='consume' in mat.group(1)
            ct=f.get('Casting Time','')
            out.append(dict(nomeEn=l.strip(),pagina=p,livello=lvl,scuola=school,liste=cls,
              tempo=ct,rituale='Ritual' in ct,gittata=f.get('Range',''),
              V=bool(re.search(r'\bV\b',comp)),S=bool(re.search(r'\bS\b',comp)),M=mat.group(1) if mat else None,
              costoMo=costo,consumato=cons,durata=f.get('Duration',''),concentrazione=f.get('Duration','').startswith('Concentration')))
            i=k; continue
    i+=1
json.dump(out,open(sys.argv[2],'w'),ensure_ascii=False,indent=1)
print(len(out))
