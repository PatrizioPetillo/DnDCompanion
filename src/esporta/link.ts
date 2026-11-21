// Link della scheda (sezione 5.4 e 9): il personaggio compresso nell'indirizzo, dopo il «#».
// Niente server: la parte dopo «#» non arriva nemmeno all'hosting. Compressione nativa del browser (deflate).
import type { Bozza } from '../creazione/percorso';
import { importaJSON } from '../creazione/riepilogo';
import { quanti, type Elementi } from '../creazione/personalizzati';
import { DATI } from '../regole/dati';
import { validaTavolo } from '../regole/tavolo';
import type { Tavolo, Velo } from '../regole/tipi';
import type { OggettoDelMaster } from '../archivio/archivio';
import { cifra } from '../sblocchi/cifra';

const PREFISSO = '#scheda=';

const base64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const daBase64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function trasforma(dati: Uint8Array, flusso: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const risposta = new Response(new Blob([dati as BlobPart]).stream().pipeThrough(flusso));
  return new Uint8Array(await risposta.arrayBuffer());
}

export async function creaLink(b: Bozza, base: string, elementi?: Elementi): Promise<string> {
  const json = JSON.stringify({ formato: 'companion-b20', versione: 1, personaggio: b, ...(elementi && quanti(elementi) ? { elementi } : {}) });
  const compresso = await trasforma(new TextEncoder().encode(json), new CompressionStream('deflate-raw'));
  return `${base.split('#')[0]}${PREFISSO}${base64url(compresso)}`;
}

// Dall'indirizzo alla scheda; null se l'indirizzo non contiene una scheda
export async function leggiLink(hash: string): Promise<ReturnType<typeof importaJSON> | null> {
  if (!hash.startsWith(PREFISSO)) return null;
  try {
    const json = new TextDecoder().decode(await trasforma(daBase64url(hash.slice(PREFISSO.length)), new DecompressionStream('deflate-raw')));
    return importaJSON(json);
  } catch {
    return { errore: 'Il link della scheda è rovinato o incompleto: chiedi di rimandarlo.' };
  }
}

// ───────── Link del tavolo (sezione 5.1): la configurazione del master dopo «#tavolo=» ─────────
const PREFISSO_TAVOLO = '#tavolo=';

export async function creaLinkTavolo(t: Tavolo, base: string): Promise<string> {
  const json = JSON.stringify({ formato: 'companion-b20-tavolo', versione: 1, tavolo: t });
  const compresso = await trasforma(new TextEncoder().encode(json), new CompressionStream('deflate-raw'));
  return `${base.split('#')[0]}${PREFISSO_TAVOLO}${base64url(compresso)}`;
}

export async function leggiLinkTavolo(hash: string): Promise<{ tavolo: Tavolo } | { errore: string } | null> {
  if (!hash.startsWith(PREFISSO_TAVOLO)) return null;
  const rovinato = { errore: 'Il link del tavolo è rovinato o incompleto: chiedi al master di rimandarlo.' };
  try {
    const json = new TextDecoder().decode(await trasforma(daBase64url(hash.slice(PREFISSO_TAVOLO.length)), new DecompressionStream('deflate-raw')));
    const x = JSON.parse(json) as { formato?: string; versione?: number; tavolo?: unknown };
    if (x.formato !== 'companion-b20-tavolo') return rovinato;
    if (x.versione !== 1) return { errore: 'Il link del tavolo è di una versione dell\'app che questa non conosce: aggiorna l\'app.' };
    const tavolo = validaTavolo(x.tavolo, DATI);
    return tavolo ? { tavolo } : rovinato;
  } catch {
    return rovinato;
  }
}

// ───────── Link dell'oggetto da identificare (21/11): aspetto in chiaro, cosa fa cifrato, dopo «#oggetto=» ─────────
// La maledizione non entra mai nel link: resta nel telefono del master.
const PREFISSO_OGGETTO = '#oggetto=';

export async function veloDi(o: OggettoDelMaster, nomeTavolo?: string): Promise<Velo> {
  const { iv, cifrato } = await cifra(o.svelato, o.chiave);
  return { sblocco: o.id, apparente: o.apparente.trim() || 'Oggetto misterioso', ...(o.aspetto?.trim() ? { aspetto: o.aspetto.trim() } : {}),
    ...(nomeTavolo?.trim() ? { tavolo: nomeTavolo.trim() } : {}), iv, cifrato };
}

