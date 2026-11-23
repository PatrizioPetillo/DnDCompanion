// Passo 7: Magia (sezione 6). Un blocco per ogni fonte di magia, con la sua CD, il suo attacco e i suoi contatori;
// la scelta degli incantesimi con lo stato di ciascuno. Funzioni pure: l'interfaccia le usa.
import { calcolaScheda, DATI } from '../regole';
import type { Dati } from '../regole/dati';
import type { Id, Incantesimo, MagiaCalcolata, Numero } from '../regole/tipi';
import { comePersonaggio, type Bozza } from './percorso';

export type TipoScelta = 'trucchetti' | 'incantesimi' | 'libro' | 'preparati';
export type StatoIncantesimo = 'scelto' | 'sceglibile' | 'pieno' | 'altraFonte';

// Focus da incantatore per classe (SRD: capacità «Spellcasting» di ogni classe; p. 32, 37, 42, 54, 58, 65, 72, 78)
const FOCUS: Record<Id, string> = {
  bard: 'Uno strumento musicale', cleric: 'Un simbolo sacro', paladin: 'Un simbolo sacro',
  druid: 'Un focus druidico', ranger: 'Un focus druidico', sorcerer: 'Un focus arcano', warlock: 'Un focus arcano',
  wizard: 'Focus arcano o il libro degli incantesimi',
};

// Capacità di livello 1 legate alla magia, in una riga (scritte da noi a partire dall'SRD 5.2)
const CAPACITA: Record<Id, string> = {
  'divine-order': 'Protettore (armi da guerra e armature pesanti) oppure Taumaturgo (un trucchetto in più e bonus ad Arcano e Religione pari alla Saggezza, minimo +1).',
  druidic: 'Conosci il Druidico e hai sempre preparato Parlare con gli animali.',
  'primal-order': 'Mago (un trucchetto in più e bonus ad Arcano e Natura pari alla Saggezza, minimo +1) oppure Custode (armi da guerra e armature medie).',
  'favored-enemy': 'Marchio del cacciatore è sempre preparato e lo lanci 2 volte senza slot per riposo lungo.',
  'innate-sorcery': 'Azione bonus, 1 minuto: +1 alla CD e vantaggio agli attacchi dei tuoi incantesimi da stregone. 2 volte per riposo lungo.',
  'eldritch-invocations': 'Scegli una supplica occulta: alcune danno incantesimi o trucchetti.',
  'ritual-adept': 'Lanci come rituali gli incantesimi rituali del tuo libro, anche se non li hai preparati.',
  'arcane-recovery': 'Dopo un riposo breve recuperi slot per un totale di 1 livello, una volta per riposo lungo.',
};

// La specie arriva dopo il background: per scegliere gli incantesimi di Iniziato già nel Background
// usiamo un segnaposto (l'umano senza scelte), che non aggiunge magia.
const scheda = (b: Bozza, d: Dati) => {
  const pg = comePersonaggio({ ...b, specie: b.specie ?? 'human' });
  return pg ? calcolaScheda(pg, d) : undefined;
};
const nomeInc = (id: Id, d: Dati) => d.incantesimi[id]?.nome ?? id;

export interface Blocco {
  id: Id; nome: string; cd: Numero | null; attacco: Numero | null; focus?: string;
  contatori: { tipo: TipoScelta; etichetta: string; scelti: number; attesi: number; voci: Id[] }[];
  semprePreparati: Id[]; lanci?: string; capacita: { nome: string; testo: string }[];
  caratteristica?: { scelta: Id; valore: string };   // da scegliere qui (talenti e specie: INT, SAG o CAR)
  listaDaScegliere?: Id;                              // Iniziato alla magia senza lista: si sceglie anche qui (SRD p. 87)
}

// Iniziato alla magia: la lista (Chierico, Druido o Mago) va scelta prima degli incantesimi. Senza lista l'elenco
// era tutto l'SRD (trovato nel giro delle 12 classi, 23/11: un monaco umano poteva prendere Beffa crudele, del bardo).
const iniziatoSenzaLista = (m: { id: Id; lista?: Id | null }) => m.id.startsWith('magic-initiate') && !m.lista;

