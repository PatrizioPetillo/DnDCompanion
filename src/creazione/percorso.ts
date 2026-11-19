// Percorso di creazione (sezione 5.2 del contesto): stato degli 8 passi, passo successivo, cambio di classe.
// TypeScript puro: l'interfaccia lo usa, ma qui non c'è niente di React.
import { tuttiAssegnati } from './caratteristiche';
import { scelteDiClasse } from './classe';
import { calcolaScheda } from '../regole';
import { DATI, type Dati } from '../regole/dati';
import { ammesso } from '../regole/tavolo';
import type { Avviso, Car, Id, Personaggio } from '../regole/tipi';

export type IdPasso =
  | 'classe' | 'background' | 'specie' | 'caratteristiche'
  | 'magia' | 'equipaggiamento' | 'personaggio' | 'riepilogo';

export const PASSI: { id: IdPasso; titolo: string }[] = [
  { id: 'classe', titolo: 'Classe' },
  { id: 'background', titolo: 'Background' },
  { id: 'specie', titolo: 'Specie' },
  { id: 'caratteristiche', titolo: 'Caratteristiche' },
  { id: 'magia', titolo: 'Magia' },
  { id: 'equipaggiamento', titolo: 'Equipaggiamento' },
  { id: 'personaggio', titolo: 'Personaggio' },
  { id: 'riepilogo', titolo: 'Riepilogo' },
];

export type StatoPasso = 'fatto' | 'da-fare' | 'avviso' | 'non-serve';

// Una bozza è un personaggio in costruzione: le scelte principali possono mancare.
export type Bozza = Omit<Personaggio, 'classe' | 'specie' | 'background' | 'punteggi' | 'equipaggiamento'> & {
  classe?: Id;
  specie?: Id;
  background?: Id;
  punteggi?: Personaggio['punteggi'];
  equipaggiamento?: Personaggio['equipaggiamento'];
  ideaSaltata?: boolean;   // non più usato: l'idea ora sta nel passo Personaggio (resta per le bozze salvate)
};

export const bozzaVuota = (): Bozza => ({
  schema: 1, nome: '', livello: 1, bonusBackground: {}, scelte: {}, incantesimi: { preparati: {} }, avvisiAccettati: [],
});

// Avvisi che significano «manca ancora qualcosa» (il passo resta da fare), non «c'è un problema».
const INCOMPLETO = /^(scelta-mancante|preparati-mancanti|libro-incompleto|point-buy-avanzati)/;

// A quale passo appartiene un avviso del motore delle regole.
function passoDiAvviso(a: Avviso, b: Bozza, d: Dati): IdPasso {
  const id = a.id;
  if (id.startsWith('tavolo-escluso:')) return ({ classi: 'classe', specie: 'specie', background: 'background' } as const)[id.split(':')[1] as 'classi'] ?? 'riepilogo';
  if (id === 'tavolo-metodo') return 'caratteristiche';
  if (/^(bonus-background|talento-personalizzato)/.test(id)) return 'background';                      // i bonus si scelgono nel background (come Character Keep)
  if (/^(point-buy|serie-standard|massimo-20)/.test(id)) return 'caratteristiche';
  if (/^(armatura-|scudo-|equipaggiamento-|monete-|focus-|arma-|materiale)/.test(id)) return 'equipaggiamento';   // i materiali si comprano lì
  if (/^(preparati-|libro-|fuori-lista|livello-incantesimo|non-nel-libro|doppione-trucchetto|incantesimo-sconosciuto)/.test(id)) return 'magia';
  if (/^(doppione-abilita|maestria-senza-competenza)/.test(id)) return 'caratteristiche';
  if (/^(talento-ripetuto|prerequisito|talento-sconosciuto)/.test(id)) return 'specie';
  if (/allineamento/.test(id)) return 'personaggio';
  const scelta = id.replace(/^(scelta-mancante|scelta-troppe|scelta-non-valida):/, '').split(':')[0];
  const [prefisso, parte] = scelta.split('.');
  if (prefisso === 'origine' || id.startsWith('doppione-lingua')) return 'background';   // lingue: origine (p. 20), scelte nel background
  if (prefisso.split('@')[0] === 'magic-initiate' || parte === 'trucchetti' || /\.(trucchetti|rituali)$/.test(scelta)) return 'magia';   // anche la seconda istanza (magic-initiate@…)
  if (b.specie && prefisso === b.specie) return 'specie';
  if (b.background && prefisso === b.background) return 'background';
  if (b.classe && prefisso === b.classe) {
    if (parte === 'abilita' || parte === 'maestria') return 'caratteristiche';   // abilità della classe e Maestria: nella griglia
    if (parte === 'equip') return 'equipaggiamento';                            // lo strumento a scelta del bardo
    return 'classe';                                                           // Padronanza d'armi, strumenti, ordini, stile, suppliche, lingua
  }
  if (prefisso === 'skilled') return 'background';                          // Abile dato da un background personalizzato
  if (prefisso.split('@')[0] === 'skilled') return 'specie';                 // Abile preso con Versatile
  void d;
  return 'riepilogo';
}

