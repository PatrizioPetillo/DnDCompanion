// Test dei valori approvati da Patrizio il 17/11/2026 (file «App PG B20 - Valori attesi»).
// Il motore delle regole è finito quando passano tutti.
import { describe, expect, it } from 'vitest';
import { calcolaScheda } from '../src/regole';
import type { Car, Personaggio, Scheda } from '../src/regole/tipi';
import * as P from './personaggi';
import { ALLINEAMENTI } from '../src/regole/dati/base';

const CAR: Car[] = ['FOR', 'DES', 'COS', 'INT', 'SAG', 'CAR'];

interface Atteso {
  punteggi: number[];
  mod: number[];
  ts: number[];
  pf: number;
  iniziativa: number;
  percezionePassiva: number;
  ca: Record<string, number>;
  caMigliore: number;
  abilita: Record<string, number>;            // solo quelle con competenza
  magia?: Record<string, { cd: number; attacco: number; car: Car }>;
  cdSpeciali?: Record<string, number>;
  risorse?: Record<string, number>;
  slot?: number[];
  patto?: { numero: number; livello: number } | null;
  velocita?: number;
  resistenze?: string[];
  valoriClasse?: Record<string, string>;
  avvisi?: string[];                           // id esatti attesi (insieme completo)
}

function verifica(nome: string, pg: Personaggio, a: Atteso, extra?: (s: Scheda) => void) {
  describe(nome, () => {
    const s = calcolaScheda(pg);
    it('punteggi, modificatori e tiri salvezza (p. 21, 22, 83)', () => {
      expect(CAR.map((c) => s.punteggi[c].totale)).toEqual(a.punteggi);
      expect(CAR.map((c) => s.modificatori[c])).toEqual(a.mod);
      expect(CAR.map((c) => s.tiriSalvezza[c].totale)).toEqual(a.ts);
      expect(s.competenza).toBe(2);
    });
    it('PF, iniziativa, percezione passiva (p. 22, 87)', () => {
      expect(s.pf.totale).toBe(a.pf);
      expect(s.iniziativa.totale).toBe(a.iniziativa);
      expect(s.percezionePassiva).toBe(a.percezionePassiva);
    });
    it('CA: ogni formula e la migliore (p. 22, 92)', () => {
      for (const [id, v] of Object.entries(a.ca)) {
        const f = s.ca.formule.find((x) => x.id === id);
        expect(f, `formula ${id}`).toBeDefined();
        expect(f!.valore.totale, id).toBe(v);
      }
      expect(Math.max(...s.ca.formule.map((f) => f.valore.totale))).toBe(a.caMigliore);
      expect(s.ca.formule.find((f) => f.id === s.ca.migliore)!.valore.totale).toBe(a.caMigliore);
    });
    it('abilità con competenza (p. 9, 22, 182)', () => {
      const conCompetenza = Object.fromEntries(Object.entries(s.abilita).filter(([, v]) => v.competente).map(([k, v]) => [k, v.totale]));
      expect(conCompetenza).toEqual(a.abilita);
    });
    it('magia: CD e attacco per ogni fonte (p. 23, 106)', () => {
      const m = Object.fromEntries(s.magia.map((x) => [x.id, { cd: x.cd?.totale, attacco: x.attacco?.totale, car: x.caratteristica }]));
      expect(m).toEqual(a.magia ?? {});
      const cs = Object.fromEntries(s.cdSpeciali.map((x) => [x.id, x.cd.totale]));
      expect(cs).toEqual(a.cdSpeciali ?? {});
    });
    it('risorse e slot', () => {
      expect(Object.fromEntries(s.risorse.map((r) => [r.id, r.usi]))).toEqual(a.risorse ?? {});
      expect(s.slot.normali).toEqual(a.slot ?? []);
      expect(s.slot.patto).toEqual(a.patto ?? null);
    });
    it('velocità, resistenze, valori di classe', () => {
      expect(s.velocita).toBe(a.velocita ?? 30);
      expect([...s.resistenze].sort()).toEqual([...(a.resistenze ?? [])].sort());
      expect(s.valoriClasse).toEqual(a.valoriClasse ?? {});
    });
    it('avvisi attesi (avvisa, non vieta)', () => {
      expect(s.avvisi.map((x) => x.id).sort()).toEqual([...(a.avvisi ?? [])].sort());
    });
    if (extra) it('casi specifici', () => extra(s));
  });
}

