// Condizioni al tavolo (22/11): il giocatore segna quelle che ha, l'app dice cosa cambia ai suoi tiri.
// Regole dal glossario dell'SRD 5.2 (p. 177-191); vantaggio e svantaggio insieme si annullano (p. 7).
// La durata non la tiene l'app: finisce quando lo dice l'effetto o il master.
export type IdCondizione = 'accecato' | 'affascinato' | 'afferrato' | 'assordato' | 'avvelenato' | 'incapacitato' | 'indebolimento' | 'invisibile'
  | 'paralizzato' | 'pietrificato' | 'privo-di-sensi' | 'prono' | 'spaventato' | 'stordito' | 'trattenuto';
type VS = 'vantaggio' | 'svantaggio';
interface Effetti {
  tuoiAttacchi?: VS; controVicino?: VS; controLontano?: VS; prove?: VS; iniziativa?: VS;
  tsForDesFalliti?: boolean; tsDesSvantaggio?: boolean; velocita0?: boolean; incapacitato?: boolean; criticiVicino?: boolean;
  include?: IdCondizione[]; note?: string[];
}
export interface Condizione { id: IdCondizione; nome: string; pagina: number; riga: string; effetti: Effetti }

const C = (id: IdCondizione, nome: string, pagina: number, riga: string, effetti: Effetti): Condizione => ({ id, nome, pagina, riga, effetti });
export const CONDIZIONI: Condizione[] = [
  C('accecato', 'Accecato', 177, 'Non vedi: svantaggio ai tuoi attacchi, vantaggio a chi ti attacca.',
    { tuoiAttacchi: 'svantaggio', controVicino: 'vantaggio', controLontano: 'vantaggio', note: ['Fallisci le prove che richiedono la vista.'] }),
  C('affascinato', 'Affascinato', 178, 'Non puoi attaccare chi ti ha affascinato; lui ha vantaggio nelle prove sociali con te.',
    { note: ['Non puoi attaccare chi ti ha affascinato, né colpirlo con effetti dannosi.'] }),
  C('afferrato', 'Afferrato', 182, 'Velocità 0; svantaggio agli attacchi contro chi non ti afferra.',
    { velocita0: true, note: ['Svantaggio agli attacchi contro chiunque non sia chi ti afferra.'] }),
  C('assordato', 'Assordato', 181, 'Non senti: fallisci le prove che richiedono l\'udito.', { note: ['Fallisci le prove che richiedono l\'udito.'] }),
  C('avvelenato', 'Avvelenato', 186, 'Svantaggio ai tiri per colpire e alle prove.', { tuoiAttacchi: 'svantaggio', prove: 'svantaggio' }),
  C('incapacitato', 'Incapacitato', 184, 'Niente azioni, azioni bonus né reazioni; perdi la concentrazione.',
    { incapacitato: true, iniziativa: 'svantaggio' }),
  C('indebolimento', 'Indebolimento', 181, '−2 a ogni tiro di d20 e −1,5 m di velocità per livello; a 6 livelli muori.', {}),
  C('invisibile', 'Invisibile', 184, 'Vantaggio ai tuoi attacchi e all\'iniziativa, svantaggio a chi ti attacca (se non ti vede).',
    { tuoiAttacchi: 'vantaggio', controVicino: 'svantaggio', controLontano: 'svantaggio', iniziativa: 'vantaggio' }),
  C('paralizzato', 'Paralizzato', 186, 'Incapacitato, velocità 0, fallisci i TS di Forza e Destrezza, colpito da vicino è critico.',
    { include: ['incapacitato'], velocita0: true, tsForDesFalliti: true, controVicino: 'vantaggio', controLontano: 'vantaggio', criticiVicino: true }),
  C('pietrificato', 'Pietrificato', 186, 'Statua: incapacitato, velocità 0, resistenza a tutti i danni.',
    { include: ['incapacitato'], velocita0: true, tsForDesFalliti: true, controVicino: 'vantaggio', controLontano: 'vantaggio', note: ['Resistenza a tutti i danni; immune al veleno.'] }),
  C('privo-di-sensi', 'Privo di sensi', 191, 'Incapacitato e prono, velocità 0, colpito da vicino è critico.',
    { include: ['incapacitato', 'prono'], velocita0: true, tsForDesFalliti: true, controVicino: 'vantaggio', controLontano: 'vantaggio', criticiVicino: true, note: ['Lasci cadere quello che tieni in mano.'] }),
  C('prono', 'Prono', 186, 'A terra: svantaggio ai tuoi attacchi; da vicino ti colpiscono con vantaggio, da lontano con svantaggio.',
    { tuoiAttacchi: 'svantaggio', controVicino: 'vantaggio', controLontano: 'svantaggio', note: ['Per rialzarti spendi metà della velocità.'] }),
  C('spaventato', 'Spaventato', 182, 'Svantaggio a prove e attacchi finché vedi la fonte della paura.',
    { tuoiAttacchi: 'svantaggio', prove: 'svantaggio', note: ['Lo svantaggio vale finché vedi la fonte della paura; non puoi avvicinarti a lei.'] }),
  C('stordito', 'Stordito', 189, 'Incapacitato, fallisci i TS di Forza e Destrezza, vantaggio a chi ti attacca.',
    { include: ['incapacitato'], tsForDesFalliti: true, controVicino: 'vantaggio', controLontano: 'vantaggio' }),
  C('trattenuto', 'Trattenuto', 187, 'Velocità 0, svantaggio ai tuoi attacchi e ai TS di Destrezza, vantaggio a chi ti attacca.',
    { velocita0: true, tuoiAttacchi: 'svantaggio', tsDesSvantaggio: true, controVicino: 'vantaggio', controLontano: 'vantaggio' }),
];
export const CONDIZIONE = Object.fromEntries(CONDIZIONI.map((c) => [c.id, c])) as Record<IdCondizione, Condizione>;

