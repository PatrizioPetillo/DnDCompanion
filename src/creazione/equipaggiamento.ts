// Passo Equipaggiamento (SRD p. 23): pacchetto A/B(/C) della classe, A/B del background, e un negozio ridotto
// per spendere le monete (armi, armature, focus, dotazioni, strumenti, munizioni, componenti dei tuoi incantesimi).
// Gli altri oggetti si aggiungono come «personalizzati», con nome e prezzo scritti a mano.
import { comePersonaggio, type Bozza } from './percorso';
import { calcolaScheda, materiale } from '../regole/motore';
import { DATI, type Dati } from '../regole/dati';
import { ARMI } from '../regole/dati/base';
import type { Id, Personaggio } from '../regole/tipi';

// Prezzo come nell'SRD (p. 89): 1 mo = 10 ma = 100 mr
export function prezzo(mo: number): string {
  const mr = Math.round(mo * 100);
  const parti: string[] = [];
  if (mr >= 100) parti.push(`${String(Math.floor(mr / 100)).replace(/\B(?=(\d{3})+$)/g, '.')} mo`);   // 1.500 mo, come nell'SRD italiano
  if (Math.floor(mr / 10) % 10) parti.push(`${Math.floor(mr / 10) % 10} ma`);
  if (mr % 10) parti.push(`${mr % 10} mr`);
  return parti.join(' ') || '0 mo';
}

const equip = (b: Bozza): Personaggio['equipaggiamento'] => b.equipaggiamento ?? { classe: 'A', background: 'A' };

// Le opzioni di un pacchetto, per le schede A/B/C: cosa contiene e quante monete
export interface OpzionePacchetto { id: string; voci: string[]; mo: number }
export function opzioniPacchetto(b: Bozza, quale: 'classe' | 'background', d: Dati = DATI): OpzionePacchetto[] {
  const fonte = quale === 'classe' ? (b.classe ? d.classi[b.classe] : undefined) : (b.background ? d.background[b.background] : undefined);
  if (!fonte) return [];
  return Object.entries(fonte.equipaggiamento).map(([id, p]) => ({
    id, mo: p.mo,
    voci: p.oggetti.map((x) => `${x.quantita > 1 ? `${x.quantita} × ` : ''}${d.oggetti[x.oggetto]?.nome ?? x.oggetto}`),
  }));
}

// Scegliere un pacchetto: le scelte degli oggetti «a scelta» che non ci sono più si tolgono (lo strumento del bardo)
export function scegliPacchetto(b: Bozza, quale: 'classe' | 'background', opzione: string, d: Dati = DATI): Bozza {
  const e = { ...equip(b), [quale]: opzione } as Personaggio['equipaggiamento'];
  const presenti = new Set([...(b.classe ? d.classi[b.classe].equipaggiamento[e.classe]?.oggetti ?? [] : []),
    ...(b.background ? d.background[b.background].equipaggiamento[e.background]?.oggetti ?? [] : [])].map((x) => x.oggetto));
  const scelte = { ...b.scelte };
  for (const o of Object.values(d.oggetti)) if (o.daScelta && o.opzioni && !presenti.has(o.id)) delete scelte[o.daScelta];
  return { ...b, equipaggiamento: e, scelte };
}

// ───────── Negozio ─────────
// Le munizioni si comprano a confezioni (p. 96): 20 frecce o 20 quadrelli
export const CONFEZIONE: Record<Id, number> = { arrows: 20, bolts: 20 };

export interface Articolo { id: Id; nome: string; prezzo: number; etichettaPrezzo: string; unita: number; comprati: number; nota?: string; troppoCaro: boolean }
export interface Reparto { id: string; titolo: string; articoli: Articolo[] }

