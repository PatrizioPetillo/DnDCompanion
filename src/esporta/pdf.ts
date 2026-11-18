// PDF stampabile (sezione 5.4): A4, leggibile anche in bianco e nero, con l'attribuzione dell'SRD (sezione 4).
// Libreria pdf-lib (scelta di Patrizio, 18/11): questo modulo si carica solo quando si esporta.
// Font standard Helvetica (codifica WinAnsi): i caratteri fuori codifica si sostituiscono con perPdf().
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib';
import type { Bozza } from '../creazione/percorso';
import { avvisiRiepilogo, riepilogo, type Riepilogo } from '../creazione/riepilogo';
import { prezzo } from '../creazione/equipaggiamento';
import { metri } from '../regole/misure';
import { ATTRIBUZIONE_SRD_52, ATTRIBUZIONE_SRD_521_IT, CREDITI } from '../licenza';

// Caratteri che Helvetica (WinAnsi) non ha: sostituiti con un equivalente; il resto fuori codifica diventa «?»
const SOSTITUZIONI: Record<string, string> = { '−': '-', '★': '*', '☆': '*', '●': '•', '○': 'o', '→': '->', '≥': '>=', '≤': '<=', ' ': ' ', '­': '' };
const WINANSI_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');
export function perPdf(testo: string): string {
  return [...testo].map((c) => {
    if (SOSTITUZIONI[c] !== undefined) return SOSTITUZIONI[c];
    const n = c.codePointAt(0)!;
    return (n >= 0x20 && n <= 0x7e) || (n >= 0xa0 && n <= 0xff) || WINANSI_EXTRA.has(c) ? c : '?';
  }).join('');
}

const A4 = { l: 595.28, h: 841.89 };
const MARGINE = 36;
const NERO = rgb(0.17, 0.14, 0.13);          // inchiostro #2B2320
const ROSSO = rgb(0.43, 0.1, 0.1);           // #6E1A1A
const GRIGIO = rgb(0.4, 0.37, 0.35);
const LINEA = rgb(0.75, 0.7, 0.62);

// Scrive testo che va a capo, in una colonna; passa alla pagina dopo quando finisce lo spazio
class Colonna {
  pagina: PDFPage; x: number; larghezza: number; y: number;
  private f: { r: PDFFont; b: PDFFont };
  private nuovaPagina: () => PDFPage;
  constructor(pagina: PDFPage, f: { r: PDFFont; b: PDFFont }, x: number, larghezza: number, y: number, nuovaPagina: () => PDFPage) {
    this.pagina = pagina; this.f = f; this.x = x; this.larghezza = larghezza; this.y = y; this.nuovaPagina = nuovaPagina;
  }

  private spazio(alto: number) {
    if (this.y - alto < MARGINE + 40) { this.pagina = this.nuovaPagina(); this.y = A4.h - MARGINE; }
  }
  righe(testo: string, dim: number, grassetto = false, larghezza = this.larghezza): string[] {
    const font = grassetto ? this.f.b : this.f.r;
    const parole = perPdf(testo).split(' ');
    const out: string[] = [];
    let riga = '';
    for (const p of parole) {
      const prova = riga ? `${riga} ${p}` : p;
      if (font.widthOfTextAtSize(prova, dim) <= larghezza || !riga) riga = prova;
      else { out.push(riga); riga = p; }
    }
    if (riga) out.push(riga);
    return out;
  }
  testo(testo: string, o: { dim?: number; grassetto?: boolean; colore?: ReturnType<typeof rgb>; rientro?: number; dopo?: number } = {}) {
    const dim = o.dim ?? 9, rientro = o.rientro ?? 0;
    for (const r of this.righe(testo, dim, o.grassetto, this.larghezza - rientro)) {
      this.spazio(dim * 1.3);
      this.y -= dim * 1.3;
      this.pagina.drawText(r, { x: this.x + rientro, y: this.y, size: dim, font: o.grassetto ? this.f.b : this.f.r, color: o.colore ?? NERO });
    }
    this.y -= o.dopo ?? 0;
  }
  // Testo a sinistra e valore allineato a destra sulla stessa riga
  coppia(sinistra: string, destra: string, o: { dim?: number; grassetto?: boolean; rientro?: number } = {}) {
    const dim = o.dim ?? 9, font = o.grassetto ? this.f.b : this.f.r;
    this.spazio(dim * 1.3);
    this.y -= dim * 1.3;
    const d = perPdf(destra);
    this.pagina.drawText(perPdf(sinistra), { x: this.x + (o.rientro ?? 0), y: this.y, size: dim, font, color: NERO });
    this.pagina.drawText(d, { x: this.x + this.larghezza - font.widthOfTextAtSize(d, dim), y: this.y, size: dim, font, color: NERO });
  }
  titolo(testo: string) {
    this.spazio(28);
    this.y -= 8;
    this.testo(testo.toUpperCase(), { dim: 9, grassetto: true, colore: ROSSO });
    this.y -= 3;
    this.pagina.drawLine({ start: { x: this.x, y: this.y }, end: { x: this.x + this.larghezza, y: this.y }, thickness: 0.6, color: LINEA });
    this.y -= 2;
  }
}

