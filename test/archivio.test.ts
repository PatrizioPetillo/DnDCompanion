// «I miei personaggi»: lista, nuovo, duplica, elimina, migrazione dalla versione con un solo personaggio.
import { describe, expect, it } from 'vitest';
import { aggiorna, apri, archivioVuoto, attivo, duplica, elenco, elimina, iniziali, migra, nuovo } from '../src/archivio/archivio';
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
