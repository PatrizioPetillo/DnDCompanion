// Specie personalizzate (sezione 4): il modulo guidato diventa una Specie che il motore calcola come quelle dell'SRD.
// Gli esempi sono inventati: l'app non contiene i dati dei manuali fuori dall'SRD.
import { afterEach, describe, expect, it } from 'vitest';
import { archivioVuoto, eliminaSpecie, nuovo, salvaSpecie } from '../src/archivio/archivio';
import { cambiaSpecie, statoPassi } from '../src/creazione/percorso';
import { registra } from '../src/creazione/personalizzati';
import { esportaJSON, importaJSON } from '../src/creazione/riepilogo';
import { controllaSpecie, creaSpecie, moduloDaSpecie, moduloSpecieVuoto, piediDaMetri, type ModuloSpecie } from '../src/creazione/specie-personalizzate';
import { calcolaScheda, DATI } from '../src/regole';
import type { Personaggio, Specie } from '../src/regole/tipi';
import * as P from './personaggi';

const usa = (sp: Specie) => registra({ background: {}, specie: { [sp.id]: sp } });
afterEach(() => registra({ background: {}, specie: {} }));
const conSpecie = (pg: Personaggio, sp: Specie): Personaggio => ({ ...pg, specie: sp.id, scelte: { ...pg.scelte } });

const BASE: ModuloSpecie = { ...moduloSpecieVuoto(), nome: 'Popolo della nebbia', fonte: 'Il mio manuale', pagina: '12', velocitaMetri: '10,5' };

describe('Modulo della specie', () => {
  it('i campi obbligatori: nome, taglia, velocità a passi di 1,5 m', () => {
    expect(controllaSpecie(moduloSpecieVuoto()).map((e) => e.campo)).toEqual(['nome']);
    expect(controllaSpecie({ ...BASE, taglie: [] }).map((e) => e.campo)).toContain('taglia');
    expect(controllaSpecie({ ...BASE, velocitaMetri: '10' }).map((e) => e.campo)).toContain('velocita');
    expect(piediDaMetri('9')).toBe(30);
    expect(piediDaMetri('10,5')).toBe(35);
  });
  it('base calcolata: velocità, scurovisione, resistenze, PF in più, rimando al manuale', () => {
    const sp = creaSpecie({ ...BASE, scurovisione: 18, resistenze: ['freddo', 'necrotico'], pfExtra: true });
    expect(sp.id).toBe('pers-specie-popolo-della-nebbia');
    expect(sp.rimando).toBe('Il mio manuale, p. 12');
    usa(sp);
    const s = calcolaScheda(conSpecie(P.LADRO, sp));
    const l = calcolaScheda(P.LADRO);
    expect(s.velocita).toBe(35);
    expect(s.resistenze).toEqual(['freddo', 'necrotico']);
    expect(s.pf.totale).toBe(l.pf.totale + 1);
  });
  it('abilità fisse e a scelta (la scelta manca → passo Specie da fare)', () => {
    const sp = creaSpecie({ ...BASE, abilitaFisse: ['perception'], sceltaAbilita: { quantita: 1, opzioni: ['survival', 'nature'] } });
    usa(sp);
    const pg = conSpecie(P.LADRO, sp);
    expect(calcolaScheda(pg).abilita.perception.competente).toBe(true);
    expect(statoPassi(pg).specie.stato).toBe('da-fare');
    const fatto = { ...pg, scelte: { ...pg.scelte, [`${sp.id}.abilita`]: ['nature'] } };
    expect(calcolaScheda(fatto).abilita.nature.competente).toBe(true);
    expect(statoPassi(fatto).specie.stato).not.toBe('da-fare');
  });
  it('talento d\'origine a scelta, come Versatile', () => {
    const sp = creaSpecie({ ...BASE, talento: { tipo: 'scelta' } });
    usa(sp);
    const pg = { ...conSpecie(P.LADRO, sp), scelte: { ...P.LADRO.scelte, [`${sp.id}.talento`]: ['savage-attacker'] } };
    expect(calcolaScheda(pg).talenti).toContain('savage-attacker');
  });
  it('magia: caratteristica a scelta, trucchetto fisso, trucchetti a scelta, incantesimo di 1° gratis una volta', () => {
    const sp = creaSpecie({ ...BASE, magia: { caratteristica: 'scelta', trucchettiFissi: ['light'], trucchettiScelti: { quantita: 1, lista: 'wizard' }, incantesimo1: 'sleep' } });
    usa(sp);
    const pg = { ...conSpecie(P.LADRO, sp), scelte: { ...P.LADRO.scelte, [`${sp.id}.caratteristica`]: ['CAR'], [`${sp.id}.trucchetti`]: ['mage-hand'] } };
    const m = calcolaScheda(pg).magia.find((x) => x.id === sp.id)!;
    expect(m.caratteristica).toBe('CAR');
    expect(m.trucchetti.scelti.sort()).toEqual(['light', 'mage-hand']);
    expect(m.semprePreparati).toContain('sleep');
    // Senza i trucchetti scelti il passo Magia resta da fare
    const senza = { ...pg, scelte: { ...pg.scelte, [`${sp.id}.trucchetti`]: [] } };
    expect(statoPassi(senza).magia.stato).toBe('da-fare');
  });
  it('incantesimi dal 3° e dal 5° livello del personaggio, come elfo e tiefling (23/11)', async () => {
    const sp = creaSpecie({ ...BASE, magia: { caratteristica: 'INT', trucchettiFissi: ['light'], trucchettiScelti: null, incantesimo1: '', incantesimo3: 'sleep', incantesimo5: 'misty-step' } });
    usa(sp);
    const { L5_LADRO, L2_LADRO } = await import('./livelli-prova');
    const al5 = calcolaScheda({ ...L5_LADRO, specie: sp.id });
    expect(al5.magia.find((x) => x.id === `${sp.id}-3`)?.semprePreparati).toEqual(['sleep']);
    expect(al5.magia.find((x) => x.id === `${sp.id}-5`)?.lanciGratuiti).toMatchObject({ incantesimi: ['misty-step'], usi: 1 });
    expect(calcolaScheda({ ...L2_LADRO, specie: sp.id }).magia.some((x) => x.id === `${sp.id}-3`)).toBe(false);
    expect(controllaSpecie({ ...BASE, magia: { caratteristica: 'INT', trucchettiFissi: ['light'], trucchettiScelti: null, incantesimo1: '', incantesimo5: 'sleep' } }).map((e) => e.messaggio))
      .toContain('L\'incantesimo del 5° livello deve essere di 2° livello');
  });
  it('tratto con usi: diventa una risorsa con i pallini', () => {
    const sp = creaSpecie({ ...BASE, tratti: [{ nome: 'Passo nella nebbia', testo: 'Ti teletrasporti di 9 m', usi: 'competenza', riposo: 'lungo' }] });
    usa(sp);
    const r = calcolaScheda(conSpecie(P.LADRO, sp)).risorse.find((x) => x.nome === 'Passo nella nebbia')!;
    expect(r.usi).toBe(2);   // competenza +2
  });
  it('si riapre nel modulo così com\'era', () => {
    const m = { ...BASE, resistenze: ['fuoco'], tratti: [{ nome: 'X', testo: 'y', usi: 'uno' as const, riposo: 'breve' as const }] };
    const sp = creaSpecie(m);
    expect(moduloDaSpecie(sp)).toEqual({ ...m, id: sp.id });
  });
});

