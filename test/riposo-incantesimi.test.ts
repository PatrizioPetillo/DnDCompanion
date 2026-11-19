// Cambio degli incantesimi dopo il riposo lungo (SRD p. 104) e borsa per componenti (p. 105-106).
import { describe, expect, it } from 'vitest';
import { comePersonaggio } from '../src/creazione/percorso';
import { componenti, cambiaComponente, dopoIlLancio, mancaComponente } from '../src/partita/componenti';
import { statoVuoto } from '../src/partita/partita';
import { cambia, cambiDopoRiposoLungo, sostituti } from '../src/partita/riposo-incantesimi';
import { calcolaScheda } from '../src/regole';
import * as P from './personaggi';

describe('Cambiare gli incantesimi dopo il riposo lungo', () => {
  it('mago: tutti i preparati dal libro e un trucchetto', () => {
    const { possibili } = cambiDopoRiposoLungo(P.TRAVIS);
    const prep = possibili.find((c) => c.tipo === 'preparati' && c.magia === 'wizard')!;
    expect(prep.quanti).toBe('tutti');
    expect(prep.regola).toContain('libro');
    expect(possibili.find((c) => c.tipo === 'trucchetti' && c.magia === 'wizard')?.quanti).toBe(1);
  });
  it('mago: si prepara solo dal libro', () => {
    const prep = cambiDopoRiposoLungo(P.TRAVIS).possibili.find((c) => c.tipo === 'preparati')!;
    const libro = P.TRAVIS.incantesimi.libro!;
    expect(sostituti(P.TRAVIS, prep).every((o) => libro.includes(o.id))).toBe(true);
  });
  it('Iniziato alla magia: solo salendo di livello', () => {
    expect(cambiDopoRiposoLungo(P.TRAVIS).no.some((x) => x.includes('Iniziato'))).toBe(true);
  });
  it('bardo e warlock: nessun cambio al riposo, con il motivo', () => {
    for (const pg of [P.BARDO, P.WARLOCK]) {
      const r = cambiDopoRiposoLungo(pg);
      expect(r.possibili.filter((c) => c.tipo === 'preparati')).toEqual([]);
      expect(r.no.length).toBeGreaterThan(0);
    }
  });
  it('paladino: uno solo', () => {
    const c = cambiDopoRiposoLungo(P.PALADINO).possibili.find((x) => x.tipo === 'preparati')!;
    expect(c.quanti).toBe(1);
    const prima = c.attuali;
    const [n1, n2] = sostituti(P.PALADINO, c).map((o) => o.id);
    const dopo1 = cambia(P.PALADINO, c, prima[0], n1, prima);
    expect(dopo1).not.toBe(P.PALADINO);
    const c2 = cambiDopoRiposoLungo(dopo1).possibili.find((x) => x.tipo === 'preparati')!;
    const dopo2 = cambia(dopo1, c2, prima[1], n2, prima);
    expect(dopo2).toBe(dopo1);     // il secondo cambio non passa
  });
  it('mago: cambiare un preparato con uno del libro', () => {
    const c = cambiDopoRiposoLungo(P.TRAVIS).possibili.find((x) => x.tipo === 'preparati')!;
    const nuovo = sostituti(P.TRAVIS, c)[0].id;
    const dopo = cambia(P.TRAVIS, c, c.attuali[0], nuovo, c.attuali);
    expect(dopo.incantesimi.preparati.wizard).toContain(nuovo);
    expect(dopo.incantesimi.preparati.wizard).not.toContain(c.attuali[0]);
  });
});

describe('Borsa per componenti', () => {
  const s = calcolaScheda(comePersonaggio(P.TRAVIS)!);
  it('le componenti senza costo sono sempre nella borsa; Trova famiglio e Identificare hanno un costo', () => {
    const c = componenti(s, statoVuoto());
    expect(c.senzaCosto.every((x) => x.disponibili === null)).toBe(true);
    const famiglio = c.conCosto.find((x) => x.incantesimo === 'find-familiar')!;
    expect(famiglio.consumata).toBe(true);
    expect(famiglio.disponibili).toBe(0);       // Travis non l'ha comprata: avviso già nella creazione
    expect(mancaComponente(s, statoVuoto(), 'find-familiar')).toBe(true);
  });
  it('si aggiunge e si consuma lanciando', () => {
    const c = componenti(s, statoVuoto()).conCosto.find((x) => x.incantesimo === 'find-familiar')!;
    const con = cambiaComponente(statoVuoto(), c, 1);
    expect(mancaComponente(s, con, 'find-familiar')).toBe(false);
    const dopo = dopoIlLancio(s, con, 'find-familiar');
    expect(mancaComponente(s, dopo, 'find-familiar')).toBe(true);
    expect(cambiaComponente(dopo, componenti(s, dopo).conCosto.find((x) => x.incantesimo === 'find-familiar')!, -1)).toBe(dopo);   // mai sotto zero
  });
  it('una componente non consumata non cala', () => {
    const c = componenti(s, statoVuoto()).conCosto.find((x) => x.incantesimo === 'identify')!;
    const con = cambiaComponente(statoVuoto(), c, 1);
    expect(dopoIlLancio(s, con, 'identify')).toBe(con);
  });
});
