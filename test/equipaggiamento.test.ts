// Equipaggiamento: inventario, monete, attacchi con le armi, focus (SRD 5.2 p. 22-23, 89-98).
import { describe, expect, it } from 'vitest';
import { calcolaScheda } from '../src/regole/motore';
import { DATI } from '../src/regole/dati';
import type { Personaggio } from '../src/regole/tipi';
import * as P from './personaggi';

const att = (pg: Personaggio, id: string) => {
  const a = calcolaScheda(pg).attacchi.find((x) => x.id === id);
  expect(a, `attacco ${id}`).toBeDefined();
  return a!;
};
const avvisi = (pg: Personaggio) => calcolaScheda(pg).avvisi.map((a) => a.id);

describe('Dati degli oggetti', () => {
  it('ogni oggetto dei pacchetti iniziali esiste, con il nome italiano', () => {
    const pacchetti = [...Object.values(DATI.classi), ...Object.values(DATI.background)].flatMap((x) => Object.values(x.equipaggiamento));
    for (const p of pacchetti) for (const { oggetto } of p.oggetti) {
      expect(DATI.oggetti[oggetto], oggetto).toBeDefined();
      for (const c of DATI.oggetti[oggetto].contenuto ?? []) expect(DATI.oggetti[c.oggetto], `${oggetto} → ${c.oggetto}`).toBeDefined();
    }
  });
  it('prezzi e nomi dell\'SRD (p. 91, 95-96)', () => {
    expect(DATI.oggetti.dagger).toMatchObject({ nome: 'Pugnale', costoMo: 2 });
    expect(DATI.oggetti['explorers-pack']).toMatchObject({ nome: 'Dotazione da esploratore', costoMo: 10 });
    expect(DATI.oggetti['dungeoneers-pack'].nome).toBe('Dotazione da avventuriero');
    expect(DATI.oggetti['component-pouch']).toMatchObject({ costoMo: 25, focus: 'componenti' });
    expect(DATI.oggetti['arcane-focus-quarterstaff']).toMatchObject({ focus: 'arcano', arma: 'quarterstaff' });
  });
  it('addestramento con le armi di ogni classe (p. 28-77)', () => {
    expect(DATI.classi.fighter.addestramentoArmi).toEqual(['semplici', 'marziali']);
    expect(DATI.classi.monk.addestramentoArmi).toEqual(['semplici', 'marzialiLeggere']);
    expect(DATI.classi.rogue.addestramentoArmi).toEqual(['semplici', 'marzialiAccurateOLeggere']);
    expect(DATI.classi.wizard.addestramentoArmi).toEqual(['semplici']);
  });
});

describe('Inventario e monete (p. 23)', () => {
  it('Travis: pacchetto A del mago + A dell\'Accolito, 5 + 8 = 13 mo', () => {
    const s = calcolaScheda(P.TRAVIS);
    expect(s.monete.totale).toBe(13);
    expect(s.monete.termini).toEqual([{ etichetta: 'Classe (A)', valore: 5 }, { etichetta: 'Background (A)', valore: 8 }]);
    const tunica = s.inventario.find((v) => v.oggetto === 'robe')!;
    expect(tunica).toMatchObject({ nome: 'Tunica', quantita: 2, fonti: ['Classe (A)', 'Background (A)'] });
    const studioso = s.inventario.find((v) => v.oggetto === 'scholars-pack')!;
    expect(studioso.contenuto).toContainEqual({ nome: 'Olio (ampolla)', quantita: 10 });
    expect(studioso.contenuto).toHaveLength(8);
  });
  it('Chierico con B: 110 + 8 − 75 (cotta) − 10 (scudo) = 33 mo', () => {
    const s = calcolaScheda(P.CHIERICO);
    expect(s.monete.totale).toBe(33);
    expect(s.monete.termini).toContainEqual({ etichetta: 'Acquisti', valore: -85 });
  });
  it('gli oggetti «a scelta» diventano quello scelto', () => {
    const monaco = calcolaScheda(P.MONACO);
    expect(monaco.inventario.find((v) => v.oggetto === 'flute')?.nome).toBe('Flauto');
    expect(monaco.inventario.find((v) => v.oggetto === 'dagger')?.quantita).toBe(7);     // 5 del monaco + 2 del Criminale
    expect(calcolaScheda(P.BARBARO).inventario.find((v) => v.oggetto === 'dice')?.nome).toBe('Dadi');
    expect(calcolaScheda(P.BARDO).inventario.find((v) => v.oggetto === 'lute')?.nome).toBe('Liuto');
  });
  it('lo strumento del bardo si sceglie al passo Equipaggiamento', () => {
    const senza = { ...P.BARDO, scelte: { ...P.BARDO.scelte, 'bard.equip.strumento': [] } };
    expect(avvisi(senza)).toContain('scelta-mancante:bard.equip.strumento');
    expect(avvisi(senza)).not.toContain('focus-mancante');
    const conB = { ...senza, equipaggiamento: { classe: 'B', background: 'A' as const } };
    expect(avvisi(conB)).not.toContain('scelta-mancante:bard.equip.strumento');
  });
  it('spendere più di quanto si ha è un errore', () => {
    const s = calcolaScheda({ ...P.TRAVIS, equipaggiamento: { classe: 'B', background: 'B', extra: [{ oggetto: 'plate-armor', quantita: 1 }] } });
    expect(s.monete.totale).toBe(55 + 50 - 1500);
    expect(s.avvisi.find((a) => a.id === 'monete-negative')?.livello).toBe('errore');
  });
  it('i centesimi non sballano: 20 frecce a 0,05 = 1 mo', () => {
    const s = calcolaScheda({ ...P.TRAVIS, equipaggiamento: { classe: 'B', background: 'B', extra: [{ oggetto: 'arrows', quantita: 20 }, { oggetto: 'dart', quantita: 3 }] } });
    expect(s.monete.totale).toBe(103.85);
  });
});

