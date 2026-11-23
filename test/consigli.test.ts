// Consigli per chi inizia (idea 2): dati coerenti con l'SRD dell'app
import { describe, expect, it } from 'vitest';
import { abilitaConsigliate, backgroundConsigliati, INCANTESIMI_CONSIGLIATI, principali, RIGA_TALENTO } from '../src/creazione/consigli';
import { DATI } from '../src/regole';

describe('consigli', () => {
  it('ogni incantesimo consigliato esiste, è nella lista della classe ed è un trucchetto o di 1°', () => {
    for (const [classe, voci] of Object.entries(INCANTESIMI_CONSIGLIATI)) for (const v of voci) {
      const i = DATI.incantesimi[v.id];
      expect(i, `${classe}: ${v.id}`).toBeTruthy();
      expect(i.liste, `${classe}: ${v.id}`).toContain(classe);
      expect(i.livello, v.id).toBeLessThanOrEqual(1);
    }
  });
  it('ogni classe con incantesimi al livello 1 ha i suoi consigli', () => {
    for (const c of ['wizard', 'sorcerer', 'warlock', 'cleric', 'druid', 'bard', 'paladin', 'ranger']) expect(INCANTESIMI_CONSIGLIATI[c]?.length).toBeGreaterThan(2);
  });
  it('caratteristiche principali dalla serie dell\'SRD (p. 21)', () => {
    expect(principali('wizard')).toEqual(['INT', 'SAG']);
    expect(principali('fighter')).toEqual(['FOR', 'DES']);
  });
  it('background: prima quelli che danno la caratteristica principale', () => {
    expect(backgroundConsigliati('wizard')).toEqual(expect.arrayContaining(['acolyte', 'sage']));
    expect(backgroundConsigliati('wizard')).not.toContain('soldier');
    for (const c of Object.keys(DATI.classi)) expect(backgroundConsigliati(c).length, c).toBeGreaterThan(0);
  });
  it('abilità consigliate tutte nella lista della classe', () => {
    for (const c of Object.keys(DATI.classi)) for (const a of abilitaConsigliate(c)) expect(DATI.classi[c].abilita.opzioni).toContain(a);
  });
  it('una riga per ogni talento d\'origine e stile di combattimento dell\'SRD', () => {
    for (const t of Object.values(DATI.talenti).filter((x) => x.categoria === 'origine' || x.categoria === 'stileCombattimento')) expect(RIGA_TALENTO[t.id], t.id).toBeTruthy();
  });
});

describe('articoli', () => {
  it('lo/uno stregone, il/un mago', async () => {
    const { ilClasse, unClasse } = await import('../src/creazione/consigli');
    expect(ilClasse('Stregone')).toBe('Lo stregone');
    expect(unClasse('Stregone')).toBe('uno stregone');
    expect(ilClasse('Mago')).toBe('Il mago');
    expect(unClasse('Warlock')).toBe('un warlock');
  });
});
