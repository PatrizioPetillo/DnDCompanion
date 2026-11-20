// Elenco di tutti gli incantesimi dell'SRD 5.2 (richiesta di Patrizio, 20/11): da consultare, non da scegliere.
// Filtri: classe, livello, scuola, più quelli della scelta (nome anche in inglese, concentrazione, rituale).
import { DATI } from '../regole';
import type { Dati } from '../regole/dati';
import type { Id } from '../regole/tipi';
import { filtra, type Filtri } from './magia';

export interface FiltriCompendio extends Filtri { classe?: Id }

export const CLASSI_INCANTATRICI = ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard'];

// Gruppi per livello (0 = trucchetti), in ordine; dentro, in ordine alfabetico italiano
export function compendio(f: FiltriCompendio, d: Dati = DATI): { livello: number; incantesimi: Id[] }[] {
  const base = Object.values(d.incantesimi).filter((i) => !f.classe || i.liste.includes(f.classe)).map((i) => ({ id: i.id }));
  const trovati = filtra(base, f, d).map((v) => d.incantesimi[v.id]);
  const livelli = [...new Set(trovati.map((i) => i.livello))].sort((a, b) => a - b);
  return livelli.map((l) => ({
    livello: l,
    incantesimi: trovati.filter((i) => i.livello === l).sort((a, b) => a.nome.localeCompare(b.nome, 'it')).map((i) => i.id),
  }));
}
