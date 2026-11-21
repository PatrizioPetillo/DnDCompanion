// PDF della scheda (sezione 5.4), con il layout dell'app (richiesta di Patrizio, 19/11): pergamena, riquadri con
// bordo d'ottone, titoli in Cinzel, i sei numeri in riquadri, le caratteristiche su due colonne come nella creazione
// (FOR DES COS | INT SAG CAR), poi combattimento, magia, zaino, chi è, note per il master e l'attribuzione dell'SRD.
// Librerie pdf-lib + fontkit (per Cinzel): questo modulo si carica solo quando si esporta.
// Il testo usa Helvetica (codifica WinAnsi): i caratteri fuori codifica si sostituiscono con perPdf().
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFImage, type PDFPage, type RGB } from 'pdf-lib';
import type { Bozza } from '../creazione/percorso';
import { avvisiRiepilogo, riepilogo, type Riepilogo } from '../creazione/riepilogo';
import { prezzo } from '../creazione/equipaggiamento';
import { metri } from '../regole/misure';
import { ATTRIBUZIONE_SRD_52, ATTRIBUZIONE_SRD_521_IT, CREDITI } from '../licenza';

// Caratteri che Helvetica (WinAnsi) non ha: sostituiti con un equivalente; il resto fuori codifica diventa «?»
const SOSTITUZIONI: Record<string, string> = { '−': '-', '★': '*', '☆': '*', '●': '•', '○': 'o', '→': '->', '≥': '>=', '≤': '<=', ' ': ' ', '­': '', '\n': ' ', '\r': '' };   // a capo della storia: uno spazio (il PDF va a capo da solo)
const WINANSI_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');
export function perPdf(testo: string): string {
  return [...testo].map((c) => {
    if (SOSTITUZIONI[c] !== undefined) return SOSTITUZIONI[c];
    const n = c.codePointAt(0)!;
    return (n >= 0x20 && n <= 0x7e) || (n >= 0xa0 && n <= 0xff) || WINANSI_EXTRA.has(c) ? c : '?';
  }).join('');
}

// Colori del tema giorno dell'app (src/index.css)
const esa = (h: string) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const C = {
  sfondo: esa('#F3E9D2'), superficie: esa('#FAF4E6'), bordo: esa('#D6C59D'), testo: esa('#2B2320'), testo2: esa('#6B5434'),
  accento: esa('#6E1A1A'), oro: esa('#B08A3E'), attenzione: esa('#A8481E'), suAccento: esa('#FAF4E6'),
};
const A4 = { l: 595.28, h: 841.89 };
const M = 28;                               // margine
const PIEDE = 30;                           // spazio in fondo per il piè di pagina
const LARGO = A4.l - 2 * M;

interface Font { r: PDFFont; b: PDFFont; t: PDFFont }   // regolare, grassetto, titoli (Cinzel)

// Una riga dentro un riquadro
interface Riga {
  testo: string; dim?: number; grassetto?: boolean; colore?: RGB; rientro?: number;
  destra?: string;                          // valore allineato a destra (allora la riga non va a capo)
  punto?: 'pieno' | 'vuoto' | 'maestria';   // il pallino delle abilità, come nell'app
  dopo?: number;
}
interface Riquadro { titolo?: string; righe: Riga[]; bordo?: RGB; spesso?: boolean }

