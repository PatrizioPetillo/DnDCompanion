// Testi italiani degli incantesimi (23/11): rifatti leggendo il PDF a due colonne nell'ordine giusto.
// Questi controlli bloccano i difetti trovati nella vecchia estrazione.
import { describe, expect, it } from 'vitest';
import testi from '../src/regole/dati/incantesimi-testi.json';
import dati from '../src/regole/dati/incantesimi.json';

type Tabella = { titolo?: string; colonne: string[]; righe: string[][] };
type Testo = { testo: string; superiori?: string; potenziato?: string; tabelle?: Tabella[] };
const T = testi as Record<string, Testo>;
const D = dati as unknown as { id: string; nome: string; livello: number; tiro?: { tipo: string; car?: string }; danni?: string[]; it?: Record<string, string> }[];

describe('testi italiani degli incantesimi', () => {
  it('ci sono tutti i 339, ognuno con il suo testo', () => {
    expect(Object.keys(T)).toHaveLength(339);
    for (const d of D) expect(T[d.id]?.testo.length, d.id).toBeGreaterThan(20);
  });
  it('niente segni dell\'estrazione, parole spezzate o paragrafi che cominciano a metà frase', () => {
    for (const [id, t] of Object.entries(T)) for (const s of [t.testo, t.superiori ?? '', t.potenziato ?? '']) {
      expect(s, id).not.toMatch(/[¶‖]|\w- \w| {2}/);
      expect(s, id).not.toMatch(/\n\n[a-zà-ù]/);
      expect(s, id).not.toContain('Utilizzo di uno slot');      // sta nel campo «superiori»
    }
    for (const d of D) for (const v of Object.values(d.it ?? {})) expect(v, d.id).not.toMatch(/\w- \w| {2}|\s$/);
  });
  it('il paragrafo «livello superiore» è separato anche dove prima finiva nel testo', () => {
    expect(T['hunters-mark'].superiori).toMatch(/3º o 4º livello/);
    expect(T['bane'].superiori).toBeTruthy();
    expect(T['cure-wounds'].superiori).toMatch(/2d8/);
  });
  it('le schede delle creature evocate non finiscono nel testo', () => {
    for (const id of ['animate-objects', 'find-steed', 'giant-insect', 'summon-dragon'])
      expect(T[id].superiori ?? '', id).not.toMatch(/MOD SALV|\bCA \d/);
  });
  it('ogni tabella ha il suo posto nel testo, e viceversa', () => {
    const con = Object.entries(T).filter(([, t]) => t.tabelle).map(([id]) => id).sort();
    expect(con).toEqual(['augury', 'confusion', 'control-weather', 'creation', 'divine-word', 'prismatic-spray', 'prismatic-wall', 'reincarnate', 'scrying', 'teleport']);
    for (const [id, t] of Object.entries(T)) {
      expect(t.testo.includes('[[tabelle]]'), id).toBe(!!t.tabelle);
      for (const tab of t.tabelle ?? []) for (const r of tab.righe) expect(r, id).toHaveLength(tab.colonne.length);
    }
    expect(T['teleport'].tabelle![0].righe).toHaveLength(6);
    expect(T['prismatic-spray'].tabelle![0].righe).toHaveLength(8);
    expect(T['reincarnate'].tabelle![0].righe.map((r) => r[1])).toContain('Tiefling');
  });
  it('tiro e danni ricavati dal testo giusto (prima il testo mescolato li sbagliava)', () => {
    const per = (id: string) => D.find((d) => d.id === id)!;
    expect(per('zone-of-truth').tiro).toEqual({ tipo: 'ts', car: 'CAR' });        // SRD 5.2: tiro salvezza su Carisma
    expect(per('conjure-animals').tiro).toEqual({ tipo: 'ts', car: 'DES' });      // Destrezza, danni taglienti
    expect(per('conjure-animals').danni).toEqual(['taglienti']);
    expect(per('conjure-woodland-beings').danni).toEqual(['forza']);              // 5d8 danni da forza, TS Saggezza
    expect(per('animal-messenger').tiro).toEqual({ tipo: 'ts', car: 'CAR' });
  });
});
