// Gli effetti degli oggetti magici posseduti (21/11): quali sono attivi e come si chiamano nelle somme.
// Un oggetto che richiede sintonia è attivo solo da sintonizzato (SRD p. 102-103); gli altri sempre.
import { OGGETTI_MAGICI, MAX_SINTONIA, type EffettoMagico } from './dati/oggetti-magici';
import { ARMI } from './dati/base';
import type { Dati } from './dati';
import type { OggettoMagicoPosseduto } from './tipi';

export interface OggettoAttivo { uid: string; nome: string; effetti: EffettoMagico[]; base?: string }

export function nomeOggetto(o: OggettoMagicoPosseduto, d: Dati): string {
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

export const richiedeSintonia = (o: OggettoMagicoPosseduto) =>
  o.personalizzato ? o.personalizzato.sintonia : !!OGGETTI_MAGICI[o.id]?.sintonia;

export function oggettiAttivi(lista: OggettoMagicoPosseduto[] | undefined, d: Dati): OggettoAttivo[] {
  return (lista ?? []).filter((o) => !richiedeSintonia(o) || o.sintonizzato).map((o) => {
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

export const sintonizzati = (lista: OggettoMagicoPosseduto[] | undefined) =>
  (lista ?? []).filter((o) => richiedeSintonia(o) && o.sintonizzato).length;
export { MAX_SINTONIA };
