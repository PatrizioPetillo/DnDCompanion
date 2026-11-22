// Eventi dal master (22/11): validazione di quello che arriva, applicazione, tiro salvezza con metà danno (SRD p. 16)
import { describe, expect, it } from 'vitest';
import { applica, descrivi, eventoValido } from '../src/partita/eventi';
import { statoVuoto } from '../src/partita/partita';

describe('Eventi dal master', () => {
  it('scarta quello che non è un evento ben fatto', () => {
    expect(eventoValido({ tipo: 'danno', n: 8 })).toEqual({ tipo: 'danno', n: 8 });
    expect(eventoValido({ tipo: 'danno', n: -3 })).toBeNull();
    expect(eventoValido({ tipo: 'danno', n: 1e9 })).toBeNull();
    expect(eventoValido({ tipo: 'condizione', id: 'volante' })).toBeNull();
    expect(eventoValido({ tipo: 'ts', car: 'DES', cd: 15 })).toBeNull();          // né danno né condizione
    expect(eventoValido({ tipo: 'boh' })).toBeNull();
    expect(eventoValido({ tipo: 'cura', n: 4, nota: 'x'.repeat(200) })).toBeNull();
  });
  it('danno e cura si sommano: l\'ordine non conta', () => {
    const a = applica(applica(statoVuoto(), { tipo: 'danno', n: 8 }, 30).st, { tipo: 'cura', n: 5 }, 30).st;
    const b = applica(applica(statoVuoto(), { tipo: 'cura', n: 5 }, 30).st, { tipo: 'danno', n: 8 }, 30).st;
    expect(a.pfPersi).toBe(3);
    expect(b.pfPersi).toBe(8);   // la cura a PF pieni non fa nulla: per questo il master manda eventi, non valori
  });
  it('tiro salvezza: metà danno arrotondata per difetto se riesci, condizione solo se fallisci', () => {
    const e = { tipo: 'ts' as const, car: 'DES' as const, cd: 15, n: 27, meta: true, condizione: 'prono' as const, nota: 'Onda tonante' };
    expect(descrivi(e)).toBe('Tiro salvezza su Destrezza, CD 15 (Onda tonante): se fallisci 27 danni, se riesci 13; se fallisci sei prono');
    const ok = applica(statoVuoto(), e, 40, 'riuscito');
    expect(ok.st.pfPersi).toBe(13); expect(ok.st.condizioni ?? []).toEqual([]);
    const ko = applica(statoVuoto(), e, 40, 'fallito');
    expect(ko.st.pfPersi).toBe(27); expect(ko.st.condizioni).toEqual([{ id: 'prono' }]);
    expect(ko.testo).toBe('Tiro salvezza fallito (Onda tonante): −27 PF, prono');
  });
  it('una condizione che incapacita fa perdere la concentrazione', () => {
    const r = applica({ ...statoVuoto(), concentrazione: 'bless' }, { tipo: 'condizione', id: 'stordito' }, 20);
    expect(r.st.concentrazione).toBeNull();
    expect(applica(r.st, { tipo: 'condizione', id: 'stordito', togli: true }, 20).st.condizioni).toEqual([]);
  });
});

describe('Il telefono del giocatore riceve (22/11)', () => {
  it('applica solo i nuovi, mette in attesa i tiri salvezza, annulla l\'ultimo', async () => {
    const { nuovo, archivioVuoto } = await import('../src/archivio/archivio');
    const { riceviEventi, rispondiTs, annulla } = await import('../src/partita/canale');
    const P = await import('./personaggi');
    let { archivio: a, id } = nuovo(archivioVuoto(), P.TRAVIS);           // Travis: 7 PF
    const voci = [{ seq: 1, il: '', evento: { tipo: 'danno', n: 3 } }, { seq: 2, il: '', evento: { tipo: 'ts', car: 'DES', cd: 13, n: 6, meta: true } },
      { seq: 3, il: '', evento: { tipo: 'hack' } }];
    let r = riceviEventi(a, id, voci); a = r.archivio;
    expect(a.personaggi[0].partita.pfPersi).toBe(3);
    expect(a.personaggi[0].ultimoEvento).toBe(3);
    expect(a.personaggi[0].inAttesa).toHaveLength(1);
    expect(riceviEventi(a, id, voci).avvisi).toEqual([]);                  // già visti
    const t = rispondiTs(a, id, 2, 'riuscito'); a = t.archivio;
    expect(a.personaggi[0].partita.pfPersi).toBe(6);
    expect(a.personaggi[0].inAttesa).toEqual([]);
    const indietro = annulla(a, t.avviso!);
    expect(indietro!.personaggi[0].partita.pfPersi).toBe(3);
    r = riceviEventi(a, id, [{ seq: 4, il: '', evento: { tipo: 'cura', n: 2 } }]);
    expect(annulla(r.archivio, t.avviso!)).toBeNull();                     // la partita è cambiata dopo
  });
  it('il link della scheda porta il segreto del canale', async () => {
    const { creaLink, leggiLink } = await import('../src/esporta/link');
    const P = await import('./personaggi');
    const segreto = 'A'.repeat(43);
    const url = await creaLink(P.TRAVIS, 'https://x.app/', undefined, segreto);
    const r = await leggiLink(url.slice(url.indexOf('#')));
    expect(r && 'canale' in r && r.canale).toBe(segreto);
  });
});
