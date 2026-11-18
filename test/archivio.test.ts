// «I miei personaggi»: lista, nuovo, duplica, elimina, migrazione dalla versione con un solo personaggio.
import { describe, expect, it } from 'vitest';
import { aggiorna, apri, archivioVuoto, attivo, duplica, eCopiaCompleta, elenco, elimina, esportaTutto, importaTutto, iniziali, migra, nuovo, statoCopia } from '../src/archivio/archivio';
import { accettaAvviso } from '../src/creazione/riepilogo';
import { bozzaVuota } from '../src/creazione/percorso';
import { danno, statoVuoto } from '../src/partita/partita';
import * as P from './personaggi';

const t = (min: number) => new Date(2026, 10, 18, 14, min);

describe('Migrazione', () => {
  it('la bozza che c\'era diventa il primo personaggio, con il suo stato di partita', () => {
    const a = migra(P.TRAVIS, danno(statoVuoto(), 3, 7), t(0));
    expect(a.personaggi).toHaveLength(1);
    expect(attivo(a)!.bozza).toEqual(P.TRAVIS);
    expect(attivo(a)!.partita.pfPersi).toBe(3);
  });
  it('una bozza vuota non crea niente', () => {
    expect(migra(bozzaVuota(), null)).toEqual(archivioVuoto());
    expect(migra(null, null)).toEqual(archivioVuoto());
  });
});

describe('Lista', () => {
  it('nuovo, apri, aggiorna; il più recente in cima', () => {
    let { archivio: a, id: travis } = nuovo(archivioVuoto(), P.TRAVIS, t(0));
    const r = nuovo(a, P.BARBARO, t(1));
    a = r.archivio;
    expect(a.attivo).toBe(r.id);
    expect(elenco(a).map((v) => v.nome)).toEqual(['Barbaro di prova', 'Travis Whippletorn']);
    a = aggiorna(apri(a, travis), travis, { bozza: { ...P.TRAVIS, nome: 'Travis W.' } }, t(2));
    expect(elenco(a)[0].nome).toBe('Travis W.');
    expect(attivo(a)!.id).toBe(travis);
  });
  it('la riga: nome e livello, specie e classe, origine (il background); pronto o in creazione', () => {
    const { archivio: a } = nuovo(archivioVuoto(), accettaAvviso(accettaAvviso(P.TRAVIS, 'materiale:find-familiar'), 'materiale:identify'), t(0));
    expect(elenco(a)[0]).toMatchObject({ nome: 'Travis Whippletorn', livello: 1, specie: 'Umano', classe: 'Mago', origine: 'Accolito', iniziali: 'TW', pronto: true });
    const druido = elenco(nuovo(archivioVuoto(), P.DRUIDO).archivio)[0];
    expect(druido.specie).toBe('Elfo dei boschi');                    // il lignaggio, se c'è
    const vuoto = elenco(nuovo(archivioVuoto()).archivio)[0];
    expect(vuoto).toMatchObject({ nome: 'Senza nome', classe: 'Classe da scegliere', pronto: false, iniziali: 'SN' });
  });
  it('duplica: stessa scheda con «(copia)», partita nuova; elimina', () => {
    let a = nuovo(archivioVuoto(), P.TRAVIS, t(0)).archivio;
    const travis = a.attivo!;
    a = aggiorna(a, travis, { partita: danno(statoVuoto(), 5, 7), ritratto: 'data:image/jpeg;base64,xx' }, t(1));
    const d = duplica(a, travis, t(2));
    const copia = d.archivio.personaggi.find((p) => p.id === d.id)!;
    expect(copia.bozza.nome).toBe('Travis Whippletorn (copia)');
    expect(copia.partita.pfPersi).toBe(0);
    expect(copia.ritratto).toBe('data:image/jpeg;base64,xx');
    const e = elimina(d.archivio, d.id);
    expect(e.personaggi.map((p) => p.id)).toEqual([travis]);
    expect(e.attivo).toBeNull();
  });
  it('iniziali', () => {
    expect(iniziali('Travis Whippletorn')).toBe('TW');
    expect(iniziali('Gimli')).toBe('GI');
    expect(iniziali('  ')).toBe('?');
    expect(iniziali('Éowyn di Rohan')).toBe('ÉR');
  });
});

