// Gli effetti degli oggetti magici posseduti (21/11): quali sono attivi e come si chiamano nelle somme.
// Un oggetto che richiede sintonia è attivo solo da sintonizzato (SRD p. 102-103); gli altri sempre.
import { OGGETTI_MAGICI, MAX_SINTONIA, type EffettoMagico } from './dati/oggetti-magici';
import { ARMI } from './dati/base';
import type { Dati } from './dati';
import type { OggettoMagicoPosseduto } from './tipi';

export interface OggettoAttivo { uid: string; nome: string; effetti: EffettoMagico[]; base?: string }

export function nomeOggetto(o: OggettoMagicoPosseduto, d: Dati): string {
  if (o.velato) return o.velato.apparente.trim() || 'Oggetto da identificare';
  if (o.personalizzato) return o.personalizzato.nome.trim() || 'Oggetto magico';
  const def = OGGETTI_MAGICI[o.id];
  if (!def) return o.id;
  const v = def.varianti?.find((x) => x.id === o.variante);
  if (def.base === 'arma' && o.base) return `${ARMI[o.base]?.nome ?? o.base}${v ? ` ${v.nome}` : ` (${def.nome})`}`;
  if (def.base === 'armatura' && o.base) return `${d.oggetti[o.base]?.nome ?? o.base}${v ? ` ${v.nome}` : ''}`;
  if (def.id === 'shield-plus' && v) return `Scudo ${v.nome}`;
  if (def.id === 'wand-of-the-war-mage' && v) return `Bacchetta del mago da guerra ${v.nome}`;
  if (def.id === 'ammunition-plus' && v) return `Munizione ${v.nome}`;
  return v?.nome ? `${def.nome} ${v.nome}` : def.nome;
}

// Un oggetto velato non si sa se richieda sintonia: lo si scopre identificandolo (SRD p. 102)
export const richiedeSintonia = (o: OggettoMagicoPosseduto) =>
  o.velato ? false : o.personalizzato ? o.personalizzato.sintonia : !!OGGETTI_MAGICI[o.id]?.sintonia;

// Non ci si sintonizza con due copie dello stesso oggetto (SRD p. 102): la seconda copia sintonizzata non funziona.
const chiaveCopia = (o: OggettoMagicoPosseduto) =>
  o.personalizzato ? `p:${o.personalizzato.nome.trim().toLowerCase()}` : `${o.id}|${o.variante ?? ''}|${o.base ?? ''}`;
export function copieDoppie(lista: OggettoMagicoPosseduto[] | undefined): Set<string> {
  const viste = new Set<string>(); const doppie = new Set<string>();
  for (const o of lista ?? []) {
    if (!richiedeSintonia(o) || !o.sintonizzato) continue;
    const k = chiaveCopia(o);
    if (viste.has(k)) doppie.add(o.uid); else viste.add(k);
  }
  return doppie;
}

export function oggettiAttivi(lista: OggettoMagicoPosseduto[] | undefined, d: Dati): OggettoAttivo[] {
  const doppie = copieDoppie(lista);
  return (lista ?? []).filter((o) => !o.velato && (!richiedeSintonia(o) || o.sintonizzato) && !doppie.has(o.uid)).map((o) => {
    const nome = nomeOggetto(o, d);
    if (o.personalizzato) {
      const b = o.personalizzato.bonus;
      const e: EffettoMagico[] = [];
      if (b.ca) e.push({ tipo: 'ca', bonus: b.ca });
      if (b.ts) e.push({ tipo: 'ts', bonus: b.ts });
      if (b.attaccoIncantesimi) e.push({ tipo: 'attaccoIncantesimi', bonus: b.attaccoIncantesimi });
      if (b.cdIncantesimi) e.push({ tipo: 'cdIncantesimi', bonus: b.cdIncantesimi });
      return { uid: o.uid, nome, effetti: e };
    }
    const def = OGGETTI_MAGICI[o.id];
    const v = def?.varianti?.find((x) => x.id === o.variante);
    return { uid: o.uid, nome, effetti: [...(def?.effetti ?? []), ...(v?.effetti ?? [])], ...(o.base ? { base: o.base } : {}) };
  });
}

export const sintonizzati = (lista: OggettoMagicoPosseduto[] | undefined) => {
  const doppie = copieDoppie(lista);
  return (lista ?? []).filter((o) => richiedeSintonia(o) && o.sintonizzato && !doppie.has(o.uid)).length;
};
export { MAX_SINTONIA };

// Lo sblocco del master: il contenuto decifrato diventa un oggetto personalizzato, l'aspetto resta
export function svela(o: OggettoMagicoPosseduto, s: import('./tipi').OggettoSvelato, ora = new Date()): OggettoMagicoPosseduto {
  const { velato, ...resto } = o;
  return { ...resto, id: 'personalizzato', ...(velato?.aspetto ? { aspetto: velato.aspetto } : {}), identificatoIl: ora.toISOString(),
    ...(s.cariche ? { cariche: s.cariche } : {}),
    personalizzato: { nome: s.nome, sintonia: !!s.sintonia, ...(s.riga ? { riga: s.riga } : {}), ...(s.descrizione ? { descrizione: s.descrizione } : {}),
      ...(s.cariche ? { cariche: s.cariche } : {}), bonus: s.bonus ?? {} } };
}

// Quante cariche restano lo sa chi è sintonizzato, o chi ha lanciato Identificare sull'oggetto (SRD p. 206)
export const caricheConosciute = (o: OggettoMagicoPosseduto) => !!o.caricheNote || (richiedeSintonia(o) && !!o.sintonizzato);

// Ricarica all'alba (22/11): tira i dadi dell'oggetto e aggiunge, senza superare il massimo
export function tiraRicarica(r: { dadi: number; facce: number; piu: number } | 'tutte', massimo: number, dado = (f: number) => 1 + Math.floor(Math.random() * f)) {
  if (r === 'tutte') return { tiri: [] as number[], totale: massimo };
  const tiri = Array.from({ length: r.dadi }, () => dado(r.facce));
  return { tiri, totale: tiri.reduce((t, x) => t + x, 0) + r.piu };
}
export const ricarica = (attuali: number, recuperate: number, massimo: number) => Math.max(0, Math.min(massimo, attuali + Math.max(0, recuperate)));
