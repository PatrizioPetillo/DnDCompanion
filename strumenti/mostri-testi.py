# Le schede complete dei mostri dall'SRD 5.2.1 italiano (23/11, scelta di Patrizio: «scheda completa»):
# velocità, caratteristiche con modificatori e tiri salvezza, abilità, resistenze, sensi, lingue,
# e le sezioni Tratti, Azioni, Azioni bonus, Reazioni, Azioni leggendarie con le voci come nel manuale.
# Il nome di ogni voce è il testo in grassetto all'inizio del paragrafo (letto dal PDF, non indovinato).
# Testo dell'SRD così com'è (anche dove il PDF italiano ha un paragrafo fuori posto, es. l'Aboleth).
# Uso:  python3 strumenti/mostri-testi.py IT_SRD_CC_v5.2.1.pdf
import json, re, sys
from pathlib import Path
import pdfplumber

QUI = Path(__file__).resolve().parent
MOSTRI = QUI.parent / 'src/regole/dati/mostri.json'
USCITA = QUI.parent / 'src/regole/dati/mostri-testi.json'
META, ALTO, BASSO = 297, 40, 744
PRIMA, ULTIMA = 202, 405
SEZIONI = ['Tratti', 'Azioni', 'Azioni bonus', 'Reazioni', 'Azioni leggendarie']
ETICHETTE = ['Abilità', 'Vulnerabilità', 'Resistenze', 'Immunità', 'Attrezzatura', 'Sensi', 'Lingue']

def righe_colonna(p, x0, x1):
    cs = [c for c in p.chars if x0 <= c['x0'] < x1 and ALTO <= c['top'] <= BASSO]
    x_col = min((c['x0'] for c in cs if c['text'].strip()), default=x0)
    gruppi = []
    for c in sorted(cs, key=lambda c: (-c['matrix'][5], c['x0'])):
        if gruppi and abs(gruppi[-1][0] - c['matrix'][5]) < 2.5: gruppi[-1][1].append(c)
        else: gruppi.append([c['matrix'][5], [c]])
    out = []
    for _, l in gruppi:
        l.sort(key=lambda c: c['x0'])
        testo, grassetto, prima, ancora_b = '', '', None, True
        for c in l:
            spazio = prima is not None and c['x0'] - prima['x1'] > min(c['size'], prima['size']) * 0.18 and not testo.endswith(' ') and c['text'] != ' '
            if spazio: testo += ' '
            testo += c['text']
            if ancora_b and c['text'].strip() and 'Bold' not in c['fontname']: ancora_b = False
            if ancora_b: grassetto = testo
            prima = c
        vis = [c for c in l if c['text'].strip()]
        titolo = bool(vis) and all(c['size'] >= 11.5 for c in vis)
        tabella = not titolo and bool(vis) and all('GillSans' in c['fontname'] for c in vis)
        sezione = not titolo and bool(vis) and all(c['size'] >= 9.5 and 'GillSans' in c['fontname'] for c in vis)
        rientro = bool(vis) and vis[0]['x0'] - x_col > 4
        out.append(dict(titolo=titolo, tabella=tabella, sezione=sezione, rientro=rientro, b=grassetto.strip(), t=testo.strip()))
    return out

def unisci(righe):
    """Righe di un paragrafo in un testo: parole spezzate ricucite."""
    s = ''
    for r in righe:
        if s.endswith('-') and r[:1].islower(): s = s[:-1] + r
        elif s: s += ' ' + r
        else: s = r
    return re.sub(r'\s+', ' ', s).strip()

import pickle, os
CACHE = '/tmp/mostri-righe.pkl'
if os.path.exists(CACHE) and '--cache' in sys.argv: R = pickle.load(open(CACHE, 'rb'))
else:
    pdf = pdfplumber.open(sys.argv[1])
    R = []
    for n in range(PRIMA, ULTIMA + 1):
        p = pdf.pages[n - 1]
        for r in righe_colonna(p, 0, META) + righe_colonna(p, META, p.width):
            r['pagina'] = n
            if r['t'] and not re.fullmatch(r'\d+', r['t']): R.append(r)
    pickle.dump(R, open(CACHE, 'wb'))

# inizio di ogni scheda: la riga «CA n Iniziativa ±n (n)»
CA = re.compile(r'^CA (\d+)\s+Iniziativa ([+−–-]\d+) \(\d+\)')
inizi = [i for i, r in enumerate(R) if CA.match(r['t'])]

def nome_di(i):
    j = i - 1
    while j > 0 and not R[j]['titolo']: j -= 1
    return R[j]['t'], j

mostri = json.load(open(MOSTRI, encoding='utf-8'))
per_chiave = {}
for m in mostri: per_chiave.setdefault((m['nome'], m['ca']), []).append(m)

