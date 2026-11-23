// Elenco dei mostri dell'SRD negli incontri (23/11): solo i numeri delle schede, controllati sull'SRD 5.2.
import { describe, expect, it } from 'vitest';
import dati from '../src/regole/dati/mostri.json';
import { cambiaCondizioneNemico, PE_PER_GS, peNemici, tiraIniziativa } from '../src/creazione/incontri';
import { cercaMostri, daMostro, gradoIncontro, type Mostro } from '../src/creazione/mostri';
import { CONDIZIONI } from '../src/partita/condizioni';

const M = dati as Mostro[];
const per = (en: string) => M.find((m) => m.nomeEn === en)!;

describe('i dati dei mostri', () => {
  it('331 mostri, nomi unici, numeri sensati, PE coerenti con il grado di sfida (SRD p. 253)', () => {
    expect(M).toHaveLength(331);
    expect(new Set(M.map((m) => m.id)).size).toBe(331);
    expect(new Set(M.map((m) => m.nome)).size).toBe(331);
    const ids = new Set(CONDIZIONI.map((c) => c.id));
    for (const m of M) {
      // Unica eccezione: la scheda dell'Arcimago (SRD 5.2 e 5.2.1 IT) scrive 8.000 PE, la tabella per GS 12 dice 8.400.
      // La difficoltà degli incontri usa la tabella (incontri.ts), quindi conta 8.400.
      if (m.nomeEn !== 'Archmage') expect(PE_PER_GS[gradoIncontro(m)], m.nome).toBe(m.pe);
      expect(m.ca, m.nome).toBeGreaterThanOrEqual(5);
      expect(m.pf, m.nome).toBeGreaterThan(0);
      for (const c of m.immunita ?? []) expect(ids.has(c), `${m.nome}: ${c}`).toBe(true);
      if (!m.solo521) expect(m.srd?.pagina, m.nome).toBeGreaterThan(100);     // quasi tutti da p. 254; la Mosca gigante sta tra gli oggetti magici (p. 221)
    }
  });
  it('alcune schede controllate a mano sull\'SRD 5.2', () => {
    expect(per('Goblin Warrior')).toMatchObject({ nome: 'Goblin guerriero', ca: 15, iniziativa: 2, pf: 10, dadiPf: '3d6', gs: '1/4', pe: 50 });
    expect(per('Zombie')).toMatchObject({ nome: 'Zombi', ca: 8, iniziativa: -2, pf: 15, gs: '1/4' });
    expect(per('Zombie').immunita!.sort()).toEqual(['avvelenato', 'indebolimento']);
    expect(per('Lich')).toMatchObject({ ca: 20, pf: 315, gs: '21', pe: 33000 });
    expect(per('Knight').nome).toBe('Cavaliere');          // nel testo inglese il titolo era sparito (intestazione «Iron Golem»)
    expect(per('Iron Golem').nome).toBe('Golem di ferro');
    expect(per('Air Elemental').immunita!.sort()).toEqual(['afferrato', 'avvelenato', 'indebolimento', 'paralizzato', 'pietrificato', 'privo-di-sensi', 'prono', 'trattenuto']);
  });
});

describe('i mostri negli incontri', () => {
  it('daMostro riempie nome, GS, iniziativa, PF, CA e immunità; il GS 0 da 10 PE diventa «0*»', () => {
    const z = daMostro(per('Zombie'));
    expect(z).toMatchObject({ nome: 'Zombi', gs: '1/4', iniziativa: -2, pf: 15, ca: 8, mostro: 'zombie' });
    expect(daMostro(per('Commoner')).gs).toBe(per('Commoner').pe === 10 ? '0*' : '0');
    expect(peNemici([{ id: 'a', quanti: 3, ...daMostro(per('Goblin Warrior')) }])).toBe(150);
  });
  it('la ricerca trova anche in inglese e senza accenti, e filtra per grado di sfida', () => {
    expect(cercaMostri(M, 'goblin').map((m) => m.nomeEn).sort()).toEqual(['Goblin Boss', 'Goblin Minion', 'Goblin Warrior', 'Hobgoblin Captain', 'Hobgoblin Warrior']);
    expect(cercaMostri(M, 'drago d oro').length).toBe(0);
    expect(cercaMostri(M, "drago d'oro")).toHaveLength(4);
    expect(cercaMostri(M, 'owlbear')[0].nome).toBe('Orsogufo');
    expect(cercaMostri(M, '', '30').map((m) => m.nomeEn)).toEqual(['Tarrasque']);
  });
  it('in combattimento la CA passa al combattente e le immunità bloccano le condizioni', () => {
    let c = tiraIniziativa([], [{ id: 'z', quanti: 2, ...daMostro(per('Zombie')) }], () => 10);
    const z = c.ordine[0];
    expect(z.ca).toBe(8);
    expect(z.condizioni).toEqual([[], []]);
    c = cambiaCondizioneNemico(c, z.id, 1, 'prono', true);
    c = cambiaCondizioneNemico(c, z.id, 1, 'avvelenato', true);          // immune: non si segna
    expect(c.ordine[0].condizioni).toEqual([[], ['prono']]);
    c = cambiaCondizioneNemico(c, z.id, 1, 'prono', false);
    expect(c.ordine[0].condizioni).toEqual([[], []]);
  });
});