export async function creaPdf(b: Bozza, oggi = new Date()): Promise<Uint8Array> {
  const r = riepilogo(b);
  if (!r) throw new Error('Scheda incompleta: mancano classe, specie o background');
  const doc = await PDFDocument.create();
  doc.setTitle(perPdf(r.testata.nome));
  doc.setSubject(perPdf(r.testata.descrizione));
  doc.setCreator('Companion B20');
  doc.setProducer('Companion B20 (pdf-lib)');
  const f = { r: await doc.embedFont(StandardFonts.Helvetica), b: await doc.embedFont(StandardFonts.HelveticaBold) };
  const nuovaPagina = () => doc.addPage([A4.l, A4.h]);
  const p1 = nuovaPagina();

  // ───────── Testata ─────────
  let y = A4.h - MARGINE;
  p1.drawText(perPdf(r.testata.nome), { x: MARGINE, y: y - 20, size: 20, font: f.b, color: ROSSO });
  p1.drawText(perPdf(r.testata.descrizione), { x: MARGINE, y: y - 36, size: 10, font: f.r, color: NERO });
  y -= 50;

  // ───────── Riquadri dei numeri ─────────
  const numeri = r.combattimento.numeri;
  const largo = (A4.l - 2 * MARGINE - 5 * 6) / 6;
  numeri.forEach((n, i) => {
    const x = MARGINE + i * (largo + 6);
    p1.drawRectangle({ x, y: y - 42, width: largo, height: 42, borderColor: LINEA, borderWidth: 0.8 });
    const v = perPdf(n.valore);
    p1.drawText(v, { x: x + (largo - f.b.widthOfTextAtSize(v, 15)) / 2, y: y - 22, size: 15, font: f.b, color: NERO });
    const e = perPdf(n.etichetta);
    const dim = f.r.widthOfTextAtSize(e, 7) > largo - 4 ? 6 : 7;
    p1.drawText(e, { x: x + (largo - f.r.widthOfTextAtSize(e, dim)) / 2, y: y - 35, size: dim, font: f.r, color: GRIGIO });
  });
  y -= 52;

  // ───────── Colonna sinistra: caratteristiche, tiri salvezza, abilità ─────────
  const sx = new Colonna(p1, f, MARGINE, 170, y, nuovaPagina);
  sx.titolo('Caratteristiche e abilità');
  for (const c of r.abilita) {
    const ts = r.combattimento.tiriSalvezza.find((t) => t.car === c.car)!;
    sx.coppia(`${c.nome}`, `${c.punteggio} (${c.mod})`, { grassetto: true, dim: 9.5 });
    sx.coppia(`${ts.competente ? '•' : '  '} Tiro salvezza`, ts.valore, { rientro: 6 });
    for (const v of c.voci) sx.coppia(`${v.maestria ? '••' : v.competente ? '•' : '  '} ${v.nome}`, v.valore, { rientro: 6 });
    sx.y -= 3;
  }
  sx.testo('• competenza   •• maestria', { dim: 7, colore: GRIGIO });

  // ───────── Colonna destra: attacchi, risorse, magia ─────────
    const dx = new Colonna(p1, f, MARGINE + 186, A4.l - 2 * MARGINE - 186, y, (): PDFPage => {
    const p = doc.getPages()[doc.getPageCount() - 1];
    return p === dx.pagina ? nuovaPagina() : p;
  });
  dx.titolo('Attacchi');
  for (const a of r.combattimento.attacchi) {
    dx.coppia(`${a.nome}${a.quantita > 1 ? ` × ${a.quantita}` : ''}`, `${a.colpire.totale >= 0 ? '+' : '-'}${Math.abs(a.colpire.totale)} per colpire`, { grassetto: true });
    const dettagli = [a.danni.testo, a.danni.testoDueMani ? `a due mani ${a.danni.testoDueMani}` : '',
      a.gittata ? `gittata ${metri(a.gittata[0]).replace(' metri', '')}/${metri(a.gittata[1])}` : '', a.padronanza ? `Padronanza: ${a.padronanza}` : ''].filter(Boolean).join(' · ');
    dx.testo(dettagli, { rientro: 6 });
    for (const n of a.note) dx.testo(n, { rientro: 6, dim: 8, colore: GRIGIO });
  }
  for (const t of r.combattimento.trucchetti) {
    dx.coppia(t.nome, t.tiro, { grassetto: true });
    dx.testo([t.dadi, t.nota].filter(Boolean).join(' · '), { rientro: 6 });
  }
  if (r.combattimento.risorse.length || r.combattimento.altro.length) {
    dx.titolo('Risorse e capacità');
    for (const x of r.combattimento.risorse) dx.testo(`${x.nome}: ${x.usi}${x.dettaglio ? ` (${x.dettaglio})` : ''} · ${x.recupero}`);
    for (const x of r.combattimento.altro) dx.testo(x);
  }
  if (r.magia.fonti.length) {
    dx.titolo('Magia');
    if (r.magia.slot.length) dx.testo(`Slot: ${r.magia.slot.join(' · ')}`, { dopo: 2 });
    for (const m of r.magia.fonti) {
      dx.coppia(m.nome, m.cd !== null ? `CD ${m.cd} · attacco ${m.attacco}` : '', { grassetto: true });
      if (m.trucchetti.length) dx.testo(`Trucchetti: ${m.trucchetti.join(', ')}`, { rientro: 6 });
      if (m.incantesimi.length) dx.testo(`Incantesimi: ${m.incantesimi.join(', ')}`, { rientro: 6 });
      if (m.lanciGratuiti) dx.testo(m.lanciGratuiti, { rientro: 6 });
      for (const n of m.note) dx.testo(n, { rientro: 6, dim: 8, colore: GRIGIO });
      dx.y -= 3;
    }
  }

  // ───────── Il resto, a tutta larghezza, dopo le due colonne ─────────
  const ultima = doc.getPages()[doc.getPageCount() - 1];
  const yFine = Math.min(sx.pagina === ultima ? sx.y : A4.h - MARGINE, dx.pagina === ultima ? dx.y : A4.h - MARGINE);
  const tutto = new Colonna(ultima, f, MARGINE, A4.l - 2 * MARGINE, yFine, nuovaPagina);
  scriviResto(tutto, r, b);

  // ───────── Piè di pagina: attribuzione (sezione 4), crediti, data ─────────
  const pagine = doc.getPages();
  pagine.forEach((p, i) => {
    p.drawText(perPdf(`${CREDITI} · ${oggi.toLocaleDateString('it-IT')} · pagina ${i + 1} di ${pagine.length}`), { x: MARGINE, y: 22, size: 7, font: f.r, color: GRIGIO });
  });
  const piede = new Colonna(pagine[pagine.length - 1], f, MARGINE, A4.l - 2 * MARGINE, tutto.y - 10, nuovaPagina);
  piede.titolo('Licenza');
  piede.testo(ATTRIBUZIONE_SRD_52, { dim: 6.5, colore: GRIGIO });
  piede.testo(ATTRIBUZIONE_SRD_521_IT, { dim: 6.5, colore: GRIGIO });
  return doc.save();
}

