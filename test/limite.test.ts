// Limite delle richieste del servizio (24/11): 60 al minuto e 3.000 al giorno per tavolo, canale o oggetto
import { describe, expect, it } from 'vitest';
import { Limite, PER_GIORNO, PER_MINUTO } from '../worker/src/limite';

const memoria = () => { const m = new Map<string, unknown>(); return { m, get: async <T,>(k: string) => m.get(k) as T | undefined, put: async <T,>(k: string, v: T) => { m.set(k, v); } }; };

describe('limite delle richieste', () => {
  it('60 al minuto, poi aspetta la fine del minuto', async () => {
    let ora = Date.parse('2026-11-24T10:00:00Z');
    const l = new Limite(memoria(), () => ora);
    for (let i = 0; i < PER_MINUTO; i++) expect(await l.attesa()).toBeNull();
    expect(await l.attesa()).toBe(60);
    ora += 30_000; expect(await l.attesa()).toBe(30);
    ora += 30_000; expect(await l.attesa()).toBeNull();
  });
  it('3.000 al giorno, si riparte a mezzanotte UTC, e il conto resta anche se l\'oggetto si riaddormenta', async () => {
    let ora = Date.parse('2026-11-24T10:00:00Z');
    const mem = memoria();
    let l = new Limite(mem, () => ora);
    for (let i = 0; i < PER_GIORNO; i++) { if (i % PER_MINUTO === 0) ora += 60_000; expect(await l.attesa()).toBeNull(); }
    l = new Limite(mem, () => ora);                   // l'oggetto è stato tolto dalla memoria: il conto del giorno torna dal salvataggio
    ora += 60_000;
    const a = await l.attesa();
    expect(a).toBeGreaterThan(0);
    ora = Date.parse('2026-11-25T00:00:01Z');
    expect(await l.attesa()).toBeNull();
  });
});
