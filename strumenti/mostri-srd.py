# Elenco dei mostri dell'SRD per gli incontri del master (23/11): solo i numeri, nessuna tattica.
# Nome italiano e tipo dall'SRD 5.2.1 IT; nome inglese e pagina dall'SRD 5.2. CA, iniziativa, PF, GS, PE e immunità
# alle condizioni sono letti dalle schede; inglese e italiano si abbinano per i numeri (CA, iniziativa, PF, dadi, GS,
# punteggi) e il test controlla che coincidano tutti.
# Uso:  python3 strumenti/colonne-it.py IT_SRD_CC_v5.2.1.pdf 202 405 it_mostri.txt
#       python3 strumenti/mostri-srd.py srd.txt it_mostri.txt
import json, re, sys
from pathlib import Path

USCITA = Path(__file__).resolve().parent.parent / 'src/regole/dati/mostri.json'
CONDIZIONI = ['accecato', 'affascinato', 'afferrato', 'assordato', 'avvelenato', 'incapacitato', 'indebolimento', 'invisibile',
              'paralizzato', 'pietrificato', 'privo di sensi', 'prono', 'spaventato', 'stordito', 'trattenuto']
meno = lambda s: s.replace('−', '-').replace('–', '-')

def blocchi(righe, rx_ca, rx_pf, rx_gs, rx_imm, titolo):
    out = []
    for i, l in enumerate(righe):
        m = rx_ca.match(l.lstrip('‖'))
        if not m: continue
        j = i - 1
        while j > 0 and not righe[j].strip(): j -= 1
        tipo = righe[j].strip()
        j -= 1
        while j > 0 and not righe[j].strip(): j -= 1
        nome = titolo(righe[j])
        if nome is None:                       # il tipo è andato a capo su due righe
            tipo = righe[j].strip() + ' ' + tipo
            j -= 1
            nome = titolo(righe[j])
        k, pf, gs, pe, imm, car = i + 1, None, None, None, '', []
        while k < len(righe) and k < i + 40:
            t = righe[k].lstrip('‖').strip()
            if rx_ca.match(t): break
            if pf is None and (mm := rx_pf.match(t)): pf = (int(mm.group(1)), re.sub(r'\s', '', meno(mm.group(2))))
            if re.match(r'^(Str|Int|For) \d', t):
                car += [int(x) for x in re.findall(r'(?:Str|Dex|Con|Int|Wis|Cha|For|Des|Cos|sag|Sag|Car) (\d+)', t)]
            if mm := rx_imm.match(t):
                imm, q = mm.group(1), k + 1          # l'elenco può andare a capo più volte, fino ai sensi
                while q < len(righe) and q < k + 5 and not re.match(r'^(Sensi|Senses|Lingue|Languages|Attrezzatura|Gear|GS |CR )', righe[q].lstrip('‖')):
                    imm += ' ' + righe[q].lstrip('‖').strip(); q += 1
            if mm := rx_gs.match(t):
                gs, pe = mm.group(1), int(mm.group(2).replace(',', '').replace('.', ''))
                break
            k += 1
        if pf and gs:
            out.append(dict(riga=i, nome=nome, tipo=tipo, ca=int(m.group(1)), iniziativa=int(meno(m.group(2))), pf=pf, gs=gs, pe=pe, imm=imm, car=car))
    return out

en_r = open(sys.argv[1], encoding='utf-8').read().replace('\r', '').split('\n')
it_r = open(sys.argv[2], encoding='utf-8').read().split('\n')
EN = blocchi(en_r, re.compile(r'^AC (\d+)\s+Initiative ([+−–-]\d+) \(\d+\)'), re.compile(r'^HP (\d+) \(([^)]*)\)'),
             re.compile(r'^CR (\S+) \((?:XP )?([\d,]+)'), re.compile(r'^Immunities (.*)'), lambda l: l.strip() or None)
IT = blocchi(it_r, re.compile(r'^CA (\d+)\s+Iniziativa ([+−–-]\d+) \(\d+\)'), re.compile(r'^PF (\d+) \(([^)]*)\)'),
             re.compile(r'^GS (\S+) \(PE ([\d.]+)'), re.compile(r'^Immunità (.*)'), lambda l: l.strip()[1:] if l.startswith('¶') else None)