const PUNTEGGI_SEGNAPOSTO = { metodo: 'tiri' as const, base: { FOR: 10, DES: 10, COS: 10, INT: 10, SAG: 10, CAR: 10 } as Record<Car, number> };

export function comePersonaggio(b: Bozza): Personaggio | null {
  if (!b.classe || !b.specie || !b.background) return null;
  return {
    ...b,
    classe: b.classe, specie: b.specie, background: b.background,
    punteggi: b.punteggi ?? PUNTEGGI_SEGNAPOSTO,
    equipaggiamento: b.equipaggiamento ?? { classe: 'A', background: 'A' },
  };
}

// mancanti: per «Avanti (3 da fare)»; cosaManca: le stesse cose in parole, per il foglio che si apre toccando Avanti
export interface VocePasso { stato: StatoPasso; avvisi: Avviso[]; mancanti: number; cosaManca: string[] }

export function statoPassi(b: Bozza, d: Dati = DATI): Record<IdPasso, VocePasso> {
  const r = Object.fromEntries(PASSI.map((p) => [p.id, { stato: 'da-fare' as StatoPasso, avvisi: [] as Avviso[], mancanti: 0, cosaManca: [] as string[] }])) as
    Record<IdPasso, VocePasso>;

  if (b.nome.trim() && b.allineamento) r.personaggio.stato = 'fatto';

  const pg = comePersonaggio(b);
  // Quello che manca prima che esista un personaggio (classe, background e specie): il motore non lo vede ancora
  const classeMancanti = (b.classe ? 0 : 1) + scelteDiClasse(b, d).reduce((n, s) => n + Math.max(0, s.quantita - (b.scelte[s.id]?.length ?? 0)), 0);   // una per tendina
  const bgMancanti = (b.background ? 0 : 1) + (Object.keys(b.bonusBackground).length ? 0 : 1) + ((b.scelte['origine.lingue'] ?? []).length >= 2 ? 0 : 1);
  const basi: Partial<Record<IdPasso, boolean>> = {
    classe: classeMancanti === 0, specie: !!b.specie,
    background: bgMancanti === 0,
    caratteristiche: !!b.punteggi && tuttiAssegnati(b.punteggi),
    magia: !!pg, equipaggiamento: !!pg && !!b.equipaggiamento,
  };
  if (!pg) {
    for (const p of ['classe', 'background', 'specie'] as IdPasso[]) if (basi[p]) r[p].stato = 'fatto';
    return conMancanti(conRiepilogo(r), b, classeMancanti, bgMancanti);
  }

  const scheda = calcolaScheda(pg, d);
  for (const a of scheda.avvisi) {
    if (!b.punteggi && passoDiAvviso(a, b, d) === 'caratteristiche') continue;   // punteggi non ancora scelti
    r[passoDiAvviso(a, b, d)].avvisi.push(a);
  }
  for (const p of Object.keys(basi) as IdPasso[]) {
    const voce = r[p];
    if (!basi[p] || voce.avvisi.some((a) => INCOMPLETO.test(a.id))) voce.stato = 'da-fare';
    else if (voce.avvisi.some((a) => !a.accettato && a.livello !== 'info')) voce.stato = 'avviso';
    else voce.stato = 'fatto';
  }
  if (scheda.magia.length === 0 && r.magia.avvisi.length === 0) r.magia.stato = 'non-serve';
  if (r.personaggio.stato === 'fatto' && r.personaggio.avvisi.some((a) => !a.accettato && a.livello !== 'info')) r.personaggio.stato = 'avviso';
  return conMancanti(conRiepilogo(r), b, classeMancanti, bgMancanti);
}

