// I 12 personaggi di prova al 3° livello (23/11/2026): valori del file «Valori attesi 3° livello», approvato da Patrizio.
import { describe, expect, it } from 'vitest';
import { calcolaScheda } from '../src/regole';
import { errori, magia, risorsa, sali, L3_BARBARO as BARBARO, L3_BARDO as BARDO, L3_CHIERICO as CHIERICO, L3_DRUIDO as DRUIDO,
  L3_GUERRIERO as GUERRIERO, L3_MONACO as MONACO, L3_PALADINO as PALADINO, L3_RANGER as RANGER, L3_LADRO as LADRO,
  L3_STREGONE as STREGONE, L3_WARLOCK as WARLOCK, L3_TRAVIS as TRAVIS, L3_TRAVIS_SAGGIO as TRAVIS_SAGGIO } from './livelli-prova';

const attenzione = (pg: Parameters<typeof calcolaScheda>[0]) => calcolaScheda(pg).avvisi.filter((a) => a.livello === 'attenzione' && !a.accettato).map((a) => a.id);
const sempre = (pg: Parameters<typeof calcolaScheda>[0]) => calcolaScheda(pg).magia.flatMap((m) => m.semprePreparati);

describe('3° livello: PF e scelte complete', () => {
  it.each([
    ['Barbaro', BARBARO, 35], ['Bardo', BARDO, 24], ['Chierico', CHIERICO, 24], ['Druido', DRUIDO, 24], ['Guerriero', GUERRIERO, 28],
    ['Monaco', MONACO, 24], ['Paladino', PALADINO, 28], ['Ranger', RANGER, 28], ['Ladro', LADRO, 24], ['Stregone', STREGONE, 26],
    ['Warlock', WARLOCK, 24], ['Travis', TRAVIS, 17], ['Travis Sapiente', TRAVIS_SAGGIO, 20],
  ] as const)('%s: PF %i, competenza +2, nessuna scelta mancante', (_, pg, pf) => {
    const s = calcolaScheda(pg);
    expect(s.pf.totale).toBe(pf);
    expect(s.competenza).toBe(2);
    expect(errori(pg).map((a) => a.messaggio)).toEqual([]);
  });
});

