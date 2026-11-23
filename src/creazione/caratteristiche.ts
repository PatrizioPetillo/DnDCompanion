// Passo 5: Caratteristiche (sezione 5.2). Funzioni pure per la schermata; le regole sono nell'SRD p. 21.
import { ABILITA, NOME_CAR, COSTO_POINT_BUY, PUNTI_POINT_BUY, SERIE_PER_CLASSE, SERIE_STANDARD } from '../regole/dati/base';
import { calcolaScheda } from '../regole';
import { DATI, type Dati } from '../regole/dati';
import { CARATTERISTICHE, type Car, type Id, type MetodoPunteggi, type Personaggio, type Scheda, type Tavolo } from '../regole/tipi';
import { comePersonaggio, type Bozza } from './percorso';

type Punteggi = Personaggio['punteggi'];
export const NON_ASSEGNATO = 0;   // serie standard: valore non ancora scelto

const daLista = (v: number[]) => Object.fromEntries(CARATTERISTICHE.map((c, i) => [c, v[i]])) as Record<Car, number>;

export function punteggiIniziali(metodo: MetodoPunteggi, classe?: Id): Punteggi {
  if (metodo === 'pointBuy27') return { metodo, base: daLista([8, 8, 8, 8, 8, 8]) };
  if (metodo === 'tiri') return { metodo, base: daLista(Array(6).fill(NON_ASSEGNATO)) };   // li scrive il giocatore, dai dadi veri
  const consigliata = classe ? SERIE_PER_CLASSE[classe] : undefined;
  return { metodo, base: daLista(consigliata ?? Array(6).fill(NON_ASSEGNATO)) };
}

// Point buy con i valori consigliati per la classe (23/11): la serie standard costa esattamente 27 punti (9+7+5+4+2+0),
// quindi la distribuzione che l'SRD suggerisce per ogni classe (p. 21) vale anche nel point buy
export function consigliatiPointBuy(classe: Id): Punteggi | null {
  const serie = SERIE_PER_CLASSE[classe];
  return serie ? { metodo: 'pointBuy27', base: daLista(serie) } : null;
}

export function spesaPointBuy(base: Record<Car, number>): { spesi: number; restanti: number } {
  const spesi = CARATTERISTICHE.reduce((s, c) => s + (COSTO_POINT_BUY[base[c]] ?? 0), 0);
  return { spesi, restanti: PUNTI_POINT_BUY - spesi };
}

export function opzioniPunteggio(p: Punteggi, c: Car): { valore: number; etichetta: string; disattivato: boolean }[] {
  if (p.metodo === 'pointBuy27') {
    const { spesi } = spesaPointBuy(p.base);
    const attuale = COSTO_POINT_BUY[p.base[c]] ?? 0;
    return Object.entries(COSTO_POINT_BUY).map(([v, costo]) => ({
      valore: Number(v),
      etichetta: `${v} · ${costo} pt`,
      disattivato: spesi - attuale + costo > PUNTI_POINT_BUY,
    }));
  }
  // Tiri (p. 21): 4d6 tenendo i tre più alti, quindi da 3 a 18; nessuno scambio, i numeri possono ripetersi
  if (p.metodo === 'tiri') return Array.from({ length: 16 }, (_, i) => ({ valore: 18 - i, etichetta: String(18 - i), disattivato: false }));
  // Serie standard: tutti e sei i valori; se uno è già usato, sceglierlo scambia i due punteggi (vedi assegna).
  return SERIE_STANDARD.map((v) => {
    const dove = CARATTERISTICHE.find((x) => x !== c && p.base[x] === v);
    return { valore: v, etichetta: dove ? `${v} (ora a ${NOME_CAR[dove]})` : String(v), disattivato: false };
  });
}

export function assegna(p: Punteggi, c: Car, v: number): Punteggi {
  const base = { ...p.base, [c]: v };
  if (p.metodo === 'serieStandard') {
    const dove = CARATTERISTICHE.find((x) => x !== c && p.base[x] === v);
    if (dove) base[dove] = p.base[c];
  }
  return { ...p, base };
}

export const tuttiAssegnati = (p: Punteggi) => CARATTERISTICHE.every((c) => p.base[c] !== NON_ASSEGNATO);

