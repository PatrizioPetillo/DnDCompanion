// Le guide della Home: ogni capitolo ha testo e pagina dell'SRD; le condizioni sono le 15 dell'SRD 5.2 (p. 178, elenco).
import { describe, expect, it } from 'vitest';
import { GUIDA_CONDIZIONI, GUIDE } from '../src/guide/guide';

describe('Guide', () => {
  it('ogni capitolo ha un titolo, almeno una riga e la pagina dell\'SRD', () => {
    for (const g of GUIDE) for (const s of g.sezioni) for (const c of s.capitoli) {
      expect(c.righe.length).toBeGreaterThan(0);
      expect(c.pagina).toMatch(/^SRD p\. \d+/);
    }
  });
  it('id unici in ogni guida', () => {
    for (const g of GUIDE) {
      const id = g.sezioni.flatMap((s) => s.capitoli.map((c) => c.id));
      expect(new Set(id).size).toBe(id.length);
    }
  });
  it('le 15 condizioni, con i nomi dell\'SRD 5.2.1 italiano', () => {
    expect(GUIDA_CONDIZIONI.sezioni[0].capitoli.map((c) => c.titolo)).toEqual([
      'Accecato', 'Affascinato', 'Afferrato', 'Assordato', 'Avvelenato', 'Incapacitato', 'Indebolimento', 'Invisibile',
      'Paralizzato', 'Pietrificato', 'Privo di sensi', 'Prono', 'Spaventato', 'Stordito', 'Trattenuto',
    ]);
  });
});
