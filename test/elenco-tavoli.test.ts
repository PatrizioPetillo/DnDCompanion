// Elenco dei tavoli (23/11): sotto il nome i personaggi; senza, la prima frase delle note
import { describe, expect, it } from 'vitest';
import { sottotitoloTavolo } from '../src/ui/Tavoli';
import type { Tavolo } from '../src/regole/tipi';

const t = (note?: string) => ({ schema: 1, nome: 'Hillmarch', regole: 'srd-5.2', livello: 1, metodiPunteggi: ['pointBuy'], fonti: { srd: true }, ...(note ? { note } : {}) }) as unknown as Tavolo;
describe('Sottotitolo nell\'elenco dei tavoli', () => {
  it('i nomi dei personaggi', () => {
    expect(sottotitoloTavolo({ tavolo: t('Una torre. Altro.'), gruppo: [{ bozza: { nome: 'Elimbar' } }, { bozza: { nome: ' ' } }] as never })).toBe('Elimbar, Senza nome');
  });
  it('senza personaggi: la prima frase delle note, o un invito', () => {
    expect(sottotitoloTavolo({ tavolo: t('La torre crolla! Poi il resto.') })).toBe('La torre crolla!');
    expect(sottotitoloTavolo({ tavolo: t('Prima riga\nseconda') })).toBe('Prima riga');
    expect(sottotitoloTavolo({ tavolo: t() })).toBe('Ancora nessun personaggio');
  });
});
