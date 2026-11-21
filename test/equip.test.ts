// Cosa indossa e impugna (21/11): la CA attuale dipende dall'armatura indossata, dallo scudo e dagli incantesimi attivi;
// velocità e Furtività risentono solo dell'armatura indossata (SRD p. 92, 145, 50).
import { describe, expect, it } from 'vitest';
import { calcolaScheda } from '../src/regole';
import * as P from './personaggi';

const ca = (s: ReturnType<typeof calcolaScheda>) => s.ca.formule.find((f) => f.id === s.ca.attuale)!.valore.totale;

describe('Equipaggiamento indossato', () => {
  it('Travis: CA 11 di base; 14 solo con Armatura magica attiva (p. 145)', () => {
    expect(ca(calcolaScheda(P.TRAVIS))).toBe(11);
    expect(calcolaScheda(P.TRAVIS).ca.migliore).toBe('armatura-magica');   // la più alta possibile resta indicata
    expect(ca(calcolaScheda({ ...P.TRAVIS, equip: { attivi: ['armatura-magica'] } }))).toBe(14);
  });
  it('Guerriero: senza scelta indossa la cotta di maglia (16 + Difesa 1 = 17); togliendola torna a 11', () => {
    const s = calcolaScheda(P.GUERRIERO);
    expect(s.ca.indossata).toBe('chain-mail');
    expect(ca(s)).toBe(17);
    expect(ca(calcolaScheda({ ...P.GUERRIERO, equip: { armatura: 'nessuna' } }))).toBe(11);
  });
  it('Chierico con scudo: 14; senza scudo imbracciato 12', () => {
    const base = { ...P.CHIERICO, equipaggiamento: { classe: 'A', background: 'A' as const } };
    expect(ca(calcolaScheda(base))).toBe(14);
    const s = calcolaScheda({ ...base, equip: { scudo: false } });
    expect(ca(s)).toBe(12);
    expect(s.ca.scudo).toBe(false);
  });
  it('Cotta di maglia indossata: svantaggio alla Furtività; con Forza sotto 13 la velocità cala di 10 piedi', () => {
    const debole = { ...P.GUERRIERO, punteggi: { ...P.GUERRIERO.punteggi, base: { ...P.GUERRIERO.punteggi.base, FOR: 8 } } };
    const s = calcolaScheda(debole);
    expect(s.ca.indossata).toBe('chain-mail');
    expect(s.velocita).toBe(20);
    expect(s.abilita.stealth.svantaggio).toMatch(/Svantaggio/);
    expect(s.avvisi.some((a) => a.id === 'armatura-forza:chain-mail')).toBe(true);
    const senza = calcolaScheda({ ...debole, equip: { armatura: 'nessuna' } });
    expect(senza.velocita).toBe(30);
    expect(senza.abilita.stealth.svantaggio).toBeUndefined();
  });
});
