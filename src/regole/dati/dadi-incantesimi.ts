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
  'eldritch-blast': T('1d10', 'forza', '1 raggio (2 al livello 5)'),
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
};

// «1d10 fuoco», «2d4 + 3 PF», «1d4 + 1 forza (per dardo…)»
export function testoDadi(id: string, mod: number): string | null {
  const d = DADI_INCANTESIMI[id];
  if (!d) return null;
  const piu = d.piuMod ? (mod >= 0 ? ` + ${mod}` : ` − ${-mod}`) : '';
  const cosa = d.cura ? 'PF' : d.temporanei ? 'PF temporanei' : d.tipo;
  return `${d.dadi}${piu} ${cosa}`;
}

// Correzioni ai dati estratti dall'SRD, applicate quando si caricano gli incantesimi
export const CORREZIONI_INCANTESIMI: Record<string, Partial<Incantesimo>> = {
  'shocking-grasp': { tiro: { tipo: 'attacco' } },
};
