# Prepara i dati per l'esportazione verso Foundry VTT (22/11).
# Legge i pacchetti ufficiali del sistema D&D5e (github.com/foundryvtt/dnd5e, cartella packs/_source, licenza CC-BY-4.0 per i contenuti SRD)
# e scrive src/esporta/foundry/dati.json con i soli documenti che servono a un personaggio di 1° livello creato con l'app.
# Uso: python3 scripts/foundry-dati.py <cartella del repository dnd5e> <file con gli id dell'app (JSON)>
import glob, json, os, re, sys
import yaml

REPO, NOSTRI = sys.argv[1], sys.argv[2]
SRC = os.path.join(REPO, 'packs', '_source')
PACCHETTI = ['classes24', 'origins24', 'feats24', 'spells24', 'equipment24']
nostri = json.load(open(NOSTRI))

# Tutti i documenti, per _id
tutti = {}
for pacco in PACCHETTI:
    for f in glob.glob(f'{SRC}/{pacco}/**/*.yml', recursive=True):
        if f.endswith('_folder.yml'):
            continue
        d = yaml.safe_load(open(f, encoding='utf-8'))
        if 'system' not in d:
            continue
        d['_pacco'] = pacco
        tutti[d['_id']] = d

def per_ident(pacco, tipo, ident):
    for d in tutti.values():
        if d['_pacco'] == pacco and d['type'] in tipo and d['system'].get('identifier') == ident:
            return d
    return None

def avanzamenti(d):
    a = d['system'].get('advancement') or []
    return list(a.values()) if isinstance(a, dict) else a

def uuid_id(u):
    return u.rsplit('.', 1)[-1]

servono = set()
def prendi(d):
    if d is not None:
        servono.add(d['_id'])
    return d

indice = {'classe': {}, 'specie': {}, 'background': {}, 'talento': {}, 'incantesimo': {}, 'oggetto': {}, 'strumento': {}, 'magico': {}}

# Classi e privilegi concessi o tra cui scegliere al 1° livello
for c in ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard']:
    d = prendi(per_ident('classes24', ('class',), c))
    indice['classe'][c] = d['_id']
    for a in avanzamenti(d):
        if a['type'] in ('ItemGrant', 'ItemChoice') and (a.get('level') in (1, None) or str(a.get('level')) == '1'):
            for it in (a['configuration'].get('items') or []) + (a['configuration'].get('pool') or []):
                prendi(tutti.get(uuid_id(it['uuid'] if isinstance(it, dict) else it)))

# Specie con i loro tratti; background; talenti (origine e stili di combattimento)
for s in ['dragonborn', 'dwarf', 'elf', 'gnome', 'goliath', 'halfling', 'human', 'orc', 'tiefling']:
    d = prendi(per_ident('origins24', ('race',), s))
    indice['specie'][s] = d['_id']
    for a in avanzamenti(d):
        for it in (a.get('configuration', {}).get('items') or []) + (a.get('configuration', {}).get('pool') or []):
            prendi(tutti.get(uuid_id(it['uuid'] if isinstance(it, dict) else it)))
for b in ['acolyte', 'criminal', 'sage', 'soldier']:
    indice['background'][b] = prendi(per_ident('origins24', ('background',), b))['_id']
for d in list(tutti.values()):
    if d['_pacco'] == 'feats24' and d['type'] == 'feat':
        prendi(d)
        indice['talento'][d['system'].get('identifier')] = d['_id']

# Incantesimi fino al 1° livello (il personaggio dell'app è di 1° livello)
ALIAS_INC = {'floating-disk': 'tensers-floating-disk', 'irresistible-dance': 'ottos-irresistible-dance'}
for sp in nostri['sp']:
    d = per_ident('spells24', ('spell',), ALIAS_INC.get(sp, sp))
    if d and d['system'].get('level', 9) <= 1:
        indice['incantesimo'][sp] = prendi(d)['_id']

