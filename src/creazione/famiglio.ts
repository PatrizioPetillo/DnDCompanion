// Il famiglio (23/11, richiesta di Patrizio): una piccola scheda per chi ha Trova famiglio (SRD 5.2 p. 130).
// Forme: Pipistrello, Gatto, Rana, Falco, Lucertola, Piovra, Gufo, Topo, Corvo, Ragno, Faina, o un'altra bestia di GS 0;
// con il Patto della catena anche Imp, Pseudodrago, Quasit, Scheletro, Sfinge della meraviglia, Spiritello,
// Serpente velenoso (p. 73). Con Compagno selvatico del druido è sempre un folletto (p. 43).
import type { Id, Scheda } from '../regole/tipi';
import type { Bozza } from './percorso';

// Dall'elenco dei mostri dell'SRD 5.2.1 italiano (bestie di GS 0; le nominate dall'incantesimo per prime)
const FORME: { id: Id; nome: string }[] = [{id: "raven", nome: "Corvo"}, {id: "weasel", nome: "Faina"}, {id: "hawk", nome: "Falco"}, {id: "cat", nome: "Gatto"}, {id: "owl", nome: "Gufo"}, {id: "lizard", nome: "Lucertola"}, {id: "piovra", nome: "Piovra"}, {id: "bat", nome: "Pipistrello"}, {id: "spider", nome: "Ragno"}, {id: "frog", nome: "Rana"}, {id: "rat", nome: "Topo"}, {id: "eagle", nome: "Aquila"}, {id: "vulture", nome: "Avvoltoio"}, {id: "baboon", nome: "Babbuino"}, {id: "goat", nome: "Capra"}, {id: "seahorse", nome: "Cavalluccio marino"}, {id: "deer", nome: "Daino"}, {id: "crab", nome: "Granchio"}, {id: "hyena", nome: "Iena"}, {id: "giant-fly", nome: "Mosca gigante"}, {id: "piranha", nome: "Piranha"}, {id: "giant-fire-beetle", nome: "Scarabeo di fuoco gigante"}, {id: "jackal", nome: "Sciacallo"}, {id: "scorpion", nome: "Scorpione"}, {id: "badger", nome: "Tasso"}];
export const FORME_PATTO: { id: Id; nome: string }[] = [{id: "imp", nome: "Imp"}, {id: "pseudodragon", nome: "Pseudodrago"}, {id: "quasit", nome: "Quasit"}, {id: "skeleton", nome: "Scheletro"}, {id: "sphinx-of-wonder", nome: "Sfinge della meraviglia"}, {id: "sprite", nome: "Spiritello"}, {id: "venomous-snake", nome: "Serpente velenoso"}];

export const haPatto = (b: Bozza) => Object.entries(b.scelte).some(([k, v]) => k.startsWith('warlock.suppliche') && v.includes('pact-of-the-chain'));
const compagno = (b: Bozza) => b.classe === 'druid' && (b.livello ?? 1) >= 2;

// Chi può avere il famiglio: Trova famiglio nel libro, preparato o sempre preparato; Patto della catena; Compagno selvatico
export function puoAvereFamiglio(b: Bozza, s: Scheda | null): boolean {
  if (haPatto(b) || compagno(b)) return true;
  if ((b.incantesimi.libro ?? []).includes('find-familiar')) return true;
  return !!s?.magia.some((m) => [...m.semprePreparati, ...(m.preparati?.scelti ?? [])].includes('find-familiar'));
}

export const formeFamiglio = (b: Bozza) => ({ normali: FORME, patto: haPatto(b) ? FORME_PATTO : [] });

export const natureAmmesse = (b: Bozza): ('celestiale' | 'folletto' | 'immondo')[] =>
  compagno(b) && !haPatto(b) && !puoDaIncantesimo(b) ? ['folletto'] : ['celestiale', 'folletto', 'immondo'];
const puoDaIncantesimo = (b: Bozza) => (b.incantesimi.libro ?? []).includes('find-familiar') || Object.values(b.incantesimi.preparati).some((l) => l.includes('find-familiar'));
