// Incontri del master (21/11): difficoltà e ordine dell'iniziativa. Dal 23/11 i nemici si prendono anche dall'elenco
// dei mostri dell'SRD (creazione/mostri.ts), che riempie i numeri; gli altri li scrive il master. I personaggi arrivano dal gruppo.
// Regole: difficoltà SRD p. 202 (budget di PE per personaggio), PE per grado di sfida p. 253, iniziativa p. 13.

// PE per grado di sfida (SRD p. 253). Il GS 0 vale 0 o 10 PE: il master sceglie quale.
export const PE_PER_GS: Record<string, number> = {
  '0': 0, '0*': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900, '8': 3900,
  '9': 5000, '10': 5900, '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000, '16': 15000, '17': 18000, '18': 20000, '19': 22000,
  '20': 25000, '21': 33000, '22': 41000, '23': 50000, '24': 62000, '25': 75000, '26': 90000, '27': 105000, '28': 120000, '29': 135000, '30': 155000,
};
export const GRADI = Object.keys(PE_PER_GS);
export const nomeGrado = (g: string) => (g === '0' ? '0 (0 PE)' : g === '0*' ? '0 (10 PE)' : g);

// Budget di PE per personaggio: [basso, moderato, alto] per livello 1-20 (SRD p. 202)
const BUDGET: [number, number, number][] = [
  [50, 75, 100], [100, 150, 200], [150, 225, 400], [250, 375, 500], [500, 750, 1100], [600, 1000, 1400], [750, 1300, 1700],
  [1000, 1700, 2100], [1300, 2000, 2600], [1600, 2300, 3100], [1900, 2900, 4100], [2200, 3700, 4700], [2600, 4200, 5400],
  [2900, 4900, 6200], [3300, 5400, 7800], [3800, 6100, 9800], [4500, 7200, 11700], [5000, 8700, 14200], [5500, 10700, 17200], [6400, 13200, 22000],
];

import type { IdCondizione } from '../partita/condizioni';
import { casuale } from '../partita/dadi';

// mostro, ca e immunità ci sono quando il nemico viene dall'elenco dell'SRD
export interface Nemico { id: string; nome: string; gs: string; quanti: number; iniziativa: number; pf?: number; ca?: number; mostro?: string; immunita?: IdCondizione[] }
export interface Budget { basso: number; moderato: number; alto: number }

// L'SRD moltiplica il budget del livello del gruppo per il numero di personaggi.
// Con livelli diversi sommiamo il budget di ciascuno: con livelli uguali è la stessa cosa.
export function budgetGruppo(livelli: number[]): Budget {
  return livelli.reduce<Budget>((t, l) => {
    const [b, m, a] = BUDGET[Math.min(20, Math.max(1, Math.round(l))) - 1];
    return { basso: t.basso + b, moderato: t.moderato + m, alto: t.alto + a };
  }, { basso: 0, moderato: 0, alto: 0 });
}

export const peNemici = (n: Nemico[]) => n.reduce((t, x) => t + (PE_PER_GS[x.gs] ?? 0) * Math.max(0, x.quanti), 0);

export type Difficolta = 'vuoto' | 'basso' | 'moderato' | 'alto' | 'oltre';
export function difficolta(pe: number, b: Budget): Difficolta {
  if (pe <= 0 || b.basso <= 0) return 'vuoto';
  if (pe <= b.basso) return 'basso';
  if (pe <= b.moderato) return 'moderato';
  if (pe <= b.alto) return 'alto';
  return 'oltre';
}
export const NOME_DIFFICOLTA: Record<Difficolta, string> = {
  vuoto: 'Aggiungi i nemici', basso: 'Bassa', moderato: 'Moderata', alto: 'Alta', oltre: 'Oltre l\'alta: può essere mortale',
};
// Cosa vuol dire, con le parole dell'SRD (p. 202) riassunte
export const SPIEGA_DIFFICOLTA: Record<Difficolta, string> = {
  vuoto: '',
  basso: 'Qualche momento di paura, ma i personaggi dovrebbero vincere senza perdite; qualcuno potrebbe dover usare cure.',
  moderato: 'Senza cure e risorse potrebbe andare male: i più deboli possono finire a terra e c\'è una piccola possibilità che qualcuno muoia.',
  alto: 'Può essere letale per uno o più personaggi: servono buona tattica, prontezza e un po\' di fortuna.',
  oltre: 'Supera il budget dell\'incontro di difficoltà alta: l\'SRD non lo classifica. Valuta se è quello che vuoi.',
};

