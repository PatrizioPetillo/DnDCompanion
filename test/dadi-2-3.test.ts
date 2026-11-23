// Dadi degli incantesimi di 2° e 3° livello (23/11/2026, scelta di Patrizio: tutti, verificati sull'SRD 5.2)
import { describe, expect, it } from 'vitest';
import { DATI } from '../src/regole';
import { DADI_INCANTESIMI, SENZA_DADI_2_3, testoDadi } from '../src/regole/dati/dadi-incantesimi';
import { daIncantesimo } from '../src/partita/tiri';
import { calcolaScheda } from '../src/regole';
import { L5_TRAVIS } from './livelli-prova';
import { scrivi } from '../src/partita/dadi';

describe('Dadi di 2° e 3° livello', () => {
  it('ogni incantesimo di 2° e 3° livello che fa danni o cura ha i suoi dadi (o è tra quelli senza dadi, con il motivo)', () => {
    const conDanni = Object.values(DATI.incantesimi).filter((i) => (i.livello === 2 || i.livello === 3) && (i.danni?.length || /heal|healing|prayer/.test(i.id)));
    const mancano = conDanni.filter((i) => !DADI_INCANTESIMI[i.id] && !SENZA_DADI_2_3.includes(i.id)).map((i) => i.id);
    expect(mancano).toEqual([]);
  });
  it('testi della scheda', () => {
    expect(testoDadi('fireball', 4)).toBe('8d6 fuoco');
    expect(testoDadi('spiritual-weapon', 4)).toBe('1d8 + 4 forza');
    expect(testoDadi('mass-healing-word', 4)).toBe('2d4 + 4 PF');
    expect(testoDadi('prayer-of-healing', 4)).toBe('2d8 PF');
  });
  it('tiri con lo slot più alto: Palla di fuoco con uno slot di 4° fa 9d6; Raggio rovente 4 raggi; attacco per Lama infuocata', () => {
    const m = calcolaScheda(L5_TRAVIS).magia.find((x) => x.id === 'wizard')!;
    const pf = daIncantesimo('fireball', m, 4, 4, 0, 5)!;
    expect(scrivi(pf.danni[0].espressione)).toBe('9d6');
    expect(pf.cd?.car).toBe('DES');
    const rr = daIncantesimo('scorching-ray', m, 4, 3, 0, 5)!;
    expect(rr.nota).toMatch(/^4 raggi/);
    expect(rr.d20?.attacco).toBe(true);
    expect(DATI.incantesimi['flame-blade'].tiro?.tipo).toBe('attacco');
  });
});
