// «I miei personaggi»: più personaggi salvati nel telefono, ognuno con il suo stato di partita e il ritratto.
// TypeScript puro: il salvataggio nel browser sta in ui/salvataggio.ts.
import { bozzaVuota, type Bozza } from '../creazione/percorso';
import { statoVuoto, type StatoPartita } from '../partita/partita';
import { DATI, type Dati } from '../regole/dati';
import { elementiVuoti, unione, type Elementi } from '../creazione/personalizzati';
import { importaJSON } from '../creazione/riepilogo';
import type { Background, MovimentoMonete, OggettoSvelato, Specie, Tavolo, Velo } from '../regole/tipi';
import type { Combattimento, Nemico } from '../creazione/incontri';
import { tavoloVuoto } from '../regole/tavolo';

export interface PersonaggioSalvato {
  id: string;
  bozza: Bozza;
  partita: StatoPartita;
  ritratto?: string;          // immagine piccola (data URL JPEG), solo nel telefono e nella copia JSON
  creato: string;             // ISO
  aggiornato: string;         // ISO
  // Collegamento col master (22/11): il segreto va nel link della scheda; con quello il master manda eventi a questo personaggio
  canale?: { segreto: string; id: string };
  // Tavolo collegato (23/11): il token con cui questo telefono manda la scheda al tavolo (solo lui la può aggiornare)
  invio?: { token: string };
  ultimoEvento?: number;                                        // l'ultimo evento già applicato
  inAttesa?: import('../partita/eventi').EventoRicevuto[];      // tiri salvezza che aspettano la risposta del giocatore
}
export interface Archivio { versione: 1; personaggi: PersonaggioSalvato[]; attivo: string | null; elementi?: Elementi; ultimaCopia?: string; tavoli?: TavoloSalvato[] }   // elementi: «I miei elementi»; ultimaCopia: ISO

// I tavoli creati come master: si riaprono, si modificano, si ricondividono
// gruppo: le schede che i giocatori hanno mandato al master per questo tavolo (21/11)
export interface MembroGruppo { id: string; bozza: Bozza; elementi?: Partial<Elementi>; ricevuto: string; canale?: string; pg?: string; il?: string }   // pg, il: dal tavolo collegato (23/11)   // canale: il segreto per mandargli eventi (22/11)
export interface TavoloSalvato { id: string; tavolo: Tavolo; aggiornato: string; gruppo?: MembroGruppo[]; oggetti?: OggettoDelMaster[]; incontri?: Incontro[] }
// Gli incontri preparati dal master (21/11); senza gruppo, il master scrive quanti personaggi e di che livello
export interface Incontro { id: string; nome: string; nemici: Nemico[]; combattimento?: Combattimento; manuale?: { quanti: number; livello: number } }
// Gli oggetti creati dal master (21/11): cosa fanno lo sa solo lui finché non sblocca l'identificazione.
// segreto: serve a sbloccare (non esce mai dal telefono); id: la sua impronta, nel link; chiave: decifra cosa fa.
export interface OggettoDelMaster {
  uid: string; apparente: string; aspetto?: string; svelato: OggettoSvelato; maledizione?: string;
  segreto: string; id: string; chiave: string; sbloccatoIl?: string; datoIl?: string;
}

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
// Lo stesso personaggio per un secondo tavolo (23/11): stesse scelte, salvato com'era, stato di partita e invio suoi
export function copiaPerTavolo(a: Archivio, id: string, t: Tavolo, ora = new Date()): { archivio: Archivio; id: string } {
  const o = a.personaggi.find((p) => p.id === id);
  if (!o) return { archivio: a, id };
  const { tavolo: _t, ...bozza } = structuredClone(o.bozza);
  void _t;
  return nuovo(unisciElementi(a, t.elementi), { ...bozza, tavolo: t }, ora, o.ritratto);
}

export function duplica(a: Archivio, id: string, ora = new Date()): { archivio: Archivio; id: string } {
  const o = a.personaggi.find((p) => p.id === id);
  if (!o) return { archivio: a, id };
  // La copia è una variante da rifinire: riparte aperta, non salvata
  const { conclusoIl: _, ...bozza } = structuredClone(o.bozza);
  const copia = { ...bozza, nome: `${o.bozza.nome.trim() || 'Senza nome'} (copia)` };
  return nuovo(a, copia, ora, o.ritratto);
}

