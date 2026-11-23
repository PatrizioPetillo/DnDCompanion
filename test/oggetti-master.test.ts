// Il master parte da un oggetto magico dell'SRD (23/11): i valori vengono dai dati dell'app, non riscritti a mano
import { describe, expect, it } from 'vitest';
import { daOggettoSrd, OGGETTI_SRD_PER_MASTER } from '../src/creazione/oggetti-master';
import { OGGETTI_MAGICI } from '../src/regole/dati/oggetti-magici';

describe('oggetto del master da un oggetto dell\'SRD', () => {
  it('ci sono tutti e ciascuno ha nome, effetto e pagina', () => {
    expect(OGGETTI_SRD_PER_MASTER()).toHaveLength(Object.keys(OGGETTI_MAGICI).length);
    for (const o of OGGETTI_SRD_PER_MASTER()) {
      const p = daOggettoSrd(o.id)!;
      expect(p.nome).toBeTruthy();
      expect(p.descrizione).toContain(`SRD p. ${o.pagina}`);
      expect(p.sintonia).toBe(o.sintonia !== false);
    }
  });
  it('la variante scelta dà il suo bonus', () => {
    const s = daOggettoSrd('shield-plus', '+2')!;
    expect(s.nome).toContain('+2');
    expect(s.bonus.ca).toBe(2);
    expect(s.descrizione).toContain('imbracci');
  });
  it('le cariche massime arrivano dai dati', () => {
    const w = OGGETTI_MAGICI['wand-of-magic-missiles'];
    expect(daOggettoSrd('wand-of-magic-missiles')!.cariche).toBe(w.cariche!.massimo);
  });
  it('un bonus che il modulo non ha resta solo nella descrizione', () => {
    const a = daOggettoSrd('weapon-plus', '+1')!;
    expect(a.bonus).toEqual({});
    expect(a.descrizione).toContain(OGGETTI_MAGICI['weapon-plus'].riga);
  });
  it('un id sconosciuto non riempie niente', () => expect(daOggettoSrd('nulla')).toBeNull());
});
