// La regola dell'SRD per creare un background (p. 192-193, 21/11): avvisi, non divieti.
import { describe, expect, it } from 'vitest';
import { moduloDa, moduloVuoto, regolaSrd } from '../src/creazione/personalizzati';
import { DATI } from '../src/regole';

describe('Creare un background (SRD p. 192-193)', () => {
  it('i 4 background dell\'SRD rispettano la regola: A vale al massimo 50 mo, niente armi da guerra né armature', () => {
    for (const id of ['acolyte', 'criminal', 'sage', 'soldier']) expect(regolaSrd(moduloDa(DATI.background[id])), id).toEqual([]);
  });
  it('segnala il valore diverso da 50 mo, le armature, le armi da guerra e il talento scritto a mano', () => {
    const m = { ...moduloVuoto(), oggettiA: [{ oggetto: 'leather-armor', quantita: 1 }, { oggetto: 'longsword', quantita: 1 }], moA: 30,
      talento: { tipo: 'libero' as const, nome: 'Fortunato', nota: '' } };
    const a = regolaSrd(m);
    expect(a.some((x) => x.includes('vale 55 mo'))).toBe(true);    // armatura di cuoio 10 + spada lunga 15 + 30 mo
    expect(a.some((x) => x.includes('armature'))).toBe(true);
    expect(a.some((x) => x.includes('armi da guerra'))).toBe(true);
    expect(a.some((x) => x.includes('talento Origini'))).toBe(true);
  });
  it('un modulo vuoto non dà avvisi sull\'equipaggiamento', () => {
    expect(regolaSrd(moduloVuoto())).toEqual([]);
  });
});
