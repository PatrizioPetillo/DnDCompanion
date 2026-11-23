// «Cosa fa» delle risorse (23/11): ogni risorsa dei personaggi di prova e ogni Discendenza gigantica ha la sua riga
import { describe, expect, it } from 'vitest';
import { spiegaRisorsa } from '../src/creazione/spiega-risorse';
import { calcolaScheda } from '../src/regole';
import * as P from './personaggi';

const tutti = Object.values(P).filter((v) => typeof v === 'object' && v && 'classe' in (v as object)) as (typeof P.TRAVIS)[];
describe('Spiegazione delle risorse', () => {
  it('tutte le risorse dei personaggi di prova', () => {
    for (const pg of tutti) for (const r of calcolaScheda(pg).risorse) expect(spiegaRisorsa(r), `${pg.nome}: ${r.nome}`).not.toBeNull();
  });
  it("l'Ispirazione bardica con la regola intera (SRD p. 31-32)", () => {
    const t = spiegaRisorsa({ id: 'bardic-inspiration', nome: 'Ispirazione bardica' })!.testo;
    expect(t).toContain('uno solo alla volta');
    expect(t).toContain('Prova d20');
    expect(t).toContain('18 m');
  });
  it('le sei Discendenze gigantiche', () => {
    for (const n of ['Salta-nuvole', 'Fuoco bruciante', 'Brivido gelante', 'Forza della collina', 'Resistenza della pietra', 'Tuono tempestoso'])
      expect(spiegaRisorsa({ id: 'giant-ancestry', nome: `Discendenza gigantica: ${n}` }), n).not.toBeNull();
  });
  it('elementi personalizzati: il testo di chi li ha inseriti; senza testo, niente', () => {
    expect(spiegaRisorsa({ id: 'x', nome: 'Urlo', dettaglio: 'Spaventa chi ti sente' })!.testo).toBe('Spaventa chi ti sente');
    expect(spiegaRisorsa({ id: 'x', nome: 'Urlo' })).toBeNull();
  });
});
