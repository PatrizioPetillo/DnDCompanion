// Schermata Caratteristiche (sezione 5.2, passo 5). Regole: SRD p. 21.
import { describe, expect, it } from 'vitest';
import { abilitaPer, assegna, contatoreAbilitaClasse, contatoreMaestria, daCompletare, scegliMaestria, opzioniPunteggio, punteggiIniziali, scegliAbilitaClasse, spesaPointBuy, statoAbilita } from '../src/creazione/caratteristiche';
import { prossimoPasso, statoPassi, type Bozza } from '../src/creazione/percorso';
import { calcolaScheda } from '../src/regole';
import * as P from './personaggi';

const stato = (b: Bozza) => statoPassi(b).caratteristiche.stato;

describe('Punteggi iniziali', () => {
  it('point buy: tutti a 8, 27 punti da spendere', () => {
    const p = punteggiIniziali('pointBuy27');
    expect(Object.values(p.base)).toEqual([8, 8, 8, 8, 8, 8]);
    expect(spesaPointBuy(p.base)).toEqual({ spesi: 0, restanti: 27 });
  });
  it('serie standard senza classe: tutti da assegnare', () => {
    expect(Object.values(punteggiIniziali('serieStandard').base)).toEqual([0, 0, 0, 0, 0, 0]);
  });
  it('serie standard con la classe: la serie consigliata dall\'SRD (p. 21)', () => {
    expect(punteggiIniziali('serieStandard', 'wizard').base).toEqual({ FOR: 8, DES: 12, COS: 13, INT: 15, SAG: 14, CAR: 10 });
    expect(punteggiIniziali('serieStandard', 'barbarian').base).toEqual({ FOR: 15, DES: 13, COS: 14, INT: 10, SAG: 12, CAR: 8 });
  });
});

describe('Point buy (p. 21)', () => {
  it('Travis spende esattamente 27 punti', () => {
    expect(spesaPointBuy(P.TRAVIS.punteggi.base)).toEqual({ spesi: 27, restanti: 0 });
  });
  it('le opzioni vanno da 8 a 15 con il costo', () => {
    const o = opzioniPunteggio(punteggiIniziali('pointBuy27'), 'INT');
    expect(o.map((x) => x.valore)).toEqual([8, 9, 10, 11, 12, 13, 14, 15]);
    expect(o.find((x) => x.valore === 14)?.etichetta).toBe('14 · 7 pt');
  });
  it('i valori che sforano i 27 punti sono disattivati', () => {
    // Travis ha speso tutto: alzare FOR da 8 a 9 costerebbe 1 punto in più
    const o = opzioniPunteggio(P.TRAVIS.punteggi, 'FOR');
    expect(o.find((x) => x.valore === 8)?.disattivato).toBe(false);
    expect(o.find((x) => x.valore === 9)?.disattivato).toBe(true);
    // abbassare INT libera punti: tutti i valori più bassi restano possibili
    expect(opzioniPunteggio(P.TRAVIS.punteggi, 'INT').filter((x) => x.disattivato)).toEqual([]);
  });
});

describe('Serie standard (p. 21)', () => {
  it('mostra tutti e sei i valori; quelli già usati dicono dove sono', () => {
    const p = { metodo: 'serieStandard' as const, base: { FOR: 15, DES: 14, COS: 0, INT: 0, SAG: 0, CAR: 0 } };
    const o = opzioniPunteggio(p, 'COS');
    expect(o.map((x) => x.valore)).toEqual([15, 14, 13, 12, 10, 8]);
    expect(o[0].etichetta).toBe('15 (ora a Forza)');
    expect(o[2].etichetta).toBe('13');
  });
  it('scegliere un valore già usato scambia i due punteggi', () => {
    const p = punteggiIniziali('serieStandard', 'wizard');           // INT 15, SAG 14
    expect(assegna(p, 'SAG', 15).base).toMatchObject({ INT: 14, SAG: 15 });
  });
  it('nel point buy assegnare cambia solo quel punteggio', () => {
    expect(assegna(punteggiIniziali('pointBuy27'), 'DES', 14).base).toMatchObject({ DES: 14, FOR: 8 });
  });
  it('finché non sono assegnati tutti, il passo resta da fare (non in avviso)', () => {
    const b = { ...P.TRAVIS, punteggi: { metodo: 'serieStandard' as const, base: { FOR: 15, DES: 14, COS: 0, INT: 0, SAG: 0, CAR: 0 } } };
    expect(stato(b)).toBe('da-fare');
  });
  it('serie completa: fatto', () => {
    expect(stato({ ...P.TRAVIS, punteggi: punteggiIniziali('serieStandard', 'wizard') })).toBe('fatto');
  });
});

describe('Abilità sotto ogni caratteristica', () => {
  it('Intelligenza di Travis: Arcano +5 (competente), Storia +3, …', () => {
    const a = abilitaPer('INT', calcolaScheda(P.TRAVIS));
    expect(a.map((x) => x.id)).toEqual(['arcana', 'investigation', 'nature', 'religion', 'history']);   // in ordine alfabetico italiano
    expect(a.find((x) => x.id === 'arcana')).toMatchObject({ nome: 'Arcano', totale: 5, competente: true });
    expect(a.find((x) => x.id === 'history')).toMatchObject({ totale: 3, competente: false });
  });
  it('Costituzione non ha abilità', () => {
    expect(abilitaPer('COS', calcolaScheda(P.TRAVIS))).toEqual([]);
  });
});

