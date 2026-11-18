// Link della scheda (sezione 5.4 e 9): il personaggio compresso nell'indirizzo, dopo il «#».
// Niente server: la parte dopo «#» non arriva nemmeno all'hosting. Compressione nativa del browser (deflate).
import type { Bozza } from '../creazione/percorso';
import { importaJSON } from '../creazione/riepilogo';
import { quanti, type Elementi } from '../creazione/personalizzati';
import { DATI } from '../regole/dati';
import { validaTavolo } from '../regole/tavolo';
import type { Tavolo } from '../regole/tipi';

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
