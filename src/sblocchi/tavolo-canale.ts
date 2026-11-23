// Tavolo collegato (23/11): il giocatore manda la sua scheda al tavolo, il master la riceve da sola.
// La scheda viaggia cifrata con la chiave del link del tavolo (AES-GCM): il servizio la conserva ma non la può leggere.
import { cifra, decifra, nuoveChiavi } from './cifra';

const BASE = ((import.meta.env.VITE_SBLOCCHI_URL as string | undefined) ?? '').replace(/\/+$/, '');
export const tavoliAttivi = () => !!BASE;

export async function nuovoCanaleTavolo() {
  const k = await nuoveChiavi();
  return { id: k.id, chiave: k.chiave, segreto: k.segreto };
}
export const nuovoToken = async () => (await nuoveChiavi()).segreto;

const post = async (percorso: string, corpo: unknown) => {
  if (!BASE) return null;
  try {
    const r = await fetch(`${BASE}${percorso}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corpo) });
    return r.ok ? await r.json() : null;
  } catch { return null; }
};

// Il giocatore: la sua scheda (il pezzo dopo «#» del link della scheda) per il tavolo
export async function inviaScheda(canale: { id: string; chiave: string }, pg: string, token: string, testo: string, stato?: unknown): Promise<boolean> {
  const c = await cifra(stato ? { testo, stato } : { testo }, canale.chiave);
  return !!(await post(`/t/${canale.id}`, { pg, token, ...c }));
}
export const lasciaTavolo = async (canale: { id: string }, pg: string, token: string) => !!(await post(`/t/${canale.id}`, { pg, token, via: true }));

export interface SchedaArrivata { pg: string; il: string; via?: boolean; iv?: string; cifrato?: string }

// Il master: tutte le schede del tavolo
export async function leggiSchede(id: string, segreto: string): Promise<SchedaArrivata[] | null> {
  const x = await post(`/t/${id}/leggi`, { segreto }) as { schede?: SchedaArrivata[] } | null;
  return x?.schede ?? null;
}
export async function testoScheda(s: SchedaArrivata, chiave: string): Promise<{ testo: string; stato?: unknown } | null> {
  if (!s.iv || !s.cifrato) return null;
  const x = await decifra<{ testo?: string; stato?: unknown }>({ iv: s.iv, cifrato: s.cifrato }, chiave);
  return typeof x?.testo === 'string' ? { testo: x.testo, ...(x.stato !== undefined ? { stato: x.stato } : {}) } : null;
}

// Il master in ascolto mentre l'app è aperta; si riconnette da solo
export function ascoltaTavolo(id: string, segreto: string, arrivata: (s: SchedaArrivata) => void): () => void {
  if (!BASE || typeof WebSocket === 'undefined') return () => {};
  let ws: WebSocket | null = null, chiuso = false, attesa = 2000;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const apri = () => {
    if (chiuso) return;
    ws = new WebSocket(`${BASE.replace(/^http/, 'ws')}/t/${id}/ascolta?segreto=${encodeURIComponent(segreto)}`);
    ws.onopen = () => { attesa = 2000; };
    ws.onmessage = (e) => { try { const x = JSON.parse(String(e.data)) as SchedaArrivata; if (x.pg) arrivata(x); } catch { /* ignora */ } };
    ws.onclose = () => { if (!chiuso) { timer = setTimeout(apri, attesa); attesa = Math.min(attesa * 2, 60000); } };
  };
  apri();
  return () => { chiuso = true; clearTimeout(timer); ws?.close(); };
}
