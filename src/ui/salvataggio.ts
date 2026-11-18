// Salvataggio nel browser (sezione 9): niente server, niente account.
import { useEffect, useState } from 'react';
import type { Bozza } from '../creazione/percorso';
import { migra, type Archivio } from '../archivio/archivio';
import { statoVuoto, type StatoPartita } from '../partita/partita';

// Chiavi della versione con un solo personaggio: si leggono solo per la migrazione
const CHIAVE = 'companion-b20:bozza';
const CHIAVE_PARTITA = 'companion-b20:partita';
const CHIAVE_TEMA = 'companion-b20:tema';

function leggi<T>(chiave: string, predefinito: T): T {
  try {
    const v = localStorage.getItem(chiave);
    return v ? (JSON.parse(v) as T) : predefinito;
  } catch {
    return predefinito;
  }
}
function scrivi(chiave: string, valore: unknown) {
  try { localStorage.setItem(chiave, JSON.stringify(valore)); } catch { /* spazio pieno o modalità privata */ }
}

// «I miei personaggi»: tutti i personaggi in una chiave sola. Al primo avvio la vecchia bozza (un solo personaggio)
// diventa il primo della lista; le vecchie chiavi restano dove sono, non si cancella niente.
const CHIAVE_ARCHIVIO = 'companion-b20:personaggi';
export function useArchivio() {
  const [archivio, setArchivio] = useState<Archivio>(() => {
    const salvato = leggi<Archivio | null>(CHIAVE_ARCHIVIO, null);
    if (salvato?.versione === 1) return { ...salvato, personaggi: salvato.personaggi.map((p) => ({ ...p, partita: { ...statoVuoto(), ...p.partita } })) };
    return migra(leggi<Bozza | null>(CHIAVE, null), leggi<StatoPartita | null>(CHIAVE_PARTITA, null));
  });
  useEffect(() => scrivi(CHIAVE_ARCHIVIO, archivio), [archivio]);
  return [archivio, setArchivio] as const;
}

export type Tema = 'giorno' | 'notte';
export function useTema() {
  const sistema: Tema = typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches ? 'notte' : 'giorno';
  const [tema, setTema] = useState<Tema>(() => leggi(CHIAVE_TEMA, sistema));
  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tema === 'notte' ? '#1A1512' : '#6E1A1A');
    scrivi(CHIAVE_TEMA, tema);
  }, [tema]);
  return [tema, setTema] as const;
}