function scriviResto(c: Colonna, r: Riepilogo, b: Bozza) {
  c.titolo('Zaino');
  const m = r.zaino.monete.totale;
  c.testo(`Monete: ${m < 0 ? `-${prezzo(-m)}` : prezzo(m)}`, { grassetto: true });
  c.testo(r.zaino.inventario.map((v) => `${v.quantita > 1 ? `${v.quantita} × ` : ''}${v.nome}${v.contenuto ? ` (${v.contenuto.map((x) => `${x.quantita > 1 ? `${x.quantita} ` : ''}${x.nome}`).join(', ')})` : ''}`).join('; ') || 'Vuoto');

  c.titolo('Chi è');
  for (const x of r.chiE.righe) c.testo(`${x.etichetta}: ${x.valore}`);
  c.testo(`Privilegi e talenti: ${r.chiE.privilegi.join(', ')}`, { dopo: 2 });

  // Per il master (sezione 5.1): le eccezioni accettate e gli avvisi ancora aperti
  const avvisi = avvisiRiepilogo(b);
  if (avvisi.length) {
    c.titolo('Per il master');
    for (const a of avvisi) c.testo(`${a.accettato ? 'Eccezione accettata' : 'Da controllare'}: ${a.messaggio}${a.srd?.pagina ? ` (SRD p. ${a.srd.pagina})` : ''}`, { dim: 8 });
  }
}
