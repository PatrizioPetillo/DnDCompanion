// Elenco degli incantesimi (20/11): gruppi per livello, filtri per classe, livello, scuola e nome.
import { describe, expect, it } from 'vitest';
import { compendio } from '../src/creazione/compendio';
import { DATI } from '../src/regole';

const tutti = (g: ReturnType<typeof compendio>) => g.flatMap((x) => x.incantesimi);

describe('Elenco degli incantesimi', () => {
  it('senza filtri: tutti i 339, dai trucchetti al 9° livello, in ordine', () => {
    const g = compendio({});
    expect(tutti(g)).toHaveLength(339);
    expect(g.map((x) => x.livello)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const nomi = g[1].incantesimi.map((id) => DATI.incantesimi[id].nome);
    expect(nomi).toEqual([...nomi].sort((a, b) => a.localeCompare(b, 'it')));
  });
  it('per classe: solo la lista di quella classe', () => {
    expect(tutti(compendio({ classe: 'wizard' })).every((id) => DATI.incantesimi[id].liste.includes('wizard'))).toBe(true);
    expect(tutti(compendio({ classe: 'wizard', livello: 1 }))).toContain('expeditious-retreat');
    expect(tutti(compendio({ classe: 'cleric' }))).not.toContain('expeditious-retreat');
  });
  it('per livello, scuola e nome (anche in inglese)', () => {
    expect(compendio({ livello: 0 }).map((x) => x.livello)).toEqual([0]);
    expect(tutti(compendio({ scuola: 'evocation' })).every((id) => DATI.incantesimi[id].scuola === 'evocation')).toBe(true);
    expect(tutti(compendio({ cerca: 'retreat' }))).toEqual(['expeditious-retreat']);
    expect(tutti(compendio({ cerca: 'ritirata' }))).toContain('expeditious-retreat');
  });
});
