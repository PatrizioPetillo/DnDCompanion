// Background personalizzati (sezione 4): i 12 del Manuale del Giocatore 2024 che non sono nell'SRD, più quelli
// di altri manuali o inventati. L'app ne conosce solo il NOME e il rimando al manuale: i dati li inserisce chi ha
// il libro, con un modulo guidato. Si salvano tra «I miei elementi» e viaggiano con la scheda (JSON e link).
import { DATI, type Dati } from '../regole/dati';
import { STRUMENTI_ARTIGIANO, STRUMENTI_MUSICALI } from '../regole/dati/base';
import { type Background, type Car, type Id, type Scelta } from '../regole/tipi';

// I background del Manuale del Giocatore 2024 che non sono nell'SRD: solo nomi (nomi italiani da verificare sul manuale)
export const DAL_MANUALE: { id: string; nome: string; nomeEn: string }[] = [
  { id: 'artisan', nome: 'Artigiano', nomeEn: 'Artisan' },
  { id: 'charlatan', nome: 'Ciarlatano', nomeEn: 'Charlatan' },
  { id: 'entertainer', nome: 'Intrattenitore', nomeEn: 'Entertainer' },
  { id: 'farmer', nome: 'Contadino', nomeEn: 'Farmer' },
  { id: 'guard', nome: 'Guardia', nomeEn: 'Guard' },
  { id: 'guide', nome: 'Guida', nomeEn: 'Guide' },
  { id: 'hermit', nome: 'Eremita', nomeEn: 'Hermit' },
  { id: 'merchant', nome: 'Mercante', nomeEn: 'Merchant' },
  { id: 'noble', nome: 'Nobile', nomeEn: 'Noble' },
  { id: 'sailor', nome: 'Marinaio', nomeEn: 'Sailor' },
  { id: 'scribe', nome: 'Scriba', nomeEn: 'Scribe' },
  { id: 'wayfarer', nome: 'Vagabondo', nomeEn: 'Wayfarer' },
];
export const MANUALE = 'Manuale del Giocatore 2024';

// Strumento del background: uno preciso, oppure «a scelta» in una famiglia (come il gioco del Soldato, SRD p. 83)
export type StrumentoModulo = { tipo: 'fisso'; id: Id } | { tipo: 'scelta'; famiglia: 'artigiano' | 'musicale' | 'gioco' };
export const GIOCHI = ['dice', 'dragonchess', 'playing-cards', 'three-dragon-ante'];
const FAMIGLIA: Record<'artigiano' | 'musicale' | 'gioco', Id[]> = {
  artigiano: Object.keys(STRUMENTI_ARTIGIANO), musicale: Object.keys(STRUMENTI_MUSICALI), gioco: GIOCHI,
};

// Il talento: uno d'origine dell'SRD (Iniziato alla magia con la sua lista), oppure uno fuori dall'SRD, solo scritto
export type TalentoModulo = { tipo: 'srd'; id: Id; lista?: 'cleric' | 'druid' | 'wizard' } | { tipo: 'libero'; nome: string; nota: string };

export interface ModuloBackground {
  id?: Id;                                  // presente quando si modifica un background già salvato
  daManuale?: string;                       // id di DAL_MANUALE, se è uno di quelli
  nome: string;
  pagina: string;                           // pagina del proprio manuale (facoltativa)
  fonte: string;                            // da quale manuale
  descrizione: string;                      // una riga dell'utente
  caratteristiche: (Car | '')[];            // 3
  abilita: (Id | '')[];                     // 2
  strumento: StrumentoModulo | null;
  talento: TalentoModulo | null;
  oggettiA: { oggetto: Id; quantita: number }[];
  moA: number;
}

export function moduloVuoto(daManuale?: string): ModuloBackground {
  const m = DAL_MANUALE.find((x) => x.id === daManuale);
  return {
    ...(m ? { daManuale: m.id } : {}), nome: m?.nome ?? '', pagina: '', fonte: m ? MANUALE : '', descrizione: '',
    caratteristiche: ['', '', ''], abilita: ['', ''], strumento: null, talento: null, oggettiA: [], moA: 0,
  };
}

// Controlli del modulo: ognuno con il campo, per mostrarlo accanto
export function controllaModulo(m: ModuloBackground, d: Dati = DATI): { campo: string; messaggio: string }[] {
  const e: { campo: string; messaggio: string }[] = [];
  if (!m.nome.trim()) e.push({ campo: 'nome', messaggio: 'Scrivi il nome del background' });
  const car = m.caratteristiche.filter(Boolean);
  if (car.length < 3) e.push({ campo: 'caratteristiche', messaggio: 'Scegli le 3 caratteristiche dei bonus (SRD p. 83)' });
  else if (new Set(car).size < 3) e.push({ campo: 'caratteristiche', messaggio: 'Le 3 caratteristiche devono essere diverse' });
  const ab = m.abilita.filter(Boolean);
  if (ab.length < 2) e.push({ campo: 'abilita', messaggio: 'Scegli le 2 abilità' });
  else if (ab[0] === ab[1]) e.push({ campo: 'abilita', messaggio: 'Le 2 abilità devono essere diverse' });
  if (!m.strumento) e.push({ campo: 'strumento', messaggio: 'Scegli lo strumento' });
  if (!m.talento) e.push({ campo: 'talento', messaggio: 'Scegli il talento d\'origine' });
  else if (m.talento.tipo === 'srd' && !d.talenti[m.talento.id]) e.push({ campo: 'talento', messaggio: 'Talento sconosciuto' });
  else if (m.talento.tipo === 'srd' && m.talento.id === 'magic-initiate' && !m.talento.lista) e.push({ campo: 'talento', messaggio: 'Iniziato alla magia: scegli la lista (Chierico, Druido o Mago)' });
  else if (m.talento.tipo === 'libero' && !m.talento.nome.trim()) e.push({ campo: 'talento', messaggio: 'Scrivi il nome del talento' });
  if (m.moA < 0 || !Number.isFinite(m.moA)) e.push({ campo: 'equipaggiamento', messaggio: 'Le monete non possono essere negative' });
  for (const o of m.oggettiA) if (!d.oggetti[o.oggetto]) e.push({ campo: 'equipaggiamento', messaggio: `Oggetto sconosciuto: ${o.oggetto}` });
  return e;
}