verifica('1. Barbaro · Nano · Soldato', P.BARBARO, {
  punteggi: [17, 14, 15, 8, 10, 10], mod: [3, 2, 2, -1, 0, 0], ts: [5, 2, 4, -1, 0, 0],
  pf: 15, iniziativa: 2, percezionePassiva: 12,
  ca: { 'senza-armatura': 12, 'difesa-senza-armatura-barbaro': 14 }, caMigliore: 14,
  abilita: { athletics: 5, intimidation: 2, perception: 2, survival: 2 },
  risorse: { rage: 2, stonecunning: 2 }, resistenze: ['veleno'], valoriClasse: { 'rage-damage': '+2' },
}, (s) => {
  const pf = s.pf.termini.map((t) => t.etichetta);
  expect(pf).toContain('Robustezza nanica');
  expect(s.talenti).toEqual(['savage-attacker']);
});

verifica('2. Bardo · Halfling · Criminale', P.BARDO, {
  punteggi: [8, 16, 14, 10, 12, 15], mod: [-1, 3, 2, 0, 1, 2], ts: [-1, 5, 2, 0, 1, 4],
  pf: 10, iniziativa: 5, percezionePassiva: 13,
  ca: { 'senza-armatura': 13, 'armatura:leather-armor': 14 }, caMigliore: 14,
  abilita: { 'sleight-of-hand': 5, stealth: 5, performance: 4, persuasion: 4, perception: 3 },
  magia: { bard: { cd: 12, attacco: 4, car: 'CAR' } },
  risorse: { 'bardic-inspiration': 2 }, slot: [2],
}, (s) => {
  expect(s.iniziativa.termini).toEqual([{ etichetta: 'Destrezza', valore: 3 }, { etichetta: 'Allerta (competenza)', valore: 2 }]);
  const bard = s.magia.find((m) => m.id === 'bard')!;
  expect(bard.trucchetti.attesi).toBe(2);
  expect(bard.preparati).toEqual({ limite: 4, scelti: ['healing-word', 'charm-person', 'dissonant-whispers', 'sleep'] });
  expect(bard.cambio?.quando).toBe('livello');
});

verifica('3. Chierico · Dragonide · Accolito', P.CHIERICO, {
  punteggi: [14, 8, 14, 10, 17, 11], mod: [2, -1, 2, 0, 3, 0], ts: [2, -1, 2, 0, 5, 2],
  pf: 10, iniziativa: -1, percezionePassiva: 13,
  ca: { 'senza-armatura': 11, 'armatura:chain-mail': 18 }, caMigliore: 18,
  abilita: { insight: 5, religion: 2, medicine: 5, persuasion: 2 },
  magia: { cleric: { cd: 13, attacco: 5, car: 'SAG' }, 'magic-initiate': { cd: 13, attacco: 5, car: 'SAG' } },
  cdSpeciali: { 'breath-weapon': 12 }, risorse: { 'breath-weapon': 2 }, slot: [2], resistenze: ['fuoco'],
  avvisi: ['doppione-trucchetto:guidance'],
}, (s) => {
  const mi = s.magia.find((m) => m.id === 'magic-initiate')!;
  expect(mi.semprePreparati).toEqual(['bless']);
  expect(mi.lanciGratuiti).toEqual({ incantesimi: ['bless'], usi: 1, recupero: 'lungo' });
  expect(s.magia.find((m) => m.id === 'cleric')!.preparati!.limite).toBe(4);   // Iniziato non conta (p. 104)
  expect(s.avvisi.find((a) => a.id === 'doppione-trucchetto:guidance')!.livello).toBe('attenzione');
});

describe('3 bis. Chierico con l\'equipaggiamento A (giaco di maglia + scudo)', () => {
  it('CA 14 (13 + DES max 2 + scudo 2, p. 92)', () => {
    const s = calcolaScheda({ ...P.CHIERICO, equipaggiamento: { classe: 'A', background: 'A' } });
    expect(s.ca.formule.find((f) => f.id === 'armatura:chain-shirt')!.valore.totale).toBe(14);
    expect(s.ca.formule.find((f) => f.id === s.ca.migliore)!.valore.totale).toBe(14);
  });
});