export function elimina(a: Archivio, id: string): Archivio {
  return { ...a, personaggi: a.personaggi.filter((p) => p.id !== id), attivo: a.attivo === id ? null : a.attivo };
}

export const apri = (a: Archivio, id: string): Archivio => ({ ...a, attivo: id });
export const attivo = (a: Archivio): PersonaggioSalvato | null => a.personaggi.find((p) => p.id === a.attivo) ?? null;

// Una riga della lista: Nome · Livello / Specie · Classe / Origine (il background)
export interface VoceElenco { id: string; nome: string; livello: number; specie: string; classe: string; classeId?: string; origine: string; iniziali: string; pronto: boolean; ritratto?: string; tavolo?: string }
export function elenco(a: Archivio, d: Dati = DATI): VoceElenco[] {
  return [...a.personaggi].sort((x, y) => y.aggiornato.localeCompare(x.aggiornato)).map((p) => {
    const b = p.bozza;
    const specie = b.specie ? d.specie[b.specie] : undefined;
    const lignaggio = specie?.lignaggi?.opzioni.find((o) => o.id === b.scelte[specie.lignaggi!.scelta]?.[0]);
    const nome = b.nome.trim() || 'Senza nome';
    return {
      id: p.id, nome, livello: b.livello,
      specie: lignaggio?.nome ?? specie?.nome ?? 'Specie da scegliere',
      classe: b.classe ? d.classi[b.classe]?.nome ?? b.classe : 'Classe da scegliere',
      ...(b.classe ? { classeId: b.classe } : {}),
      origine: b.background ? d.background[b.background]?.nome ?? b.background : 'Background da scegliere',
      iniziali: iniziali(nome),
      pronto: !!b.conclusoIl,   // «In creazione» finché il giocatore non lo salva (19/11)
      ...(p.ritratto ? { ritratto: p.ritratto } : {}),
      ...(b.tavolo ? { tavolo: b.tavolo.nome.trim() || 'Tavolo senza nome' } : {}),   // copie per tavoli diversi (23/11)
    };
  });
}

export function iniziali(nome: string): string {
  const parole = nome.trim().split(/\s+/).filter((p) => /^\p{L}/u.test(p));
  if (!parole.length) return '?';
  return (parole.length === 1 ? parole[0].slice(0, 2) : parole[0][0] + parole[parole.length - 1][0]).toUpperCase();
}

// ───────── «I miei elementi»: background inseriti dal proprio manuale ─────────
export const elementi = (a: Archivio): Elementi => ({ ...elementiVuoti(), ...a.elementi });
export const salvaBackground = (a: Archivio, bg: Background): Archivio =>
  ({ ...a, elementi: { ...elementi(a), background: { ...elementi(a).background, [bg.id]: bg } } });
// Si toglie solo se nessun personaggio lo usa
export function eliminaBackground(a: Archivio, id: string): { archivio: Archivio; usatoDa: string[] } {
  const usatoDa = a.personaggi.filter((p) => p.bozza.background === id).map((p) => p.bozza.nome.trim() || 'Senza nome');
  if (usatoDa.length) return { archivio: a, usatoDa };
  const { [id]: _tolto, ...resto } = elementi(a).background;
  void _tolto;
  return { archivio: { ...a, elementi: { ...elementi(a), background: resto } }, usatoDa };
}
// Importando una scheda (JSON o link) i suoi elementi entrano tra i miei; a parità di id resta il mio
export const unisciElementi = (a: Archivio, e?: Partial<Elementi>): Archivio => (e ? { ...a, elementi: unione(e, elementi(a)) } : a);

// Le specie inserite dal proprio manuale, come i background
export const salvaSpecie = (a: Archivio, sp: Specie): Archivio =>
  ({ ...a, elementi: { ...elementi(a), specie: { ...elementi(a).specie, [sp.id]: sp } } });