describe('I miei elementi', () => {
  const bg = { id: 'pers-prova', nome: 'Prova', nomeEn: 'Prova', personalizzato: true, caratteristiche: ['DES', 'INT', 'SAG'] as ['DES', 'INT', 'SAG'],
    abilita: ['perception', 'survival'] as [string, string], strumento: 'dice', talento: { talento: 'alert' },
    equipaggiamento: { A: { oggetti: [], mo: 10 }, B: { oggetti: [], mo: 50 } } };
  it('salva, non elimina se usato, elimina se libero; nell\'import vince il mio', async () => {
    const { salvaBackground, eliminaBackground, unisciElementi, elementi } = await import('../src/archivio/archivio');
    let a = salvaBackground(nuovo(archivioVuoto(), { ...P.TRAVIS, background: 'pers-prova' }).archivio, bg);
    expect(eliminaBackground(a, 'pers-prova').usatoDa).toEqual(['Travis Whippletorn']);
    a = unisciElementi(a, { background: { 'pers-prova': { ...bg, nome: 'Altro' }, 'pers-nuovo': { ...bg, id: 'pers-nuovo' } } });
    expect(elementi(a).background['pers-prova'].nome).toBe('Prova');
    expect(Object.keys(elementi(a).background).sort()).toEqual(['pers-nuovo', 'pers-prova']);
    expect(Object.keys(elementi(eliminaBackground(a, 'pers-nuovo').archivio).background)).toEqual(['pers-prova']);
  });
});

describe('Copia di sicurezza di tutti i personaggi', () => {
  const ora = new Date('2026-11-18T20:00:00Z');
  const conDue = () => {
    const a = nuovo(archivioVuoto(), P.TRAVIS, ora).archivio;
    return nuovo(a, P.LADRO, ora).archivio;
  };
  it('esporta tutti e segna la data della copia', () => {
    const { testo, archivio } = esportaTutto(conDue(), ora);
    expect(eCopiaCompleta(testo)).toBe(true);
    expect(archivio.ultimaCopia).toBe(ora.toISOString());
    expect(JSON.parse(testo).personaggi).toHaveLength(2);
  });
  it('su un telefono vuoto rimette tutti, con lo stato di partita', () => {
    const a = conDue();
    const pieno = { ...a, personaggi: a.personaggi.map((p) => ({ ...p, partita: { ...p.partita, pfPersi: 3 } })) };
    const r = importaTutto(archivioVuoto(), esportaTutto(pieno, ora).testo);
    if ('errore' in r) throw new Error(r.errore);
    expect(r.aggiunti).toBe(2);
    expect(r.archivio.personaggi.map((p) => p.bozza.nome).sort()).toEqual(a.personaggi.map((p) => p.bozza.nome).sort());
    expect(r.archivio.personaggi[0].partita.pfPersi).toBe(3);
  });
  it('rimportata sullo stesso telefono non duplica', () => {
    const a = conDue();
    const r = importaTutto(a, esportaTutto(a, ora).testo);
    if ('errore' in r) throw new Error(r.errore);
    expect(r.aggiunti).toBe(0);
    expect(r.gia).toBe(2);
    expect(r.archivio.personaggi).toHaveLength(2);
  });
  it('una scheda singola non è una copia completa', () => {
    expect(eCopiaCompleta('{"formato":"companion-b20"}')).toBe(false);
    expect('errore' in importaTutto(archivioVuoto(), '{"formato":"companion-b20"}')).toBe(true);
  });
  it('dice quando rifare la copia', () => {
    expect(statoCopia(conDue(), ora)).toEqual({ testo: 'mai', daRifare: true });
    const copiato = esportaTutto(conDue(), ora).archivio;
    expect(statoCopia(copiato, ora)).toEqual({ testo: 'oggi', daRifare: false });
    expect(statoCopia(copiato, new Date('2026-11-26T20:00:00Z')).daRifare).toBe(true);
    expect(statoCopia(archivioVuoto(), ora).daRifare).toBe(false);
  });
});
