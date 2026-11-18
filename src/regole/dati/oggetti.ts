// Tutti gli oggetti: armature (da base.ts), armi, focus, dotazioni, strumenti ed equipaggiamento d'avventura.
// Prezzi e contenuti dall'SRD 5.2 (p. 89-98), nomi dall'SRD 5.2.1 italiano (p. 104-112).
// Prezzi in monete d'oro: 1 ma = 0,1 mo, 1 mr = 0,01 mo (p. 89).
import type { CategoriaOggetto, Oggetto, TipoFocus } from '../tipi';
import { ARMI, OGGETTI as ARMATURE, STRUMENTI_ARTIGIANO, STRUMENTI_MUSICALI } from './base';

// ───────── Armi (p. 91): prezzo, gittata in piedi, danni a due mani ─────────
export const COSTO_ARMI: Record<string, number> = {
  club: 0.1, dagger: 2, greatclub: 0.2, handaxe: 5, javelin: 0.5, 'light-hammer': 2, mace: 5, quarterstaff: 0.2, sickle: 1, spear: 1,
  dart: 0.05, 'light-crossbow': 25, shortbow: 25, sling: 0.1,
  battleaxe: 10, flail: 10, glaive: 20, greataxe: 30, greatsword: 50, halberd: 20, lance: 10, longsword: 15, maul: 10, morningstar: 15,
  pike: 5, rapier: 25, scimitar: 25, shortsword: 10, trident: 5, warhammer: 15, 'war-pick': 5, whip: 2,
  blowgun: 10, 'hand-crossbow': 75, 'heavy-crossbow': 50, longbow: 50, musket: 500, pistol: 250,
};
export const GITTATA_ARMI: Record<string, [number, number]> = {
  dagger: [20, 60], handaxe: [20, 60], javelin: [30, 120], 'light-hammer': [20, 60], spear: [20, 60], trident: [20, 60],
  dart: [20, 60], 'light-crossbow': [80, 320], shortbow: [80, 320], sling: [30, 120],
  blowgun: [25, 100], 'hand-crossbow': [30, 120], 'heavy-crossbow': [100, 400], longbow: [150, 600], musket: [40, 120], pistol: [30, 90],
};
export const DUE_MANI_ARMI: Record<string, string> = {   // Versatile (p. 90)
  quarterstaff: '1d8', spear: '1d8', battleaxe: '1d10', longsword: '1d10', trident: '1d10', warhammer: '1d10', 'war-pick': '1d10',
};

const ogg = (id: string, nome: string, nomeEn: string, costoMo: number | undefined, categoria: CategoriaOggetto, extra: Partial<Oggetto> = {}): Oggetto =>
  ({ id, nome, nomeEn, srd: { pagina: 94 }, ...(costoMo !== undefined ? { costoMo } : {}), categoria, ...extra });
const focus = (id: string, nome: string, nomeEn: string, costoMo: number | undefined, f: TipoFocus, arma?: string): Oggetto =>
  ogg(id, nome, nomeEn, costoMo, 'focus', { focus: f, srd: { pagina: 96 }, ...(arma ? { arma } : {}) });
const pack = (id: string, nome: string, nomeEn: string, costoMo: number, contenuto: [string, number][]): Oggetto =>
  ogg(id, nome, nomeEn, costoMo, 'dotazione', { srd: { pagina: 95 }, contenuto: contenuto.map(([oggetto, quantita]) => ({ oggetto, quantita })) });

// Prezzi degli strumenti (p. 94-95)
const COSTO_ARTIGIANO: Record<string, number> = {
  'alchemists-supplies': 50, 'brewers-supplies': 20, 'calligraphers-supplies': 10, 'carpenters-tools': 8, 'cartographers-tools': 15,
  'cobblers-tools': 5, 'cooks-utensils': 1, 'glassblowers-tools': 30, 'jewelers-tools': 25, 'leatherworkers-tools': 5, 'masons-tools': 10,
  'painters-supplies': 10, 'potters-tools': 10, 'smiths-tools': 20, 'tinkers-tools': 50, 'weavers-tools': 1, 'woodcarvers-tools': 1,
};
const COSTO_MUSICALI: Record<string, number> = {
  bagpipes: 30, drum: 6, dulcimer: 25, flute: 2, horn: 3, lute: 35, lyre: 30, 'pan-flute': 12, shawm: 2, viol: 30,
};
const GIOCHI: [string, string, string, number][] = [
  ['dice', 'Dadi', 'Dice', 0.1], ['dragonchess', 'Scacchi dei draghi', 'Dragonchess', 1],
  ['playing-cards', 'Carte da gioco', 'Playing Cards', 0.5], ['three-dragon-ante', 'Tre draghi al buio', 'Three-Dragon Ante', 1],
];