export function abilitaPer(c: Car, scheda: Scheda) {
  return Object.entries(ABILITA)
    .filter(([, a]) => a.car === c)
    .map(([id, a]) => ({ id, nome: a.nome, ...scheda.abilita[id] }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
}

// ───────── Abilità della classe, scelte dentro le Caratteristiche ─────────
// 'data': competenza già data da un'altra fonte (background, specie, talento) → non cliccabile
// 'scelta': scelta con la classe · 'sceglibile': nella lista della classe, c'è posto
// 'piena': nella lista, ma hai già scelto tutte quelle che la classe dà · 'no': non è nella lista
export type StatoAbilita = 'data' | 'scelta' | 'sceglibile' | 'piena' | 'no';

export function contatoreAbilitaClasse(b: Bozza, d: Dati = DATI): { scelte: number; quante: number } {
  const s = b.classe ? d.classi[b.classe].abilita : undefined;
  return { scelte: s ? (b.scelte[s.id] ?? []).length : 0, quante: s?.quantita ?? 0 };
}

export function statoAbilita(b: Bozza, d: Dati = DATI) {
  const pg = comePersonaggio(b);
  const classe = b.classe ? d.classi[b.classe] : undefined;
  const scheda = pg ? calcolaScheda(pg, d) : undefined;
  const sceltaClasse = classe?.abilita;
  const prese = sceltaClasse ? b.scelte[sceltaClasse.id] ?? [] : [];
  const piena = !!sceltaClasse && prese.length >= sceltaClasse.quantita;
  return Object.entries(ABILITA).map(([id, a]) => {
    const altre = (scheda?.abilita[id]?.fonti ?? []).filter((f) => !classe || f !== `Classe: ${classe.nome}`)
      .filter((f) => !f.startsWith('Classe:') || !prese.includes(id));
    const nellaLista = !!sceltaClasse && (sceltaClasse.opzioni ?? []).includes(id);
    const stato: StatoAbilita = prese.includes(id) ? 'scelta'
      : scheda?.abilita[id]?.competente ? 'data'
      : !nellaLista ? 'no' : piena ? 'piena' : 'sceglibile';
    return { id, nome: a.nome, car: a.car, stato, fonte: stato === 'data' ? altre[0] : undefined,
      totale: scheda?.abilita[id]?.totale, maestria: scheda?.abilita[id]?.maestria ?? false };
  });
}

export function scegliAbilitaClasse(b: Bozza, id: Id, d: Dati = DATI): Bozza {
  const s = b.classe ? d.classi[b.classe].abilita : undefined;
  const voce = statoAbilita(b, d).find((a) => a.id === id);
  if (!s || !voce) return b;
  const prese = b.scelte[s.id] ?? [];
  if (voce.stato === 'scelta') {
    // Tolta l'abilità, se aveva la Maestria la perde anche lei (la Maestria richiede la competenza, p. 61)
    const m = sceltaMaestria(b, d);
    const maestria = m && (b.scelte[m.id] ?? []).includes(id) ? { [m.id]: (b.scelte[m.id] ?? []).filter((x) => x !== id) } : {};
    return { ...b, scelte: { ...b.scelte, [s.id]: prese.filter((x) => x !== id), ...maestria } };
  }
  if (voce.stato === 'sceglibile') return { ...b, scelte: { ...b.scelte, [s.id]: [...prese, id] } };
  return b;
}

// Un riquadro è «da completare» se mancano abilità della classe e lì ce n'è almeno una ancora sceglibile:
// bordo evidenziato e riquadro aperto.
export function daCompletare(b: Bozza, c: Car, d: Dati = DATI): boolean {
  const { scelte, quante } = contatoreAbilitaClasse(b, d);
  return scelte < quante && statoAbilita(b, d).some((a) => a.car === c && a.stato === 'sceglibile');
}

// ───────── Maestria (ladro, p. 61): competenza doppia su abilità in cui hai già competenza ─────────
function sceltaMaestria(b: Bozza, d: Dati): { id: Id; quantita: number } | undefined {
  const classe = b.classe ? d.classi[b.classe] : undefined;
  for (const f of classe?.features.filter((x) => x.livello <= 1) ?? []) for (const e of f.effetti)
    if (e.tipo === 'scelta' && e.scelta.tipo === 'maestria') return { id: e.scelta.id, quantita: e.scelta.quantita };
  return undefined;
}

export function contatoreMaestria(b: Bozza, d: Dati = DATI): { scelte: number; quante: number } {
  const s = sceltaMaestria(b, d);
  return { scelte: s ? (b.scelte[s.id] ?? []).length : 0, quante: s?.quantita ?? 0 };
}

export function scegliMaestria(b: Bozza, id: Id, d: Dati = DATI): Bozza {
  const s = sceltaMaestria(b, d);
  if (!s) return b;
  const prese = b.scelte[s.id] ?? [];
  if (prese.includes(id)) return { ...b, scelte: { ...b.scelte, [s.id]: prese.filter((x) => x !== id) } };
  const voce = statoAbilita(b, d).find((a) => a.id === id);
  if (!voce || !(voce.stato === 'data' || voce.stato === 'scelta') || prese.length >= s.quantita) return b;
  return { ...b, scelte: { ...b.scelte, [s.id]: [...prese, id] } };
}

// Metodi che si possono usare: senza tavolo tutti e tre; con il tavolo quelli del master.
// Si parte dal point buy se c'è, altrimenti dal primo ammesso.
export const TUTTI_I_METODI: MetodoPunteggi[] = ['pointBuy27', 'serieStandard', 'tiri'];
export const metodiAmmessi = (t?: Tavolo): MetodoPunteggi[] => t?.metodiPunteggi.length ? TUTTI_I_METODI.filter((m) => t.metodiPunteggi.includes(m)) : TUTTI_I_METODI;
export const metodoIniziale = (t?: Tavolo): MetodoPunteggi => metodiAmmessi(t).includes('pointBuy27') ? 'pointBuy27' : metodiAmmessi(t)[0];
