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
export const ascoltaSblocco = (id: string, arrivata: (chiave: string) => void) =>
  ascolta(`/s/${id}/ascolta`, (x) => { const k = (x as { chiave?: string }).chiave; if (k) arrivata(k); });

// WebSocket con riconnessione (sblocchi e canali)
function ascolta(percorso: string, arrivato: (x: unknown) => void): () => void {
  if (!BASE || typeof WebSocket === 'undefined') return () => {};
  let ws: WebSocket | null = null, chiuso = false, attesa = 2000;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const apri = () => {
    if (chiuso) return;
    ws = new WebSocket(`${BASE.replace(/^http/, 'ws')}${percorso}`);
    ws.onopen = () => { attesa = 2000; };
    ws.onmessage = (e) => { try { arrivato(JSON.parse(String(e.data))); } catch { /* ignora */ } };
    ws.onclose = () => { if (!chiuso) { timer = setTimeout(apri, attesa); attesa = Math.min(attesa * 2, 60000); } };
  };
  apri();
  return () => { chiuso = true; clearTimeout(timer); ws?.close(); };
}

export const svelaVelo = (v: Velo, chiave: string) => decifra<OggettoSvelato>(v, chiave);

// ───────── Canale del personaggio (22/11): eventi dal master ─────────
export interface VoceCanale { seq: number; il: string; evento: unknown }
export async function mandaEvento(id: string, segreto: string, evento: unknown): Promise<boolean> {
  if (!BASE) return false;
  try {
    const r = await fetch(`${BASE}/c/${id}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ segreto, evento }) });
    return r.ok;
  } catch { return false; }
}
export async function cercaEventi(id: string, dopo: number): Promise<VoceCanale[]> {
  if (!BASE) return [];
  try {
    const r = await fetch(`${BASE}/c/${id}?dopo=${dopo}`);
    if (!r.ok) return [];
    const x = (await r.json()) as { eventi?: VoceCanale[] };
    return Array.isArray(x.eventi) ? x.eventi : [];
  } catch { return []; }
}
export const ascoltaCanale = (id: string, arrivata: (v: VoceCanale) => void) =>
  ascolta(`/c/${id}/ascolta`, (x) => { const v = x as VoceCanale; if (typeof v?.seq === 'number') arrivata(v); });
