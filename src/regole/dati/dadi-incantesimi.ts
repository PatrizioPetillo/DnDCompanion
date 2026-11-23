// Dadi di danni e cure degli incantesimi di livello 0 e 1 (quelli di un personaggio di livello 1), dal testo
// dell'SRD 5.2 (verificati il 18/11/2026, la pagina è quella dell'incantesimo). I trucchetti crescono ai livelli 5, 11 e 17.
// Più una correzione ai dati estratti: Stretta folgorante è un attacco con incantesimo in mischia (p. 162).
import type { Incantesimo } from '../tipi';

export interface DadiIncantesimo {
  dadi: string;              // al livello 1 e con lo slot base
  tipo?: string;             // tipo di danno; assente per le cure
  piuMod?: boolean;          // + modificatore della caratteristica da incantatore
  cura?: boolean;            // PF recuperati
  temporanei?: boolean;      // PF temporanei
  nota?: string;
  perSlot?: string;          // con uno slot di livello superiore
}

const T = (dadi: string, tipo: string, nota?: string): DadiIncantesimo => ({ dadi, tipo, ...(nota ? { nota } : {}) });
const S = (dadi: string, tipo: string, perSlot: string, nota?: string): DadiIncantesimo => ({ dadi, tipo, perSlot, ...(nota ? { nota } : {}) });