verifica('4. Druido · Elfo dei boschi · Saggio', P.DRUIDO, {
  punteggi: [8, 14, 15, 10, 17, 10], mod: [-1, 2, 2, 0, 3, 0], ts: [-1, 2, 2, 2, 5, 0],
  pf: 10, iniziativa: 2, percezionePassiva: 15,
  ca: { 'senza-armatura': 14, 'armatura:leather-armor': 15 }, caMigliore: 15,
  abilita: { arcana: 5, history: 2, perception: 5, medicine: 5, nature: 5 },
  magia: { druid: { cd: 13, attacco: 5, car: 'SAG' }, elf: { cd: 13, attacco: 5, car: 'SAG' }, 'magic-initiate': { cd: 10, attacco: 2, car: 'INT' } },
  slot: [2], velocita: 35,
}, (s) => {
  const druid = s.magia.find((m) => m.id === 'druid')!;
  expect(druid.trucchetti.attesi).toBe(3);                 // 2 + Mago (Ordine primordiale)
  expect(druid.semprePreparati).toEqual(['speak-with-animals']);
  expect(s.magia.find((m) => m.id === 'elf')!.trucchetti.scelti).toEqual(['druidcraft']);
  expect(s.magia.find((m) => m.id === 'magic-initiate')!.semprePreparati).toEqual(['magic-missile']);
  expect(s.abilita.nature.fonti).toContain('Mago (Ordine primordiale)');
});

verifica('5. Guerriero · Orco · Soldato', P.GUERRIERO, {
  punteggi: [17, 12, 15, 8, 12, 11], mod: [3, 1, 2, -1, 1, 0], ts: [5, 1, 4, -1, 1, 0],
  pf: 12, iniziativa: 1, percezionePassiva: 13,
  ca: { 'senza-armatura': 11, 'armatura:chain-mail': 17 }, caMigliore: 17,
  abilita: { athletics: 5, intimidation: 2, perception: 3, survival: 3 },
  risorse: { 'second-wind': 2, 'adrenaline-rush': 2, 'relentless-endurance': 1 },
}, (s) => {
  // Difesa vale solo con l'armatura (p. 88)
  expect(s.ca.formule.find((f) => f.id === 'senza-armatura')!.valore.termini.map((t) => t.etichetta)).not.toContain('Difesa');
  expect(s.ca.formule.find((f) => f.id === 'armatura:chain-mail')!.valore.termini).toContainEqual({ etichetta: 'Difesa', valore: 1 });
  expect(s.talenti.sort()).toEqual(['defense', 'savage-attacker']);
});

verifica('6. Monaco · Umano · Criminale', P.MONACO, {
  punteggi: [10, 17, 14, 10, 15, 8], mod: [0, 3, 2, 0, 2, -1], ts: [2, 5, 2, 0, 2, -1],
  pf: 10, iniziativa: 5, percezionePassiva: 14,
  ca: { 'senza-armatura': 13, 'difesa-senza-armatura-monaco': 15 }, caMigliore: 15,
  abilita: { 'sleight-of-hand': 5, stealth: 5, acrobatics: 5, insight: 4, perception: 4 },
  valoriClasse: { 'martial-arts-die': '1d6' },
});

describe('6 bis. Monaco che riprende Allerta con Versatile', () => {
  it('errore: i talenti non si ripetono (p. 87)', () => {
    const s = calcolaScheda({ ...P.MONACO, scelte: { ...P.MONACO.scelte, 'human.versatile': ['alert'] } });
    const a = s.avvisi.find((x) => x.id === 'talento-ripetuto:alert');
    expect(a?.livello).toBe('errore');
    expect(s.iniziativa.totale).toBe(5);                   // Allerta conta una volta sola
  });
});

verifica('7. Paladino · Tiefling infernale · Soldato', P.PALADINO, {
  punteggi: [17, 8, 15, 8, 10, 15], mod: [3, -1, 2, -1, 0, 2], ts: [3, -1, 2, -1, 2, 4],
  pf: 12, iniziativa: -1, percezionePassiva: 10,
  ca: { 'senza-armatura': 11, 'armatura:chain-mail': 18 }, caMigliore: 18,
  abilita: { athletics: 5, intimidation: 4, insight: 2, persuasion: 4 },
  magia: { paladin: { cd: 12, attacco: 4, car: 'CAR' }, tiefling: { cd: 10, attacco: 2, car: 'SAG' } },
  risorse: { 'lay-on-hands': 5 }, slot: [2], resistenze: ['fuoco'],
}, (s) => {
  expect(s.magia.find((m) => m.id === 'tiefling')!.trucchetti.scelti).toEqual(['fire-bolt', 'thaumaturgy']);
});

