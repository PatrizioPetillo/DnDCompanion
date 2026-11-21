import type { Car, Oggetto } from '../tipi';

// Abilità → caratteristica (SRD 5.2 p. 9)
export const ABILITA: Record<string, { nome: string; nomeEn: string; car: Car }> = {
  acrobatics: { nome: 'Acrobazia', nomeEn: 'Acrobatics', car: 'DES' },
  'animal-handling': { nome: 'Addestrare animali', nomeEn: 'Animal Handling', car: 'SAG' },
  arcana: { nome: 'Arcano', nomeEn: 'Arcana', car: 'INT' },
  athletics: { nome: 'Atletica', nomeEn: 'Athletics', car: 'FOR' },
  deception: { nome: 'Inganno', nomeEn: 'Deception', car: 'CAR' },
  history: { nome: 'Storia', nomeEn: 'History', car: 'INT' },
  insight: { nome: 'Intuizione', nomeEn: 'Insight', car: 'SAG' },
  intimidation: { nome: 'Intimidire', nomeEn: 'Intimidation', car: 'CAR' },
  investigation: { nome: 'Indagare', nomeEn: 'Investigation', car: 'INT' },
  medicine: { nome: 'Medicina', nomeEn: 'Medicine', car: 'SAG' },
  nature: { nome: 'Natura', nomeEn: 'Nature', car: 'INT' },
  perception: { nome: 'Percezione', nomeEn: 'Perception', car: 'SAG' },
  performance: { nome: 'Intrattenere', nomeEn: 'Performance', car: 'CAR' },
  persuasion: { nome: 'Persuasione', nomeEn: 'Persuasion', car: 'CAR' },
  religion: { nome: 'Religione', nomeEn: 'Religion', car: 'INT' },
  'sleight-of-hand': { nome: 'Rapidità di mano', nomeEn: 'Sleight of Hand', car: 'DES' },
  stealth: { nome: 'Furtività', nomeEn: 'Stealth', car: 'DES' },
  survival: { nome: 'Sopravvivenza', nomeEn: 'Survival', car: 'SAG' },
};
export const TUTTE_LE_ABILITA = Object.keys(ABILITA);

export const NOME_CAR: Record<Car, string> = {
  FOR: 'Forza', DES: 'Destrezza', COS: 'Costituzione', INT: 'Intelligenza', SAG: 'Saggezza', CAR: 'Carisma',
};

// Point buy (p. 21), serie standard (p. 21)
export const COSTO_POINT_BUY: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
export const PUNTI_POINT_BUY = 27;
export const SERIE_STANDARD = [15, 14, 13, 12, 10, 8];

// Bonus di competenza (p. 23)
export const COMPETENZA_PER_LIVELLO: Record<number, number> = { 1: 2, 2: 2, 3: 2, 4: 2, 5: 3 };

// Armature e scudo (p. 92)
const arm = (id: string, nome: string, nomeEn: string, categoria: 'leggera' | 'media' | 'pesante' | 'scudo',
  base: number, maxDes: number | null, costoMo: number, forza?: number, svantaggioFurtivita?: boolean): Oggetto =>
  ({ id, nome, nomeEn, srd: { pagina: 92 }, costoMo, armatura: { categoria, base, maxDes, forza, svantaggioFurtivita } });

export const OGGETTI: Record<string, Oggetto> = Object.fromEntries([
  arm('padded-armor', 'Armatura imbottita', 'Padded Armor', 'leggera', 11, null, 5, undefined, true),
  arm('leather-armor', 'Armatura di cuoio', 'Leather Armor', 'leggera', 11, null, 10),
  arm('studded-leather-armor', 'Armatura di cuoio borchiato', 'Studded Leather Armor', 'leggera', 12, null, 45),
  arm('hide-armor', 'Armatura di pelle', 'Hide Armor', 'media', 12, 2, 10),
  arm('chain-shirt', 'Giaco di maglia', 'Chain Shirt', 'media', 13, 2, 50),
  arm('scale-mail', 'Corazza a scaglie', 'Scale Mail', 'media', 14, 2, 50, undefined, true),
  arm('breastplate', 'Corazza di piastre', 'Breastplate', 'media', 14, 2, 400),
  arm('half-plate-armor', 'Mezza armatura', 'Half Plate Armor', 'media', 15, 2, 750, undefined, true),
  arm('ring-mail', 'Corazza ad anelli', 'Ring Mail', 'pesante', 14, 0, 30, undefined, true),
  arm('chain-mail', 'Cotta di maglia', 'Chain Mail', 'pesante', 16, 0, 75, 13, true),
  arm('splint-armor', 'Corazza a strisce', 'Splint Armor', 'pesante', 17, 0, 200, 15, true),
  arm('plate-armor', 'Armatura a piastre', 'Plate Armor', 'pesante', 18, 0, 1500, 15, true),
  arm('shield', 'Scudo', 'Shield', 'scudo', 2, null, 10),
].map((o) => [o.id, o]));
// Nota: i nomi italiani delle armature sono da verificare con il manuale italiano.

