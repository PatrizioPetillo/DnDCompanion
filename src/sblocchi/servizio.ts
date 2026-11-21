// Il servizio degli sblocchi (Cloudflare Worker, cartella «worker»): conserva solo id casuali e chiavi, nessun dato personale.
// Indirizzo in VITE_SBLOCCHI_URL; senza, resta il QR al tavolo.
import type { OggettoSvelato, Velo } from '../regole/tipi';
import { decifra } from './cifra';

const BASE = ((import.meta.env.VITE_SBLOCCHI_URL as string | undefined) ?? '').replace(/\/+$/, '');
export const servizioAttivo = () => !!BASE;

// Il master sblocca: manda segreto e chiave; il servizio controlla che l'impronta del segreto sia l'id
export async function pubblicaSblocco(id: string, segreto: string, chiave: string): Promise<boolean> {
  if (!BASE) return false;
  try {
    const r = await fetch(`${BASE}/s/${id}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ segreto, chiave }) });
    return r.ok;
  } catch { return false; }
}

// Il giocatore chiede: la chiave se il master ha sbloccato, altrimenti null
export async function cercaSblocco(id: string): Promise<string | null> {
  if (!BASE) return null;
  try {
    const r = await fetch(`${BASE}/s/${id}`);
    if (!r.ok) return null;
    const x = (await r.json()) as { chiave?: string };
    return typeof x.chiave === 'string' ? x.chiave : null;
  } catch { return null; }
}

// In ascolto mentre l'app è aperta: lo sblocco arriva appena il master tocca «Sblocca». Si riconnette da solo.
export function ascoltaSblocco(id: string, arrivata: (chiave: string) => void): () => void {
  if (!BASE || typeof WebSocket === 'undefined') return () => {};
  let ws: WebSocket | null = null, chiuso = false, attesa = 2000;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const apri = () => {
    if (chiuso) return;
    ws = new WebSocket(`${BASE.replace(/^http/, 'ws')}/s/${id}/ascolta`);
    ws.onopen = () => { attesa = 2000; };
    ws.onmessage = (e) => { try { const x = JSON.parse(String(e.data)) as { chiave?: string }; if (x.chiave) arrivata(x.chiave); } catch { /* ignora */ } };
    ws.onclose = () => { if (!chiuso) { timer = setTimeout(apri, attesa); attesa = Math.min(attesa * 2, 60000); } };
  };
  apri();
  return () => { chiuso = true; clearTimeout(timer); ws?.close(); };
}

export const svelaVelo = (v: Velo, chiave: string) => decifra<OggettoSvelato>(v, chiave);