verifica('8. Ranger · Gnomo dei boschi · Soldato', P.RANGER, {
  punteggi: [10, 17, 15, 10, 14, 8], mod: [0, 3, 2, 0, 2, -1], ts: [2, 5, 2, 0, 2, -1],
  pf: 12, iniziativa: 3, percezionePassiva: 14,
  ca: { 'senza-armatura': 13, 'armatura:studded-leather-armor': 15 }, caMigliore: 15,
  abilita: { athletics: 2, intimidation: 1, perception: 4, stealth: 5, survival: 4 },
  magia: { ranger: { cd: 12, attacco: 4, car: 'SAG' }, gnome: { cd: 10, attacco: 2, car: 'INT' } },
  slot: [2],
}, (s) => {
  const r = s.magia.find((m) => m.id === 'ranger')!;
  expect(r.semprePreparati).toEqual(['hunters-mark']);
  expect(r.lanciGratuiti).toEqual({ incantesimi: ['hunters-mark'], usi: 2, recupero: 'lungo' });   // p. 58
  expect(r.preparati!.limite).toBe(2);
  const g = s.magia.find((m) => m.id === 'gnome')!;
  expect(g.lanciGratuiti).toEqual({ incantesimi: ['speak-with-animals'], usi: 2, recupero: 'lungo' });
});

verifica('9. Ladro · Halfling · Criminale', P.LADRO, {
  punteggi: [8, 17, 14, 13, 12, 11], mod: [-1, 3, 2, 1, 1, 0], ts: [-1, 5, 2, 3, 1, 0],
  pf: 10, iniziativa: 5, percezionePassiva: 13,
  ca: { 'senza-armatura': 13, 'armatura:leather-armor': 14 }, caMigliore: 14,
  abilita: { 'sleight-of-hand': 7, stealth: 7, acrobatics: 5, deception: 2, perception: 3, investigation: 3 },
  valoriClasse: { 'sneak-attack': '1d6' },
}, (s) => {
  expect(s.abilita.stealth.maestria).toBe(true);
  expect(s.abilita.acrobatics.maestria).toBe(false);
});

describe('9 bis. Ladro che sceglie un\'abilità già data dal Criminale', () => {
  it('avviso doppione (la competenza non si somma due volte, p. 8)', () => {
    const s = calcolaScheda({ ...P.LADRO, scelte: { ...P.LADRO.scelte, 'rogue.abilita': ['acrobatics', 'deception', 'perception', 'stealth'] } });
    expect(s.avvisi.map((a) => a.id)).toContain('doppione-abilita:stealth');
    expect(s.abilita.stealth.totale).toBe(7);
  });
});

verifica('10. Stregone · Dragonide · Saggio', P.STREGONE, {
  punteggi: [8, 13, 17, 12, 9, 15], mod: [-1, 1, 3, 1, -1, 2], ts: [-1, 1, 5, 1, -1, 4],
  pf: 9, iniziativa: 1, percezionePassiva: 9,
  ca: { 'senza-armatura': 11 }, caMigliore: 11,
  abilita: { arcana: 3, history: 3, deception: 4, persuasion: 4 },
  magia: { sorcerer: { cd: 12, attacco: 4, car: 'CAR' }, 'magic-initiate': { cd: 11, attacco: 3, car: 'INT' } },
  cdSpeciali: { 'breath-weapon': 13 }, risorse: { 'innate-sorcery': 2, 'breath-weapon': 2 }, slot: [2], resistenze: ['fuoco'],
}, (s) => {
  expect(s.magia.find((m) => m.id === 'sorcerer')!.cdCondizionali).toEqual([{ etichetta: 'Stregoneria innata attiva', totale: 13 }]);
  // Tre CD diverse, ognuna con la sua fonte
  const cd = [...s.magia.map((m) => m.cd!.totale), ...s.cdSpeciali.map((c) => c.cd.totale)];
  expect(new Set(cd).size).toBe(3);
});

