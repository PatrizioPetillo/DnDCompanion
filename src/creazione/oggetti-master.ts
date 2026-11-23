// Il master parte da un oggetto magico dell'SRD (23/11): nome, cosa fa, sintonia, cariche e i bonus che la scheda sa calcolare.
// I bonus che il modulo non ha (armi, prove, punteggi) restano scritti in «Cosa fa»: il giocatore li applica a mano.
import { OGGETTI_MAGICI, type EffettoMagico } from '../regole/dati/oggetti-magici';
import type { BonusMagici } from '../regole/tipi';

export interface PrefillOggetto { nome: string; descrizione: string; sintonia: boolean; cariche: number; bonus: BonusMagici }

function bonusDa(effetti: EffettoMagico[]): BonusMagici {
  const b: BonusMagici = {};
  for (const e of effetti) {
    if (e.tipo === 'armatura' || e.tipo === 'scudo' || e.tipo === 'ca') b.ca = (b.ca ?? 0) + e.bonus;
    else if (e.tipo === 'ts') b.ts = (b.ts ?? 0) + e.bonus;
    else if (e.tipo === 'attaccoIncantesimi') b.attaccoIncantesimi = (b.attaccoIncantesimi ?? 0) + e.bonus;
    else if (e.tipo === 'cdIncantesimi') b.cdIncantesimi = (b.cdIncantesimi ?? 0) + e.bonus;
  }
  return b;
}

export function daOggettoSrd(id: string, varianteId?: string): PrefillOggetto | null {
  const o = OGGETTI_MAGICI[id];
  if (!o) return null;
  const v = o.varianti?.find((x) => x.id === varianteId) ?? o.varianti?.[0];
  const nome = v ? (o.base || /\+1, \+2 o \+3/.test(o.nome) ? o.nome.replace(/\+1, \+2 o \+3/, v.nome) : `${o.nome} (${v.nome})`) : o.nome;
  const rarita = v?.rarita ?? o.rarita;
  const sintonia = o.sintonia === true ? 'richiede sintonia' : o.sintonia ? `richiede sintonia (${o.sintonia})` : '';
  const condizioni = (v?.effetti ?? o.effetti ?? []).some((e) => e.tipo === 'armatura') ? ' Il bonus alla CA vale mentre la indossi.'
    : (v?.effetti ?? o.effetti ?? []).some((e) => e.tipo === 'scudo') ? ' Il bonus alla CA vale mentre imbracci lo scudo.'
    : (v?.effetti ?? o.effetti ?? []).some((e) => e.tipo === 'ca' && e.soloSenzaArmatura) ? ' Il bonus alla CA vale solo senza armatura né scudo.' : '';
  return {
    nome,
    descrizione: `${o.categoria}, ${rarita}${sintonia ? `, ${sintonia}` : ''}. ${o.riga}${condizioni} (SRD p. ${o.pagina})`,
    sintonia: o.sintonia !== false,
    cariche: o.cariche?.massimo ?? 0,
    bonus: bonusDa(v?.effetti ?? o.effetti ?? []),
  };
}

export const OGGETTI_SRD_PER_MASTER = () => Object.values(OGGETTI_MAGICI).sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