// Componenti materiali con costo che un oggetto dell'equipaggiamento soddisfa già.
// Bless: «a Holy Symbol worth 5+ GP» (p. 113); ogni simbolo sacro costa 5 MO (p. 97).
export const MATERIALE_DA_OGGETTO: Record<string, { oggetto: string; srd: { pagina: number } }> = {
  bless: { oggetto: 'holy-symbol', srd: { pagina: 97 } },
};

// Lingue (p. 20-21). Ogni personaggio conosce il Comune più 2 lingue standard.
export const LINGUE_STANDARD: Record<string, string> = {
  'common-sign-language': 'Lingua dei segni comune', draconic: 'Draconico', dwarvish: 'Nanico', elvish: 'Elfico',
  giant: 'Gigante', gnomish: 'Gnomesco', goblin: 'Goblin', halfling: 'Halfling', orc: 'Orchesco',
};
export const LINGUE_RARE: Record<string, string> = {
  abyssal: 'Abissale', celestial: 'Celestiale', 'deep-speech': 'Gergo delle profondità', druidic: 'Druidico',
  infernal: 'Infernale', primordial: 'Primordiale', sylvan: 'Silvano', 'thieves-cant': 'Gergo ladresco', undercommon: 'Sottocomune',
};
export const NOME_LINGUA: Record<string, string> = { common: 'Comune', ...LINGUE_STANDARD, ...LINGUE_RARE };
// Nota: i nomi italiani delle lingue sono da verificare con il manuale italiano.

// Allineamento (p. 21): le nove combinazioni. Il gioco presume personaggi non malvagi.
// Nomi italiani da verificare con il manuale italiano.
export const ALLINEAMENTI: Record<string, { nome: string; sigla: string; malvagio: boolean }> = {
  'lawful-good': { nome: 'Legale buono', sigla: 'LB', malvagio: false },
  'neutral-good': { nome: 'Neutrale buono', sigla: 'NB', malvagio: false },
  'chaotic-good': { nome: 'Caotico buono', sigla: 'CB', malvagio: false },
  'lawful-neutral': { nome: 'Legale neutrale', sigla: 'LN', malvagio: false },
  neutral: { nome: 'Neutrale', sigla: 'N', malvagio: false },
  'chaotic-neutral': { nome: 'Caotico neutrale', sigla: 'CN', malvagio: false },
  'lawful-evil': { nome: 'Legale malvagio', sigla: 'LM', malvagio: true },
  'neutral-evil': { nome: 'Neutrale malvagio', sigla: 'NM', malvagio: true },
  'chaotic-evil': { nome: 'Caotico malvagio', sigla: 'CM', malvagio: true },
};

// Serie standard consigliata per classe (p. 21, «Standard Array by Class»): FOR DES COS INT SAG CAR.
export const SERIE_PER_CLASSE: Record<string, number[]> = {
  barbarian: [15, 13, 14, 10, 12, 8], bard: [8, 14, 12, 13, 10, 15], cleric: [14, 8, 13, 10, 15, 12],
  druid: [8, 12, 14, 13, 15, 10], fighter: [15, 14, 13, 8, 10, 12], monk: [12, 15, 13, 10, 14, 8],
  paladin: [15, 10, 13, 8, 12, 14], ranger: [12, 15, 13, 8, 14, 10], rogue: [12, 15, 13, 14, 10, 8],
  sorcerer: [10, 13, 14, 8, 12, 15], warlock: [8, 14, 13, 12, 10, 15], wizard: [8, 12, 13, 15, 14, 10],
};

