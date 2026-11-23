// Tavolo collegato (23/11): il personaggio arriva al master da solo, una copia per tavolo
import { describe, expect, it } from 'vitest';
import { aggiungiAlGruppo, archivioVuoto, copiaPerTavolo, elenco, nuovo, nuovoTavolo, togliPgDalGruppo } from '../src/archivio/archivio';
import { bozzaVuota } from '../src/creazione/percorso';
import { creaLinkTavolo, leggiLinkTavolo } from '../src/esporta/link';
import { DATI } from '../src/regole';
import { tavoloVuoto, validaTavolo } from '../src/regole/tavolo';
import type { Tavolo } from '../src/regole/tipi';

const S = 'a'.repeat(43), K = 'b'.repeat(43), ID = 'c'.repeat(22);
const tav = (nome: string, canale?: Tavolo['canale']): Tavolo => ({ ...tavoloVuoto(), nome, ...(canale ? { canale } : {}) });

describe('il canale del tavolo', () => {
  it('il segreto del master non va mai nel link, id e chiave sì', async () => {
    const t = tav('Torre', { id: ID, chiave: K, segreto: S });
    const url = await creaLinkTavolo(t, 'https://x/');
    expect(url).not.toContain(S);
    const letto = await leggiLinkTavolo(url.slice(url.indexOf('#')));
    expect((letto as { tavolo: Tavolo }).tavolo.canale).toEqual({ id: ID, chiave: K });
  });
  it('validaTavolo scarta un canale malformato e il segreto', () => {
    expect(validaTavolo({ ...tav('T'), canale: { id: 'corto', chiave: K } }, DATI)?.canale).toBeUndefined();
    expect(validaTavolo({ ...tav('T'), canale: { id: ID, chiave: K, segreto: S } }, DATI)?.canale).toEqual({ id: ID, chiave: K });
  });
});

describe('il gruppo che si aggiorna da solo', () => {
  it('lo stesso personaggio si riconosce dal suo id anche se cambia nome', () => {
    let a = nuovoTavolo(archivioVuoto()).archivio;
    const tid = a.tavoli![0].id;
    a = aggiungiAlGruppo(a, tid, { ...bozzaVuota(), nome: '' }, undefined, new Date(), undefined, { pg: 'pg-1', il: 'x' }).archivio;
    const r = aggiungiAlGruppo(a, tid, { ...bozzaVuota(), nome: 'Elimbar' }, undefined, new Date(), undefined, { pg: 'pg-1', il: 'y' });
    expect(r.aggiornato).toBe(true);
    expect(r.archivio.tavoli![0].gruppo).toHaveLength(1);
    expect(r.archivio.tavoli![0].gruppo![0].bozza.nome).toBe('Elimbar');
    // due giocatori con lo stesso nome restano due
    const due = aggiungiAlGruppo(r.archivio, tid, { ...bozzaVuota(), nome: 'Elimbar' }, undefined, new Date(), undefined, { pg: 'pg-2', il: 'z' }).archivio;
    expect(due.tavoli![0].gruppo).toHaveLength(2);
    expect(togliPgDalGruppo(due, tid, 'pg-1').tavoli![0].gruppo!.map((m) => m.pg)).toEqual(['pg-2']);
  });
});

describe('una copia per tavolo', () => {
  it('la copia è un personaggio nuovo, legato solo al nuovo tavolo', () => {
    const r = nuovo(archivioVuoto(), { ...bozzaVuota(), nome: 'Elimbar', classe: 'bardo', tavolo: tav('Primo', { id: ID, chiave: K }) });
    const c = copiaPerTavolo(r.archivio, r.id, tav('Secondo'));
    expect(c.id).not.toBe(r.id);
    const [orig, copia] = [r.id, c.id].map((id) => c.archivio.personaggi.find((p) => p.id === id)!);
    expect(orig.bozza.tavolo?.nome).toBe('Primo');
    expect(copia.bozza.tavolo?.nome).toBe('Secondo');
    expect(copia.bozza.classe).toBe('bardo');
    expect(copia.invio).toBeUndefined();
    expect(elenco(c.archivio).map((v) => v.tavolo).sort()).toEqual(['Primo', 'Secondo']);
  });
});
