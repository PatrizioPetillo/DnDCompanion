// Il modulo dei dadi (idea 6, 23/11). Regole dell'SRD 5.2, verificate il 22/11:
// - prova con il d20 = d20 + modificatore + competenza + bonus e penalità (p. 6);
// - 20 naturale su un tiro per colpire: colpisce sempre ed è critico; 1 naturale: manca sempre (p. 7).
//   Solo per i tiri per colpire: prove e tiri salvezza non hanno successi o fallimenti automatici;
// - vantaggio e svantaggio: due d20, il più alto o il più basso; insieme si annullano, in qualunque numero (p. 7-8);
// - critico: tutti i dadi di danno dell'attacco si tirano due volte, i modificatori una volta sola (p. 16);
// - indebolimento: −2 per livello a ogni tiro di d20 (p. 181).
// Il generatore si passa da fuori: nei test è fisso, nell'app è casuale.

export type Dado = (facce: number) => number;
export const casuale: Dado = (f) => {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return 1 + (a[0] % f);
};

export type Modo = 'normale' | 'vantaggio' | 'svantaggio';
// Più fonti: basta un vantaggio e uno svantaggio per annullarsi (p. 7)
export const combinaModo = (vantaggi: number, svantaggi: number): Modo =>
  vantaggi > 0 && svantaggi > 0 ? 'normale' : vantaggi > 0 ? 'vantaggio' : svantaggi > 0 ? 'svantaggio' : 'normale';

export interface TiroD20 { dadi: number[]; tenuto: number; bonus: number; meno: number; totale: number; critico: boolean; mancato: boolean; modo: Modo }

export function tiraD20(bonus: number, modo: Modo = 'normale', o: { attacco?: boolean; meno?: number } = {}, dado: Dado = casuale): TiroD20 {
  const dadi = modo === 'normale' ? [dado(20)] : [dado(20), dado(20)];
  const tenuto = modo === 'vantaggio' ? Math.max(...dadi) : modo === 'svantaggio' ? Math.min(...dadi) : dadi[0];
  const meno = o.meno ?? 0;
  return { dadi, tenuto, bonus, meno, totale: tenuto + bonus - meno, critico: !!o.attacco && tenuto === 20, mancato: !!o.attacco && tenuto === 1, modo };
}

// ───────── Espressioni come «2d8 + 3», «1d4 + 1», «3d6» ─────────
export interface Gruppo { n: number; facce: number }
export interface Espressione { gruppi: Gruppo[]; piu: number }

export function leggi(testo: string): Espressione | null {
  const t = testo.replace(/\s+/g, '').replace(/−/g, '-');
  if (!t || !/^[+-]?(\d*d\d+|\d+)([+-](\d*d\d+|\d+))*$/i.test(t)) return null;
  const gruppi: Gruppo[] = [];
  let piu = 0;
  for (const m of t.matchAll(/([+-]?)(\d*)d(\d+)|([+-]?)(\d+)/gi)) {
    if (m[3]) {
      if (m[1] === '-') return null;                     // dadi da togliere: non servono nell'SRD di livello 1
      gruppi.push({ n: Number(m[2] || 1), facce: Number(m[3]) });
    } else piu += (m[4] === '-' ? -1 : 1) * Number(m[5]);
  }
  return { gruppi, piu };
}

export const scrivi = (e: Espressione) =>
  [...e.gruppi.map((g) => `${g.n}d${g.facce}`), ...(e.piu ? [String(Math.abs(e.piu))] : [])].join(' + ').replace(/\+ (\d+)$/, e.piu < 0 ? '− $1' : '+ $1');

export interface TiroDanni { dadi: { facce: number; valore: number }[]; piu: number; totale: number; critico: boolean; testo: string }

// Il critico raddoppia il numero di dadi, non il modificatore (p. 16). Il totale non scende sotto 0.
export function tiraEspressione(e: Espressione, o: { critico?: boolean } = {}, dado: Dado = casuale): TiroDanni {
  const gruppi = e.gruppi.map((g) => ({ ...g, n: g.n * (o.critico ? 2 : 1) }));
  const dadi = gruppi.flatMap((g) => Array.from({ length: g.n }, () => ({ facce: g.facce, valore: dado(g.facce) })));
  const totale = Math.max(0, dadi.reduce((s, d) => s + d.valore, 0) + e.piu);
  return { dadi, piu: e.piu, totale, critico: !!o.critico, testo: scrivi({ gruppi, piu: e.piu }) };
}

// ───────── Incantesimi con uno slot più alto ─────────
// «+1d6» aggiunge un dado per ogni livello sopra il base; «+5» aggiunge un numero; «+1 dardo» è il dardo incantato.
export function conSlot(base: string, perSlot: string | undefined, livelli: number): Espressione | null {
  const e = leggi(base);
  if (!e) return null;
  if (!perSlot || livelli <= 0) return e;
  const p = perSlot.replace(/\s+/g, '');
  const d = /^\+(\d+)d(\d+)$/.exec(p);
  if (d) {
    const facce = Number(d[2]), n = Number(d[1]) * livelli;
    const g = e.gruppi.find((x) => x.facce === facce);
    return { ...e, gruppi: g ? e.gruppi.map((x) => (x === g ? { ...x, n: x.n + n } : x)) : [...e.gruppi, { n, facce }] };
  }
  const k = /^\+(\d+)$/.exec(p);
  if (k) return { ...e, piu: e.piu + Number(k[1]) * livelli };
  return e;                                                // «+1 dardo», «+1d6 al freddo»: casi a parte
}
