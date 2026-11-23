// I 12 personaggi di prova al 5° livello (23/11/2026): valori del file «Valori attesi 5° livello», approvato da Patrizio.
import { describe, expect, it } from 'vitest';
import { calcolaScheda } from '../src/regole';
import { testoDadi } from '../src/regole/dati/dadi-incantesimi';
import { riepilogo } from '../src/creazione/riepilogo';
import { errori, magia, risorsa, sali, L4_WARLOCK, L5_BARBARO as BARBARO, L5_BARDO as BARDO, L5_CHIERICO as CHIERICO, L5_DRUIDO as DRUIDO,
  L5_GUERRIERO as GUERRIERO, L5_MONACO as MONACO, L5_PALADINO as PALADINO, L5_RANGER as RANGER, L5_LADRO as LADRO,
  L5_STREGONE as STREGONE, L5_WARLOCK as WARLOCK, L5_TRAVIS as TRAVIS, L5_TRAVIS_SAGGIO as TRAVIS_SAGGIO } from './livelli-prova';

type Pg = Parameters<typeof calcolaScheda>[0];
const s = (pg: Pg) => calcolaScheda(pg);
const ca = (pg: Pg) => { const x = s(pg); return x.ca.formule.find((f) => f.id === x.ca.attuale)!.valore.totale; };
const att = (pg: Pg, nome: string) => s(pg).attacchi.find((a) => a.nome === nome)!;
const ab = (pg: Pg, ...ids: string[]) => ids.map((a) => s(pg).abilita[a].totale);
const ts = (pg: Pg, ...c: ('FOR' | 'DES' | 'COS' | 'INT' | 'SAG' | 'CAR')[]) => c.map((x) => s(pg).tiriSalvezza[x].totale);
const sempre = (pg: Pg) => s(pg).magia.flatMap((m) => m.semprePreparati);

describe('5° livello: PF, competenza +3, nessuna scelta mancante', () => {
  it.each([
    ['Barbaro', BARBARO, 60], ['Bardo', BARDO, 38], ['Chierico', CHIERICO, 38], ['Druido', DRUIDO, 43], ['Guerriero', GUERRIERO, 44],
    ['Monaco', MONACO, 38], ['Paladino', PALADINO, 44], ['Ranger', RANGER, 44], ['Ladro', LADRO, 38], ['Stregone', STREGONE, 42],
    ['Warlock', WARLOCK, 38], ['Travis', TRAVIS, 32], ['Travis Sapiente', TRAVIS_SAGGIO, 32],
  ] as const)('%s: PF %i', (_, pg, pf) => {
    expect(s(pg).pf.totale).toBe(pf);
    expect(s(pg).competenza).toBe(3);
    expect(errori(pg).map((a) => a.messaggio)).toEqual([]);
  });
});

