// Uso al tavolo (sezione 6.2): PF, slot, risorse, lanci gratuiti, concentrazione, riposi (SRD p. 18, 71, 104-106, 179, 185, 187).
import { describe, expect, it } from 'vitest';
import { calcolaScheda } from '../src/regole/motore';
import { cura, danno, fineConcentrazione, lancia, modiDiLancio, riposoBreve, riposoLungo, segnaRisorsa, spendiDadoVita, statoVuoto, temporanei, tiroMorte, vista } from '../src/partita/partita';
import * as P from './personaggi';

const travis = calcolaScheda(P.TRAVIS);
const mago = travis.magia.find((m) => m.id === 'wizard')!;
const iniziato = travis.magia.find((m) => m.id === 'magic-initiate')!;

describe('Vista di partenza di Travis', () => {
  it('PF pieni, 2 slot di 1°, Recupero arcano, Parola guaritrice gratis', () => {
    const v = vista(travis, statoVuoto(), 6);
    expect(v.pf).toEqual({ attuali: 7, massimo: 7, temporanei: 0 });
    expect(v.dadiVita).toEqual({ dado: 6, totale: 1, rimasti: 1 });
    expect(v.slot).toEqual([{ livello: 1, totale: 2, rimasti: 2 }]);
    expect(v.patto).toBeNull();
    expect(v.risorse).toEqual([{ id: 'arcane-recovery', nome: 'Recupero arcano', usi: 1, rimasti: 1, recupero: 'lungo', dettaglio: 'dopo un riposo breve recuperi slot per un totale di 1 livello' }]);   // 24/11: il dettaglio arriva al tavolo
    expect(v.gratuiti).toEqual([{ magia: 'magic-initiate', incantesimi: ['healing-word'], usi: 1, rimasti: 1, recupero: 'lungo' }]);
  });
});

describe('PF (p. 18)', () => {
  it('il danno toglie prima i temporanei, poi i PF; non sotto 0', () => {
    let st = temporanei(statoVuoto(), 3);
    st = danno(st, 5, 7);
    expect(st).toMatchObject({ pfTemporanei: 0, pfPersi: 2 });
    expect(vista(travis, danno(st, 50, 7), 6).pf.attuali).toBe(0);
  });
  it('la cura non supera il massimo; i temporanei non si sommano', () => {
    expect(cura(danno(statoVuoto(), 3, 7), 10).pfPersi).toBe(0);
    expect(temporanei(temporanei(statoVuoto(), 5), 3).pfTemporanei).toBe(5);
  });
});

describe('Lanciare (p. 104-106)', () => {
  const v = vista(travis, statoVuoto(), 6);
  const modi = (m: typeof mago, id: string) => modiDiLancio(v, m, id).map((o) => o.modo.tipo + ('livello' in o.modo ? o.modo.livello : ''));
  it('mago: preparato con slot; nel libro e rituale solo come rituale (Adepto dei rituali)', () => {
    expect(modi(mago, 'shield')).toEqual(['slot1']);
    expect(modi(mago, 'find-familiar')).toEqual(['slot1', 'rituale']);
    expect(modi(mago, 'alarm')).toEqual(['rituale']);
    expect(modi(mago, 'fire-bolt')).toEqual(['trucchetto']);
  });
  it('Iniziato: gratis una volta, poi con qualsiasi slot (p. 87)', () => {
    expect(modi(iniziato, 'healing-word')).toEqual(['gratuito', 'slot1']);
    const { stato } = lancia(statoVuoto(), v, 'magic-initiate', 'healing-word', { tipo: 'gratuito' });
    const dopo = modiDiLancio(vista(travis, stato, 6), iniziato, 'healing-word');
    expect(dopo[0]).toMatchObject({ disponibile: false });
    expect(dopo[1]).toMatchObject({ disponibile: true });
  });
  it('lo slot si scarica; finiti gli slot l\'opzione è spenta', () => {
    let st = lancia(statoVuoto(), v, 'wizard', 'shield', { tipo: 'slot', livello: 1 }).stato;
    st = lancia(st, vista(travis, st, 6), 'wizard', 'mage-armor', { tipo: 'slot', livello: 1 }).stato;
    const v2 = vista(travis, st, 6);
    expect(v2.slot[0].rimasti).toBe(0);
    expect(modiDiLancio(v2, mago, 'shield')[0].disponibile).toBe(false);
  });
  it('warlock: slot del patto; un incantesimo a concentrazione interrompe il precedente (p. 179)', () => {
    const w = calcolaScheda(P.WARLOCK);
    const vw = vista(w, statoVuoto(), 8);
    const warlock = w.magia.find((m) => m.id === 'warlock')!;
    expect(modiDiLancio(vw, warlock, 'hex').map((o) => o.modo.tipo)).toEqual(['patto']);
    const r = lancia({ ...statoVuoto(), concentrazione: 'bless' }, vw, 'warlock', 'hex', { tipo: 'patto', livello: 1 });
    expect(r.interrotto).toBe('bless');
    expect(r.stato).toMatchObject({ concentrazione: 'hex', pattoUsati: 1 });
    expect(fineConcentrazione(r.stato).concentrazione).toBeNull();
    // Riposo breve: lo slot del patto torna (p. 71)
    expect(vista(w, riposoBreve(r.stato, w), 8).patto!.rimasti).toBe(1);
  });
});

