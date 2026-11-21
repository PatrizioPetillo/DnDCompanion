// «Cosa ottieni» della specie (21/11): ogni tratto delle 9 specie dell'SRD ha la sua riga, con la pagina.
import { describe, expect, it } from 'vitest';
import { cosaOttieniSpecie, TRATTI_DESCRITTI } from '../src/creazione/cosa-ottieni-specie';
import { DATI } from '../src/regole';

const SRD = ['dragonborn', 'dwarf', 'elf', 'gnome', 'goliath', 'halfling', 'human', 'orc', 'tiefling'];

describe('Cosa ottieni: specie', () => {
  it('ogni tratto delle specie dell\'SRD ha una descrizione', () => {
    for (const id of SRD) for (const t of DATI.specie[id].tratti) expect(TRATTI_DESCRITTI, `${id}: ${t.id}`).toContain(t.id);
  });
  it('ogni riga ha nome, testo e pagina (84-86)', () => {
    for (const id of SRD) {
      const righe = cosaOttieniSpecie(id);
      expect(righe.length).toBeGreaterThan(0);
      for (const r of righe) { expect(r.testo.length).toBeGreaterThan(20); expect(r.pagina).toBeGreaterThanOrEqual(84); expect(r.pagina).toBeLessThanOrEqual(86); }
    }
  });
  it('le scelte di stirpe compaiono: discendenza draconica e gigantica, presenza ultraterrena', () => {
    expect(cosaOttieniSpecie('dragonborn')[0].nome).toBe('Discendenza draconica');
    expect(cosaOttieniSpecie('goliath')[0].nome).toBe('Discendenza gigantica');
    expect(cosaOttieniSpecie('tiefling').at(-1)?.nome).toBe('Presenza ultraterrena');
  });
});