const slug = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Dal modulo al Background che il motore calcola come uno dell'SRD
export function creaBackground(m: ModuloBackground, d: Dati = DATI): Background {
  if (controllaModulo(m, d).length) throw new Error('Modulo incompleto');
  const id = m.id ?? `pers-${m.daManuale ?? slug(m.nome)}`;
  const strumento: Background['strumento'] = m.strumento!.tipo === 'fisso' ? m.strumento!.id
    : { id: `${id}.strumento`, tipo: 'strumento', quantita: 1, opzioni: FAMIGLIA[m.strumento!.famiglia], srd: { pagina: 83 } } as Scelta;
  const t = m.talento!;
  const rimando = [m.fonte.trim(), m.pagina.trim() ? `p. ${m.pagina.trim()}` : ''].filter(Boolean).join(', ');
  return {
    id, nome: m.nome.trim(), nomeEn: DAL_MANUALE.find((x) => x.id === m.daManuale)?.nomeEn ?? m.nome.trim(), personalizzato: true,
    caratteristiche: m.caratteristiche as [Car, Car, Car],
    abilita: m.abilita as [Id, Id],
    strumento,
    talento: t.tipo === 'srd' ? { talento: t.id, ...(t.lista ? { parametri: { 'magic-initiate.lista': t.lista } } : {}) } : { talento: '' },
    ...(t.tipo === 'libero' ? { talentoLibero: { nome: t.nome.trim(), nota: t.nota.trim() } } : {}),
    equipaggiamento: { A: { oggetti: m.oggettiA.filter((o) => o.quantita > 0), mo: m.moA }, B: { oggetti: [], mo: 50 } },   // B: 50 mo, come tutti i background (p. 83)
    ...(rimando ? { rimando } : {}),
    ...(m.descrizione.trim() ? { descrizione: m.descrizione.trim() } : {}),
  };
}

// Dal Background salvato di nuovo al modulo, per modificarlo
export function moduloDa(bg: Background): ModuloBackground {
  const [fonte, pagina] = (bg.rimando ?? '').split(/,\s*p\.\s*/);
  const s = bg.strumento;
  const famiglia = typeof s === 'string' ? null : (Object.entries(FAMIGLIA).find(([, ids]) => ids.join() === (s.opzioni ?? []).join())?.[0] as 'artigiano' | 'musicale' | 'gioco' | undefined);
  return {
    id: bg.id, ...(DAL_MANUALE.some((x) => `pers-${x.id}` === bg.id) ? { daManuale: bg.id.slice(5) } : {}),
    nome: bg.nome, fonte: fonte ?? '', pagina: pagina ?? '', descrizione: bg.descrizione ?? '',
    caratteristiche: [...bg.caratteristiche], abilita: [...bg.abilita],
    strumento: typeof s === 'string' ? { tipo: 'fisso', id: s } : famiglia ? { tipo: 'scelta', famiglia } : null,
    talento: bg.talentoLibero ? { tipo: 'libero', ...bg.talentoLibero }
      : { tipo: 'srd', id: bg.talento.talento, ...(bg.talento.parametri?.['magic-initiate.lista'] ? { lista: bg.talento.parametri['magic-initiate.lista'] as 'cleric' | 'druid' | 'wizard' } : {}) },
    oggettiA: bg.equipaggiamento.A.oggetti.map((o) => ({ ...o })), moA: bg.equipaggiamento.A.mo,
  };
}

// ───────── «I miei elementi» ─────────
export interface Elementi { background: Record<Id, Background> }
export const elementiVuoti = (): Elementi => ({ background: {} });

// I dati del motore con anche gli elementi personalizzati (senza toccare quelli dell'SRD)
export const datiCon = (e: Elementi, d: Dati = DATI): Dati => ({ ...d, background: { ...d.background, ...e.background } });

// L'app usa un solo insieme di dati condiviso: gli elementi personalizzati si registrano lì quando cambiano.
// Si tolgono solo i personalizzati, mai quelli dell'SRD.
export function registra(e: Elementi, d: Dati = DATI) {
  for (const [id, bg] of Object.entries(d.background)) if (bg.personalizzato && !e.background[id]) delete d.background[id];
  for (const [id, bg] of Object.entries(e.background)) d.background[id] = bg;
}

// Gli elementi che servono a una scheda (per il JSON e il link): solo quelli che usa
export function elementiUsati(b: { background?: Id }, e: Elementi): Elementi {
  return { background: b.background && e.background[b.background] ? { [b.background]: e.background[b.background] } : {} };
}