describe('Riposi (p. 185, 188)', () => {
  it('breve: l\'Ira torna di 1, il resto no; lungo: tutto torna', () => {
    const b = calcolaScheda(P.BARBARO);
    let st = segnaRisorsa(segnaRisorsa(statoVuoto(), 'rage', true, 2), 'rage', true, 2);
    st = danno(st, 6, b.pf.totale);
    const breve = riposoBreve(st, b);
    expect(breve.risorseUsate.rage).toBe(1);
    expect(breve.pfPersi).toBe(6);
    const lungo = riposoLungo(breve);
    expect(lungo).toMatchObject({ pfPersi: 0, risorseUsate: {}, slotUsati: [], pattoUsati: 0, dadiVitaUsati: 0 });
  });
  it('dado vita al riposo breve: tiro + COS, almeno 1; uno solo al livello 1', () => {
    let st = danno(statoVuoto(), 6, 7);
    st = spendiDadoVita(st, 4, 1);
    expect(st).toMatchObject({ pfPersi: 1, dadiVitaUsati: 1 });
    expect(spendiDadoVita(st, 6, 1)).toBe(st);
    expect(spendiDadoVita(danno(statoVuoto(), 6, 7), 1, -3).pfPersi).toBe(5);
  });
});

describe('Tiri salvezza contro la morte (p. 17-18)', () => {
  const a0 = () => danno(statoVuoto(), 7, 7);                       // Travis a 0 PF
  it('10 o più successo, sotto fallimento; 1 vale due; tre successi: stabile', () => {
    let st = tiroMorte(a0(), 12, 7);
    st = tiroMorte(st, 5, 7);
    expect(st.morte).toMatchObject({ successi: 1, fallimenti: 1 });
    st = tiroMorte(tiroMorte(st, 10, 7), 15, 7);
    expect(st.morte).toMatchObject({ stabile: true, successi: 0, fallimenti: 0 });
    expect(tiroMorte(a0(), 1, 7).morte.fallimenti).toBe(2);
  });
  it('20: torna a 1 PF; tre fallimenti: morto', () => {
    expect(tiroMorte(a0(), 20, 7).pfPersi).toBe(6);
    expect(tiroMorte(tiroMorte(a0(), 1, 7), 3, 7).morte.morto).toBe(true);
  });
  it('danno a 0 PF: un fallimento, due se critico; la cura azzera', () => {
    expect(danno(a0(), 2, 7).morte.fallimenti).toBe(1);
    expect(danno(a0(), 2, 7, true).morte.fallimenti).toBe(2);
    expect(cura(danno(a0(), 2, 7), 3).morte).toEqual({ successi: 0, fallimenti: 0, stabile: false, morto: false });
  });
  it('danno massiccio: il resto oltre lo 0 arriva al massimo dei PF → morto', () => {
    expect(danno(statoVuoto(), 13, 7).morte.morto).toBe(false);      // 7 per arrivare a 0, ne restano 6 < 7
    expect(danno(statoVuoto(), 14, 7).morte.morto).toBe(true);       // ne restano 7
  });
});