const lista: Oggetto[] = [
  // Armi: l'id è quello di ARMI
  ...Object.entries(ARMI).map(([id, a]) => ogg(id, a.nome, a.nomeEn, COSTO_ARMI[id], 'arma', { arma: id, srd: { pagina: 91 } })),

  // Focus (p. 96-97) e borsa per componenti (p. 96)
  focus('arcane-focus-crystal', 'Focus arcano (cristallo)', 'Arcane Focus (crystal)', 10, 'arcano'),
  focus('arcane-focus-orb', 'Focus arcano (globo)', 'Arcane Focus (orb)', 20, 'arcano'),
  focus('arcane-focus-rod', 'Focus arcano (verga)', 'Arcane Focus (rod)', 10, 'arcano'),
  focus('arcane-focus-quarterstaff', 'Focus arcano (bastone)', 'Arcane Focus (staff)', 5, 'arcano', 'quarterstaff'),
  focus('arcane-focus-wand', 'Focus arcano (bacchetta)', 'Arcane Focus (wand)', 10, 'arcano'),
  focus('druidic-focus-mistletoe', 'Focus druidico (rametto di vischio)', 'Druidic Focus (sprig of mistletoe)', 1, 'druidico'),
  focus('druidic-focus-quarterstaff', 'Focus druidico (bastone di legno)', 'Druidic Focus (wooden staff)', 5, 'druidico', 'quarterstaff'),
  focus('druidic-focus-yew-wand', 'Focus druidico (bacchetta in legno di tasso)', 'Druidic Focus (yew wand)', 10, 'druidico'),
  focus('holy-symbol', 'Simbolo sacro', 'Holy Symbol', 5, 'sacro'),
  focus('component-pouch', 'Borsa per componenti', 'Component Pouch', 25, 'componenti'),
  ogg('spellbook', 'Libro degli incantesimi', 'Spellbook', undefined, 'oggetto', { srd: { pagina: 77 } }),

  // Dotazioni (p. 95-98)
  pack('burglars-pack', 'Dotazione da scassinatore', "Burglar's Pack", 16, [['backpack', 1], ['ball-bearings', 1], ['bell', 1], ['candle', 10], ['crowbar', 1], ['hooded-lantern', 1], ['oil', 7], ['rations', 5], ['rope', 1], ['tinderbox', 1], ['waterskin', 1]]),
  pack('diplomats-pack', 'Dotazione da diplomatico', "Diplomat's Pack", 39, [['chest', 1], ['fine-clothes', 1], ['ink', 1], ['ink-pen', 5], ['lamp', 1], ['map-case', 2], ['oil', 4], ['paper', 5], ['parchment', 5], ['perfume', 1], ['tinderbox', 1]]),
  pack('dungeoneers-pack', 'Dotazione da avventuriero', "Dungeoneer's Pack", 12, [['backpack', 1], ['caltrops', 1], ['crowbar', 1], ['oil', 2], ['rations', 10], ['rope', 1], ['tinderbox', 1], ['torch', 10], ['waterskin', 1]]),
  pack('entertainers-pack', 'Dotazione da intrattenitore', "Entertainer's Pack", 40, [['backpack', 1], ['bedroll', 1], ['bell', 1], ['bullseye-lantern', 1], ['costume', 3], ['mirror', 1], ['oil', 8], ['rations', 9], ['tinderbox', 1], ['waterskin', 1]]),
  pack('explorers-pack', 'Dotazione da esploratore', "Explorer's Pack", 10, [['backpack', 1], ['bedroll', 1], ['oil', 2], ['rations', 10], ['rope', 1], ['tinderbox', 1], ['torch', 10], ['waterskin', 1]]),
  pack('priests-pack', 'Dotazione da sacerdote', "Priest's Pack", 33, [['backpack', 1], ['blanket', 1], ['holy-water', 1], ['lamp', 1], ['rations', 7], ['robe', 1], ['tinderbox', 1]]),
  pack('scholars-pack', 'Dotazione da studioso', "Scholar's Pack", 40, [['backpack', 1], ['book', 1], ['ink', 1], ['ink-pen', 1], ['lamp', 1], ['oil', 10], ['parchment', 10], ['tinderbox', 1]]),

  // Strumenti (p. 94-95)
  ...Object.entries(STRUMENTI_ARTIGIANO).map(([id, nome]) => ogg(id, nome, id, COSTO_ARTIGIANO[id], 'strumento')),
  ...Object.entries(STRUMENTI_MUSICALI).map(([id, nome]) => ogg(id, nome, id, COSTO_MUSICALI[id], 'strumento', { focus: 'strumentoMusicale' })),
  ...GIOCHI.map(([id, nome, nomeEn, c]) => ogg(id, nome, nomeEn, c, 'strumento')),
  ogg('thieves-tools', 'Arnesi da scasso', "Thieves' Tools", 25, 'strumento'),
  ogg('herbalism-kit', 'Borsa da erborista', 'Herbalism Kit', 5, 'strumento'),
  ogg('disguise-kit', 'Trucchi per il camuffamento', 'Disguise Kit', 25, 'strumento'),
  ogg('forgery-kit', 'Arnesi da falsario', 'Forgery Kit', 15, 'strumento'),
  ogg('navigators-tools', 'Strumenti da navigatore', "Navigator's Tools", 25, 'strumento'),
  ogg('poisoners-kit', 'Sostanze da avvelenatore', "Poisoner's Kit", 50, 'strumento'),

  // Oggetti «a scelta» dei pacchetti iniziali: diventano quello scelto
  ogg('musical-instrument', 'Strumento musicale a scelta', 'Musical Instrument', undefined, 'strumento',
    { daScelta: 'bard.equip.strumento', opzioni: Object.keys(STRUMENTI_MUSICALI), focus: 'strumentoMusicale' }),
  ogg('artisans-tools-or-instrument', 'Strumento scelto per la competenza', "Artisan's Tools or Musical Instrument", undefined, 'strumento', { daScelta: 'monk.strumento' }),
  ogg('gaming-set', 'Gioco scelto per la competenza', 'Gaming Set', undefined, 'strumento', { daScelta: 'soldier.gioco' }),

  // Equipaggiamento d'avventura (p. 95-98) e munizioni (p. 96)
  ogg('arrows', 'Frecce', 'Arrows', 0.05, 'oggetto'),
  ogg('bolts', 'Quadrelli', 'Bolts', 0.05, 'oggetto'),
  ogg('quiver', 'Faretra', 'Quiver', 1, 'oggetto'),
  ogg('backpack', 'Zaino', 'Backpack', 2, 'oggetto'),
  ogg('ball-bearings', 'Sfere metalliche', 'Ball Bearings', 1, 'oggetto'),
  ogg('bedroll', 'Giaciglio', 'Bedroll', 1, 'oggetto'),
  ogg('bell', 'Campana', 'Bell', 1, 'oggetto'),
  ogg('blanket', 'Coperta', 'Blanket', 0.5, 'oggetto'),
  ogg('book', 'Libro', 'Book', 25, 'oggetto'),
  ogg('book-prayers', 'Libro (preghiere)', 'Book (prayers)', 25, 'oggetto'),
  ogg('book-history', 'Libro (storia)', 'Book (history)', 25, 'oggetto'),
  ogg('book-occult-lore', 'Libro (scienze occulte)', 'Book (occult lore)', 25, 'oggetto'),
  ogg('caltrops', 'Triboli', 'Caltrops', 1, 'oggetto'),
  ogg('candle', 'Candela', 'Candle', 0.01, 'oggetto'),
  ogg('chest', 'Forziere', 'Chest', 5, 'oggetto'),
  ogg('costume', 'Costume', 'Costume', 5, 'oggetto'),
  ogg('crowbar', 'Piede di porco', 'Crowbar', 2, 'oggetto'),
  ogg('fine-clothes', 'Abiti eleganti', 'Fine Clothes', 15, 'oggetto'),
  ogg('travelers-clothes', 'Abiti da viaggiatore', "Traveler's Clothes", 2, 'oggetto'),
  ogg('healers-kit', 'Borsa del guaritore', "Healer's Kit", 5, 'oggetto'),
  ogg('holy-water', 'Acqua santa', 'Holy Water', 25, 'oggetto'),
  ogg('hooded-lantern', 'Lanterna schermabile', 'Hooded Lantern', 5, 'oggetto'),
  ogg('bullseye-lantern', 'Lanterna a lente sporgente', 'Bullseye Lantern', 10, 'oggetto'),
  ogg('ink', 'Inchiostro', 'Ink', 10, 'oggetto'),
  ogg('ink-pen', 'Pennino', 'Ink Pen', 0.02, 'oggetto'),
  ogg('lamp', 'Lampada', 'Lamp', 0.5, 'oggetto'),
  ogg('map-case', 'Custodia per mappe o pergamene', 'Case, Map or Scroll', 1, 'oggetto'),
  ogg('mirror', 'Specchio', 'Mirror', 5, 'oggetto'),
  ogg('oil', 'Olio (ampolla)', 'Oil', 0.1, 'oggetto'),
  ogg('paper', 'Carta (foglio)', 'Paper', 0.2, 'oggetto'),
  ogg('parchment', 'Pergamena (foglio)', 'Parchment', 0.1, 'oggetto'),
  ogg('perfume', 'Profumo', 'Perfume', 5, 'oggetto'),
  ogg('pouch', 'Borsa', 'Pouch', 0.5, 'oggetto'),
  ogg('rations', 'Razioni (giorno)', 'Rations', 0.5, 'oggetto'),
  ogg('robe', 'Tunica', 'Robe', 1, 'oggetto'),
  ogg('rope', 'Corda', 'Rope', 1, 'oggetto'),
  ogg('tinderbox', 'Acciarino con pietra focaia', 'Tinderbox', 0.5, 'oggetto'),
  ogg('torch', 'Torcia', 'Torch', 0.01, 'oggetto'),
  ogg('waterskin', 'Otre', 'Waterskin', 0.2, 'oggetto'),
];

export const OGGETTI: Record<string, Oggetto> = {
  ...Object.fromEntries(Object.values(ARMATURE).map((o) => [o.id, { ...o, categoria: 'armatura' as const }])),
  ...Object.fromEntries(lista.map((o) => [o.id, o])),
};
