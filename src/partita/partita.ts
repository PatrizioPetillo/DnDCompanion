// Uso al tavolo (sezione 6.2, «Cosa posso lanciare adesso?»): PF attuali, slot da spuntare, risorse, lanci gratuiti,
// concentrazione, riposo breve e lungo. Lo stato della partita è separato dalle scelte del personaggio:
// rifare la scheda non lo azzera, e si salva soltanto ciò che si consuma (i massimi li calcola il motore).
import type { Id, MagiaCalcolata, Riposo, Scheda } from '../regole/tipi';
import { DATI, type Dati } from '../regole/dati';

export interface StatoPartita {
  pfPersi: number;                       // PF attuali = massimo − persi (se il massimo cambia, il conto resta giusto)
  pfTemporanei: number;
  dadiVitaUsati: number;
  slotUsati: number[];                   // per livello: [1°, 2°, …]
  pattoUsati: number;
  risorseUsate: Record<Id, number>;
  gratuitiUsati: Record<Id, number>;     // per fonte di magia (Iniziato alla magia, Nemico prescelto…)
  concentrazione: Id | null;             // incantesimo a concentrazione attivo
  morte: { successi: number; fallimenti: number; stabile: boolean; morto: boolean };   // tiri salvezza contro la morte (p. 17-18)
  componenti?: Record<Id, number>;       // componenti con costo aggiunte (+) o usate (−) durante il gioco
}

export const statoVuoto = (): StatoPartita => ({
  pfPersi: 0, pfTemporanei: 0, dadiVitaUsati: 0, slotUsati: [], pattoUsati: 0, risorseUsate: {}, gratuitiUsati: {}, concentrazione: null,
  morte: { successi: 0, fallimenti: 0, stabile: false, morto: false },
});

const limita = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

// ───────── Cosa si vede: massimi dal motore, consumi dallo stato ─────────
export interface VistaPartita {
  pf: { attuali: number; massimo: number; temporanei: number };
  dadiVita: { dado: number; totale: number; rimasti: number };
  slot: { livello: number; totale: number; rimasti: number }[];
  patto: { livello: number; totale: number; rimasti: number } | null;
  risorse: { id: Id; nome: string; usi: number; rimasti: number; recupero: string }[];
  gratuiti: { magia: Id; incantesimi: Id[]; usi: number; rimasti: number; recupero: Riposo }[];
  concentrazione: Id | null;
}

export function vista(s: Scheda, st: StatoPartita, dado: number, livello = 1): VistaPartita {
  return {
    pf: { attuali: limita(s.pf.totale - st.pfPersi, 0, s.pf.totale), massimo: s.pf.totale, temporanei: st.pfTemporanei },
    dadiVita: { dado, totale: livello, rimasti: limita(livello - st.dadiVitaUsati, 0, livello) },
    slot: s.slot.normali.map((totale, i) => ({ livello: i + 1, totale, rimasti: limita(totale - (st.slotUsati[i] ?? 0), 0, totale) })).filter((x) => x.totale > 0),
    patto: s.slot.patto ? { ...s.slot.patto, totale: s.slot.patto.numero, rimasti: limita(s.slot.patto.numero - st.pattoUsati, 0, s.slot.patto.numero) } : null,
    risorse: s.risorse.map((r) => ({ id: r.id, nome: r.nome, usi: r.usi, rimasti: limita(r.usi - (st.risorseUsate[r.id] ?? 0), 0, r.usi),
      recupero: r.recupero.some((x) => x.riposo === 'breve') ? 'breve' : 'lungo' })),
    gratuiti: s.magia.filter((m) => m.lanciGratuiti).map((m) => ({ magia: m.id, incantesimi: m.lanciGratuiti!.incantesimi, usi: m.lanciGratuiti!.usi,
      rimasti: limita(m.lanciGratuiti!.usi - (st.gratuitiUsati[m.id] ?? 0), 0, m.lanciGratuiti!.usi), recupero: m.lanciGratuiti!.recupero })),
    concentrazione: st.concentrazione,
  };
}

