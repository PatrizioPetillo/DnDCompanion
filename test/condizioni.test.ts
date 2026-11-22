// Condizioni (22/11): effetti sui tiri dal glossario dell'SRD (p. 177-191), annullamento di vantaggio e svantaggio (p. 7)
import { describe, expect, it } from 'vitest';
import { aggiungi, cambiaLivello, fannoPerdereConcentrazione, inEffetto, riassunto, togli } from '../src/partita/condizioni';
import { riposoLungo, statoVuoto } from '../src/partita/partita';

const testi = (r: ReturnType<typeof riassunto>) => r.righe.map((x) => x.testo);

describe('Condizioni', () => {
  it('avvelenato: svantaggio ad attacchi e prove, non ai tiri salvezza', () => {
    const r = testi(riassunto([{ id: 'avvelenato' }], false));
    expect(r).toContain('I tuoi tiri per colpire: svantaggio.');
    expect(r).toContain('Le tue prove di caratteristica: svantaggio.');
    expect(r.some((t) => t.includes('Tiri salvezza'))).toBe(false);
  });
  it('invisibile e avvelenato: sugli attacchi vantaggio e svantaggio si annullano', () => {
    expect(testi(riassunto([{ id: 'invisibile' }, { id: 'avvelenato' }], false))).toContain('I tuoi tiri per colpire: vantaggio e svantaggio si annullano: un d20 solo.');
  });
  it('prono: da vicino vantaggio, da lontano svantaggio', () => {
    const r = testi(riassunto([{ id: 'prono' }], false));
    expect(r).toContain('Chi ti attacca da entro 1,5 m: vantaggio.');
    expect(r).toContain('Chi ti attacca da più lontano: svantaggio.');
  });
  it('paralizzato include incapacitato e fa perdere la concentrazione', () => {
    expect(inEffetto([{ id: 'paralizzato' }], false).sort()).toEqual(['incapacitato', 'paralizzato']);
    expect(fannoPerdereConcentrazione([{ id: 'paralizzato' }], false)).toBe(true);
    expect(fannoPerdereConcentrazione([{ id: 'avvelenato' }], false)).toBe(false);
  });
  it('a 0 PF sei privo di sensi (p. 17), quindi anche prono e incapacitato', () => {
    expect(inEffetto([], true).sort()).toEqual(['incapacitato', 'privo-di-sensi', 'prono']);
    expect(testi(riassunto([], true))).toContain('Se ti colpiscono da entro 1,5 m è un colpo critico.');
  });
  it('indebolimento: livelli, −2 per livello al d20, −1,5 m; a 6 si muore; il riposo lungo toglie 1 livello', () => {
    let l = aggiungi(aggiungi([], 'indebolimento'), 'indebolimento');
    expect(l).toEqual([{ id: 'indebolimento', livello: 2 }]);
    const r = riassunto(l, false);
    expect(r.menoD20).toBe(4); expect(r.menoVelocitaM).toBe(3);
    expect(riassunto(cambiaLivello(l, 6), false).morto).toBe(true);
    const st = riposoLungo({ ...statoVuoto(), pfPersi: 3, condizioni: [...l, { id: 'prono' }] });
    expect(st.condizioni).toEqual([{ id: 'prono' }, { id: 'indebolimento', livello: 1 }]);
    expect(st.pfPersi).toBe(0);
    l = togli(l, 'indebolimento'); expect(l).toEqual([]);
  });
});

describe('Concentrazione a 0 PF (22/11)', () => {
  it('scendere a 0 PF fa perdere la concentrazione', async () => {
    const { danno } = await import('../src/partita/partita');
    const st = { ...statoVuoto(), concentrazione: 'bless' };
    expect(danno(st, 3, 10).concentrazione).toBe('bless');
    expect(danno(st, 10, 10).concentrazione).toBeNull();
  });
});
