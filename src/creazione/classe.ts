// Passo 2: le scelte della classe, dentro la sua scheda (come in Character Keep): Padronanza d'armi,
// strumenti, Ordine divino / primordiale, Stile di combattimento, Supplica occulta, lingua del Gergo ladresco.
// Le abilità e la Maestria si scelgono nelle Caratteristiche; i trucchetti nella Magia.
import { DATI } from '../regole';
import type { Dati } from '../regole/dati';
import { ARMI, NOME_LINGUA, STRUMENTI_ARTIGIANO, STRUMENTI_MUSICALI } from '../regole/dati/base';
import type { Id, Scelta } from '../regole/tipi';
import type { Opzione } from './opzioni';
import type { Bozza } from './percorso';

// Nomi italiani delle opzioni (SRD 5.2.1 italiano)
const NOMI_OPZIONI: Record<Id, string> = {
  protector: 'Protettore', thaumaturge: 'Taumaturgo', magician: 'Mago', warden: 'Custode',
  'armor-of-shadows': 'Armatura delle ombre', 'eldritch-mind': 'Mente occulta',
  'pact-of-the-chain': 'Patto della catena', 'pact-of-the-blade': 'Patto della lama', 'pact-of-the-tome': 'Patto del tomo',
};
const NON_QUI = new Set(['abilita', 'maestria', 'trucchetto', 'incantesimo']);

function nome(s: Scelta, o: Id, d: Dati): string {
  if (s.tipo === 'maestriaArma') return ARMI[o] ? `${ARMI[o].nome} · ${ARMI[o].padronanza}` : o;
  if (s.tipo === 'strumento') return STRUMENTI_MUSICALI[o] ?? STRUMENTI_ARTIGIANO[o] ?? o;
  if (s.tipo === 'lingua') return NOME_LINGUA[o] ?? o;
  if (s.tipo === 'talento') return d.talenti[o]?.nome ?? o;
  return NOMI_OPZIONI[o] ?? o;
}

export interface SceltaDiClasse { id: Id; titolo: string; quantita: number; opzioni: Opzione[] }

export function scelteDiClasse(b: Bozza, d: Dati = DATI): SceltaDiClasse[] {
  const classe = b.classe ? d.classi[b.classe] : undefined;
  if (!classe) return [];
  const origine = b.scelte['origine.lingue'] ?? [];
  const out: SceltaDiClasse[] = [];
  for (const f of classe.features.filter((x) => x.livello <= 1)) for (const e of f.effetti) {
    if (e.tipo !== 'scelta' && e.tipo !== 'opzioni') continue;
    const s = e.scelta;
    if (NON_QUI.has(s.tipo)) continue;
    const ids = s.opzioni ?? (s.filtro && 'categoriaTalento' in s.filtro
      ? Object.values(d.talenti).filter((t) => t.categoria === (s.filtro as { categoriaTalento: string }).categoriaTalento).map((t) => t.id) : []);
    out.push({
      // Il titolo è il nome del privilegio, tranne quando la scelta non è il privilegio stesso: gli strumenti del bardo
      // stanno dentro «Incantesimi» (SRD p. 31-32) e non vanno chiamati così (segnalato da Patrizio il 20/11)
      id: s.id, titolo: s.tipo === 'strumento' ? (ids.every((o) => o in STRUMENTI_MUSICALI) ? 'Strumento musicale' : 'Strumento') : f.nome,
      quantita: s.quantita,
      opzioni: ids.map((o) => {
        const motivo = s.tipo === 'lingua' && origine.includes(o) ? 'la conosci già' : undefined;
        return { id: o, nome: nome(s, o, d), disattivata: !!motivo, ...(motivo ? { motivo } : {}) };
      }),
    });
  }
  return out;
}
