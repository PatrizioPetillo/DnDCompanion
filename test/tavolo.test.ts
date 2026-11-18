// Regole del tavolo (sezione 5.1): metodo dei punteggi, elementi ammessi, eccezioni del master, link.
import { describe, expect, it } from 'vitest';
import { statoPassi } from '../src/creazione/percorso';
import { creaLinkTavolo, leggiLinkTavolo } from '../src/esporta/link';
import { calcolaScheda, DATI } from '../src/regole';
import { ammesso, tavoloVuoto, validaTavolo } from '../src/regole/tavolo';
import type { Personaggio, Tavolo } from '../src/regole/tipi';
import * as P from './personaggi';

const TRAVIS = P.TRAVIS as Personaggio;
const ids = (pg: Personaggio) => calcolaScheda(pg).avvisi.map((a) => a.id);
const accettato = (pg: Personaggio, id: string) => calcolaScheda(pg).avvisi.find((a) => a.id === id)?.accettato ?? false;
const conTavolo = (pg: Personaggio, t: Partial<Tavolo>): Personaggio => ({ ...pg, tavolo: { ...tavoloVuoto(), nome: 'Prova', ...t } });

describe('Regole del tavolo', () => {
  it('senza tavolo non cambia niente', () => {
    expect(ids(TRAVIS).some((id) => id.startsWith('tavolo-'))).toBe(false);
  });
  it('un tavolo che ammette tutto non aggiunge avvisi', () => {
    expect(ids(conTavolo(TRAVIS, {})).some((id) => id.startsWith('tavolo-'))).toBe(false);
  });
  it('classe esclusa: errore nel passo Classe, il personaggio non viene cambiato', () => {
    const pg = conTavolo(TRAVIS, { fonti: { srd: true, escludi: ['wizard'] } });
    expect(ids(pg)).toContain('tavolo-escluso:classi:wizard');
    expect(statoPassi(pg).classe.stato).toBe('avviso');
    expect(pg.classe).toBe('wizard');
  });
  it('metodo dei punteggi non ammesso: avviso nel passo Caratteristiche', () => {
    const pg = conTavolo(TRAVIS, { metodiPunteggi: ['serieStandard'] });
    expect(ids(pg)).toContain('tavolo-metodo');
    expect(statoPassi(pg).caratteristiche.avvisi.map((a) => a.id)).toContain('tavolo-metodo');
  });
  it('eccezione «lingue rare»: il Sottocomune di Travis risulta già accettato', () => {
    const senza = { ...TRAVIS, avvisiAccettati: [] };
    const id = ids(senza).find((x) => x.endsWith(':undercommon'))!;
    expect(id).toBeTruthy();
    expect(accettato(senza, id)).toBe(false);
    expect(accettato(conTavolo(senza, { eccezioni: ['lingue-rare'] }), id)).toBe(true);
  });
  it('eccezione «allineamenti malvagi»', () => {
    const malvagio = { ...TRAVIS, allineamento: 'neutral-evil' } as Personaggio;
    expect(accettato(malvagio, 'allineamento-malvagio')).toBe(false);
    expect(accettato(conTavolo(malvagio, { eccezioni: ['allineamenti-malvagi'] }), 'allineamento-malvagio')).toBe(true);
  });
  it('un elemento personalizzato è ammesso solo se è tra quelli del master', () => {
    const t = { ...tavoloVuoto(), elementi: { background: { 'pers-guardia': { personalizzato: true } as never } } };
    expect(ammesso(t, 'pers-guardia')).toBe(true);
    expect(ammesso(t, 'pers-altro')).toBe(false);
    expect(ammesso(t, 'sage')).toBe(true);
  });
});

describe('Link del tavolo', () => {
  const t: Tavolo = { ...tavoloVuoto(), nome: 'La Torre di B20', metodiPunteggi: ['pointBuy27'], fonti: { srd: true, escludi: ['warlock'] },
    eccezioni: ['lingue-rare'], note: 'Sessione 0 venerdì' };
  it('va e torna uguale', async () => {
    const link = await creaLinkTavolo(t, 'https://esempio.app/');
    expect(link.startsWith('https://esempio.app/#tavolo=')).toBe(true);
    const r = await leggiLinkTavolo(link.slice(link.indexOf('#')));
    expect(r).toEqual({ tavolo: t });
  });
  it('un link rovinato dà un messaggio, non un errore', async () => {
    expect(await leggiLinkTavolo('#tavolo=xyz')).toHaveProperty('errore');
    expect(await leggiLinkTavolo('#scheda=abc')).toBeNull();
  });
  it('scarta metodi ed eccezioni sconosciuti e gli elementi non personalizzati', () => {
    const v = validaTavolo({ ...t, metodiPunteggi: ['pointBuy27', 'magia'], eccezioni: ['tutto'],
      elementi: { background: { sage: { personalizzato: true }, 'pers-x': { personalizzato: true }, 'pers-y': { personalizzato: false } } } }, DATI)!;
    expect(v.metodiPunteggi).toEqual(['pointBuy27']);
    expect(v.eccezioni).toEqual([]);
    expect(Object.keys(v.elementi!.background)).toEqual(['pers-x']);
  });
  it('senza nessun metodo valido il tavolo non vale', () => {
    expect(validaTavolo({ ...t, metodiPunteggi: [] }, DATI)).toBeNull();
  });
});

