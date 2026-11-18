// Background personalizzati: modulo guidato, calcolo come uno dell'SRD, viaggio con la scheda (sezione 4).
// I dati qui sono INVENTATI per il test: nessun background del Manuale del Giocatore è nel codice.
import { describe, expect, it } from 'vitest';
import { controllaModulo, creaBackground, DAL_MANUALE, datiCon, elementiUsati, moduloDa, moduloVuoto, registra, type ModuloBackground } from '../src/creazione/personalizzati';
import { esportaJSON, importaJSON, riepilogo } from '../src/creazione/riepilogo';
import { statoPassi } from '../src/creazione/percorso';
import { calcolaScheda } from '../src/regole/motore';
import { DATI } from '../src/regole/dati';
import * as P from './personaggi';

const cartografo = (): ModuloBackground => ({
  ...moduloVuoto(), nome: 'Cartografo di prova', fonte: 'Inventato per il test', pagina: '12', descrizione: 'Disegna mappe di posti mai visti',
  caratteristiche: ['DES', 'INT', 'SAG'], abilita: ['perception', 'survival'],
  strumento: { tipo: 'fisso', id: 'cartographers-tools' }, talento: { tipo: 'srd', id: 'alert' },
  oggettiA: [{ oggetto: 'dagger', quantita: 1 }, { oggetto: 'pouch', quantita: 1 }], moA: 10,
});

describe('Elenco dal Manuale del Giocatore', () => {
  it('12 nomi, solo nomi: nessun dato di gioco', () => {
    expect(DAL_MANUALE).toHaveLength(12);
    for (const x of DAL_MANUALE) expect(Object.keys(x).sort()).toEqual(['id', 'nome', 'nomeEn']);
    expect(DAL_MANUALE.some((x) => DATI.background[x.id])).toBe(false);   // nessuno dei 4 dell'SRD
  });
  it('il modulo parte con il nome e la fonte, il resto vuoto', () => {
    expect(moduloVuoto('hermit')).toMatchObject({ daManuale: 'hermit', nome: 'Eremita', fonte: 'Manuale del Giocatore 2024', caratteristiche: ['', '', ''], talento: null });
  });
});

describe('Modulo guidato', () => {
  it('un modulo vuoto dice cosa manca', () => {
    expect(controllaModulo(moduloVuoto()).map((e) => e.campo)).toEqual(['nome', 'caratteristiche', 'abilita', 'strumento', 'talento']);
  });
  it('doppioni e Iniziato senza lista', () => {
    const m = { ...cartografo(), caratteristiche: ['DES', 'DES', 'SAG'] as ModuloBackground['caratteristiche'], abilita: ['perception', 'perception'],
      talento: { tipo: 'srd' as const, id: 'magic-initiate' } };
    expect(controllaModulo(m).map((e) => e.messaggio)).toEqual([
      'Le 3 caratteristiche devono essere diverse', 'Le 2 abilità devono essere diverse', 'Iniziato alla magia: scegli la lista (Chierico, Druido o Mago)']);
  });
  it('dal modulo al background; B è sempre 50 mo; andata e ritorno per modificarlo', () => {
    const bg = creaBackground(cartografo());
    expect(bg).toMatchObject({ id: 'pers-cartografo-di-prova', personalizzato: true, caratteristiche: ['DES', 'INT', 'SAG'], strumento: 'cartographers-tools',
      talento: { talento: 'alert' }, rimando: 'Inventato per il test, p. 12', equipaggiamento: { A: { mo: 10 }, B: { oggetti: [], mo: 50 } } });
    expect(moduloDa(bg)).toMatchObject({ ...cartografo(), id: bg.id });
  });
  it('strumento a scelta e talento fuori dall\'SRD', () => {
    const bg = creaBackground({ ...cartografo(), strumento: { tipo: 'scelta', famiglia: 'gioco' }, talento: { tipo: 'libero', nome: 'Talento inventato', nota: '+1 a qualcosa' } });
    expect(bg.strumento).toMatchObject({ id: 'pers-cartografo-di-prova.strumento', tipo: 'strumento', quantita: 1, opzioni: ['dice', 'dragonchess', 'playing-cards', 'three-dragon-ante'] });
    expect(bg).toMatchObject({ talento: { talento: '' }, talentoLibero: { nome: 'Talento inventato', nota: '+1 a qualcosa' } });
    expect(moduloDa(bg).strumento).toEqual({ tipo: 'scelta', famiglia: 'gioco' });
  });
});

