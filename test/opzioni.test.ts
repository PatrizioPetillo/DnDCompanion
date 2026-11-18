// Opzioni delle tendine (stile Character Keep, con le opzioni non valide spente e il motivo).
import { describe, expect, it } from 'vitest';
import { etichettaLignaggio, opzioniLingua } from '../src/creazione/opzioni';
import { DATI } from '../src/regole';

describe('Lingue: due tendine', () => {
  it('il Comune non c\'è (si conosce già); le rare stanno in un gruppo a parte', () => {
    const o = opzioniLingua(['elvish', 'dwarvish'], 0);
    expect(o.standard.map((x) => x.id)).not.toContain('common');
    expect(o.standard).toHaveLength(9);
    expect(o.rare.map((x) => x.id)).toContain('undercommon');
  });
  it('la lingua scelta nell\'altra tendina è spenta, con il motivo', () => {
    const o = opzioniLingua(['elvish', 'dwarvish'], 0);
    expect(o.standard.find((x) => x.id === 'dwarvish')).toMatchObject({ disattivata: true, motivo: 'già scelta' });
    expect(o.standard.find((x) => x.id === 'elvish')?.disattivata).toBe(false);
  });
  it('una lingua che conosci già da un\'altra fonte è spenta', () => {
    const o = opzioniLingua([], 0, ['druidic']);
    expect(o.rare.find((x) => x.id === 'druidic')).toMatchObject({ disattivata: true, motivo: 'la conosci già' });
  });
});

describe('Antenato del dragonide: il danno accanto al nome', () => {
  it('Drago rosso · fuoco', () => {
    const rosso = DATI.specie.dragonborn.lignaggi!.opzioni.find((o) => o.id === 'red')!;
    expect(etichettaLignaggio(rosso)).toBe('Drago rosso · fuoco');
    const drow = DATI.specie.elf.lignaggi!.opzioni.find((o) => o.id === 'drow')!;
    expect(etichettaLignaggio(drow)).toBe('Drow');
  });
});
