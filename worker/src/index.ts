// Servizio degli sblocchi di Companion B20 (21/11).
// Un Durable Object per oggetto: tiene la chiave quando il master sblocca e la manda a chi è in ascolto.
// Conserva solo id casuali e chiavi: nessun nome, nessuna scheda, nessun dato personale.
//   GET  /s/<id>          → { chiave } se sbloccato, altrimenti 404
//   POST /s/<id>          { segreto, chiave } → sblocca; l'id deve essere l'impronta del segreto
//   GET  /s/<id>/ascolta  → WebSocket: arriva { chiave } appena il master sblocca
import { DurableObject } from 'cloudflare:workers';

interface Env { SBLOCCHI: DurableObjectNamespace<Sblocco> }

const ID = /^[A-Za-z0-9_-]{22}$/;
const B64_32 = /^[A-Za-z0-9_-]{43}$/;
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type' };
const json = (x: unknown, status = 200) => new Response(JSON.stringify(x), { status, headers: { 'content-type': 'application/json', ...CORS } });

const daB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const b64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function impronta(segreto: string) {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', daB64url(segreto)));
  return b64url(h.slice(0, 16));
}

export class Sblocco extends DurableObject<Env> {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const id = url.pathname.split('/')[2];
    const chiave = await this.ctx.storage.get<string>('chiave');
    if (url.pathname.endsWith('/ascolta')) {
      if (req.headers.get('upgrade') !== 'websocket') return json({ errore: 'serve un WebSocket' }, 426);
      const [client, server] = Object.values(new WebSocketPair());
      this.ctx.acceptWebSocket(server);          // con ibernazione: in attesa non consuma
      if (chiave) server.send(JSON.stringify({ chiave }));
      return new Response(null, { status: 101, webSocket: client });
    }
    if (req.method === 'GET') return chiave ? json({ chiave }) : json({ sbloccato: false }, 404);
    if (req.method === 'POST') {
      let x: { segreto?: unknown; chiave?: unknown };
      try { x = await req.json(); } catch { return json({ errore: 'corpo non valido' }, 400); }
      if (typeof x.segreto !== 'string' || !B64_32.test(x.segreto) || typeof x.chiave !== 'string' || !B64_32.test(x.chiave)) return json({ errore: 'dati non validi' }, 400);
      if ((await impronta(x.segreto)) !== id) return json({ errore: 'non sei il master di questo oggetto' }, 403);
      await this.ctx.storage.put('chiave', x.chiave);
      for (const ws of this.ctx.getWebSockets()) { try { ws.send(JSON.stringify({ chiave: x.chiave })); } catch { /* chiuso */ } }
      return json({ sbloccato: true });
    }
    return json({ errore: 'metodo non ammesso' }, 405);
  }
  async webSocketMessage() { /* i giocatori non mandano nulla */ }
  async webSocketClose(ws: WebSocket, code: number) { try { ws.close(code === 1005 ? 1000 : code); } catch { /* già chiuso */ } }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const parti = new URL(req.url).pathname.split('/');
    if (parti[1] !== 's' || !ID.test(parti[2] ?? '') || parti.length > 4 || (parti[3] !== undefined && parti[3] !== 'ascolta')) return json({ errore: 'non trovato' }, 404);
    if (req.headers.get('content-length') && Number(req.headers.get('content-length')) > 1000) return json({ errore: 'troppo grande' }, 413);
    return env.SBLOCCHI.getByName(parti[2]).fetch(req);
  },
} satisfies ExportedHandler<Env>;
