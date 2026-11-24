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
  // 24/11 (segnalazione di Patrizio su Scarica di adrenalina): le risorse che avevano solo la nota breve, verificate sull'SRD 5.2
  'adrenaline-rush': { pagina: 86, testo: 'Puoi fare l\'azione Scatto come Azione bonus. Quando lo fai ottieni PF temporanei pari al tuo bonus di competenza. Usi: quanto il tuo bonus di competenza; tornano tutti con il riposo breve o lungo.' },
  'relentless-endurance': { pagina: 86, testo: 'Quando scendi a 0 PF ma non muori sul colpo, puoi restare a 1 PF. Una volta per riposo lungo.' },
  'channel-divinity': { pagina: 37, testo:
    'Ogni uso crea uno di questi effetti (CD = la CD dei tuoi incantesimi da chierico). ' +
    `Scintilla divina: azione Magia, punti il simbolo sacro verso una creatura entro ${metri(30)}, tiri 1d8 + Saggezza e scegli: le fai recuperare quei PF, oppure fa un tiro salvezza su Costituzione e subisce quei danni necrotici o radiosi (la metà se lo supera). ` +
    `Scacciare non morti: azione Magia, i non morti che scegli entro ${metri(30)} fanno un tiro salvezza su Saggezza; chi fallisce è spaventato e incapacitato per 1 minuto e si allontana da te (finisce se subisce danni). ` +
    'Dal 5° livello (Bruciare i non morti): quando scacci, chi fallisce subisce anche danni radiosi, tanti d8 quanto il tuo modificatore di Saggezza (almeno 1d8). ' +
    'Il Dominio della vita aggiunge Preservare la vita (SRD p. 40). Usi: 2; uno torna con il riposo breve, tutti con il riposo lungo.' },
  'paladin-channel-divinity': { pagina: 54, testo:
    `Ogni uso crea uno di questi effetti. Senso divino: Azione bonus, per 10 minuti sai dove sono celestiali, immondi e non morti entro ${metri(60)}, e i luoghi consacrati o dissacrati. ` +
    'Il Giuramento di devozione aggiunge Arma consacrata (SRD p. 56): quando fai l\'azione Attacco, per 10 minuti un\'arma da mischia che impugni aggiunge il tuo Carisma ai tiri per colpire (almeno +1), può fare danni radiosi e fa luce. ' +
    'Usi: 2; uno torna con il riposo breve, tutti con il riposo lungo.' },
  'wild-shape': { pagina: 42, testo:
    'Azione bonus: ti trasformi in una bestia tra le forme che conosci (4 al 2° livello, GS fino a 1/4, senza volo; 6 dal 4°, GS fino a 1/2). ' +
    'Resti trasformato per un numero di ore pari a metà del tuo livello da druido, o finché non la usi di nuovo, sei incapacitato o muori; puoi uscirne con un\'Azione bonus. ' +
    'Quando ti trasformi ottieni PF temporanei pari al tuo livello da druido; usi le statistiche della bestia, ma tieni i tuoi PF, Intelligenza, Saggezza e Carisma. ' +
    'Usi: 2; uno torna con il riposo breve, tutti con il riposo lungo.' },
  'action-surge': { pagina: 48, testo: 'Nel tuo turno puoi fare un\'azione in più, tranne l\'azione Magia. Una volta, poi torna con il riposo breve o lungo.' },
  focus: { pagina: 50, testo:
    'Spendi i punti per: Raffica di colpi (1 punto: due colpi senz\'armi come Azione bonus); Difesa paziente (Disimpegno come Azione bonus gratis, o con 1 punto Disimpegno e Schivata); ' +
    'Passo del vento (Scatto come Azione bonus gratis, o con 1 punto Disimpegno e Scatto e salto raddoppiato). Dal 5° livello Colpo stordente (1 punto, una volta per turno quando colpisci: tiro salvezza su Costituzione, se fallisce è stordito fino all\'inizio del tuo turno, se riesce velocità dimezzata e il prossimo attacco contro di lui ha vantaggio; SRD p. 51). ' +
    'La CD è 8 + Saggezza + competenza. Tornano tutti con il riposo breve o lungo.' },
  'uncanny-metabolism': { pagina: 51, testo: 'Quando tiri l\'iniziativa puoi recuperare tutti i punti concentrazione spesi; se lo fai, tiri il dado delle Arti marziali e recuperi PF pari al risultato + il tuo livello da monaco. Una volta per riposo lungo.' },
  'sorcery-points': { pagina: 66, testo:
    'Senza azione, spendi uno slot e ottieni punti pari al suo livello. Con un\'Azione bonus trasformi i punti in uno slot: di 1° per 2 punti (dal 2° livello), di 2° per 3 (dal 3°), di 3° per 5 (dal 5°); lo slot creato sparisce con il riposo lungo. ' +
    'I punti pagano anche la Metamagia. Tornano tutti con il riposo lungo.' },
  'magical-cunning': { pagina: 72, testo: 'Con un rito di 1 minuto recuperi slot del patto spesi, al massimo la metà dei tuoi slot (per eccesso). Una volta per riposo lungo.' },
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