// Rettangolo con gli angoli arrotondati (come rounded-xl)
function rettangolo(p: PDFPage, x: number, y: number, w: number, h: number, o: { fondo?: RGB; bordo?: RGB; spessore?: number; raggio?: number }) {
  const r = Math.min(o.raggio ?? 8, w / 2, h / 2);
  const path = `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
  p.drawSvgPath(path, { x, y: y + h, color: o.fondo, borderColor: o.bordo, borderWidth: o.bordo ? o.spessore ?? 0.8 : 0 });
}

// Testo a capo dentro una larghezza
function aCapo(testo: string, font: PDFFont, dim: number, larghezza: number): string[] {
  const out: string[] = [];
  let riga = '';
  for (const p of perPdf(testo).split(' ')) {
    const prova = riga ? `${riga} ${p}` : p;
    if (font.widthOfTextAtSize(prova, dim) <= larghezza || !riga) riga = prova;
    else { out.push(riga); riga = p; }
  }
  if (riga) out.push(riga);
  return out;
}

class Impaginatore {
  pagina!: PDFPage;
  y = 0;
  private doc: PDFDocument;
  private f: Font;
  constructor(doc: PDFDocument, f: Font) { this.doc = doc; this.f = f; this.nuova(); }
  nuova() {
    this.pagina = this.doc.addPage([A4.l, A4.h]);
    this.pagina.drawRectangle({ x: 0, y: 0, width: A4.l, height: A4.h, color: C.sfondo });
    this.y = A4.h - M;
  }
  serve(alto: number) { if (this.y - alto < PIEDE + 8) this.nuova(); }

  // Titolo di sezione: Cinzel, con la riga sottile ai lati (come i separatori dell'app)
  sezione(titolo: string) {
    this.serve(40);
    this.y -= 18;
    const t = perPdf(titolo);
    const w = this.f.t.widthOfTextAtSize(t, 11);
    const x = (A4.l - w) / 2;
    this.pagina.drawText(t, { x, y: this.y, size: 11, font: this.f.t, color: C.accento });
    this.pagina.drawLine({ start: { x: M, y: this.y + 4 }, end: { x: x - 8, y: this.y + 4 }, thickness: 0.5, color: C.bordo });
    this.pagina.drawLine({ start: { x: x + w + 8, y: this.y + 4 }, end: { x: A4.l - M, y: this.y + 4 }, thickness: 0.5, color: C.bordo });
    this.y -= 8;
  }

  // Altezza e disegno di un riquadro in una colonna data
  private misura(r: Riquadro, w: number) {
    let h = 16;
    if (r.titolo) h += 14;
    for (const x of r.righe) {
      const dim = x.dim ?? 8.5;
      const n = x.destra !== undefined ? 1 : aCapo(x.testo, x.grassetto ? this.f.b : this.f.r, dim, w - 20 - (x.rientro ?? 0) - (x.punto ? 9 : 0)).length;
      h += n * dim * 1.35 + (x.dopo ?? 0);
    }
    return h;
  }
  riquadro(r: Riquadro, x = M, w = LARGO, yInizio = this.y): number {
    const h = this.misura(r, w);
    const y = yInizio - h;
    rettangolo(this.pagina, x, y, w, h, { fondo: C.superficie, bordo: r.bordo ?? C.bordo, spessore: r.spesso ? 1.6 : 0.8 });
    let yy = yInizio - 8;
    if (r.titolo) {
      yy -= 11;
      this.pagina.drawText(perPdf(r.titolo), { x: x + 10, y: yy, size: 10, font: this.f.b, color: C.testo });
      yy -= 3;
    }
    for (const riga of r.righe) {
      const dim = riga.dim ?? 8.5;
      const font = riga.grassetto ? this.f.b : this.f.r;
      const xs = x + 10 + (riga.rientro ?? 0) + (riga.punto ? 9 : 0);
      const colore = riga.colore ?? C.testo;
      const linee = riga.destra !== undefined ? [perPdf(riga.testo)] : aCapo(riga.testo, font, dim, w - 20 - (riga.rientro ?? 0) - (riga.punto ? 9 : 0));
      linee.forEach((l, i) => {
        yy -= dim * 1.35;
        if (i === 0 && riga.punto) {
          const cx = x + 10 + (riga.rientro ?? 0) + 3, cy = yy + dim * 0.32;
          if (riga.punto === 'vuoto') this.pagina.drawCircle({ x: cx, y: cy, size: 2.2, borderColor: C.bordo, borderWidth: 0.7 });
          else this.pagina.drawCircle({ x: cx, y: cy, size: 2.4, color: riga.punto === 'maestria' ? C.oro : C.accento, ...(riga.punto === 'maestria' ? { borderColor: C.accento, borderWidth: 0.8 } : {}) });
        }
        this.pagina.drawText(l, { x: xs, y: yy, size: dim, font, color: colore });
        if (i === 0 && riga.destra !== undefined) {
          const d = perPdf(riga.destra);
          this.pagina.drawText(d, { x: x + w - 10 - font.widthOfTextAtSize(d, dim), y: yy, size: dim, font, color: colore });
        }
      });
      yy -= riga.dopo ?? 0;
    }
    return h;
  }
  // Riquadro a tutta larghezza nel flusso, con cambio pagina
  blocco(r: Riquadro) {
    const h = this.misura(r, LARGO);
    this.serve(h + 6);
    this.riquadro(r);
    this.y -= h + 6;
  }
  // Due colonne di riquadri affiancati (le caratteristiche)
  colonne(sx: Riquadro[], dx: Riquadro[]) {
    const w = (LARGO - 8) / 2;
    const alto = (rs: Riquadro[]) => rs.reduce((n, r) => n + this.misura(r, w) + 6, 0);
    this.serve(Math.max(alto(sx), alto(dx)));
    const inizio = this.y;
    let ys = inizio, yd = inizio;
    for (const r of sx) ys -= this.riquadro(r, M, w, ys) + 6;
    for (const r of dx) yd -= this.riquadro(r, M + w + 8, w, yd) + 6;
    this.y = Math.min(ys, yd);
  }
}

export interface ImmaginiPdf { fascia?: Uint8Array; ritratto?: Uint8Array }   // JPEG o PNG, preparati dall'interfaccia

export async function creaPdf(b: Bozza, oggi = new Date(), immagini: ImmaginiPdf = {}, fontTitoli?: Uint8Array): Promise<Uint8Array> {
  const r = riepilogo(b);
  if (!r) throw new Error('Scheda incompleta: mancano classe, specie o background');
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(perPdf(r.testata.nome));
  doc.setSubject(perPdf(r.testata.descrizione));
  doc.setCreator('Companion B20');
  doc.setProducer('Companion B20 (pdf-lib)');
  const f: Font = {
    r: await doc.embedFont(StandardFonts.Helvetica), b: await doc.embedFont(StandardFonts.HelveticaBold),
    t: fontTitoli ? await doc.embedFont(fontTitoli, { subset: true }) : await doc.embedFont(StandardFonts.TimesRomanBold),
  };
  const imp = new Impaginatore(doc, f);
  const p1 = imp.pagina;

  // ───────── Testata: la fascia della classe, il ritratto (o le iniziali), nome e descrizione ─────────
  const immagine = async (dati?: Uint8Array): Promise<PDFImage | null> => {
    if (!dati) return null;
    try { return dati[0] === 0x89 ? await doc.embedPng(dati) : await doc.embedJpg(dati); } catch { return null; }
  };
  const fascia = await immagine(immagini.fascia);
  let y = A4.h - M;
  if (fascia) {
    const h = 110, w = LARGO;
    const scala = Math.max(w / fascia.width, h / fascia.height);
    // Ritagliata al centro-alto, come nell'app: si disegna più grande e si copre il resto con la pergamena
    const iw = fascia.width * scala, ih = fascia.height * scala;
    p1.drawImage(fascia, { x: M + (w - iw) / 2, y: y - h - (ih - h) * 0.3, width: iw, height: ih });
    p1.drawRectangle({ x: 0, y: y, width: A4.l, height: A4.h - y, color: C.sfondo });
    p1.drawRectangle({ x: 0, y: 0, width: A4.l, height: y - h, color: C.sfondo });
    p1.drawRectangle({ x: 0, y: 0, width: M, height: A4.h, color: C.sfondo });
    p1.drawRectangle({ x: A4.l - M, y: 0, width: M, height: A4.h, color: C.sfondo });
    // Sfuma verso la pergamena in basso
    for (let i = 0; i < 48; i++) p1.drawRectangle({ x: M, y: y - h + i, width: w, height: 1.2, color: C.sfondo, opacity: (1 - i / 48) ** 1.5 });
    y -= h - 26;
  }
  const ritratto = await immagine(immagini.ritratto);
  const lato = 56;
  const xr = M + 4;
  p1.drawCircle({ x: xr + lato / 2, y: y - lato / 2, size: lato / 2 + 2, color: C.oro });
  if (ritratto) p1.drawImage(ritratto, { x: xr + 4, y: y - lato + 4, width: lato - 8, height: lato - 8 });
  else {
    p1.drawCircle({ x: xr + lato / 2, y: y - lato / 2, size: lato / 2, color: C.accento });
    const ini = perPdf(r.testata.nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?');
    p1.drawText(ini, { x: xr + lato / 2 - f.t.widthOfTextAtSize(ini, 20) / 2, y: y - lato / 2 - 7, size: 20, font: f.t, color: C.suAccento });
  }
  const xn = xr + lato + 12;
  p1.drawText(perPdf(r.testata.nome), { x: xn, y: y - 26, size: 22, font: f.t, color: C.accento });
  for (const [i, l] of aCapo(r.testata.descrizione, f.r, 10, A4.l - M - xn).entries())
    p1.drawText(l, { x: xn, y: y - 42 - i * 12, size: 10, font: f.r, color: C.testo2 });
  imp.y = y - lato - 12;

  // ───────── I sei numeri ─────────
  const numeri = r.combattimento.numeri;
  const ln = (LARGO - 5 * 6) / 6;
  imp.serve(52);
  numeri.forEach((n, i) => {
    const x = M + i * (ln + 6);
    rettangolo(imp.pagina, x, imp.y - 46, ln, 46, { fondo: C.superficie, bordo: C.bordo });
    const v = perPdf(n.valore);
    const dv = f.b.widthOfTextAtSize(v, 16) > ln - 6 ? 12 : 16;
    imp.pagina.drawText(v, { x: x + (ln - f.b.widthOfTextAtSize(v, dv)) / 2, y: imp.y - 24, size: dv, font: f.b, color: C.testo });
    const e = perPdf(n.etichetta);
    const de = f.r.widthOfTextAtSize(e, 7) > ln - 6 ? 6 : 7;
    imp.pagina.drawText(e, { x: x + (ln - f.r.widthOfTextAtSize(e, de)) / 2, y: imp.y - 38, size: de, font: f.r, color: C.testo2 });
  });
  imp.y -= 52;

  // ───────── Caratteristiche e abilità, su due colonne come nell'app ─────────
  imp.sezione('Caratteristiche e abilità');
  const riquadroCar = (c: Riepilogo['abilita'][number]): Riquadro => {
    const ts = r.combattimento.tiriSalvezza.find((t) => t.car === c.car)!;
    return {
      righe: [
        { testo: c.nome, destra: `${c.punteggio} (${c.mod})`, grassetto: true, dim: 10, dopo: 2 },
        { testo: 'Tiro salvezza', destra: ts.valore, punto: ts.competente ? 'pieno' : 'vuoto', colore: ts.competente ? C.testo : C.testo2 },
        ...c.voci.map((v): Riga => ({ testo: `${v.nome}${v.maestria ? ' (maestria)' : ''}`, destra: v.valore, punto: v.maestria ? 'maestria' : v.competente ? 'pieno' : 'vuoto', colore: v.competente ? C.testo : C.testo2 })),
      ],
    };
  };
  const col = (cs: string[]) => r.abilita.filter((c) => cs.includes(c.car)).map(riquadroCar);
  imp.colonne(col(['FOR', 'DES', 'COS']), col(['INT', 'SAG', 'CAR']));

  // ───────── Combattimento ─────────
  imp.sezione('Combattimento');
  if (r.combattimento.attacchi.length || r.combattimento.trucchetti.length) imp.blocco({
    titolo: 'Attacchi',
    righe: [
      ...r.combattimento.attacchi.flatMap((a): Riga[] => [
        { testo: `${a.nome}${a.quantita > 1 ? ` × ${a.quantita}` : ''}`, destra: `${a.colpire.totale >= 0 ? '+' : '-'}${Math.abs(a.colpire.totale)} per colpire`, grassetto: true },
        { testo: [a.danni.testo, a.danni.testoDueMani ? `a due mani ${a.danni.testoDueMani}` : '', a.gittata ? `gittata ${metri(a.gittata[0]).replace(' metri', '')}/${metri(a.gittata[1])}` : '',
          a.padronanza ? `Padronanza: ${a.padronanza}` : '', ...a.note].filter(Boolean).join(' · '), rientro: 6, colore: C.testo2, dopo: 2 },
      ]),
      ...r.combattimento.trucchetti.flatMap((t): Riga[] => [
        { testo: t.nome, destra: t.tiro, grassetto: true },
        { testo: [t.dadi, t.nota].filter(Boolean).join(' · '), rientro: 6, colore: C.testo2, dopo: 2 },
      ]),
    ],
  });
  if (r.combattimento.risorse.length || r.combattimento.altro.length) imp.blocco({
    titolo: 'Risorse e capacità',
    righe: [
      ...r.combattimento.risorse.map((x): Riga => ({ testo: `${x.nome}${x.dettaglio ? ` (${x.dettaglio})` : ''}`, destra: `${x.usi} · ${x.recupero}` })),
      ...r.combattimento.altro.map((x): Riga => ({ testo: x, colore: C.testo2 })),
    ],
  });

  // ───────── Magia: un riquadro per fonte ─────────
  if (r.magia.fonti.length) {
    imp.sezione('Magia');
    if (r.magia.slot.length) imp.blocco({ righe: [{ testo: `Slot: ${r.magia.slot.join(' · ')}`, grassetto: true }] });
    for (const m of r.magia.fonti) imp.blocco({
      titolo: m.nome,
      righe: [
        ...(m.cd !== null ? [{ testo: 'CD dei tiri salvezza · attacco con incantesimo', destra: `${m.cd} · ${m.attacco}`, colore: C.testo2 } as Riga] : []),
        ...(m.trucchetti.length ? [{ testo: `Trucchetti: ${m.trucchetti.join(', ')}` } as Riga] : []),
        ...(m.incantesimi.length ? [{ testo: `Incantesimi: ${m.incantesimi.join(', ')}` } as Riga] : []),
        ...(m.lanciGratuiti ? [{ testo: m.lanciGratuiti } as Riga] : []),
        ...m.note.map((n): Riga => ({ testo: n, dim: 7.5, colore: C.testo2 })),
      ],
    });
  }

  // ───────── Zaino ─────────
  imp.sezione('Zaino');
  const mo = r.zaino.monete.totale;
  imp.blocco({
    righe: [
      { testo: 'Monete', destra: mo < 0 ? `-${prezzo(-mo)}` : prezzo(mo), grassetto: true, dopo: 2 },
      ...(r.zaino.inventario.length ? r.zaino.inventario.map((v): Riga => ({
        testo: `${v.quantita > 1 ? `${v.quantita} × ` : ''}${v.nome}${v.contenuto ? `: ${v.contenuto.map((x) => `${x.quantita > 1 ? `${x.quantita} ` : ''}${x.nome}`).join(', ')}` : ''}`,
      })) : [{ testo: 'Lo zaino è vuoto.', colore: C.testo2 }]),
      ...(r.zaino.magici.length ? [{ testo: 'Oggetti magici', grassetto: true, dopo: 2 } as Riga, ...r.zaino.magici.map((t): Riga => ({ testo: t }))] : []),
    ],
  });

  // ───────── Chi è ─────────
  imp.sezione('Chi è');
  imp.blocco({
    righe: [
      ...r.chiE.righe.flatMap((x): Riga[] => [{ testo: x.etichetta, dim: 7.5, colore: C.testo2 }, { testo: x.valore, dopo: 2 }]),
      { testo: 'Privilegi e talenti', dim: 7.5, colore: C.testo2 }, { testo: r.chiE.privilegi.join(', ') },
    ],
  });

  // ───────── Per il master (sezione 5.1): eccezioni accettate e avvisi aperti ─────────
  const avvisi = avvisiRiepilogo(b);
  if (avvisi.length) {
    imp.sezione('Per il master');
    imp.blocco({
      bordo: avvisi.some((a) => !a.accettato) ? C.attenzione : C.bordo,
      righe: avvisi.map((a): Riga => ({ testo: `${a.accettato ? 'Eccezione accettata' : 'Da controllare'}: ${a.messaggio}${a.srd?.pagina ? ` (SRD p. ${a.srd.pagina})` : ''}`, dim: 8, dopo: 1 })),
    });
  }

  // ───────── Licenza (sezione 4) e piè di pagina ─────────
  imp.sezione('Licenza');
  imp.blocco({ righe: [{ testo: ATTRIBUZIONE_SRD_52, dim: 6.5, colore: C.testo2, dopo: 3 }, { testo: ATTRIBUZIONE_SRD_521_IT, dim: 6.5, colore: C.testo2 }] });
  const pagine = doc.getPages();
  pagine.forEach((p, i) => {
    p.drawText(perPdf(`${CREDITI} · compatibile con la quinta edizione · ${oggi.toLocaleDateString('it-IT')} · pagina ${i + 1} di ${pagine.length}`),
      { x: M, y: 16, size: 7, font: f.r, color: C.testo2 });
  });
  return doc.save();
}