// ───────── PF (PF temporanei p. 18, riposi p. 185 e 187) ─────────
// Il danno toglie prima i PF temporanei, poi quelli veri; i PF non scendono sotto 0.
// Danno massiccio (p. 17): se il danno che avanza dopo lo 0 arriva al massimo dei PF, il personaggio muore.
// Danno a 0 PF (p. 18): un fallimento al tiro contro la morte, due se è un colpo critico; muore se arriva al massimo.
export function danno(st: StatoPartita, n: number, massimo: number, critico = false): StatoPartita {
  const t = Math.min(st.pfTemporanei, n);
  const resto = n - t;
  const attuali = massimo - st.pfPersi;
  const m = { ...st.morte };
  if (resto > 0 && attuali <= 0) {
    m.stabile = false;
    m.fallimenti = Math.min(3, m.fallimenti + (critico ? 2 : 1));
    if (m.fallimenti >= 3 || resto >= massimo) m.morto = true;
  } else if (resto >= attuali && resto - attuali >= massimo) m.morto = true;
  return { ...st, pfTemporanei: st.pfTemporanei - t, pfPersi: limita(st.pfPersi + resto, 0, massimo), morte: m };
}
// La cura non supera il massimo e non tocca i PF temporanei; recuperare PF azzera i tiri contro la morte (p. 17)
export const cura = (st: StatoPartita, n: number): StatoPartita =>
  n > 0 && !st.morte.morto ? { ...st, pfPersi: Math.max(0, st.pfPersi - n), morte: { successi: 0, fallimenti: 0, stabile: false, morto: false } } : st;

// Tiro salvezza contro la morte (p. 17-18): d20, 10 o più è un successo; 1 vale due fallimenti; 20 fa tornare a 1 PF.
// Tre successi: stabile. Tre fallimenti: morto.
export function tiroMorte(st: StatoPartita, d20: number, massimo: number): StatoPartita {
  if (st.morte.morto || st.morte.stabile || st.pfPersi < massimo) return st;
  if (d20 === 20) return { ...st, pfPersi: massimo - 1, morte: { successi: 0, fallimenti: 0, stabile: false, morto: false } };
  const m = { ...st.morte };
  if (d20 >= 10) m.successi += 1; else m.fallimenti += d20 === 1 ? 2 : 1;
  if (m.fallimenti >= 3) { m.fallimenti = 3; m.morto = true; }
  else if (m.successi >= 3) { m.successi = 0; m.fallimenti = 0; m.stabile = true; }
  return { ...st, morte: m };
}
// Per correggere un tocco sbagliato: i contatori si rimettono a mano
export const azzeraMorte = (st: StatoPartita): StatoPartita => ({ ...st, morte: { successi: 0, fallimenti: 0, stabile: false, morto: false } });

// I PF temporanei non si sommano: si tiene il valore più alto (o si sceglie: p. 18)
export const temporanei = (st: StatoPartita, n: number): StatoPartita => ({ ...st, pfTemporanei: Math.max(st.pfTemporanei, n) });

// ───────── Slot, risorse, lanci gratuiti: tocco un pallino ─────────
export function segnaSlot(st: StatoPartita, livello: number, usato: boolean, totale: number): StatoPartita {
  const slotUsati = [...st.slotUsati];
  slotUsati[livello - 1] = limita((slotUsati[livello - 1] ?? 0) + (usato ? 1 : -1), 0, totale);
  return { ...st, slotUsati };
}
export const segnaPatto = (st: StatoPartita, usato: boolean, totale: number): StatoPartita =>
  ({ ...st, pattoUsati: limita(st.pattoUsati + (usato ? 1 : -1), 0, totale) });
export const segnaRisorsa = (st: StatoPartita, id: Id, usato: boolean, usi: number): StatoPartita =>
  ({ ...st, risorseUsate: { ...st.risorseUsate, [id]: limita((st.risorseUsate[id] ?? 0) + (usato ? 1 : -1), 0, usi) } });
export const segnaGratuito = (st: StatoPartita, magia: Id, usato: boolean, usi: number): StatoPartita =>
  ({ ...st, gratuitiUsati: { ...st.gratuitiUsati, [magia]: limita((st.gratuitiUsati[magia] ?? 0) + (usato ? 1 : -1), 0, usi) } });

// ───────── Lanciare un incantesimo (p. 104-106) ─────────
export type ModoLancio =
  | { tipo: 'trucchetto' }
  | { tipo: 'slot'; livello: number }
  | { tipo: 'patto'; livello: number }
  | { tipo: 'gratuito' }
  | { tipo: 'rituale' };                  // +10 minuti, nessuno slot (p. 104)

export interface OpzioneLancio { modo: ModoLancio; etichetta: string; disponibile: boolean }

