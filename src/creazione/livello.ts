// Salire di livello (23/11, scelte di Patrizio): il livello successivo, la regola dei PF del tavolo, il valore fisso,
// e una riga per ogni capacità nuova. La schermata unica sta in nuovo-livello.ts / NuovoLivello.tsx.
import { DATI } from '../regole';
import type { Dati } from '../regole/dati';
import { LIVELLO_MASSIMO, type RegolaPf } from '../regole/livelli';
import type { Bozza } from './percorso';

export const prossimoLivello = (b: Bozza): number | null => ((b.livello ?? 1) < LIVELLO_MASSIMO ? (b.livello ?? 1) + 1 : null);
export const regolaPf = (b: Bozza): RegolaPf => b.tavolo?.pf ?? 'scelta';
export const pfFisso = (dadoVita: number) => dadoVita / 2 + 1;   // SRD p. 23

// Cosa porta il livello, in una riga per capacità (testi nostri dall'SRD 5.2, pagina accanto)
const RIGHE: Record<string, string> = {
  'ability-score-improvement-4': 'Prendi l\'Aumento dei punteggi (+2 a una caratteristica o +1 a due, massimo 20) oppure un altro talento per cui hai i requisiti.',
  'barbarian-weapon-mastery-4': 'Padroneggi un\'arma in più: scegli quale.',
  'fighter-weapon-mastery-4': 'Padroneggi un\'arma in più: scegli quale.',
  'bard-expertise': 'Competenza doppia in 2 abilità in cui hai competenza.',
  'jack-of-all-trades': 'Metà del bonus di competenza alle prove di abilità in cui non hai competenza.',
  'channel-divinity': 'Due usi: Scintilla divina (cura o danni) o Scacciare non morti; uno torna con il riposo breve.',
  'wild-shape': 'Due usi: ti trasformi in una bestia tra 4 forme conosciute.',
  'action-surge': 'Una volta per riposo breve, un\'azione in più nel tuo turno.',
  'monks-focus': '2 punti concentrazione: Raffica di colpi, Difesa paziente, Passo del vento.',
  'unarmored-movement': '+3 m di velocità senza armatura né scudo.',
  'uncanny-metabolism': 'Tirando l\'iniziativa recuperi punti concentrazione e PF, una volta per riposo lungo.',
  'paladin-fighting-style': 'Uno stile di combattimento, o 2 trucchetti da chierico.',
  'paladins-smite': 'Punizione divina sempre preparata, una volta gratis per riposo lungo.',
  'deft-explorer': 'Maestria in un\'abilità e 2 lingue.',
  'ranger-fighting-style': 'Uno stile di combattimento, o 2 trucchetti da druido.',
  'font-of-magic': '2 punti stregoneria: diventano slot, e gli slot diventano punti.',
  metamagic: '2 opzioni per modificare gli incantesimi.',
  'eldritch-invocations-2': '2 suppliche occulte in più.',
  // 5° livello (23/11)
  'extra-attack': 'Con l\'azione Attacco attacchi due volte invece di una.',
  'fast-movement': 'La tua velocità aumenta di 3 m se non indossi un\'armatura pesante.',
  'faithful-steed': 'Trova cavalcatura è sempre preparato e puoi lanciarlo una volta senza slot; torna con il riposo lungo.',
  'eldritch-invocations-5': '2 suppliche occulte in più: ora anche quelle del 5° livello.',
  'evocation-savant-5': 'Un incantesimo di invocazione da mago di 3° livello nel libro, gratis (nuovo livello di slot).',
  'magical-cunning': 'Una volta per riposo lungo, in 1 minuto recuperi metà degli slot del patto.',
  scholar: 'Maestria in un\'abilità tra Arcano, Storia, Indagare, Medicina, Natura, Religione.',
};

export function capacitaDelLivello(b: Bozza, n: number, d: Dati = DATI): { nome: string; testo?: string; pagina?: number }[] {
  const classe = b.classe ? d.classi[b.classe] : undefined;
  return (classe?.features ?? []).filter((f) => f.livello === n).map((f) => {
    const nota = f.effetti.find((e) => e.tipo === 'nota');
    const testo = RIGHE[f.id] ?? (nota && nota.tipo === 'nota' ? nota.testo.replace(/\s*\(SRD p\. \d+\)$/, '') : undefined);
    return { nome: f.nome, ...(testo ? { testo } : {}), ...(f.srd?.pagina ? { pagina: f.srd.pagina } : {}) };
  });
}

// Durante la creazione a un livello più alto (tavolo che parte dal 2°): il tiro di un livello, o null per il valore fisso
export function scriviTiroPf(b: Bozza, livello: number, tiro: number | null): Bozza {
  const { [livello]: _vecchio, ...altri } = b.tiriPf ?? {};
  const tiriPf = tiro !== null ? { ...altri, [livello]: tiro } : altri;
  const { tiriPf: _t, ...resto } = b;
  return Object.keys(tiriPf).length ? { ...resto, tiriPf } : resto;
}
