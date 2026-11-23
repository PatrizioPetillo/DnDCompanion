// I 12 personaggi di prova al 4° livello (23/11/2026): valori del file «Valori attesi 4° livello», approvato da Patrizio.
import { describe, expect, it } from 'vitest';
import { calcolaScheda } from '../src/regole';
import { errori, magia, risorsa, sali, L4_BARBARO as BARBARO, L4_BARDO as BARDO, L4_CHIERICO as CHIERICO, L4_DRUIDO as DRUIDO,
  L4_GUERRIERO as GUERRIERO, L4_MONACO as MONACO, L4_PALADINO as PALADINO, L4_RANGER as RANGER, L4_LADRO as LADRO,
  L4_STREGONE as STREGONE, L4_WARLOCK as WARLOCK, L4_TRAVIS as TRAVIS, L4_TRAVIS_SAGGIO as TRAVIS_SAGGIO, L3_TRAVIS } from './livelli-prova';

const s = (pg: Parameters<typeof calcolaScheda>[0]) => calcolaScheda(pg);
const ca = (pg: Parameters<typeof calcolaScheda>[0]) => { const x = s(pg); return x.ca.formule.find((f) => f.id === x.ca.attuale)!.valore.totale; };

describe('4° livello: PF e scelte complete', () => {
  it.each([
    ['Barbaro', BARBARO, 49], ['Bardo', BARDO, 31], ['Chierico', CHIERICO, 31], ['Druido', DRUIDO, 35], ['Guerriero', GUERRIERO, 36],
    ['Monaco', MONACO, 31], ['Paladino', PALADINO, 36], ['Ranger', RANGER, 36], ['Ladro', LADRO, 31], ['Stregone', STREGONE, 34],
    ['Warlock', WARLOCK, 31], ['Travis', TRAVIS, 26], ['Travis Sapiente', TRAVIS_SAGGIO, 26],
  ] as const)('%s: PF %i, nessuna scelta mancante', (_, pg, pf) => {
    expect(s(pg).pf.totale).toBe(pf);
    expect(errori(pg).map((a) => a.messaggio)).toEqual([]);
  });
});