// ───────── Iniziativa (SRD p. 13) ─────────
// Un gruppo di creature identiche tira una volta sola: stessa iniziativa per tutti. In caso di parità decide il master.
// condizioni: una lista per ogni nemico del gruppo (come i PF); le immunità vengono dalla scheda del mostro
// I personaggi tirano da sé (SRD p. 13: «The GM rolls for monsters»): il loro totale arriva dal telefono del giocatore
// (tavolo collegato) o lo scrive il master. Finché manca, «attesa». scritto: il totale del personaggio.
export interface Combattente {
  id: string; nome: string; tipo: 'pg' | 'nemico'; bonus: number; tiro: number; quanti?: number; pf?: number[]; pfMax?: number;
  ca?: number; immunita?: IdCondizione[]; condizioni?: IdCondizione[][];
  attesa?: boolean; scritto?: number; dalGiocatore?: boolean;
}
export interface Combattimento { ordine: Combattente[]; turno: number; round: number; iniziato?: string }

export const d20 = () => casuale(20);   // modulo dei dadi (23/11)

export function tiraIniziativa(pg: { id: string; nome: string; bonus: number }[], nemici: Nemico[], dado: () => number = d20, ora = new Date()): Combattimento {
  const ordine: Combattente[] = [
    ...pg.map((p) => ({ id: `pg:${p.id}`, nome: p.nome, tipo: 'pg' as const, bonus: p.bonus, tiro: 0, attesa: true })),
    ...nemici.filter((n) => n.quanti > 0).map((n) => ({
      id: `n:${n.id}`, nome: n.nome || 'Nemico', tipo: 'nemico' as const, bonus: n.iniziativa, tiro: dado(), quanti: n.quanti,
      ...(n.pf ? { pf: Array.from({ length: n.quanti }, () => n.pf!), pfMax: n.pf } : {}),
      ...(n.ca ? { ca: n.ca } : {}), ...(n.immunita?.length ? { immunita: n.immunita } : {}),
      condizioni: Array.from({ length: n.quanti }, () => [] as IdCondizione[]),
    })),
  ];
  return { ordine: ordina(ordine), turno: 0, round: 1, iniziato: ora.toISOString() };
}

export const totale = (c: Combattente) => c.scritto ?? c.tiro + c.bonus;
// Dal più alto al più basso; a parità prima il bonus più alto (solo come proposta: il master può spostare).
// Chi aspetta ancora il tiro sta in fondo.
export const ordina = (o: Combattente[]) => [...o].sort((a, b) => Number(!!a.attesa) - Number(!!b.attesa) || totale(b) - totale(a) || b.bonus - a.bonus);

// Il totale di un personaggio: detto dal giocatore e scritto dal master, o arrivato dal suo telefono.
// Prima che qualcuno agisca (round 1, primo turno) il turno va al nuovo primo; dopo resta su chi lo aveva.
export function scriviTotale(c: Combattimento, id: string, valore: number | null, dalGiocatore = false): Combattimento {
  const attivo = c.ordine[c.turno]?.id;
  const inizio = c.round === 1 && c.turno === 0;
  const ordine = ordina(c.ordine.map((x) => {
    if (x.id !== id || x.tipo !== 'pg') return x;
    const { scritto: _s, attesa: _a, dalGiocatore: _d, ...resto } = x;
    return valore === null ? { ...resto, attesa: true } : { ...resto, scritto: Math.max(-20, Math.min(60, Math.round(valore))), ...(dalGiocatore ? { dalGiocatore: true } : {}) };
  }));
  return { ...c, ordine, turno: inizio ? 0 : Math.max(0, ordine.findIndex((x) => x.id === attivo)) };
}

