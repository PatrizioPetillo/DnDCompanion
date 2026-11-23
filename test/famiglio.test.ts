// Il famiglio (23/11): chi lo può avere e quali forme (Trova famiglio SRD p. 130, Patto della catena p. 73, Compagno selvatico p. 43)
import { describe, expect, it } from 'vitest';
import { formeFamiglio, natureAmmesse, puoAvereFamiglio } from '../src/creazione/famiglio';
import { comePersonaggio, type Bozza } from '../src/creazione/percorso';
import { calcolaScheda } from '../src/regole';
import mostri from '../src/regole/dati/mostri.json';
import * as P from './personaggi';

const sch = (b: Bozza) => calcolaScheda(comePersonaggio(b)!);
describe('Famiglio', () => {
  it('Travis (Trova famiglio nel libro) sì; il barbaro no', () => {
    expect(puoAvereFamiglio(P.TRAVIS as Bozza, sch(P.TRAVIS as Bozza))).toBe(true);
    expect(puoAvereFamiglio(P.BARBARO as Bozza, sch(P.BARBARO as Bozza))).toBe(false);
  });
  it('forme: le 11 nominate dall\'incantesimo per prime, poi le altre bestie di GS 0', () => {
    const f = formeFamiglio(P.TRAVIS as Bozza);
    expect(f.normali.slice(0, 11).map((x) => x.id).sort()).toEqual(['bat', 'cat', 'frog', 'hawk', 'lizard', 'owl', 'piovra', 'rat', 'raven', 'spider', 'weasel']);
    const gs0 = (mostri as { id: string; tipo: string; gs: string }[]).filter((m) => m.tipo.toLowerCase().startsWith('bestia') && m.gs === '0');
    expect(f.normali).toHaveLength(gs0.length);
    expect(f.patto).toEqual([]);
  });
  it('Patto della catena: le 7 forme speciali', () => {
    const b = { ...(P.WARLOCK as Bozza), scelte: { ...P.WARLOCK.scelte, 'warlock.suppliche': ['pact-of-the-chain'] } };
    expect(puoAvereFamiglio(b, null)).toBe(true);
    expect(formeFamiglio(b).patto.map((x) => x.id)).toEqual(['imp', 'pseudodragon', 'quasit', 'skeleton', 'sphinx-of-wonder', 'sprite', 'venomous-snake']);
  });
  it('druido al 2° (Compagno selvatico): sempre folletto', () => {
    const b = { ...(P.DRUIDO as Bozza), livello: 2 };
    expect(puoAvereFamiglio(b, null)).toBe(true);
    expect(natureAmmesse(b)).toEqual(['folletto']);
    expect(natureAmmesse(P.TRAVIS as Bozza)).toEqual(['celestiale', 'folletto', 'immondo']);
  });
});