verifica('11. Warlock · Tiefling abissale · Accolito', P.WARLOCK, {
  punteggi: [8, 14, 14, 10, 11, 17], mod: [-1, 2, 2, 0, 0, 3], ts: [-1, 2, 2, 0, 2, 5],
  pf: 10, iniziativa: 2, percezionePassiva: 10,
  ca: { 'senza-armatura': 12, 'armatura:leather-armor': 13, 'armatura-magica': 15 }, caMigliore: 15,
  abilita: { insight: 2, religion: 2, arcana: 2, deception: 5 },
  magia: { warlock: { cd: 13, attacco: 5, car: 'CAR' }, tiefling: { cd: 13, attacco: 5, car: 'CAR' }, 'magic-initiate': { cd: 10, attacco: 2, car: 'SAG' } },
  slot: [], patto: { numero: 1, livello: 1 }, resistenze: ['veleno'],
}, (s) => {
  expect(s.magia.find((m) => m.id === 'warlock')!.slot).toBe('patto');
  expect(s.magia.find((m) => m.id === 'magic-initiate')!.slot).toBe('qualsiasi');   // anche lo slot del patto (p. 87)
});

verifica('12. Mago · Umano · Accolito — Travis', P.TRAVIS, {
  punteggi: [8, 12, 13, 17, 15, 10], mod: [-1, 1, 1, 3, 2, 0], ts: [-1, 1, 1, 5, 4, 0],
  pf: 7, iniziativa: 3, percezionePassiva: 12,
  ca: { 'senza-armatura': 11, 'armatura-magica': 14 }, caMigliore: 14,
  abilita: { arcana: 5, investigation: 5, medicine: 4, insight: 4, religion: 5 },
  magia: { wizard: { cd: 13, attacco: 5, car: 'INT' }, 'magic-initiate': { cd: 13, attacco: 5, car: 'INT' } },
  risorse: { 'arcane-recovery': 1 }, slot: [2],
  avvisi: ['materiale:find-familiar', 'materiale:identify', 'scelta-non-valida:origine.lingue:undercommon'],
}, (s) => {
  const w = s.magia.find((m) => m.id === 'wizard')!;
  expect(w.cd!.termini).toEqual([
    { etichetta: 'Base', valore: 8 }, { etichetta: 'Competenza', valore: 2 }, { etichetta: 'Intelligenza', valore: 3 }]);
  expect(w.preparati).toEqual({ limite: 4, scelti: ['mage-armor', 'shield', 'feather-fall', 'find-familiar'] });
  expect(w.cambio).toMatchObject({ quando: 'riposoLungo', quanti: 'tutti' });
  const mi = s.magia.find((m) => m.id === 'magic-initiate')!;
  expect(mi.nome).toBe('Talento: Iniziato alla magia (Chierico)');   // lista fissata dall'Accolito (p. 83)
  expect(mi.trucchetti).toEqual({ attesi: 2, scelti: ['guidance', 'light'] });
  expect(mi.semprePreparati).toEqual(['healing-word']);
  expect(mi.lanciGratuiti).toEqual({ incantesimi: ['healing-word'], usi: 1, recupero: 'lungo' });
  expect(s.pf.termini).toEqual([{ etichetta: 'Dado vita (d6)', valore: 6 }, { etichetta: 'Costituzione', valore: 1 }]);
  expect(s.talenti.sort()).toEqual(['alert', 'magic-initiate']);
});

verifica('12 bis. Travis, variante Saggio', P.TRAVIS_SAGGIO, {
  punteggi: [8, 14, 14, 17, 13, 8], mod: [-1, 2, 2, 3, 1, -1], ts: [-1, 2, 2, 5, 3, -1],
  pf: 8, iniziativa: 4, percezionePassiva: 11,
  ca: { 'senza-armatura': 12, 'armatura-magica': 15 }, caMigliore: 15,
  abilita: { arcana: 5, history: 5, investigation: 5, medicine: 3, insight: 3 },
  magia: { wizard: { cd: 13, attacco: 5, car: 'INT' }, 'magic-initiate': { cd: 13, attacco: 5, car: 'INT' } },
  risorse: { 'arcane-recovery': 1 }, slot: [2], avvisi: ['scelta-non-valida:origine.lingue:undercommon'],
}, (s) => {
  expect(s.magia.find((m) => m.id === 'magic-initiate')!.nome).toBe('Talento: Iniziato alla magia (Mago)');
});