// Armi (p. 89; nomi, proprietà e padronanze dell'SRD 5.2.1 italiano, p. 104). Proprietà con le chiavi italiane.
export interface Arma { nome: string; nomeEn: string; categoria: 'semplice' | 'guerra'; tipo: 'mischia' | 'distanza'; danni: string; proprieta: string[]; padronanza: string }
const arma = (nome: string, nomeEn: string, categoria: Arma['categoria'], tipo: Arma['tipo'], danni: string, proprieta: string[], padronanza: string): Arma =>
  ({ nome, nomeEn, categoria, tipo, danni, proprieta, padronanza });
export const ARMI: Record<string, Arma> = {
  club: arma('Randello', 'Club', 'semplice', 'mischia', '1d4 contundenti', ['leggera'], 'Lentezza'),
  dagger: arma('Pugnale', 'Dagger', 'semplice', 'mischia', '1d4 perforanti', ['accurata', 'lancio', 'leggera'], 'Graffio'),
  greatclub: arma('Randello pesante', 'Greatclub', 'semplice', 'mischia', '1d8 contundenti', ['due mani'], 'Spinta'),
  handaxe: arma('Ascia', 'Handaxe', 'semplice', 'mischia', '1d6 taglienti', ['lancio', 'leggera'], 'Vessazione'),
  javelin: arma('Giavellotto', 'Javelin', 'semplice', 'mischia', '1d6 perforanti', ['lancio'], 'Lentezza'),
  'light-hammer': arma('Martello leggero', 'Light Hammer', 'semplice', 'mischia', '1d4 contundenti', ['lancio', 'leggera'], 'Graffio'),
  mace: arma('Mazza', 'Mace', 'semplice', 'mischia', '1d6 contundenti', [], 'Fiaccare'),
  quarterstaff: arma('Bastone ferrato', 'Quarterstaff', 'semplice', 'mischia', '1d6 contundenti', ['versatile'], 'Rovesciamento'),
  sickle: arma('Falcetto', 'Sickle', 'semplice', 'mischia', '1d4 taglienti', ['leggera'], 'Graffio'),
  spear: arma('Lancia', 'Spear', 'semplice', 'mischia', '1d6 perforanti', ['lancio', 'versatile'], 'Fiaccare'),
  dart: arma('Dardo', 'Dart', 'semplice', 'distanza', '1d4 perforanti', ['accurata', 'lancio'], 'Vessazione'),
  'light-crossbow': arma('Balestra leggera', 'Light Crossbow', 'semplice', 'distanza', '1d8 perforanti', ['due mani', 'munizioni', 'ricarica'], 'Lentezza'),
  shortbow: arma('Arco corto', 'Shortbow', 'semplice', 'distanza', '1d6 perforanti', ['due mani', 'munizioni'], 'Vessazione'),
  sling: arma('Fionda', 'Sling', 'semplice', 'distanza', '1d4 contundenti', ['munizioni'], 'Lentezza'),
  battleaxe: arma('Ascia da battaglia', 'Battleaxe', 'guerra', 'mischia', '1d8 taglienti', ['versatile'], 'Rovesciamento'),
  flail: arma('Mazzafrusto', 'Flail', 'guerra', 'mischia', '1d8 contundenti', [], 'Fiaccare'),
  glaive: arma('Falcione', 'Glaive', 'guerra', 'mischia', '1d10 taglienti', ['due mani', 'pesante', 'portata'], 'Colpo di striscio'),
  greataxe: arma('Ascia bipenne', 'Greataxe', 'guerra', 'mischia', '1d12 taglienti', ['due mani', 'pesante'], 'Doppio fendente'),
  greatsword: arma('Spadone', 'Greatsword', 'guerra', 'mischia', '2d6 taglienti', ['due mani', 'pesante'], 'Colpo di striscio'),
  halberd: arma('Alabarda', 'Halberd', 'guerra', 'mischia', '1d10 taglienti', ['due mani', 'pesante', 'portata'], 'Doppio fendente'),
  lance: arma('Lancia da cavaliere', 'Lance', 'guerra', 'mischia', '1d10 perforanti', ['due mani', 'pesante', 'portata'], 'Rovesciamento'),
  longsword: arma('Spada lunga', 'Longsword', 'guerra', 'mischia', '1d8 taglienti', ['versatile'], 'Fiaccare'),
  maul: arma('Maglio', 'Maul', 'guerra', 'mischia', '2d6 contundenti', ['due mani', 'pesante'], 'Rovesciamento'),
  morningstar: arma('Mazza chiodata', 'Morningstar', 'guerra', 'mischia', '1d8 perforanti', [], 'Fiaccare'),
  pike: arma('Picca', 'Pike', 'guerra', 'mischia', '1d10 perforanti', ['due mani', 'pesante', 'portata'], 'Spinta'),
  rapier: arma('Stocco', 'Rapier', 'guerra', 'mischia', '1d8 perforanti', ['accurata'], 'Vessazione'),
  scimitar: arma('Scimitarra', 'Scimitar', 'guerra', 'mischia', '1d6 taglienti', ['accurata', 'leggera'], 'Graffio'),
  shortsword: arma('Spada corta', 'Shortsword', 'guerra', 'mischia', '1d6 perforanti', ['accurata', 'leggera'], 'Vessazione'),
  trident: arma('Tridente', 'Trident', 'guerra', 'mischia', '1d8 perforanti', ['lancio', 'versatile'], 'Rovesciamento'),
  warhammer: arma('Martello da guerra', 'Warhammer', 'guerra', 'mischia', '1d8 contundenti', ['versatile'], 'Spinta'),
  'war-pick': arma('Piccone da guerra', 'War Pick', 'guerra', 'mischia', '1d8 perforanti', ['versatile'], 'Fiaccare'),
  whip: arma('Frusta', 'Whip', 'guerra', 'mischia', '1d4 taglienti', ['accurata', 'portata'], 'Lentezza'),
  blowgun: arma('Cerbottana', 'Blowgun', 'guerra', 'distanza', '1 perforante', ['munizioni', 'ricarica'], 'Vessazione'),
  'hand-crossbow': arma('Balestra a mano', 'Hand Crossbow', 'guerra', 'distanza', '1d6 perforanti', ['leggera', 'munizioni', 'ricarica'], 'Vessazione'),
  'heavy-crossbow': arma('Balestra pesante', 'Heavy Crossbow', 'guerra', 'distanza', '1d10 perforanti', ['due mani', 'munizioni', 'pesante', 'ricarica'], 'Spinta'),
  longbow: arma('Arco lungo', 'Longbow', 'guerra', 'distanza', '1d8 perforanti', ['due mani', 'munizioni', 'pesante'], 'Lentezza'),
  musket: arma('Moschetto', 'Musket', 'guerra', 'distanza', '1d12 perforanti', ['due mani', 'munizioni', 'ricarica'], 'Lentezza'),
  pistol: arma('Pistola', 'Pistol', 'guerra', 'distanza', '1d10 perforanti', ['munizioni', 'ricarica'], 'Vessazione'),
};

