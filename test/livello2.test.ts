// I 12 personaggi di prova al 2° livello (23/11/2026): valori del file «Valori attesi 2° livello», approvato da Patrizio.
// PF con il valore fisso (SRD p. 23); il tiro del dado vita è provato a parte.
import { describe, expect, it } from 'vitest';
import { calcolaScheda } from '../src/regole';
import type { Personaggio } from '../src/regole/tipi';
import * as P from './personaggi';

import { errori, magia, risorsa, sali, L2_BARBARO as BARBARO, L2_BARDO as BARDO, L2_CHIERICO as CHIERICO, L2_DRUIDO as DRUIDO, L2_GUERRIERO as GUERRIERO, L2_MONACO as MONACO, L2_PALADINO as PALADINO, L2_RANGER as RANGER, L2_LADRO as LADRO, L2_STREGONE as STREGONE, L2_WARLOCK as WARLOCK, L2_TRAVIS as TRAVIS, L2_TRAVIS_SAGGIO as TRAVIS_SAGGIO } from './livelli-prova';
const al2 = (pg: Personaggio, scelte: Record<string, string[]> = {}, preparati: Record<string, string[]> = {}, libro?: string[]) => sali(pg, 2, scelte, preparati, libro);

describe('2° livello: PF con il valore fisso (SRD p. 23)', () => {
  it.each([
    ['Barbaro', BARBARO, 25], ['Bardo', BARDO, 17], ['Chierico', CHIERICO, 17], ['Druido', DRUIDO, 17], ['Guerriero', GUERRIERO, 20],
    ['Monaco', MONACO, 17], ['Paladino', PALADINO, 20], ['Ranger', RANGER, 20], ['Ladro', LADRO, 17], ['Stregone', STREGONE, 16],
    ['Warlock', WARLOCK, 17], ['Travis', TRAVIS, 12], ['Travis Sapiente', TRAVIS_SAGGIO, 14],
  ] as const)('%s: PF %i, competenza +2, nessuna scelta mancante', (_, pg, pf) => {
    const s = calcolaScheda(pg);
    expect(s.pf.totale).toBe(pf);
    expect(s.competenza).toBe(2);
    expect(errori(pg).map((a) => a.messaggio)).toEqual([]);
  });
  it('il tiro del dado vita al posto del valore fisso, minimo 1 (p. 23)', () => {
    expect(calcolaScheda({ ...TRAVIS, tiriPf: { 2: 6 } }).pf.totale).toBe(7 + 6 + 1);
    expect(calcolaScheda({ ...TRAVIS, tiriPf: { 2: 1 } }).pf.totale).toBe(7 + 1 + 1);
    const debole = { ...TRAVIS, punteggi: { ...TRAVIS.punteggi, base: { ...TRAVIS.punteggi.base, COS: 8 } }, tiriPf: { 2: 1 } };   // COS 8 → −1: 1 − 1 = 0 → 1
    expect(calcolaScheda(debole).pf.totale).toBe(calcolaScheda({ ...debole, livello: 1 }).pf.totale + 1);
  });
  it('il 1° livello resta com\'era', () => {
    expect(calcolaScheda(P.TRAVIS).pf.totale).toBe(7);
    expect(calcolaScheda(P.BARBARO).pf.totale).toBe(15);
  });
});