describe('Lingue (SRD p. 20-21)', () => {
  it('Comune + 2 lingue a scelta', () => {
    expect(calcolaScheda(P.TRAVIS).lingue).toEqual(['common', 'undercommon', 'elvish']);
  });
  it('Travis: il Sottocomune è raro (p. 20), errore accettato dal master', () => {
    const a = calcolaScheda(P.TRAVIS).avvisi.find((x) => x.id === 'scelta-non-valida:origine.lingue:undercommon');
    expect(a?.livello).toBe('errore');
    expect(a?.accettato).toBe(true);
    expect(a?.messaggio).toContain('lingua rara');
  });
  it('il ladro aggiunge il Gergo dei ladri e una lingua (p. 62)', () => {
    expect(calcolaScheda(P.LADRO).lingue).toEqual(['common', 'halfling', 'dwarvish', 'thieves-cant', 'elvish']);
  });
  it('il druido conosce il Druidico (p. 42)', () => {
    expect(calcolaScheda(P.DRUIDO).lingue).toContain('druidic');
  });
  it('lingue mancanti: da scegliere', () => {
    const { 'origine.lingue': _l, ...scelte } = P.TRAVIS.scelte;
    expect(calcolaScheda({ ...P.TRAVIS, scelte }).avvisi.map((a) => a.id)).toContain('scelta-mancante:origine.lingue');
  });
  it('una lingua rara al posto di una standard: errore', () => {
    const s = calcolaScheda({ ...P.TRAVIS, scelte: { ...P.TRAVIS.scelte, 'origine.lingue': ['draconic', 'infernal'] } });
    expect(s.avvisi.find((a) => a.id === 'scelta-non-valida:origine.lingue:infernal')?.livello).toBe('errore');
  });
  it('la stessa lingua da due fonti: avviso', () => {
    const s = calcolaScheda({ ...P.LADRO, scelte: { ...P.LADRO.scelte, 'rogue.lingua': ['dwarvish'] } });
    expect(s.avvisi.map((a) => a.id)).toContain('doppione-lingua:dwarvish');
  });
});

describe('Allineamento (SRD p. 21)', () => {
  it('le nove combinazioni', () => {
    expect(Object.keys(ALLINEAMENTI)).toHaveLength(9);
  });
  it('senza allineamento: da scegliere', () => {
    const { allineamento: _a, ...pg } = P.TRAVIS;
    expect(calcolaScheda(pg).avvisi.map((a) => a.id)).toContain('scelta-mancante:allineamento');
  });
  it('malvagio: avviso, chiedi al master', () => {
    const s = calcolaScheda({ ...P.TRAVIS, allineamento: 'lawful-evil' });
    expect(s.avvisi.find((a) => a.id === 'allineamento-malvagio')?.livello).toBe('attenzione');
  });
  it('non malvagio: nessun avviso', () => {
    expect(calcolaScheda(P.TRAVIS).avvisi.map((a) => a.id).filter((id) => id.includes('allineamento'))).toEqual([]);
  });
  it('valore inventato: errore', () => {
    const s = calcolaScheda({ ...P.TRAVIS, allineamento: 'boh' });
    expect(s.avvisi.find((a) => a.id === 'scelta-non-valida:allineamento:boh')?.livello).toBe('errore');
  });
});

