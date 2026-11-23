// Motore delle regole: dal Personaggio (solo scelte) alla Scheda (tutti i valori, ognuno con la sua somma).
// TypeScript puro, nessuna dipendenza dall'interfaccia. Ogni regola cita la pagina dell'SRD 5.2.
import { copieDoppie, nomeOggetto, oggettiAttivi, sintonizzati, MAX_SINTONIA } from './oggetti-magici';
import { OGGETTI_MAGICI } from './dati/oggetti-magici';
import type { EffettoMagico } from './dati/oggetti-magici';
import { ABILITA, ALLINEAMENTI, ARMI, COSTO_POINT_BUY, LINGUE_RARE, LINGUE_STANDARD, NOME_LINGUA, MATERIALE_DA_OGGETTO, NOME_CAR, PUNTI_POINT_BUY, SERIE_STANDARD, TUTTE_LE_ABILITA } from './dati/base';
import { DATI, NOME_LISTA, type Dati } from './dati';
import { DUE_MANI_ARMI, GITTATA_ARMI } from './dati/oggetti';
import { metri } from './misure';
import { avvisiTavolo, coperto } from './tavolo';

import { LIVELLO_MASSIMO } from './livelli';
import { LIVELLO_SUPPLICA, REQUISITO_SUPPLICA, TALENTO_LIBERO } from './dati/classi';
export { LIVELLO_MASSIMO };
import {
  CARATTERISTICHE, type Avviso, type Car, type ConcessioneMagia, type Effetto, type FormulaCA, type Id,
  type Attacco, type LivelloAvviso, type MagiaCalcolata, type Numero, type Personaggio, type RifSRD, type Risorsa, type Scelta,
  type Scheda, type Termine, type Valore, type VoceInventario,
} from './tipi';

const numero = (termini: Termine[]): Numero => ({ totale: termini.reduce((s, t) => s + t.valore, 0), termini });

// Componente materiale con costo, comprabile al passo Equipaggiamento: id «materiale:<incantesimo>»
export function materiale(id: Id, d: Dati = DATI): { nome: string; costoMo: number } | null {
  if (!id.startsWith('materiale:')) return null;
  const inc = d.incantesimi[id.slice('materiale:'.length)];
  const M = inc?.componenti.M;
  if (!inc || !M?.costoMo) return null;
  const it = inc.it?.componenti.match(/M \((.*)\)\s*$/)?.[1];
  return { nome: `${inc.nome}: ${it ?? M.testo}`, costoMo: M.costoMo };
}

// Modificatore: tabella di p. 21 = (punteggio − 10) / 2 per difetto
export const modificatore = (punteggio: number) => Math.floor((punteggio - 10) / 2);

interface Voce { effetto: Effetto; fonte: string; parametri: Record<Id, Id> }

// Cosa manca, in parole del giocatore (per «Avanti (N da fare)» e il Riepilogo)
const COSA_SCEGLIERE: Partial<Record<Scelta['tipo'], string>> = {
  abilita: 'scegli le abilità', strumento: 'scegli lo strumento', talento: 'scegli il talento',
  caratteristica: 'scegli la caratteristica per gli incantesimi', listaIncantesimi: 'scegli la lista degli incantesimi',
  opzione: 'fai la scelta', maestriaArma: 'scegli le armi della Padronanza', maestria: 'scegli le abilità della Maestria', lingua: 'scegli le lingue',
};

