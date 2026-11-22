// Eventi dal master (22/11): il master manda «8 danni», «Prono», «tiro salvezza su Destrezza CD 15»;
// il telefono del giocatore li applica alla sua partita. Il giocatore resta l'unico che scrive la sua scheda:
// i danni si sommano invece di sovrascrivere, quindi l'ordine non conta e non ci sono conflitti.
import type { Car as Caratteristica } from '../regole/tipi';
import { aggiungi, CONDIZIONE, fannoPerdereConcentrazione, togli, type IdCondizione } from './condizioni';
import { cura, danno, fineConcentrazione, temporanei, type StatoPartita } from './partita';

export type Evento =
  | { tipo: 'danno'; n: number; critico?: boolean; nota?: string }
  | { tipo: 'cura'; n: number; nota?: string }
  | { tipo: 'temporanei'; n: number; nota?: string }
  | { tipo: 'condizione'; id: IdCondizione; togli?: boolean; nota?: string }
  // Tiro salvezza: lo tira il giocatore. Se fallisce: danno pieno e l'eventuale condizione; se riesce: metà o niente (SRD p. 16)
  | { tipo: 'ts'; car: Caratteristica; cd: number; n?: number; meta?: boolean; condizione?: IdCondizione; nota?: string };
export interface EventoRicevuto { seq: number; il: string; evento: Evento; tavolo?: string }

const CAR = ['FOR', 'DES', 'COS', 'INT', 'SAG', 'CAR'];
const intero = (x: unknown, max = 999) => typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= max;
const nota = (x: unknown) => x === undefined || (typeof x === 'string' && x.length <= 80);

// Quello che arriva dal servizio non è fidato: si accetta solo un evento ben fatto
export function eventoValido(x: unknown): Evento | null {
  const e = x as Record<string, unknown> | null;
  if (!e || typeof e !== 'object' || !nota(e.nota)) return null;
  const n = typeof e.nota === 'string' && e.nota.trim() ? { nota: e.nota.trim() } : {};
  const cond = (v: unknown) => typeof v === 'string' && v in CONDIZIONE;
  switch (e.tipo) {
    case 'danno': return intero(e.n) && (e.n as number) > 0 ? { tipo: 'danno', n: e.n as number, ...(e.critico === true ? { critico: true } : {}), ...n } : null;
    case 'cura': case 'temporanei': return intero(e.n) && (e.n as number) > 0 ? { tipo: e.tipo, n: e.n as number, ...n } : null;
    case 'condizione': return cond(e.id) ? { tipo: 'condizione', id: e.id as IdCondizione, ...(e.togli === true ? { togli: true } : {}), ...n } : null;
    case 'ts':
      if (!CAR.includes(e.car as string) || !intero(e.cd, 40) || (e.n !== undefined && !intero(e.n)) || (e.condizione !== undefined && !cond(e.condizione))) return null;
      if (!e.n && !e.condizione) return null;
      return { tipo: 'ts', car: e.car as Caratteristica, cd: e.cd as number, ...(e.n ? { n: e.n as number } : {}), ...(e.meta === true ? { meta: true } : {}),
        ...(e.condizione ? { condizione: e.condizione as IdCondizione } : {}), ...n };
    default: return null;
  }
}

const perché = (e: Evento) => (e.nota ? ` (${e.nota})` : '');
export const NOME_CAR: Record<string, string> = { FOR: 'Forza', DES: 'Destrezza', COS: 'Costituzione', INT: 'Intelligenza', SAG: 'Saggezza', CAR: 'Carisma' };

// Come si legge per il giocatore
export function descrivi(e: Evento): string {
  switch (e.tipo) {
    case 'danno': return `−${e.n} PF${e.critico ? ' (colpo critico)' : ''}${perché(e)}`;
    case 'cura': return `+${e.n} PF${perché(e)}`;
    case 'temporanei': return `${e.n} PF temporanei${perché(e)}`;
    case 'condizione': return `${e.togli ? 'Non sei più' : 'Sei'} ${CONDIZIONE[e.id].nome.toLowerCase()}${perché(e)}`;
    case 'ts': return `Tiro salvezza su ${NOME_CAR[e.car]}, CD ${e.cd}${perché(e)}: ${[
      e.n ? `se fallisci ${e.n} danni${e.meta ? `, se riesci ${Math.floor(e.n / 2)}` : ', se riesci niente'}` : '',
      e.condizione ? `se fallisci sei ${CONDIZIONE[e.condizione].nome.toLowerCase()}` : ''].filter(Boolean).join('; ')}`;
  }
}

// Applica un evento. I tiri salvezza aspettano la risposta del giocatore (riuscito o no): qui si applica l'esito.
export function applica(st: StatoPartita, e: Evento, massimo: number, esitoTs?: 'riuscito' | 'fallito'): { st: StatoPartita; testo: string } {
  let nuovo = st;
  switch (e.tipo) {
    case 'danno': nuovo = danno(st, e.n, massimo, !!e.critico); break;
    case 'cura': nuovo = cura(st, e.n); break;
    case 'temporanei': nuovo = temporanei(st, e.n); break;
    case 'condizione': nuovo = { ...st, condizioni: e.togli ? togli(st.condizioni ?? [], e.id) : aggiungi(st.condizioni ?? [], e.id) }; break;
    case 'ts': {
      const fallito = esitoTs !== 'riuscito';
      const n = e.n ? (fallito ? e.n : e.meta ? Math.floor(e.n / 2) : 0) : 0;
      if (n > 0) nuovo = danno(nuovo, n, massimo);
      if (fallito && e.condizione) nuovo = { ...nuovo, condizioni: aggiungi(nuovo.condizioni ?? [], e.condizione) };
      const pezzi = [n ? `−${n} PF` : '', fallito && e.condizione ? CONDIZIONE[e.condizione].nome.toLowerCase() : ''].filter(Boolean);
      const testo = `Tiro salvezza ${fallito ? 'fallito' : 'riuscito'}${perché(e)}: ${pezzi.length ? pezzi.join(', ') : 'niente'}`;
      return { st: concentrazione(nuovo, massimo), testo };
    }
  }
  return { st: concentrazione(nuovo, massimo), testo: descrivi(e) };
}

// Diventare incapacitato fa perdere la concentrazione (p. 184); a 0 PF ci pensa già danno()
function concentrazione(st: StatoPartita, massimo: number): StatoPartita {
  return st.concentrazione && fannoPerdereConcentrazione(st.condizioni ?? [], st.pfPersi >= massimo) ? fineConcentrazione(st) : st;
}