export function negozio(b: Bozza, d: Dati = DATI): Reparto[] {
  const pg = comePersonaggio(b);
  if (!pg) return [];
  const s = calcolaScheda(pg, d);
  const classe = d.classi[pg.classe];
  const extra = pg.equipaggiamento.extra ?? [];
  const comprati = (id: Id) => extra.filter((x) => x.oggetto === id).reduce((t, x) => t + x.quantita, 0);
  const competenteArma = (id: Id) => classeCompetente(s.addestramentoArmi, id);
  const articolo = (id: Id, nota?: string): Articolo => {
    const o = d.oggetti[id];
    const m = materiale(id, d);
    const unita = CONFEZIONE[id] ?? 1;
    const p = (o?.costoMo ?? m?.costoMo ?? 0) * unita;
    return { id, nome: unita > 1 ? `${o!.nome} (${unita})` : (o?.nome ?? m!.nome), prezzo: p, etichettaPrezzo: prezzo(p), unita,
      comprati: comprati(id), ...(nota ? { nota } : {}), troppoCaro: p > s.monete.totale + 1e-9 };
  };
  const per = (filtro: (id: Id) => boolean) => Object.values(d.oggetti).filter((o) => o.costoMo !== undefined && filtro(o.id)).map((o) => o.id);

  const materiali = s.avvisi.filter((a) => a.id.startsWith('materiale:')).map((a) => a.id)
    .concat(extra.filter((x) => x.oggetto.startsWith('materiale:')).map((x) => x.oggetto));
  const focusUtili: Record<Id, string[]> = { bard: ['strumentoMusicale'], cleric: ['sacro'], paladin: ['sacro'], druid: ['druidico'],
    ranger: ['druidico'], sorcerer: ['arcano'], warlock: ['arcano'], wizard: ['arcano'] };
  const utili = focusUtili[classe.id] ?? [];
  const addestramento = new Set<string>(s.addestramentoArmature);
  const notaArmatura = (id: Id) => {
    const a = d.oggetti[id].armatura!;
    if (!addestramento.has(a.categoria)) return 'senza addestramento';
    if (a.forza && s.punteggi.FOR.totale < a.forza) return `richiede Forza ${a.forza}`;
    return undefined;
  };
  const reparti: Reparto[] = [
    { id: 'materiali', titolo: 'Componenti dei tuoi incantesimi', articoli: [...new Set(materiali)].map((id) => articolo(id, 'il focus non la sostituisce')) },
    { id: 'focus', titolo: 'Focus da incantatore', articoli: per((id) => d.oggetti[id].categoria === 'focus' && (d.oggetti[id].focus === 'componenti' || utili.includes(d.oggetti[id].focus!)))
      .map((id) => articolo(id)) },
    { id: 'armi-semplici', titolo: 'Armi semplici', articoli: per((id) => d.oggetti[id].categoria === 'arma' && ARMI[id]?.categoria === 'semplice')
      .map((id) => articolo(id, competenteArma(id) ? undefined : 'senza competenza')) },
    { id: 'armi-guerra', titolo: 'Armi da guerra', articoli: per((id) => d.oggetti[id].categoria === 'arma' && ARMI[id]?.categoria === 'guerra')
      .map((id) => articolo(id, competenteArma(id) ? undefined : 'senza competenza')) },
    { id: 'armature', titolo: 'Armature e scudo', articoli: per((id) => d.oggetti[id].categoria === 'armatura').map((id) => articolo(id, notaArmatura(id))) },
    { id: 'munizioni', titolo: 'Munizioni', articoli: ['arrows', 'bolts', 'quiver'].map((id) => articolo(id)) },
    { id: 'dotazioni', titolo: 'Dotazioni', articoli: per((id) => d.oggetti[id].categoria === 'dotazione').map((id) => articolo(id)) },
    { id: 'strumenti', titolo: 'Strumenti', articoli: per((id) => d.oggetti[id].categoria === 'strumento').map((id) => articolo(id)) },
  ];
  return reparti.filter((r) => r.articoli.length > 0);
}

function classeCompetente(addestramento: string[], id: Id): boolean {
  const a = ARMI[id];
  if (!a) return true;
  if (a.categoria === 'semplice') return addestramento.includes('semplici');
  return addestramento.includes('marziali')
    || (addestramento.includes('marzialiLeggere') && a.proprieta.includes('leggera'))
    || (addestramento.includes('marzialiAccurateOLeggere') && (a.proprieta.includes('leggera') || a.proprieta.includes('accurata')));
}

// Comprare e togliere: una confezione alla volta
export function compra(b: Bozza, id: Id): Bozza {
  const e = equip(b);
  const unita = CONFEZIONE[id] ?? 1;
  const extra = [...(e.extra ?? [])];
  const i = extra.findIndex((x) => x.oggetto === id);
  if (i >= 0) extra[i] = { ...extra[i], quantita: extra[i].quantita + unita };
  else extra.push({ oggetto: id, quantita: unita });
  return { ...b, equipaggiamento: { ...e, extra } };
}

export function togli(b: Bozza, id: Id): Bozza {
  const e = equip(b);
  const unita = CONFEZIONE[id] ?? 1;
  const extra = (e.extra ?? []).map((x) => (x.oggetto === id ? { ...x, quantita: x.quantita - unita } : x)).filter((x) => x.quantita > 0);
  return { ...b, equipaggiamento: { ...e, extra } };
}

// Oggetto fuori dal negozio: nome e prezzo scritti a mano
export function aggiungiPersonalizzato(b: Bozza, nome: string, costoMo: number): Bozza {
  const e = equip(b);
  const id = `personalizzato:${nome.trim().toLowerCase().replace(/[^a-z0-9àèéìòù]+/g, '-')}-${(e.extra ?? []).length + 1}`;
  return { ...b, equipaggiamento: { ...e, extra: [...(e.extra ?? []), { oggetto: id, quantita: 1, nome: nome.trim(), costoMo: Math.max(0, costoMo) }] } };
}