// Quante cose mancano in ogni passo «da fare» (almeno 1). Il Riepilogo non conta: lì non c'è niente da scegliere.
function conMancanti(r: Record<IdPasso, VocePasso>, b: Bozza, classe: number, background: number) {
  for (const p of PASSI) {
    const v = r[p.id];
    if (v.stato !== 'da-fare' || p.id === 'riepilogo') continue;
    const incompleti = p.id === 'personaggio' ? 0 : v.avvisi.filter((a) => INCOMPLETO.test(a.id) && !a.id.startsWith('scelta-mancante:origine.lingue')).length;
    const base = p.id === 'classe' ? classe : p.id === 'background' ? background
      : p.id === 'personaggio' ? Number(!b.nome.trim()) + Number(!b.allineamento)
      : p.id === 'caratteristiche' && b.punteggi ? Object.values(b.punteggi.base).filter((v) => v === 0).length : 0;   // punteggi ancora vuoti
    v.mancanti = Math.max(1, base + incompleti);
    v.cosaManca = cosaManca(p.id, b, v);
  }
  return r;
}

// Le cose ancora da fare in un passo, in parole del giocatore
function cosaManca(passo: IdPasso, b: Bozza, v: VocePasso, d: Dati = DATI): string[] {
  const out: string[] = [];
  const pg = comePersonaggio(b);
  if (passo === 'classe') {
    if (!b.classe) out.push('Scegli la classe');
    for (const s of scelteDiClasse(b, d)) {
      const n = s.quantita - (b.scelte[s.id]?.length ?? 0);
      if (n > 0) out.push(`${s.titolo}: ${n === 1 ? 'manca 1 scelta' : `mancano ${n} scelte`}`);
    }
  }
  if (passo === 'background') {
    if (!b.background) out.push('Scegli il background');
    else {
      if (!Object.keys(b.bonusBackground).length) out.push('Scegli i bonus alle caratteristiche (+2 e +1, oppure +1 a tutte e tre)');
      const l = (b.scelte['origine.lingue'] ?? []).length;
      if (l < 2) out.push(`Scegli le lingue: ${l} su 2`);
    }
  }
  if (passo === 'specie' && !b.specie) out.push('Scegli la specie');
  if (passo === 'caratteristiche') {
    if (!b.punteggi) out.push('Scegli come generare i punteggi');
    else {
      const vuoti = Object.values(b.punteggi.base).filter((x) => x === 0).length;
      if (vuoti) out.push(`${vuoti === 1 ? 'Manca 1 punteggio' : `Mancano ${vuoti} punteggi`} da assegnare`);
    }
  }
  if (passo === 'personaggio') {
    if (!b.nome.trim()) out.push('Scrivi il nome');
    if (!b.allineamento) out.push('Scegli l\'allineamento');
  }
  if (passo !== 'personaggio')
    for (const a of v.avvisi) if (INCOMPLETO.test(a.id) && !a.id.startsWith('scelta-mancante:origine.lingue')) out.push(a.messaggio);
  if (!out.length && !pg && ['magia', 'equipaggiamento', 'specie', 'caratteristiche'].includes(passo))
    out.push('Prima scegli classe, background e specie');
  if (passo === 'equipaggiamento' && pg && !b.equipaggiamento) out.push('Scegli il pacchetto della classe e del background');
  return out.length ? out : ['Completa le scelte evidenziate in questo passo'];
}

function conRiepilogo(r: Record<IdPasso, VocePasso>) {
  const altri = PASSI.filter((p) => p.id !== 'riepilogo').map((p) => r[p.id]);
  r.riepilogo.avvisi = r.riepilogo.avvisi.concat();
  if (altri.some((v) => v.stato === 'da-fare')) r.riepilogo.stato = 'da-fare';
  else if (altri.some((v) => v.stato === 'avviso') || r.riepilogo.avvisi.some((a) => !a.accettato && a.livello !== 'info')) r.riepilogo.stato = 'avviso';
  else r.riepilogo.stato = 'fatto';
  return r;
}

export function prossimoPasso(b: Bozza, d: Dati = DATI): IdPasso {
  const s = statoPassi(b, d);
  return PASSI.find((p) => p.id !== 'riepilogo' && s[p.id].stato === 'da-fare')?.id ?? 'riepilogo';
}