describe('Specie personalizzate nei dati', () => {
  it('cambiare specie toglie le scelte della specie personalizzata', () => {
    const sp = creaSpecie({ ...BASE, sceltaAbilita: { quantita: 1, opzioni: [] } });
    usa(sp);
    const b = { ...conSpecie(P.LADRO, sp), scelte: { ...P.LADRO.scelte, [`${sp.id}.abilita`]: ['nature'] } };
    const r = cambiaSpecie(b, 'human');
    expect(r.bozza.scelte[`${sp.id}.abilita`]).toBeUndefined();
  });
  it('viaggia con la scheda nel JSON e torna', () => {
    const sp = creaSpecie(BASE);
    usa(sp);
    const pg = conSpecie(P.LADRO, sp);
    const testo = esportaJSON(pg, undefined, { background: {}, specie: { [sp.id]: sp } });
    registra({ background: {}, specie: {} });
    const r = importaJSON(testo);
    if ('errore' in r) throw new Error(r.errore);
    expect(r.elementi?.specie?.[sp.id]?.nome).toBe('Popolo della nebbia');
  });
  it('una specie che nessuno usa si elimina; usata no', () => {
    const sp = creaSpecie(BASE);
    const a = salvaSpecie(archivioVuoto(), sp);
    expect(eliminaSpecie(a, sp.id).usatoDa).toEqual([]);
    const conPg = nuovo(a, conSpecie(P.LADRO, sp)).archivio;
    expect(eliminaSpecie(conPg, sp.id).usatoDa.length).toBe(1);
  });
  it('non sovrascrive mai una specie dell\'SRD', () => {
    registra({ background: {}, specie: {} });
    expect(DATI.specie.elf.personalizzato).toBeUndefined();
    expect(Object.keys(DATI.specie)).toHaveLength(9);
  });
});

describe('Magia della specie nella schermata', () => {
  it('trucchetto dato + 1 a scelta: il contatore chiede solo quello da scegliere', async () => {
    const { blocchiMagia } = await import('../src/creazione/magia');
    const sp = creaSpecie({ ...BASE, magia: { caratteristica: 'INT', trucchettiFissi: ['light'], trucchettiScelti: { quantita: 1, lista: 'wizard' }, incantesimo1: '' } });
    usa(sp);
    const blocco = blocchiMagia(conSpecie(P.LADRO, sp)).find((x) => x.id === sp.id)!;
    expect(blocco.contatori.find((c) => c.tipo === 'trucchetti')).toMatchObject({ scelti: 0, attesi: 1 });
  });
});