# Pagina dell'SRD 5.2: la riga «N System Reference Document 5.2» è l'intestazione, il testo dopo è a pagina N
intest = [(i, int(m.group(1))) for i, l in enumerate(en_r) if (m := re.match(r'^(\d+) System Reference Document 5\.2\s*$', l))]
pagina = lambda riga: max((p for i, p in intest if i < riga), default=None)

chiave = lambda x, n=6: (x['ca'], x['iniziativa'], x['pf'][0], x['gs'], x['pf'][1], tuple(x['car']))[:n]
usati, coppie = set(), []
for e in EN:
    for n in (6, 5):                            # con i punteggi; senza, se una riga dei punteggi è andata a capo
        c = [k for k, x in enumerate(IT) if k not in usati and chiave(x, n) == chiave(e, n)]
        if len(c) == 1:
            usati.add(c[0]); coppie.append((e, IT[c[0]])); break
    else:
        raise SystemExit(f'senza italiano: {e["nome"]}')

def immunita(testo):
    parte = testo.split(';')[1] if ';' in testo else testo
    ids = [c.replace(' ', '-') for c in CONDIZIONI if re.search(rf'\b{c}\b', parte)]
    nota = re.findall(r'\(([^)]*)\)', parte)
    return ids, nota

# Nel testo dell'SRD 5.2 il titolo di qualche scheda è andato perso e al suo posto c'è l'intestazione della pagina
# (il Cavaliere risulta «Iron Golem»): si corregge qui, e il controllo sotto vieta i nomi inglesi doppi.
NOME_EN = {'Cavaliere': 'Knight'}
for e, x in coppie:
    if x['nome'] in NOME_EN: e['nome'] = NOME_EN[x['nome']]
doppi = {e['nome'] for e, _ in coppie if sum(1 for f, _ in coppie if f['nome'] == e['nome']) > 1}
assert not doppi, f'nomi inglesi doppi: {doppi}'

def slug(s): return re.sub(r'[^a-z0-9]+', '-', s.lower().replace('’', '')).strip('-')
mostri = []
for e, x in coppie:
    ids, nota = immunita(x['imm'])
    mostri.append({'id': slug(e['nome']), 'nome': x['nome'], 'nomeEn': e['nome'], 'tipo': x['tipo'], 'ca': x['ca'], 'iniziativa': x['iniziativa'],
                   'pf': x['pf'][0], 'dadiPf': x['pf'][1], 'gs': x['gs'], 'pe': x['pe'],
                   **({'immunita': ids} if ids else {}), **({'notaImmunita': '; '.join(nota)} if nota and ids else {}),
                   'srd': {'pagina': pagina(e['riga'])}})
# Solo nell'SRD 5.2.1 (la Piovra, citata da Trova famiglio): niente pagina dell'SRD 5.2
for k, x in enumerate(IT):
    if k not in usati and x['gs'] not in ('nessuno',):
        ids, nota = immunita(x['imm'])
        mostri.append({'id': slug(x['nome']), 'nome': x['nome'], 'nomeEn': 'Octopus' if x['nome'] == 'Piovra' else '', 'tipo': x['tipo'], 'ca': x['ca'], 'iniziativa': x['iniziativa'],
                       'pf': x['pf'][0], 'dadiPf': x['pf'][1], 'gs': x['gs'], 'pe': x['pe'], **({'immunita': ids} if ids else {}), 'solo521': True})
EN_C = {'Blinded': 'accecato', 'Charmed': 'affascinato', 'Grappled': 'afferrato', 'Deafened': 'assordato', 'Poisoned': 'avvelenato',
        'Incapacitated': 'incapacitato', 'Exhaustion': 'indebolimento', 'Invisible': 'invisibile', 'Paralyzed': 'paralizzato',
        'Petrified': 'pietrificato', 'Unconscious': 'privo-di-sensi', 'Prone': 'prono', 'Frightened': 'spaventato', 'Stunned': 'stordito', 'Restrained': 'trattenuto'}
for (e, _), m in zip(coppie, mostri):
    attese = sorted(v for k, v in EN_C.items() if re.search(rf'\b{k}\b', e['imm']))
    assert attese == sorted(m.get('immunita', [])), f"immunità diverse per {e['nome']}: {attese} / {m.get('immunita')}"
mostri.sort(key=lambda m: m['nome'].lower())
json.dump(mostri, open(USCITA, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(mostri), 'mostri')
