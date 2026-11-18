// Scelte di classe (passo Classe): Padronanza d'armi, strumenti, ordini, stile, supplica, lingua del ladro.
import { describe, expect, it } from 'vitest';
import { scelteDiClasse } from '../src/creazione/classe';
import { blocchiMagia, opzioniIncantesimi } from '../src/creazione/magia';
import { PASSI, prossimoPasso, statoPassi } from '../src/creazione/percorso';
import { calcolaScheda, DATI } from '../src/regole';
import { ARMI, STRUMENTI_ARTIGIANO, STRUMENTI_MUSICALI } from '../src/regole/dati/base';
import * as P from './personaggi';

const opz = (b: Parameters<typeof scelteDiClasse>[0], id: string) => scelteDiClasse(b).find((s) => s.id === id)!;

describe('Armi dell\'SRD (p. 89, nomi dell\'SRD 5.2.1 italiano)', () => {
  it('38 armi, con nome italiano e padronanza', () => {
    expect(Object.keys(ARMI)).toHaveLength(38);
    expect(ARMI.greataxe).toMatchObject({ nome: 'Ascia bipenne', padronanza: 'Doppio fendente', categoria: 'guerra', tipo: 'mischia' });
    expect(ARMI.handaxe.nome).toBe('Ascia');
    expect(ARMI.rapier.proprieta).toContain('accurata');
  });
});

describe('Padronanza d\'armi: le armi ammesse dipendono dalla classe', () => {
  it('barbaro: semplici o da guerra da mischia (p. 29)', () => {
    const ids = opz(P.BARBARO, 'barbarian.maestria-armi').opzioni.map((o) => o.id);
    expect(ids).toContain('greataxe');
    expect(ids).not.toContain('longbow');
    expect(ids).not.toContain('shortbow');
  });
  it('ladro: semplici, e da guerra solo se accurate o leggere (competenze del ladro, p. 61)', () => {
    const ids = opz(P.LADRO, 'rogue.maestria-armi').opzioni.map((o) => o.id);
    expect(ids).toEqual(expect.arrayContaining(['dagger', 'shortbow', 'rapier', 'scimitar', 'shortsword', 'hand-crossbow']));
    expect(ids).not.toContain('greataxe');
    expect(ids).not.toContain('longsword');
  });
  it('guerriero: tutte le armi', () => {
    expect(opz(P.GUERRIERO, 'fighter.maestria-armi').opzioni).toHaveLength(38);
  });
  it('l\'etichetta mostra la padronanza', () => {
    expect(opz(P.BARBARO, 'barbarian.maestria-armi').opzioni.find((o) => o.id === 'greataxe')!.nome).toBe('Ascia bipenne · Doppio fendente');
  });
  it('un\'arma non ammessa è un errore', () => {
    const s = calcolaScheda({ ...P.BARBARO, scelte: { ...P.BARBARO.scelte, 'barbarian.maestria-armi': ['greataxe', 'longbow'] } });
    expect(s.avvisi.find((a) => a.id === 'scelta-non-valida:barbarian.maestria-armi:longbow')?.livello).toBe('errore');
  });
});

describe('Strumenti', () => {
  it('bardo: 3 strumenti musicali (p. 31)', () => {
    const s = opz(P.BARDO, 'bard.strumenti');
    expect(s.quantita).toBe(3);
    expect(s.opzioni.map((o) => o.id).sort()).toEqual(Object.keys(STRUMENTI_MUSICALI).sort());
    expect(STRUMENTI_MUSICALI.lute).toBe('Liuto');
  });
  it('monaco: uno strumento da artigiano o musicale (p. 49)', () => {
    expect(opz(P.MONACO, 'monk.strumento').opzioni).toHaveLength(Object.keys(STRUMENTI_ARTIGIANO).length + Object.keys(STRUMENTI_MUSICALI).length);
  });
});

