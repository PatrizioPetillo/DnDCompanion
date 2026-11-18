// Regole del tavolo (sezione 5.1): il master decide metodo dei punteggi, cosa è ammesso, i suoi elementi e le eccezioni.
// L'app avvisa, non vieta (principio 3): un personaggio fuori dalle regole del tavolo riceve avvisi, non viene cambiato.
// TypeScript puro.
import { LINGUE_RARE } from './dati/base';
import type { Dati } from './dati';
import type { Avviso, EccezioneTavolo, Id, MetodoPunteggi, Personaggio, Tavolo } from './tipi';

export const NOME_METODO: Record<MetodoPunteggi, string> = { pointBuy27: 'Point buy', serieStandard: 'Serie standard', tiri: 'Tiri dei dadi' };
export const NOME_ECCEZIONE: Record<EccezioneTavolo, string> = {
  'lingue-rare': 'Lingue rare a scelta', 'allineamenti-malvagi': 'Allineamenti malvagi', 'talenti-fuori-srd': 'Talenti fuori dall\'SRD',
};

export const tavoloVuoto = (): Tavolo => ({
  schema: 1, nome: '', regole: 'srd-5.2', livello: 1, metodiPunteggi: ['pointBuy27', 'serieStandard'], fonti: { srd: true }, eccezioni: [],
});

export type Gruppo = 'classi' | 'specie' | 'background';
const NOME_GRUPPO: Record<Gruppo, string> = { classi: 'La classe', specie: 'La specie', background: 'Il background' };

// Un elemento è ammesso se non è escluso; un personalizzato solo se è tra quelli del master (o se il tavolo non ne ha:
// allora il master li deve vedere uno per uno, e l'avviso glielo dice)
export function ammesso(t: Tavolo, id: Id): boolean {
  if (t.fonti.escludi?.includes(id)) return false;
  if (!id.startsWith('pers-')) return true;
  return !!(t.elementi?.background[id] || t.elementi?.specie?.[id]);
}

// L'avviso è coperto da un'eccezione del tavolo?
export function coperto(t: Tavolo, a: Avviso): boolean {
  const e = t.eccezioni ?? [];
  if (e.includes('allineamenti-malvagi') && a.id === 'allineamento-malvagio') return true;
  if (e.includes('talenti-fuori-srd') && a.id === 'talento-personalizzato') return true;
  if (e.includes('lingue-rare') && a.id.startsWith('scelta-non-valida:')) return !!LINGUE_RARE[a.id.split(':').pop()!];
  return false;
}

// Gli avvisi che il tavolo aggiunge al personaggio
export function avvisiTavolo(pg: Personaggio, t: Tavolo, d: Dati): Avviso[] {
  const out: Avviso[] = [];
  const voce = (gruppo: Gruppo, id: Id, nome: string) => {
    if (ammesso(t, id)) return;
    const pers = id.startsWith('pers-');
    out.push({ id: `tavolo-escluso:${gruppo}:${id}`, livello: pers ? 'attenzione' : 'errore',
      messaggio: pers
        ? `${NOME_GRUPPO[gruppo]} «${nome}» è un elemento tuo, non tra quelli del tavolo «${t.nome || 'senza nome'}»: chiedi al master`
        : `${NOME_GRUPPO[gruppo]} «${nome}» non è ammesso al tavolo «${t.nome || 'senza nome'}»` });
  };
  voce('classi', pg.classe, d.classi[pg.classe]?.nome ?? pg.classe);
  voce('specie', pg.specie, d.specie[pg.specie]?.nome ?? pg.specie);
  voce('background', pg.background, d.background[pg.background]?.nome ?? pg.background);
  if (!t.metodiPunteggi.includes(pg.punteggi.metodo))
    out.push({ id: 'tavolo-metodo', livello: 'errore',
      messaggio: `Il tavolo usa ${t.metodiPunteggi.map((m) => NOME_METODO[m]).join(' o ')}, non ${NOME_METODO[pg.punteggi.metodo]}` });
  return out;
}

// Controllo di un tavolo arrivato da un link: solo forme note, elementi personalizzati ben fatti
export function validaTavolo(x: unknown, d: Dati): Tavolo | null {
  const t = x as Tavolo;
  if (!t || t.schema !== 1 || t.regole !== 'srd-5.2' || t.livello !== 1 || typeof t.nome !== 'string') return null;
  const metodi = (Array.isArray(t.metodiPunteggi) ? t.metodiPunteggi : []).filter((m): m is MetodoPunteggi => m in NOME_METODO);
  if (!metodi.length) return null;
  const eccezioni = (Array.isArray(t.eccezioni) ? t.eccezioni : []).filter((e): e is EccezioneTavolo => e in NOME_ECCEZIONE);
  const escludi = (Array.isArray(t.fonti?.escludi) ? t.fonti.escludi : []).filter((id) => typeof id === 'string');
  const solo = <T extends { personalizzato?: boolean }>(r: Record<Id, T> | undefined, srd: Record<Id, unknown>) => Object.fromEntries(
    Object.entries(r ?? {}).filter(([id, v]) => v && typeof v === 'object' && v.personalizzato === true && id.startsWith('pers-') && !srd[id]));
  const background = solo(t.elementi?.background, d.background);
  const specie = solo(t.elementi?.specie, d.specie);
  return {
    schema: 1, nome: t.nome.slice(0, 80), regole: 'srd-5.2', livello: 1, metodiPunteggi: metodi, fonti: { srd: true, escludi }, eccezioni,
    ...(Object.keys(background).length || Object.keys(specie).length ? { elementi: { background, ...(Object.keys(specie).length ? { specie } : {}) } } : {}),
    ...(typeof t.note === 'string' && t.note.trim() ? { note: t.note.slice(0, 2000) } : {}),
  };
}

// Le regole del tavolo in poche righe, per chi apre il link
export function descriviTavolo(t: Tavolo, d: Dati): string[] {
  const righe = [`Punteggi: ${t.metodiPunteggi.map((m) => NOME_METODO[m]).join(' o ')}`];
  const esclusi = (gruppo: Gruppo) => (t.fonti.escludi ?? []).filter((id) => d[gruppo][id]).map((id) => d[gruppo][id].nome);
  for (const [g, nome] of [['classi', 'Classi'], ['specie', 'Specie'], ['background', 'Background']] as const) {
    const e = esclusi(g);
    if (e.length) righe.push(`${nome} non ammesse: ${e.join(', ')}`.replace('Background non ammesse', 'Background non ammessi'));
  }
  const pers = [...Object.values(t.elementi?.background ?? {}), ...Object.values(t.elementi?.specie ?? {})].map((x) => x.nome);
  if (pers.length) righe.push(`Elementi del master: ${pers.join(', ')}`);
  if (t.eccezioni?.length) righe.push(`Eccezioni concesse: ${t.eccezioni.map((e) => NOME_ECCEZIONE[e].toLowerCase()).join(', ')}`);
  return righe;
}
