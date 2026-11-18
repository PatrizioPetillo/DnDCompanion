// I 12 personaggi di prova (sezione 11 del contesto) + la variante Saggio di Travis.
// Le scelte «del test» sono quelle approvate il 17/11/2026 nel file «Valori attesi».
import type { Car, Personaggio } from '../src/regole/tipi';

const pb = (v: number[]): Record<Car, number> =>
  ({ FOR: v[0], DES: v[1], COS: v[2], INT: v[3], SAG: v[4], CAR: v[5] });

const pg = (p: Omit<Personaggio, 'schema' | 'livello' | 'avvisiAccettati' | 'punteggi' | 'incantesimi'> &
  { base: number[]; incantesimi?: Personaggio['incantesimi']; avvisiAccettati?: string[] }): Personaggio => {
  const { base, incantesimi, ...resto } = p;
  return { schema: 1, livello: 1, avvisiAccettati: [], allineamento: 'neutral-good', punteggi: { metodo: 'pointBuy27', base: pb(base) },
    incantesimi: incantesimi ?? { preparati: {} }, ...resto };
};

export const BARBARO = pg({
  nome: 'Barbaro di prova', classe: 'barbarian', specie: 'dwarf', background: 'soldier',
  base: [15, 14, 14, 8, 10, 10], bonusBackground: { FOR: 2, COS: 1 },
  scelte: { 'origine.lingue': ['dwarvish', 'giant'], 'barbarian.abilita': ['perception', 'survival'], 'barbarian.maestria-armi': ['greataxe', 'handaxe'], 'soldier.gioco': ['dice'] },
  equipaggiamento: { classe: 'A', background: 'A' },
});

export const BARDO = pg({
  nome: 'Bardo di prova', classe: 'bard', specie: 'halfling', background: 'criminal',
  base: [8, 14, 13, 10, 12, 15], bonusBackground: { DES: 2, COS: 1 },
  scelte: { 'origine.lingue': ['halfling', 'elvish'], 'bard.abilita': ['performance', 'persuasion', 'perception'], 'bard.strumenti': ['lute', 'flute', 'drum'],
    'bard.trucchetti': ['vicious-mockery', 'minor-illusion'], 'bard.equip.strumento': ['lute'] },
  incantesimi: { preparati: { bard: ['healing-word', 'charm-person', 'dissonant-whispers', 'sleep'] } },
  equipaggiamento: { classe: 'A', background: 'A' },
});

export const CHIERICO = pg({
  nome: 'Chierico di prova', classe: 'cleric', specie: 'dragonborn', background: 'acolyte',
  base: [14, 8, 14, 10, 15, 10], bonusBackground: { SAG: 2, CAR: 1 },
  scelte: { 'origine.lingue': ['draconic', 'dwarvish'], 'dragonborn.antenato': ['red'], 'cleric.abilita': ['medicine', 'persuasion'], 'cleric.ordine-divino': ['protector'],
    'cleric.trucchetti': ['guidance', 'sacred-flame', 'thaumaturgy'],
    'magic-initiate.caratteristica': ['SAG'], 'magic-initiate.trucchetti': ['guidance', 'light'], 'magic-initiate.incantesimo1': ['bless'] },
  incantesimi: { preparati: { cleric: ['cure-wounds', 'healing-word', 'guiding-bolt', 'shield-of-faith'] } },
  equipaggiamento: { classe: 'B', background: 'A', extra: [{ oggetto: 'chain-mail', quantita: 1 }, { oggetto: 'shield', quantita: 1 }] },
});

export const DRUIDO = pg({
  nome: 'Druido di prova', classe: 'druid', specie: 'elf', background: 'sage',
  base: [8, 14, 14, 10, 15, 10], bonusBackground: { SAG: 2, COS: 1 },
  scelte: { 'origine.lingue': ['elvish', 'gnomish'], 'elf.lignaggio': ['wood-elf'], 'elf.caratteristica': ['SAG'], 'elf.sensi-acuti': ['perception'],
    'druid.abilita': ['medicine', 'nature'], 'druid.ordine-primordiale': ['magician'],
    'druid.trucchetti': ['guidance', 'produce-flame', 'shillelagh'],
    'magic-initiate.caratteristica': ['INT'], 'magic-initiate.trucchetti': ['fire-bolt', 'mage-hand'], 'magic-initiate.incantesimo1': ['magic-missile'] },
  incantesimi: { preparati: { druid: ['cure-wounds', 'entangle', 'faerie-fire', 'thunderwave'] } },
  equipaggiamento: { classe: 'A', background: 'A' },
});

