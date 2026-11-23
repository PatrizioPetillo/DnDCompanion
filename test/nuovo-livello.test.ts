// Salire di livello in una schermata (23/11): per tutti i 12 personaggi di prova, riempiendo ogni tendina,
// la scheda al 2° livello non ha più scelte mancanti
import { describe, expect, it } from 'vitest';
import { bozzaNuova, completo, nuovoLivello, type Scelte } from '../src/creazione/nuovo-livello';
import { comePersonaggio, type Bozza } from '../src/creazione/percorso';
import { calcolaScheda, DATI } from '../src/regole';
const DATI_LIVELLO = (id: string) => DATI.incantesimi[id]?.livello;
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

describe('Sali di livello: dal 3° al 4° (talento)', () => {
  it('tutti i personaggi di prova al 3° salgono al 4° senza scelte mancanti', async () => {
    const L = await import('./livelli-prova');
    for (const [nome, pg] of Object.entries(L).filter(([k]) => k.startsWith('L3_'))) {
      const b = salvato(pg as object);
      const s = riempi(b);
      expect(completo(b, s, null, false), nome).toBe(true);
      const nuova = bozzaNuova(b, s, null);
      expect(nuova.livello, nome).toBe(4);
      expect(mancanti(nuova), nome).toEqual([]);
      expect(calcolaScheda(comePersonaggio(nuova)!).avvisi.filter((a) => a.livello === 'errore' && !a.accettato).map((a) => a.id), nome).toEqual([]);
    }
  });
  it('la tendina del talento: Aumento per primo, gli stili solo a chi ha Stile di combattimento, Lottatore con FOR o DES 13, «un altro talento» in fondo', async () => {
    const L = await import('./livelli-prova');
    const talento = (pg: object) => nuovoLivello(salvato(pg), {})!.capacita.flatMap((c) => c.tendine).find((t) => t.chiave === 'scelta:talento-4')!;
    const mago = talento(L.L3_TRAVIS);
    expect(mago.opzioni[0].id).toBe('ability-score-improvement');
    expect(mago.opzioni.at(-1)!.id).toBe('talento-libero');
    expect(mago.opzioni.find((o) => o.id === 'archery')?.motivo).toBe('serve Stile di combattimento');
    expect(talento(L.L3_GUERRIERO).opzioni.find((o) => o.id === 'archery')?.disattivata).toBe(false);
    expect(talento(L.L3_GUERRIERO).opzioni.find((o) => o.id === 'grappler')?.disattivata).toBe(false);
    // il talento d'origine del background, non ripetibile, è spento
    expect(talento(L.L3_LADRO).opzioni.find((o) => o.id === 'alert')?.motivo).toBe('ce l\'hai già');
  });
  it('Aumento: le caratteristiche a 20 sono spente; «un altro talento» chiede il nome e lascia un avviso', async () => {
    const L = await import('./livelli-prova');
    const b = salvato(L.L3_TRAVIS);
    const r = nuovoLivello(b, { 'scelta:talento-4': ['ability-score-improvement'] })!;
    const a = r.capacita.flatMap((c) => c.tendine).find((t) => t.tipo === 'aumento')!;
    expect(a.chiave).toBe('scelta:ability-score-improvement.aumento');
    expect(a.punteggi?.INT).toBe(17);
    const forte = { ...b, punteggi: { ...b.punteggi, base: { ...b.punteggi.base, COS: 20 } } } as Bozza;
    const r20 = nuovoLivello(forte, { 'scelta:talento-4': ['ability-score-improvement'] })!;
    expect(r20.capacita.flatMap((c) => c.tendine).find((t) => t.tipo === 'aumento')!.opzioni.find((o) => o.id === 'COS')?.motivo).toBe('è già a 20');
    const s = riempi(b, { 'scelta:talento-4': ['talento-libero'] });
    expect(s['scelta:talento-4.nome']).toEqual([]);           // il nome non si riempie da solo
    expect(completo(b, s, null, false)).toBe(false);
    const s2 = { ...s, 'scelta:talento-4.nome': ['Robusto'] };
    expect(completo(b, s2, null, false)).toBe(true);
    const sch = calcolaScheda(comePersonaggio(bozzaNuova(b, s2, null))!);
    expect(sch.avvisi.find((x) => x.id === 'talento-personalizzato:talento-4')?.messaggio).toMatch(/^Robusto/);
  });
  it('Padronanza in più: le armi già padroneggiate sono spente', async () => {
    const L = await import('./livelli-prova');
    const t = nuovoLivello(salvato(L.L3_BARBARO), {})!.capacita.flatMap((c) => c.tendine).find((x) => x.chiave === 'scelta:barbarian.padronanza-4')!;
    expect(t.opzioni.find((o) => o.id === 'greataxe')?.motivo).toBe('la padroneggi già');
    expect(t.opzioni.find((o) => o.id === 'javelin')?.disattivata).toBe(false);
  });
});