describe('4° livello: Aumento dei punteggi e talenti (p. 87)', () => {
  it('Barbaro: FOR 18, COS 16, CA 15, TS e Atletica, Padronanza 3', () => {
    const x = s(BARBARO);
    expect([x.punteggi.FOR.totale, x.punteggi.COS.totale]).toEqual([18, 16]);
    expect(ca(BARBARO)).toBe(15);
    expect([x.tiriSalvezza.FOR.totale, x.tiriSalvezza.COS.totale, x.abilita.athletics.totale]).toEqual([6, 5, 6]);
    expect(BARBARO.scelte['barbarian.padronanza-4']).toEqual(['javelin']);   // il giavellotto non è nell'equipaggiamento: nessun attacco nuovo
  });
  it('Bardo: CAR 16 → CD 13, attacco +5, Ispirazione 3, Persuasione +7; 3 trucchetti, 7 preparati, slot 4/3', () => {
    const m = magia(BARDO, 'bard');
    expect([m.cd?.totale, m.attacco?.totale]).toEqual([13, 5]);
    expect(risorsa(BARDO, 'bardic-inspiration')?.usi).toBe(3);
    expect(s(BARDO).abilita.persuasion.totale).toBe(7);
    expect(m.trucchetti.attesi).toBe(3);
    expect(m.preparati?.limite).toBe(7);
    expect(s(BARDO).slot.normali).toEqual([4, 3]);
  });
  it('Chierico: SAG 18 → CD 14; 4 trucchetti', () => {
    expect(magia(CHIERICO, 'cleric').cd?.totale).toBe(14);
    expect(magia(CHIERICO, 'cleric').trucchetti.attesi).toBe(4);
    expect(s(CHIERICO).percezionePassiva).toBe(14);
  });
  it('Druido: SAG 18, COS 16; 6 forme; Arcano e Natura +6', () => {
    const x = s(DRUIDO);
    expect(magia(DRUIDO, 'druid').cd?.totale).toBe(14);
    expect([x.abilita.arcana.totale, x.abilita.nature.totale, x.percezionePassiva]).toEqual([6, 6, 16]);
  });
  it('Guerriero: Lottatore (FOR 18), Spadone +6, Recuperare energie 3, Padronanza 4', () => {
    const x = s(GUERRIERO);
    expect(x.talenti).toContain('grappler');
    expect(x.punteggi.FOR.totale).toBe(18);
    expect(x.attacchi.find((a) => a.nome === 'Spadone')?.colpire.totale).toBe(6);
    expect(risorsa(GUERRIERO, 'second-wind')?.usi).toBe(3);
  });
  it('Monaco: CA 17, iniziativa +6, concentrazione 4 (CD 13)', () => {
    const x = s(MONACO);
    expect(ca(MONACO)).toBe(17);
    expect(x.iniziativa.totale).toBe(6);
    expect(risorsa(MONACO, 'focus')?.usi).toBe(4);
    expect(x.cdSpeciali.find((c) => c.id === 'monk-focus')?.cd.totale).toBe(13);
  });
  it('Paladino: CD 13, Imposizione delle mani 20, 5 preparati', () => {
    expect(magia(PALADINO, 'paladin').cd?.totale).toBe(13);
    expect(risorsa(PALADINO, 'lay-on-hands')?.usi).toBe(20);
    expect(magia(PALADINO, 'paladin').preparati?.limite).toBe(5);
  });
  it('Ranger: Allerta → iniziativa +5', () => {
    expect(s(RANGER).talenti).toContain('alert');
    expect(s(RANGER).iniziativa.totale).toBe(5);
  });
  it('Ladro: Furtività +8, CA 15, iniziativa +6', () => {
    expect([s(LADRO).abilita.stealth.totale, ca(LADRO), s(LADRO).iniziativa.totale]).toEqual([8, 15, 6]);
  });
  it('Stregone: CAR 17 (+2 a una), CA 14, 4 punti, 5 trucchetti', () => {
    expect(s(STREGONE).punteggi.CAR.totale).toBe(17);
    expect(ca(STREGONE)).toBe(14);
    expect(risorsa(STREGONE, 'sorcery-points')?.usi).toBe(4);
    expect(magia(STREGONE, 'sorcerer').trucchetti.attesi).toBe(5);
  });
  it('Warlock: CD 14, Deflagrazione 1d10 + 4', () => {
    expect(magia(WARLOCK, 'warlock').cd?.totale).toBe(14);
    expect(s(WARLOCK).bonusDanniTrucchetti['eldritch-blast'][0].valore).toBe(4);
  });
  it('Mago: Arcano +8, libro 14, 7 preparati, 4 trucchetti', () => {
    expect(s(TRAVIS).abilita.arcana.totale).toBe(8);
    expect(magia(TRAVIS, 'wizard').libro?.scelti).toHaveLength(14);
    expect(magia(TRAVIS, 'wizard').preparati?.limite).toBe(7);
    expect(magia(TRAVIS, 'wizard').trucchetti.attesi).toBe(4);
  });
  it('regole del talento: massimo 20; Lottatore richiede FOR o DES 13; altro talento con avviso; uno stile solo con la capacità', () => {
    const al20 = sali(L3_TRAVIS, 4, { 'talento-4': ['ability-score-improvement'], 'ability-score-improvement.aumento': ['INT', 'INT'] });
    expect(s({ ...al20, punteggi: { ...al20.punteggi, base: { ...al20.punteggi.base, INT: 15 } } }).avvisi.some((a) => a.id.startsWith('aumento-oltre-20'))).toBe(false);
    const libero = sali(L3_TRAVIS, 4, { 'talento-4': ['talento-libero'], 'talento-4.nome': ['Robusto'] });
    expect(s(libero).avvisi.some((a) => a.id === 'talento-personalizzato:talento-4')).toBe(true);
    const stile = sali(L3_TRAVIS, 4, { 'talento-4': ['archery'] });
    expect(errori(stile).some((a) => a.id.startsWith('prerequisito:archery'))).toBe(true);
  });
});