export const GUERRIERO = pg({
  nome: 'Guerriero di prova', classe: 'fighter', specie: 'orc', background: 'soldier',
  base: [15, 12, 14, 8, 12, 11], bonusBackground: { FOR: 2, COS: 1 },
  scelte: { 'origine.lingue': ['orc', 'giant'], 'fighter.abilita': ['perception', 'survival'], 'fighter.stile': ['defense'],
    'fighter.maestria-armi': ['greatsword', 'flail', 'javelin'], 'soldier.gioco': ['dice'] },
  equipaggiamento: { classe: 'A', background: 'A' },
});

export const MONACO = pg({
  nome: 'Monaco di prova', classe: 'monk', specie: 'human', background: 'criminal',
  base: [10, 15, 13, 10, 15, 8], bonusBackground: { DES: 2, COS: 1 },
  scelte: { 'origine.lingue': ['dwarvish', 'elvish'], 'human.abile': ['perception'], 'human.versatile': ['savage-attacker'],
    'monk.abilita': ['acrobatics', 'insight'], 'monk.strumento': ['flute'] },
  equipaggiamento: { classe: 'A', background: 'A' },
});

export const PALADINO = pg({
  nome: 'Paladino di prova', classe: 'paladin', specie: 'tiefling', background: 'soldier',
  base: [15, 8, 14, 8, 10, 15], bonusBackground: { FOR: 2, COS: 1 },
  scelte: { 'origine.lingue': ['draconic', 'orc'], 'tiefling.eredita': ['infernal'], 'tiefling.caratteristica': ['SAG'], 'paladin.abilita': ['insight', 'persuasion'],
    'paladin.maestria-armi': ['longsword', 'javelin'], 'soldier.gioco': ['dice'] },
  incantesimi: { preparati: { paladin: ['bless', 'cure-wounds'] } },
  equipaggiamento: { classe: 'A', background: 'A' },
});

export const RANGER = pg({
  nome: 'Ranger di prova', classe: 'ranger', specie: 'gnome', background: 'soldier',
  base: [10, 15, 14, 10, 14, 8], bonusBackground: { DES: 2, COS: 1 },
  scelte: { 'origine.lingue': ['gnomish', 'elvish'], 'gnome.lignaggio': ['forest-gnome'], 'gnome.caratteristica': ['INT'], 'ranger.abilita': ['perception', 'stealth', 'survival'],
    'ranger.maestria-armi': ['scimitar', 'longbow'], 'soldier.gioco': ['dice'] },
  incantesimi: { preparati: { ranger: ['cure-wounds', 'goodberry'] } },
  equipaggiamento: { classe: 'A', background: 'A' },
});

export const LADRO = pg({
  nome: 'Ladro di prova', classe: 'rogue', specie: 'halfling', background: 'criminal',
  base: [8, 15, 14, 12, 12, 11], bonusBackground: { DES: 2, INT: 1 },
  scelte: { 'origine.lingue': ['halfling', 'dwarvish'], 'rogue.abilita': ['acrobatics', 'deception', 'perception', 'investigation'], 'rogue.maestria': ['sleight-of-hand', 'stealth'],
    'rogue.lingua': ['elvish'], 'rogue.maestria-armi': ['dagger', 'shortbow'] },
  equipaggiamento: { classe: 'A', background: 'A' },
});

