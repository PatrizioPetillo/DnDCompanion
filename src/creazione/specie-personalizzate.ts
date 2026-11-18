// Specie personalizzate (sezione 4): Eberron, Ravenloft, altri manuali o inventate. L'app non contiene i dati:
// li scrive chi ha il libro, con un modulo guidato, e diventano una Specie che il motore calcola come quelle dell'SRD.
// Versione completa (scelta di Patrizio, 18/11): taglia, velocità, scurovisione, resistenze, abilità (fisse o a scelta),
// talento d'origine (fisso o a scelta), PF in più, magia (trucchetti fissi o a scelta, un incantesimo di 1°), tratti con usi.
// Una specie con più varianti (stirpi, eredità) si inserisce una volta per variante.
import { DATI, type Dati } from '../regole/dati';
import { TUTTE_LE_ABILITA } from '../regole/dati/base';
import type { Car, ConcessioneMagia, Effetto, Feature, Id, Specie } from '../regole/tipi';

export const TIPI_DANNO = ['acido', 'contundente', 'forza', 'freddo', 'fulmine', 'fuoco', 'necrotico', 'perforante', 'psichico', 'radioso', 'tagliente', 'tuono', 'veleno'];
export type ListaSpecie = 'cleric' | 'druid' | 'wizard';
export type UsiTratto = 'sempre' | 'competenza' | 'uno';

export interface TrattoModulo { nome: string; testo: string; usi: UsiTratto; riposo: 'lungo' | 'breve' }
export interface MagiaModulo {
  caratteristica: Car | 'scelta';                      // 'scelta' = INT, SAG o CAR a scelta del giocatore (come le specie dell'SRD)
  trucchettiFissi: Id[];
  trucchettiScelti: { quantita: number; lista: ListaSpecie } | null;
  incantesimo1: Id;                                    // '' = nessuno; sempre preparato, 1 volta gratis per riposo lungo
}
export interface ModuloSpecie {
  id?: Id;
  nome: string;
  fonte: string;
  pagina: string;
  descrizione: string;
  taglie: ('media' | 'piccola')[];
  velocitaMetri: string;                               // come sul manuale italiano: «9», «10,5»
  scurovisione: 0 | 18 | 36;                           // metri (60 e 120 piedi)
  resistenze: string[];
  abilitaFisse: Id[];
  sceltaAbilita: { quantita: number; opzioni: Id[] } | null;   // opzioni vuote = tutte le abilità
  talento: { tipo: 'nessuno' } | { tipo: 'fisso'; id: Id; lista?: ListaSpecie } | { tipo: 'scelta' };
  pfExtra: boolean;                                    // +1 PF per livello (come la Robustezza nanica)
  magia: MagiaModulo | null;
  tratti: TrattoModulo[];
}

export const moduloSpecieVuoto = (): ModuloSpecie => ({
  nome: '', fonte: '', pagina: '', descrizione: '', taglie: ['media'], velocitaMetri: '9', scurovisione: 0, resistenze: [],
  abilitaFisse: [], sceltaAbilita: null, talento: { tipo: 'nessuno' }, pfExtra: false, magia: null, tratti: [],
});

// «9» o «10,5» metri → piedi del motore (1,5 m ogni 5 piedi, come l'SRD italiano)
export const piediDaMetri = (m: string): number => Math.round(Number(m.replace(',', '.')) / 1.5) * 5;
const metriDaPiedi = (p: number): string => String((p / 5) * 1.5).replace('.', ',');

