// La borsa per componenti (richiesta di Patrizio, 19/11). Regola (SRD p. 105-106): la borsa contiene tutte le componenti
// materiali SENZA costo, e non finiscono. Quelle CON un costo vanno comprate: si contano, e quelle che l'incantesimo
// consuma calano a ogni lancio. Finite, l'incantesimo si può comunque scegliere (lo decide il master), ma è segnato in rosso.
import { DATI, type Dati } from '../regole/dati';
import { MATERIALE_DA_OGGETTO } from '../regole/dati/base';
import type { Id, Scheda } from '../regole/tipi';
import type { StatoPartita } from './partita';

export interface Componente {
  incantesimo: Id;
  nome: string;                 // nome dell'incantesimo
  testo: string;                // la componente, in italiano
  costoMo?: number;
  consumata: boolean;
  disponibili: number | null;   // null = senza costo: sempre nella borsa
}

const testo = (id: Id, d: Dati) => {
  const i = d.incantesimi[id];
  return i?.it?.componenti.match(/M \((.*)\)\s*$/)?.[1] ?? i?.componenti.M?.testo ?? '';
};

// Gli incantesimi che il personaggio può lanciare (trucchetti, preparati, sempre preparati, libro)
export function conosciuti(s: Scheda): Id[] {
  return [...new Set(s.magia.flatMap((m) => [...m.trucchetti.scelti, ...m.semprePreparati, ...(m.preparati?.scelti ?? []), ...(m.libro?.scelti ?? [])]))];
}

// ignoraNonConsumate: regola del tavolo (23/11): le componenti con costo che non si consumano vanno in «nonServono»
export function componenti(s: Scheda, st: StatoPartita, d: Dati = DATI, ignoraNonConsumate = false): { senzaCosto: Componente[]; conCosto: Componente[]; nonServono: Componente[] } {
  const senzaCosto: Componente[] = [], conCosto: Componente[] = [], nonServono: Componente[] = [];
  for (const id of conosciuti(s)) {
    const i = d.incantesimi[id];
    const M = i?.componenti.M;
    if (!i || !M) continue;
    const base = { incantesimo: id, nome: i.nome, testo: testo(id, d), consumata: !!M.consumato };
    if (!M.costoMo) { senzaCosto.push({ ...base, disponibili: null }); continue; }
    if (ignoraNonConsumate && !M.consumato) { nonServono.push({ ...base, costoMo: M.costoMo, disponibili: null }); continue; }
    const daOggetto = MATERIALE_DA_OGGETTO[id]?.oggetto;
    const comprati = s.inventario.filter((v) => v.oggetto === `materiale:${id}` || (daOggetto && v.oggetto === daOggetto)).reduce((n, v) => n + v.quantita, 0);
    conCosto.push({ ...base, costoMo: M.costoMo, disponibili: Math.max(0, comprati + (st.componenti?.[id] ?? 0)) });
  }
  const ord = (a: Componente, b: Componente) => a.nome.localeCompare(b.nome, 'it');
  return { senzaCosto: senzaCosto.sort(ord), conCosto: conCosto.sort(ord), nonServono: nonServono.sort(ord) };
}

// +1 / −1 a una componente con costo (comprata durante il gioco, persa, ritrovata…); mai sotto zero
export function cambiaComponente(st: StatoPartita, c: Componente, delta: number): StatoPartita {
  if (c.disponibili === null || c.disponibili + delta < 0) return st;
  return { ...st, componenti: { ...st.componenti, [c.incantesimo]: (st.componenti?.[c.incantesimo] ?? 0) + delta } };
}

// Dopo un lancio: una componente consumata cala di uno (se c'era)
export function dopoIlLancio(s: Scheda, st: StatoPartita, id: Id, d: Dati = DATI): StatoPartita {
  const c = componenti(s, st, d).conCosto.find((x) => x.incantesimo === id);
  return c && c.consumata && (c.disponibili ?? 0) > 0 ? cambiaComponente(st, c, -1) : st;
}

// Manca la componente con costo? (per il bordo rosso)
export const mancaComponente = (s: Scheda, st: StatoPartita, id: Id, d: Dati = DATI, ignoraNonConsumate = false) =>
  componenti(s, st, d, ignoraNonConsumate).conCosto.some((c) => c.incantesimo === id && c.disponibili === 0);
