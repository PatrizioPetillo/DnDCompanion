import { describe, expect, it } from 'vitest';

import { daAttacco, soloDanni } from './tiri';
describe('solo danni (23/11)', () => {
  it('toglie il d20 e lascia la casella del critico agli attacchi', () => {
    const a = { id: 'dagger', nome: 'Pugnale', quantita: 1, caratteristica: 'DES', competente: true, colpire: { totale: 5, termini: [] },
      danni: { dadi: '1d4', mod: 3, tipo: 'perforanti', testo: '1d4 + 3 perforanti' }, padronanza: null, proprieta: [], note: [] } as never;
    const r = soloDanni(daAttacco(a));
    expect(r.d20).toBeUndefined();
    expect(r.puoCritico).toBe(true);
    expect(r.danni).toHaveLength(1);
  });
});