export const DADI_INCANTESIMI: Record<string, DadiIncantesimo> = {
  // Trucchetti
  'acid-splash': T('1d6', 'acido'),
  'chill-touch': T('1d10', 'necrotici', 'il bersaglio non recupera PF fino alla fine del tuo prossimo turno'),
  'eldritch-blast': T('1d10', 'forza', 'per raggio, un tiro per colpire per raggio'),
  'fire-bolt': T('1d10', 'fuoco'),
  'poison-spray': T('1d12', 'veleno'),
  'produce-flame': T('1d8', 'fuoco'),
  'ray-of-frost': T('1d8', 'freddo', 'velocità del bersaglio −3 metri'),
  'sacred-flame': T('1d8', 'radiosi'),
  'shocking-grasp': T('1d8', 'fulmine', 'il bersaglio non può fare attacchi di opportunità'),
  'sorcerous-burst': T('1d8', 'a scelta', 'acido, freddo, fuoco, fulmine, veleno, psichici o tuono; con un 8 tiri un altro d8'),
  'starry-wisp': T('1d8', 'radiosi'),
  'vicious-mockery': T('1d6', 'psichici', 'svantaggio al prossimo attacco del bersaglio'),
  'true-strike': { dadi: 'dado dell\'arma', tipo: 'radiosi o dell\'arma', piuMod: true, nota: 'un attacco con l\'arma usando la caratteristica da incantatore' },
  shillelagh: { dadi: '1d8', tipo: 'forza o contundenti', piuMod: true, nota: 'col randello o bastone ferrato, usando la caratteristica da incantatore' },
  // 1° livello
  'burning-hands': S('3d6', 'fuoco', '+1d6', 'metà con il TS riuscito'),
  'chromatic-orb': S('3d8', 'a scelta', '+1d8', 'acido, freddo, fuoco, fulmine, veleno o tuono'),
  'dissonant-whispers': S('3d6', 'psichici', '+1d6', 'metà con il TS riuscito'),
  'divine-favor': T('1d4', 'radiosi', 'in più a ogni colpo con un\'arma'),
  'divine-smite': S('2d8', 'radiosi', '+1d8', 'in più sul colpo; +1d8 contro immondi e non morti'),
  'ensnaring-strike': S('1d6', 'perforanti', '+1d6', 'a ogni turno del bersaglio trattenuto'),
  'guiding-bolt': S('4d6', 'radiosi', '+1d6', 'il prossimo attacco contro il bersaglio ha vantaggio'),
  'hellish-rebuke': S('2d10', 'fuoco', '+1d10', 'metà con il TS riuscito'),
  hex: T('1d6', 'necrotici', 'in più a ogni colpo sul bersaglio'),
  'hunters-mark': T('1d6', 'forza', 'in più a ogni colpo sul bersaglio'),
  'ice-knife': S('1d10', 'perforanti', '+1d6 al freddo', 'poi 2d6 freddo entro 1,5 metri (TS Destrezza)'),
  'inflict-wounds': S('2d10', 'necrotici', '+1d10', 'metà con il TS riuscito'),
  'magic-missile': S('1d4 + 1', 'forza', '+1 dardo', 'per dardo: 3 dardi che colpiscono sempre'),
  'ray-of-sickness': S('2d8', 'veleno', '+1d8'),
  'searing-smite': S('1d6', 'fuoco', '+1d6', 'in più sul colpo, poi 1d6 a ogni turno finché non supera il TS'),
  thunderwave: S('2d8', 'tuono', '+1d8', 'metà con il TS riuscito; spinto di 3 metri'),
  'cure-wounds': { dadi: '2d8', piuMod: true, cura: true, perSlot: '+2d8' },
  'healing-word': { dadi: '2d4', piuMod: true, cura: true, perSlot: '+2d4' },
  'false-life': { dadi: '2d4 + 4', temporanei: true, perSlot: '+5' },
  // 2° livello (23/11/2026, verificati uno per uno sul testo dell'SRD 5.2; «metà» = metà con il TS riuscito)
  'acid-arrow': S('4d4', 'acido', '+1d4', 'poi 2d4 acido alla fine del suo turno successivo (+1d4 anche questi per livello di slot)'),
  'alter-self': { dadi: '1d6', tipo: 'taglienti, perforanti o contundenti', piuMod: true, nota: 'con Armi naturali: colpo senz\'armi con la caratteristica da incantatore' },
  'dragons-breath': S('3d6', 'a scelta', '+1d6', 'acido, freddo, fuoco, fulmine o veleno; metà con il TS riuscito'),
  'flame-blade': { dadi: '3d6', tipo: 'fuoco', piuMod: true, perSlot: '+1d6', nota: 'attacco con incantesimo in mischia, con l\'azione Magia' },
  'flaming-sphere': S('2d6', 'fuoco', '+1d6', 'a chi finisce il turno entro 1,5 m dalla sfera; metà con il TS riuscito'),
  'heat-metal': S('2d8', 'fuoco', '+1d8', 'a chi tocca l\'oggetto, senza tiro salvezza; di nuovo con un\'Azione bonus nei turni seguenti'),
  'mind-spike': S('3d8', 'psichici', '+1d8', 'metà con il TS riuscito'),
  moonbeam: S('2d10', 'radiosi', '+1d10', 'metà con il TS riuscito'),
  'phantasmal-force': T('2d8', 'psichici', 'a ogni tuo turno, se il bersaglio è nell\'illusione o entro 1,5 m'),
  'prayer-of-healing': { dadi: '2d8', cura: true, perSlot: '+1d8', nota: 'fino a cinque creature, che hanno anche i benefici di un riposo breve' },
  'scorching-ray': S('2d6', 'fuoco', '+1 raggio', 'per raggio: 3 raggi, un tiro per colpire per raggio'),
  shatter: S('3d8', 'tuono', '+1d8', 'metà con il TS riuscito'),
  'shining-smite': S('2d6', 'radiosi', '+1d6', 'in più sul colpo; il bersaglio brilla e gli attacchi contro di lui hanno vantaggio'),
  'spike-growth': T('2d4', 'perforanti', 'ogni 1,5 m percorsi nell\'area'),
  'spiritual-weapon': { dadi: '1d8', tipo: 'forza', piuMod: true, perSlot: '+1d8', nota: 'di nuovo con un\'Azione bonus nei turni seguenti' },
  web: T('2d4', 'fuoco', 'solo se la ragnatela brucia, a chi inizia il turno nel fuoco'),
  // 3° livello
  'bestow-curse': T('1d8', 'necrotici', 'in più quando colpisci il bersaglio (se hai scelto questo effetto)'),
  'call-lightning': S('3d10', 'fulmine', '+1d10', 'metà con il TS riuscito; +1d10 se all\'aperto durante una tempesta'),
  'conjure-animals': S('3d10', 'taglienti', '+1d10', 'una volta per turno a creatura'),
  fireball: S('8d6', 'fuoco', '+1d6', 'metà con il TS riuscito'),
  'glyph-of-warding': S('5d8', 'a scelta', '+1d8', 'runa esplosiva: acido, freddo, fuoco, fulmine o tuono; metà con il TS riuscito'),
  'lightning-bolt': S('8d6', 'fulmine', '+1d6', 'metà con il TS riuscito'),
  'mass-healing-word': { dadi: '2d4', piuMod: true, cura: true, perSlot: '+1d4', nota: 'fino a sei creature' },
  'spirit-guardians': S('3d8', 'radiosi o necrotici', '+1d8', 'radiosi se sei buono o neutrale, necrotici se malvagio; metà con il TS riuscito'),
  'vampiric-touch': S('3d6', 'necrotici', '+1d6', 'recuperi PF pari a metà dei danni necrotici'),
  'wind-wall': T('4d8', 'contundenti', 'quando il muro appare; metà con il TS riuscito'),
};
// Incantesimi di 2° e 3° livello senza dadi da tirare per chi li lancia (controllati sull'SRD 5.2): aumentano i PF senza tiro (Aiuto),
// danno solo resistenze o immunità (Protezione dal veleno, Silenzio), nessun danno (Messaggero animale: «psichici» era un errore di estrazione),
// i danni li fa un'altra creatura (Trova cavalcatura) o chi lancia a se stesso (Fondersi nella pietra), o tolgono/aggiungono dadi ad altri tiri
export const SENZA_DADI_2_3 = ['animal-messenger', 'protection-from-poison', 'silence', 'aid', 'enlarge-reduce', 'find-steed', 'meld-into-stone', 'ray-of-enfeeblement', 'zone-of-truth', 'gaseous-form', 'warding-bond', 'beacon-of-hope', 'blink'];