export function controllaSpecie(m: ModuloSpecie, d: Dati = DATI): { campo: string; messaggio: string }[] {
  const e: { campo: string; messaggio: string }[] = [];
  if (!m.nome.trim()) e.push({ campo: 'nome', messaggio: 'Scrivi il nome della specie' });
  if (!m.taglie.length) e.push({ campo: 'taglia', messaggio: 'Scegli almeno una taglia' });
  const v = Number(m.velocitaMetri.replace(',', '.'));
  if (!Number.isFinite(v) || v < 1.5 || v > 30) e.push({ campo: 'velocita', messaggio: 'Velocità in metri, per esempio 9' });
  else if (Math.abs(v / 1.5 - Math.round(v / 1.5)) > 0.01) e.push({ campo: 'velocita', messaggio: 'La velocità va a passi di 1,5 metri (9; 10,5; 12)' });
  if (m.abilitaFisse.some((a) => !TUTTE_LE_ABILITA.includes(a))) e.push({ campo: 'abilita', messaggio: 'Abilità sconosciuta' });
  if (m.sceltaAbilita && (m.sceltaAbilita.quantita < 1 || (m.sceltaAbilita.opzioni.length > 0 && m.sceltaAbilita.opzioni.length < m.sceltaAbilita.quantita)))
    e.push({ campo: 'abilita', messaggio: 'Le abilità tra cui scegliere devono essere almeno quante se ne scelgono' });
  if (m.talento.tipo === 'fisso') {
    const t = d.talenti[m.talento.id];
    if (!t || t.categoria !== 'origine') e.push({ campo: 'talento', messaggio: 'Scegli un talento d\'origine dell\'SRD' });
    else if (m.talento.id === 'magic-initiate' && !m.talento.lista) e.push({ campo: 'talento', messaggio: 'Iniziato alla magia: scegli la lista' });
  }
  if (m.magia) {
    const g = m.magia;
    if (!g.trucchettiFissi.length && !g.trucchettiScelti && !g.incantesimo1) e.push({ campo: 'magia', messaggio: 'Aggiungi almeno un trucchetto o un incantesimo, oppure togli la magia' });
    for (const t of g.trucchettiFissi) if (d.incantesimi[t]?.livello !== 0) e.push({ campo: 'magia', messaggio: `${d.incantesimi[t]?.nome ?? t} non è un trucchetto` });
    if (g.incantesimo1 && d.incantesimi[g.incantesimo1]?.livello !== 1) e.push({ campo: 'magia', messaggio: 'L\'incantesimo deve essere di 1° livello' });
    if (g.trucchettiScelti && (g.trucchettiScelti.quantita < 1 || g.trucchettiScelti.quantita > 3)) e.push({ campo: 'magia', messaggio: 'Trucchetti a scelta: da 1 a 3' });
  }
  m.tratti.forEach((t, i) => { if (!t.nome.trim()) e.push({ campo: `tratto-${i}`, messaggio: 'Dai un nome al tratto (o toglilo)' }); });
  return e;
}

const slug = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const NOME_LISTA_IT: Record<ListaSpecie, string> = { cleric: 'Chierico', druid: 'Druido', wizard: 'Mago' };

