// «Cosa ottieni al livello 1»: ogni classe ha competenze, privilegi con la riga e (se c'è) la magia, dai dati.
import { describe, expect, it } from 'vitest';
import { cosaOttieni, PRIVILEGI_LIVELLO_1 } from '../src/creazione/cosa-ottieni';
import { DATI } from '../src/regole';

describe('Cosa ottieni al livello 1', () => {
  it('ogni classe ha almeno un privilegio con la pagina', () => {
    for (const id of Object.keys(DATI.classi)) {
      expect(PRIVILEGI_LIVELLO_1[id]?.length, id).toBeGreaterThan(0);
      for (const p of PRIVILEGI_LIVELLO_1[id]) expect(p.pagina, `${id} ${p.nome}`).toBeGreaterThan(0);
    }
  });
  it('barbaro: tiri salvezza, armature, armi, abilità, niente magia', () => {
    const c = cosaOttieni('barbarian');
    expect(c.tiriSalvezza).toBe('Forza e Costituzione');
    expect(c.armature).toBe('leggere, medie, scudo');
    expect(c.armi).toBe('semplici, da guerra');
    expect(c.abilita).toMatch(/^2 a scelta tra /);
    expect(c.magia).toBeUndefined();
  });
  it('mago: libro, preparati e slot', () => {
    expect(cosaOttieni('wizard').magia?.riga).toBe("Usi la magia con l'Intelligenza: 3 trucchetti, un libro con 6 incantesimi, 4 incantesimi preparati, 2 slot di 1° livello.");
  });
  it('warlock: lo slot del patto', () => {
    expect(cosaOttieni('warlock').magia?.riga).toContain('1 slot del patto');
  });
  it('bardo: abilità tra tutte', () => {
    expect(cosaOttieni('bard').abilita).toBe('3 a scelta, tra tutte');
  });
});
