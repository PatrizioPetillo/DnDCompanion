// «Il mio gruppo» (21/11): le schede mandate dai giocatori, per tavolo; lo stesso nome aggiorna la scheda.
import { describe, expect, it } from 'vitest';
import { aggiungiAlGruppo, archivioVuoto, nuovoTavolo, togliDalGruppo } from '../src/archivio/archivio';
import { riassuntoGruppo, rigaGruppo } from '../src/creazione/gruppo';
import * as P from './personaggi';

describe('Il mio gruppo', () => {
  it('aggiunge, aggiorna per nome e toglie', () => {
    const { archivio: a0, id } = nuovoTavolo(archivioVuoto());
    const a1 = aggiungiAlGruppo(a0, id, P.TRAVIS, undefined);
    expect(a1.aggiornato).toBe(false);
    const a2 = aggiungiAlGruppo(a1.archivio, id, P.CHIERICO, undefined);
    const a3 = aggiungiAlGruppo(a2.archivio, id, { ...P.TRAVIS, ruolo: { segreto: 'nuovo' } }, undefined);
    expect(a3.aggiornato).toBe(true);
    const g = a3.archivio.tavoli![0].gruppo!;
    expect(g).toHaveLength(2);
    expect(g[0].bozza.ruolo?.segreto).toBe('nuovo');
    expect(togliDalGruppo(a3.archivio, id, g[0].id).tavoli![0].gruppo).toHaveLength(1);
  });
  it('la riga di Travis: CA 11, PF 7, iniziativa +3, percezione 12, CD 13', () => {
    expect(rigaGruppo('x', P.TRAVIS)).toMatchObject({ nome: 'Travis Whippletorn', ca: 11, pf: 7, iniziativa: '+3', percezione: 12, cd: 13 });
  });
  it('il riassunto dice chi è l\'unico a parlare una lingua', () => {
    const r = riassuntoGruppo([rigaGruppo('a', P.TRAVIS)!, rigaGruppo('b', P.CHIERICO)!]);
    expect(r.lingue.find((l) => l.lingua === 'Comune')!.chi).toHaveLength(2);
    expect(r.lingue.some((l) => l.chi.length === 1)).toBe(true);
    expect(r.migliorPercezione).not.toBeNull();
  });
});