// Dal modulo alla Specie. Gli id delle scelte iniziano con l'id della specie: cambiandola si tolgono da sole.
export function creaSpecie(m: ModuloSpecie, d: Dati = DATI): Specie {
  if (controllaSpecie(m, d).length) throw new Error('Modulo incompleto');
  const id = m.id ?? `pers-specie-${slug(m.nome)}`;
  const nome = m.nome.trim();
  const rimando = [m.fonte.trim(), m.pagina.trim() ? `p. ${m.pagina.trim()}` : ''].filter(Boolean).join(', ');
  const tratto = (suffisso: string, nomeT: string, effetti: Effetto[]): Feature => ({ id: `${id}-${suffisso}`, nome: nomeT, nomeEn: nomeT, livello: 1, effetti });
  const tratti: Feature[] = [];

  if (m.scurovisione) tratti.push(tratto('scurovisione', 'Scurovisione', [{ tipo: 'nota', testo: `Scurovisione ${m.scurovisione} m` }]));
  if (m.resistenze.length) tratti.push(tratto('resistenze', `Resistenza (${m.resistenze.join(', ')})`, m.resistenze.map((danno) => ({ tipo: 'resistenza', danno }))));
  if (m.abilitaFisse.length || m.sceltaAbilita) {
    const ef: Effetto[] = [];
    if (m.abilitaFisse.length) ef.push({ tipo: 'competenza', categoria: 'abilita', ids: m.abilitaFisse });
    if (m.sceltaAbilita) ef.push({ tipo: 'scelta', scelta: { id: `${id}.abilita`, tipo: 'abilita', quantita: m.sceltaAbilita.quantita,
      opzioni: m.sceltaAbilita.opzioni.length ? m.sceltaAbilita.opzioni : TUTTE_LE_ABILITA, srd: { pagina: 0 } } });
    tratti.push(tratto('abilita', 'Abilità della specie', ef));
  }
  if (m.talento.tipo === 'fisso')
    tratti.push(tratto('talento', `Talento: ${d.talenti[m.talento.id].nome}`, [{ tipo: 'talento', talento: m.talento.id,
      ...(m.talento.lista ? { parametri: { 'magic-initiate.lista': m.talento.lista } } : {}) }]));
  if (m.talento.tipo === 'scelta')
    tratti.push(tratto('talento', 'Talento d\'origine a scelta', [
      { tipo: 'scelta', scelta: { id: `${id}.talento`, tipo: 'talento', quantita: 1, filtro: { categoriaTalento: 'origine' }, srd: { pagina: 87 } } },
      { tipo: 'talento', talento: { daScelta: `${id}.talento` } }]));
  if (m.pfExtra) tratti.push(tratto('pf', 'Punti ferita in più', [{ tipo: 'pfMassimi', perLivello: 1, etichetta: nome }]));

  if (m.magia) {
    const g = m.magia;
    const ef: Effetto[] = [];
    if (g.caratteristica === 'scelta')
      ef.push({ tipo: 'scelta', scelta: { id: `${id}.caratteristica`, tipo: 'caratteristica', quantita: 1, opzioni: ['INT', 'SAG', 'CAR'], srd: { pagina: 0 } } });
    if (g.trucchettiScelti)
      ef.push({ tipo: 'scelta', scelta: { id: `${id}.trucchetti`, tipo: 'trucchetto', quantita: g.trucchettiScelti.quantita,
        filtro: { lista: g.trucchettiScelti.lista, livello: 0 }, srd: { pagina: 0 } } });
    const c: ConcessioneMagia = {
      id, nome: `Specie: ${nome}`, fonte: { tipo: 'specie', id },
      caratteristica: g.caratteristica === 'scelta' ? { daScelta: `${id}.caratteristica` } : g.caratteristica,
      ...(g.trucchettiScelti ? { lista: g.trucchettiScelti.lista, trucchetti: { quantita: g.trucchettiScelti.quantita, scelta: `${id}.trucchetti` } } : {}),
      ...(g.trucchettiFissi.length ? { trucchettiFissi: g.trucchettiFissi } : {}),
      ...(g.incantesimo1 ? { semprePreparati: [g.incantesimo1], lanciGratuiti: { incantesimi: [g.incantesimo1], usi: 1, recupero: 'lungo' as const } } : {}),
      puoUsareSlot: !!g.incantesimo1, srd: { pagina: 0 },
    };
    ef.push({ tipo: 'magia', concessione: c });
    const parti = [...g.trucchettiFissi.map((t) => d.incantesimi[t]?.nome ?? t),
      ...(g.trucchettiScelti ? [`${g.trucchettiScelti.quantita} trucchett${g.trucchettiScelti.quantita === 1 ? 'o' : 'i'} (${NOME_LISTA_IT[g.trucchettiScelti.lista]})`] : []),
      ...(g.incantesimo1 ? [d.incantesimi[g.incantesimo1]?.nome ?? g.incantesimo1] : [])];
    tratti.push(tratto('magia', `Magia: ${parti.join(', ')}`, ef));
  }

  m.tratti.forEach((t, i) => {
    const ef: Effetto[] = [];
    if (t.testo.trim()) ef.push({ tipo: 'nota', testo: t.testo.trim() });
    if (t.usi !== 'sempre') ef.push({ tipo: 'risorsa', risorsa: { id: `${id}-tratto-${i}`, nome: t.nome.trim(),
      usi: t.usi === 'competenza' ? { competenza: true } : 1, recupero: [{ riposo: t.riposo, quanti: 'tutti' }], srd: { pagina: 0 } } });
    tratti.push(tratto(`tratto-${i}`, t.nome.trim(), ef));
  });

  return {
    id, nome, nomeEn: nome, personalizzato: true, taglie: m.taglie, velocita: piediDaMetri(m.velocitaMetri), tratti,
    ...(rimando ? { rimando } : {}), ...(m.descrizione.trim() ? { descrizione: m.descrizione.trim() } : {}),
    modulo: structuredClone(m),     // per riaprirlo e modificarlo così come è stato scritto
  };
}

// Per riaprire una specie salvata nel modulo
export function moduloDaSpecie(sp: Specie): ModuloSpecie {
  const salvato = sp.modulo as ModuloSpecie | undefined;
  if (salvato) return { ...structuredClone(salvato), id: sp.id };
  return { ...moduloSpecieVuoto(), id: sp.id, nome: sp.nome, taglie: [...sp.taglie], velocitaMetri: metriDaPiedi(sp.velocita) };
}
