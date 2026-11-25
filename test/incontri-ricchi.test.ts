// Incontri più ricchi (25/11): sessioni, ordine, fatti in fondo
import { describe, expect, it } from 'vitest';
import { perSessione, sessioni, spostaIncontro } from '../src/creazione/incontri';
import { ordinaIncontri, type Archivio } from '../src/archivio/archivio';

const I = [
  { id: 'a', sessione: 'Sessione 1' },
  { id: 'b' },
  { id: 'c', sessione: 'Sessione 1', fattoIl: '2026-11-25' },
  { id: 'd', sessione: 'Sessione 2' },
  { id: 'e', sessione: 'Sessione 1 ' },
];

describe('incontri per sessione', () => {
  it('gruppi nell\'ordine della sessione, senza sessione in fondo, fatti dopo i da fare', () => {
    const g = perSessione(I);
    expect(g.map((x) => x.sessione)).toEqual(['Sessione 1', 'Sessione 2', null]);
    expect(g[0].daFare.map((x) => x.id)).toEqual(['a', 'e']);
    expect(g[0].fatti.map((x) => x.id)).toEqual(['c']);
    expect(sessioni(I)).toEqual(['Sessione 1', 'Sessione 2']);
  });
  it('sposta solo tra gli incontri della stessa sessione (e dello stesso stato)', () => {
    expect(spostaIncontro(I, 'e', -1)).toEqual(['e', 'b', 'c', 'd', 'a']);
    expect(spostaIncontro(I, 'a', -1)).toEqual(['a', 'b', 'c', 'd', 'e']);   // già il primo
    expect(spostaIncontro(I, 'c', 1)).toEqual(['a', 'b', 'c', 'd', 'e']);    // l'unico fatto
  });
  it('l\'archivio salva il nuovo ordine', () => {
    const a = { personaggi: [], tavoli: [{ id: 't', tavolo: {}, aggiornato: '', incontri: I.map((x) => ({ ...x, nome: x.id, nemici: [] })) }] } as unknown as Archivio;
    expect(ordinaIncontri(a, 't', ['d', 'a']).tavoli![0].incontri!.map((x) => x.id)).toEqual(['d', 'a', 'b', 'c', 'e']);
  });
});
