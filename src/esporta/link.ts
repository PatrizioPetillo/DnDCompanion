// Link della scheda (sezione 5.4 e 9): il personaggio compresso nell'indirizzo, dopo il «#».
// Niente server: la parte dopo «#» non arriva nemmeno all'hosting. Compressione nativa del browser (deflate).
import type { Bozza } from '../creazione/percorso';
import { importaJSON } from '../creazione/riepilogo';

const PREFISSO = '#scheda=';

const base64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const daBase64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function trasforma(dati: Uint8Array, flusso: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const risposta = new Response(new Blob([dati as BlobPart]).stream().pipeThrough(flusso));
  return new Uint8Array(await risposta.arrayBuffer());
}

export async function creaLink(b: Bozza, base: string): Promise<string> {
  const json = JSON.stringify({ formato: 'companion-b20', versione: 1, personaggio: b });
  const compresso = await trasforma(new TextEncoder().encode(json), new CompressionStream('deflate-raw'));
  return `${base.split('#')[0]}${PREFISSO}${base64url(compresso)}`;
}

// Dall'indirizzo alla scheda; null se l'indirizzo non contiene una scheda
export async function leggiLink(hash: string): Promise<{ bozza: Bozza } | { errore: string } | null> {
  if (!hash.startsWith(PREFISSO)) return null;
  try {
    const json = new TextDecoder().decode(await trasforma(daBase64url(hash.slice(PREFISSO.length)), new DecompressionStream('deflate-raw')));
    return importaJSON(json);
  } catch {
    return { errore: 'Il link della scheda è rovinato o incompleto: chiedi di rimandarlo.' };
  }
}