export function blocchiMagia(b: Bozza, d: Dati = DATI): Blocco[] {
  const s = scheda(b, d);
  if (!s) return [];
  const ORDINE = { classe: 0, specie: 1, background: 2, talento: 2 } as const;   // prima la classe
  return [...s.magia].sort((a, c) => ORDINE[a.fonte.tipo] - ORDINE[c.fonte.tipo]).map((m) => {
    const contatori: Blocco['contatori'] = [];
    const conta = (tipo: TipoScelta, etichetta: string, attesi: number) => {
      const voci = letti(b, m, tipo);
      contatori.push({ tipo, etichetta, scelti: voci.length, attesi, voci });
    };
    // Il contatore conta solo quelli da scegliere: i trucchetti dati (una specie con Luce + 1 a scelta) non si scelgono
    const daScegliere = m.trucchetti.attesi - (m.trucchetti.fissi?.length ?? 0);
    if (daScegliere > 0 && m.scelte.trucchetti) conta('trucchetti', 'Trucchetti', daScegliere);
    if (m.scelte.incantesimi) conta('incantesimi', m.soloRituali ? 'Rituali di 1°' : m.incantesimiQuanti > 1 ? 'Incantesimi di 1°' : 'Incantesimo di 1°', m.incantesimiQuanti);
    if (m.libro) conta('libro', 'Nel libro', m.libro.iniziali);
    if (m.preparati) conta('preparati', 'Preparati', m.preparati.limite);
    const classe = m.fonte.tipo === 'classe' ? d.classi[m.fonte.id] : undefined;
    const capacita = (classe?.features ?? []).filter((f) => f.livello <= (b.livello ?? 1) && CAPACITA[f.id]).map((f) => ({ nome: f.nome, testo: CAPACITA[f.id] }));
    const lanci = m.lanciGratuiti && m.lanciGratuiti.incantesimi.length
      ? `${m.lanciGratuiti.incantesimi.map((i) => nomeInc(i, d)).join(', ')}: ${m.lanciGratuiti.usi === 1 ? '1 volta' : `${m.lanciGratuiti.usi} volte`} gratis per riposo ${m.lanciGratuiti.recupero === 'lungo' ? 'lungo' : 'breve'}${m.slot ? ', poi anche con gli slot' : ''}`
      : undefined;
    return {
      id: m.id, nome: m.nome, cd: m.cd, attacco: m.attacco, ...(classe ? { focus: FOCUS[classe.id] } : {}),
      contatori, semprePreparati: m.semprePreparati.filter((x) => !(b.scelte[m.scelte.incantesimi ?? ''] ?? []).includes(x)),
      ...(lanci ? { lanci } : {}), capacita,
      ...(m.scelte.caratteristica ? { caratteristica: { scelta: m.scelte.caratteristica, valore: b.scelte[m.scelte.caratteristica]?.[0] ?? '' } } : {}),
      ...(iniziatoSenzaLista(m) ? { listaDaScegliere: `${m.id}.lista` } : {}),
    };
  });
}

// Dove si salva ogni tipo di scelta
function letti(b: Bozza, m: MagiaCalcolata, tipo: TipoScelta): Id[] {
  if (tipo === 'trucchetti') return m.scelte.trucchetti ? b.scelte[m.scelte.trucchetti] ?? [] : [];
  if (tipo === 'incantesimi') return m.scelte.incantesimi ? b.scelte[m.scelte.incantesimi] ?? [] : [];
  if (tipo === 'libro') return b.incantesimi.libro ?? [];
  return b.incantesimi.preparati[m.id] ?? [];
}
function scrivi(b: Bozza, m: MagiaCalcolata, tipo: TipoScelta, v: Id[]): Bozza {
  if (tipo === 'trucchetti' && m.scelte.trucchetti) return { ...b, scelte: { ...b.scelte, [m.scelte.trucchetti]: v } };
  if (tipo === 'incantesimi' && m.scelte.incantesimi) return { ...b, scelte: { ...b.scelte, [m.scelte.incantesimi]: v } };
  if (tipo === 'libro') return { ...b, incantesimi: { ...b.incantesimi, libro: v } };
  if (tipo === 'preparati') return { ...b, incantesimi: { ...b.incantesimi, preparati: { ...b.incantesimi.preparati, [m.id]: v } } };
  return b;
}
function quanti(m: MagiaCalcolata, tipo: TipoScelta): number {
  if (tipo === 'trucchetti') return m.trucchetti.attesi - (m.trucchetti.fissi?.length ?? 0);
  if (tipo === 'incantesimi') return m.incantesimiQuanti;
  if (tipo === 'libro') return m.libro?.iniziali ?? 0;
  return m.preparati?.limite ?? 0;
}