export interface CondizioneSegnata { id: IdCondizione; livello?: number }   // livello solo per l'indebolimento (1-6)

// Quelle in effetto: le segnate, quelle che includono (paralizzato → incapacitato) e il privo di sensi a 0 PF (p. 17)
export function inEffetto(segnate: CondizioneSegnata[], pfZero: boolean): IdCondizione[] {
  const tutte = new Set<IdCondizione>();
  const metti = (id: IdCondizione) => { if (tutte.has(id)) return; tutte.add(id); CONDIZIONE[id].effetti.include?.forEach(metti); };
  segnate.forEach((c) => metti(c.id));
  if (pfZero) metti('privo-di-sensi');
  return [...tutte];
}
export const livelloIndebolimento = (segnate: CondizioneSegnata[]) => Math.min(6, Math.max(0, segnate.find((c) => c.id === 'indebolimento')?.livello ?? 0));
export const fannoPerdereConcentrazione = (segnate: CondizioneSegnata[], pfZero: boolean) => inEffetto(segnate, pfZero).some((id) => CONDIZIONE[id].effetti.incapacitato);

// Vantaggio e svantaggio da più fonti: non si sommano; se ci sono entrambi si annullano (SRD p. 7)
function somma(valori: (VS | undefined)[]): VS | 'annullati' | null {
  const v = valori.includes('vantaggio'), s = valori.includes('svantaggio');
  return v && s ? 'annullati' : v ? 'vantaggio' : s ? 'svantaggio' : null;
}
const dice = (x: VS | 'annullati') => (x === 'annullati' ? 'vantaggio e svantaggio si annullano: un d20 solo' : x === 'vantaggio' ? 'vantaggio' : 'svantaggio');

export interface Riassunto { righe: { testo: string; grave?: boolean }[]; velocita0: boolean; menoVelocitaM: number; menoD20: number; morto: boolean }

export function riassunto(segnate: CondizioneSegnata[], pfZero: boolean): Riassunto {
  const ids = inEffetto(segnate, pfZero);
  const e = ids.map((id) => CONDIZIONE[id].effetti);
  const lv = livelloIndebolimento(segnate);
  const righe: Riassunto['righe'] = [];
  const att = somma(e.map((x) => x.tuoiAttacchi));
  if (att) righe.push({ testo: `I tuoi tiri per colpire: ${dice(att)}.` });
  const pr = somma(e.map((x) => x.prove));
  if (pr) righe.push({ testo: `Le tue prove di caratteristica: ${dice(pr)}.` });
  if (e.some((x) => x.tsForDesFalliti)) righe.push({ testo: 'Tiri salvezza su Forza e Destrezza: falliti in automatico.', grave: true });
  else if (e.some((x) => x.tsDesSvantaggio)) righe.push({ testo: 'Tiri salvezza su Destrezza: svantaggio.' });
  const ini = somma(e.map((x) => x.iniziativa));
  if (ini) righe.push({ testo: `Iniziativa: ${dice(ini)}.` });
  const vic = somma(e.map((x) => x.controVicino)), lon = somma(e.map((x) => x.controLontano));
  if (vic && vic === lon) righe.push({ testo: `Chi ti attacca: ${dice(vic)}.` });
  else {
    if (vic) righe.push({ testo: `Chi ti attacca da entro 1,5 m: ${dice(vic)}.` });
    if (lon) righe.push({ testo: `Chi ti attacca da più lontano: ${dice(lon)}.` });
  }
  if (e.some((x) => x.criticiVicino)) righe.push({ testo: 'Se ti colpiscono da entro 1,5 m è un colpo critico.', grave: true });
  if (e.some((x) => x.incapacitato)) righe.push({ testo: 'Non puoi fare azioni, azioni bonus né reazioni, e non puoi parlare.', grave: true });
  const velocita0 = e.some((x) => x.velocita0);
  if (velocita0) righe.push({ testo: 'Velocità 0.' });
  if (lv > 0) righe.push({ testo: `Indebolimento ${lv}: −${2 * lv} a ogni tiro di d20${velocita0 ? '' : `, velocità −${(1.5 * lv).toLocaleString('it-IT')} m`}.`, grave: lv >= 5 });
  if (lv >= 6) righe.push({ testo: 'Con 6 livelli di indebolimento il personaggio muore (SRD p. 181).', grave: true });
  for (const x of e) for (const n of x.note ?? []) righe.push({ testo: n });
  return { righe, velocita0, menoVelocitaM: velocita0 ? 0 : 1.5 * lv, menoD20: 2 * lv, morto: lv >= 6 };
}

