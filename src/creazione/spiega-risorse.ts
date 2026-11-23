// «Cosa fa» per ogni risorsa della scheda (23/11, richiesta di Patrizio partita dall'Ispirazione bardica):
// toccando il nome si legge la regola in parole semplici. Righe nostre, verificate sull'SRD 5.2 (pagina accanto).
// Le risorse delle classi riusano le righe di «Cosa ottieni al livello 1»; l'Ispirazione bardica ha la regola intera.
import { PRIVILEGI_LIVELLO_1 } from './cosa-ottieni';
import { metri } from '../regole/misure';

export interface Spiegazione { testo: string; pagina?: number }

const PER_ID: Record<string, Spiegazione> = {
  'draconic-flight': { pagina: 84, testo: 'Dal 5° livello: con un\'Azione bonus ti spuntano ali spettrali, fatte della stessa energia del tuo soffio, e voli alla tua velocità per 10 minuti (o finché non le ritiri, o se sei incapacitato). Una volta per riposo lungo.' },
  'large-form': { pagina: 86, testo: `Dal 5° livello: con un'Azione bonus, se c'è spazio, diventi di taglia Grande per 10 minuti: vantaggio alle prove di Forza e velocità +${metri(10)}. Una volta per riposo lungo.` },
  'bardic-inspiration': { pagina: 31, testo:
    `Azione bonus: scegli un'altra creatura entro ${metri(60)} che può vederti o sentirti; riceve un tuo dado di Ispirazione bardica (d6). ` +
    'Entro un\'ora, quando fallisce una Prova d20 (prova di caratteristica, tiro per colpire o tiro salvezza), può tirare il dado e aggiungerlo al d20: ' +
    'il fallimento può diventare un successo. Il dado si consuma quando lo tira, e una creatura ne può avere uno solo alla volta. ' +
    'Usi: quanto il tuo modificatore di Carisma (almeno 1); tornano tutti con il riposo lungo. Dal 5° livello il dado diventa d8 e gli usi tornano anche con il riposo breve; puoi spendere uno slot per recuperarne uno (SRD p. 33).' },
  'breath-weapon': { pagina: 84, testo:
    `Quando fai l'azione di Attacco, puoi sostituire un attacco con il soffio: un cono di ${metri(15)} o una linea di ${metri(30)} larga ${metri(5)} (scegli ogni volta). ` +
    'Ogni creatura nell\'area fa un tiro salvezza su Destrezza (CD 8 + Costituzione + competenza): se fallisce subisce 1d10 danni del tipo del tuo antenato (2d10 dal 5° livello), ' +
    'se riesce la metà. Usi: quanto il tuo bonus di competenza; tornano con il riposo lungo.' },
  stonecunning: { pagina: 84, testo:
    `Azione bonus: per 10 minuti hai percezione tellurica entro ${metri(60)}, se sei su una superficie di pietra o la tocchi (naturale o lavorata). ` +
    'Usi: quanto il tuo bonus di competenza; tornano con il riposo lungo.' },
};

// Discendenza gigantica: una risorsa sola, la regola dipende dal gigante scelto (SRD p. 85)
const GIGANTI: Record<string, string> = {
  'Salta-nuvole': `Azione bonus: ti teletrasporti fino a ${metri(30)} in uno spazio libero che vedi.`,
  'Fuoco bruciante': 'Quando colpisci un bersaglio con un tiro per colpire e gli fai danni, puoi aggiungere 1d10 danni da fuoco.',
  'Brivido gelante': `Quando colpisci un bersaglio con un tiro per colpire e gli fai danni, puoi aggiungere 1d6 danni da freddo e ridurre la sua velocità di ${metri(10)} fino all'inizio del tuo turno successivo.`,
  'Forza della collina': 'Quando colpisci una creatura di taglia Grande o inferiore con un tiro per colpire e le fai danni, puoi farla cadere prona.',
  'Resistenza della pietra': 'Quando subisci danni, con la reazione tiri 1d12, aggiungi la Costituzione e riduci i danni di quel totale.',
  'Tuono tempestoso': `Quando una creatura entro ${metri(60)} ti fa danni, con la reazione le infliggi 1d8 danni da tuono.`,
};

export function spiegaRisorsa(r: { id: string; nome: string; dettaglio?: string }): Spiegazione | null {
  if (PER_ID[r.id]) return PER_ID[r.id];
  if (r.id === 'giant-ancestry') {
    const g = Object.keys(GIGANTI).find((k) => r.nome.endsWith(k));
    return g ? { pagina: 85, testo: `${GIGANTI[g]} Usi: quanto il tuo bonus di competenza; tornano con il riposo lungo.` } : null;
  }
  // le risorse delle classi: la riga di «Cosa ottieni al livello 1» con lo stesso nome
  const base = r.nome.replace(/\s*\(.*\)$/, '');
  for (const righe of Object.values(PRIVILEGI_LIVELLO_1)) {
    const p = righe.find((x) => x.nome === base);
    if (p) return { testo: p.riga, pagina: p.pagina };
  }
  // elementi personalizzati: quello che ha scritto chi li ha inseriti
  return r.dettaglio ? { testo: r.dettaglio } : null;
}
