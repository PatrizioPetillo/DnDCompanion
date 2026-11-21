// «Il mio gruppo» (21/11): il master salva le schede che i giocatori gli mandano con il link, tavolo per tavolo,
// e le vede insieme: i numeri che servono durante la partita. Nessun server: le schede arrivano già nel link.
import { calcolaScheda, DATI } from '../regole';
import { NOME_LINGUA } from '../regole/dati/base';
import type { Bozza } from './percorso';

export interface RigaGruppo {
  id: string; nome: string; chi: string; ca: number; pf: number; iniziativa: string; percezione: number;
  cd: number | null; lingue: string[]; avvisi: number;
}

const segno = (n: number) => (n >= 0 ? `+${n}` : `−${-n}`);

export function rigaGruppo(id: string, b: Bozza): RigaGruppo | null {
  if (!b.classe || !b.specie || !b.background) return null;
  try {
    const s = calcolaScheda(b as never);
    const ca = s.ca.formule.find((f) => f.id === s.ca.attuale)!.valore.totale;
    const cd = s.magia.map((m) => m.cd?.totale ?? 0).filter(Boolean);
    return {
      id, nome: b.nome.trim() || 'Senza nome',
      chi: `${DATI.specie[b.specie]?.nome ?? b.specie} · ${DATI.classi[b.classe]?.nome ?? b.classe} ${b.livello ?? 1}`,
      ca, pf: s.pf.totale, iniziativa: segno(s.iniziativa.totale), percezione: s.percezionePassiva,
      cd: cd.length ? Math.max(...cd) : null,
      lingue: s.lingue.map((l) => NOME_LINGUA[l] ?? l),
      avvisi: s.avvisi.filter((a) => !a.accettato && a.livello !== 'info').length,
    };
  } catch { return null; }
}

// Le lingue del gruppo, e chi parla quelle che solo uno conosce: utile per chi traduce al tavolo
export function riassuntoGruppo(righe: RigaGruppo[]) {
  const conteggio = new Map<string, string[]>();
  for (const r of righe) for (const l of r.lingue) conteggio.set(l, [...(conteggio.get(l) ?? []), r.nome]);
  const migliorPercezione = righe.reduce<RigaGruppo | null>((m, r) => (!m || r.percezione > m.percezione ? r : m), null);
  return {
    lingue: [...conteggio.entries()].sort((a, b) => a[0].localeCompare(b[0], 'it')).map(([lingua, chi]) => ({ lingua, chi })),
    migliorPercezione,
  };
}