describe('Abilità della classe scelte nelle Caratteristiche', () => {
  const st = (b: Bozza) => Object.fromEntries(statoAbilita(b).map((a) => [a.id, a.stato]));

  it('Travis: background e Abile già dati, Arcano e Indagare scelti, il resto della lista è pieno', () => {
    const s = st(P.TRAVIS);
    expect(s.insight).toBe('data');         // Accolito
    expect(s.religion).toBe('data');        // Accolito
    expect(s.medicine).toBe('data');        // Abile (umano)
    expect(s.arcana).toBe('scelta');
    expect(s.investigation).toBe('scelta');
    expect(s.history).toBe('piena');        // nella lista del mago, ma 2 su 2
    expect(s.athletics).toBe('no');         // non è nella lista del mago
    expect(contatoreAbilitaClasse(P.TRAVIS)).toEqual({ scelte: 2, quante: 2 });
  });
  it('la fonte di un\'abilità già data è scritta', () => {
    expect(statoAbilita(P.TRAVIS).find((a) => a.id === 'religion')?.fonte).toBe('Background: Accolito');
  });
  it('senza scelte: quelle della lista sono selezionabili, quelle del background no', () => {
    const b = { ...P.TRAVIS, scelte: { ...P.TRAVIS.scelte, 'wizard.abilita': [] } };
    const s = st(b);
    expect(s.history).toBe('sceglibile');
    expect(s.insight).toBe('data');
    expect(contatoreAbilitaClasse(b)).toEqual({ scelte: 0, quante: 2 });
  });
  it('toccare: aggiunge se c\'è posto, toglie se era scelta, ignora il resto', () => {
    const vuota = { ...P.TRAVIS, scelte: { ...P.TRAVIS.scelte, 'wizard.abilita': [] } };
    const una = scegliAbilitaClasse(vuota, 'history');
    expect(una.scelte['wizard.abilita']).toEqual(['history']);
    expect(scegliAbilitaClasse(P.TRAVIS, 'arcana').scelte['wizard.abilita']).toEqual(['investigation']);
    expect(scegliAbilitaClasse(P.TRAVIS, 'history')).toBe(P.TRAVIS);      // piena
    expect(scegliAbilitaClasse(P.TRAVIS, 'religion')).toBe(P.TRAVIS);     // già dal background
    expect(scegliAbilitaClasse(P.TRAVIS, 'athletics')).toBe(P.TRAVIS);    // non nella lista
  });
  it('mancano abilità della classe: il passo da fare è Caratteristiche', () => {
    const b = { ...P.TRAVIS, scelte: { ...P.TRAVIS.scelte, 'wizard.abilita': ['arcana'] } };
    expect(statoPassi(b).caratteristiche.stato).toBe('da-fare');
    expect(prossimoPasso(b)).toBe('caratteristiche');
  });
  it('il bardo sceglie 3 abilità fra tutte (p. 31)', () => {
    expect(contatoreAbilitaClasse(P.BARDO)).toEqual({ scelte: 3, quante: 3 });
  });
});

describe('Riquadri da completare (bordo evidenziato e aperti)', () => {
  it('Travis completo: nessun riquadro da completare', () => {
    expect(['FOR', 'DES', 'COS', 'INT', 'SAG', 'CAR'].filter((c) => daCompletare(P.TRAVIS, c as 'FOR'))).toEqual([]);
  });
  it('manca un\'abilità del mago: solo i riquadri con abilità della sua lista ancora sceglibili', () => {
    const b = { ...P.TRAVIS, scelte: { ...P.TRAVIS.scelte, 'wizard.abilita': ['arcana'] } };
    // lista del mago: Arcano, Storia, Intuizione, Indagare, Medicina, Natura, Religione (p. 77) → INT e SAG
    expect(['FOR', 'DES', 'COS', 'INT', 'SAG', 'CAR'].filter((c) => daCompletare(b, c as 'FOR'))).toEqual(['INT']);
  });
});


describe('Maestria del ladro nella griglia (p. 61)', () => {
  it('contatore: il ladro ne sceglie 2, il mago nessuna', () => {
    expect(contatoreMaestria(P.LADRO)).toEqual({ scelte: 2, quante: 2 });
    expect(contatoreMaestria(P.TRAVIS)).toEqual({ scelte: 0, quante: 0 });
  });
  it('si toglie e si mette solo su abilità in cui hai competenza', () => {
    const senza = scegliMaestria(P.LADRO, 'stealth');
    expect(senza.scelte['rogue.maestria']).toEqual(['sleight-of-hand']);
    expect(scegliMaestria(senza, 'perception').scelte['rogue.maestria']).toEqual(['sleight-of-hand', 'perception']);
    expect(scegliMaestria(senza, 'athletics')).toBe(senza);            // niente competenza in Atletica
    expect(scegliMaestria(P.LADRO, 'perception')).toBe(P.LADRO);      // già 2 su 2
  });
  it('togliendo un\'abilità della classe che aveva la Maestria, la Maestria se ne va', () => {
    const b = { ...P.LADRO, scelte: { ...P.LADRO.scelte, 'rogue.maestria': ['acrobatics', 'stealth'] } };
    expect(scegliAbilitaClasse(b, 'acrobatics').scelte['rogue.maestria']).toEqual(['stealth']);
  });
});