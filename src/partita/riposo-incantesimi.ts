// Cambiare gli incantesimi dopo un riposo lungo (SRD p. 104 e le pagine di ogni classe), richiesta di Patrizio del 19/11.
// Mago, chierico, druido: tutti i preparati (il mago dal suo libro) e il mago anche un trucchetto (p. 77);
// paladino e ranger: un incantesimo; bardo, stregone, warlock, Iniziato alla magia: solo salendo di livello.
// I sempre preparati non si cambiano. TypeScript puro.
import { opzioniIncantesimi, sostituisci } from '../creazione/magia';
import { comePersonaggio, type Bozza } from '../creazione/percorso';
import { calcolaScheda } from '../regole';
import { DATI, type Dati } from '../regole/dati';
import type { Id } from '../regole/tipi';

export interface CambioPossibile {
  magia: Id;
  nome: string;                            // «Classe: Mago»
  tipo: 'preparati' | 'trucchetti';
  quanti: 'tutti' | number;
  attuali: Id[];                           // quelli che si possono togliere
  regola: string;
  pagina: number;
}

export function cambiDopoRiposoLungo(b: Bozza, d: Dati = DATI): { possibili: CambioPossibile[]; no: string[] } {
  const pg = comePersonaggio(b);
  if (!pg) return { possibili: [], no: [] };
  const s = calcolaScheda(pg, d);
  const possibili: CambioPossibile[] = [];
  const no: string[] = [];
  for (const m of s.magia) {
    const c = m.cambio;
    if (m.preparati && c) {
      if (c.quando === 'riposoLungo') possibili.push({
        magia: m.id, nome: m.nome, tipo: 'preparati', quanti: c.quanti, attuali: m.preparati.scelti, pagina: c.srd.pagina,
        regola: c.quanti === 'tutti'
          ? `Puoi cambiare tutti gli incantesimi preparati${m.preparatiDa === 'libro' ? ', scegliendo tra quelli del tuo libro' : ''}.`
          : `Puoi cambiare ${c.quanti === 1 ? 'un incantesimo preparato' : `${c.quanti} incantesimi preparati`}.`,
      });
      else no.push(`${m.nome}: gli incantesimi si cambiano solo quando sali di livello (SRD p. ${c.srd.pagina}).`);
    } else if (c && c.quando === 'livello' && (m.incantesimiQuanti > 0 || m.trucchetti.attesi > 0))
      no.push(`${m.nome}: gli incantesimi si cambiano solo quando sali di livello (SRD p. ${c.srd.pagina}).`);
    const t = m.cambioTrucchetti;
    if (t?.quando === 'riposoLungo' && m.scelte.trucchetti)
      possibili.push({
        magia: m.id, nome: m.nome, tipo: 'trucchetti', quanti: t.quanti, pagina: t.srd.pagina,
        attuali: m.trucchetti.scelti.filter((x) => !(m.trucchetti.fissi ?? []).includes(x)),
        regola: `Puoi cambiare ${t.quanti === 1 ? 'un trucchetto' : `${t.quanti} trucchetti`}.`,
      });
  }
  return { possibili, no };
}

// Con cosa si può sostituire un incantesimo: quelli della stessa fonte non ancora presi né dati da un'altra fonte
export function sostituti(b: Bozza, c: CambioPossibile, d: Dati = DATI) {
  return opzioniIncantesimi(b, c.magia, c.tipo, d).filter((o) => o.stato === 'sceglibile' || o.stato === 'pieno');
}

// Quanti ne sono già stati cambiati rispetto a prima del riposo (per «un incantesimo» del paladino e del ranger)
export const cambiati = (prima: Id[], ora: Id[]) => ora.filter((x) => !prima.includes(x)).length;

export function cambia(b: Bozza, c: CambioPossibile, vecchio: Id, nuovo: Id, prima: Id[], d: Dati = DATI): Bozza {
  if (!sostituti(b, c, d).some((o) => o.id === nuovo)) return b;
  const dopo = sostituisci(b, c.magia, c.tipo, vecchio, nuovo, d);
  const pg = comePersonaggio(dopo)!;
  const m = calcolaScheda(pg, d).magia.find((x) => x.id === c.magia)!;
  const ora = c.tipo === 'trucchetti' ? m.trucchetti.scelti : m.preparati?.scelti ?? [];
  if (c.quanti !== 'tutti' && cambiati(prima, ora) > c.quanti) return b;     // oltre il limite della classe
  return dopo;
}