export function opzioniIncantesimi(b: Bozza, magiaId: Id, tipo: TipoScelta, d: Dati = DATI) {
  const s = scheda(b, d);
  const m = s?.magia.find((x) => x.id === magiaId);
  if (!s || !m || iniziatoSenzaLista(m)) return [];
  const presi = letti(b, m, tipo);
  const pieno = presi.length >= quanti(m, tipo);
  // Già dati da un'altra fonte: trucchetti conosciuti e incantesimi sempre preparati o preparati altrove
  const altrove = new Map<Id, string>();
  for (const x of s.magia) {
    if (x.id === m.id && tipo !== 'preparati') continue;
    const conosciuti = tipo === 'trucchetti' ? x.trucchetti.scelti : [...x.semprePreparati, ...(x.id !== m.id ? x.preparati?.scelti ?? [] : [])];
    for (const i of conosciuti) if (!(x.id === m.id && presi.includes(i))) altrove.set(i, x.nome);
  }
  const candidati: Incantesimo[] = tipo === 'preparati' && m.preparatiDa === 'libro'
    ? (b.incantesimi.libro ?? []).map((i) => d.incantesimi[i]).filter(Boolean)
    : Object.values(d.incantesimi).filter((i) => (!m.lista || i.liste.includes(m.lista)) && (
      tipo === 'trucchetti' ? i.livello === 0 : tipo === 'incantesimi' ? i.livello === 1 && (!m.soloRituali || i.rituale) : i.livello >= 1 && i.livello <= m.livelloMax));
  return candidati
    .map((i) => {
      const stato: StatoIncantesimo = presi.includes(i.id) ? 'scelto' : altrove.has(i.id) ? 'altraFonte' : pieno ? 'pieno' : 'sceglibile';
      return { id: i.id, nome: i.nome, livello: i.livello, stato, ...(stato === 'altraFonte' ? { fonte: altrove.get(i.id) } : {}) };
    })
    .sort((a, b2) => a.livello - b2.livello || a.nome.localeCompare(b2.nome, 'it'));
}

export function scegliIncantesimo(b: Bozza, magiaId: Id, tipo: TipoScelta, id: Id, d: Dati = DATI): Bozza {
  const s = scheda(b, d);
  const m = s?.magia.find((x) => x.id === magiaId);
  const voce = opzioniIncantesimi(b, magiaId, tipo, d).find((x) => x.id === id);
  if (!m || !voce) return b;
  const presi = letti(b, m, tipo);
  if (voce.stato === 'scelto') return scrivi(b, m, tipo, presi.filter((x) => x !== id));
  if (voce.stato === 'sceglibile') return scrivi(b, m, tipo, [...presi, id]);
  return b;
}

// Sostituisce un incantesimo con un altro nella stessa lista (per i cambi dopo il riposo lungo)
export function sostituisci(b: Bozza, magiaId: Id, tipo: TipoScelta, vecchio: Id, nuovo: Id, d: Dati = DATI): Bozza {
  const s = scheda(b, d);
  const m = s?.magia.find((x) => x.id === magiaId);
  if (!m) return b;
  const presi = letti(b, m, tipo);
  if (!presi.includes(vecchio) || presi.includes(nuovo)) return b;
  return scrivi(b, m, tipo, presi.map((x) => (x === vecchio ? nuovo : x)));
}

export interface Filtri {
  livello?: number; scuola?: string; cerca?: string;
  concentrazione?: 'si' | 'no'; rituale?: 'si' | 'no'; tempo?: Incantesimo['tempo']['tipo']; materialeConCosto?: 'si' | 'no';
}
const siNo = (f: 'si' | 'no' | undefined, v: boolean) => !f || (f === 'si') === v;
export function filtra<T extends { id: Id }>(voci: T[], f: Filtri, d: Dati = DATI): T[] {
  const cerca = f.cerca?.trim().toLowerCase();
  return voci.filter((v) => {
    const i = d.incantesimi[v.id];
    return (f.livello === undefined || i.livello === f.livello) && (!f.scuola || i.scuola === f.scuola)
      && (!cerca || i.nome.toLowerCase().includes(cerca) || (i.nomeEn ?? '').toLowerCase().includes(cerca))
      && siNo(f.concentrazione, i.concentrazione) && siNo(f.rituale, i.rituale) && (!f.tempo || i.tempo.tipo === f.tempo)
      && siNo(f.materialeConCosto, !!i.componenti.M?.costoMo);
  });
}