describe('3° livello: sottoclassi dell\'SRD', () => {
  it('Barbaro (Berserker): Natura +1, Ira 3', () => {
    expect(calcolaScheda(BARBARO).abilita.nature.totale).toBe(1);
    expect(risorsa(BARBARO, 'rage')?.usi).toBe(3);
  });
  it('Bardo (Sapienza): 3 competenze bonus, 6 preparati, slot 4/2', () => {
    const s = calcolaScheda(BARDO);
    expect([s.abilita.arcana.totale, s.abilita.insight.totale, s.abilita.deception.totale]).toEqual([2, 3, 4]);
    expect(magia(BARDO, 'bard').preparati?.limite).toBe(6);
    expect(s.slot.normali).toEqual([4, 2]);
    expect(magia(BARDO, 'bard').livelloMax).toBe(2);
  });
  it('Chierico (Vita): 4 incantesimi sempre preparati; Benedizione doppia con Iniziato: avviso', () => {
    expect(sempre(CHIERICO)).toEqual(expect.arrayContaining(['aid', 'bless', 'cure-wounds', 'lesser-restoration']));
    expect(magia(CHIERICO, 'cleric').preparati?.limite).toBe(6);
    expect(attenzione(CHIERICO).some((a) => a.startsWith('gia-sempre-preparato:bless'))).toBe(true);
  });
  it('Druido (Terra, temperata): Passo velato, Stretta folgorante, Sonno; un\'altra terra cambia gli incantesimi', () => {
    expect(sempre(DRUIDO)).toEqual(expect.arrayContaining(['misty-step', 'sleep']));
    expect(calcolaScheda(DRUIDO).magia.flatMap((m) => m.trucchetti.scelti)).toContain('shocking-grasp');
    const arida = { ...DRUIDO, scelte: { ...DRUIDO.scelte, 'druid.terra': ['arid'] } };
    expect(sempre(arida)).toEqual(expect.arrayContaining(['blur', 'burning-hands']));
    expect(sempre(arida)).not.toContain('misty-step');
    expect(magia(DRUIDO, 'druid').preparati?.limite).toBe(6);
  });
  it('Guerriero (Campione): critico con 19-20', () => {
    expect(calcolaScheda(GUERRIERO).valoriClasse['critico']).toBe('19-20');
  });
  it('Monaco (Mano aperta): 3 punti concentrazione', () => {
    expect(risorsa(MONACO, 'focus')?.usi).toBe(3);
  });
  it('Paladino (Devozione): Incanalare divinità 2, sempre preparati; Scudo della fede doppio: avviso; 4 preparati, 3 slot', () => {
    expect(risorsa(PALADINO, 'paladin-channel-divinity')?.usi).toBe(2);
    expect(sempre(PALADINO)).toEqual(expect.arrayContaining(['protection-from-evil-and-good', 'shield-of-faith']));
    expect(attenzione(PALADINO).some((a) => a.startsWith('gia-sempre-preparato:shield-of-faith'))).toBe(true);
    expect(magia(PALADINO, 'paladin').preparati?.limite).toBe(4);
    expect(calcolaScheda(PALADINO).slot.normali).toEqual([3]);
  });
  it('Ranger (Cacciatore): Preda del cacciatore scelta, 4 preparati, 3 slot', () => {
    expect(magia(RANGER, 'ranger').preparati?.limite).toBe(4);
    expect(calcolaScheda(RANGER).slot.normali).toEqual([3]);
  });
  it('Ladro: Attacco furtivo 2d6', () => expect(calcolaScheda(LADRO).valoriClasse['sneak-attack']).toBe('2d6'));
  it('Stregone (Draconica): CA 13 senza armatura, 4 sempre preparati, Globo cromatico doppio: avviso, 3 punti', () => {
    const s = calcolaScheda(STREGONE);
    expect(s.ca.formule.find((f) => f.id === s.ca.attuale)!.valore.totale).toBe(13);
    expect(sempre(STREGONE)).toEqual(expect.arrayContaining(['alter-self', 'chromatic-orb', 'command', 'dragons-breath']));
    expect(attenzione(STREGONE).some((a) => a.startsWith('gia-sempre-preparato:chromatic-orb'))).toBe(true);
    expect(risorsa(STREGONE, 'sorcery-points')?.usi).toBe(3);
    expect(magia(STREGONE, 'sorcerer').preparati?.limite).toBe(6);
    expect(s.slot.normali).toEqual([4, 2]);
  });
  it('Warlock (Immondo): 2 slot del patto di 2°, 4 sempre preparati, 4 preparati', () => {
    expect(calcolaScheda(WARLOCK).slot.patto).toEqual({ numero: 2, livello: 2 });
    expect(sempre(WARLOCK)).toEqual(expect.arrayContaining(['burning-hands', 'command', 'scorching-ray', 'suggestion']));
    expect(magia(WARLOCK, 'warlock').preparati?.limite).toBe(4);
  });
  it('Mago (Invocatore): libro 12, 6 preparati, slot 4/2', () => {
    expect(magia(TRAVIS, 'wizard').libro?.scelti).toHaveLength(12);
    expect(magia(TRAVIS, 'wizard').libro?.iniziali).toBe(12);
    expect(magia(TRAVIS, 'wizard').preparati?.limite).toBe(6);
    expect(calcolaScheda(TRAVIS).slot.normali).toEqual([4, 2]);
  });
  it('un livello in più: errore finché i dati non ci sono', () => {
    expect(calcolaScheda(sali(TRAVIS, 6)).avvisi.some((a) => a.id === 'livello-non-supportato')).toBe(true);
  });
});