describe('Ordini, stile, supplica, lingua del ladro', () => {
  it('nomi italiani delle opzioni', () => {
    expect(opz(P.CHIERICO, 'cleric.ordine-divino').opzioni.map((o) => o.nome)).toEqual(['Protettore', 'Taumaturgo']);
    expect(opz(P.DRUIDO, 'druid.ordine-primordiale').opzioni.map((o) => o.nome)).toEqual(['Mago', 'Custode']);
    expect(opz(P.GUERRIERO, 'fighter.stile').opzioni.map((o) => o.nome)).toContain('Combattere con armi possenti');
    expect(opz(P.WARLOCK, 'warlock.suppliche').opzioni.map((o) => o.nome))
      .toEqual(['Armatura delle ombre', 'Mente occulta', 'Patto della catena', 'Patto della lama', 'Patto del tomo']);
  });
  it('lingua del ladro: quelle già scelte nell\'origine sono spente', () => {
    const l = opz(P.LADRO, 'rogue.lingua').opzioni;
    expect(l.find((o) => o.id === 'dwarvish')).toMatchObject({ disattivata: true, motivo: 'la conosci già' });
    expect(l.find((o) => o.id === 'elvish')?.disattivata).toBe(false);
  });
  it('le abilità e la Maestria non sono qui: stanno nelle Caratteristiche', () => {
    expect(scelteDiClasse(P.LADRO).map((s) => s.id)).not.toContain('rogue.abilita');
    expect(scelteDiClasse(P.LADRO).map((s) => s.id)).not.toContain('rogue.maestria');
  });
});

describe('Patto del tomo (p. 73): 3 trucchetti e 2 rituali di 1° da qualsiasi lista', () => {
  const tomo = { ...P.WARLOCK, scelte: { ...P.WARLOCK.scelte, 'warlock.suppliche': ['pact-of-the-tome'],
    'warlock.tomo.trucchetti': ['guidance', 'fire-bolt', 'druidcraft'], 'warlock.tomo.rituali': ['find-familiar', 'detect-magic'] } };
  it('un blocco di magia in più, con la CD del warlock', () => {
    const b = blocchiMagia(tomo).find((x) => x.id === 'pact-of-the-tome')!;
    expect(b.nome).toBe('Classe: Patto del tomo');
    expect(b.contatori).toMatchObject([
      { tipo: 'trucchetti', scelti: 3, attesi: 3 },
      { tipo: 'incantesimi', etichetta: 'Rituali di 1°', scelti: 2, attesi: 2 },
    ]);
    expect(b.cd?.totale).toBe(calcolaScheda(tomo).magia.find((m) => m.id === 'warlock')!.cd!.totale);
  });
  it('si sceglie solo tra i rituali di 1°', () => {
    const o = opzioniIncantesimi(tomo, 'pact-of-the-tome', 'incantesimi');
    expect(o.every((x) => DATI.incantesimi[x.id].rituale && DATI.incantesimi[x.id].livello === 1)).toBe(true);
  });
  it('un incantesimo non rituale è un errore', () => {
    const s = calcolaScheda({ ...tomo, scelte: { ...tomo.scelte, 'warlock.tomo.rituali': ['find-familiar', 'shield'] } });
    expect(s.avvisi.find((a) => a.id === 'non-rituale:warlock.tomo.rituali:shield')?.livello).toBe('errore');
  });
});

describe('Percorso a 8 passi', () => {
  it('non c\'è più il passo Abilità', () => {
    expect(PASSI.map((p) => p.id)).toEqual(['classe', 'background', 'specie', 'caratteristiche', 'magia', 'equipaggiamento', 'personaggio', 'riepilogo']);
  });
  it('manca la Padronanza d\'armi: il passo da fare è Classe', () => {
    const b = { ...P.BARBARO, scelte: { ...P.BARBARO.scelte, 'barbarian.maestria-armi': [] } };
    expect(statoPassi(b).classe.stato).toBe('da-fare');
    expect(prossimoPasso(b)).toBe('classe');
  });
  it('manca la Maestria del ladro: il passo da fare è Caratteristiche', () => {
    const b = { ...P.LADRO, scelte: { ...P.LADRO.scelte, 'rogue.maestria': [] } };
    expect(statoPassi(b).caratteristiche.stato).toBe('da-fare');
  });
});