# Equipaggiamento: stesso identificatore, oppure l'equivalente di Foundry (con il nome da usare)
ALIAS_OGG = {
    'arcane-focus-crystal': 'crystal', 'arcane-focus-orb': 'orb', 'arcane-focus-rod': 'rod', 'arcane-focus-quarterstaff': 'staff',
    'arcane-focus-wand': 'wand', 'druidic-focus-mistletoe': 'sprig-of-mistletoe', 'druidic-focus-quarterstaff': 'wooden-staff',
    'druidic-focus-yew-wand': 'yew-wand', 'holy-symbol': 'amulet', 'spellbook': 'book', 'book-prayers': 'book', 'book-history': 'book',
    'book-occult-lore': 'book', 'travelers-clothes': 'clothes-travelers', 'map-case': 'map-or-scroll-case',
}
NOMI = {'spellbook': 'Spellbook', 'book-prayers': 'Book (Prayers)', 'book-history': 'Book (History)', 'book-occult-lore': 'Book (Occult Lore)', 'holy-symbol': 'Holy Symbol (Amulet)'}
TIPI_OGG = ('weapon', 'equipment', 'consumable', 'container', 'tool', 'loot')
for o in nostri['ogg']:
    d = per_ident('equipment24', TIPI_OGG, ALIAS_OGG.get(o, o))
    if d:
        indice['oggetto'][o] = {'doc': prendi(d)['_id'], **({'nome': NOMI[o]} if o in NOMI else {})}

# Oggetti magici dell'app: quelli con un documento proprio in Foundry; armi e armature +N restano l'oggetto base con il bonus
ALIAS_MAG = {'wand-of-the-war-mage': '1-wand-of-the-war-mage', 'stone-of-good-luck': 'stone-of-good-luck-luckstone'}
for m in nostri['magici']:
    if m['id'] in ('weapon-plus', 'armor-plus', 'shield-plus', 'ammunition-plus'):
        continue
    if m['id'] in ('belt-of-giant-strength', 'potion-of-healing'):
        for v in m['varianti']:
            if m['id'] == 'potion-of-healing':
                cand = {'base': 'potion-of-healing', 'greater': 'greater-potion-of-healing', 'superior': 'superior-potion-of-healing', 'supreme': 'supreme-potion-of-healing'}[v]
                d = per_ident('equipment24', TIPI_OGG, cand)
            else:   # le cinture hanno lo stesso identificatore: si distinguono dal nome, «(frost)», «(hill)»…
                chiave = v.split('-')[0]
                d = next((x for x in tutti.values() if x['_pacco'] == 'equipment24' and x['name'].lower() == f'belt of giant strength ({chiave})'), None)
            if d:
                indice['magico'][f"{m['id']}:{v}"] = prendi(d)['_id']
        continue
    d = per_ident('equipment24', TIPI_OGG, ALIAS_MAG.get(m['id'], m['id']))
    if d:
        indice['magico'][m['id']] = prendi(d)['_id']

# Strumenti: chiave di Foundry (DND5E.tools) per l'identificatore del documento
config = open(os.path.join(REPO, 'module', 'config.mjs'), encoding='utf-8').read()
for chiave, ident in re.findall(r'\n  (\w+): \{\s*\n\s*ability: "\w+",\s*\n\s*id: "Compendium\.dnd5e\.equipment24\.Item\.(\w+)"', config):
    d = tutti.get(ident)
    if d:
        indice['strumento'][d['system'].get('identifier')] = chiave
        prendi(d)

# Documenti ripuliti: via cartelle e ordinamenti, con la provenienza dal compendio (serve ai moduli di traduzione)
def pulito(d):
    d = {k: v for k, v in d.items() if k not in ('folder', 'sort', 'ownership', '_key', '_pacco')}
    return d
documenti = {}
for i in sorted(servono):
    d = tutti[i]
    documenti[i] = {**pulito(d), '_stats': {**(d.get('_stats') or {}), 'compendiumSource': f"Compendium.dnd5e.{d['_pacco']}.Item.{i}"}}

sistema = json.load(open(os.path.join(REPO, 'system.json')))
uscita = {'sistema': sistema['version'], 'foundry': sistema['compatibility'], 'indice': indice, 'documenti': documenti}
os.makedirs('src/esporta/foundry', exist_ok=True)
json.dump(uscita, open('src/esporta/foundry/dati.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
mancano = {k: [x for x in (nostri['sp'] if k == 'incantesimo' else nostri['ogg']) if x not in indice[k]] for k in ('oggetto',)}
print('documenti', len(documenti), 'byte', os.path.getsize('src/esporta/foundry/dati.json'))
print({k: len(v) for k, v in indice.items()}, 'oggetti senza documento:', mancano['oggetto'])
print('magici:', sorted(indice['magico']))
