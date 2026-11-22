// Esportazione per Foundry (22/11): struttura dell'attore sui 13 personaggi di prova.
// Non sostituisce la prova vera su Foundry: controlla che i numeri e i documenti siano quelli giusti.
import { describe, expect, it } from 'vitest';
import { attoreFoundry, type DatiFoundry } from '../src/esporta/foundry';
import dati from '../src/esporta/foundry/dati.json';
import { calcolaScheda } from '../src/regole';
import * as P from './personaggi';

const D = dati as unknown as DatiFoundry;
const tutti = Object.entries(P).filter(([, v]) => typeof v === 'object' && v && 'classe' in (v as object)) as [string, typeof P.TRAVIS][];

describe('Foundry', () => {
  it.each(tutti)('%s: caratteristiche, PF, competenze, oggetti con provenienza', (_, pg) => {
    const { attore: a, avvisi } = attoreFoundry(pg, D);
    const s = calcolaScheda(pg);
    expect(avvisi).toEqual([]);
    expect(a.system.abilities.int.value).toBe(s.punteggi.INT.totale);
    expect(a.system.attributes.hp.value).toBe(s.pf.totale);
    const classe = a.items.find((i) => i.type === 'class')!;
    expect(classe.system.identifier).toBe(pg.classe);
    expect(classe.system.levels).toBe(1);
    expect(a.items.filter((i) => i.type === 'race')).toHaveLength(1);
    expect(a.items.filter((i) => i.type === 'background')).toHaveLength(1);
    const ids = a.items.map((i) => i._id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^[A-Za-z0-9]{16}$/));
    // i documenti del compendio portano la provenienza
    a.items.filter((i) => i.type !== 'loot').forEach((i) => expect((i._stats as { compendiumSource: string }).compendiumSource).toMatch(/^Compendium\.dnd5e\./));
    // gli avanzamenti della classe al 1° livello sono segnati
    const adv = Object.values(classe.system.advancement as Record<string, { type: string; level?: number; classRestriction?: string; value?: { chosen?: string[] } }>);
    expect(adv.find((x) => x.type === 'HitPoints')!.value).toEqual({ 1: 'max' });
    const abil = Object.entries(s.abilita).filter(([, v]) => v.competente).length;
    expect(Object.values(a.system.skills).filter((v) => v.value > 0)).toHaveLength(abil);
    // il riferimento a classe, specie e background punta agli oggetti dentro l'attore
    expect(ids).toContain(a.system.details.originalClass);
    expect(ids).toContain(a.system.details.race);
  });

  it('Travis: incantesimi del libro, preparati e dell\'Iniziato alla magia', () => {
    const { attore: a } = attoreFoundry(P.TRAVIS, D);
    const sp = a.items.filter((i) => i.type === 'spell');
    const nomi = (f: (i: typeof sp[number]) => boolean) => sp.filter(f).map((i) => i.system.identifier).sort();
    expect(nomi((i) => (i.system.preparation as { prepared: boolean }).prepared && (i.system.preparation as { mode: string }).mode === 'prepared' && i.system.level === 1))
      .toEqual(['feather-fall', 'find-familiar', 'mage-armor', 'shield']);
    expect(nomi((i) => !(i.system.preparation as { prepared: boolean }).prepared)).toEqual(['alarm', 'identify']);
    const hw = sp.find((i) => i.system.identifier === 'healing-word')!;
    expect(hw.system.preparation).toEqual({ mode: 'always', prepared: true });
    expect((hw.system.uses as { max: string }).max).toBe('1');
    expect(a.system.currency.gp).toBeGreaterThanOrEqual(0);
  });
});