testi, mancanti = {}, []
for k, i in enumerate(inizi):
    nome, j_nome = nome_di(i)
    fine = (nome_di(inizi[k + 1])[1] if k + 1 < len(inizi) else len(R))
    # togli in fondo i titoli dei gruppi (es. «Golem di argilla» prima della scheda omonima)
    while fine > i and R[fine - 1]['titolo']: fine -= 1
    blocco = R[i:fine]
    ca = int(CA.match(blocco[0]['t']).group(1))
    cand = per_chiave.get((nome, ca), [])
    pf_m = next((re.match(r'^PF (\d+)', r['t']) for r in blocco if r['t'].startswith('PF ')), None)
    cand = [m for m in cand if pf_m and m['pf'] == int(pf_m.group(1))]
    if len(cand) != 1: mancanti.append(nome); continue
    m = cand[0]

    scheda = {'velocita': '', 'car': {}, 'righe': [], 'sezioni': []}
    q = 1
    # testa: velocità, tabella delle caratteristiche, righe con etichetta, GS
    corrente = None
    while q < len(blocco) and not (blocco[q]['titolo'] and blocco[q]['t'] in SEZIONI):
        t = blocco[q]['t'].lstrip('‖')
        if t.startswith('Velocità '): scheda['velocita'] = t[len('Velocità '):]; corrente = 'velocita'
        elif blocco[q]['tabella'] and re.search(r'\d', t) and not t.startswith('MOD'):
            for nomec, val, mod, salv in re.findall(r'(For|Des|Cos|Int|[Ss]ag|Car) +(\d+) +([+−–-]\d+) ([+−–-]?\d+)', t):
                # refuso del PDF (Drago bianco giovane, Int «−2 2»): senza segno, il tiro salvezza è uguale al modificatore
                if salv[:1].isdigit(): salv = mod if mod.lstrip('+−–-') == salv else '+' + salv
                chiave = {'For': 'FOR', 'Des': 'DES', 'Cos': 'COS', 'Int': 'INT', 'sag': 'SAG', 'Sag': 'SAG', 'Car': 'CAR'}[nomec]
                scheda['car'][chiave] = [int(val), mod.replace('–', '−').replace('-', '−'), salv.replace('–', '−').replace('-', '−')]
            corrente = None
        elif t.startswith('PF ') or t.startswith('MOD'): corrente = None
        elif (e := next((e for e in ETICHETTE if t.startswith(e + ' ')), None)):
            scheda['righe'].append([e, t[len(e) + 1:]]); corrente = 'riga'
        elif t.startswith('GS '):
            scheda['righe'].append(['GS', t[3:]]); corrente = None
            # dopo il GS vengono le sezioni; se no la scheda è finita (Mosca gigante, tra gli oggetti magici)
            if q + 1 < len(blocco) and not (blocco[q + 1]['titolo'] and blocco[q + 1]['t'] in SEZIONI): blocco = blocco[:q + 1]
        elif corrente == 'riga': scheda['righe'][-1][1] = unisci([scheda['righe'][-1][1], t])
        elif corrente == 'velocita': scheda['velocita'] = unisci([scheda['velocita'], t])
        q += 1
    assert len(scheda['car']) == 6, (nome, scheda['car'])

    # sezioni: paragrafi; un paragrafo che comincia in grassetto è una voce nuova («Nome. testo»)
    sez = None
    par, nome_voce, lista = [], None, False
    def chiudi_par():
        global par, nome_voce, lista
        if not par or sez is None: par, nome_voce, lista = [], None, False; return
        testo = unisci(par)
        if lista and sez['voci']:                  # riga di un elenco dentro la voce (Incantesimi «A volontà: …», tabella «1–4 …»)
            sez['voci'][-1]['testo'] += '\n' + testo
            par, nome_voce, lista = [], None, False
            return
        if nome_voce:
            nv = unisci([nome_voce]).rstrip()
            if '. ' in nv: nv = nv[:nv.index('. ') + 1]        # grassetto che va oltre il nome (Triceratopo)
            corpo = (testo[len(nv):] if testo.startswith(nv) else testo).strip().lstrip('.').strip()   # il punto dopo il nome non sempre è in grassetto
            sez['voci'].append({'nome': nv.rstrip('.').strip(), 'testo': corpo})
        elif sez['voci']: sez['voci'][-1]['testo'] += '\n\n' + testo   # paragrafo che continua la voce
        else: sez['intro'] = (sez.get('intro', '') + '\n\n' + testo).strip()
        par, nome_voce, lista = [], None, False
    LISTA = re.compile(r'^(A volontà|\d+/giorno(?: ciascuno)?|\d+(?:[–-]\d+)?)\s*:?\.?$')
    for r in blocco[q:]:
        if r['titolo'] and r['t'] not in SEZIONI: break      # titolo di un gruppo o di un'altra pagina: la scheda è finita
        if r['titolo'] and r['t'] in SEZIONI:
            chiudi_par()
            sez = {'titolo': r['t'], 'voci': []}; scheda['sezioni'].append(sez); continue
        if r['b'] and LISTA.match(r['b']):
            chiudi_par(); par, lista = [r['t']], True; continue
        nuovo_b = bool(r['b']) and len(r['b']) >= 2
        fine_frase = bool(par) and par[-1][-1:] in '.:!?»)'
        if par and (nuovo_b and fine_frase or (r['rientro'] and fine_frase)):
            chiudi_par()
        if not par and nuovo_b: nome_voce = r['b']
        elif par and nome_voce and not fine_frase and nome_voce == unisci(par) and r['b']:
            nome_voce = unisci([nome_voce, r['b']])          # nome della voce su due righe
        par.append(r['t'])
    chiudi_par()
    for s in scheda['sezioni']:
        for v in s['voci']: assert v['nome'] and len(v['nome']) < 90, (nome, v)
    if not scheda['velocita']: del scheda['velocita']
    testi[m['id']] = scheda

json.dump(testi, open(USCITA, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(testi), 'schede;', 'senza abbinamento:', mancanti, '; mostri senza scheda:', [m['nome'] for m in mostri if m['id'] not in testi])