// Cambiare classe: le scelte della vecchia classe non valgono più. Le togliamo e diciamo quali (sezione 5.2).
export function cambiaClasse(b: Bozza, nuova: Id): { bozza: Bozza; tolte: string[] } {
  const vecchia = b.classe;
  if (!vecchia || vecchia === nuova) return { bozza: { ...b, classe: nuova }, tolte: [] };
  const tolte: string[] = [];
  const scelte: Bozza['scelte'] = {};
  for (const [k, v] of Object.entries(b.scelte)) {
    if (k.startsWith(`${vecchia}.`)) tolte.push(k);
    else scelte[k] = v;
  }
  const preparati = { ...b.incantesimi.preparati };
  if (preparati[vecchia]) { delete preparati[vecchia]; tolte.push(`incantesimi preparati (${vecchia})`); }
  const incantesimi: Bozza['incantesimi'] = { preparati };
  if (b.incantesimi.libro && nuova !== 'wizard') tolte.push('libro degli incantesimi');
  else if (b.incantesimi.libro) incantesimi.libro = b.incantesimi.libro;
  const { equipaggiamento: _e, ...resto } = b;
  if (_e) tolte.push('equipaggiamento');
  return { bozza: { ...resto, classe: nuova, scelte, incantesimi, avvisiAccettati: [] }, tolte };
}

// Cambiare background (p. 83): cambiano talento, abilità, strumento e le tre caratteristiche dei bonus.
export function cambiaBackground(b: Bozza, nuovo: Id, d: Dati = DATI): { bozza: Bozza; tolte: string[] } {
  const vecchio = b.background ? d.background[b.background] : undefined;
  const bg = d.background[nuovo];
  if (!vecchio || vecchio.id === nuovo) return { bozza: { ...b, background: nuovo }, tolte: [] };
  const tolte: string[] = [];
  const daTogliere = (k: string): boolean => {
    if (k.startsWith(`${vecchio.id}.`)) return true;                       // es. soldier.gioco
    const t = vecchio.talento.talento;
    if (!k.startsWith(`${t}.`)) return false;
    if (bg.talento.talento !== t) return true;                              // talento diverso: via tutte le sue scelte
    // Stesso talento con parametri diversi (Iniziato: lista del chierico → del mago):
    // via le scelte che dipendono dal parametro cambiato.
    const cambiati = Object.keys({ ...vecchio.talento.parametri, ...bg.talento.parametri })
      .filter((p) => vecchio.talento.parametri?.[p] !== bg.talento.parametri?.[p]);
    return (d.talenti[t]?.effetti ?? []).some((e) => e.tipo === 'scelta' && e.scelta.id === k && e.scelta.filtro
      && 'lista' in e.scelta.filtro && typeof e.scelta.filtro.lista !== 'string' && cambiati.includes(e.scelta.filtro.lista.daScelta));
  };
  const scelte: Bozza['scelte'] = {};
  for (const [k, v] of Object.entries(b.scelte)) {
    if (daTogliere(k)) tolte.push(k);
    else scelte[k] = v;
  }
  let bonusBackground = b.bonusBackground;
  if ((Object.keys(bonusBackground) as Car[]).some((c) => !bg.caratteristiche.includes(c))) {
    bonusBackground = {};
    tolte.push('bonus del background');
  }
  return { bozza: { ...b, background: nuovo, scelte, bonusBackground, avvisiAccettati: [] }, tolte };
}

// Cambiare specie: via le scelte della vecchia specie e quelle del talento preso con Versatile (se non viene dal background).
export function cambiaSpecie(b: Bozza, nuova: Id, d: Dati = DATI): { bozza: Bozza; tolte: string[] } {
  const vecchia = b.specie ? d.specie[b.specie] : undefined;
  if (!vecchia || vecchia.id === nuova) return { bozza: { ...b, specie: nuova }, tolte: [] };
  const talentoBg = b.background ? d.background[b.background]?.talento.talento : undefined;
  const talentiSpecie = vecchia.tratti.flatMap((t) => t.effetti)
    .flatMap((e) => (e.tipo === 'scelta' && e.scelta.tipo === 'talento' ? b.scelte[e.scelta.id] ?? [] : []))
    .filter((t) => t !== talentoBg);
  const tolte: string[] = [];
  const scelte: Bozza['scelte'] = {};
  for (const [k, v] of Object.entries(b.scelte)) {
    const istanzaDiSpecie = k.includes(`@${vecchia.id}-`);                  // es. magic-initiate@human-versatile.lista
    if (k.startsWith(`${vecchia.id}.`) || istanzaDiSpecie || talentiSpecie.some((t) => k.startsWith(`${t}.`))) tolte.push(k);
    else scelte[k] = v;
  }
  return { bozza: { ...b, specie: nuova, scelte, avvisiAccettati: [] }, tolte };
}

// Con il link del tavolo si vedono solo gli elementi ammessi dal master; quello già scelto resta visibile
// (un personaggio portato al tavolo: lì compare l'avviso, non sparisce la scelta). Senza tavolo, tutto.
export const visibile = (b: Bozza, id: Id, scelto?: Id): boolean => !b.tavolo || id === scelto || ammesso(b.tavolo, id);
