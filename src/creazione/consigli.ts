// «Non sai cosa scegliere?» (idea 2, 23/11): consigli per chi inizia. Sono NOSTRI, non regole dell'SRD:
// le righe sugli effetti sono verificate sull'SRD 5.2 (pagina accanto), le scelte consigliate sono un giudizio.
// Dove si può, il consiglio viene dai dati (la caratteristica principale della classe, SRD p. 21).
import { DATI, type Dati } from '../regole/dati';
import { ABILITA, NOME_CAR, SERIE_PER_CLASSE } from '../regole/dati/base';
import { CARATTERISTICHE, type Car, type Id } from '../regole/tipi';
import { SCHEDE_CLASSE } from './testi';

// ───────── Classe ─────────
export const STILI_DI_GIOCO: { stile: string; classi: Id[] }[] = [
  { stile: 'Stare in prima linea e reggere i colpi', classi: ['barbarian', 'fighter', 'paladin'] },
  { stile: 'Colpire da lontano con arco e frecce', classi: ['ranger', 'fighter'] },
  { stile: 'Muoversi di nascosto e colpire dove fa male', classi: ['rogue', 'monk'] },
  { stile: 'Curare e proteggere il gruppo', classi: ['cleric', 'druid', 'paladin', 'bard'] },
  { stile: 'Lanciare tanti incantesimi', classi: ['wizard', 'sorcerer', 'warlock'] },
  { stile: 'Parlare, convincere, ingannare', classi: ['bard', 'warlock', 'rogue'] },
];
export const classiFacili = () => Object.entries(SCHEDE_CLASSE).filter(([, s]) => s.difficolta === 'facile').map(([id]) => id);

// ───────── Caratteristiche principali (dalla serie consigliata dell'SRD, p. 21) ─────────
export function principali(classe: Id): Car[] {
  const serie = SERIE_PER_CLASSE[classe];
  if (!serie) return [];
  return CARATTERISTICHE.map((c, i) => ({ c, v: serie[i] })).sort((a, b) => b.v - a.v).slice(0, 2).map((x) => x.c);
}

// ───────── Background ─────────
// L'SRD consiglia il background che aumenta la caratteristica principale (p. 19-20): prima chi dà la prima, poi la seconda
export function backgroundConsigliati(classe: Id, d: Dati = DATI): Id[] {
  const [p1, p2] = principali(classe);
  return Object.values(d.background).filter((b) => !b.personalizzato && b.caratteristiche.includes(p1))
    .sort((a, b) => Number(b.caratteristiche.includes(p2)) - Number(a.caratteristiche.includes(p2))).map((b) => b.id);
}

// I talenti d'origine e gli stili di combattimento in una riga (SRD p. 87-88)
export const RIGA_TALENTO: Record<Id, string> = {
  alert: 'Agisci prima: aggiungi la competenza all\'iniziativa e puoi scambiare il tuo turno con un alleato.',
  'magic-initiate': '2 trucchetti e 1 incantesimo di 1° in più da una lista; l\'incantesimo lo lanci anche gratis una volta per riposo lungo.',
  'savage-attacker': 'Una volta per turno, quando colpisci con un\'arma, tiri i dadi dei danni due volte e tieni il risultato che preferisci.',
  skilled: 'Competenza in 3 abilità o strumenti a scelta: utile se vuoi saper fare un po\' di tutto.',
  archery: '+2 ai tiri per colpire con le armi a distanza: per chi usa l\'arco.',
  defense: '+1 alla CA quando indossi un\'armatura: per chi sta in prima linea.',
  'great-weapon-fighting': 'Con un\'arma da mischia a due mani, gli 1 e i 2 sui dadi dei danni contano come 3.',
  'two-weapon-fighting': 'Con due armi leggere, aggiungi il modificatore anche ai danni del secondo attacco.',
};

// ───────── Specie ─────────
export const CONSIGLIO_SPECIE = 'Con le regole 2024 la specie non cambia le caratteristiche: i bonus li dà il background. '
  + 'Scegli quella che ti piace per il personaggio che immagini, guardando i tratti nella scheda: nessuna è sbagliata per nessuna classe.';

// ───────── Abilità ─────────
// Le abilità della lista della classe che usano le sue caratteristiche principali, più Percezione se c'è
export function abilitaConsigliate(classe: Id, d: Dati = DATI): Id[] {
  const c = d.classi[classe];
  if (!c) return [];
  const pr = principali(classe);
  const opz = c.abilita.opzioni ?? [];
  const usa = opz.filter((a) => pr.includes(ABILITA[a]?.car as Car));
  return [...new Set([...usa, ...(opz.includes('perception') ? ['perception'] : [])])];
}
export const RIGA_PERCEZIONE = 'Percezione è nella lista della tua classe: serve spesso, a chiunque, per accorgersi di pericoli e trappole.';

