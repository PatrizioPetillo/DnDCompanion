# Aggiunge a src/regole/dati/incantesimi.json i dati italiani presi dall'SRD 5.2.1 in italiano (CC-BY-4.0).
# I testi completi vanno in incantesimi-testi.json (caricato a richiesta).
# Uso:  pdftotext -raw IT_SRD_CC_v5.2.1.pdf it_raw.txt
#       python3 strumenti/aggiungi-italiano.py it_raw.txt
# Abbina ogni incantesimo inglese al suo italiano per livello, scuola, classi, rituale, concentrazione,
# componenti e gittata; i pochi casi uguali su tutto sono risolti a mano (vedi MANUALI).
import json, re, sys
from pathlib import Path

DATI = Path(__file__).resolve().parent.parent / 'src/regole/dati/incantesimi.json'
righe = open(sys.argv[1], encoding='utf-8').read().replace('\xad', '').split('\n')

SC = {'abiurazione': 'abjuration', 'ammaliamento': 'enchantment', 'divinazione': 'divination', 'evocazione': 'conjuration',
      'invocazione': 'evocation', 'illusione': 'illusion', 'necromanzia': 'necromancy', 'trasmutazione': 'transmutation'}
CL = {'bardo': 'bard', 'chierico': 'cleric', 'druido': 'druid', 'mago': 'wizard', 'paladino': 'paladin',
      'ranger': 'ranger', 'stregone': 'sorcerer', 'warlock': 'warlock'}
SCUOLE = '|'.join(SC)
rx1 = re.compile(rf'^({SCUOLE}) di (\d)º livello \((.*)$', re.I)
rx0 = re.compile(rf'^Trucchetto di ({SCUOLE}) \((.*)$', re.I)
pie = re.compile(r'^(System Reference Document 5\.2\.1|\d{1,3})$')
CAMPI = ('Tempo di lancio', 'Gittata', 'Componenti', 'Durata')
MANUALI = {  # uguali su tutti gli attributi: si distinguono solo dal nome
    'acid-splash': 'Fiotto acido', 'ray-of-frost': 'Raggio di gelo', 'fly': 'Volare', 'gaseous-form': 'Forma gassosa',
    'divine-smite': 'Punizione divina', 'searing-smite': 'Punizione incandescente', 'barkskin': 'Pelle coriacea',
}

def pulisci(linee):
    t = '\n'.join(l for l in linee if not pie.match(l.strip()))
    t = re.sub(r'(\w)-\n(\w)', r'\1\2', t)                 # parole spezzate a fine riga
    t = re.sub(r'\n(?=(Utilizzo di uno slot incantesimo di livello superiore|Trucchetto potenziato)\.)', '\n\n', t)
    t = re.sub(r'(?<!\n)\n(?!\n)', ' ', t)
    return re.sub(r' {2,}', ' ', t).strip()

inizio = max(i for i, l in enumerate(righe) if l.strip() == 'Descrizioni degli incantesimi')
it, i = [], inizio + 1
while i < len(righe):
    l = righe[i].strip()
    m1, m0 = rx1.match(l), rx0.match(l)
    if not (m1 or m0):
        i += 1
        continue
    nome = righe[i - 1].strip()
    scuola, liv, cl = (SC[m1.group(1).lower()], int(m1.group(2)), m1.group(3)) if m1 else (SC[m0.group(1).lower()], 0, m0.group(2))
    j = i
    while ')' not in cl:
        j += 1
        cl += ' ' + righe[j].strip()
    classi = sorted(CL[c.strip()] for c in cl[:cl.index(')')].split(',') if c.strip() in CL)
    # Intestazione: i quattro campi (a volte su più righe, a volte «Componente:» al singolare)
    campi, k, chiave = {}, j + 1, None
    while k < len(righe):
        t = righe[k].strip()
        if rx1.match(t) or rx0.match(t):
            break
        mm = re.match(r'^(Tempo di lancio|Gittata|Component[ei]|Durata): (.*)$', t)
        if mm:
            chiave = 'Componenti' if mm.group(1).startswith('Component') else mm.group(1)
            campi[chiave] = mm.group(2)
        elif chiave and chiave != 'Durata' and not pie.match(t):
            campi[chiave] += ' ' + t
        elif chiave == 'Durata':
            break                                            # finita l'intestazione: comincia il testo
        k += 1
    testo = []
    while k < len(righe):
        t = righe[k].strip()
        if rx1.match(t) or rx0.match(t):
            testo = testo[:-1]                               # l'ultima riga era il nome del successivo
            break
        testo.append(t)
        k += 1
    it.append(dict(nome=nome, livello=liv, scuola=scuola, liste=classi, campi=campi, testo=pulisci(testo)))
    i = k