describe('Tiri dei dadi (p. 21)', () => {
  it('si parte con sei punteggi vuoti, che contano come da fare', async () => {
    const { punteggiIniziali } = await import('../src/creazione/caratteristiche');
    const b = { ...TRAVIS, punteggi: punteggiIniziali('tiri') };
    expect(statoPassi(b).caratteristiche.stato).toBe('da-fare');
    expect(statoPassi(b).caratteristiche.mancanti).toBe(6);
  });
  it('da 3 a 18 va bene, fuori è un errore', () => {
    const tiri = (v: number) => ({ ...TRAVIS, punteggi: { metodo: 'tiri' as const, base: { FOR: v, DES: 12, COS: 13, INT: 17, SAG: 15, CAR: 10 } } });
    expect(ids(tiri(3))).not.toContain('tiri');
    expect(ids(tiri(18))).not.toContain('tiri');
    expect(ids(tiri(19))).toContain('tiri');
  });
  it('il metodo di partenza segue il tavolo', async () => {
    const { metodiAmmessi, metodoIniziale } = await import('../src/creazione/caratteristiche');
    expect(metodiAmmessi()).toEqual(['pointBuy27', 'serieStandard', 'tiri']);
    expect(metodoIniziale()).toBe('pointBuy27');
    const t = { ...tavoloVuoto(), metodiPunteggi: ['tiri', 'serieStandard'] as Tavolo['metodiPunteggi'] };
    expect(metodiAmmessi(t)).toEqual(['serieStandard', 'tiri']);
    expect(metodoIniziale(t)).toBe('serieStandard');
  });
});

describe('I miei tavoli e «Usa un mio personaggio»', () => {
  it('crea, modifica, elimina un tavolo', async () => {
    const { archivioVuoto, nuovoTavolo, aggiornaTavolo, eliminaTavolo, tavoli } = await import('../src/archivio/archivio');
    const { archivio, id } = nuovoTavolo(archivioVuoto());
    const a = aggiornaTavolo(archivio, id, { ...tavoloVuoto(), nome: 'Torre' });
    expect(tavoli(a)[0].tavolo.nome).toBe('Torre');
    expect(tavoli(eliminaTavolo(a, id))).toEqual([]);
  });
  it('portare un personaggio al tavolo non cambia le sue scelte; toglierlo lo libera', async () => {
    const { archivioVuoto, nuovo, portaAlTavolo } = await import('../src/archivio/archivio');
    const { archivio, id } = nuovo(archivioVuoto(), TRAVIS);
    const t = { ...tavoloVuoto(), nome: 'Torre', fonti: { srd: true as const, escludi: ['wizard'] } };
    const al = portaAlTavolo(archivio, id, t);
    const b = al.personaggi[0].bozza;
    expect(b.tavolo?.nome).toBe('Torre');
    expect(b.classe).toBe('wizard');
    expect(b.scelte).toEqual(TRAVIS.scelte);
    expect('tavolo' in portaAlTavolo(al, id, undefined).personaggi[0].bozza).toBe(false);
  });
  it('il riassunto per chi apre il link', async () => {
    const { descriviTavolo } = await import('../src/regole/tavolo');
    const t = { ...tavoloVuoto(), metodiPunteggi: ['pointBuy27'] as Tavolo['metodiPunteggi'], fonti: { srd: true as const, escludi: ['warlock', 'orc'] }, eccezioni: ['lingue-rare'] as Tavolo['eccezioni'] };
    expect(descriviTavolo(t, DATI)).toEqual(['Punteggi: Point buy', 'Classi non ammesse: Warlock', 'Specie non ammesse: Orco', 'Eccezioni concesse: lingue rare a scelta']);
  });
});