export const STREGONE = pg({
  nome: 'Stregone di prova', classe: 'sorcerer', specie: 'dragonborn', background: 'sage',
  base: [8, 13, 15, 11, 9, 15], bonusBackground: { COS: 2, INT: 1 },
  scelte: { 'origine.lingue': ['draconic', 'elvish'], 'dragonborn.antenato': ['red'], 'sorcerer.abilita': ['deception', 'persuasion'],
    'sorcerer.trucchetti': ['fire-bolt', 'light', 'prestidigitation', 'sorcerous-burst'],
    'magic-initiate.caratteristica': ['INT'], 'magic-initiate.trucchetti': ['mage-hand', 'minor-illusion'], 'magic-initiate.incantesimo1': ['shield'] },
  incantesimi: { preparati: { sorcerer: ['burning-hands', 'detect-magic'] } },
  equipaggiamento: { classe: 'A', background: 'A' },
});

export const WARLOCK = pg({
  nome: 'Warlock di prova', classe: 'warlock', specie: 'tiefling', background: 'acolyte',
  base: [8, 14, 14, 10, 10, 15], bonusBackground: { SAG: 1, CAR: 2 },
  scelte: { 'origine.lingue': ['draconic', 'goblin'], 'tiefling.eredita': ['abyssal'], 'tiefling.caratteristica': ['CAR'], 'warlock.abilita': ['arcana', 'deception'],
    'warlock.suppliche': ['armor-of-shadows'], 'warlock.trucchetti': ['eldritch-blast', 'prestidigitation'],
    'magic-initiate.caratteristica': ['SAG'], 'magic-initiate.trucchetti': ['guidance', 'sacred-flame'], 'magic-initiate.incantesimo1': ['cure-wounds'] },
  incantesimi: { preparati: { warlock: ['charm-person', 'hex'] } },
  equipaggiamento: { classe: 'A', background: 'A' },
});

// Travis: scelte reali di Patrizio (17/11/2026).
export const TRAVIS = pg({
  nome: 'Travis Whippletorn', idea: "Mago appena uscito dall'Accademia, «pronto per il mondo»",
  classe: 'wizard', specie: 'human', background: 'acolyte',
    // Il Sottocomune è una lingua rara (p. 20): eccezione accettata dal master.
  avvisiAccettati: ['scelta-non-valida:origine.lingue:undercommon'],
  base: [8, 12, 13, 15, 14, 10], bonusBackground: { INT: 2, SAG: 1 },
  scelte: { 'origine.lingue': ['undercommon', 'elvish'], 'human.abile': ['medicine'], 'human.versatile': ['alert'], 'wizard.abilita': ['arcana', 'investigation'],
    'magic-initiate.caratteristica': ['INT'], 'wizard.trucchetti': ['fire-bolt', 'mage-hand', 'mending'],
    'magic-initiate.trucchetti': ['guidance', 'light'], 'magic-initiate.incantesimo1': ['healing-word'] },
  incantesimi: {
    libro: ['alarm', 'feather-fall', 'find-familiar', 'identify', 'mage-armor', 'shield'],
    preparati: { wizard: ['mage-armor', 'shield', 'feather-fall', 'find-familiar'] },
  },
  equipaggiamento: { classe: 'A', background: 'A' },
});

export const TRAVIS_SAGGIO = pg({
  nome: 'Travis, variante Saggio', classe: 'wizard', specie: 'human', background: 'sage',
    // Il Sottocomune è una lingua rara (p. 20): eccezione accettata dal master.
  avvisiAccettati: ['scelta-non-valida:origine.lingue:undercommon'],
  base: [8, 14, 14, 15, 12, 8], bonusBackground: { INT: 2, SAG: 1 },
  scelte: { 'origine.lingue': ['undercommon', 'elvish'], 'human.abile': ['insight'], 'human.versatile': ['alert'], 'wizard.abilita': ['investigation', 'medicine'],
    'wizard.trucchetti': ['fire-bolt', 'mage-hand', 'mending'],
    'magic-initiate.caratteristica': ['INT'], 'magic-initiate.trucchetti': ['light', 'ray-of-frost'], 'magic-initiate.incantesimo1': ['detect-magic'] },
  incantesimi: {
    libro: ['alarm', 'feather-fall', 'mage-armor', 'shield', 'magic-missile', 'sleep'],
    preparati: { wizard: ['mage-armor', 'shield', 'magic-missile', 'sleep'] },
  },
  equipaggiamento: { classe: 'A', background: 'A' },
});
