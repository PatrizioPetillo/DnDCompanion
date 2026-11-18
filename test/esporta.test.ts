// Esportazione: PDF (pdf-lib) e link della scheda (sezione 5.4).
import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { creaPdf, perPdf } from '../src/esporta/pdf';
import { creaLink, leggiLink } from '../src/esporta/link';
import { bozzaVuota } from '../src/creazione/percorso';
import { ATTRIBUZIONE_SRD_52 } from '../src/licenza';
import * as P from './personaggi';

describe('PDF', () => {
  it('caratteri fuori codifica sostituiti, accenti italiani tenuti', () => {
    expect(perPdf('Forza −1 · città «più» ★')).toBe('Forza -1 · città «più» *');
    expect(perPdf('Drago 🐉')).toBe('Drago ?');
  });
  it('Travis: PDF valido, A4, con titolo e attribuzione', async () => {
    const byte = await creaPdf(P.TRAVIS, new Date(2026, 10, 18));
    expect(new TextDecoder().decode(byte.slice(0, 5))).toBe('%PDF-');
    const doc = await PDFDocument.load(byte);
    expect(doc.getTitle()).toBe('Travis Whippletorn');
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(doc.getPage(0).getSize().width).toBeCloseTo(595.28, 1);
    expect(ATTRIBUZIONE_SRD_52).toMatch(/^This work includes material from the System Reference Document 5\.2/);
  });
  it('tutti i 12 personaggi di prova si esportano senza errori', async () => {
    for (const pg of [P.BARBARO, P.BARDO, P.CHIERICO, P.DRUIDO, P.GUERRIERO, P.MONACO, P.PALADINO, P.RANGER, P.LADRO, P.STREGONE, P.WARLOCK, P.TRAVIS, P.TRAVIS_SAGGIO])
      expect((await creaPdf(pg)).length).toBeGreaterThan(1000);
  });
  it('senza classe, specie o background: errore chiaro', async () => {
    await expect(creaPdf(bozzaVuota())).rejects.toThrow(/Scheda incompleta/);
  });
});

describe('Link della scheda', () => {
  it('andata e ritorno; la parte dopo # contiene la scheda compressa', async () => {
    const link = await creaLink(P.TRAVIS, 'https://companion.example/#vecchio');
    expect(link.startsWith('https://companion.example/#scheda=')).toBe(true);
    expect(link.length).toBeLessThan(1500);
    const r = await leggiLink(link.slice(link.indexOf('#')));
    expect(r && 'bozza' in r && r.bozza).toEqual(P.TRAVIS);
  });
  it('un indirizzo senza scheda non fa niente; uno rovinato dà un messaggio', async () => {
    expect(await leggiLink('#altro')).toBeNull();
    expect(await leggiLink('#scheda=abc')).toEqual({ errore: 'Il link della scheda è rovinato o incompleto: chiedi di rimandarlo.' });
  });
});