export function eliminaSpecie(a: Archivio, id: string): { archivio: Archivio; usatoDa: string[] } {
  const usatoDa = a.personaggi.filter((p) => p.bozza.specie === id).map((p) => p.bozza.nome.trim() || 'Senza nome');
  if (usatoDa.length) return { archivio: a, usatoDa };
  const { [id]: _tolta, ...resto } = elementi(a).specie ?? {};
  void _tolta;
  return { archivio: { ...a, elementi: { ...elementi(a), specie: resto } }, usatoDa };
}

// ───────── Copia di sicurezza: tutti i personaggi in un file ─────────
// Il telefono può cancellare i dati di un sito (Safari, se l'app non è installata): questa copia è l'unico modo di non perderli.
const FORMATO_COPIA = 'companion-b20-copia';

export function esportaTutto(a: Archivio, ora = new Date()): { testo: string; archivio: Archivio } {
  const testo = JSON.stringify({ formato: FORMATO_COPIA, versione: 1, data: ora.toISOString(), personaggi: a.personaggi, elementi: elementi(a) });
  return { testo, archivio: { ...a, ultimaCopia: ora.toISOString() } };
}

export const eCopiaCompleta = (testo: string): boolean => {
  try { return (JSON.parse(testo) as { formato?: string })?.formato === FORMATO_COPIA; } catch { return false; }
};

// Ogni personaggio passa dagli stessi controlli della scheda singola. Uno che c'è già (stesso id) non si duplica.
export function importaTutto(a: Archivio, testo: string, d: Dati = DATI): { archivio: Archivio; aggiunti: number; gia: number; scartati: number } | { errore: string } {
  let x: { formato?: string; versione?: number; personaggi?: PersonaggioSalvato[]; elementi?: Elementi };
  try { x = JSON.parse(testo); } catch { return { errore: 'Il file non è un JSON valido.' }; }
  if (x?.formato !== FORMATO_COPIA || !Array.isArray(x.personaggi)) return { errore: 'Questo file non è una copia di Companion B20.' };
  if (x.versione !== 1) return { errore: 'La copia è di una versione dell\'app che questa non conosce.' };
  let out = a;
  let aggiunti = 0, gia = 0, scartati = 0;
  for (const p of x.personaggi) {
    if (!p?.id || !p.bozza) { scartati++; continue; }
    if (out.personaggi.some((q) => q.id === p.id)) { gia++; continue; }
    const r = importaJSON(JSON.stringify({ formato: 'companion-b20', versione: 1, personaggio: p.bozza, ritratto: p.ritratto, elementi: x.elementi }), d);
    if ('errore' in r) { scartati++; continue; }
    out = unisciElementi(out, r.elementi);
    const salvato: PersonaggioSalvato = {
      id: p.id, bozza: r.bozza, partita: { ...statoVuoto(), ...p.partita },
      creato: typeof p.creato === 'string' ? p.creato : new Date().toISOString(),
      aggiornato: typeof p.aggiornato === 'string' ? p.aggiornato : new Date().toISOString(),
      ...(r.ritratto ? { ritratto: r.ritratto } : {}),
    };
    out = { ...out, personaggi: [...out.personaggi, salvato] };
    aggiunti++;
  }
  return { archivio: out, aggiunti, gia, scartati };
}

// «Ultima copia: mai / oggi / 3 giorni fa»; da rifare dopo 7 giorni o se un personaggio è cambiato dopo la copia
export function statoCopia(a: Archivio, ora = new Date()): { testo: string; daRifare: boolean } {
  if (!a.ultimaCopia) return { testo: 'mai', daRifare: a.personaggi.length > 0 };
  const giorni = Math.floor((ora.getTime() - new Date(a.ultimaCopia).getTime()) / 86_400_000);
  const cambiati = a.personaggi.some((p) => p.aggiornato > a.ultimaCopia!);
  const testo = giorni <= 0 ? 'oggi' : giorni === 1 ? 'ieri' : `${giorni} giorni fa`;
  return { testo, daRifare: a.personaggi.length > 0 && (giorni >= 7 || cambiati) };
}

