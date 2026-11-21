// Riepilogo: la scheda completa in 5 schede, gli avvisi da accettare, l'esportazione JSON (sezione 5.2, 5.4).
import { describe, expect, it } from 'vitest';
import { accettaAvviso, avvisiRiepilogo, esportaJSON, importaJSON, nomeFile, pronta, recupero, riepilogo } from '../src/creazione/riepilogo';
import { bozzaVuota } from '../src/creazione/percorso';
import * as P from './personaggi';

describe('Scheda di Travis', () => {
  const r = riepilogo(P.TRAVIS)!;
  it('testata', () => {
    expect(r.testata).toEqual({ nome: 'Travis Whippletorn', descrizione: 'Mago 1 · Umano · Accolito · Neutrale buono' });
  });
  it('combattimento: i numeri con la somma, tiri salvezza, attacchi', () => {
    const n = Object.fromEntries(r.combattimento.numeri.map((x) => [x.id, x.valore]));
    expect(n).toEqual({ ca: '14', pf: '7', iniziativa: '+3', velocita: '9 metri', competenza: '+2', percezione: '12' });
    expect(r.combattimento.numeri.find((x) => x.id === 'ca')!.somma!.termini[0].etichetta).toBe('Base');   // Armatura magica 13 + DES
    expect(r.combattimento.tiriSalvezza.filter((t) => t.competente).map((t) => [t.car, t.valore])).toEqual([['INT', '+5'], ['SAG', '+4']]);
    expect(r.combattimento.attacchi.map((a) => a.id)).toEqual(['dagger', 'quarterstaff', 'unarmed-strike']);
    expect(r.combattimento.risorse).toEqual([{ nome: 'Recupero arcano', usi: 1, recupero: 'tornano con il riposo lungo', ...(r.combattimento.risorse[0].dettaglio ? { dettaglio: r.combattimento.risorse[0].dettaglio } : {}) }]);
  });
  it('trucchetti d\'attacco con i dadi: Dardo di fuoco sì, Mano magica no; Fiamma sacra di Iniziato con la CD', () => {
    expect(r.combattimento.trucchetti.map((t) => [t.nome, t.tiro, t.dadi])).toEqual([['Dardo di fuoco', '+5 per colpire', '1d10 fuoco']]);
    const chierico = riepilogo(P.CHIERICO)!.combattimento.trucchetti;
    expect(chierico.find((t) => t.nome === 'Fiamma sacra')).toMatchObject({ tiro: 'TS Destrezza CD 13', dadi: '1d8 radiosi' });
  });
  it('abilità raggruppate per caratteristica, nell\'ordine della scheda', () => {
    expect(r.abilita.map((a) => a.car)).toEqual(['FOR', 'DES', 'COS', 'INT', 'SAG', 'CAR']);
    const int = r.abilita.find((a) => a.car === 'INT')!;
    expect(int).toMatchObject({ punteggio: 17, mod: '+3' });
    expect(int.voci.find((v) => v.id === 'arcana')).toMatchObject({ nome: 'Arcano', valore: '+5', competente: true });
    expect(r.abilita.find((a) => a.car === 'COS')!.voci).toEqual([]);
  });
  it('magia: una fonte per blocco, con i nomi italiani; slot', () => {
    const [mago, iniziato] = r.magia.fonti;
    expect(mago).toMatchObject({ nome: 'Classe: Mago', cd: 13, attacco: '+5' });
    expect(mago.trucchetti).toEqual(['Dardo di fuoco', 'Mano magica', 'Riparare']);
    expect(mago.incantesimi).toHaveLength(4);
    expect(mago.note[0]).toMatch(/^Nel libro: /);
    expect(iniziato.incantesimi).toEqual(['Parola guaritrice (sempre preparato)']);
    expect(iniziato.lanciGratuiti).toBe('Parola guaritrice: 1 volta senza slot, per riposo lungo');
    expect(r.magia.slot).toEqual(['2 slot di 1° livello']);
  });
  it('zaino e chi è', () => {
    expect(r.zaino.monete.totale).toBe(13);
    const righe = Object.fromEntries(r.chiE.righe.map((x) => [x.etichetta, x.valore]));
    expect(righe['Lingue']).toBe('Comune, Sottocomune, Elfico');
    expect(righe['Armi']).toBe('semplici');
    expect(righe['Armature']).toBe('nessuna');
    expect(righe['Strumenti']).toBe('Scorte da calligrafo');
    expect(r.chiE.privilegi).toContain('Talento: Allerta');
    expect(r.chiE.privilegi).toContain('Talento: Iniziato alla magia (Chierico)');
  });
});

