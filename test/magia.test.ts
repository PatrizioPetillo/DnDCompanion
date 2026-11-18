// Schermata Magia (sezione 6): blocchi per fonte, contatori, selezione degli incantesimi.
import { describe, expect, it } from 'vitest';
import { blocchiMagia, filtra, opzioniIncantesimi, scegliIncantesimo } from '../src/creazione/magia';
import { DATI } from '../src/regole';
import * as P from './personaggi';

const stati = (o: ReturnType<typeof opzioniIncantesimi>) => Object.fromEntries(o.map((x) => [x.id, x.stato]));

describe('Blocchi per fonte', () => {
  it('Travis: Mago e Iniziato alla Magia (Chierico), ognuno con CD, attacco e contatori', () => {
    const b = blocchiMagia(P.TRAVIS);
    expect(b.map((x) => x.nome)).toEqual(['Classe: Mago', 'Talento: Iniziato alla Magia (Chierico)']);
    const mago = b[0];
    expect(mago.cd?.totale).toBe(13);
    expect(mago.cd?.termini.map((t) => t.etichetta)).toEqual(['Base', 'Competenza', 'Intelligenza']);
    expect(mago.attacco?.totale).toBe(5);
    expect(mago.focus).toBe('Focus arcano o il libro degli incantesimi');
    expect(mago.contatori).toMatchObject([
      { tipo: 'trucchetti', etichetta: 'Trucchetti', scelti: 3, attesi: 3 },
      { tipo: 'libro', etichetta: 'Nel libro', scelti: 6, attesi: 6 },
      { tipo: 'preparati', etichetta: 'Preparati', scelti: 4, attesi: 4 },
    ]);
    expect(mago.capacita.map((c) => c.nome)).toEqual(['Rituali', 'Recupero arcano']);
    expect(b[1].contatori).toMatchObject([
      { tipo: 'trucchetti', etichetta: 'Trucchetti', scelti: 2, attesi: 2 },
      { tipo: 'incantesimi', etichetta: 'Incantesimo di 1°', scelti: 1, attesi: 1, voci: ['healing-word'] },
    ]);
    expect(b[1].lanci).toBe('Parola guaritrice: 1 volta gratis per riposo lungo, poi anche con gli slot');
  });
  it('il barbaro non ha blocchi di magia', () => {
    expect(blocchiMagia(P.BARBARO)).toEqual([]);
  });
});

describe('Opzioni da scegliere', () => {
  it('trucchetti di Iniziato (Chierico): solo dalla lista del chierico, i 2 scelti, gli altri pieni', () => {
    const o = opzioniIncantesimi(P.TRAVIS, 'magic-initiate', 'trucchetti');
    expect(o.every((x) => DATI.incantesimi[x.id].liste.includes('cleric') && DATI.incantesimi[x.id].livello === 0)).toBe(true);
    const s = stati(o);
    expect(s.guidance).toBe('scelto');
    expect(s.light).toBe('scelto');
    expect(s['sacred-flame']).toBe('pieno');
  });
  it('un trucchetto già dato da un\'altra fonte non si sceglie di nuovo, e si vede da dove arriva', () => {
    const o = opzioniIncantesimi(P.TRAVIS, 'wizard', 'trucchetti');
    const luce = o.find((x) => x.id === 'light')!;
    expect(luce.stato).toBe('altraFonte');
    expect(luce.fonte).toBe('Talento: Iniziato alla Magia (Chierico)');
  });
  it('il mago prepara solo dal libro (p. 78)', () => {
    const o = opzioniIncantesimi(P.TRAVIS, 'wizard', 'preparati');
    expect(o.map((x) => x.id).sort()).toEqual([...P.TRAVIS.incantesimi.libro!].sort());
    expect(stati(o)).toMatchObject({ 'mage-armor': 'scelto', shield: 'scelto', alarm: 'pieno', identify: 'pieno' });
  });
  it('il libro: incantesimi di 1° della lista del mago', () => {
    const o = opzioniIncantesimi(P.TRAVIS, 'wizard', 'libro');
    expect(o.every((x) => DATI.incantesimi[x.id].livello === 1 && DATI.incantesimi[x.id].liste.includes('wizard'))).toBe(true);
    expect(stati(o)['magic-missile']).toBe('pieno');
  });
});

describe('Scegliere e togliere', () => {
  it('trucchetto di Iniziato: togli Guida, poi scegli Fiamma sacra', () => {
    const senza = scegliIncantesimo(P.TRAVIS, 'magic-initiate', 'trucchetti', 'guidance');
    expect(senza.scelte['magic-initiate.trucchetti']).toEqual(['light']);
    const con = scegliIncantesimo(senza, 'magic-initiate', 'trucchetti', 'sacred-flame');
    expect(con.scelte['magic-initiate.trucchetti']).toEqual(['light', 'sacred-flame']);
  });
  it('preparati del mago: si salvano in incantesimi.preparati', () => {
    const b = scegliIncantesimo(P.TRAVIS, 'wizard', 'preparati', 'shield');
    expect(b.incantesimi.preparati.wizard).toEqual(['mage-armor', 'feather-fall', 'find-familiar']);
  });
  it('libro: aggiungere oltre 6 non fa niente; uno pieno o di altra fonte non si tocca', () => {
    expect(scegliIncantesimo(P.TRAVIS, 'wizard', 'libro', 'magic-missile')).toBe(P.TRAVIS);
    expect(scegliIncantesimo(P.TRAVIS, 'wizard', 'trucchetti', 'light')).toBe(P.TRAVIS);
  });
});

describe('Filtri (anche al contrario: «senza concentrazione»)', () => {
  const tutti = opzioniIncantesimi(P.TRAVIS, 'wizard', 'libro');
  it('senza concentrazione', () => {
    expect(filtra(tutti, { concentrazione: 'no' }).every((x) => !DATI.incantesimi[x.id].concentrazione)).toBe(true);
  });
  it('solo rituali, per scuola, per nome italiano', () => {
    expect(filtra(tutti, { rituale: 'si' }).map((x) => x.id)).toContain('find-familiar');
    expect(filtra(tutti, { scuola: 'abjuration' }).map((x) => x.id)).toContain('shield');
    expect(filtra(tutti, { cerca: 'armatura' }).map((x) => x.id)).toEqual(['mage-armor']);
  });
});

describe('Iniziato già nel Background (la specie non è ancora scelta)', () => {
  it('si possono scegliere i trucchetti del chierico prima della specie', () => {
    const { specie: _s, ...b } = P.TRAVIS;
    const o = opzioniIncantesimi(b, 'magic-initiate', 'trucchetti');
    expect(o.find((x) => x.id === 'guidance')?.stato).toBe('scelto');
    expect(blocchiMagia(b).map((x) => x.id)).toEqual(['wizard', 'magic-initiate']);
  });
});