describe('Iniziato alla Magia preso due volte (ripetibile, lista diversa: p. 87)', () => {
  const MI2 = 'magic-initiate@human-versatile';
  const travis2 = (lista: string, car: string) => ({
    ...P.TRAVIS,
    scelte: {
      ...P.TRAVIS.scelte, 'human.versatile': ['magic-initiate'],
      [`${MI2}.lista`]: [lista], [`${MI2}.caratteristica`]: [car],
      [`${MI2}.trucchetti`]: lista === 'wizard' ? ['ray-of-frost', 'prestidigitation'] : ['sacred-flame', 'thaumaturgy'],
      [`${MI2}.incantesimo1`]: [lista === 'wizard' ? 'magic-missile' : 'bless'],
    },
  });

  it('Travis: Iniziato (Chierico) dall\'Accolito e Iniziato (Mago) da Versatile, ognuno con la sua CD', () => {
    const s = calcolaScheda(travis2('wizard', 'CAR'));
    const m = Object.fromEntries(s.magia.map((x) => [x.id, x]));
    expect(m['magic-initiate'].nome).toBe('Talento: Iniziato alla magia (Chierico)');
    expect(m['magic-initiate'].cd!.totale).toBe(13);                // INT 17
    expect(m[MI2].nome).toBe('Talento: Iniziato alla magia (Mago)');
    expect(m[MI2].cd!.totale).toBe(10);                             // CAR 10: 8 + 2 + 0
    expect(m[MI2].attacco!.totale).toBe(2);
    expect(m[MI2].trucchetti.scelti).toEqual(['ray-of-frost', 'prestidigitation']);
    expect(s.avvisi.map((a) => a.id).filter((id) => id.startsWith('talento-ripetuto'))).toEqual([]);
    expect(s.avvisi.filter((a) => a.livello === 'errore' && !a.accettato)).toEqual([]);
  });

  it('la seconda volta con la stessa lista (Chierico): errore', () => {
    const s = calcolaScheda(travis2('cleric', 'SAG'));
    expect(s.avvisi.find((a) => a.id === `talento-stessa-lista:${MI2}`)?.livello).toBe('errore');
  });

  it('Allerta due volte resta un errore (non è ripetibile)', () => {
    const s = calcolaScheda({ ...P.MONACO, scelte: { ...P.MONACO.scelte, 'human.versatile': ['alert'] } });
    expect(s.avvisi.map((a) => a.id)).toContain('talento-ripetuto:alert');
  });
});

describe('Controlli generali', () => {
  it('bonus del background fuori dalle tre caratteristiche: errore (p. 83)', () => {
    const s = calcolaScheda({ ...P.TRAVIS, bonusBackground: { INT: 2, DES: 1 } });
    expect(s.avvisi.find((a) => a.id === 'bonus-background')?.livello).toBe('errore');
  });
  it('point buy oltre 27 punti: errore (p. 21)', () => {
    const s = calcolaScheda({ ...P.TRAVIS, punteggi: { metodo: 'pointBuy27', base: { FOR: 15, DES: 15, COS: 15, INT: 15, SAG: 8, CAR: 8 } } });
    expect(s.avvisi.find((a) => a.id === 'point-buy')?.livello).toBe('errore');
  });
  it('troppi preparati: errore', () => {
    const s = calcolaScheda({ ...P.TRAVIS_SAGGIO, incantesimi: { ...P.TRAVIS_SAGGIO.incantesimi, preparati: { wizard: ['mage-armor', 'shield', 'magic-missile', 'sleep', 'alarm'] } } });
    expect(s.avvisi.find((a) => a.id === 'preparati-troppi:wizard')?.livello).toBe('errore');
  });
  it('mago che prepara un incantesimo non nel libro: errore', () => {
    const s = calcolaScheda({ ...P.TRAVIS_SAGGIO, incantesimi: { ...P.TRAVIS_SAGGIO.incantesimi, preparati: { wizard: ['mage-armor', 'shield', 'magic-missile', 'identify'] } } });
    expect(s.avvisi.map((a) => a.id)).toContain('non-nel-libro:identify');
  });
  it('incantesimo fuori lista: errore', () => {
    const s = calcolaScheda({ ...P.CHIERICO, scelte: { ...P.CHIERICO.scelte, 'magic-initiate.incantesimo1': ['magic-missile'] } });
    expect(s.avvisi.map((a) => a.id)).toContain('fuori-lista:magic-initiate.incantesimo1:magic-missile');
  });
  it('armatura pesante con FOR troppo bassa: attenzione (p. 92)', () => {
    const s = calcolaScheda({ ...P.CHIERICO, punteggi: { metodo: 'pointBuy27', base: { FOR: 10, DES: 12, COS: 14, INT: 10, SAG: 15, CAR: 10 } } });
    expect(s.avvisi.find((a) => a.id === 'armatura-forza:chain-mail')?.livello).toBe('attenzione');
  });
  it('avviso accettato dal master: resta nella scheda ma segnato', () => {
    const s = calcolaScheda({ ...P.CHIERICO, avvisiAccettati: ['doppione-trucchetto:guidance'] });
    expect(s.avvisi.find((a) => a.id === 'doppione-trucchetto:guidance')?.accettato).toBe(true);
  });
});