describe('2° livello: capacità nuove', () => {
  it('Barbaro: Ira ancora 2', () => expect(risorsa(BARBARO, 'rage')?.usi).toBe(2));

  it('Bardo: Maestria e Factotum (p. 32), 5 preparati, 3 slot', () => {
    const s = calcolaScheda(BARDO);
    expect(s.abilita.performance.totale).toBe(6);
    expect(s.abilita.persuasion.totale).toBe(6);
    expect(Object.fromEntries(['acrobatics', 'animal-handling', 'arcana', 'athletics', 'investigation', 'deception', 'intimidation', 'insight', 'medicine', 'nature', 'religion', 'survival', 'history']
      .map((a) => [a, s.abilita[a].totale]))).toEqual({
      acrobatics: 4, 'animal-handling': 2, arcana: 1, athletics: 0, investigation: 1, deception: 3, intimidation: 3, insight: 2, medicine: 2, nature: 1, religion: 1, survival: 2, history: 1,
    });
    expect(s.abilita.perception.totale).toBe(3);
    expect(s.percezionePassiva).toBe(13);
    expect(s.iniziativa.totale).toBe(5);
    expect(magia(BARDO, 'bard').preparati?.limite).toBe(5);
    expect(s.slot.normali).toEqual([3]);
  });

  it('Chierico: Incanalare divinità 2, 5 preparati, 3 slot', () => {
    const r = risorsa(CHIERICO, 'channel-divinity')!;
    expect(r.usi).toBe(2);
    expect(r.recupero).toEqual([{ riposo: 'breve', quanti: 1 }, { riposo: 'lungo', quanti: 'tutti' }]);
    expect(magia(CHIERICO, 'cleric').preparati?.limite).toBe(5);
    expect(calcolaScheda(CHIERICO).slot.normali).toEqual([3]);
  });

  it('Druido: Forma selvatica 2, 4 forme, 5 preparati', () => {
    expect(risorsa(DRUIDO, 'wild-shape')?.usi).toBe(2);
    expect(magia(DRUIDO, 'druid').preparati?.limite).toBe(5);
    expect(calcolaScheda(DRUIDO).slot.normali).toEqual([3]);
    // una forma con il volo o di GS più alto non è ammessa
    expect(errori(al2(P.DRUIDO, { 'druid.forme': ['rat', 'riding-horse', 'spider', 'eagle'] }, { druid: DRUIDO.incantesimi.preparati.druid })).length).toBeGreaterThan(0);
  });

  it('Guerriero: Azione impetuosa 1, Recuperare energie 2', () => {
    const r = risorsa(GUERRIERO, 'action-surge')!;
    expect(r.usi).toBe(1);
    expect(r.recupero).toEqual([{ riposo: 'breve', quanti: 'tutti' }, { riposo: 'lungo', quanti: 'tutti' }]);
    expect(risorsa(GUERRIERO, 'second-wind')?.usi).toBe(2);
  });

  it('Monaco: 2 punti concentrazione (CD 12), velocità 12 m senza armatura, Metabolismo', () => {
    const s = calcolaScheda(MONACO);
    expect(risorsa(MONACO, 'focus')?.usi).toBe(2);
    expect(s.cdSpeciali.find((c) => c.id === 'monk-focus')?.cd.totale).toBe(12);
    expect(s.velocita).toBe(40);
    expect(risorsa(MONACO, 'uncanny-metabolism')?.usi).toBe(1);
  });

  it('Paladino: Guerriero benedetto (CAR), Punizione divina sempre preparata e 1 lancio gratis, 3 preparati', () => {
    const s = calcolaScheda(PALADINO);
    const gb = magia(PALADINO, 'blessed-warrior');
    expect(gb.trucchetti.scelti).toEqual(['guidance', 'sacred-flame']);
    expect(gb.cd?.totale).toBe(12);
    expect(gb.attacco?.totale).toBe(4);
    const smite = s.magia.find((m) => m.semprePreparati.includes('divine-smite'))!;
    expect(smite.lanciGratuiti).toEqual({ incantesimi: ['divine-smite'], usi: 1, recupero: 'lungo' });
    expect(magia(PALADINO, 'paladin').preparati?.limite).toBe(3);
    expect(s.slot.normali).toEqual([2]);
    expect(s.ca.formule.find((f) => f.id === s.ca.attuale)!.valore.totale).toBe(18);
  });

  it('Ranger: Maestria in Furtività, 2 lingue, Tiro (+2 a distanza), 3 preparati', () => {
    const s = calcolaScheda(RANGER);
    expect(s.abilita.stealth.totale).toBe(7);
    expect(s.lingue).toEqual(expect.arrayContaining(['draconic', 'dwarvish']));
    expect(s.attacchi.find((a) => a.nome === 'Arco lungo')?.colpire.totale).toBe(7);
    expect(s.attacchi.find((a) => a.nome === 'Scimitarra')?.colpire.totale).toBe(5);
    expect(magia(RANGER, 'ranger').preparati?.limite).toBe(3);
    expect(s.slot.normali).toEqual([2]);
  });

  it('Ladro: Attacco furtivo ancora 1d6', () => {
    expect(calcolaScheda(LADRO).valoriClasse['sneak-attack']).toBe('1d6');
  });

  it('Stregone: 2 punti stregoneria, 4 preparati, 3 slot', () => {
    expect(risorsa(STREGONE, 'sorcery-points')?.usi).toBe(2);
    expect(magia(STREGONE, 'sorcerer').preparati?.limite).toBe(4);
    expect(calcolaScheda(STREGONE).slot.normali).toEqual([3]);
  });

  it('Warlock: 2 slot del patto, Deflagrazione agonizzante +3, Scaltrezza magica, 3 preparati', () => {
    const s = calcolaScheda(WARLOCK);
    expect(s.slot.patto).toEqual({ numero: 2, livello: 1 });
    expect(s.bonusDanniTrucchetti['eldritch-blast']).toEqual([{ etichetta: 'Deflagrazione agonizzante (Carisma)', valore: 3 }]);
    expect(risorsa(WARLOCK, 'magical-cunning')?.usi).toBe(1);
    expect(magia(WARLOCK, 'warlock').preparati?.limite).toBe(3);
    // la stessa supplica due volte: errore
    expect(errori(al2(P.WARLOCK, { 'warlock.suppliche-2': ['armor-of-shadows', 'devils-sight'] }, WARLOCK.incantesimi.preparati)).length).toBeGreaterThan(0);
  });

  it('Mago: Studioso (Arcano +7), libro 8, 5 preparati, 3 slot', () => {
    const s = calcolaScheda(TRAVIS);
    expect(s.abilita.arcana.totale).toBe(7);
    expect(magia(TRAVIS, 'wizard').libro?.scelti).toHaveLength(8);
    expect(magia(TRAVIS, 'wizard').preparati?.limite).toBe(5);
    expect(s.slot.normali).toEqual([3]);
    expect(calcolaScheda(TRAVIS_SAGGIO).abilita.arcana.totale).toBe(7);
    // Studioso solo tra Arcano, Storia, Indagare, Medicina, Natura, Religione con competenza
    expect(errori(al2(P.TRAVIS, { 'wizard.studioso': ['stealth'] }, TRAVIS.incantesimi.preparati, TRAVIS.incantesimi.libro)).length).toBeGreaterThan(0);
  });

});

describe('2° livello: la scheda e i dadi', () => {
  it('Deflagrazione agonizzante nel testo dei danni e nel tiro (1d10 + 3)', async () => {
    const { riepilogo } = await import('../src/creazione/riepilogo');
    const { daIncantesimo } = await import('../src/partita/tiri');
    const r = riepilogo(WARLOCK);
    expect(r.combattimento.trucchetti.find((t) => t.id.endsWith('eldritch-blast'))?.dadi).toMatch(/^1d10 \+ 3/);
    const s = calcolaScheda(WARLOCK);
    const m = s.magia.find((x) => x.id === 'warlock')!;
    const rq = daIncantesimo('eldritch-blast', m, 3, undefined, 3)!;
    expect(rq.danni[0].espressione.piu).toBe(3);
  });
});
