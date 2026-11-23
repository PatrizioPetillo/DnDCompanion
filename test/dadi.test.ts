// Il modulo dei dadi (idea 6): le regole dell'SRD 5.2 con un dado fisso
import { describe, expect, it } from 'vitest';
import { combinaModo, conSlot, leggi, scrivi, tiraD20, tiraEspressione } from '../src/partita/dadi';

const fisso = (...v: number[]) => { let i = 0; return () => v[i++ % v.length]; };

describe('d20 (SRD p. 6-8)', () => {
  it('vantaggio tiene il più alto, svantaggio il più basso', () => {
    expect(tiraD20(5, 'vantaggio', {}, fisso(4, 17))).toMatchObject({ dadi: [4, 17], tenuto: 17, totale: 22 });
    expect(tiraD20(5, 'svantaggio', {}, fisso(4, 17))).toMatchObject({ tenuto: 4, totale: 9 });
  });
  it('vantaggio e svantaggio insieme si annullano, in qualunque numero', () => {
    expect(combinaModo(3, 1)).toBe('normale');
    expect(combinaModo(2, 0)).toBe('vantaggio');
    expect(combinaModo(0, 1)).toBe('svantaggio');
  });
  it('20 e 1 contano solo per i tiri per colpire', () => {
    expect(tiraD20(0, 'normale', { attacco: true }, fisso(20))).toMatchObject({ critico: true, mancato: false });
    expect(tiraD20(0, 'normale', { attacco: true }, fisso(1))).toMatchObject({ critico: false, mancato: true });
    expect(tiraD20(0, 'normale', {}, fisso(20))).toMatchObject({ critico: false });
    expect(tiraD20(0, 'normale', {}, fisso(1))).toMatchObject({ mancato: false });
  });
  it('indebolimento: −2 per livello', () => {
    expect(tiraD20(3, 'normale', { meno: 4 }, fisso(10)).totale).toBe(9);
  });
});

describe('danni (SRD p. 16)', () => {
  it('legge le espressioni dell\'app', () => {
    expect(leggi('2d8 + 3')).toEqual({ gruppi: [{ n: 2, facce: 8 }], piu: 3 });
    expect(leggi('1d4 + 1')).toEqual({ gruppi: [{ n: 1, facce: 4 }], piu: 1 });
    expect(leggi('d20')).toEqual({ gruppi: [{ n: 1, facce: 20 }], piu: 0 });
    expect(leggi('1d6 − 1')).toEqual({ gruppi: [{ n: 1, facce: 6 }], piu: -1 });
    expect(leggi('dado dell\'arma')).toBeNull();
    expect(scrivi(leggi('1d6 − 1')!)).toBe('1d6 − 1');
  });
  it('il critico raddoppia i dadi, non il modificatore', () => {
    const t = tiraEspressione(leggi('1d8 + 3')!, { critico: true }, fisso(5, 6));
    expect(t.dadi.map((d) => d.valore)).toEqual([5, 6]);
    expect(t.totale).toBe(14);
    expect(t.testo).toBe('2d8 + 3');
  });
  it('un totale negativo diventa 0', () => {
    expect(tiraEspressione(leggi('1d4 − 2')!, {}, fisso(1)).totale).toBe(0);
  });
  it('slot più alti: dadi o numeri in più per livello', () => {
    expect(conSlot('3d6', '+1d6', 2)).toEqual({ gruppi: [{ n: 5, facce: 6 }], piu: 0 });        // Mani brucianti con slot di 3°
    expect(conSlot('2d8', '+2d8', 1)).toEqual({ gruppi: [{ n: 4, facce: 8 }], piu: 0 });        // Cura ferite con slot di 2°
    expect(conSlot('2d4 + 4', '+5', 1)).toEqual({ gruppi: [{ n: 2, facce: 4 }], piu: 9 });      // Vita falsata con slot di 2°
    expect(conSlot('3d6', '+1d6', 0)).toEqual({ gruppi: [{ n: 3, facce: 6 }], piu: 0 });
  });
});