// ───────── «I miei tavoli» (chi fa il master) ─────────
export const tavoli = (a: Archivio): TavoloSalvato[] => [...(a.tavoli ?? [])].sort((x, y) => y.aggiornato.localeCompare(x.aggiornato));
export function nuovoTavolo(a: Archivio, ora = new Date()): { archivio: Archivio; id: string } {
  const id = `tv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  return { archivio: { ...a, tavoli: [{ id, tavolo: tavoloVuoto(), aggiornato: ora.toISOString() }, ...(a.tavoli ?? [])] }, id };
}
export const aggiornaTavolo = (a: Archivio, id: string, t: Tavolo, ora = new Date()): Archivio =>
  ({ ...a, tavoli: (a.tavoli ?? []).map((x) => (x.id === id ? { ...x, tavolo: t, aggiornato: ora.toISOString() } : x)) });
export const eliminaTavolo = (a: Archivio, id: string): Archivio => ({ ...a, tavoli: (a.tavoli ?? []).filter((x) => x.id !== id) });

// Un personaggio portato a un tavolo: le sue scelte non cambiano, il tavolo le controlla con avvisi.
// Gli elementi del master entrano tra i miei, così il motore li conosce anche senza il link.
export function portaAlTavolo(a: Archivio, id: string, t: Tavolo | undefined, ora = new Date()): Archivio {
  const p = a.personaggi.find((x) => x.id === id);
  if (!p) return a;
  const { tavolo: _vecchio, ...resto } = p.bozza;
  void _vecchio;
  return aggiorna(t ? unisciElementi(a, t.elementi) : a, id, { bozza: t ? { ...resto, tavolo: t } : resto }, ora);
}

// «Il mio gruppo» (21/11): la scheda di un giocatore entra nel gruppo di un tavolo. Se c'è già un personaggio con lo stesso
// nome, è il giocatore che ha mandato la versione aggiornata: la sostituisce.
export function aggiungiAlGruppo(a: Archivio, tavoloId: string, bozza: Bozza, elementi: Partial<Elementi> | undefined, ora = new Date(), canale?: string,
  dalTavolo?: { pg: string; il: string }): { archivio: Archivio; aggiornato: boolean } {
  const chiave = bozza.nome.trim().toLowerCase();
  let aggiornato = false;
  const tavoliNuovi = (a.tavoli ?? []).map((t) => {
    if (t.id !== tavoloId) return t;
    const gruppo = t.gruppo ?? [];
    // dal tavolo collegato il personaggio si riconosce dal suo id; dal link, dal nome
    const esistente = dalTavolo ? gruppo.find((m) => m.pg === dalTavolo.pg) ?? gruppo.find((m) => !m.pg && chiave && m.bozza.nome.trim().toLowerCase() === chiave)
      : gruppo.find((m) => m.bozza.nome.trim().toLowerCase() === chiave && chiave);
    aggiornato = !!esistente;
    const membro: MembroGruppo = { id: esistente?.id ?? `gr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      bozza: structuredClone(bozza), ...(elementi ? { elementi } : {}), ricevuto: ora.toISOString(), ...(canale ?? esistente?.canale ? { canale: canale ?? esistente?.canale } : {}),
      ...(dalTavolo ? dalTavolo : esistente?.pg ? { pg: esistente.pg, il: esistente.il } : {}) };
    return { ...t, gruppo: esistente ? gruppo.map((m) => (m.id === esistente.id ? membro : m)) : [...gruppo, membro] };
  });
  return { archivio: { ...a, tavoli: tavoliNuovi }, aggiornato };
}
export const togliPgDalGruppo = (a: Archivio, tavoloId: string, pg: string): Archivio =>
  ({ ...a, tavoli: (a.tavoli ?? []).map((t) => (t.id === tavoloId ? { ...t, gruppo: (t.gruppo ?? []).filter((m) => m.pg !== pg) } : t)) });
export const togliDalGruppo = (a: Archivio, tavoloId: string, membroId: string): Archivio =>
  ({ ...a, tavoli: (a.tavoli ?? []).map((t) => (t.id === tavoloId ? { ...t, gruppo: (t.gruppo ?? []).filter((m) => m.id !== membroId) } : t)) });

