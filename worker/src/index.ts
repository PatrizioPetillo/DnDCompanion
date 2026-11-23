// Servizio degli sblocchi di Companion DomusDraconis (21/11; prima Companion B20).
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

// Tavolo collegato (23/11): i giocatori che hanno il link del tavolo mandano la loro scheda, il master la riceve da solo.
//   POST /t/<id>              { pg, token, iv, cifrato } → salva l'ultima versione della scheda di quel personaggio
//                             { pg, token, via: true }   → il personaggio lascia il tavolo
//   POST /t/<id>/leggi        { segreto } → { schede: [{ pg, il, iv, cifrato, via? }] }; l'id deve essere l'impronta del segreto (solo il master)
//   GET  /t/<id>/ascolta?segreto=…  → WebSocket del master: arriva ogni scheda nuova o cambiata
// Le schede sono cifrate con la chiave del link del tavolo: il servizio non le può leggere. Il token di ogni personaggio
// lo fissa il primo invio: nessun altro può sovrascriverlo. Massimo 40 personaggi; senza uso per 90 giorni si cancella tutto.
interface Env { SBLOCCHI: DurableObjectNamespace<Sblocco>; CANALI: DurableObjectNamespace<Canale>; TAVOLI: DurableObjectNamespace<TavoloDO> }

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
      await this.ctx.storage.setAlarm(Date.now() + 365 * 24 * 3600 * 1000);   // dopo un anno si cancella (23/11, apertura a tutti)
      for (const ws of this.ctx.getWebSockets()) { try { ws.send(JSON.stringify({ chiave: x.chiave })); } catch { /* chiuso */ } }
      return json({ sbloccato: true });
    }
    return json({ errore: 'metodo non ammesso' }, 405);
  }
  async alarm() { await this.ctx.storage.deleteAll(); }
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

interface SchedaTavolo { tok: string; il: string; iv?: string; cifrato?: string; via?: boolean }
const PG = /^[A-Za-z0-9_-]{1,40}$/, MAX_PG = 40, DURATA_TAVOLO = 90 * 24 * 3600 * 1000;

export class TavoloDO extends DurableObject<Env> {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const [, , id, azione] = url.pathname.split('/');
    if (azione === 'ascolta') {
      if (req.headers.get('upgrade') !== 'websocket') return json({ errore: 'serve un WebSocket' }, 426);
      const seg = url.searchParams.get('segreto') ?? '';
      if (!B64_32.test(seg) || (await impronta(seg)) !== id) return json({ errore: 'non sei il master di questo tavolo' }, 403);
      const [client, server] = Object.values(new WebSocketPair());
      this.ctx.acceptWebSocket(server);
      return new Response(null, { status: 101, webSocket: client });
    }
    if (req.method !== 'POST') return json({ errore: 'metodo non ammesso' }, 405);
    let x: Record<string, unknown>;
    try { x = await req.json(); } catch { return json({ errore: 'corpo non valido' }, 400); }
    if (azione === 'leggi') {
      if (typeof x.segreto !== 'string' || !B64_32.test(x.segreto) || (await impronta(x.segreto)) !== id) return json({ errore: 'non sei il master di questo tavolo' }, 403);
      const tutte = await this.ctx.storage.list<SchedaTavolo>({ prefix: 'pg:' });
      return json({ schede: [...tutte].map(([k, v]) => ({ pg: k.slice(3), il: v.il, ...(v.via ? { via: true } : { iv: v.iv, cifrato: v.cifrato }) })) });
    }
    const { pg, token, iv, cifrato, via } = x as { pg?: unknown; token?: unknown; iv?: unknown; cifrato?: unknown; via?: unknown };
    if (typeof pg !== 'string' || !PG.test(pg) || typeof token !== 'string' || !B64_32.test(token)) return json({ errore: 'dati non validi' }, 400);
    if (!via && (typeof iv !== 'string' || iv.length > 40 || typeof cifrato !== 'string' || cifrato.length > 60000)) return json({ errore: 'dati non validi' }, 400);
    const chiave = `pg:${pg}`, tok = await impronta(token);
    const prima = await this.ctx.storage.get<SchedaTavolo>(chiave);
    if (prima && prima.tok !== tok) return json({ errore: 'questo personaggio è di un altro telefono' }, 403);
    if (!prima && (await this.ctx.storage.list({ prefix: 'pg:' })).size >= MAX_PG) return json({ errore: 'tavolo pieno' }, 409);
    const voce: SchedaTavolo = via ? { tok, il: new Date().toISOString(), via: true } : { tok, il: new Date().toISOString(), iv: iv as string, cifrato: cifrato as string };
    await this.ctx.storage.put(chiave, voce);
    await this.ctx.storage.setAlarm(Date.now() + DURATA_TAVOLO);
    const msg = JSON.stringify({ pg, il: voce.il, ...(via ? { via: true } : { iv, cifrato }) });
    for (const ws of this.ctx.getWebSockets()) { try { ws.send(msg); } catch { /* chiuso */ } }
    return json({ il: voce.il });
  }
  async alarm() { await this.ctx.storage.deleteAll(); }
  async webSocketMessage() { /* il master non manda nulla */ }
  async webSocketClose(ws: WebSocket, code: number) { try { ws.close(code === 1005 ? 1000 : code); } catch { /* già chiuso */ } }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const parti = new URL(req.url).pathname.split('/');
    const ammesse = parti[1] === 't' ? ['ascolta', 'leggi'] : ['ascolta'];
    if (!['s', 'c', 't'].includes(parti[1]) || !ID.test(parti[2] ?? '') || parti.length > 4 || (parti[3] !== undefined && !ammesse.includes(parti[3]))) return json({ errore: 'non trovato' }, 404);
    const limite = parti[1] === 't' ? 70000 : 2000;
    if (req.headers.get('content-length') && Number(req.headers.get('content-length')) > limite) return json({ errore: 'troppo grande' }, 413);
    if (parti[1] === 't') return env.TAVOLI.getByName(parti[2]).fetch(req);
    return parti[1] === 's' ? env.SBLOCCHI.getByName(parti[2]).fetch(req) : env.CANALI.getByName(parti[2]).fetch(req);
  },
} satisfies ExportedHandler<Env>;
