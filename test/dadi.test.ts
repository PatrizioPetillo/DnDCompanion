// Dadi degli incantesimi di livello 0 e 1, dal testo dell'SRD 5.2 (verificati il 18/11/2026).
import { describe, expect, it } from 'vitest';
import { DADI_INCANTESIMI, testoDadi } from '../src/regole/dati/dadi-incantesimi';
import { DATI } from '../src/regole/dati';

describe('Dadi degli incantesimi', () => {
  it('ogni voce è un incantesimo di livello 0 o 1 che esiste', () => {
    for (const id of Object.keys(DADI_INCANTESIMI)) {
      expect(DATI.incantesimi[id], id).toBeDefined();
      expect(DATI.incantesimi[id].livello, id).toBeLessThanOrEqual(1);
    }
  });
  it('ogni trucchetto e incantesimo di 1° con un tipo di danno ha i suoi dadi', () => {
    const senza = Object.values(DATI.incantesimi).filter((i) => i.livello <= 1 && i.danni?.length && !DADI_INCANTESIMI[i.id]).map((i) => i.id);
    expect(senza).toEqual([]);
  });
  it('testi', () => {
    expect(testoDadi('fire-bolt', 3)).toBe('1d10 fuoco');
    expect(testoDadi('healing-word', 3)).toBe('2d4 + 3 PF');
    expect(testoDadi('cure-wounds', -1)).toBe('2d8 − 1 PF');
    expect(testoDadi('magic-missile', 3)).toBe('1d4 + 1 forza');
    expect(testoDadi('mage-armor', 3)).toBeNull();
  });
  it('Stretta folgorante è un attacco con incantesimo (correzione dei dati, p. 162)', () => {
    expect(DATI.incantesimi['shocking-grasp'].tiro).toEqual({ tipo: 'attacco' });
  });
});
