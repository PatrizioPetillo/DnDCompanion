// Il talento del 4° livello (e poi 8°, 12°…), 23/11/2026, scelte di Patrizio: tutti i talenti dell'SRD con i requisiti
// (gli altri restano visibili ma spenti, con il motivo), più «un altro talento» scritto a mano, con avviso.
// Sotto la tendina compaiono le scelte del talento preso: l'Aumento con i due pulsanti, Lottatore con FOR o DES, ecc.
import { DATI, calcolaScheda } from '../regole';
import type { Dati } from '../regole/dati';
import { ABILITA, NOME_CAR } from '../regole/dati/base';
import { NOME_LISTA } from '../regole/dati';
import { TALENTO_LIBERO } from '../regole/dati/classi';
import { CARATTERISTICHE, type Car, type Id } from '../regole/tipi';
import { nome } from './classe';
import type { Tendine } from './nuovo-livello';
import type { Opzione } from './opzioni';
import { comePersonaggio, type Bozza } from './percorso';

export const NOME_TALENTO_LIBERO = 'Un altro talento (scritto a mano, fuori dall\'SRD)';
const CATEGORIE: Record<string, string> = { generale: 'generale', origine: 'd\'origine', stileCombattimento: 'stile di combattimento' };

// b: la bozza al livello in cui si sceglie il talento, con le scelte fatte finora; sceltaId: 'talento-4'
// Nella creazione a un livello alto il passo Classe viene prima di specie, background e punteggi: si calcola con
// quello che c'è (specie di ripiego) e i requisiti di caratteristica li controlla poi la scheda, con un avviso.
export function tendineTalento(b: Bozza, sceltaId: Id, d: Dati = DATI, creazione = false): Tendine[] {
  const senza = comePersonaggio({ ...b, specie: b.specie ?? 'human', scelte: { ...b.scelte, [sceltaId]: [] } });
  if (!senza) return [];
  const prima = calcolaScheda(senza, d);
  const livello = b.livello ?? 1;
  const classe = b.classe ? d.classi[b.classe] : undefined;
  const punteggi = Object.fromEntries(CARATTERISTICHE.map((c) => [c, prima.punteggi[c].totale])) as Record<Car, number>;

  const ordine = Object.values(d.talenti).sort((a, x) => (a.id === 'ability-score-improvement' ? -1 : x.id === 'ability-score-improvement' ? 1 : a.nome.localeCompare(x.nome, 'it')));
  const opzioni: Opzione[] = ordine.map((t) => {
    const req = t.prerequisito;
    const motivo = prima.talenti.includes(t.id) && !t.ripetibile ? 'ce l\'hai già'
      : req?.livello && livello < req.livello ? `dal ${req.livello}° livello`
            : !creazione && req?.caratteristica && !req.caratteristica.tra.some((c) => punteggi[c] >= req.caratteristica!.minimo) ? `serve ${req.caratteristica.tra.map((c) => NOME_CAR[c]).join(' o ')} ${req.caratteristica.minimo}`
      : req?.feature && !classe?.features.some((f) => f.livello <= livello && f.id.endsWith(req.feature!)) ? 'serve Stile di combattimento'
      : undefined;
    return { id: t.id, nome: `${t.nome} (${CATEGORIE[t.categoria] ?? t.categoria})`, disattivata: !!motivo, ...(motivo ? { motivo } : {}) };
  });
  opzioni.push({ id: TALENTO_LIBERO, nome: NOME_TALENTO_LIBERO, disattivata: false });
  const out: Tendine[] = [{ chiave: `scelta:${sceltaId}`, titolo: 'Talento', quante: 1, opzioni }];

  const scelto = (b.scelte[sceltaId] ?? [])[0];
  if (scelto === TALENTO_LIBERO) { out.push({ chiave: `scelta:${sceltaId}.nome`, titolo: 'Nome del talento', quante: 1, opzioni: [], tipo: 'testo' }); return out; }
  const t = scelto ? d.talenti[scelto] : undefined;
  if (!t) return out;
  const istanza = prima.talenti.includes(t.id) ? `${t.id}@${sceltaId.replace(/\./g, '-')}` : t.id;
  const sotto = (id: Id) => id.replace(`${t.id}.`, `${istanza}.`);
  for (const e of t.effetti) {
    if (e.tipo !== 'scelta' || e.scelta.tipo === 'trucchetto') continue;   // i trucchetti li chiede il blocco Magia
    const s = e.scelta;
    const chiave = `scelta:${sotto(s.id)}`;
    if (t.id === 'ability-score-improvement') {
      out.push({ chiave, titolo: 'Aumento', quante: 2, tipo: 'aumento', punteggi,
        opzioni: CARATTERISTICHE.map((c) => ({ id: c, nome: `${NOME_CAR[c]} (${punteggi[c]})`, disattivata: punteggi[c] >= 20, ...(punteggi[c] >= 20 ? { motivo: 'è già a 20' } : {}) })) });
      continue;
    }
    let ids: Id[] = s.opzioni ?? [];
    if (s.tipo === 'abilita' && !s.opzioni) ids = Object.keys(ABILITA);
    if (s.tipo === 'incantesimo' && s.filtro && 'lista' in s.filtro) {
      const f = s.filtro;
      const lista = typeof f.lista === 'object' && f.lista && 'daScelta' in f.lista ? (b.scelte[sotto(f.lista.daScelta)] ?? [])[0] : f.lista as string | undefined;
      ids = lista ? Object.values(d.incantesimi).filter((i) => i.liste.includes(lista) && (f.livello === undefined || i.livello === f.livello)).map((i) => i.id) : [];
    }
    const titolo = s.tipo === 'caratteristica' ? 'Caratteristica' : s.tipo === 'abilita' ? 'Abilità' : s.tipo === 'listaIncantesimi' ? 'Lista di incantesimi'
      : s.tipo === 'incantesimo' ? 'Incantesimo di 1° livello' : t.nome;
    const mie = b.scelte[sotto(s.id)] ?? [];
    out.push({ chiave, titolo, quante: s.quantita, opzioni: ids.map((o) => {
      const motivo = s.tipo === 'caratteristica' && punteggi[o as Car] >= 20 ? 'è già a 20'
        : s.tipo === 'abilita' && prima.abilita[o]?.competente && !mie.includes(o) ? 'hai già la competenza' : undefined;
      const n = s.tipo === 'caratteristica' ? `${NOME_CAR[o as Car]} (${punteggi[o as Car]})` : s.tipo === 'listaIncantesimi' ? NOME_LISTA[o] ?? o
        : s.tipo === 'incantesimo' ? d.incantesimi[o]?.nome ?? o : s.tipo === 'abilita' ? ABILITA[o]?.nome ?? o : nome(s, o, d);
      return { id: o, nome: n, disattivata: !!motivo, ...(motivo ? { motivo } : {}) };
    }) });
  }
  return out;
}