describe('Attacchi con le armi (p. 22-23, 89-91)', () => {
  it('Travis: pugnale accurato con DES, bastone del focus con FOR', () => {
    const p = att(P.TRAVIS, 'dagger');
    expect(p).toMatchObject({ nome: 'Pugnale', quantita: 2, caratteristica: 'DES', competente: true, padronanza: null, gittata: [20, 60] });
    expect(p.colpire.totale).toBe(3);
    expect(p.colpire.termini).toEqual([{ etichetta: 'Destrezza', valore: 1 }, { etichetta: 'Competenza', valore: 2 }]);
    expect(p.danni).toMatchObject({ dadi: '1d4', mod: 1, tipo: 'perforanti', testo: '1d4 + 1 perforanti' });
    const b = att(P.TRAVIS, 'quarterstaff');
    expect(b).toMatchObject({ nome: 'Bastone ferrato', caratteristica: 'FOR' });
    expect(b.colpire.totale).toBe(1);
    expect(b.danni).toMatchObject({ testo: '1d6 − 1 contundenti', testoDueMani: '1d8 − 1 contundenti' });
  });
  it('colpo senz\'armi: FOR + competenza, 1 + FOR contundenti (p. 190)', () => {
    const c = att(P.BARBARO, 'unarmed-strike');
    expect(c.colpire.totale).toBe(5);
    expect(c.danni.testo).toBe('4 contundenti');
  });
  it('Barbaro: ascia bipenne con la Padronanza scelta, asce da lancio, arco con DES', () => {
    const a = att(P.BARBARO, 'greataxe');
    expect(a.colpire.totale).toBe(5);
    expect(a.danni.testo).toBe('1d12 + 3 taglienti');
    expect(a.padronanza).toBe('Doppio fendente');
    expect(att(P.BARBARO, 'handaxe')).toMatchObject({ quantita: 4, padronanza: 'Vessazione', gittata: [20, 60] });
    expect(att(P.BARBARO, 'spear').padronanza).toBeNull();                 // non scelta
    const arco = att(P.BARBARO, 'shortbow');
    expect(arco.caratteristica).toBe('DES');
    expect(arco.colpire.totale).toBe(4);
    expect(arco.danni.testo).toBe('1d6 + 2 perforanti');
  });
  it('Monaco: Arti marziali → DES e d6 su armi da monaco e colpo senz\'armi (p. 50)', () => {
    const c = att(P.MONACO, 'unarmed-strike');
    expect(c.caratteristica).toBe('DES');
    expect(c.colpire.totale).toBe(5);
    expect(c.danni.testo).toBe('1d6 + 3 contundenti');
    expect(att(P.MONACO, 'dagger').danni.testo).toBe('1d6 + 3 perforanti');
    const lancia = att(P.MONACO, 'spear');
    expect(lancia.danni).toMatchObject({ testo: '1d6 + 3 perforanti', testoDueMani: '1d8 + 3 perforanti' });
  });
  it('Ladro: spada corta (da guerra, accurata e leggera) con competenza; spada lunga senza', () => {
    expect(att(P.LADRO, 'shortsword')).toMatchObject({ competente: true, caratteristica: 'DES' });
    expect(att(P.LADRO, 'dagger').padronanza).toBe('Graffio');
    const conSpada = { ...P.LADRO, equipaggiamento: { ...P.LADRO.equipaggiamento, extra: [{ oggetto: 'longsword', quantita: 1 }] } };
    const s = att(conSpada, 'longsword');
    expect(s.competente).toBe(false);
    expect(s.colpire.termini.map((t) => t.etichetta)).not.toContain('Competenza');
    expect(avvisi(conSpada)).toContain('arma-non-competente:longsword');
  });
  it('Guerriero con Tiro: +2 alle armi a distanza, svantaggio con l\'arco lungo (Pesante) se DES < 13', () => {
    const pg = { ...P.GUERRIERO, scelte: { ...P.GUERRIERO.scelte, 'fighter.stile': ['archery'] }, equipaggiamento: { classe: 'B', background: 'A' as const } };
    const arco = att(pg, 'longbow');
    expect(arco.colpire.termini).toContainEqual({ etichetta: 'Tiro', valore: 2 });
    expect(arco.colpire.totale).toBe(5);                                   // DES +1, competenza +2, Tiro +2
    expect(arco.note.join(' ')).toMatch(/Svantaggio/);
    expect(att(pg, 'scimitar').colpire.termini).not.toContainEqual({ etichetta: 'Tiro', valore: 2 });
    expect(att(pg, 'scimitar').caratteristica).toBe('FOR');                // accurata: la migliore
  });
});

