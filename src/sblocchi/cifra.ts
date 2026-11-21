// Oggetti da identificare (21/11): il master cifra cosa fa l'oggetto, il giocatore riceve aspetto e testo cifrato.
// Lo sblocco porta la chiave: dal servizio degli sblocchi (Cloudflare) o da un QR al tavolo.
// L'id dello sblocco è l'impronta del segreto del master: chi ha il link conosce l'id, ma solo il master può sbloccare.
// Solo Web Crypto (browser e Node 20+), nessuna libreria.
export const b64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const daB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const casuale = (n: number) => crypto.getRandomValues(new Uint8Array(n));

export async function idDaSegreto(segreto: string): Promise<string> {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', daB64url(segreto)));
  return b64url(h.slice(0, 16));
}

export interface Chiavi { segreto: string; id: string; chiave: string }
export async function nuoveChiavi(): Promise<Chiavi> {
  const segreto = b64url(casuale(32));
  return { segreto, id: await idDaSegreto(segreto), chiave: b64url(casuale(32)) };
}

const importa = (chiave: string) => crypto.subtle.importKey('raw', daB64url(chiave), 'AES-GCM', false, ['encrypt', 'decrypt']);

export async function cifra(dati: unknown, chiave: string): Promise<{ iv: string; cifrato: string }> {
  const iv = casuale(12);
  const c = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await importa(chiave), new TextEncoder().encode(JSON.stringify(dati)));
  return { iv: b64url(iv), cifrato: b64url(new Uint8Array(c)) };
}

// null se la chiave è sbagliata o il testo è stato toccato (AES-GCM lo controlla da sé)
export async function decifra<T>(v: { iv: string; cifrato: string }, chiave: string): Promise<T | null> {
  try {
    const p = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: daB64url(v.iv) }, await importa(chiave), daB64url(v.cifrato));
    return JSON.parse(new TextDecoder().decode(p)) as T;
  } catch { return null; }
}

// Il QR di riserva al tavolo: «B20S:<id>.<chiave>»
export const testoQR = (id: string, chiave: string) => `B20S:${id}.${chiave}`;
export function leggiQR(t: string): { id: string; chiave: string } | null {
  const m = /^B20S:([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{43})$/.exec(t.trim());
  return m ? { id: m[1], chiave: m[2] } : null;
}
