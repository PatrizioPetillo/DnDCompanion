// Oggetti magici (21/11): una scelta dall'SRD 5.2 (p. 209-250) degli oggetti più comuni ai primi livelli,
// con il nome dell'SRD 5.2.1 italiano e una riga scritta da noi. Gli altri (dell'SRD o di altri manuali)
// si aggiungono come «oggetto magico personalizzato», con i bonus scritti dal giocatore.
// Regola generale: un oggetto che richiede sintonia dà i suoi benefici solo da sintonizzato (massimo 3 oggetti).
import type { Car, Id } from '../tipi';

export type EffettoMagico =
  | { tipo: 'arma'; bonus: number }                          // +N ai tiri per colpire e ai danni con quell'arma
  | { tipo: 'armatura'; bonus: number }                      // +N alla CA mentre indossi quell'armatura
  | { tipo: 'scudo'; bonus: number }                         // +N alla CA mentre imbracci lo scudo
  | { tipo: 'ca'; bonus: number; soloSenzaArmatura?: boolean } // +N alla CA (i bracciali: senza armatura né scudo)
  | { tipo: 'ts'; bonus: number }                            // +N a tutti i tiri salvezza
  | { tipo: 'prove'; bonus: number }                         // +N a tutte le prove di caratteristica (anche l'iniziativa)
  | { tipo: 'punteggio'; car: Car; valore: number }          // la caratteristica diventa N, se era più bassa
  | { tipo: 'attaccoIncantesimi'; bonus: number }            // +N ai tiri per colpire con gli incantesimi
  | { tipo: 'cdIncantesimi'; bonus: number };                // +N alla CD degli incantesimi

export interface Variante { id: string; nome: string; rarita: string; effetti: EffettoMagico[] }

export interface OggettoMagico {
  id: Id; nome: string; nomeEn: string; categoria: string; rarita: string;
  sintonia: boolean | string;                                // true, oppure chi può sintonizzarsi («un incantatore»)
  base?: 'arma' | 'armatura' | 'munizioni';                  // l'oggetto è un'arma o un'armatura a scelta
  varianti?: Variante[];                                     // +1/+2/+3, i tipi di cintura, le pozioni
  effetti?: EffettoMagico[];
  // ricarica: i dadi che si tirano all'alba, oppure «tutte»; ultima: cosa succede spendendo l'ultima carica (22/11)
  cariche?: { massimo: number; recupero: string; ricarica: { dadi: number; facce: number; piu: number } | 'tutte'; ultima?: string };
  consumabile?: boolean;
  riga: string;
  pagina: number;
}

const piu = (n: 1 | 2 | 3, r: string, f: (b: number) => EffettoMagico[]): Variante => ({ id: `+${n}`, nome: `+${n}`, rarita: r, effetti: f(n) });