describe('Sali di livello: dal 4° al 5°', () => {
  it('tutti i personaggi di prova al 4° salgono al 5° senza scelte mancanti né errori', async () => {
    const L = await import('./livelli-prova');
    for (const [nome, pg] of Object.entries(L).filter(([k]) => k.startsWith('L4_'))) {
      const b = salvato(pg as object);
      const s = riempi(b);
      expect(completo(b, s, null, false), nome).toBe(true);
      const nuova = bozzaNuova(b, s, null);
      expect(nuova.livello, nome).toBe(5);
      expect(mancanti(nuova), nome).toEqual([]);
      expect(calcolaScheda(comePersonaggio(nuova)!).avvisi.filter((a) => a.livello === 'errore' && !a.accettato).map((a) => a.id), nome).toEqual([]);
    }
  });
  it('«Cresce da solo»: competenza, Attacco furtivo, Ispirazione d8, sempre preparati nuovi; suppliche: già prese e senza patto spente', async () => {
    const L = await import('./livelli-prova');
    expect(nuovoLivello(salvato(L.L4_LADRO), {})!.cresce).toEqual(expect.arrayContaining(['Bonus di competenza: +2 → +3', 'Attacco furtivo: 2d6 → 3d6']));
    expect(nuovoLivello(salvato(L.L4_BARDO), {})!.cresce).toContain('Ispirazione bardica: d6 → d8');
    expect(nuovoLivello(salvato(L.L4_PALADINO), {})!.cresce.find((c) => c.startsWith('Sempre preparati'))).toMatch(/Aiuto/);
    const t = nuovoLivello(salvato(L.L4_WARLOCK), {})!.capacita.flatMap((c) => c.tendine).find((x) => x.chiave === 'scelta:warlock.suppliche-5')!;
    expect(t.opzioni.find((o) => o.id === 'agonizing-blast')?.motivo).toBe('ce l\'hai già');
    expect(t.opzioni.find((o) => o.id === 'thirsting-blade')?.motivo).toBe('serve il Patto della lama');
    expect(t.opzioni.find((o) => o.id === 'one-with-shadows')?.disattivata).toBe(false);
  });
});

describe('Sali di livello: cambi facoltativi (23/11)', () => {
  it('warlock: cambia Blocca persone con Invisibilità, come nel file del 5° livello; niente avviso', async () => {
    const L = await import('./livelli-prova');
    const b = salvato(L.L4_WARLOCK);
    const r = nuovoLivello(b, {})!;
    expect(r.cambi.map((t) => t.chiave)).toEqual(expect.arrayContaining(['cambio:warlock:trucchetto', 'cambio:warlock:incantesimo', 'cambio:suppliche']));
    const s = { ...riempi(b, { 'scelta:warlock.suppliche-5': ['one-with-shadows', 'repelling-blast'], 'preparati:warlock': ['counterspell'] }),
      'cambio:warlock:incantesimo': ['prep:warlock|hold-person', 'invisibility'] };
    expect(completo(b, s, null, false)).toBe(true);
    const nuova = bozzaNuova(b, s, null);
    expect(nuova.incantesimi.preparati.warlock).toEqual(L.L5_WARLOCK.incantesimi.preparati.warlock);
    expect(calcolaScheda(comePersonaggio(nuova)!).avvisi.some((a) => a.id.startsWith('gia-sempre-preparato:hold-person'))).toBe(false);
  });
  it('un cambio a metà blocca la conferma; le opzioni nuove spengono ciò che conosci', async () => {
    const L = await import('./livelli-prova');
    const b = salvato(L.L4_BARDO);
    const s = { ...riempi(b), 'cambio:bard:trucchetto': ['scelta:bard.trucchetti|vicious-mockery', ''] };
    expect(completo(b, s, null, false)).toBe(false);
    const t = nuovoLivello(b, s)!.cambi.find((x) => x.chiave === 'cambio:bard:trucchetto')!;
    expect(t.opzioniNuove!.find((o) => o.id === 'mage-hand')?.motivo).toBe('lo conosci già');
    expect(t.opzioniNuove!.find((o) => o.id === 'vicious-mockery')?.motivo).toBe('è quello che togli');
    const fatto = { ...s, 'cambio:bard:trucchetto': ['scelta:bard.trucchetti|vicious-mockery', 'light'] };
    expect(completo(b, fatto, null, false)).toBe(true);
    expect(bozzaNuova(b, fatto, null).scelte['bard.trucchetti']).toContain('light');
  });
  it('supplica: una del 1° livello con una del 5°, accettata dal motore; Iniziato alla magia con uno dello stesso livello', async () => {
    const L = await import('./livelli-prova');
    const b = salvato(L.L4_WARLOCK);
    const s = { ...riempi(b), 'cambio:suppliche': ['scelta:warlock.suppliche|armor-of-shadows', 'gaze-of-two-minds'] };
    const nuova = bozzaNuova(b, s, null);
    expect(nuova.scelte['warlock.suppliche']).toEqual(['gaze-of-two-minds']);
    expect(mancanti(nuova)).toEqual([]);
    expect(calcolaScheda(comePersonaggio(nuova)!).avvisi.filter((a) => a.livello === 'errore' && !a.accettato)).toEqual([]);
    const t = (x: Scelte) => nuovoLivello(salvato(L.L4_TRAVIS), x)!.cambi.find((c) => c.chiave === 'cambio:magic-initiate:incantesimo')!;
    expect(t({}).opzioniNuove).toEqual([]);
    const dopo = t({ 'cambio:magic-initiate:incantesimo': ['scelta:magic-initiate.incantesimo1|healing-word', ''] });
    expect(dopo.opzioniNuove!.every((o) => o.id === 'healing-word' || DATI_LIVELLO(o.id) === 1)).toBe(true);
  });
  it('guerriero: lo stile di combattimento si cambia con un altro talento di stile', async () => {
    const L = await import('./livelli-prova');
    const t = nuovoLivello(salvato(L.L4_GUERRIERO), {})!.cambi.find((c) => c.chiave === 'cambio:stile')!;
    expect(t.opzioniNuove!.map((o) => o.id)).toEqual(expect.arrayContaining(['archery', 'great-weapon-fighting']));
  });
});