// Strumenti (p. 94-95; nomi dell'SRD 5.2.1 italiano, p. 107-108)
export const STRUMENTI_MUSICALI: Record<string, string> = {
  bagpipes: 'Cornamusa', drum: 'Tamburo', dulcimer: 'Dulcimer', flute: 'Flauto', horn: 'Corno',
  lute: 'Liuto', lyre: 'Lira', 'pan-flute': 'Flauto di pan', shawm: 'Ciaramella', viol: 'Viola',
};
export const STRUMENTI_ARTIGIANO: Record<string, string> = {
  'alchemists-supplies': 'Scorte da alchimista', 'brewers-supplies': 'Scorte da birraio', 'calligraphers-supplies': 'Scorte da calligrafo',
  'carpenters-tools': 'Strumenti da falegname', 'cartographers-tools': 'Strumenti da cartografo', 'cobblers-tools': 'Strumenti da calzolaio',
  'cooks-utensils': 'Utensili da cuoco', 'glassblowers-tools': 'Strumenti da soffiatore', 'jewelers-tools': 'Strumenti da gioielliere',
  'leatherworkers-tools': 'Strumenti da conciatore', 'masons-tools': 'Strumenti da muratore', 'painters-supplies': 'Strumenti da pittore',
  'potters-tools': 'Strumenti da vasaio', 'smiths-tools': 'Strumenti da fabbro', 'tinkers-tools': 'Strumenti da inventore',
  'weavers-tools': 'Strumenti da tessitore', 'woodcarvers-tools': 'Strumenti da intagliatore',
};