// Come si può lanciare un incantesimo di questa fonte, adesso
export function modiDiLancio(v: VistaPartita, m: MagiaCalcolata, id: Id, d: Dati = DATI): OpzioneLancio[] {
  const inc = d.incantesimi[id];
  if (!inc) return [];
  if (inc.livello === 0) return [{ modo: { tipo: 'trucchetto' }, etichetta: 'Trucchetto: nessuno slot', disponibile: true }];
  const preparato = m.semprePreparati.includes(id) || (m.preparati?.scelti ?? []).includes(id);
  const out: OpzioneLancio[] = [];
  const g = v.gratuiti.find((x) => x.magia === m.id && x.incantesimi.includes(id));
  if (g) out.push({ modo: { tipo: 'gratuito' }, etichetta: `Gratis (${g.rimasti} su ${g.usi}, tornano con il riposo ${g.recupero})`, disponibile: g.rimasti > 0 });
  if (preparato && !m.soloRituali) {
    if (m.slot === 'normali' || m.slot === 'qualsiasi')
      for (const s of v.slot) if (s.livello >= inc.livello)
        out.push({ modo: { tipo: 'slot', livello: s.livello }, etichetta: `Slot di ${s.livello}° (${s.rimasti} su ${s.totale})`, disponibile: s.rimasti > 0 });
    if ((m.slot === 'patto' || m.slot === 'qualsiasi') && v.patto && v.patto.livello >= inc.livello)
      out.push({ modo: { tipo: 'patto', livello: v.patto.livello }, etichetta: `Slot del patto di ${v.patto.livello}° (${v.patto.rimasti} su ${v.patto.totale})`, disponibile: v.patto.rimasti > 0 });
  }
  // Rituale: preparato, oppure dal libro per il mago (Adepto dei rituali), oppure Patto del tomo (sempre rituale)
  const dalLibro = m.libro?.scelti.includes(id) && m.preparatiDa === 'libro';
  if (inc.rituale && (preparato || dalLibro || m.soloRituali))
    out.push({ modo: { tipo: 'rituale' }, etichetta: 'Come rituale: 10 minuti in più, nessuno slot', disponibile: true });
  return out;
}

// Lancia: consuma lo slot o il lancio gratuito; un nuovo incantesimo a concentrazione interrompe il precedente (p. 179)
export function lancia(st: StatoPartita, v: VistaPartita, magia: Id, id: Id, modo: ModoLancio, d: Dati = DATI): { stato: StatoPartita; interrotto: Id | null } {
  let nuovo = st;
  if (modo.tipo === 'slot') nuovo = segnaSlot(st, modo.livello, true, v.slot.find((s) => s.livello === modo.livello)?.totale ?? 0);
  if (modo.tipo === 'patto') nuovo = segnaPatto(st, true, v.patto?.totale ?? 0);
  if (modo.tipo === 'gratuito') nuovo = segnaGratuito(st, magia, true, v.gratuiti.find((g) => g.magia === magia)?.usi ?? 0);
  const conc = d.incantesimi[id]?.concentrazione;
  const interrotto = conc && st.concentrazione && st.concentrazione !== id ? st.concentrazione : null;
  return { stato: conc ? { ...nuovo, concentrazione: id } : nuovo, interrotto };
}
export const fineConcentrazione = (st: StatoPartita): StatoPartita => ({ ...st, concentrazione: null });

// ───────── Riposi ─────────
// Riposo breve (p. 187): dadi vita spesi (il giocatore tira e scrive il risultato), slot del patto (p. 71),
// le risorse che tornano con il riposo breve (Ira: 1; Ispirazione bardica dal livello 5…)
export function spendiDadoVita(st: StatoPartita, tiro: number, modCos: number, livello = 1): StatoPartita {
  if (st.dadiVitaUsati >= livello) return st;
  return { ...cura(st, Math.max(1, tiro + modCos)), dadiVitaUsati: st.dadiVitaUsati + 1 };
}

export function riposoBreve(st: StatoPartita, s: Scheda): StatoPartita {
  const risorseUsate = { ...st.risorseUsate };
  for (const r of s.risorse) {
    const breve = r.recupero.find((x) => x.riposo === 'breve');
    if (breve) risorseUsate[r.id] = breve.quanti === 'tutti' ? 0 : Math.max(0, (risorseUsate[r.id] ?? 0) - breve.quanti);
  }
  const gratuitiUsati = { ...st.gratuitiUsati };
  for (const m of s.magia) if (m.lanciGratuiti?.recupero === 'breve') gratuitiUsati[m.id] = 0;
  return { ...st, pattoUsati: 0, risorseUsate, gratuitiUsati };
}

// Riposo lungo (p. 185): tutti i PF e tutti i dadi vita, tutti gli slot, tutte le risorse; i PF temporanei finiscono (p. 18)
export const riposoLungo = (st: StatoPartita): StatoPartita => (st.morte.morto ? st : { ...statoVuoto(), concentrazione: st.concentrazione });
