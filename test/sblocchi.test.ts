// Oggetti da identificare (21/11): cifratura, link, nessun bonus finché è velato, sblocco
import { describe, expect, it } from 'vitest';
import { cifra, decifra, idDaSegreto, leggiQR, nuoveChiavi, testoQR } from '../src/sblocchi/cifra';
import { aggiungiOggettoVelato, nuovo, archivioVuoto, oggettiVelati, type OggettoDelMaster } from '../src/archivio/archivio';
import { creaLinkOggetto, leggiLinkOggetto } from '../src/esporta/link';
import { applicaChiave } from '../src/ui/useSblocchi';
import { calcolaScheda } from '../src/regole';
import * as P from './personaggi';

async function oggetto(): Promise<OggettoDelMaster> {
  const k = await nuoveChiavi();
  return { uid: 'm1', apparente: 'Anello d\'osso inciso', aspetto: 'Un anello giallastro con rune sottili.', maledizione: 'Chi lo indossa sogna il Re Pallido',
    svelato: { nome: 'Anello del Custode', sintonia: true, riga: '+1 alla CA', bonus: { ca: 1 } }, ...k };
}

describe('Sblocchi', () => {
  it('l\'id è l\'impronta del segreto, e la chiave sbagliata non decifra', async () => {
    const k = await nuoveChiavi();
    expect(await idDaSegreto(k.segreto)).toBe(k.id);
    expect(k.id).toMatch(/^[A-Za-z0-9_-]{22}$/);
    const c = await cifra({ a: 1 }, k.chiave);
    expect(await decifra(c, k.chiave)).toEqual({ a: 1 });
    expect(await decifra(c, (await nuoveChiavi()).chiave)).toBeNull();
  });
  it('il link porta aspetto e testo cifrato, mai la maledizione né il nome vero in chiaro', async () => {
    const o = await oggetto();
    const link = await creaLinkOggetto(o, 'https://x.app/', 'La Corona');
    const r = await leggiLinkOggetto(link.slice(link.indexOf('#')));
    expect(r && 'velo' in r).toBe(true);
    const v = (r as { velo: import('../src/regole/tipi').Velo }).velo;
    expect(v.apparente).toBe('Anello d\'osso inciso');
    expect(v.sblocco).toBe(o.id);
    expect(JSON.stringify(v)).not.toContain('Custode');
    expect(JSON.stringify(v)).not.toContain('Pallido');
  });
  it('velato non dà bonus; dopo lo sblocco sì, e l\'aspetto resta', async () => {
    const o = await oggetto();
    const link = await creaLinkOggetto(o, 'https://x.app/');
    const { velo } = (await leggiLinkOggetto(link.slice(link.indexOf('#')))) as { velo: import('../src/regole/tipi').Velo };
    let { archivio: a, id } = nuovo(archivioVuoto(), P.TRAVIS);
    a = aggiungiOggettoVelato(a, id, velo).archivio;
    expect(aggiungiOggettoVelato(a, id, velo).giaPresente).toBe(true);
    const pg = () => a.personaggi[0].bozza;
    const ca = () => { const s = calcolaScheda(pg()); return s.ca.formule.find((f) => f.id === s.ca.attuale)!.valore.totale; };
    expect(ca()).toBe(11);
    expect(oggettiVelati(a)).toHaveLength(1);
    expect((await applicaChiave(a, o.id, (await nuoveChiavi()).chiave)).nomi).toEqual([]);   // chiave sbagliata
    const r = await applicaChiave(a, o.id, o.chiave);
    expect(r.nomi).toEqual(['Anello del Custode']);
    a = r.archivio;
    const om = pg().oggettiMagici![0];
    expect(om.velato).toBeUndefined();
    expect(om.aspetto).toContain('rune');
    expect(ca()).toBe(11);                                   // richiede sintonia: ora si può sintonizzare
    a = { ...a, personaggi: [{ ...a.personaggi[0], bozza: { ...pg(), oggettiMagici: [{ ...om, sintonizzato: true }] } }] };
    expect(ca()).toBe(12);
  });
  it('QR di riserva', async () => {
    const k = await nuoveChiavi();
    expect(leggiQR(testoQR(k.id, k.chiave))).toEqual({ id: k.id, chiave: k.chiave });
    expect(leggiQR('ciao')).toBeNull();
  });
});