describe('5° livello: personaggio per personaggio (p. 23, 29-82)', () => {
  it('Barbaro: 2 attacchi, Ascia bipenne +7, TS FOR +7 COS +6, velocità 12 m (Movimento veloce), Esperto minatore 3', () => {
    expect(s(BARBARO).valoriClasse.attacchi).toBe('2');
    expect(att(BARBARO, 'Ascia bipenne').colpire.totale).toBe(7);
    expect(att(BARBARO, 'Arco corto').colpire.totale).toBe(5);
    expect(ts(BARBARO, 'FOR', 'COS')).toEqual([7, 6]);
    expect(ab(BARBARO, 'athletics', 'intimidation', 'nature')).toEqual([7, 3, 2]);
    expect([s(BARBARO).velocita, s(BARBARO).percezionePassiva, ca(BARBARO)]).toEqual([40, 13, 15]);
    expect(risorsa(BARBARO, 'stonecunning')?.usi).toBe(3);
    expect(risorsa(BARBARO, 'rage')?.usi).toBe(3);
  });
  it('Bardo: CD 14 +6, Ispirazione d8 che torna anche con il riposo breve, Maestria +9, iniziativa +6, 9 preparati, slot 4/3/2', () => {
    const m = magia(BARDO, 'bard');
    expect([m.cd?.totale, m.attacco?.totale, m.preparati?.limite, m.trucchetti.attesi]).toEqual([14, 6, 9, 3]);
    const i = risorsa(BARDO, 'bardic-inspiration')!;
    expect([i.usi, i.dettaglio, i.recupero.map((r) => r.riposo)]).toEqual([3, 'd8', ['breve', 'lungo']]);
    expect(ab(BARDO, 'persuasion', 'performance', 'deception', 'insight', 'arcana')).toEqual([9, 9, 6, 4, 3]);
    expect([s(BARDO).iniziativa.totale, s(BARDO).percezionePassiva]).toEqual([6, 14]);
    expect(s(BARDO).slot.normali).toEqual([4, 3, 2]);
    expect(testoDadi('vicious-mockery', 3, 0, 5)).toBe('2d6 psichici');
  });
  it('Chierico: CD 15 +7, Soffio CD 13 e 2d10, Volo draconico, Vita al 5°, Fiamma sacra 2d8', () => {
    expect(magia(CHIERICO, 'cleric').cd?.totale).toBe(15);
    expect(magia(CHIERICO, 'magic-initiate').cd?.totale).toBe(15);
    expect(s(CHIERICO).cdSpeciali.find((c) => c.id === 'breath-weapon')?.cd.totale).toBe(13);
    expect(risorsa(CHIERICO, 'breath-weapon')).toMatchObject({ usi: 3, dettaglio: '2d10, TS di Destrezza' });
    expect(risorsa(CHIERICO, 'draconic-flight')?.usi).toBe(1);
    expect(sempre(CHIERICO)).toEqual(expect.arrayContaining(['mass-healing-word', 'revivify']));
    expect(ab(CHIERICO, 'insight', 'medicine', 'religion')).toEqual([7, 7, 3]);
    expect(ts(CHIERICO, 'SAG', 'CAR')).toEqual([7, 3]);
    expect(testoDadi('sacred-flame', 4, 0, 5)).toBe('2d8 radiosi');
    expect(magia(CHIERICO, 'cleric').preparati?.limite).toBe(9);
  });
  it('Druido: CD 15, Iniziato CD 11, Percezione passiva 17, elfo dei boschi al 3° e 5°, terra temperata: Fulmine', () => {
    expect([magia(DRUIDO, 'druid').cd?.totale, magia(DRUIDO, 'magic-initiate').cd?.totale, magia(DRUIDO, 'elf').cd?.totale]).toEqual([15, 11, 15]);
    expect(s(DRUIDO).percezionePassiva).toBe(17);
    expect(ab(DRUIDO, 'arcana', 'nature', 'medicine', 'history')).toEqual([7, 7, 7, 3]);
    expect(magia(DRUIDO, 'elf-3').semprePreparati).toEqual(['longstrider']);
    expect(magia(DRUIDO, 'elf-5').lanciGratuiti).toMatchObject({ incantesimi: ['pass-without-trace'], usi: 1 });
    expect(sempre(DRUIDO)).toContain('lightning-bolt');
    expect(testoDadi('shillelagh', 4, 0, 5)).toBe('1d10 + 4 forza o contundenti');
  });
  it('Guerriero: 2 attacchi, Spadone +7, TS FOR +7, Scarica di adrenalina 3', () => {
    expect(s(GUERRIERO).valoriClasse.attacchi).toBe('2');
    expect(att(GUERRIERO, 'Spadone').colpire.totale).toBe(7);
    expect(ts(GUERRIERO, 'FOR', 'COS')).toEqual([7, 5]);
    expect(s(GUERRIERO).percezionePassiva).toBe(14);
    expect(risorsa(GUERRIERO, 'adrenaline-rush')?.usi).toBe(3);
    expect(risorsa(GUERRIERO, 'second-wind')?.usi).toBe(3);
  });
  it('Monaco: 2 attacchi, colpo senz\'armi +7 con 1d8 + 4, CD 14, 5 punti, iniziativa +7, velocità 12 m', () => {
    expect(s(MONACO).valoriClasse['martial-arts-die']).toBe('1d8');
    expect(att(MONACO, 'Colpo senz\'armi').colpire.totale).toBe(7);
    expect(att(MONACO, 'Colpo senz\'armi').danni.testo).toBe('1d8 + 4 contundenti');
    expect(s(MONACO).cdSpeciali.find((c) => c.id === 'monk-focus')?.cd.totale).toBe(14);
    expect(risorsa(MONACO, 'focus')?.usi).toBe(5);
    expect([s(MONACO).iniziativa.totale, s(MONACO).percezionePassiva, ca(MONACO), s(MONACO).velocita]).toEqual([7, 16, 17, 40]);
  });
  it('Paladino: CD 14, Fido destriero, Devozione al 5°, tiefling al 3° e 5°, Imposizione delle mani 25, slot 4/2', () => {
    expect(magia(PALADINO, 'paladin').cd?.totale).toBe(14);
    expect(magia(PALADINO, 'faithful-steed').lanciGratuiti).toMatchObject({ incantesimi: ['find-steed'], usi: 1 });
    expect(sempre(PALADINO)).toEqual(expect.arrayContaining(['aid', 'zone-of-truth', 'hellish-rebuke', 'darkness']));
    expect(magia(PALADINO, 'tiefling-3').cd?.totale).toBe(11);
    expect(risorsa(PALADINO, 'lay-on-hands')?.usi).toBe(25);
    expect(s(PALADINO).slot.normali).toEqual([4, 2]);
    expect(att(PALADINO, 'Spada lunga').colpire.totale).toBe(7);
    expect(ab(PALADINO, 'athletics', 'intimidation', 'insight')).toEqual([7, 6, 3]);
  });
  it('Ranger: 2 attacchi, Arco lungo +8, CD 13, Marchio del cacciatore 3 volte, gnomo 3 volte, Furtività +9', () => {
    expect(att(RANGER, 'Arco lungo').colpire.totale).toBe(8);
    expect(magia(RANGER, 'ranger').cd?.totale).toBe(13);
    expect(magia(RANGER, 'ranger').lanciGratuiti?.usi).toBe(3);
    expect(magia(RANGER, 'gnome').lanciGratuiti?.usi).toBe(3);
    expect(ab(RANGER, 'stealth', 'perception', 'athletics')).toEqual([9, 5, 3]);
    expect([s(RANGER).iniziativa.totale, s(RANGER).percezionePassiva]).toEqual([6, 15]);
  });
  it('Ladro: Attacco furtivo 3d6, Colpo astuto CD 15, Maestria +10, iniziativa +7', () => {
    expect(s(LADRO).valoriClasse['sneak-attack']).toBe('3d6');
    expect(s(LADRO).cdSpeciali.find((c) => c.id === 'cunning-strike')?.cd.totale).toBe(15);
    expect(ab(LADRO, 'stealth', 'sleight-of-hand', 'acrobatics', 'investigation')).toEqual([10, 10, 7, 5]);
    expect(ts(LADRO, 'DES', 'INT')).toEqual([7, 5]);
    expect(s(LADRO).iniziativa.totale).toBe(7);
  });
  it('Stregone: CD 14, Iniziato CD 12, Soffio CD 14, 5 punti, Draconica al 5°, Dardo di fuoco 2d10', () => {
    expect([magia(STREGONE, 'sorcerer').cd?.totale, magia(STREGONE, 'magic-initiate').cd?.totale]).toEqual([14, 12]);
    expect(s(STREGONE).cdSpeciali.find((c) => c.id === 'breath-weapon')?.cd.totale).toBe(14);
    expect(risorsa(STREGONE, 'sorcery-points')?.usi).toBe(5);
    expect(sempre(STREGONE)).toEqual(expect.arrayContaining(['fear', 'fly']));
    expect(ca(STREGONE)).toBe(14);
    expect(testoDadi('fire-bolt', 3, 0, 5)).toBe('2d10 fuoco');
  });
  it('Warlock: CD 15, 2 slot del patto di 3°, 5 suppliche, Deflagrazione occulta a 2 raggi, tiefling abissale al 3° e 5°', () => {
    expect(magia(WARLOCK, 'warlock').cd?.totale).toBe(15);
    expect(s(WARLOCK).slot.patto).toEqual({ numero: 2, livello: 3 });
    expect(sempre(WARLOCK)).toEqual(expect.arrayContaining(['fireball', 'stinking-cloud', 'ray-of-sickness', 'hold-person']));
    const r = riepilogo(WARLOCK).combattimento.trucchetti.find((t) => t.id.endsWith(':eldritch-blast'))!;
    expect(r.dadi).toBe('1d10 + 4 forza');
    expect(r.nota).toMatch(/^2 raggi/);
    expect(ab(WARLOCK, 'deception', 'arcana')).toEqual([7, 3]);
    // con Blocca persone ancora preparato: avviso, non errore
    const prima = sali(L4_WARLOCK, 5, { 'warlock.suppliche-5': ['one-with-shadows', 'repelling-blast'] },
      { warlock: [...L4_WARLOCK.incantesimi.preparati.warlock, 'counterspell'] });
    expect(s(prima).avvisi.some((a) => a.id.startsWith('gia-sempre-preparato:hold-person'))).toBe(true);
  });
  it('Warlock: le suppliche con il patto richiedono il patto', () => {
    const lama = sali(L4_WARLOCK, 5, { 'warlock.suppliche-5': ['thirsting-blade', 'repelling-blast'] });
    expect(errori(lama).some((a) => a.id === 'supplica-requisito:thirsting-blade')).toBe(true);
  });
  it('Travis: CD 15 +7, Arcano +10, libro 17 (Palla di fuoco gratis), 9 preparati, iniziativa +4', () => {
    const m = magia(TRAVIS, 'wizard');
    expect([m.cd?.totale, m.attacco?.totale, m.libro?.scelti.length, m.preparati?.limite]).toEqual([15, 7, 17, 9]);
    expect(ab(TRAVIS, 'arcana', 'investigation', 'insight')).toEqual([10, 7, 5]);
    expect(s(TRAVIS).iniziativa.totale).toBe(4);
    expect(s(TRAVIS_SAGGIO).iniziativa.totale).toBe(5);
    expect(ab(TRAVIS_SAGGIO, 'arcana', 'history', 'insight')).toEqual([10, 7, 4]);
  });
  it('un incantesimo preparato due volte o scritto due volte nel libro è un errore', () => {
    const doppio = sali(TRAVIS, 5, {}, { wizard: [...TRAVIS.incantesimi.preparati.wizard.slice(0, 8), 'shield'] });
    expect(errori(doppio).some((a) => a.id === 'preparato-doppio:wizard:shield')).toBe(true);
  });
});
