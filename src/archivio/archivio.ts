// «I miei personaggi»: più personaggi salvati nel telefono, ognuno con il suo stato di partita e il ritratto.
// TypeScript puro: il salvataggio nel browser sta in ui/salvataggio.ts.
import { bozzaVuota, statoPassi, PASSI, type Bozza } from '../creazione/percorso';
import { statoVuoto, type StatoPartita } from '../partita/partita';
import { DATI, type Dati } from '../regole/dati';

export interface PersonaggioSalvato {
  id: string;
  bozza: Bozza;
  partita: StatoPartita;
  ritratto?: string;          // immagine piccola (data URL JPEG), solo nel telefono e nella copia JSON
  creato: string;             // ISO
  aggiornato: string;         // ISO
}
export interface Archivio { versione: 1; personaggi: PersonaggioSalvato[]; attivo: string | null }

export const archivioVuoto = (): Archivio => ({ versione: 1, personaggi: [], attivo: null });

const nuovoId = () => `pg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

// Dalla versione con un solo personaggio: se c'era una bozza iniziata, diventa il primo della lista
export function migra(vecchiaBozza: Bozza | null, vecchiaPartita: StatoPartita | null, ora = new Date()): Archivio {
  const iniziata = vecchiaBozza && (vecchiaBozza.classe || vecchiaBozza.specie || vecchiaBozza.background || vecchiaBozza.nome.trim());
  if (!iniziata) return archivioVuoto();
  const id = nuovoId();
  return { versione: 1, attivo: id, personaggi: [{ id, bozza: vecchiaBozza, partita: { ...statoVuoto(), ...vecchiaPartita }, creato: ora.toISOString(), aggiornato: ora.toISOString() }] };
}

export function nuovo(a: Archivio, bozza: Bozza = bozzaVuota(), ora = new Date(), ritratto?: string): { archivio: Archivio; id: string } {
  const id = nuovoId();
  const p: PersonaggioSalvato = { id, bozza, partita: statoVuoto(), creato: ora.toISOString(), aggiornato: ora.toISOString(), ...(ritratto ? { ritratto } : {}) };
  return { archivio: { ...a, personaggi: [p, ...a.personaggi], attivo: id }, id };
}

export function aggiorna(a: Archivio, id: string, modifica: Partial<Omit<PersonaggioSalvato, 'id' | 'creato'>>, ora = new Date()): Archivio {
  return { ...a, personaggi: a.personaggi.map((p) => (p.id === id ? { ...p, ...modifica, aggiornato: ora.toISOString() } : p)) };
}

// Duplica: utile per provare una variante (Travis Accolito / Travis Sapiente). La copia parte con PF e slot pieni.
export function duplica(a: Archivio, id: string, ora = new Date()): { archivio: Archivio; id: string } {
  const o = a.personaggi.find((p) => p.id === id);
  if (!o) return { archivio: a, id };
  const copia = { ...structuredClone(o.bozza), nome: `${o.bozza.nome.trim() || 'Senza nome'} (copia)` };
  return nuovo(a, copia, ora, o.ritratto);
}

export function elimina(a: Archivio, id: string): Archivio {
  return { ...a, personaggi: a.personaggi.filter((p) => p.id !== id), attivo: a.attivo === id ? null : a.attivo };
}

export const apri = (a: Archivio, id: string): Archivio => ({ ...a, attivo: id });
export const attivo = (a: Archivio): PersonaggioSalvato | null => a.personaggi.find((p) => p.id === a.attivo) ?? null;

// Una riga della lista: Nome · Livello / Specie · Classe / Origine (il background)
export interface VoceElenco { id: string; nome: string; livello: number; specie: string; classe: string; classeId?: string; origine: string; iniziali: string; pronto: boolean; ritratto?: string }
export function elenco(a: Archivio, d: Dati = DATI): VoceElenco[] {
  return [...a.personaggi].sort((x, y) => y.aggiornato.localeCompare(x.aggiornato)).map((p) => {
    const b = p.bozza;
    const specie = b.specie ? d.specie[b.specie] : undefined;
    const lignaggio = specie?.lignaggi?.opzioni.find((o) => o.id === b.scelte[specie.lignaggi!.scelta]?.[0]);
    const nome = b.nome.trim() || 'Senza nome';
    const stati = statoPassi(b, d);
    return {
      id: p.id, nome, livello: b.livello,
      specie: lignaggio?.nome ?? specie?.nome ?? 'Specie da scegliere',
      classe: b.classe ? d.classi[b.classe]?.nome ?? b.classe : 'Classe da scegliere',
      ...(b.classe ? { classeId: b.classe } : {}),
      origine: b.background ? d.background[b.background]?.nome ?? b.background : 'Background da scegliere',
      iniziali: iniziali(nome),
      pronto: PASSI.every((x) => x.id === 'riepilogo' || stati[x.id].stato === 'fatto' || stati[x.id].stato === 'non-serve'),
      ...(p.ritratto ? { ritratto: p.ritratto } : {}),
    };
  });
}

export function iniziali(nome: string): string {
  const parole = nome.trim().split(/\s+/).filter((p) => /^\p{L}/u.test(p));
  if (!parole.length) return '?';
  return (parole.length === 1 ? parole[0].slice(0, 2) : parole[0][0] + parole[parole.length - 1][0]).toUpperCase();
}