describe('Altri personaggi', () => {
  it('warlock: slot del patto; monaco: strumento; barbaro: Ira e resistenza', () => {
    expect(riepilogo(P.WARLOCK)!.magia.slot).toEqual(['1 slot del patto di 1° livello (tornano con il riposo breve)']);
    expect(riepilogo(P.MONACO)!.chiE.righe.find((x) => x.etichetta === 'Strumenti')?.valore).toBe('Arnesi da scasso, Flauto');   // Criminale + monaco
    const b = riepilogo(P.BARBARO)!;
    expect(b.combattimento.risorse.find((x) => x.nome === 'Ira')?.recupero).toBe('1 torna con il riposo breve, tutti con il lungo');
    expect(b.combattimento.altro).toContain('Danni dell\'Ira: +2');
    expect(b.chiE.righe.find((x) => x.etichetta === 'Armi')?.valore).toBe('semplici, da guerra');
  });
  it('senza classe, specie o background non c\'è scheda', () => {
    expect(riepilogo(bozzaVuota())).toBeNull();
  });
  it('testo del recupero', () => {
    expect(recupero([{ riposo: 'breve', quanti: 'tutti' }])).toBe('tornano con il riposo breve o lungo');
  });
});

describe('Avvisi', () => {
  it('Travis: incenso, perla e il Sottocomune già accettato; ognuno con il suo passo', () => {
    const a = avvisiRiepilogo(P.TRAVIS);
    expect(a.map((x) => [x.id, x.passo, !!x.accettato])).toEqual([
      ['scelta-non-valida:origine.lingue:undercommon', 'background', true],
      ['materiale:find-familiar', 'equipaggiamento', false],
      ['materiale:identify', 'equipaggiamento', false],
    ]);
    expect(a.every((x) => x.accettabile)).toBe(true);
    expect(pronta(P.TRAVIS)).toBe(false);
  });
  it('accettare gli avvisi rende la scheda pronta; si può tornare indietro', () => {
    let b = accettaAvviso(P.TRAVIS, 'materiale:find-familiar');
    b = accettaAvviso(b, 'materiale:identify');
    expect(pronta(b)).toBe(true);
    expect(pronta(accettaAvviso(b, 'materiale:identify', false))).toBe(false);
  });
  it('«manca una scelta» non si accetta', () => {
    const b = { ...P.BARDO, scelte: { ...P.BARDO.scelte, 'bard.equip.strumento': [] } };
    expect(avvisiRiepilogo(b).find((x) => x.id === 'scelta-mancante:bard.equip.strumento')?.accettabile).toBe(false);
  });
});

describe('Esportazione JSON', () => {
  it('andata e ritorno', () => {
    const r = importaJSON(esportaJSON(P.TRAVIS));
    expect('bozza' in r && r.bozza).toEqual(P.TRAVIS);
    expect(nomeFile(P.TRAVIS)).toBe('travis-whippletorn.json');
  });
  it('il ritratto viaggia nella copia JSON (ma non nel link)', () => {
    const r = importaJSON(esportaJSON(P.TRAVIS, 'data:image/jpeg;base64,xx'));
    expect('ritratto' in r && r.ritratto).toBe('data:image/jpeg;base64,xx');
    expect('ritratto' in importaJSON(JSON.stringify({ formato: 'companion-b20', versione: 1, personaggio: P.TRAVIS, ritratto: 'javascript:alert(1)' }))).toBe(false);
  });
  it('file sbagliati: messaggio chiaro', () => {
    expect(importaJSON('ciao')).toEqual({ errore: 'Il file non è un JSON valido.' });
    expect(importaJSON('{"a":1}')).toEqual({ errore: 'Questo file non è una scheda di Companion B20.' });
    const altro = JSON.stringify({ formato: 'companion-b20', versione: 1, personaggio: { ...P.TRAVIS, specie: 'warforged' } });
    expect('errore' in importaJSON(altro) && importaJSON(altro)).toMatchObject({ errore: expect.stringMatching(/warforged/) });
  });
});

describe('La storia del personaggio (19/11)', () => {
  it('compare in «Chi è» dopo il segreto, solo se scritta, e torna uguale dal JSON', () => {
    expect(riepilogo(P.TRAVIS)!.chiE.righe.some((r) => r.etichetta === 'La sua storia')).toBe(false);
    const storia = 'Nato a Vallecupa.\nLa madre è maga di corte.';
    const b = { ...P.TRAVIS, ruolo: { ...P.TRAVIS.ruolo, storia: `  ${storia}  ` } };
    expect(riepilogo(b)!.chiE.righe.at(-1)).toEqual({ etichetta: 'La sua storia', valore: storia });
    const letto = importaJSON(esportaJSON(b));
    expect('bozza' in letto && letto.bozza.ruolo?.storia).toBe(`  ${storia}  `);
  });
});