// ───────── Incantesimi: qualche scelta sicura per classe ─────────
// Effetti verificati sull'SRD 5.2 (testi degli incantesimi); id controllati da un test sulle liste di classe.
export const INCANTESIMI_CONSIGLIATI: Record<Id, { id: Id; riga: string }[]> = {
  wizard: [
    { id: 'fire-bolt', riga: 'il tuo attacco a distanza: 1d10 fuoco, senza slot' },
    { id: 'mage-hand', riga: 'una mano invisibile per prendere e spostare oggetti da lontano' },
    { id: 'mage-armor', riga: 'CA 13 + Destrezza per 8 ore: lancialo al mattino' },
    { id: 'shield', riga: 'come reazione +5 alla CA quando ti colpiscono: salva la vita' },
    { id: 'magic-missile', riga: 'tre dardi che colpiscono sempre' },
    { id: 'sleep', riga: 'fa crollare le creature in una piccola area (TS su Saggezza)' },
  ],
  sorcerer: [
    { id: 'fire-bolt', riga: 'attacco a distanza affidabile: 1d10 fuoco' },
    { id: 'sorcerous-burst', riga: 'scegli tu il tipo di danno; con un 8 tiri un dado in più' },
    { id: 'shield', riga: '+5 alla CA come reazione: lo stregone ha pochi PF' },
    { id: 'burning-hands', riga: 'cono di fuoco contro più nemici vicini' },
    { id: 'chromatic-orb', riga: '3d8 del tipo che preferisci: utile contro chi resiste al fuoco' },
  ],
  warlock: [
    { id: 'eldritch-blast', riga: 'il trucchetto del warlock: 1d10 forza a lunga gittata' },
    { id: 'minor-illusion', riga: 'un suono o un\'immagine per distrarre e ingannare' },
    { id: 'hex', riga: '+1d6 a ogni colpo sul bersaglio, e svantaggio alle sue prove di una caratteristica' },
    { id: 'charm-person', riga: 'una creatura ti considera amica per un\'ora (TS su Saggezza)' },
  ],
  cleric: [
    { id: 'sacred-flame', riga: 'il tuo attacco a distanza: 1d8 radiosi, TS su Destrezza' },
    { id: 'guidance', riga: '+1d4 alle prove di un\'abilità scelta, per un alleato' },
    { id: 'healing-word', riga: 'cura a distanza con un\'azione bonus: rialza chi è a 0 PF' },
    { id: 'cure-wounds', riga: 'cura più forte, ma a contatto' },
    { id: 'bless', riga: '+1d4 ai tiri per colpire e ai TS di tre alleati' },
    { id: 'guiding-bolt', riga: '4d6 radiosi, e il prossimo attacco contro il bersaglio ha vantaggio' },
  ],
  druid: [
    { id: 'produce-flame', riga: 'luce e attacco a distanza: 1d8 fuoco' },
    { id: 'guidance', riga: '+1d4 alle prove di un\'abilità scelta' },
    { id: 'healing-word', riga: 'cura a distanza con un\'azione bonus' },
    { id: 'entangle', riga: 'trattiene i nemici in un\'area (TS su Forza)' },
    { id: 'goodberry', riga: '10 bacche: ognuna cura 1 PF e sfama per un giorno' },
  ],
  bard: [
    { id: 'vicious-mockery', riga: '1d6 psichici e svantaggio al prossimo attacco del bersaglio' },
    { id: 'minor-illusion', riga: 'un suono o un\'immagine per distrarre' },
    { id: 'healing-word', riga: 'cura a distanza con un\'azione bonus' },
    { id: 'dissonant-whispers', riga: '3d6 psichici e il bersaglio scappa (TS su Saggezza)' },
    { id: 'faerie-fire', riga: 'gli alleati attaccano con vantaggio chi è illuminato' },
  ],
  paladin: [
    { id: 'divine-smite', riga: 'dopo aver colpito: +2d8 radiosi (di più contro immondi e non morti)' },
    { id: 'bless', riga: '+1d4 ai tiri per colpire e ai TS di tre alleati' },
    { id: 'cure-wounds', riga: 'cura a contatto, oltre all\'Imposizione delle mani' },
    { id: 'heroism', riga: 'immune allo spaventato e PF temporanei a ogni turno' },
  ],
  ranger: [
    { id: 'cure-wounds', riga: 'l\'unica cura del ranger al livello 1' },
    { id: 'ensnaring-strike', riga: 'dopo il colpo il bersaglio resta trattenuto dai rovi' },
    { id: 'goodberry', riga: '10 bacche: ognuna cura 1 PF' },
    { id: 'longstrider', riga: '+3 metri di velocità per un\'ora' },
  ],
};

export const testoPrincipali = (classe: Id) => principali(classe).map((c) => NOME_CAR[c]).join(' e ');

// Articoli davanti al nome della classe: «lo/uno stregone», «il/un mago»
const conS = (nome: string) => /^(s[^aeiou]|z|gn|ps|x|y)/i.test(nome);
export const ilClasse = (nome: string) => `${conS(nome) ? 'Lo' : 'Il'} ${nome.toLowerCase()}`;
export const unClasse = (nome: string) => `${conS(nome) ? 'uno' : 'un'} ${nome.toLowerCase()}`;
export const CON_ARTICOLO: Record<Car, string> = { FOR: 'la Forza', DES: 'la Destrezza', COS: 'la Costituzione', INT: 'l\'Intelligenza', SAG: 'la Saggezza', CAR: 'il Carisma' };