def tratti_it(x):
    g = x['campi'].get('Gittata', '')
    mm = re.match(r'([\d,\.]+) (metri|chilometri)', g)
    gn = float(mm.group(1).replace('.', '').replace(',', '.')) * (1000 if mm.group(2) == 'chilometri' else 1) if mm else g.split(' ')[0].lower()
    c = x['campi'].get('Componenti', '').split('(')[0]
    return dict(rit='rituale' in x['campi'].get('Tempo di lancio', ''), conc=x['campi'].get('Durata', '').lower().startswith('concentrazione'),
                V=bool(re.search(r'\bV\b', c)), S=bool(re.search(r'\bS\b', c)), M='M' in c, g=gn)

def tratti_en(x):
    mm = re.match(r'([\d,]+) (feet|foot|miles?)', x['gittata'])
    gn = (round(float(mm.group(1).replace(',', '')) * 0.3, 1) if 'f' in mm.group(2) else float(mm.group(1)) * 1500) if mm else x['gittata'].split(' ')[0].lower()
    c = x['componenti']
    return dict(rit=x['rituale'], conc=x['concentrazione'], V=bool(c.get('V')), S=bool(c.get('S')), M=bool(c.get('M')), g=gn)

GIT = {'self': 'incantatore', 'touch': 'contatto', 'sight': 'vista', 'unlimited': 'illimitata', 'special': 'speciale'}
def gittata_ok(a, b):
    if isinstance(a, float) and isinstance(b, float):
        return abs(a - b) <= max(1.6, 0.12 * a)
    return isinstance(a, str) and isinstance(b, str) and GIT.get(a, a)[:5] == b[:5]

en = json.load(open(DATI, encoding='utf-8'))
per_nome = {x['nome']: x for x in it}
usati, abbinati = set(), {}
for e in en:
    if e['id'] in MANUALI:
        continue
    te = tratti_en(e)
    cand = [i for i, x in enumerate(it) if i not in usati and x['livello'] == e['livello'] and x['scuola'] == e['scuola'] and x['liste'] == sorted(e['liste'])]
    c2 = [i for i in cand if all(tratti_it(it[i])[k] == te[k] for k in ('rit', 'conc', 'V', 'S', 'M'))]
    c3 = [i for i in c2 if gittata_ok(te['g'], tratti_it(it[i])['g'])]
    scelti = c3 or c2 or cand
    if len(scelti) == 1 and it[scelti[0]]['nome'] not in MANUALI.values():
        abbinati[e['id']] = it[scelti[0]]
        usati.add(scelti[0])
for k, v in MANUALI.items():
    abbinati[k] = per_nome[v]
mancano = [e['id'] for e in en if e['id'] not in abbinati]
assert not mancano and len({v['nome'] for v in abbinati.values()}) == len(en), f'non abbinati: {mancano}'

CAR = {'Forza': 'FOR', 'Destrezza': 'DES', 'Costituzione': 'COS', 'Intelligenza': 'INT', 'Saggezza': 'SAG', 'Carisma': 'CAR'}
DANNI = ['acido', 'contundenti', 'freddo', 'fulmine', 'fuoco', 'forza', 'necrotici', 'perforanti', 'psichici', 'radiosi', 'taglienti', 'tuono', 'veleno']
testi = {}
for e in en:
    x = abbinati[e['id']]
    testo = x['testo']
    base, _, superiori = testo.partition('\n\nUtilizzo di uno slot incantesimo di livello superiore.')
    base, _, potenziato = base.partition('\n\nTrucchetto potenziato.')
    tiro = None
    if re.search(r'(tiro per colpire|attacco)( a distanza| in mischia)? con (un )?incantesimo', testo):
        tiro = {'tipo': 'attacco'}
    else:
        ts = re.search(r'tiro salvezza su (' + '|'.join(CAR) + ')', testo)
        if ts:
            tiro = {'tipo': 'ts', 'car': CAR[ts.group(1)]}
    danni = sorted({d for d in DANNI if re.search(rf'danni (da )?{d}\b', testo)})
    e['nomeEn'] = e.get('nomeEn') or e['nome']
    e['nome'] = x['nome']
    e['it'] = {
        'tempo': x['campi'].get('Tempo di lancio', ''), 'gittata': x['campi'].get('Gittata', ''),
        'componenti': x['campi'].get('Componenti', ''), 'durata': x['campi'].get('Durata', ''),
    }
    testi[e['id']] = {'testo': base.strip(), **({'superiori': superiori.strip()} if superiori else {}),
                      **({'potenziato': potenziato.strip()} if potenziato else {})}
    if tiro: e['tiro'] = tiro
    if danni: e['danni'] = danni

json.dump(en, open(DATI, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
# I testi completi stanno in un file a parte, caricato solo quando si apre la scheda di un incantesimo.
json.dump(testi, open(DATI.with_name('incantesimi-testi.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(f'{len(en)} incantesimi con i dati italiani')
