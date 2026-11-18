// Metri come nell'SRD 5.2.1 italiano: 1,5 metri ogni 5 piedi (9 metri = 30 piedi).
import { describe, expect, it } from 'vitest';
import { metri } from '../src/regole/misure';
import { DATI } from '../src/regole';
import { calcolaScheda } from '../src/regole';
import * as P from './personaggi';

describe('Da piedi a metri', () => {
  it('le misure dell\'SRD italiano', () => {
    expect(metri(30)).toBe('9 metri');
    expect(metri(25)).toBe('7,5 metri');
    expect(metri(35)).toBe('10,5 metri');      // elfo dei boschi
    expect(metri(60)).toBe('18 metri');
    expect(metri(120)).toBe('36 metri');
    expect(metri(5)).toBe('1,5 metri');
  });
  it('la scurovisione del nano è in metri', () => {
    const s = calcolaScheda(P.BARBARO);
    expect(JSON.stringify(s)).not.toContain('piedi');
    expect(DATI.specie.dwarf.tratti.flatMap((t) => t.effetti).some((e) => e.tipo === 'nota' && e.testo === 'Scurovisione 36 metri')).toBe(true);
  });
});

describe('Nomi ufficiali (SRD 5.2.1 in italiano)', () => {
  it('background, talenti, tratti e lingue', () => {
    expect(DATI.background.sage.nome).toBe('Sapiente');
    expect(DATI.talenti.skilled.nome).toBe('Abile');
    expect(DATI.talenti['savage-attacker'].nome).toBe('Aggressore selvaggio');
    expect(DATI.talenti['magic-initiate'].nome).toBe('Iniziato alla Magia');
    expect(DATI.specie.human.tratti.find((t) => t.id === 'skillful')?.nome).toBe('Abile');
    expect(DATI.classi.rogue.features.find((f) => f.id === 'thieves-cant')?.nome).toBe('Gergo dei ladri');
  });
});