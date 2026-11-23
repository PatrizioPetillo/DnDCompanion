// Incontri (21/11): i numeri dell'SRD p. 202 (esempi compresi), p. 253 e la regola dell'iniziativa di p. 13
import { describe, expect, it } from 'vitest';
import { budgetGruppo, cambiaTiro, difficolta, peNemici, prossimoTurno, scriviTotale, sposta, tiraIniziativa, totale, turnoPrecedente } from '../src/creazione/incontri';

const n = (gs: string, quanti: number, nome = 'x') => ({ id: nome, nome, gs, quanti, iniziativa: 0 });

describe('Difficoltà (SRD p. 202)', () => {
  it('esempio 1: quattro personaggi di livello 1, budget basso 200', () => {
    const b = budgetGruppo([1, 1, 1, 1]);
    expect(b).toEqual({ basso: 200, moderato: 300, alto: 400 });
    expect(peNemici([n('1', 1)])).toBe(200);                       // Guerriero bugbear
    expect(difficolta(200, b)).toBe('basso');
    expect(peNemici([n('1/8', 6)])).toBe(150);                      // 6 ratti giganti
  });
  it('esempio 2: cinque personaggi di livello 3, budget moderato 1.125', () => {
    const b = budgetGruppo([3, 3, 3, 3, 3]);
    expect(b.moderato).toBe(1125);
    expect(peNemici([n('2', 2, 'druido'), n('1/8', 9, 'stirge')])).toBe(1125);
    expect(difficolta(1125, b)).toBe('moderato');
    expect(peNemici([n('3', 1, 'wight'), n('1/2', 1, 'cavallo'), n('1/4', 6, 'scheletri')])).toBe(1100);
  });
  it('oltre l\'alta, e gruppo vuoto', () => {
    expect(difficolta(401, budgetGruppo([1, 1, 1, 1]))).toBe('oltre');
    expect(difficolta(100, budgetGruppo([]))).toBe('vuoto');
    expect(peNemici([n('0*', 2)])).toBe(20);
  });
});

describe('Iniziativa (SRD p. 13)', () => {
  const dadi = (v: number[]) => { let i = 0; return () => v[i++]; };
  const ora = new Date('2026-11-23T20:00:00Z');
  it('il master tira solo per i nemici (identici una volta); i personaggi aspettano il loro tiro', () => {
    let c = tiraIniziativa([{ id: 'a', nome: 'Travis', bonus: 2 }, { id: 'b', nome: 'Bruna', bonus: 0 }],
      [{ id: 'g', nome: 'Goblin', gs: '1/4', quanti: 3, iniziativa: 2, pf: 7 }], dadi([12]), ora);
    expect(c.iniziato).toBe(ora.toISOString());
    expect(c.ordine.map((x) => [x.nome, !!x.attesa])).toEqual([['Goblin', false], ['Travis', true], ['Bruna', true]]);
    expect(c.ordine[0].pf).toEqual([7, 7, 7]);
    // i giocatori dicono il totale (o arriva dal telefono): l'ordine si rifà, il turno va al primo (nessuno ha agito)
    c = scriviTotale(c, 'pg:b', 15, true);
    c = scriviTotale(c, 'pg:a', 12);
    expect(c.ordine.map((x) => x.nome)).toEqual(['Bruna', 'Goblin', 'Travis']);   // 15, 14, 12
    expect(c.turno).toBe(0);
    expect(c.ordine[0].dalGiocatore).toBe(true);
    expect(totale(c.ordine[2])).toBe(12);
    // cancellato: torna ad aspettare, in fondo
    c = scriviTotale(c, 'pg:b', null);
    expect(c.ordine.map((x) => x.nome)).toEqual(['Goblin', 'Travis', 'Bruna']);
  });
  it('turni e round, spostamenti; un tiro arrivato a combattimento iniziato non sposta il turno', () => {
    let c = tiraIniziativa([{ id: 'a', nome: 'A', bonus: 0 }, { id: 'b', nome: 'B', bonus: 0 }], [], dadi([]), ora);
    c = scriviTotale(c, 'pg:a', 10); c = scriviTotale(c, 'pg:b', 5);
    c = prossimoTurno(c); expect([c.turno, c.round]).toEqual([1, 1]);
    c = prossimoTurno(c); expect([c.turno, c.round]).toEqual([0, 2]);
    c = turnoPrecedente(c); expect([c.turno, c.round]).toEqual([1, 1]);
    // tocca a B (round 1, A ha già agito): B dice un totale più alto, sale in cima ma il turno resta suo
    c = scriviTotale(c, 'pg:b', 20); expect(c.ordine.map((x) => x.nome)).toEqual(['B', 'A']); expect(c.ordine[c.turno].nome).toBe('B');
    c = sposta(c, 0, 1); expect(c.ordine[1].nome).toBe('B'); expect(c.ordine[c.turno].nome).toBe('B');
    // un vecchio combattimento salvato (con il d20 dei personaggi) continua a funzionare
    c = cambiaTiro(c, 'pg:a', 3); expect(c.ordine.length).toBe(2);
  });
});

describe('Bottino e monete durante il gioco (21/11)', () => {
  it('divide in parti uguali in rame, e le monete entrano nella somma', async () => {
    const { dividi } = await import('../src/esporta/link');
    expect(dividi(150, 4)).toEqual({ aTesta: 37.5, resto: 0 });
    expect(dividi(10, 3)).toEqual({ aTesta: 3.33, resto: 0.01 });
    const { calcolaScheda } = await import('../src/regole');
    const P = await import('./personaggi');
    const base = calcolaScheda(P.TRAVIS).monete.totale;
    const s = calcolaScheda({ ...P.TRAVIS, movimenti: [{ id: 'a', mo: 37.5, il: '' }, { id: 'b', mo: -0.5, il: '' }] });
    expect(s.monete.totale).toBe(base + 37);
    expect(s.monete.termini.at(-1)).toEqual({ etichetta: 'Durante il gioco', valore: 37 });
  });
  it('lo stesso bottino non entra due volte', async () => {
    const { aggiungiMovimento, nuovo, archivioVuoto } = await import('../src/archivio/archivio');
    const P = await import('./personaggi');
    let { archivio: a, id } = nuovo(archivioVuoto(), P.TRAVIS);
    a = aggiungiMovimento(a, id, { id: 'x', mo: 10, il: '' }).archivio;
    expect(aggiungiMovimento(a, id, { id: 'x', mo: 10, il: '' }).giaPresente).toBe(true);
  });
});