// ───────── Modifiche ─────────
export function aggiungi(lista: CondizioneSegnata[], id: IdCondizione): CondizioneSegnata[] {
  if (id === 'indebolimento') {
    const lv = livelloIndebolimento(lista);
    return [...lista.filter((c) => c.id !== id), { id, livello: Math.min(6, lv + 1) }];
  }
  return lista.some((c) => c.id === id) ? lista : [...lista, { id }];
}
export const togli = (lista: CondizioneSegnata[], id: IdCondizione) => lista.filter((c) => c.id !== id);
export function cambiaLivello(lista: CondizioneSegnata[], livello: number): CondizioneSegnata[] {
  const l = Math.max(0, Math.min(6, livello));
  return l === 0 ? togli(lista, 'indebolimento') : [...togli(lista, 'indebolimento'), { id: 'indebolimento', livello: l }];
}
// Riposo lungo (p. 185): toglie 1 livello di indebolimento; le altre condizioni restano, finiscono quando lo dice il loro effetto
export const dopoRiposoLungo = (lista: CondizioneSegnata[]) => (livelloIndebolimento(lista) ? cambiaLivello(lista, livelloIndebolimento(lista) - 1) : lista);

// Effetto sui tiri salvezza (per «Tira per me»): fallimento automatico (paralizzato, stordito…), svantaggio su Destrezza (trattenuto),
// −2 per livello di indebolimento (p. 181)
export function effettoTs(segnate: CondizioneSegnata[], pfZero: boolean, car: string): { fallitoAuto: boolean; svantaggio: boolean; meno: number } {
  const e = inEffetto(segnate, pfZero).map((id) => CONDIZIONE[id].effetti);
  return {
    fallitoAuto: (car === 'FOR' || car === 'DES') && e.some((x) => x.tsForDesFalliti),
    svantaggio: car === 'DES' && e.some((x) => x.tsDesSvantaggio),
    meno: 2 * livelloIndebolimento(segnate),
  };
}

// Per i dadi (idea 6, 23/11): cosa propongono le condizioni per un tiro, con il perché. Il giocatore può cambiarlo.
// L'iniziativa è una prova di Destrezza (p. 13): valgono le condizioni sulle prove e quelle sull'iniziativa.
export type GenereTiro = 'attacco' | 'prova' | 'iniziativa' | { ts: string };
export function perTiro(segnate: CondizioneSegnata[], pfZero: boolean, g: GenereTiro):
  { vantaggi: string[]; svantaggi: string[]; fallitoAuto: string | null; meno: number } {
  const ids = inEffetto(segnate, pfZero);
  const vantaggi: string[] = [], svantaggi: string[] = [];
  let fallitoAuto: string | null = null;
  for (const id of ids) {
    const e = CONDIZIONE[id].effetti, nome = CONDIZIONE[id].nome.toLowerCase();
    const metti = (v?: VS) => { if (v === 'vantaggio') vantaggi.push(nome); if (v === 'svantaggio') svantaggi.push(nome); };
    if (g === 'attacco') metti(e.tuoiAttacchi);
    else if (g === 'prova') metti(e.prove);
    else if (g === 'iniziativa') { metti(e.prove); metti(e.iniziativa); }
    else {
      if ((g.ts === 'FOR' || g.ts === 'DES') && e.tsForDesFalliti) fallitoAuto = nome;
      if (g.ts === 'DES' && e.tsDesSvantaggio) svantaggi.push(nome);
    }
  }
  return { vantaggi: [...new Set(vantaggi)], svantaggi: [...new Set(svantaggi)], fallitoAuto, meno: 2 * livelloIndebolimento(segnate) };
}
