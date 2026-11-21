// Incontri del master (21/11): difficoltà e ordine dell'iniziativa, senza bestiario.
// Il master scrive i nemici (nome, grado di sfida, quanti, bonus all'iniziativa); i personaggi arrivano dal gruppo.
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

export interface Nemico { id: string; nome: string; gs: string; quanti: number; iniziativa: number; pf?: number }
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
export interface Combattente { id: string; nome: string; tipo: 'pg' | 'nemico'; bonus: number; tiro: number; quanti?: number; pf?: number[]; pfMax?: number }
export interface Combattimento { ordine: Combattente[]; turno: number; round: number }

export const d20 = () => 1 + Math.floor(Math.random() * 20);

export function tiraIniziativa(pg: { id: string; nome: string; bonus: number }[], nemici: Nemico[], dado: () => number = d20): Combattimento {
  const ordine: Combattente[] = [
    ...pg.map((p) => ({ id: `pg:${p.id}`, nome: p.nome, tipo: 'pg' as const, bonus: p.bonus, tiro: dado() })),
    ...nemici.filter((n) => n.quanti > 0).map((n) => ({
      id: `n:${n.id}`, nome: n.nome || 'Nemico', tipo: 'nemico' as const, bonus: n.iniziativa, tiro: dado(), quanti: n.quanti,
      ...(n.pf ? { pf: Array.from({ length: n.quanti }, () => n.pf!), pfMax: n.pf } : {}),
    })),
  ];
  return { ordine: ordina(ordine), turno: 0, round: 1 };
}

export const totale = (c: Combattente) => c.tiro + c.bonus;
// Dal più alto al più basso; a parità prima il bonus più alto (solo come proposta: il master può spostare)
export const ordina = (o: Combattente[]) => [...o].sort((a, b) => totale(b) - totale(a) || b.bonus - a.bonus);

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