// ───────── Oggetti del master e oggetti ricevuti (21/11) ─────────
export const salvaOggettoTavolo = (a: Archivio, tavoloId: string, o: OggettoDelMaster): Archivio =>
  ({ ...a, tavoli: (a.tavoli ?? []).map((t) => (t.id !== tavoloId ? t : { ...t, oggetti: (t.oggetti ?? []).some((x) => x.uid === o.uid)
    ? (t.oggetti ?? []).map((x) => (x.uid === o.uid ? o : x)) : [...(t.oggetti ?? []), o] })) });
export const togliOggettoTavolo = (a: Archivio, tavoloId: string, uid: string): Archivio =>
  ({ ...a, tavoli: (a.tavoli ?? []).map((t) => (t.id !== tavoloId ? t : { ...t, oggetti: (t.oggetti ?? []).filter((x) => x.uid !== uid) })) });

// Il giocatore aggiunge l'oggetto ricevuto a un suo personaggio; lo stesso oggetto non entra due volte
export function aggiungiOggettoVelato(a: Archivio, pgId: string, velo: Velo, ora = new Date()): { archivio: Archivio; giaPresente: boolean } {
  const p = a.personaggi.find((x) => x.id === pgId);
  if (!p) return { archivio: a, giaPresente: false };
  const lista = p.bozza.oggettiMagici ?? [];
  if (lista.some((o) => o.velato?.sblocco === velo.sblocco)) return { archivio: a, giaPresente: true };
  const nuovo = { uid: `om-${ora.getTime().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, id: 'velato', velato: velo };
  return { archivio: aggiorna(a, pgId, { bozza: { ...p.bozza, oggettiMagici: [...lista, nuovo] } }, ora), giaPresente: false };
}

// Tutti gli oggetti ancora da identificare, di tutti i personaggi: l'app li tiene d'occhio
export const oggettiVelati = (a: Archivio) =>
  a.personaggi.flatMap((p) => (p.bozza.oggettiMagici ?? []).filter((o) => o.velato).map((o) => ({ pgId: p.id, uid: o.uid, velo: o.velato! })));

export function sostituisciOggetto(a: Archivio, pgId: string, o: import('../regole/tipi').OggettoMagicoPosseduto, ora = new Date()): Archivio {
  const p = a.personaggi.find((x) => x.id === pgId);
  if (!p) return a;
  return aggiorna(a, pgId, { bozza: { ...p.bozza, oggettiMagici: (p.bozza.oggettiMagici ?? []).map((x) => (x.uid === o.uid ? o : x)) } }, ora);
}

export const salvaIncontro = (a: Archivio, tavoloId: string, inc: Incontro): Archivio =>
  ({ ...a, tavoli: (a.tavoli ?? []).map((t) => (t.id !== tavoloId ? t : { ...t, incontri: (t.incontri ?? []).some((x) => x.id === inc.id)
    ? (t.incontri ?? []).map((x) => (x.id === inc.id ? inc : x)) : [...(t.incontri ?? []), inc] })) });
export const togliIncontro = (a: Archivio, tavoloId: string, id: string): Archivio =>
  ({ ...a, tavoli: (a.tavoli ?? []).map((t) => (t.id !== tavoloId ? t : { ...t, incontri: (t.incontri ?? []).filter((x) => x.id !== id) })) });

// Monete: dal bottino del master (link) o scritte dal giocatore. Lo stesso bottino non entra due volte.
export function aggiungiMovimento(a: Archivio, pgId: string, m: MovimentoMonete, ora = new Date()): { archivio: Archivio; giaPresente: boolean } {
  const p = a.personaggi.find((x) => x.id === pgId);
  if (!p) return { archivio: a, giaPresente: false };
  if ((p.bozza.movimenti ?? []).some((x) => x.id === m.id)) return { archivio: a, giaPresente: true };
  return { archivio: aggiorna(a, pgId, { bozza: { ...p.bozza, movimenti: [...(p.bozza.movimenti ?? []), m] } }, ora), giaPresente: false };
}
