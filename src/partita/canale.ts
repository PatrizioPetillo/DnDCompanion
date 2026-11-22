// Il telefono del giocatore riceve gli eventi del master (22/11) e li applica alla partita del personaggio giusto.
import type { Archivio } from '../archivio/archivio';
import type { Bozza } from '../creazione/percorso';
import { calcolaScheda } from '../regole';
import type { Personaggio } from '../regole/tipi';
import { applica, eventoValido, type EventoRicevuto } from './eventi';
import type { StatoPartita } from './partita';

export interface Avviso { pgId: string; nome: string; testo: string; prima: StatoPartita; dopo: StatoPartita }

const massimoPf = (b: Bozza) => { try { return calcolaScheda(b as Personaggio).pf.totale; } catch { return 1; } };

// Applica gli eventi nuovi (seq oltre l'ultimo visto); i tiri salvezza vanno in attesa della risposta
export function riceviEventi(a: Archivio, pgId: string, voci: { seq: number; il: string; evento: unknown }[]): { archivio: Archivio; avvisi: Avviso[] } {
  const p = a.personaggi.find((x) => x.id === pgId);
  if (!p) return { archivio: a, avvisi: [] };
  const nuove = voci.filter((v) => v.seq > (p.ultimoEvento ?? 0)).sort((x, y) => x.seq - y.seq);
  if (!nuove.length) return { archivio: a, avvisi: [] };
  const massimo = massimoPf(p.bozza);
  let partita = p.partita;
  const inAttesa = [...(p.inAttesa ?? [])];
  const avvisi: Avviso[] = [];
  for (const v of nuove) {
    const e = eventoValido(v.evento);
    if (!e) continue;
    if (e.tipo === 'ts') { inAttesa.push({ seq: v.seq, il: v.il, evento: e }); continue; }
    const prima = partita;
    const r = applica(partita, e, massimo);
    partita = r.st;
    avvisi.push({ pgId, nome: p.bozza.nome.trim() || 'Il tuo personaggio', testo: r.testo, prima, dopo: partita });
  }
  const ultimo = nuove[nuove.length - 1].seq;
  return {
    archivio: { ...a, personaggi: a.personaggi.map((x) => (x.id === pgId ? { ...x, partita, ultimoEvento: ultimo, inAttesa, aggiornato: new Date().toISOString() } : x)) },
    avvisi,
  };
}

// Il giocatore risponde a un tiro salvezza
export function rispondiTs(a: Archivio, pgId: string, seq: number, esito: 'riuscito' | 'fallito'): { archivio: Archivio; avviso?: Avviso } {
  const p = a.personaggi.find((x) => x.id === pgId);
  const ev = p?.inAttesa?.find((x) => x.seq === seq);
  if (!p || !ev) return { archivio: a };
  const r = applica(p.partita, ev.evento, massimoPf(p.bozza), esito);
  return {
    archivio: { ...a, personaggi: a.personaggi.map((x) => (x.id === pgId ? { ...x, partita: r.st, inAttesa: (x.inAttesa ?? []).filter((y) => y.seq !== seq) } : x)) },
    avviso: { pgId, nome: p.bozza.nome.trim() || 'Il tuo personaggio', testo: r.testo, prima: p.partita, dopo: r.st },
  };
}

// «Annulla»: torna allo stato di prima, solo se nel frattempo la partita non è cambiata
export function annulla(a: Archivio, av: Avviso): Archivio | null {
  const p = a.personaggi.find((x) => x.id === av.pgId);
  if (!p || p.partita !== av.dopo) return null;
  return { ...a, personaggi: a.personaggi.map((x) => (x.id === av.pgId ? { ...x, partita: av.prima } : x)) };
}

export type { EventoRicevuto };
