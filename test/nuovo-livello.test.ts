// Salire di livello in una schermata (23/11): per tutti i 12 personaggi di prova, riempiendo ogni tendina,
// la scheda al 2° livello non ha più scelte mancanti
import { describe, expect, it } from 'vitest';
import { bozzaNuova, completo, nuovoLivello, type Scelte } from '../src/creazione/nuovo-livello';
import { comePersonaggio, type Bozza } from '../src/creazione/percorso';
import { calcolaScheda } from '../src/regole';
import { tavoloVuoto } from '../src/regole/tavolo';
import * as P from './personaggi';

const salvato = (pg: object): Bozza => ({ ...(pg as Bozza), conclusoIl: '2026-11-23T10:00:00.000Z' });
const tutti = Object.entries(P).filter(([, v]) => typeof v === 'object' && v && 'classe' in (v as object)) as [string, Bozza][];
const mancanti = (b: Bozza) => calcolaScheda(comePersonaggio(b)!).avvisi.filter((a) => !a.accettato && /^(scelta-mancante|preparati-mancanti|libro-incompleto|trucchetti-mancanti)/.test(a.id)).map((a) => a.id);

// riempie le tendine una alla volta (una scelta può farne comparire altre: Guerriero benedetto)
function riempi(b: Bozza, preferite: Record<string, string[]> = {}): Scelte {
  let s: Scelte = {};
  for (let giro = 0; giro < 5; giro++) {
    const r = nuovoLivello(b, s)!;
    for (const t of [...r.capacita.flatMap((c) => c.tendine), ...r.magia]) {
      if ((s[t.chiave] ?? []).length === t.quante) continue;
      const pref = (preferite[t.chiave] ?? []).filter((id) => t.opzioni.some((o) => o.id === id && !o.disattivata));
      const altre = t.opzioni.filter((o) => !o.disattivata && !pref.includes(o.id)).map((o) => o.id);
      s = { ...s, [t.chiave]: [...pref, ...altre].slice(0, t.quante) };
    }
  }
  return s;
}

describe('Sali di livello in una schermata', () => {
  it.each(tutti)('%s: dal 1° al 2° senza scelte mancanti', (_, pg) => {
    const b = salvato(pg);
    const s = riempi(b);
    expect(completo(b, s, null, false)).toBe(true);
    const nuova = bozzaNuova(b, s, null);
    expect(nuova.livello).toBe(2);
    expect(nuova.conclusoIl).toBe(b.conclusoIl);          // resta salvato: niente creazione da riaprire
    expect(mancanti(nuova)).toEqual([]);
  });
  it('le tendine giuste: Stile del paladino e poi i 2 trucchetti; Maestria del bardo solo dove hai competenza', () => {
    const pal = salvato(P.PALADINO);
    const r1 = nuovoLivello(pal, {})!;
    expect(r1.capacita.find((c) => c.id === 'paladin-fighting-style')!.tendine.map((t) => t.chiave)).toEqual(['scelta:paladin.stile']);
    const r2 = nuovoLivello(pal, { 'scelta:paladin.stile': ['blessed-warrior'] })!;
    expect(r2.magia.map((t) => t.chiave)).toContain('trucchetti:paladin.guerriero-benedetto');
    const bardo = nuovoLivello(salvato(P.BARDO), {})!;
    const m = bardo.capacita.find((c) => c.id === 'bard-expertise')!.tendine[0];
    expect(m.opzioni.find((o) => o.id === 'persuasion')?.disattivata).toBe(false);
    expect(m.opzioni.find((o) => o.id === 'arcana')?.motivo).toBe('serve la competenza');
    expect(bardo.magia.map((t) => [t.chiave, t.quante])).toEqual([['preparati:bard', 1]]);
  });
  it('mago: 2 incantesimi nel libro, poi 1 preparato scelto anche tra quelli nuovi', () => {
    const b = salvato(P.TRAVIS);
    const r = nuovoLivello(b, { libro: ['magic-missile', 'sleep'] })!;
    expect(r.magia.map((t) => [t.chiave, t.quante])).toEqual([['libro', 2], ['preparati:wizard', 1]]);
    expect(r.magia[1].opzioni.map((o) => o.id)).toContain('magic-missile');
  });
  it('PF: con la regola «tiro» serve il dado; il tiro finisce nella scheda', () => {
    const b = { ...salvato(P.GUERRIERO), tavolo: { ...tavoloVuoto(), livello: 1, pf: 'tiro' } } as Bozza;
    expect(completo(b, {}, null, false)).toBe(false);
    expect(completo(b, {}, 4, true)).toBe(true);
    expect(calcolaScheda(comePersonaggio(bozzaNuova(salvato(P.GUERRIERO), {}, 4))!).pf.totale).toBe(12 + 4 + 2);
  });
});

describe('Sali di livello: dal 2° al 3°', () => {
  it('tutti i personaggi di prova al 2° salgono al 3° senza scelte mancanti', async () => {
    const L = await import('./livelli-prova');
    for (const [nome, pg] of Object.entries(L).filter(([k]) => k.startsWith('L2_'))) {
      const b = salvato(pg as object);
      const s = riempi(b);
      expect(completo(b, s, null, false), nome).toBe(true);
      const nuova = bozzaNuova(b, s, null);
      expect(nuova.livello, nome).toBe(3);
      expect(mancanti(nuova), nome).toEqual([]);
    }
  });
  it('bardo: 3 competenze bonus tra quelle che non ha; druido: tendina della terra', async () => {
    const L = await import('./livelli-prova');
    const r = nuovoLivello(salvato(L.L2_BARDO), {})!;
    const t = r.capacita.flatMap((c) => c.tendine).find((x) => x.chiave === 'scelta:bard.competenze-bonus')!;
    expect(t.quante).toBe(3);
    expect(t.opzioni.find((o) => o.id === 'persuasion')?.motivo).toBe('hai già la competenza');
    const dr = nuovoLivello(salvato(L.L2_DRUIDO), {})!;
    expect(dr.capacita.flatMap((c) => c.tendine).find((x) => x.chiave === 'scelta:druid.terra')?.opzioni.map((o) => o.nome)).toEqual(['Arida', 'Polare', 'Temperata', 'Tropicale']);
  });
});

describe('Cresce da solo', () => {
  it('ladro al 3°: Attacco furtivo; mago al 3°: slot; warlock: patto', async () => {
    const L = await import('./livelli-prova');
    expect(nuovoLivello(salvato(L.L2_LADRO), {})!.cresce).toContain('Attacco furtivo: 1d6 → 2d6');
    expect(nuovoLivello(salvato(L.L2_TRAVIS), {})!.cresce).toEqual(expect.arrayContaining(['Slot di 1° livello: 3 → 4', 'Slot di 2° livello: 0 → 2']));
    expect(nuovoLivello(salvato(L.L2_WARLOCK), {})!.cresce).toContain('Slot del patto: 2 di 1° → 2 di 2°');
    expect(nuovoLivello(salvato(L.L2_BARBARO), {})!.cresce).toContain('Ira: 2 → 3');
  });
});
