// Passo Equipaggiamento: pacchetti, negozio ridotto, acquisti (SRD p. 23, 89-98).
import { describe, expect, it } from 'vitest';
import { aggiungiPersonalizzato, compra, negozio, opzioniPacchetto, prezzo, scegliPacchetto, togli } from '../src/creazione/equipaggiamento';
import { calcolaScheda } from '../src/regole/motore';
import * as P from './personaggi';

const reparto = (b: Parameters<typeof negozio>[0], id: string) => negozio(b).find((r) => r.id === id);

describe('Prezzi come nell\'SRD (p. 89)', () => {
  it('mo, ma, mr', () => {
    expect(prezzo(2)).toBe('2 mo');
    expect(prezzo(0.5)).toBe('5 ma');
    expect(prezzo(0.05)).toBe('5 mr');
    expect(prezzo(1.5)).toBe('1 mo 5 ma');
    expect(prezzo(1500)).toBe('1.500 mo');
  });
});

describe('Pacchetti', () => {
  it('Mago: A con il contenuto e 5 mo, B con 55 mo', () => {
    const [a, b] = opzioniPacchetto(P.TRAVIS, 'classe');
    expect(a).toEqual({ id: 'A', mo: 5, voci: ['2 × Pugnale', 'Focus arcano (bastone)', 'Tunica', 'Libro degli incantesimi', 'Dotazione da studioso'] });
    expect(b).toEqual({ id: 'B', mo: 55, voci: [] });
  });
  it('Guerriero: tre opzioni', () => {
    expect(opzioniPacchetto(P.GUERRIERO, 'classe').map((o) => o.id)).toEqual(['A', 'B', 'C']);
  });
  it('il bardo passa a B: la scelta dello strumento si toglie', () => {
    const b = scegliPacchetto(P.BARDO, 'classe', 'B');
    expect(b.equipaggiamento?.classe).toBe('B');
    expect(b.scelte['bard.equip.strumento']).toBeUndefined();
    expect(b.scelte['bard.strumenti']).toEqual(['lute', 'flute', 'drum']);   // le competenze restano
  });
});

describe('Negozio', () => {
  it('mago: focus arcani e borsa per componenti, niente simbolo sacro; i materiali dei suoi incantesimi in cima', () => {
    const r = negozio(P.TRAVIS);
    expect(r[0].id).toBe('materiali');
    expect(r[0].articoli.map((a) => [a.id, a.prezzo])).toEqual([['materiale:find-familiar', 10], ['materiale:identify', 100]]);
    const focus = reparto(P.TRAVIS, 'focus')!.articoli.map((a) => a.id);
    expect(focus).toContain('arcane-focus-orb');
    expect(focus).toContain('component-pouch');
    expect(focus).not.toContain('holy-symbol');
  });
  it('note: armi senza competenza, armature senza addestramento o con Forza insufficiente', () => {
    const guerra = reparto(P.TRAVIS, 'armi-guerra')!.articoli;
    expect(guerra.find((a) => a.id === 'longsword')?.nota).toBe('senza competenza');
    expect(reparto(P.TRAVIS, 'armature')!.articoli.find((a) => a.id === 'leather-armor')?.nota).toBe('senza addestramento');
    expect(reparto(P.LADRO, 'armi-guerra')!.articoli.find((a) => a.id === 'rapier')?.nota).toBeUndefined();
    expect(reparto(P.CHIERICO, 'armature')!.articoli.find((a) => a.id === 'chain-mail')?.nota).toBeUndefined();   // Protettore: armature pesanti
    expect(reparto(P.BARDO, 'armature')!.articoli.find((a) => a.id === 'chain-mail')?.nota).toBe('senza addestramento');
  });
  it('troppo caro: più delle monete rimaste', () => {
    expect(reparto(P.TRAVIS, 'armature')!.articoli.find((a) => a.id === 'plate-armor')?.troppoCaro).toBe(true);
    expect(reparto(P.TRAVIS, 'armi-semplici')!.articoli.find((a) => a.id === 'dagger')?.troppoCaro).toBe(false);
  });
  it('compra e togli; le frecce a confezioni da 20', () => {
    let b = compra(P.TRAVIS, 'arrows');
    expect(b.equipaggiamento!.extra).toEqual([{ oggetto: 'arrows', quantita: 20 }]);
    expect(reparto(b, 'munizioni')!.articoli.find((a) => a.id === 'arrows')).toMatchObject({ nome: 'Frecce (20)', prezzo: 1, comprati: 20 });
    b = compra(b, 'arrows');
    expect(b.equipaggiamento!.extra![0].quantita).toBe(40);
    b = togli(togli(b, 'arrows'), 'arrows');
    expect(b.equipaggiamento!.extra).toEqual([]);
  });
  it('comprare l\'incenso toglie l\'avviso e scala le monete', () => {
    const b = compra(P.TRAVIS, 'materiale:find-familiar');
    const s = calcolaScheda({ ...P.TRAVIS, ...b } as typeof P.TRAVIS);
    expect(s.avvisi.map((a) => a.id)).not.toContain('materiale:find-familiar');
    expect(s.monete.totale).toBe(3);
  });
  it('oggetto personalizzato', () => {
    const b = aggiungiPersonalizzato(P.TRAVIS, 'Corda di seta', 10);
    expect(b.equipaggiamento!.extra![0]).toMatchObject({ nome: 'Corda di seta', costoMo: 10, quantita: 1 });
    expect(b.equipaggiamento!.extra![0].oggetto).toMatch(/^personalizzato:/);
  });
});
