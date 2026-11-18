// Percorso di creazione (sezione 5.2 del contesto): stato degli 8 passi, passo successivo, cambio di classe.
// TypeScript puro: l'interfaccia lo usa, ma qui non c'è niente di React.
import { tuttiAssegnati } from './caratteristiche';
import { calcolaScheda } from '../regole';
import { DATI, type Dati } from '../regole/dati';
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
  if (/^(bonus-background|talento-personalizzato)/.test(id)) return 'background';
  if (/^(point-buy|serie-standard|massimo-20)/.test(id)) return 'caratteristiche';
  if (/^(armatura-|scudo-|equipaggiamento-|monete-|focus-|arma-|materiale)/.test(id)) return 'equipaggiamento';   // i materiali si comprano lì
  if (/^(preparati-|libro-|fuori-lista|livello-incantesimo|non-nel-libro|doppione-trucchetto|incantesimo-sconosciuto)/.test(id)) return 'magia';
  if (/^(doppione-abilita)/.test(id)) return 'caratteristiche';
  if (/^(talento-ripetuto|prerequisito|talento-sconosciuto)/.test(id)) return 'specie';
  if (/allineamento/.test(id)) return 'personaggio';
  const scelta = id.replace(/^(scelta-mancante|scelta-troppe|scelta-non-valida):/, '').split(':')[0];
  const [prefisso, parte] = scelta.split('.');
  if (prefisso === 'origine' || id.startsWith('doppione-lingua')) return 'background';   // lingue: fanno parte dell'origine (p. 20)
  if (prefisso.split('@')[0] === 'magic-initiate' || parte === 'trucchetti' || /\.(trucchetti|rituali)$/.test(scelta)) return 'magia';
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

export function statoPassi(b: Bozza, d: Dati = DATI): Record<IdPasso, { stato: StatoPasso; avvisi: Avviso[] }> {
  const r = Object.fromEntries(PASSI.map((p) => [p.id, { stato: 'da-fare' as StatoPasso, avvisi: [] as Avviso[] }])) as
    Record<IdPasso, { stato: StatoPasso; avvisi: Avviso[] }>;

  if (b.nome.trim() && b.allineamento) r.personaggio.stato = 'fatto';

  const pg = comePersonaggio(b);
  const basi: Partial<Record<IdPasso, boolean>> = {
    classe: !!b.classe, specie: !!b.specie,
    background: !!b.background && Object.keys(b.bonusBackground).length > 0 && (b.scelte['origine.lingue'] ?? []).length > 0,
    caratteristiche: !!b.punteggi && tuttiAssegnati(b.punteggi),
    magia: !!pg, equipaggiamento: !!pg && !!b.equipaggiamento,
  };
  if (!pg) {
    for (const p of ['classe', 'background', 'specie'] as IdPasso[]) if (basi[p]) r[p].stato = 'fatto';
    return conRiepilogo(r);
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
  return conRiepilogo(r);
}

function conRiepilogo(r: Record<IdPasso, { stato: StatoPasso; avvisi: Avviso[] }>) {
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
    if (k.startsWith(`${vecchio.id}.`)) return true;
    const t = vecchio.talento.talento;
    if (!k.startsWith(`${t}.`)) return false;
    if (bg.talento.talento !== t) return true;
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