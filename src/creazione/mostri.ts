// I mostri dell'SRD per gli incontri del master (23/11): solo i numeri delle schede, nessuna tattica.
// Dati in src/regole/dati/mostri.json (strumenti/mostri-srd.py): nome italiano (SRD 5.2.1 IT) e inglese (SRD 5.2),
// tipo, CA, iniziativa, PF, GS, PE, immunità alle condizioni e pagina dell'SRD 5.2.
import type { IdCondizione } from '../partita/condizioni';
import type { Nemico } from './incontri';

export interface Mostro {
  id: string; nome: string; nomeEn: string; tipo: string; ca: number; iniziativa: number; pf: number; dadiPf: string;
  gs: string; pe: number; immunita?: IdCondizione[]; notaImmunita?: string; srd?: { pagina: number | null }; solo521?: boolean;
}

// Il GS 0 vale 0 o 10 PE (SRD p. 253): la scheda dice quale, e negli incontri «0*» è quello da 10
export const gradoIncontro = (m: Mostro) => (m.gs === '0' && m.pe === 10 ? '0*' : m.gs);

export const daMostro = (m: Mostro): Omit<Nemico, 'id' | 'quanti'> => ({
  nome: m.nome, gs: gradoIncontro(m), iniziativa: m.iniziativa, pf: m.pf, ca: m.ca, mostro: m.id,
  ...(m.immunita?.length ? { immunita: m.immunita } : {}),
});

const senzaAccenti = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// Ricerca per nome italiano o inglese, e per grado di sfida
export function cercaMostri(tutti: Mostro[], testo: string, gs = ''): Mostro[] {
  const q = senzaAccenti(testo.trim());
  return tutti.filter((m) => (!gs || m.gs === gs) && (!q || senzaAccenti(m.nome).includes(q) || senzaAccenti(m.nomeEn).includes(q)));
}

export const caricaMostri = async (): Promise<Mostro[]> => (await import('../regole/dati/mostri.json')).default as Mostro[];
