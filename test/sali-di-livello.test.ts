// Salire di livello e livello del tavolo (23/11)
import { describe, expect, it } from 'vitest';
import { capacitaDelLivello, prossimoLivello, regolaPf, scriviTiroPf } from '../src/creazione/livello';
import { scelteDiClasse } from '../src/creazione/classe';
import { contatoreMaestria, scegliMaestria } from '../src/creazione/caratteristiche';
import { comePersonaggio, statoPassi, type Bozza } from '../src/creazione/percorso';
import { calcolaScheda, DATI } from '../src/regole';
import { avvisiTavolo, tavoloVuoto, validaTavolo } from '../src/regole/tavolo';
import { LIVELLO_MASSIMO } from '../src/regole/livelli';
import * as P from './personaggi';

const salvato = (pg: object): Bozza => ({ ...(pg as Bozza), conclusoIl: '2026-11-23T10:00:00.000Z' });

describe('Sali di livello', () => {
  it('fino al livello massimo, poi più niente', () => {
    expect(prossimoLivello(salvato(P.TRAVIS))).toBe(2);
    expect(prossimoLivello({ ...salvato(P.TRAVIS), livello: 2 })).toBe(3);
    expect(prossimoLivello({ ...salvato(P.TRAVIS), livello: LIVELLO_MASSIMO })).toBeNull();
    expect(scriviTiroPf({ ...salvato(P.TRAVIS), livello: 2, tiriPf: { 2: 3 } }, 2, null).tiriPf).toBeUndefined();
  });
  it('le scelte nuove compaiono nei passi: Classe (Metamagia) e Caratteristiche (Maestria del mago)', () => {
    const st = { ...salvato(P.STREGONE), livello: 2, conclusoIl: undefined };
    expect(scelteDiClasse(st).map((s) => s.id)).toContain('sorcerer.metamagia');
    expect(statoPassi(st).classe.stato).toBe('da-fare');
    const mago = { ...salvato(P.TRAVIS), livello: 2, conclusoIl: undefined };
    expect(contatoreMaestria(mago)).toEqual({ scelte: 0, quante: 1 });
    expect(scegliMaestria(mago, 'insight').scelte['wizard.studioso']).toBeUndefined();   // Intuizione non è tra le 6
    expect(scegliMaestria(mago, 'arcana').scelte['wizard.studioso']).toEqual(['arcana']);
  });
  it('cosa porta il livello, con le righe', () => {
    const c = capacitaDelLivello(salvato(P.BARDO), 2);
    expect(c.map((x) => x.nome)).toEqual(['Maestria', 'Factotum']);
    expect(c.every((x) => x.testo)).toBe(true);
    for (const id of Object.keys(DATI.classi)) expect(capacitaDelLivello({ ...salvato(P.TRAVIS), classe: id }, 2).every((x) => x.testo), id).toBe(true);
  });
});

describe('Livello e PF del tavolo', () => {
  it('il link del tavolo accetta il livello fino al massimo e la regola dei PF', () => {
    const t = { ...tavoloVuoto(), nome: 'Hillmarch', livello: 2, pf: 'tiro' };
    expect(validaTavolo(t, DATI)).toMatchObject({ livello: 2, pf: 'tiro' });
    expect(validaTavolo({ ...t, livello: 9 }, DATI)).toBeNull();
    expect(validaTavolo({ ...t, pf: 'boh' }, DATI)?.pf).toBeUndefined();
    expect(regolaPf({ ...salvato(P.TRAVIS), tavolo: validaTavolo(t, DATI)! })).toBe('tiro');
  });
  it('avvisi: livello sotto quello del tavolo, PF non secondo la regola', () => {
    const t = { ...tavoloVuoto(), nome: 'H', livello: 2, pf: 'tiro' as const };
    expect(avvisiTavolo(P.TRAVIS, t, DATI).map((a) => a.id)).toContain('tavolo-livello:2');
    const al2 = { ...P.TRAVIS, livello: 2 };
    expect(avvisiTavolo(al2, t, DATI).map((a) => a.id)).toContain('tavolo-pf-tiro');
    expect(avvisiTavolo({ ...al2, tiriPf: { 2: 4 } }, t, DATI).map((a) => a.id)).not.toContain('tavolo-pf-tiro');
    expect(avvisiTavolo({ ...al2, tiriPf: { 2: 4 } }, { ...t, pf: 'fisso' }, DATI).map((a) => a.id)).toContain('tavolo-pf-fisso');
  });
});

describe('Passi dopo la salita', () => {
  it('mago al 2° con la creazione riaperta: Classe fatta, Caratteristiche da fare (Studioso), Magia da fare (libro e preparati)', () => {
    const st = statoPassi({ ...salvato(P.TRAVIS), livello: 2, conclusoIl: undefined });
    expect(st.classe.stato).not.toBe('da-fare');
    expect(st.caratteristiche.stato).toBe('da-fare');
    expect(st.magia.stato).toBe('da-fare');
  });
});