export async function creaLinkOggetto(o: OggettoDelMaster, base: string, nomeTavolo?: string): Promise<string> {
  const json = JSON.stringify({ formato: 'companion-b20-oggetto', versione: 1, velo: await veloDi(o, nomeTavolo) });
  const compresso = await trasforma(new TextEncoder().encode(json), new CompressionStream('deflate-raw'));
  return `${base.split('#')[0]}${PREFISSO_OGGETTO}${base64url(compresso)}`;
}

const corta = (x: unknown, n: number) => typeof x === 'string' && x.length <= n;
export function veloValido(v: unknown): Velo | null {
  const x = v as Partial<Velo> | null;
  if (!x || typeof x !== 'object') return null;
  if (!corta(x.sblocco, 40) || !/^[A-Za-z0-9_-]{22}$/.test(x.sblocco!) || !corta(x.apparente, 120) || !corta(x.iv, 40) || !corta(x.cifrato, 20000)) return null;
  if (x.aspetto !== undefined && !corta(x.aspetto, 2000)) return null;
  if (x.tavolo !== undefined && !corta(x.tavolo, 120)) return null;
  return { sblocco: x.sblocco!, apparente: x.apparente!, iv: x.iv!, cifrato: x.cifrato!, ...(x.aspetto ? { aspetto: x.aspetto } : {}), ...(x.tavolo ? { tavolo: x.tavolo } : {}) };
}

export async function leggiLinkOggetto(hash: string): Promise<{ velo: Velo } | { errore: string } | null> {
  if (!hash.startsWith(PREFISSO_OGGETTO)) return null;
  const rovinato = { errore: 'Il link dell\'oggetto è rovinato o incompleto: chiedi al master di rimandarlo.' };
  try {
    const json = new TextDecoder().decode(await trasforma(daBase64url(hash.slice(PREFISSO_OGGETTO.length)), new DecompressionStream('deflate-raw')));
    const x = JSON.parse(json) as { formato?: string; versione?: number; velo?: unknown };
    if (x.formato !== 'companion-b20-oggetto') return rovinato;
    if (x.versione !== 1) return { errore: 'Il link dell\'oggetto è di una versione dell\'app che questa non conosce: aggiorna l\'app.' };
    const velo = veloValido(x.velo);
    return velo ? { velo } : rovinato;
  } catch { return rovinato; }
}

// ───────── Link del bottino (21/11): monete a testa dopo «#bottino=» ─────────
const PREFISSO_BOTTINO = '#bottino=';
export interface Bottino { id: string; mo: number; nota?: string; tavolo?: string }

export async function creaLinkBottino(b: Bottino, base: string): Promise<string> {
  const json = JSON.stringify({ formato: 'companion-b20-bottino', versione: 1, bottino: b });
  const compresso = await trasforma(new TextEncoder().encode(json), new CompressionStream('deflate-raw'));
  return `${base.split('#')[0]}${PREFISSO_BOTTINO}${base64url(compresso)}`;
}

export async function leggiLinkBottino(hash: string): Promise<{ bottino: Bottino } | { errore: string } | null> {
  if (!hash.startsWith(PREFISSO_BOTTINO)) return null;
  const rovinato = { errore: 'Il link del bottino è rovinato o incompleto: chiedi al master di rimandarlo.' };
  try {
    const json = new TextDecoder().decode(await trasforma(daBase64url(hash.slice(PREFISSO_BOTTINO.length)), new DecompressionStream('deflate-raw')));
    const x = JSON.parse(json) as { formato?: string; versione?: number; bottino?: Partial<Bottino> };
    const b = x.bottino;
    if (x.formato !== 'companion-b20-bottino' || x.versione !== 1 || !b) return rovinato;
    if (!corta(b.id, 40) || typeof b.mo !== 'number' || !Number.isFinite(b.mo) || b.mo <= 0 || b.mo > 1e7) return rovinato;
    if (b.nota !== undefined && !corta(b.nota, 200)) return rovinato;
    if (b.tavolo !== undefined && !corta(b.tavolo, 120)) return rovinato;
    return { bottino: { id: b.id!, mo: Math.round(b.mo * 100) / 100, ...(b.nota ? { nota: b.nota } : {}), ...(b.tavolo ? { tavolo: b.tavolo } : {}) } };
  } catch { return rovinato; }
}

// Divide il bottino in parti uguali, in monete di rame (1 mo = 100 mr): il resto lo tiene il master
export function dividi(mo: number, parti: number): { aTesta: number; resto: number } {
  const mr = Math.round(mo * 100), n = Math.max(1, Math.floor(parti));
  return { aTesta: Math.floor(mr / n) / 100, resto: (mr % n) / 100 };
}
