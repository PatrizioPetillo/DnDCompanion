// Stato di partita mandato al tavolo collegato (23/11): solo dati ben fatti, e l'iniziativa vale per il combattimento giusto
import { describe, expect, it } from 'vitest';
import { ANTICIPO_MS, daPartita, statoValido, valePer } from '../src/partita/al-tavolo';
import { statoVuoto } from '../src/partita/partita';
import { statoDelMembro, type Archivio } from '../src/archivio/archivio';

describe('Stato al tavolo', () => {
  const st = { ...statoVuoto(), pfPersi: 3, pfTemporanei: 2, condizioni: [{ id: 'avvelenato' as const }, { id: 'indebolimento' as const, livello: 2 }],
    concentrazione: 'bless', iniziativa: { totale: 15, il: '2026-11-23T20:01:00.000Z' } };
  it('va e torna uguale; non porta slot, risorse e altro', () => {
    const x = daPartita(st);
    expect(statoValido(JSON.parse(JSON.stringify(x)))).toEqual(x);
    expect(Object.keys(x)).not.toContain('slotUsati');
  });
  it('rifiuta quello che non è ben fatto', () => {
    const x = daPartita(st) as unknown as Record<string, unknown>;
    expect(statoValido({ ...x, pfPersi: -1 })).toBeNull();
    expect(statoValido({ ...x, pfPersi: 1.5 })).toBeNull();
    expect(statoValido({ ...x, condizioni: [{ id: 'volante' }] })).toBeNull();
    expect(statoValido({ ...x, condizioni: [{ id: 'indebolimento', livello: 9 }] })).toBeNull();
    expect(statoValido({ ...x, concentrazione: 'non-esiste' })).toBeNull();
    expect(statoValido({ ...x, iniziativa: { totale: 99, il: 'x' } })).toBeNull();
    expect(statoValido({ ...x, morte: { successi: 4, fallimenti: 0, stabile: false, morto: false } })).toBeNull();
    expect(statoValido('ciao')).toBeNull();
  });
  it("l'iniziativa vale se tirata dopo l'inizio, o poco prima", () => {
    const inizio = '2026-11-23T20:00:00.000Z';
    expect(valePer({ totale: 10, il: '2026-11-23T20:00:30.000Z' }, inizio)).toBe(true);
    expect(valePer({ totale: 10, il: new Date(Date.parse(inizio) - ANTICIPO_MS + 1000).toISOString() }, inizio)).toBe(true);
    expect(valePer({ totale: 10, il: '2026-11-22T20:00:00.000Z' }, inizio)).toBe(false);   // quella della volta scorsa
    expect(valePer(undefined, inizio)).toBe(false);
  });
  it('lo stato arriva sul membro giusto del gruppo', () => {
    const a = { versione: 1, personaggi: [], attivo: null, tavoli: [{ id: 't', tavolo: {} as never, aggiornato: '', gruppo: [
      { id: 'm1', bozza: {} as never, ricevuto: '', pg: 'p1' }, { id: 'm2', bozza: {} as never, ricevuto: '', pg: 'p2' }] }] } as unknown as Archivio;
    const b = statoDelMembro(a, 't', 'p2', daPartita(st));
    expect(b.tavoli![0].gruppo![0].stato).toBeUndefined();
    expect(b.tavoli![0].gruppo![1].stato?.pfPersi).toBe(3);
    expect(statoDelMembro(b, 't', 'p2', undefined).tavoli![0].gruppo![1].stato).toBeUndefined();
  });
});
