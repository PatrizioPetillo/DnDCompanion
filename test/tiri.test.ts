// Cosa si tira dalla scheda (idea 6)
import { describe, expect, it } from 'vitest';
import { daAttacco, daIncantesimo, daTiroSalvezza } from '../src/partita/tiri';
import { perTiro } from '../src/partita/condizioni';
import { scrivi } from '../src/partita/dadi';
import { calcolaScheda } from '../src/regole';
import * as P from './personaggi';

describe('richieste di tiro', () => {
  const s = calcolaScheda(P.TRAVIS);
  const mago = s.magia.find((m) => m.fonte.tipo === 'classe')!;
  it('un\'arma: tiro per colpire e danni con il modificatore', () => {
    const a = s.attacchi.find((x) => x.danni.dadi)!;
    const r = daAttacco(a);
    expect(r.d20).toMatchObject({ bonus: a.colpire.totale, attacco: true });
    expect(r.danni[0].espressione.piu).toBe(a.danni.mod);
  });
  it('Dardo di fuoco: attacco con incantesimo e 1d10 fuoco', () => {
    const r = daIncantesimo('fire-bolt', mago, 3)!;
    expect(r.d20?.bonus).toBe(mago.attacco!.totale);
    expect(scrivi(r.danni[0].espressione)).toBe('1d10');
  });
  it('Mani brucianti con uno slot di 2°: 4d6 e TS su Destrezza contro la CD', () => {
    const r = daIncantesimo('burning-hands', mago, 3, 2)!;
    expect(scrivi(r.danni[0].espressione)).toBe('4d6');
    expect(r.cd).toEqual({ valore: mago.cd!.totale, car: 'DES' });
    expect(r.d20).toBeUndefined();
  });
  it('Dardo incantato: un tiro per dardo, uno in più per livello di slot', () => {
    expect(daIncantesimo('magic-missile', mago, 3, 1)!.danni[0]).toMatchObject({ ripeti: 3 });
    expect(daIncantesimo('magic-missile', mago, 3, 2)!.danni[0]).toMatchObject({ ripeti: 4 });
  });
  it('Cura ferite: 2d8 + modificatore, +2d8 per livello di slot', () => {
    const r = daIncantesimo('cure-wounds', mago, 2, 2)!;
    expect(scrivi(r.danni[0].espressione)).toBe('4d8 + 2');
    expect(r.danni[0].cura).toBe(true);
  });
  it('un incantesimo senza dadi non si tira', () => expect(daIncantesimo('shield', mago, 3)).toBeNull());
});

describe('le condizioni propongono vantaggio e svantaggio', () => {
  it('avvelenato: svantaggio agli attacchi e alle prove, anche all\'iniziativa', () => {
    expect(perTiro([{ id: 'avvelenato' }], false, 'attacco').svantaggi).toEqual(['avvelenato']);
    expect(perTiro([{ id: 'avvelenato' }], false, 'iniziativa').svantaggi).toContain('avvelenato');
  });
  it('invisibile: vantaggio agli attacchi e all\'iniziativa', () => {
    expect(perTiro([{ id: 'invisibile' }], false, 'attacco').vantaggi).toEqual(['invisibile']);
    expect(perTiro([{ id: 'invisibile' }], false, 'iniziativa').vantaggi).toEqual(['invisibile']);
  });
  it('paralizzato: TS di Forza e Destrezza falliti, gli altri no', () => {
    expect(perTiro([{ id: 'paralizzato' }], false, { ts: 'DES' }).fallitoAuto).toBe('paralizzato');
    expect(perTiro([{ id: 'paralizzato' }], false, { ts: 'SAG' }).fallitoAuto).toBeNull();
  });
  it('indebolimento 2: −4 a ogni d20', () => expect(perTiro([{ id: 'indebolimento', livello: 2 }], false, 'prova').meno).toBe(4));
  it('tiro salvezza: il bonus della scheda', () => expect(daTiroSalvezza('INT', 5).d20).toMatchObject({ bonus: 5, genere: { ts: 'INT' } }));
});