export function prossimoTurno(c: Combattimento): Combattimento {
  if (!c.ordine.length) return c;
  const t = c.turno + 1;
  return t >= c.ordine.length ? { ...c, turno: 0, round: c.round + 1 } : { ...c, turno: t };
}
export function turnoPrecedente(c: Combattimento): Combattimento {
  if (c.turno > 0) return { ...c, turno: c.turno - 1 };
  return c.round > 1 ? { ...c, turno: c.ordine.length - 1, round: c.round - 1 } : c;
}
// Il master sposta qualcuno (parità, o chi ha tirato da sé): il turno resta su chi lo aveva
export function sposta(c: Combattimento, i: number, verso: -1 | 1): Combattimento {
  const j = i + verso;
  if (j < 0 || j >= c.ordine.length) return c;
  const ordine = [...c.ordine];
  [ordine[i], ordine[j]] = [ordine[j], ordine[i]];
  const turno = c.turno === i ? j : c.turno === j ? i : c.turno;
  return { ...c, ordine, turno };
}
// Il giocatore ha tirato il suo d20: il master lo scrive e l'ordine si rifà
export function cambiaTiro(c: Combattimento, id: string, tiro: number): Combattimento {
  const attivo = c.ordine[c.turno]?.id;
  const ordine = ordina(c.ordine.map((x) => (x.id === id ? { ...x, tiro: Math.max(1, Math.min(20, Math.round(tiro))) } : x)));
  return { ...c, ordine, turno: Math.max(0, ordine.findIndex((x) => x.id === attivo)) };
}
export function cambiaPf(c: Combattimento, id: string, istanza: number, pf: number): Combattimento {
  return { ...c, ordine: c.ordine.map((x) => (x.id !== id || !x.pf ? x : { ...x, pf: x.pf.map((v, k) => (k === istanza ? Math.max(0, Math.min(x.pfMax ?? 9999, pf)) : v)) })) };
}

// Le condizioni dei nemici (23/11): il master le segna e le toglie; a una condizione da cui è immune non si arriva.
export function cambiaCondizioneNemico(c: Combattimento, id: string, istanza: number, cond: IdCondizione, metti: boolean): Combattimento {
  return { ...c, ordine: c.ordine.map((x) => {
    if (x.id !== id || x.tipo !== 'nemico') return x;
    if (metti && x.immunita?.includes(cond)) return x;
    const tutte = x.condizioni ?? Array.from({ length: x.quanti ?? 1 }, () => [] as IdCondizione[]);
    return { ...x, condizioni: tutte.map((l, k) => (k !== istanza ? l : metti ? (l.includes(cond) ? l : [...l, cond]) : l.filter((y) => y !== cond))) };
  }) };
}

// ───────── Elenco degli incontri per sessione (25/11) ─────────
// Gruppi nell'ordine in cui compare la sessione; senza sessione in fondo. Dentro: prima quelli da fare, nell'ordine scelto, poi i fatti.
export interface IncontroInElenco { id: string; sessione?: string; fattoIl?: string }
export function perSessione<T extends IncontroInElenco>(incontri: T[]): { sessione: string | null; daFare: T[]; fatti: T[] }[] {
  const nomi: (string | null)[] = [];
  for (const i of incontri) { const s = i.sessione?.trim() || null; if (!nomi.includes(s)) nomi.push(s); }
  nomi.sort((a, b) => (a === null ? 1 : 0) - (b === null ? 1 : 0));
  return nomi.map((s) => {
    const qui = incontri.filter((i) => (i.sessione?.trim() || null) === s);
    return { sessione: s, daFare: qui.filter((i) => !i.fattoIl), fatti: qui.filter((i) => i.fattoIl) };
  });
}
export const sessioni = (incontri: IncontroInElenco[]) => [...new Set(incontri.map((i) => i.sessione?.trim()).filter((s): s is string => !!s))];

// Sposta un incontro di un posto (su o giù) tra quelli della stessa sessione; restituisce il nuovo ordine di tutti gli id
export function spostaIncontro(incontri: IncontroInElenco[], id: string, verso: -1 | 1): string[] {
  const ids = incontri.map((i) => i.id);
  const me = incontri.find((i) => i.id === id);
  if (!me) return ids;
  const stessa = incontri.filter((i) => (i.sessione?.trim() || '') === (me.sessione?.trim() || '') && !!i.fattoIl === !!me.fattoIl).map((i) => i.id);
  const k = stessa.indexOf(id), altro = stessa[k + verso];
  if (altro === undefined) return ids;
  const a = ids.indexOf(id), b = ids.indexOf(altro);
  [ids[a], ids[b]] = [ids[b], ids[a]];
  return ids;
}
