// Lo stato di partita che il giocatore manda al tavolo collegato (23/11): PF, condizioni, concentrazione,
// tiri contro la morte e l'ultima iniziativa tirata. Il master lo vede nel combattimento; il giocatore resta l'unico che lo scrive.
// Quello che arriva dal servizio non è fidato: si accetta solo uno stato ben fatto.
import type { StatoPartita } from './partita';
import { CONDIZIONE, type CondizioneSegnata, type IdCondizione } from './condizioni';
import { DATI } from '../regole/dati';
import type { Id } from '../regole/tipi';

export interface IniziativaTirata { totale: number; il: string }
export interface StatoAlTavolo {
  pfPersi: number; pfTemporanei: number; condizioni: CondizioneSegnata[]; concentrazione: Id | null;
  morte: { successi: number; fallimenti: number; stabile: boolean; morto: boolean };
  iniziativa?: IniziativaTirata;
}

export const daPartita = (p: StatoPartita): StatoAlTavolo => ({
  pfPersi: p.pfPersi, pfTemporanei: p.pfTemporanei, condizioni: p.condizioni ?? [], concentrazione: p.concentrazione,
  morte: p.morte, ...(p.iniziativa ? { iniziativa: p.iniziativa } : {}),
});

const intero = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
const data = (v: unknown) => typeof v === 'string' && v.length <= 40 && !Number.isNaN(Date.parse(v));

export function statoValido(x: unknown): StatoAlTavolo | null {
  const s = x as Record<string, unknown> | null;
  if (!s || typeof s !== 'object') return null;
  if (!intero(s.pfPersi, 0, 999) || !intero(s.pfTemporanei, 0, 999)) return null;
  if (!Array.isArray(s.condizioni) || s.condizioni.length > 15) return null;
  const condizioni: CondizioneSegnata[] = [];
  for (const c of s.condizioni as Record<string, unknown>[]) {
    if (!c || typeof c.id !== 'string' || !(c.id in CONDIZIONE)) return null;
    if (c.livello !== undefined && !intero(c.livello, 1, 6)) return null;
    condizioni.push({ id: c.id as IdCondizione, ...(c.livello !== undefined ? { livello: c.livello as number } : {}) });
  }
  if (s.concentrazione !== null && !(typeof s.concentrazione === 'string' && s.concentrazione in DATI.incantesimi)) return null;
  const m = s.morte as Record<string, unknown> | null;
  if (!m || !intero(m.successi, 0, 3) || !intero(m.fallimenti, 0, 3) || typeof m.stabile !== 'boolean' || typeof m.morto !== 'boolean') return null;
  const i = s.iniziativa as Record<string, unknown> | undefined;
  if (i !== undefined && (!i || !intero(i.totale, -20, 60) || !data(i.il))) return null;
  return {
    pfPersi: s.pfPersi as number, pfTemporanei: s.pfTemporanei as number, condizioni, concentrazione: (s.concentrazione as Id | null),
    morte: { successi: m.successi as number, fallimenti: m.fallimenti as number, stabile: m.stabile, morto: m.morto },
    ...(i ? { iniziativa: { totale: i.totale as number, il: i.il as string } } : {}),
  };
}

// Un'iniziativa vale per il combattimento se è stata tirata dopo l'inizio, o poco prima
// (il master dice «tirate l'iniziativa» e intanto prepara i nemici).
export const ANTICIPO_MS = 10 * 60 * 1000;
export const valePer = (i: IniziativaTirata | undefined, iniziato: string | undefined) =>
  !!i && !!iniziato && Date.parse(i.il) >= Date.parse(iniziato) - ANTICIPO_MS;