describe('Il motore lo calcola come uno dell\'SRD', () => {
  const bg = creaBackground(cartografo());
  const d = datiCon({ background: { [bg.id]: bg } });
  const travis = { ...P.TRAVIS, background: bg.id, bonusBackground: { INT: 2, SAG: 1 }, scelte: { ...P.TRAVIS.scelte }, avvisiAccettati: [...P.TRAVIS.avvisiAccettati] };
  delete (travis.scelte as Record<string, string[]>)['magic-initiate.caratteristica'];
  it('abilità, talento, strumento, monete', () => {
    const s = calcolaScheda(travis, d);
    expect(s.abilita.perception.competente).toBe(true);
    expect(s.abilita.religion.competente).toBe(false);                  // non è più Accolito
    expect(s.talenti).toContain('alert');
    expect(s.strumenti).toContain('cartographers-tools');
    expect(s.monete.totale).toBe(5 + 10);
    expect(s.inventario.find((v) => v.oggetto === 'pouch')?.fonti).toEqual(['Background (A)']);
  });
  it('i bonus vanno solo sulle sue 3 caratteristiche', () => {
    expect(calcolaScheda({ ...travis, bonusBackground: { FOR: 2, SAG: 1 } }, d).avvisi.map((a) => a.id)).toContain('bonus-background');
  });
  it('talento fuori dall\'SRD: avviso nel passo Background, nome nei privilegi', () => {
    const libero = creaBackground({ ...cartografo(), talento: { tipo: 'libero', nome: 'Talento inventato', nota: '+1 a qualcosa' } });
    registra({ background: { [libero.id]: libero } });
    try {
      const pg = { ...travis, background: libero.id };
      expect(calcolaScheda(pg).avvisi.find((a) => a.id === 'talento-personalizzato')?.livello).toBe('attenzione');
      expect(statoPassi(pg).background.avvisi.map((a) => a.id)).toContain('talento-personalizzato');
      expect(riepilogo(pg)!.chiE.privilegi).toContain('Talento: Talento inventato (personalizzato: +1 a qualcosa)');
    } finally { registra({ background: {} }); }
    expect(DATI.background[libero.id]).toBeUndefined();               // tolto, e quelli dell'SRD restano
    expect(DATI.background.acolyte).toBeDefined();
  });
});

describe('Viaggia con la scheda', () => {
  const bg = creaBackground(cartografo());
  const e = { background: { [bg.id]: bg } };
  const pg = { ...P.TRAVIS, background: bg.id };
  it('nel JSON, solo l\'elemento che usa', () => {
    expect(elementiUsati(pg, { background: { ...e.background, 'pers-altro': { ...bg, id: 'pers-altro' } } })).toEqual(e);
    const r = importaJSON(esportaJSON(pg, undefined, e));
    expect('elementi' in r && r.elementi).toEqual(e);
    expect('bozza' in r && r.bozza.background).toBe(bg.id);
  });
  it('senza l\'elemento, l\'import dice cosa manca', () => {
    expect(importaJSON(esportaJSON(pg))).toMatchObject({ errore: expect.stringMatching(/pers-cartografo-di-prova/) });
  });
  it('un elemento non personalizzato non passa', () => {
    const finto = JSON.stringify({ formato: 'companion-b20', versione: 1, personaggio: P.TRAVIS, elementi: { background: { acolyte: { ...bg, id: 'acolyte' } } } });
    const r = importaJSON(finto);
    expect('elementi' in r).toBe(false);
  });
});