export const OGGETTI_MAGICI: Record<Id, OggettoMagico> = {
  'weapon-plus': {
    id: 'weapon-plus', nome: 'Arma +1, +2 o +3', nomeEn: 'Weapon, +1, +2, or +3', categoria: 'Arma', rarita: 'non comune (+1), rara (+2), molto rara (+3)',
    sintonia: false, base: 'arma', pagina: 250,
    varianti: [piu(1, 'non comune', (b) => [{ tipo: 'arma', bonus: b }]), piu(2, 'rara', (b) => [{ tipo: 'arma', bonus: b }]), piu(3, 'molto rara', (b) => [{ tipo: 'arma', bonus: b }])],
    riga: 'Bonus ai tiri per colpire e ai danni con quest\'arma, pari al suo +N.',
  },
  'armor-plus': {
    id: 'armor-plus', nome: 'Armatura +1, +2 o +3', nomeEn: 'Armor, +1, +2, or +3', categoria: 'Armatura', rarita: 'rara (+1), molto rara (+2), leggendaria (+3)',
    sintonia: false, base: 'armatura', pagina: 210,
    varianti: [piu(1, 'rara', (b) => [{ tipo: 'armatura', bonus: b }]), piu(2, 'molto rara', (b) => [{ tipo: 'armatura', bonus: b }]), piu(3, 'leggendaria', (b) => [{ tipo: 'armatura', bonus: b }])],
    riga: 'Bonus alla CA mentre la indossi, pari al suo +N.',
  },
  'shield-plus': {
    id: 'shield-plus', nome: 'Scudo +1, +2 o +3', nomeEn: 'Shield, +1, +2, or +3', categoria: 'Armatura (scudo)', rarita: 'non comune (+1), rara (+2), molto rara (+3)',
    sintonia: false, pagina: 241,
    varianti: [piu(1, 'non comune', (b) => [{ tipo: 'scudo', bonus: b }]), piu(2, 'rara', (b) => [{ tipo: 'scudo', bonus: b }]), piu(3, 'molto rara', (b) => [{ tipo: 'scudo', bonus: b }])],
    riga: 'Mentre lo imbracci, il suo +N si aggiunge al +2 normale dello scudo.',
  },
  'ammunition-plus': {
    id: 'ammunition-plus', nome: 'Munizione +1, +2 o +3', nomeEn: 'Ammunition, +1, +2, or +3', categoria: 'Arma (munizioni)', rarita: 'non comune (+1), rara (+2), molto rara (+3)',
    sintonia: false, consumabile: true, pagina: 209,
    varianti: [piu(1, 'non comune', () => []), piu(2, 'rara', () => []), piu(3, 'molto rara', () => [])],
    riga: 'Bonus ai tiri per colpire e ai danni quando la usi, pari al suo +N; dopo aver colpito non è più magica.',
  },
  'ring-of-protection': {
    id: 'ring-of-protection', nome: 'Anello di protezione', nomeEn: 'Ring of Protection', categoria: 'Anello', rarita: 'raro', sintonia: true, pagina: 236,
    effetti: [{ tipo: 'ca', bonus: 1 }, { tipo: 'ts', bonus: 1 }], riga: '+1 alla CA e ai tiri salvezza mentre lo indossi.',
  },
  'cloak-of-protection': {
    id: 'cloak-of-protection', nome: 'Mantello della protezione', nomeEn: 'Cloak of Protection', categoria: 'Oggetto meraviglioso', rarita: 'non comune', sintonia: true, pagina: 215,
    effetti: [{ tipo: 'ca', bonus: 1 }, { tipo: 'ts', bonus: 1 }], riga: '+1 alla CA e ai tiri salvezza mentre lo indossi.',
  },
  'bracers-of-defense': {
    id: 'bracers-of-defense', nome: 'Bracciali della difesa', nomeEn: 'Bracers of Defense', categoria: 'Oggetto meraviglioso', rarita: 'raro', sintonia: true, pagina: 214,
    effetti: [{ tipo: 'ca', bonus: 2, soloSenzaArmatura: true }], riga: '+2 alla CA se non indossi armatura e non usi uno scudo.',
  },
  'amulet-of-health': {
    id: 'amulet-of-health', nome: 'Amuleto della salute', nomeEn: 'Amulet of Health', categoria: 'Oggetto meraviglioso', rarita: 'raro', sintonia: true, pagina: 209,
    effetti: [{ tipo: 'punteggio', car: 'COS', valore: 19 }], riga: 'La tua Costituzione è 19 mentre lo indossi (nessun effetto se è già 19 o più).',
  },
  'gauntlets-of-ogre-power': {
    id: 'gauntlets-of-ogre-power', nome: 'Guanti del potere orchesco', nomeEn: 'Gauntlets of Ogre Power', categoria: 'Oggetto meraviglioso', rarita: 'non comune', sintonia: true, pagina: 223,
    effetti: [{ tipo: 'punteggio', car: 'FOR', valore: 19 }], riga: 'La tua Forza è 19 mentre li indossi (nessun effetto se è già 19 o più).',
  },
  'headband-of-intellect': {
    id: 'headband-of-intellect', nome: 'Fascia dell\'intelletto', nomeEn: 'Headband of Intellect', categoria: 'Oggetto meraviglioso', rarita: 'non comune', sintonia: true, pagina: 224,
    effetti: [{ tipo: 'punteggio', car: 'INT', valore: 19 }], riga: 'La tua Intelligenza è 19 mentre la indossi (nessun effetto se è già 19 o più).',
  },
  'belt-of-giant-strength': {
    id: 'belt-of-giant-strength', nome: 'Cintura della forza dei giganti', nomeEn: 'Belt of Giant Strength', categoria: 'Oggetto meraviglioso', rarita: 'variabile', sintonia: true, pagina: 213,
    varianti: [
      { id: 'hill', nome: '(delle colline)', rarita: 'rara', effetti: [{ tipo: 'punteggio', car: 'FOR', valore: 21 }] },
      { id: 'frost-stone', nome: '(del gelo o delle pietre)', rarita: 'molto rara', effetti: [{ tipo: 'punteggio', car: 'FOR', valore: 23 }] },
      { id: 'fire', nome: '(del fuoco)', rarita: 'molto rara', effetti: [{ tipo: 'punteggio', car: 'FOR', valore: 25 }] },
      { id: 'cloud', nome: '(delle nuvole)', rarita: 'leggendaria', effetti: [{ tipo: 'punteggio', car: 'FOR', valore: 27 }] },
      { id: 'storm', nome: '(delle tempeste)', rarita: 'leggendaria', effetti: [{ tipo: 'punteggio', car: 'FOR', valore: 29 }] },
    ],
    riga: 'La tua Forza diventa quella della cintura mentre la indossi (nessun effetto se è già pari o più alta).',
  },
  'wand-of-the-war-mage': {
    id: 'wand-of-the-war-mage', nome: 'Bacchetta del mago da guerra +1, +2 o +3', nomeEn: 'Wand of the War Mage, +1, +2, or +3', categoria: 'Bacchetta',
    rarita: 'non comune (+1), rara (+2), molto rara (+3)', sintonia: 'un incantatore', pagina: 248,
    varianti: [piu(1, 'non comune', (b) => [{ tipo: 'attaccoIncantesimi', bonus: b }]), piu(2, 'rara', (b) => [{ tipo: 'attaccoIncantesimi', bonus: b }]), piu(3, 'molto rara', (b) => [{ tipo: 'attaccoIncantesimi', bonus: b }])],
    riga: 'Mentre la impugni: bonus ai tiri per colpire con gli incantesimi, e ignori la copertura parziale (metà).',
  },
  'stone-of-good-luck': {
    id: 'stone-of-good-luck', nome: 'Pietra della buona fortuna (pietrafortuna)', nomeEn: 'Stone of Good Luck (Luckstone)', categoria: 'Oggetto meraviglioso', rarita: 'non comune',
    sintonia: true, pagina: 245, effetti: [{ tipo: 'prove', bonus: 1 }, { tipo: 'ts', bonus: 1 }], riga: '+1 alle prove di caratteristica e ai tiri salvezza mentre la porti con te.',
  },
  'potion-of-healing': {
    id: 'potion-of-healing', nome: 'Pozione di guarigione', nomeEn: 'Potion of Healing', categoria: 'Pozione', rarita: 'variabile', sintonia: false, consumabile: true, pagina: 234,
    varianti: [
      { id: 'base', nome: '', rarita: 'comune', effetti: [] }, { id: 'greater', nome: '(maggiore)', rarita: 'non comune', effetti: [] },
      { id: 'superior', nome: '(superiore)', rarita: 'rara', effetti: [] }, { id: 'supreme', nome: '(suprema)', rarita: 'molto rara', effetti: [] },
    ],
    riga: 'Bevendola recuperi PF: 2d4 + 2 (normale), 4d4 + 4 (maggiore), 8d4 + 8 (superiore), 10d4 + 20 (suprema).',
  },
  'spell-scroll': {
    id: 'spell-scroll', nome: 'Pergamena magica', nomeEn: 'Spell Scroll', categoria: 'Pergamena', rarita: 'variabile', sintonia: false, consumabile: true, pagina: 241,
    riga: 'Contiene un incantesimo: se è nella lista della tua classe lo lanci leggendola, senza componenti materiali; poi la pergamena si sgretola. Se è di livello troppo alto per te serve una prova (CD 10 + livello).',
  },
  'boots-of-elvenkind': {
    id: 'boots-of-elvenkind', nome: 'Stivali elfici', nomeEn: 'Boots of Elvenkind', categoria: 'Oggetto meraviglioso', rarita: 'non comune', sintonia: false, pagina: 213,
    riga: 'I tuoi passi non fanno rumore e hai vantaggio alle prove di Destrezza (Furtività).',
  },
  'cloak-of-elvenkind': {
    id: 'cloak-of-elvenkind', nome: 'Mantello elfico', nomeEn: 'Cloak of Elvenkind', categoria: 'Oggetto meraviglioso', rarita: 'non comune', sintonia: true, pagina: 215,
    riga: 'Hai vantaggio alle prove di Destrezza (Furtività), e chi cerca di vederti con Saggezza (Percezione) ha svantaggio.',
  },
  'goggles-of-night': {
    id: 'goggles-of-night', nome: 'Occhiali della notte', nomeEn: 'Goggles of Night', categoria: 'Oggetto meraviglioso', rarita: 'non comune', sintonia: false, pagina: 223,
    riga: 'Scurovisione fino a 18 m; se ce l\'hai già, la sua distanza aumenta di 18 m.',
  },
  'wand-of-magic-missiles': {
    id: 'wand-of-magic-missiles', nome: 'Bacchetta di dardi incantati', nomeEn: 'Wand of Magic Missiles', categoria: 'Bacchetta', rarita: 'non comune', sintonia: false, pagina: 248,
    cariche: { massimo: 7, recupero: '1d6 + 1 a ogni alba', ricarica: { dadi: 1, facce: 6, piu: 1 },
      ultima: 'Hai speso l\'ultima carica: tira 1d20. Con 1 la bacchetta si sbriciola in cenere ed è distrutta.' },
    riga: 'Spendi da 1 a 3 cariche per lanciare Dardo incantato (1 carica = 1° livello, ogni carica in più alza il livello di 1).',
  },
  'pearl-of-power': {
    id: 'pearl-of-power', nome: 'Perla del potere', nomeEn: 'Pearl of Power', categoria: 'Oggetto meraviglioso', rarita: 'non comune', sintonia: 'un incantatore', pagina: 232,
    cariche: { massimo: 1, recupero: 'all\'alba', ricarica: 'tutte' },
    riga: 'Con un\'azione di Magia recuperi uno slot incantesimo di 3° livello o inferiore. Una volta al giorno.',
  },
  'weapon-of-warning': {
    id: 'weapon-of-warning', nome: 'Arma di avvertimento', nomeEn: 'Weapon of Warning', categoria: 'Arma', rarita: 'non comune', sintonia: true, base: 'arma', pagina: 250,
    riga: 'Finché è a portata di mano: tu e gli alleati entro 9 m avete vantaggio all\'iniziativa, e chi dorme normalmente si sveglia quando inizia il combattimento.',
  },
  'bag-of-holding': {
    id: 'bag-of-holding', nome: 'Borsa conservante', nomeEn: 'Bag of Holding', categoria: 'Oggetto meraviglioso', rarita: 'non comune', sintonia: false, pagina: 212,
    riga: 'Dentro è molto più grande che fuori: contiene fino a 250 kg, e pesa sempre 2,5 kg. Tirare fuori un oggetto richiede un\'azione di Utilizzo.',
  },
  'immovable-rod': {
    id: 'immovable-rod', nome: 'Verga inamovibile', nomeEn: 'Immovable Rod', categoria: 'Verga', rarita: 'non comune', sintonia: false, pagina: 225,
    riga: 'Con un\'azione di Utilizzo premi il tasto: la verga resta fissa dov\'è, anche nel vuoto, finché qualcuno non lo ripreme.',
  },
};

export const MAX_SINTONIA = 3;   // SRD p. 102-103
