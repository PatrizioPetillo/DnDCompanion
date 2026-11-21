// Oggetti magici (21/11): i bonus contano solo se l'oggetto è attivo (sintonizzato quando serve, massimo 3)
// e, per armature e scudi, solo se indossati (SRD p. 102-103, 209-250).
import { describe, expect, it } from 'vitest';
import { calcolaScheda } from '../src/regole';
import * as P from './personaggi';

const ca = (s: ReturnType<typeof calcolaScheda>) => s.ca.formule.find((f) => f.id === s.ca.attuale)!.valore.totale;

describe('Oggetti magici', () => {
  it('Anello di protezione: +1 a CA e tiri salvezza solo da sintonizzato', () => {
    const non = calcolaScheda({ ...P.TRAVIS, oggettiMagici: [{ uid: 'a', id: 'ring-of-protection' }] });
    expect(ca(non)).toBe(11);
    const si = calcolaScheda({ ...P.TRAVIS, oggettiMagici: [{ uid: 'a', id: 'ring-of-protection', sintonizzato: true }] });
    expect(ca(si)).toBe(12);
    expect(si.tiriSalvezza.INT.totale).toBe(calcolaScheda(P.TRAVIS).tiriSalvezza.INT.totale + 1);
    expect(si.ca.formule.find((f) => f.id === si.ca.attuale)!.valore.termini.some((t) => t.etichetta === 'Anello di protezione')).toBe(true);
  });
  it('Bracciali della difesa: +2 solo senza armatura né scudo', () => {
    const g = { ...P.GUERRIERO, oggettiMagici: [{ uid: 'b', id: 'bracers-of-defense', sintonizzato: true }] };
    expect(ca(calcolaScheda(g))).toBe(17);                                 // con la cotta di maglia: nessun effetto
    expect(ca(calcolaScheda({ ...g, equip: { armatura: 'nessuna' } }))).toBe(13);   // 11 + 2
  });
  it('Armatura +1 su una cotta di maglia che non aveva: la indossa e vale 18 (+ Difesa 1 = 19)', () => {
    const s = calcolaScheda({ ...P.GUERRIERO, oggettiMagici: [{ uid: 'c', id: 'armor-plus', variante: '+1', base: 'chain-mail' }], equip: { armatura: 'chain-mail' } });
    expect(ca(s)).toBe(18);
  });
  it('Amuleto della salute: COS 19 e i PF si ricalcolano', () => {
    const base = calcolaScheda(P.TRAVIS);
    const s = calcolaScheda({ ...P.TRAVIS, oggettiMagici: [{ uid: 'd', id: 'amulet-of-health', sintonizzato: true }] });
    expect(s.punteggi.COS.totale).toBe(19);
    expect(s.pf.totale).toBe(base.pf.totale - base.modificatori.COS + 4);
  });
  it('Spada lunga +1: un attacco a parte, +1 al colpire e ai danni', () => {
    const s = calcolaScheda({ ...P.GUERRIERO, oggettiMagici: [{ uid: 'e', id: 'weapon-plus', variante: '+1', base: 'longsword' }] });
    const a = s.attacchi.find((x) => x.id === 'magico:e')!;
    expect(a.nome).toBe('Spada lunga +1');
    expect(a.colpire.termini.at(-1)).toEqual({ etichetta: 'Spada lunga +1', valore: 1 });
    expect(a.danni.mod).toBe(s.modificatori.FOR + 1);
  });
  it('Bacchetta del mago da guerra +1: +1 all\'attacco con incantesimi, non alla CD', () => {
    const base = calcolaScheda(P.TRAVIS).magia.find((m) => m.id === 'wizard')!;
    const m = calcolaScheda({ ...P.TRAVIS, oggettiMagici: [{ uid: 'f', id: 'wand-of-the-war-mage', variante: '+1', sintonizzato: true }] }).magia.find((x) => x.id === 'wizard')!;
    expect(m.attacco!.totale).toBe(base.attacco!.totale + 1);
    expect(m.cd!.totale).toBe(base.cd!.totale);
  });
  it('più di 3 oggetti sintonizzati: errore', () => {
    const quattro = ['ring-of-protection', 'cloak-of-protection', 'amulet-of-health', 'stone-of-good-luck'].map((id, i) => ({ uid: `s${i}`, id, sintonizzato: true }));
    expect(calcolaScheda({ ...P.TRAVIS, oggettiMagici: quattro }).avvisi.some((a) => a.id === 'sintonia-troppi')).toBe(true);
  });
  it('oggetto personalizzato: i bonus scritti dal giocatore', () => {
    const s = calcolaScheda({ ...P.TRAVIS, oggettiMagici: [{ uid: 'g', id: 'personalizzato', personalizzato: { nome: 'Spilla del custode', sintonia: false, bonus: { ca: 1, cdIncantesimi: 1 } } }] });
    expect(ca(s)).toBe(12);
    expect(s.magia.find((m) => m.id === 'wizard')!.cd!.totale).toBe(calcolaScheda(P.TRAVIS).magia.find((m) => m.id === 'wizard')!.cd!.totale + 1);
  });
});
