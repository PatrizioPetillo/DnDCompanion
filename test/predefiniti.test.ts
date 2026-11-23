// Personaggi pronti (idea 12, 23/11/2026): a ogni livello da 1 a 5, scheda completa, senza errori né avvisi da controllare
import { describe, expect, it } from 'vitest';
import { PREDEFINITI, creaPredefinito, predefinitiPer } from '../src/creazione/predefiniti';
import { comePersonaggio, statoPassi } from '../src/creazione/percorso';
import { calcolaScheda } from '../src/regole';
import { tavoloVuoto } from '../src/regole/tavolo';

const casi = PREDEFINITI.flatMap((p) => [1, 2, 3, 4, 5].map((l) => [p.nome, l, p] as const));

describe('Personaggi pronti', () => {
  it('uno per classe, specie tutte e 9, nomi diversi', () => {
    expect(new Set(PREDEFINITI.map((p) => p.classe)).size).toBe(12);
    expect(new Set(PREDEFINITI.map((p) => p.specie)).size).toBe(9);
    expect(new Set(PREDEFINITI.map((p) => p.nome)).size).toBe(12);
  });
  it.each(casi)('%s al livello %i: completo, senza avvisi', (_, livello, p) => {
    const b = creaPredefinito(p, livello);
    expect(b.livello).toBe(livello);
    const s = calcolaScheda(comePersonaggio(b)!);
    // Le componenti con costo degli incantesimi sempre preparati (Rinascita, Protezione dal bene e dal male) restano un promemoria giusto
    expect(s.avvisi.filter((a) => !a.accettato && a.livello !== 'info' && !a.id.startsWith('materiale:')).map((a) => `${a.id}: ${a.messaggio}`)).toEqual([]);
    expect(s.avvisi.filter((a) => /^(scelta-mancante|preparati-mancanti|libro-incompleto|trucchetti-mancanti)/.test(a.id)).map((a) => a.id)).toEqual([]);
    const passi = statoPassi(b);
    expect(Object.entries(passi).filter(([k, v]) => k !== 'riepilogo' && v.stato === 'da-fare').map(([k, v]) => `${k}: ${v.cosaManca.join(', ')}`)).toEqual([]);
  });
  it('un tavolo che esclude una classe o la serie standard toglie i personaggi pronti che non ammette', () => {
    const t = tavoloVuoto();
    expect(predefinitiPer({ ...t, fonti: { srd: true, escludi: ['wizard', 'goliath'] } }).map((p) => p.id)).not.toEqual(expect.arrayContaining(['elarion']));
    expect(predefinitiPer({ ...t, fonti: { srd: true, escludi: ['wizard', 'goliath'] } })).toHaveLength(10);
    expect(predefinitiPer({ ...t, metodiPunteggi: ['pointBuy27'] })).toHaveLength(0);
  });
});