export function calcolaScheda(pg: Personaggio, d: Dati = DATI): Scheda {
  const avvisi: Avviso[] = [];
  const avvisa = (id: Id, livello: LivelloAvviso, messaggio: string, srd?: RifSRD) => {
    if (!avvisi.some((a) => a.id === id)) avvisi.push({ id, livello, messaggio, ...(srd ? { srd } : {}) });
  };

  const classe = d.classi[pg.classe];
  const specie = d.specie[pg.specie];
  const bg = d.background[pg.background];
  if (!classe || !specie || !bg) throw new Error('Classe, specie o background sconosciuti');

  const livello = pg.livello;
  const PB = livello >= 17 ? 6 : livello >= 13 ? 5 : livello >= 9 ? 4 : livello >= 5 ? 3 : 2;   // p. 23: +2 ai livelli 1-4, +3 ai 5-8…
  // Aumento di livello (23/11): i dati delle classi arrivano per ora fino al 2° livello
  if (!Number.isInteger(livello) || livello < 1 || livello > LIVELLO_MASSIMO)
    avvisa('livello-non-supportato', 'errore', `L'app calcola per ora i livelli da 1 a ${LIVELLO_MASSIMO}: il ${livello}° livello arriverà più avanti`, { pagina: 23 });

  // ───────── Punteggi (p. 21) e bonus del background (p. 83) ─────────
  const base = pg.punteggi.base;
  if (pg.punteggi.metodo === 'pointBuy27') {
    const fuori = CARATTERISTICHE.filter((c) => !(base[c] in COSTO_POINT_BUY));
    const spesa = CARATTERISTICHE.reduce((s, c) => s + (COSTO_POINT_BUY[base[c]] ?? 99), 0);
    if (fuori.length || spesa > PUNTI_POINT_BUY)
      avvisa('point-buy', 'errore', `Point buy: punteggi da 8 a 15 e al massimo ${PUNTI_POINT_BUY} punti (ne hai usati ${fuori.length ? 'troppi o fuori scala' : spesa})`, { pagina: 21 });
    else if (spesa < PUNTI_POINT_BUY)
      avvisa('point-buy-avanzati', 'info', `Point buy: hai ancora ${PUNTI_POINT_BUY - spesa} punti da spendere`, { pagina: 21 });
  } else if (pg.punteggi.metodo === 'serieStandard') {
    const v = CARATTERISTICHE.map((c) => base[c]).sort((a, b) => b - a);
    if (v.join() !== SERIE_STANDARD.join()) avvisa('serie-standard', 'errore', 'La serie standard è 15, 14, 13, 12, 10, 8', { pagina: 21 });
  } else if (pg.punteggi.metodo === 'tiri') {
    // 4d6, si tengono i tre più alti (p. 21): ogni punteggio va da 3 a 18
    if (CARATTERISTICHE.some((c) => base[c] !== 0 && (base[c] < 3 || base[c] > 18)))   // 0 = non ancora scritto
      avvisa('tiri', 'errore', 'Con i tiri ogni punteggio va da 3 a 18 (4d6, tieni i tre più alti)', { pagina: 21 });
  }
  const bonus = pg.bonusBackground;
  const chiavi = Object.keys(bonus) as Car[];
  const valori = chiavi.map((c) => bonus[c]!).sort();
  const schemaOk = valori.join() === '1,2' || valori.join() === '1,1,1';
  if (!schemaOk || chiavi.some((c) => !bg.caratteristiche.includes(c)))
    avvisa('bonus-background', 'errore', `${bg.nome}: +2 e +1, oppure +1 a tre, solo su ${bg.caratteristiche.join(', ')}`, { pagina: 83 });

  const punteggi = {} as Record<Car, Numero>;
  const mod = {} as Record<Car, number>;
  for (const c of CARATTERISTICHE) {
    const t: Termine[] = [{ etichetta: 'Base', valore: base[c] }];
    if (bonus[c]) t.push({ etichetta: `Background: ${bg.nome}`, valore: bonus[c]! });
    punteggi[c] = numero(t);
    if (punteggi[c].totale > 20) avvisa(`massimo-20:${c}`, 'errore', `${NOME_CAR[c]} non può superare 20 con il bonus del background`, { pagina: 83 });
    mod[c] = modificatore(punteggi[c].totale);
  }
  // Talenti dei livelli (4°, 8°…): Aumento dei punteggi (+2 a una o +1 a due) e Lottatore (+1 FOR o DES), massimo 20 (p. 87).
  // Si applicano qui, prima di tutto il resto; i requisiti di caratteristica si controllano sui punteggi di prima.
  const punteggiPrima = Object.fromEntries(CARATTERISTICHE.map((c) => [c, punteggi[c].totale])) as Record<Car, number>;
  const giaPresi: Record<Id, number> = {};
  for (const k of Object.keys(pg.scelte).filter((x) => /^talento-\d+$/.test(x) && Number(x.slice(8)) <= livello).sort((a, b) => Number(a.slice(8)) - Number(b.slice(8)))) {
    const t = pg.scelte[k][0];
    if (t !== 'ability-score-improvement' && t !== 'grappler') continue;
    const istanza = giaPresi[t] ? `${t}@${k}` : t;
    giaPresi[t] = (giaPresi[t] ?? 0) + 1;
    const cars = (pg.scelte[`${istanza}.${t === 'grappler' ? 'caratteristica' : 'aumento'}`] ?? []).filter((c): c is Car => (CARATTERISTICHE as string[]).includes(c));
    for (const c of cars) {
      punteggi[c] = numero([...punteggi[c].termini, { etichetta: d.talenti[t].nome, valore: 1 }]);
      if (punteggi[c].totale > 20) avvisa(`aumento-oltre-20:${c}`, 'errore', `${NOME_CAR[c]} non può superare 20 con ${d.talenti[t].nome}`, { pagina: 87 });
      mod[c] = modificatore(punteggi[c].totale);
    }
  }
  // Oggetti magici attivi (21/11): caratteristiche fissate (Amuleto della salute: COS 19, se era più bassa)
  const magici = oggettiAttivi(pg.oggettiMagici, d);
  const effettoMagico = <T extends EffettoMagico['tipo']>(tipo: T) =>
    magici.flatMap((o) => o.effetti.filter((e): e is Extract<EffettoMagico, { tipo: T }> => e.tipo === tipo).map((e) => ({ o, e })));
  for (const { o, e } of effettoMagico('punteggio'))
    if (punteggi[e.car].totale < e.valore) { punteggi[e.car] = numero([{ etichetta: `${o.nome} (la porta a ${e.valore})`, valore: e.valore }]); mod[e.car] = modificatore(e.valore); }
  if (sintonizzati(pg.oggettiMagici) > MAX_SINTONIA)
    avvisa('sintonia-troppi', 'errore', `Sei sintonizzato con ${sintonizzati(pg.oggettiMagici)} oggetti: il massimo è ${MAX_SINTONIA}`, { pagina: 102 });
  for (const uid of copieDoppie(pg.oggettiMagici)) {
    const o = pg.oggettiMagici!.find((x) => x.uid === uid)!;
    avvisa(`sintonia-copia:${uid}`, 'errore', `Non puoi sintonizzarti con due copie di «${nomeOggetto(o, d)}»: la seconda non dà bonus`, { pagina: 102 });
  }

  const valore = (v: Valore, min?: number): number => {
    let r: number;
    if (typeof v === 'number') r = v;
    else if ('mod' in v) r = Math.max(mod[v.mod], v.minimo ?? -99);
    else if ('competenza' in v) r = PB;
    else if ('perLivello' in v) r = v.perLivello * livello;
    else if ('perLivelli' in v) r = v.perLivelli[Math.min(livello, v.perLivelli.length) - 1] ?? 0;
    else r = 0;
    return min !== undefined ? Math.max(min, r) : r;
  };

  // ───────── Raccolta degli effetti (classe, specie, background, talenti) ─────────
  const voci: Voce[] = [];
  const scelte = new Map<Id, Scelta>();
  const fonteScelta = new Map<Id, string>();   // da dove viene ogni scelta: per dire al giocatore cosa manca e dove
  const talenti: Id[] = [];
  const parametriFissi: Record<Id, Id> = {};
  const risposta = (id: Id): Id[] => (parametriFissi[id] ? [parametriFissi[id]] : (pg.scelte[id] ?? []).filter(Boolean));

  // Un talento ripetibile preso una seconda volta (es. Iniziato alla Magia da Versatile, p. 87) diventa
  // un'«istanza» con id proprio: «magic-initiate@human-versatile». Così le sue scelte non si mescolano con la prima.
  const aggiungiTalento = (id: Id, fonte: string, parametri: Record<Id, Id> = {}, daScelta?: Id) => {
    // «Un altro talento» scritto a mano (4° livello, scelta di Patrizio): non calcolato, con avviso come per i background
    if (id === TALENTO_LIBERO) {
      const nome = (pg.scelte[`${daScelta}.nome`] ?? [])[0]?.trim() || 'Un talento fuori dall\'SRD';
      avvisa(`talento-personalizzato:${daScelta}`, 'attenzione', `${nome} (${fonte}) non è nell'SRD: l'app non ne calcola gli effetti, controllali tu sul manuale`, { pagina: 87 });
      return;
    }
    const t = d.talenti[id];
    if (!t) { avvisa(`talento-sconosciuto:${id}`, 'errore', `Talento sconosciuto: ${id}`); return; }
    if (talenti.includes(id) && !t.ripetibile) {
      avvisa(`talento-ripetuto:${id}`, 'errore', `${t.nome} ce l'hai già (${fonte}): un talento si prende una volta sola, salvo «Ripetibile»`, { pagina: 87 });
      return;
    }
    if (t.prerequisito?.livello && livello < t.prerequisito.livello)
      avvisa(`prerequisito:${id}`, 'errore', `${t.nome} richiede il livello ${t.prerequisito.livello}`, { pagina: 87 });
    const req = t.prerequisito?.caratteristica;
    if (req && !req.tra.some((c) => punteggiPrima[c] >= req.minimo))
      avvisa(`prerequisito:${id}:caratteristica`, 'errore', `${t.nome} richiede ${req.tra.map((c) => NOME_CAR[c]).join(' o ')} ${req.minimo} o più`, { pagina: 87 });
    if (t.prerequisito?.feature && !classe.features.some((f) => f.livello <= livello && f.id.endsWith(t.prerequisito!.feature!)))
      avvisa(`prerequisito:${id}:capacita`, 'errore', `${t.nome} si può prendere solo con la capacità Stile di combattimento`, { pagina: 87 });
    const volte = talenti.filter((x) => x === id).length;
    talenti.push(id);
    const istanza = volte === 0 ? id : `${id}@${daScelta ? daScelta.replace(/\./g, '-') : volte + 1}`;
    const effetti: Effetto[] = istanza === id ? t.effetti
      : JSON.parse(JSON.stringify(t.effetti).replaceAll(`"${id}.`, `"${istanza}.`).replaceAll(`"${id}"`, `"${istanza}"`));
    Object.assign(parametriFissi, parametri);
    aggiungi(effetti, `Talento: ${t.nome}`, parametri);
  };

  function aggiungi(effetti: Effetto[], fonte: string, parametri: Record<Id, Id> = {}) {
    for (const e of effetti) {
      if (e.tipo === 'scelta') { scelte.set(e.scelta.id, e.scelta); fonteScelta.set(e.scelta.id, fonte); voci.push({ effetto: e, fonte, parametri }); }
      else if (e.tipo === 'opzioni') {
        scelte.set(e.scelta.id, e.scelta);
        fonteScelta.set(e.scelta.id, fonte);
        for (const o of risposta(e.scelta.id)) if (e.effetti[o]) aggiungi(e.effetti[o], fonte, parametri);
      } else if (e.tipo === 'talento') {
        const ids = typeof e.talento === 'string' ? [e.talento] : risposta(e.talento.daScelta);
        for (const id of ids) aggiungiTalento(id, fonte, e.parametri, typeof e.talento === 'string' ? undefined : e.talento.daScelta);
      } else if (e.tipo === 'dalLivello') { if (livello >= e.livello) aggiungi(e.effetti, fonte, parametri); }
      else voci.push({ effetto: e, fonte, parametri });
    }
  }

  // Lingue: Comune + 2 standard (p. 20)
  scelte.set('origine.lingue', { id: 'origine.lingue', tipo: 'lingua', quantita: 2, opzioni: Object.keys(LINGUE_STANDARD), srd: { pagina: 20 } });
  scelte.set(classe.abilita.id, classe.abilita);
  fonteScelta.set('origine.lingue', 'Lingue');
  fonteScelta.set(classe.abilita.id, `Classe: ${classe.nome}`);
  // Il talento del background per primo: se lo stesso talento arriva anche da un'altra fonte, quella diventa la seconda istanza.
  if (bg.talentoLibero) avvisa('talento-personalizzato', 'attenzione',
    `${bg.talentoLibero.nome} (talento del background ${bg.nome}) non è nell'SRD: l'app non ne calcola gli effetti, controllali tu sul manuale`, bg.srd);
  else aggiungiTalento(bg.talento.talento, `Background: ${bg.nome}`, bg.talento.parametri);
  for (const f of classe.features.filter((f) => f.livello <= livello)) aggiungi(f.effetti, `Classe: ${classe.nome}`);
  for (const t of specie.tratti) aggiungi(t.effetti, `Specie: ${specie.nome}`);
  if (specie.lignaggi) {
    const L = specie.lignaggi;
    scelte.set(L.scelta, { id: L.scelta, tipo: 'opzione', quantita: 1, opzioni: L.opzioni.map((o) => o.id), srd: L.srd });
    fonteScelta.set(L.scelta, `Specie: ${specie.nome} (lignaggio)`);
    const scelto = L.opzioni.find((o) => o.id === risposta(L.scelta)[0]);
    if (scelto) aggiungi(scelto.effetti, `Specie: ${scelto.nome}`);
  }
  if (typeof bg.strumento !== 'string') { scelte.set(bg.strumento.id, bg.strumento); fonteScelta.set(bg.strumento.id, `Background: ${bg.nome}`); }

  // Pacchetti di equipaggiamento scelti (p. 23): gli oggetti «a scelta» con opzioni proprie (lo strumento del bardo) sono una scelta
  const pacchettoClasse = classe.equipaggiamento[pg.equipaggiamento.classe];
  const pacchettoBg = bg.equipaggiamento[pg.equipaggiamento.background];
  for (const { oggetto } of [...(pacchettoClasse?.oggetti ?? []), ...(pacchettoBg?.oggetti ?? [])]) {
    const o = d.oggetti[oggetto];
    if (o?.daScelta && o.opzioni) { scelte.set(o.daScelta, { id: o.daScelta, tipo: 'opzione', quantita: 1, opzioni: o.opzioni, srd: classe.srd ?? { pagina: 23 } }); fonteScelta.set(o.daScelta, `Equipaggiamento: ${o.nome}`); }
  }

  const effetti = <T extends Effetto['tipo']>(tipo: T) =>
    voci.filter((v) => v.effetto.tipo === tipo) as (Voce & { effetto: Extract<Effetto, { tipo: T }> })[];

  // ───────── Validazione delle scelte (non di magia: quelle più sotto) ─────────
  for (const s of scelte.values()) {
    if (parametriFissi[s.id] || s.tipo === 'trucchetto' || s.tipo === 'incantesimo') continue;
    const r = risposta(s.id);
    if (r.length < s.quantita) avvisa(`scelta-mancante:${s.id}`, 'info', `${fonteScelta.get(s.id) ?? 'Scelta'}: ${COSA_SCEGLIERE[s.tipo] ?? 'fai la scelta'} (${r.length} su ${s.quantita})`, s.srd);
    if (r.length > s.quantita) avvisa(`scelta-troppe:${s.id}`, 'errore', `${fonteScelta.get(s.id) ?? 'Scelta'}: troppe scelte (${r.length} su ${s.quantita})`, s.srd);
    for (const v of r) {
      if (s.opzioni && !s.opzioni.includes(v)) avvisa(`scelta-non-valida:${s.id}:${v}`, 'errore',
        s.tipo === 'lingua' && LINGUE_RARE[v]
          ? `${NOME_LINGUA[v]} è una lingua rara: si impara solo con una capacità che la concede, non a scelta (p. 20). Chiedi al master`
          : `${v} non è un'opzione valida per ${s.id}`, s.srd);
      if (s.filtro && 'categoriaTalento' in s.filtro && d.talenti[v]?.categoria !== s.filtro.categoriaTalento)
        avvisa(`scelta-non-valida:${s.id}:${v}`, 'errore', `${v} non è un talento della categoria richiesta`, s.srd);
    }
  }

  // ───────── Competenze nelle abilità (p. 22), doppioni (p. 8), Maestria (p. 182) ─────────
  const fontiAbilita = new Map<Id, string[]>();
  const competente = (id: Id, fonte: string) => fontiAbilita.set(id, [...(fontiAbilita.get(id) ?? []), fonte]);
  for (const a of bg.abilita) competente(a, `Background: ${bg.nome}`);
  for (const a of risposta(classe.abilita.id)) competente(a, `Classe: ${classe.nome}`);
  for (const v of effetti('scelta')) if (v.effetto.scelta.tipo === 'abilita') for (const a of risposta(v.effetto.scelta.id)) competente(a, v.fonte);
  for (const v of effetti('competenza')) if (v.effetto.categoria === 'abilita') for (const a of v.effetto.ids) competente(a, v.fonte);
  for (const [a, f] of fontiAbilita) if (f.length > 1)
    avvisa(`doppione-abilita:${a}`, 'attenzione', `${ABILITA[a]?.nome ?? a} ti arriva da ${f.join(' e ')}: la competenza non si somma due volte, puoi sceglierne un'altra`, { pagina: 8 });

  const maestria = new Set<Id>();
  for (const v of effetti('maestria')) for (const a of risposta(v.effetto.abilita.daScelta)) {
    if (!fontiAbilita.has(a)) avvisa(`maestria-senza-competenza:${a}`, 'errore', `Maestria solo su abilità in cui hai competenza`, { pagina: 182 });
    maestria.add(a);
  }
  const bonusAb = new Map<Id, Termine[]>();
  for (const v of effetti('bonusAbilita')) for (const a of v.effetto.abilita)
    bonusAb.set(a, [...(bonusAb.get(a) ?? []), { etichetta: v.effetto.etichetta, valore: valore(v.effetto.valore) }]);

  // Factotum (p. 32): metà competenza, per difetto, alle prove di abilità senza competenza
  const mezza = effetti('mezzaCompetenzaAbilita')[0];
  if (mezza) for (const a of TUTTE_LE_ABILITA) if (!fontiAbilita.has(a))
    bonusAb.set(a, [...(bonusAb.get(a) ?? []), { etichetta: mezza.effetto.etichetta, valore: Math.floor(PB / 2) }]);
  const abilita: Scheda['abilita'] = {};
  for (const a of TUTTE_LE_ABILITA) {
    const comp = fontiAbilita.has(a);
    const ma = comp && maestria.has(a);
    const extra = [...(bonusAb.get(a) ?? []), ...effettoMagico('prove').map(({ o, e }) => ({ etichetta: o.nome, valore: e.bonus }))];
    abilita[a] = {
      totale: mod[ABILITA[a].car] + (comp ? PB * (ma ? 2 : 1) : 0) + extra.reduce((s, t) => s + t.valore, 0),
      competente: comp, maestria: ma, fonti: [...(fontiAbilita.get(a) ?? []), ...extra.map((t) => t.etichetta)],
    };
  }

  // Suppliche occulte (p. 72): non si prende due volte la stessa (tranne le ripetibili, non ancora nei dati)
  const suppliche = [...scelte.keys()].filter((k) => k.startsWith('warlock.suppliche')).flatMap((k) => risposta(k));
  for (const x of new Set(suppliche)) if (suppliche.filter((y) => y === x).length > 1)
    avvisa(`supplica-doppia:${x}`, 'errore', 'Hai scelto due volte la stessa supplica occulta: scegline un\'altra', { pagina: 72 });
  for (const x of new Set(suppliche)) if ((LIVELLO_SUPPLICA[x] ?? 1) > livello)
    avvisa(`supplica-livello:${x}`, 'errore', `Questa supplica richiede il ${LIVELLO_SUPPLICA[x]}° livello da warlock`, { pagina: 72 });
  for (const x of suppliche) if (REQUISITO_SUPPLICA[x] && !suppliche.includes(REQUISITO_SUPPLICA[x]))
    avvisa(`supplica-requisito:${x}`, 'errore', `Questa supplica richiede ${REQUISITO_SUPPLICA[x] === 'pact-of-the-blade' ? 'il Patto della lama' : 'il Patto della catena'}`, { pagina: 73 });

  const tiriSalvezza = Object.fromEntries(CARATTERISTICHE.map((c) => {
    const comp = classe.tiriSalvezza.includes(c);
    return [c, { totale: mod[c] + (comp ? PB : 0) + effettoMagico('ts').reduce((s, x) => s + x.e.bonus, 0), competente: comp }];
  })) as Scheda['tiriSalvezza'];

  // ───────── PF (p. 22) e iniziativa (p. 22, Allerta p. 87) ─────────
  // Dal 2° livello (p. 23): a ogni livello il dado vita tirato (pg.tiriPf) o il valore fisso, + Costituzione, minimo 1
  const fisso = classe.dadoVita / 2 + 1;
  const livelliDopo = Array.from({ length: Math.max(0, livello - 1) }, (_, i) => i + 2).map((l) => {
    const tiro = pg.tiriPf?.[l];
    const dado = tiro !== undefined ? Math.max(1, Math.min(classe.dadoVita, Math.round(tiro))) : fisso;
    return { etichetta: `${l}° livello (${tiro !== undefined ? `tiro ${dado}` : `fisso ${fisso}`} + Costituzione)`, valore: Math.max(1, dado + mod.COS) };
  });
  const pf = numero([
    { etichetta: `Dado vita (d${classe.dadoVita})`, valore: classe.dadoVita },
    { etichetta: 'Costituzione', valore: mod.COS },
    ...livelliDopo,
    ...effetti('pfMassimi').map((v) => ({ etichetta: v.effetto.etichetta, valore: v.effetto.perLivello * livello })),
  ]);
  const iniziativa = numero([
    { etichetta: 'Destrezza', valore: mod.DES },
    ...effetti('iniziativa').map((v) => ({ etichetta: `${v.effetto.etichetta} (competenza)`, valore: PB })),
    ...effettoMagico('prove').map(({ o, e }) => ({ etichetta: o.nome, valore: e.bonus })),   // l'iniziativa è una prova di Destrezza
  ]);

  // ───────── Magia (p. 23, 104-106) ─────────
  const concessioni: ConcessioneMagia[] = [];
  for (const v of effetti('magia')) if (!concessioni.some((c) => c.id === v.effetto.concessione.id)) concessioni.push(v.effetto.concessione);
  const extraTrucchetti = (id: Id) => effetti('trucchettiExtra').filter((v) => v.effetto.concessione === id).reduce((s, v) => s + v.effetto.quantita, 0);
  const libro = pg.incantesimi.libro ?? [];
  const lanciabili = new Set<Id>();
  const trucchettiDaFonte: [Id, string][] = [];
  const livelloMax = Math.max(0, ...(classe.slot?.[livello] ?? []).map((n, i) => (n > 0 ? i + 1 : 0)), classe.patto?.[livello]?.livello ?? 0, 1);

  const controllaIncantesimo = (sceltaId: Id, sp: Id, lista: Id | null, livelloAtteso: number | 'max') => {
    const inc = d.incantesimi[sp];
    if (!inc) { avvisa(`incantesimo-sconosciuto:${sp}`, 'errore', `Incantesimo sconosciuto: ${sp}`); return; }
    if (lista && !inc.liste.includes(lista))
      avvisa(`fuori-lista:${sceltaId}:${sp}`, 'errore', `${inc.nome} non è nella lista ${NOME_LISTA[lista] ?? lista}`, inc.srd);
    if (livelloAtteso === 'max' ? inc.livello > livelloMax || inc.livello === 0 : inc.livello !== livelloAtteso)
      avvisa(`livello-incantesimo:${sceltaId}:${sp}`, 'errore', `${inc.nome} è di livello ${inc.livello}: qui serve ${livelloAtteso === 'max' ? `un incantesimo da 1° a ${livelloMax}°` : livelloAtteso === 0 ? 'un trucchetto' : `il ${livelloAtteso}° livello`}`, inc.srd);
  };

  const magia: MagiaCalcolata[] = concessioni.map((c) => {
    const lista = c.lista ? (typeof c.lista === 'string' ? c.lista : risposta(c.lista.daScelta)[0] ?? null) : null;
    const car = (typeof c.caratteristica === 'string' ? c.caratteristica : (risposta(c.caratteristica.daScelta)[0] as Car)) ?? null;
    const nome = c.lista && typeof c.lista !== 'string' && lista ? `${c.nome} (${NOME_LISTA[lista] ?? lista})` : c.nome;

    // Trucchetti
    const fissi = c.trucchettiFissi ?? [];
    const daScegliere = (c.trucchetti ? valore(c.trucchetti.quantita) : 0) + extraTrucchetti(c.id);
    const sceltiT = c.trucchetti?.scelta ? risposta(c.trucchetti.scelta) : [];
    if (c.trucchetti?.scelta) {
      const sid = c.trucchetti.scelta;
      if (sceltiT.length < daScegliere) avvisa(`scelta-mancante:${sid}`, 'info', `${nome}: scegli ${daScegliere} trucchetti (${sceltiT.length} su ${daScegliere})`, c.srd);
      if (sceltiT.length > daScegliere) avvisa(`scelta-troppe:${sid}`, 'errore', `${nome}: conosci ${daScegliere} trucchetti, ne hai scelti ${sceltiT.length}`, c.srd);
      for (const sp of sceltiT) controllaIncantesimo(sid, sp, lista, 0);
    }
    const trucchetti = [...fissi, ...sceltiT];
    for (const t of trucchetti) { trucchettiDaFonte.push([t, nome]); lanciabili.add(t); }

    // Incantesimi scelti e sempre preparati (Iniziato alla Magia, p. 87; p. 104)
    let scelti1: Id[] = [];
    if (c.incantesimiScelti) {
      const sid = c.incantesimiScelti.scelta;
      const q = scelte.get(sid)?.quantita ?? 1;
      scelti1 = risposta(sid);
      if (scelti1.length < q) avvisa(`scelta-mancante:${sid}`, 'info', `${nome}: scegli ${q} ${q === 1 ? 'incantesimo' : 'incantesimi'} di 1° livello`, c.srd);
      for (const sp of scelti1) {
        controllaIncantesimo(sid, sp, lista, 1);
        if (c.incantesimiScelti.soloRituali && d.incantesimi[sp] && !d.incantesimi[sp].rituale)
          avvisa(`non-rituale:${sid}:${sp}`, 'errore', `${d.incantesimi[sp].nome} non è un rituale: qui servono incantesimi con l'etichetta Rituale`, c.srd);
      }
    }
    const dal = Object.entries(c.semprePreparatiDal ?? {}).filter(([l]) => livello >= Number(l)).flatMap(([, ids]) => ids);
    const semprePreparati = [...(c.semprePreparati ?? []), ...dal, ...scelti1];
    semprePreparati.forEach((s) => lanciabili.add(s));

    // Preparati (il limite non conta i sempre preparati, p. 104)
    let preparati: MagiaCalcolata['preparati'] = null;
    if (c.preparati) {
      const limite = valore(c.preparati.numero);
      const sc = pg.incantesimi.preparati[c.id] ?? [];
      preparati = { limite, scelti: sc };
      if (sc.length > limite) avvisa(`preparati-troppi:${c.id}`, 'errore', `${nome}: hai preparato ${sc.length} incantesimi, ne puoi preparare ${limite}`, c.srd);
      if (sc.length < limite) avvisa(`preparati-mancanti:${c.id}`, 'info', `${nome}: puoi preparare ancora ${limite - sc.length} incantesimi (${sc.length} su ${limite})`, c.srd);
      // Un incantesimo preparato due volte conta una volta sola (23/11, trovato preparando il 5° livello)
      for (const sp of new Set(sc.filter((x, i) => sc.indexOf(x) !== i)))
        avvisa(`preparato-doppio:${c.id}:${sp}`, 'errore', `${d.incantesimi[sp]?.nome ?? sp} è già tra i preparati: scegline un altro`, { pagina: 104 });
      for (const sp of sc) {
        controllaIncantesimo(`${c.id}.preparati`, sp, lista, 'max');
        if (c.preparati.da === 'libro' && !libro.includes(sp))
          avvisa(`non-nel-libro:${sp}`, 'errore', `${d.incantesimi[sp]?.nome ?? sp} non è nel tuo libro: il mago prepara solo dal libro`, { pagina: 78 });
        lanciabili.add(sp);
      }
    }
    // 6 al 1° livello, +2 a ogni livello (p. 78), + quelli gratis dell'Invocatore sapiente (p. 82)
    const nLibro = c.libro ? c.libro.iniziali + (c.libro.perLivello ?? 0) * (livello - 1) + effetti('libroExtra').reduce((x, v) => x + v.effetto.quanti, 0) : 0;
    if (c.libro) {
      if (libro.length < nLibro) avvisa(`libro-incompleto:${c.id}`, 'info', `Al ${livello}° livello il libro contiene ${nLibro} incantesimi (${libro.length} su ${nLibro})`, { pagina: 78 });
      if (libro.length > nLibro) avvisa(`libro-troppi:${c.id}`, 'attenzione', `Al ${livello}° livello il libro ha ${nLibro} incantesimi: 6 al 1° livello e 2 in più a ogni livello`, { pagina: 78 });
      for (const sp of new Set(libro.filter((x, i) => libro.indexOf(x) !== i)))
        avvisa(`libro-doppio:${sp}`, 'errore', `${d.incantesimi[sp]?.nome ?? sp} è già nel libro: scegline un altro`, { pagina: 78 });
      for (const sp of libro) { controllaIncantesimo(`${c.id}.libro`, sp, lista, 'max'); lanciabili.add(sp); }
    }

    const lanci = c.lanciGratuiti
      ? { incantesimi: c.lanciGratuiti.incantesimi === 'scelti' ? scelti1 : c.lanciGratuiti.incantesimi, usi: valore(c.lanciGratuiti.usi), recupero: c.lanciGratuiti.recupero }
      : null;

    const cd = car ? numero([{ etichetta: 'Base', valore: 8 }, { etichetta: 'Competenza', valore: PB }, { etichetta: NOME_CAR[car], valore: mod[car] }]) : null;
    const attacco = car ? numero([{ etichetta: 'Competenza', valore: PB }, { etichetta: NOME_CAR[car], valore: mod[car] }]) : null;
    return {
      id: c.id, nome, caratteristica: car, cd, attacco,
      cdCondizionali: cd ? (c.cdCondizionali ?? []).map((x) => ({ etichetta: x.etichetta, totale: cd.totale + x.bonus })) : [],
      trucchetti: { attesi: fissi.length + daScegliere, scelti: trucchetti, ...(fissi.length ? { fissi } : {}) },
      semprePreparati, preparati, lanciGratuiti: lanci,
      slot: c.slot ?? (c.puoUsareSlot ? 'qualsiasi' : null),
      ...(c.cambio ? { cambio: c.cambio } : {}), ...(c.cambioTrucchetti ? { cambioTrucchetti: c.cambioTrucchetti } : {}),
      fonte: c.fonte, lista,
      scelte: { ...(typeof c.caratteristica === 'string' ? {} : { caratteristica: c.caratteristica.daScelta }), ...(c.trucchetti?.scelta ? { trucchetti: c.trucchetti.scelta } : {}), ...(c.incantesimiScelti ? { incantesimi: c.incantesimiScelti.scelta } : {}) },
      libro: c.libro ? { iniziali: nLibro, scelti: libro } : null,
      preparatiDa: c.preparati?.da ?? null,
      livelloMax,
      incantesimiQuanti: c.incantesimiScelti ? scelte.get(c.incantesimiScelti.scelta)?.quantita ?? 1 : 0,
      soloRituali: !!c.incantesimiScelti?.soloRituali,
    };
  });

  // Talento ripetibile con lista: ogni volta una lista diversa (Iniziato alla Magia, p. 87)
  for (const m of magia) {
    const [base, quale] = m.id.split('@');
    if (!quale) continue;
    const primo = magia.find((x) => x.id === base);
    const lista = (c: string) => concessioni.find((x) => x.id === c)?.lista;
    const l2 = lista(m.id), l1 = lista(base);
    const val = (l: ConcessioneMagia['lista']) => (!l ? null : typeof l === 'string' ? l : risposta(l.daScelta)[0] ?? null);
    if (primo && val(l1) && val(l1) === val(l2))
      avvisa(`talento-stessa-lista:${m.id}`, 'errore', `${m.nome}: se prendi di nuovo questo talento devi scegliere una lista diversa`, { pagina: 87 });
  }

  // Doppioni tra fonti diverse: avviso, non errore (l'SRD non ha una regola, la competenza non si somma: p. 8)
  const perTrucchetto = new Map<Id, string[]>();
  for (const [t, f] of trucchettiDaFonte) perTrucchetto.set(t, [...(perTrucchetto.get(t) ?? []), f]);
  for (const [t, f] of perTrucchetto) if (f.length > 1)
    avvisa(`doppione-trucchetto:${t}`, 'attenzione', `${d.incantesimi[t]?.nome ?? t} ti arriva da ${f.join(' e ')}: puoi sceglierne un altro, il doppione non dà nulla in più`);

  // ───────── Equipaggiamento (p. 23, 89-98) ─────────
  if (!pacchettoClasse) avvisa('equipaggiamento-classe', 'errore', `Opzione di equipaggiamento non valida per ${classe.nome}`, classe.srd);
  if (!pacchettoBg) avvisa('equipaggiamento-background', 'errore', `Opzione di equipaggiamento non valida per ${bg.nome}`, bg.srd);
  const etClasse = `Classe (${pg.equipaggiamento.classe})`;
  const etBg = `Background (${pg.equipaggiamento.background})`;
  const acquisti = pg.equipaggiamento.extra ?? [];
  // Un oggetto «a scelta» diventa quello scelto (lo strumento del monaco, il gioco del Soldato, lo strumento del bardo)
  const concreto = (id: Id): Id => { const o = d.oggetti[id]; return o?.daScelta ? (risposta(o.daScelta)[0] ?? id) : id; };
  const inventarioMap = new Map<Id, VoceInventario>();
  const metti = (righe: { oggetto: Id; quantita: number; nome?: string }[], fonte: string) => {
    for (const r of righe) {
      const id = concreto(r.oggetto);
      const o = d.oggetti[id];
      const v = inventarioMap.get(id) ?? { oggetto: id, nome: o?.nome ?? materiale(id, d)?.nome ?? r.nome ?? id, quantita: 0, fonti: [],
        ...(o?.contenuto ? { contenuto: o.contenuto.map((c) => ({ nome: d.oggetti[c.oggetto]?.nome ?? c.oggetto, quantita: c.quantita })) } : {}) };
      v.quantita += r.quantita;
      if (!v.fonti.includes(fonte)) v.fonti.push(fonte);
      inventarioMap.set(id, v);
    }
  };
  metti(pacchettoClasse?.oggetti ?? [], etClasse);
  metti(pacchettoBg?.oggetti ?? [], etBg);
  metti(acquisti, 'Acquisto');
  const inventarioVoci = [...inventarioMap.values()];
  const inventario = inventarioVoci.map((v) => v.oggetto);

  // Monete: si contano in centesimi per non sballare con 0,05 mo (p. 89)
  const prezzo = (x: (typeof acquisti)[number]) => d.oggetti[x.oggetto]?.costoMo ?? materiale(x.oggetto, d)?.costoMo ?? x.costoMo ?? 0;
  const spesa = Math.round(acquisti.reduce((t, x) => t + Math.round(prezzo(x) * 100) * x.quantita, 0)) / 100;
  const monete = numero([
    { etichetta: etClasse, valore: pacchettoClasse?.mo ?? 0 }, { etichetta: etBg, valore: pacchettoBg?.mo ?? 0 },
    ...(spesa ? [{ etichetta: 'Acquisti', valore: -spesa }] : []),
    // Durante il gioco: bottino del master e spese del giocatore (21/11)
    ...(pg.movimenti?.length ? [{ etichetta: 'Durante il gioco', valore: Math.round(pg.movimenti.reduce((t, m) => t + Math.round(m.mo * 100), 0)) / 100 }] : []),
  ]);
  monete.totale = Math.round(monete.totale * 100) / 100;
  if (monete.totale < 0) avvisa('monete-negative', 'errore', pg.movimenti?.length ? `Le monete sono sotto zero di ${-monete.totale} mo: controlla le spese nello Zaino` : `Hai speso ${-monete.totale} mo più di quanto hai: togli qualcosa`, { pagina: 23 });

  // Focus da incantatore della classe (p. 96-97); la borsa per componenti vale per tutti (p. 105); il mago ha il libro (p. 77)
  const FOCUS_CLASSE: Record<Id, string[]> = {
    bard: ['strumentoMusicale'], cleric: ['sacro'], paladin: ['sacro'], druid: ['druidico'], ranger: ['druidico'],
    sorcerer: ['arcano'], warlock: ['arcano'], wizard: ['arcano'],
  };
  const focusOk = FOCUS_CLASSE[classe.id];
  if (focusOk && classe.id !== 'wizard' && !inventario.some((id) => { const f = d.oggetti[id]?.focus; return f === 'componenti' || (f && focusOk.includes(f)); }))
    avvisa('focus-mancante', 'attenzione', 'Non hai un focus da incantatore né una borsa per componenti: per gli incantesimi con componente materiale ti servono i materiali indicati', { pagina: 106 });

  // Componenti materiali con un costo: il focus non le sostituisce (p. 105-106)
  for (const sp of lanciabili) {
    const M = d.incantesimi[sp]?.componenti.M;
    const daOggetto = MATERIALE_DA_OGGETTO[sp]?.oggetto;
    if (M?.costoMo && !inventario.includes(`materiale:${sp}`) && !(daOggetto && inventario.includes(daOggetto)))
      avvisa(`materiale:${sp}`, 'attenzione', `${materiale(`materiale:${sp}`, d)!.nome}. Il focus non sostituisce questa componente: comprala con le monete (passo Equipaggiamento)`, d.incantesimi[sp].srd);
  }

  // ───────── CA (p. 22, armature p. 92) ─────────
  const addestramento = new Set<string>([...classe.addestramentoArmature,
    ...effetti('competenza').filter((v) => v.effetto.categoria === 'armature').flatMap((v) => v.effetto.ids)]);
  // Scudo imbracciato (21/11): conta solo se è nello zaino, sei addestrato e non l'hai tolto
  // Armature e scudi magici (21/11): contano come l'armatura o lo scudo che sono, con il loro +N
  const armatureMagiche = effettoMagico('armatura').filter((x) => x.o.base && d.oggetti[x.o.base]?.armatura);
  const scudiMagici = effettoMagico('scudo');
  const armatureTutte = [...new Set([...inventario, ...armatureMagiche.map((x) => x.o.base!)])];
  const haScudoInv = inventario.includes('shield') || scudiMagici.length > 0;
  const haScudo = haScudoInv && addestramento.has('scudo') && pg.equip?.scudo !== false;
  if (haScudoInv && !addestramento.has('scudo'))
    avvisa('scudo-non-addestrato', 'attenzione', 'Senza addestramento con lo scudo non ottieni il suo bonus alla CA', { pagina: 92 });
  const scudo: Termine[] = haScudo ? [{ etichetta: 'Scudo', valore: 2 }, ...scudiMagici.map(({ o, e }) => ({ etichetta: o.nome, valore: e.bonus }))] : [];
  const conArmatura = effetti('bonusCA').map((v) => ({ etichetta: v.effetto.etichetta, valore: v.effetto.valore }));

  const formule: Scheda['ca']['formule'] = [{ id: 'senza-armatura', nome: 'Senza armatura', valore: numero([{ etichetta: 'Base', valore: 10 }, { etichetta: 'Destrezza', valore: mod.DES }, ...scudo]) }];
  for (const id of armatureTutte) {
    const o = d.oggetti[id];
    if (!o?.armatura || o.armatura.categoria === 'scudo') continue;
    const a = o.armatura;
    const des = a.maxDes === 0 ? [] : [{ etichetta: a.maxDes ? `Destrezza (max ${a.maxDes})` : 'Destrezza', valore: a.maxDes ? Math.min(mod.DES, a.maxDes) : mod.DES }];
    const magica = armatureMagiche.filter((x) => x.o.base === id).map(({ o: m, e }) => ({ etichetta: m.nome, valore: e.bonus }));
    formule.push({ id: `armatura:${id}`, nome: magica.length ? magica[0].etichetta : o.nome, valore: numero([{ etichetta: o.nome, valore: a.base }, ...magica, ...des, ...scudo, ...conArmatura]) });
    if (!addestramento.has(a.categoria))
      avvisa(`armatura-non-addestrato:${id}`, 'attenzione', `${o.nome}: senza addestramento hai svantaggio alle prove di FOR e DES e non puoi lanciare incantesimi`, { pagina: 92 });
  }
  const aggiungiFormula = (f: FormulaCA) => {
    if (formule.some((x) => x.id === f.id)) return;
    const s = f.richiede === 'nessunaArmatura' ? scudo : [];
    formule.push({ id: f.id, nome: f.nome, valore: numero([{ etichetta: 'Base', valore: f.base }, ...f.caratteristiche.map((c) => ({ etichetta: NOME_CAR[c], valore: mod[c] })), ...s]) });
  };
  for (const v of effetti('formulaCA')) aggiungiFormula(v.effetto.formula);
  if (lanciabili.has('mage-armor'))                     // Armatura magica: 13 + DES senza armatura (p. 145)
    aggiungiFormula({ id: 'armatura-magica', nome: 'Armatura magica', base: 13, caratteristiche: ['DES'], richiede: 'nessunaArmatura', srd: { pagina: 145 } });
  // Bonus generici alla CA (Anello e Mantello di protezione +1; Bracciali della difesa +2 senza armatura né scudo)
  for (const f of formule) for (const { o, e } of effettoMagico('ca')) {
    if (e.soloSenzaArmatura && (f.id.startsWith('armatura:') || haScudo)) continue;
    f.valore = numero([...f.valore.termini, { etichetta: o.nome, valore: e.bonus }]);
  }
  const migliore = formule.reduce((m, f) => (f.valore.totale > m.valore.totale ? f : m)).id;

  // CA attuale (21/11): l'armatura indossata, o la migliore senza armatura; gli incantesimi solo se attivi.
  // La Difesa senza armatura del monaco non vale con lo scudo (p. 50).
  const daIncantesimo = (id: Id) => id === 'armatura-magica';
  for (const f of formule) if (daIncantesimo(f.id)) (f as { incantesimo?: boolean }).incantesimo = true;
  const vietata = (id: Id) => id === 'difesa-senza-armatura-monaco' && haScudo;
  const sceltaArmatura = pg.equip?.armatura;
  const scelta = sceltaArmatura && sceltaArmatura !== 'nessuna' && armatureTutte.includes(sceltaArmatura) && d.oggetti[sceltaArmatura]?.armatura ? `armatura:${sceltaArmatura}` : null;
  const senzaArmaturaOk = formule.filter((f) => !f.id.startsWith('armatura:') && !vietata(f.id) && (!daIncantesimo(f.id) || pg.equip?.attivi?.includes(f.id)));
  const migliorTra = (l: typeof formule) => l.reduce((m, f) => (f.valore.totale > m.valore.totale ? f : m)).id;
  const attuale = scelta ?? (sceltaArmatura === 'nessuna' || pg.equip?.attivi?.some(daIncantesimo)
    ? migliorTra(senzaArmaturaOk)
    : migliorTra([...senzaArmaturaOk, ...formule.filter((f) => f.id.startsWith('armatura:'))]));
  const indossata = attuale.startsWith('armatura:') ? attuale.slice('armatura:'.length) : null;
  const armaturaIndossata = indossata ? d.oggetti[indossata].armatura! : null;

  // ───────── Attacchi con le armi (p. 22-23, 89-91) ─────────
  const addestramentoArmi = new Set<string>([...classe.addestramentoArmi,
    ...effetti('competenza').filter((v) => v.effetto.categoria === 'armi').flatMap((v) => v.effetto.ids)]);
  const competenteArma = (id: Id) => {
    const a = ARMI[id];
    if (a.categoria === 'semplice') return addestramentoArmi.has('semplici');
    return addestramentoArmi.has('marziali')
      || (addestramentoArmi.has('marzialiLeggere') && a.proprieta.includes('leggera'))
      || (addestramentoArmi.has('marzialiAccurateOLeggere') && (a.proprieta.includes('leggera') || a.proprieta.includes('accurata')));
  };
  const padronanze = new Set([...scelte.values()].filter((x) => x.tipo === 'maestriaArma').flatMap((x) => risposta(x.id)));
  // Arti marziali (p. 50): senza armatura né scudo, DES al posto di FOR e il dado (1d6) su colpo senz'armi e armi da monaco
  const dadoMarziale = effetti('valoreClasse').filter((v) => v.effetto.id === 'martial-arts-die').at(-1)?.effetto.valore;   // l'ultimo: 1d8 dal 5° livello
  const senzaArmatura = !indossata && !haScudo;   // Arti marziali: niente armatura indossata né scudo (21/11)
  const arti = dadoMarziale && senzaArmatura ? dadoMarziale : null;
  const daMonaco = (id: Id) => ARMI[id].tipo === 'mischia' && (ARMI[id].categoria === 'semplice' || ARMI[id].proprieta.includes('leggera'));
  const media = (dadi: string) => { const m = dadi.match(/^(\d+)d(\d+)$/); return m ? (+m[1] * (+m[2] + 1)) / 2 : +dadi; };
  const carMigliore = (): Car => (mod.DES > mod.FOR ? 'DES' : 'FOR');
  const testoDanni = (dadi: string, m: number, tipo: string) =>
    /^\d+$/.test(dadi) ? `${+dadi + m} ${tipo}` : `${dadi}${m > 0 ? ` + ${m}` : m < 0 ? ` − ${-m}` : ''} ${tipo}`;
  const attacco = (id: Id, nome: string, quantita: number, car: Car, competente: boolean, dadi: string, tipo: string, extra: Partial<Attacco> & { dueMani?: string; bonus?: Termine[]; bonusDanni?: number }): Attacco => ({
    id, nome, quantita, caratteristica: car, competente,
    colpire: numero([{ etichetta: NOME_CAR[car], valore: mod[car] }, ...(competente ? [{ etichetta: 'Competenza', valore: PB }] : []), ...(extra.bonus ?? [])]),
    danni: { dadi, mod: mod[car] + (extra.bonusDanni ?? 0), tipo, testo: testoDanni(dadi, mod[car] + (extra.bonusDanni ?? 0), tipo),
      ...(extra.dueMani ? { dadiDueMani: extra.dueMani, testoDueMani: testoDanni(extra.dueMani, mod[car] + (extra.bonusDanni ?? 0), tipo) } : {}) },
    padronanza: extra.padronanza ?? null, ...(extra.gittata ? { gittata: extra.gittata } : {}), proprieta: extra.proprieta ?? [], note: extra.note ?? [],
  });
  const perArma = new Map<Id, number>();
  for (const v of inventarioVoci) { const arma = d.oggetti[v.oggetto]?.arma; if (arma && ARMI[arma]) perArma.set(arma, (perArma.get(arma) ?? 0) + v.quantita); }
  const attacchi: Attacco[] = [];
  // Le armi magiche (21/11) sono un attacco a parte, con il loro nome; il +N vale solo se l'oggetto è attivo
  const armiMagiche = (pg.oggettiMagici ?? []).filter((x) => x.base && ARMI[x.base] && (x.personalizzato ? false : OGGETTI_MAGICI[x.id]?.base === 'arma'));
  const voceArmi: { id: Id; quantita: number; nome?: string; magico?: number; uid?: string }[] = [
    ...[...perArma].map(([id, quantita]) => ({ id, quantita })),
    ...armiMagiche.map((x) => {
      const att = magici.find((m) => m.uid === x.uid);
      const b = att?.effetti.find((e): e is Extract<EffettoMagico, { tipo: 'arma' }> => e.tipo === 'arma')?.bonus ?? 0;
      return { id: x.base!, quantita: 1, nome: nomeOggetto(x, d), magico: b, uid: x.uid };
    }),
  ];
  for (const { id, quantita, nome: nomeMagico, magico, uid } of voceArmi) {
    const a = ARMI[id];
    const [dadiBase, tipo] = [a.danni.split(' ')[0], a.danni.split(' ').slice(1).join(' ')];
    const monaco = arti && daMonaco(id);
    const car: Car = a.proprieta.includes('accurata') || monaco ? carMigliore() : a.tipo === 'distanza' ? 'DES' : 'FOR';
    const dadi = monaco && media(arti) > media(dadiBase) ? arti : dadiBase;
    const comp = competenteArma(id);
    const note: string[] = [];
    if (!comp) {
      note.push('Senza competenza: niente bonus di competenza al tiro per colpire');
      avvisa(`arma-non-competente:${id}`, 'attenzione', `${a.nome}: non hai l'addestramento con quest'arma, al tiro per colpire non aggiungi la competenza`, { pagina: 89 });
    }
    if (a.proprieta.includes('pesante') && (a.tipo === 'mischia' ? punteggi.FOR.totale : punteggi.DES.totale) < 13)
      note.push(`Svantaggio ai tiri per colpire: ${a.tipo === 'mischia' ? 'Forza' : 'Destrezza'} sotto 13 (Pesante)`);
    if (monaco) note.push('Con Arti marziali (finché sei senza armatura né scudo)');
    attacchi.push(attacco(uid ? `magico:${uid}` : id, nomeMagico ?? a.nome, quantita, car, comp, dadi, tipo, {
      bonus: [...(a.tipo === 'distanza' && talenti.includes('archery') ? [{ etichetta: 'Tiro', valore: 2 }] : []), ...(magico ? [{ etichetta: nomeMagico!, valore: magico }] : [])],
      bonusDanni: magico ?? 0,
      dueMani: DUE_MANI_ARMI[id], gittata: GITTATA_ARMI[id], proprieta: a.proprieta,
      padronanza: padronanze.has(id) ? a.padronanza : null, note,
    }));
  }
  // Colpo senz'armi (p. 190): FOR + competenza, 1 + FOR contundenti
  attacchi.push(attacco('unarmed-strike', 'Colpo senz\'armi', 1, arti ? carMigliore() : 'FOR', true, arti ?? '1', 'contundenti',
    { note: arti ? ['Con Arti marziali (finché sei senza armatura né scudo)'] : [] }));

  // ───────── Strumenti (p. 94-95): background, classe, scelte ─────────
  const strumenti = [...new Set([
    ...(typeof bg.strumento === 'string' ? [bg.strumento] : risposta(bg.strumento.id)),
    ...effetti('competenza').filter((v) => v.effetto.categoria === 'strumento').flatMap((v) => v.effetto.ids),
    ...effetti('scelta').filter((v) => v.effetto.scelta.tipo === 'strumento').flatMap((v) => risposta(v.effetto.scelta.id)),
  ])];

  // ───────── Lingue (p. 20-21) ─────────
  const tutteLeLingue: Id[] = ['common', ...risposta('origine.lingue')];
  for (const v of voci) {
    if (v.effetto.tipo === 'lingua') tutteLeLingue.push(...v.effetto.ids);
    if (v.effetto.tipo === 'scelta' && v.effetto.scelta.tipo === 'lingua') tutteLeLingue.push(...risposta(v.effetto.scelta.id));
  }
  for (const l of new Set(tutteLeLingue)) if (tutteLeLingue.filter((x) => x === l).length > 1)
    avvisa(`doppione-lingua:${l}`, 'attenzione', `Conosci già questa lingua da un'altra fonte: puoi sceglierne un'altra`, { pagina: 20 });
  const lingue = [...new Set(tutteLeLingue)];

  // ───────── Allineamento (p. 21) ─────────
  if (!pg.allineamento) avvisa('scelta-mancante:allineamento', 'info', 'Manca l\'allineamento', { pagina: 21 });
  else if (!ALLINEAMENTI[pg.allineamento]) avvisa(`scelta-non-valida:allineamento:${pg.allineamento}`, 'errore', `${pg.allineamento} non è un allineamento`, { pagina: 21 });
  else if (ALLINEAMENTI[pg.allineamento].malvagio)
    avvisa('allineamento-malvagio', 'attenzione', 'Il gioco presume personaggi non malvagi: chiedi al master prima di crearne uno', { pagina: 21 });

  // ───────── Il resto ─────────
  const risorse = effetti('risorsa').map(({ effetto: { risorsa: r } }: { effetto: { risorsa: Risorsa } }) => ({
    id: r.id, nome: r.nome, usi: valore(r.usi), ...Object.entries(r.dal ?? {}).filter(([l]) => livello >= Number(l))
      .reduce((x, [, v]) => ({ ...x, ...v }), { recupero: r.recupero, ...(r.dettaglio ? { dettaglio: r.dettaglio } : {}) } as Pick<Risorsa, 'recupero' | 'dettaglio'>),
  }));
  const cdSpeciali = effetti('cdSpeciale').map((v) => ({ id: v.effetto.id, nome: v.effetto.nome,
    cd: numero([{ etichetta: 'Base', valore: 8 }, { etichetta: NOME_CAR[v.effetto.caratteristica], valore: mod[v.effetto.caratteristica] }, { etichetta: 'Competenza', valore: PB }]) }));
  const vel = effetti('velocita');
  // Armatura pesante con Forza sotto il requisito: -10 piedi (p. 92), solo se la indossi (21/11)
  const forzaBassa = !!armaturaIndossata?.forza && punteggi.FOR.totale < armaturaIndossata.forza;
  if (forzaBassa) avvisa(`armatura-forza:${indossata}`, 'attenzione', `${d.oggetti[indossata!].nome} richiede Forza ${armaturaIndossata!.forza}: con meno la tua velocità cala di ${metri(10)}`, { pagina: 92 });
  const libero = !indossata && !haScudo;
  const velocita = (vel.length ? Math.max(...vel.map((v) => v.effetto.valore)) : specie.velocita) - (forzaBassa ? 10 : 0)
    + (libero ? effetti('velocitaSenzaArmatura').reduce((s, v) => s + v.effetto.valore, 0) : 0)   // Movimento senza armatura (p. 51)
    + (armaturaIndossata?.categoria !== 'pesante' ? effetti('velocitaSenzaPesante').reduce((s, v) => s + v.effetto.valore, 0) : 0);   // Movimento veloce (p. 29)
  // Svantaggio alla Furtività con le armature che lo hanno (p. 92), solo se indossate
  if (armaturaIndossata?.svantaggioFurtivita) abilita.stealth.svantaggio = `Svantaggio: ${d.oggetti[indossata!].nome}`;

  // Oggetti magici sugli incantesimi (21/11): la bacchetta del mago da guerra al tiro per colpire, e i bonus scritti a mano
  const conTermini = (n: Numero | null, extra: Termine[]) => (n && extra.length ? numero([...n.termini, ...extra]) : n);
  const bonusAtt = effettoMagico('attaccoIncantesimi').map(({ o, e }) => ({ etichetta: o.nome, valore: e.bonus }));
  const bonusCd = effettoMagico('cdIncantesimi').map(({ o, e }) => ({ etichetta: o.nome, valore: e.bonus }));
  for (const m of magia) { m.attacco = conTermini(m.attacco, bonusAtt); m.cd = conTermini(m.cd, bonusCd); }

  // Incantesimi sempre preparati che erano già tra i preparati, o dati da due fonti (3° livello, sottoclassi): avviso (p. 104)
  const fontiSempre = new Map<Id, string[]>();
  for (const m of magia) for (const sp of m.semprePreparati) fontiSempre.set(sp, [...(fontiSempre.get(sp) ?? []), m.nome]);
  for (const m of magia) for (const sp of m.preparati?.scelti ?? []) if (fontiSempre.has(sp))
    avvisa(`gia-sempre-preparato:${sp}:${m.id}`, 'attenzione', `${d.incantesimi[sp]?.nome ?? sp} è già sempre preparato (${fontiSempre.get(sp)![0].replace(/^Classe: /, '')}): puoi preparare un altro incantesimo al suo posto`, { pagina: 104 });
  for (const [sp, f] of fontiSempre) if (f.length > 1)
    avvisa(`gia-sempre-preparato:${sp}`, 'attenzione', `${d.incantesimi[sp]?.nome ?? sp} è sempre preparato da due fonti (${f.map((x) => x.replace(/^\w+: /, '')).join(' e ')}): dove lo hai scelto tu, puoi sceglierne un altro`, { pagina: 104 });

  // Regole del tavolo (sezione 5.1): i suoi avvisi, e le eccezioni concesse in anticipo dal master
  if (pg.tavolo) avvisi.push(...avvisiTavolo(pg, pg.tavolo, d));
  for (const a of avvisi) if (pg.avvisiAccettati.includes(a.id) || (pg.tavolo && coperto(pg.tavolo, a, d))) a.accettato = true;

  return {
    punteggi, modificatori: mod, competenza: PB, pf, iniziativa,
    ca: { formule, migliore, attuale, indossata, scudo: haScudo },
    tiriSalvezza, abilita,
    percezionePassiva: 10 + abilita.perception.totale,   // p. 22
    velocita,
    resistenze: effetti('resistenza').map((v) => v.effetto.danno),
    talenti, magia, cdSpeciali,
    slot: { normali: classe.slot?.[livello] ?? [], patto: classe.patto?.[livello] ?? null },
    risorse,
    valoriClasse: Object.fromEntries(effetti('valoreClasse').map((v) => [v.effetto.id, v.effetto.valore])),
    livello,
    bonusDanniTrucchetti: effetti('bonusDanniTrucchetto').reduce<Record<Id, Termine[]>>((acc, v) => {
      acc[v.effetto.incantesimo] = [...(acc[v.effetto.incantesimo] ?? []), { etichetta: v.effetto.etichetta, valore: mod[v.effetto.car] }];
      return acc;
    }, {}),
    lingue,
    attacchi, addestramentoArmi: [...addestramentoArmi], addestramentoArmature: [...addestramento], strumenti, inventario: inventarioVoci, monete,
    avvisi,
  };
}
