// Servizio degli sblocchi di Companion B20 (21/11).
// Un Durable Object per oggetto: tiene la chiave quando il master sblocca e la manda a chi è in ascolto.
// Conserva solo id casuali e chiavi: nessun nome, nessuna scheda, nessun dato personale.
//   GET  /s/<id>          → { chiave } se sbloccato, altrimenti 404
//   POST /s/<id>          { segreto, chiave } → sblocca; l'id deve essere l'impronta del segreto
//   GET  /s/<id>/ascolta  → WebSocket: arriva { chiave } appena il master sblocca
// Canale di un personaggio (22/11): il master manda eventi (danni, cure, condizioni, tiri salvezza), il telefono del giocatore li applica.
//   GET  /c/<id>?dopo=n   → { eventi: [{ seq, il, evento }] } con seq > n (ne tiene gli ultimi 50, per 30 giorni)
//   POST /c/<id>          { segreto, evento } → li accoda; l'id deve essere l'impronta del segreto (ce l'ha solo chi ha il link della scheda)
//   GET  /c/<id>/ascolta  → WebSocket: arriva { seq, il, evento } appena il master lo manda
import { DurableObject } from 'cloudflare:workers';

interface Env { SBLOCCHI: DurableObjectNamespace<Sblocco>; CANALI: DurableObjectNamespace<Canale> }

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

interface Voce { seq: number; il: string; evento: unknown }
const MAX_EVENTI = 50, DURATA = 30 * 24 * 3600 * 1000;

export class Canale extends DurableObject<Env> {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const id = url.pathname.split('/')[2];
    if (url.pathname.endsWith('/ascolta')) {
      if (req.headers.get('upgrade') !== 'websocket') return json({ errore: 'serve un WebSocket' }, 426);
      const [client, server] = Object.values(new WebSocketPair());
      this.ctx.acceptWebSocket(server);
      return new Response(null, { status: 101, webSocket: client });
    }
    const voci = (await this.ctx.storage.get<Voce[]>('eventi')) ?? [];
    if (req.method === 'GET') {
      const dopo = Number(url.searchParams.get('dopo') ?? 0) || 0;
      return json({ eventi: voci.filter((v) => v.seq > dopo) });
    }
    if (req.method === 'POST') {
      let x: { segreto?: unknown; evento?: unknown };
      try { x = await req.json(); } catch { return json({ errore: 'corpo non valido' }, 400); }
      if (typeof x.segreto !== 'string' || !B64_32.test(x.segreto) || !x.evento || typeof x.evento !== 'object') return json({ errore: 'dati non validi' }, 400);
      if ((await impronta(x.segreto)) !== id) return json({ errore: 'non hai il link di questa scheda' }, 403);
      const seq = ((await this.ctx.storage.get<number>('seq')) ?? 0) + 1;
      const voce: Voce = { seq, il: new Date().toISOString(), evento: x.evento };
      await this.ctx.storage.put({ seq, eventi: [...voci, voce].slice(-MAX_EVENTI) });
      await this.ctx.storage.setAlarm(Date.now() + DURATA);      // senza uso per 30 giorni, si cancella tutto
      for (const ws of this.ctx.getWebSockets()) { try { ws.send(JSON.stringify(voce)); } catch { /* chiuso */ } }
      return json({ seq });
    }
    return json({ errore: 'metodo non ammesso' }, 405);
  }
  async alarm() { await this.ctx.storage.deleteAll(); }
  async webSocketMessage() { /* il giocatore non manda nulla */ }
  async webSocketClose(ws: WebSocket, code: number) { try { ws.close(code === 1005 ? 1000 : code); } catch { /* già chiuso */ } }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const parti = new URL(req.url).pathname.split('/');
    if ((parti[1] !== 's' && parti[1] !== 'c') || !ID.test(parti[2] ?? '') || parti.length > 4 || (parti[3] !== undefined && parti[3] !== 'ascolta')) return json({ errore: 'non trovato' }, 404);
    if (req.headers.get('content-length') && Number(req.headers.get('content-length')) > 2000) return json({ errore: 'troppo grande' }, 413);
    return parti[1] === 's' ? env.SBLOCCHI.getByName(parti[2]).fetch(req) : env.CANALI.getByName(parti[2]).fetch(req);
  },
} satisfies ExportedHandler<Env>;