// Trucchetto potenziato (23/11, SRD 5.2): i dadi crescono ai livelli 5, 11 e 17 del personaggio.
// Deflagrazione occulta non cambia i dadi ma i raggi (2, 3, 4); Randello incantato cambia il dado; Colpo accurato aggiunge danni radiosi.
export const gradoTrucchetto = (livello: number) => (livello >= 17 ? 4 : livello >= 11 ? 3 : livello >= 5 ? 2 : 1);
export const raggi = (id: string, livello: number) => (id === 'eldritch-blast' ? gradoTrucchetto(livello) : 1);
const RANDELLO = ['1d8', '1d10', '1d12', '2d6'];
export function dadiAlLivello(id: string, livello = 1): DadiIncantesimo | undefined {
  const d = DADI_INCANTESIMI[id];
  const i = DATI_LIVELLO_0.has(id);
  if (!d || !i) return d;
  const g = gradoTrucchetto(livello);
  if (g === 1) return d;
  if (id === 'shillelagh') return { ...d, dadi: RANDELLO[g - 1] };
  if (id === 'eldritch-blast') return { ...d, nota: `${g} raggi; ${d.nota}` };
  if (id === 'true-strike') return { ...d, nota: `${d.nota}; +${g - 1}d6 radiosi` };
  const m = d.dadi.match(/^1d(\d+)$/);
  return m ? { ...d, dadi: `${g}d${m[1]}` } : d;
}
const DATI_LIVELLO_0 = new Set(['acid-splash', 'chill-touch', 'eldritch-blast', 'fire-bolt', 'poison-spray', 'produce-flame', 'ray-of-frost', 'sacred-flame',
  'shocking-grasp', 'sorcerous-burst', 'starry-wisp', 'vicious-mockery', 'true-strike', 'shillelagh']);

// «1d10 fuoco», «2d4 + 3 PF», «1d4 + 1 forza (per dardo…)»; livello: del personaggio, per i trucchetti
export function testoDadi(id: string, mod: number, extra = 0, livello = 1): string | null {
  const d = dadiAlLivello(id, livello);
  if (!d) return null;
  const n = (d.piuMod ? mod : 0) + extra;
  const piu = d.piuMod || extra ? (n >= 0 ? ` + ${n}` : ` − ${-n}`) : '';
  const cosa = d.cura ? 'PF' : d.temporanei ? 'PF temporanei' : d.tipo;
  return `${d.dadi}${piu} ${cosa}`;
}

// Correzioni ai dati estratti dall'SRD, applicate quando si caricano gli incantesimi
export const CORREZIONI_INCANTESIMI: Record<string, Partial<Incantesimo>> = {
  'shocking-grasp': { tiro: { tipo: 'attacco' } },
  // 23/11: attacchi con incantesimo che l'estrazione non aveva visto (SRD 5.2: Lama infuocata p. 132, Raggio rovente p. 159)
  'flame-blade': { tiro: { tipo: 'attacco' } },
  'scorching-ray': { tiro: { tipo: 'attacco' } },
  // tipi di danno estratti per sbaglio: questi incantesimi non fanno danni (SRD 5.2: resistenza, immunità, nessun danno)
  'animal-messenger': { danni: [] }, 'protection-from-poison': { danni: [] }, silence: { danni: [] },
};