describe('Focus da incantatore (p. 96-97, 105)', () => {
  it('stregone con B e Sapiente B: nessun focus → avviso', () => {
    const pg = { ...P.STREGONE, equipaggiamento: { classe: 'B', background: 'B' as const } };
    expect(avvisi(pg)).toContain('focus-mancante');
    expect(avvisi({ ...pg, equipaggiamento: { ...pg.equipaggiamento, extra: [{ oggetto: 'arcane-focus-orb', quantita: 1 }] } })).not.toContain('focus-mancante');
    expect(avvisi({ ...pg, equipaggiamento: { ...pg.equipaggiamento, extra: [{ oggetto: 'component-pouch', quantita: 1 }] } })).not.toContain('focus-mancante');
    expect(avvisi({ ...pg, equipaggiamento: { ...pg.equipaggiamento, extra: [{ oggetto: 'holy-symbol', quantita: 1 }] } })).toContain('focus-mancante');
  });
  it('il mago ha sempre il libro degli incantesimi, che vale come focus (p. 77)', () => {
    expect(avvisi({ ...P.TRAVIS, equipaggiamento: { classe: 'B', background: 'B' } })).not.toContain('focus-mancante');
  });
  it('il barbaro non lancia incantesimi: nessun avviso', () => {
    expect(avvisi({ ...P.BARBARO, equipaggiamento: { classe: 'B', background: 'B' } })).not.toContain('focus-mancante');
  });
});

describe('Acquisti speciali', () => {
  it('Travis compra incenso e perla: niente più avvisi, 13 − 10 − 100 = −97 → errore monete', () => {
    const pg = { ...P.TRAVIS, equipaggiamento: { ...P.TRAVIS.equipaggiamento, extra: [{ oggetto: 'materiale:find-familiar', quantita: 1 }, { oggetto: 'materiale:identify', quantita: 1 }] } };
    const s = calcolaScheda(pg);
    expect(s.avvisi.map((a) => a.id)).not.toContain('materiale:find-familiar');
    expect(s.monete.totale).toBe(-97);
    expect(s.inventario.find((v) => v.oggetto === 'materiale:identify')?.nome).toBe('Identificare: una perla del valore di 100 mo o più');
  });
  it('oggetto personalizzato: nome e prezzo scritti a mano', () => {
    const pg = { ...P.TRAVIS, equipaggiamento: { ...P.TRAVIS.equipaggiamento, extra: [{ oggetto: 'personalizzato:diploma-1', quantita: 1, nome: 'Diploma dell\'Accademia', costoMo: 0 }, { oggetto: 'personalizzato:corda-2', quantita: 1, nome: 'Corda di seta', costoMo: 10 }] } };
    const s = calcolaScheda(pg);
    expect(s.inventario.find((v) => v.oggetto === 'personalizzato:diploma-1')?.nome).toBe('Diploma dell\'Accademia');
    expect(s.monete.totale).toBe(3);
  });
  it('l\'avviso del materiale è in italiano', () => {
    expect(calcolaScheda(P.TRAVIS).avvisi.find((a) => a.id === 'materiale:find-familiar')!.messaggio)
      .toBe('Trova famiglio: incenso bruciato del valore di 10 mo o più, che l\'incantesimo consuma. Il focus non sostituisce questa componente: comprala con le monete (passo Equipaggiamento)');
  });
});
