// Esportazione della scheda, dal menu (spostata lì dal fondo del Riepilogo il 19/11, richiesta di Patrizio).
import { esportaJSON, nomeFile } from '../creazione/riepilogo';
import { creaLink } from '../esporta/link';   // già nel pezzo principale (lo usano App e Tavoli): import normale
import type { Bozza } from '../creazione/percorso';
import type { Elementi } from '../creazione/personalizzati';

// Il motivo di un errore, in parole: un pezzo dell'app che non si scarica di solito vuol dire che è uscita
// una versione nuova mentre l'app era aperta (23/11)
function motivo(e: unknown): string {
  const t = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  if (/dynamically imported module|Importing a module script failed|error loading dynamically|ChunkLoadError/i.test(t))
    return "c'è una versione nuova dell'app: chiudila del tutto, riaprila e riprova.";
  return t.slice(0, 160);
}

function scarica(dati: BlobPart, tipo: string, nome: string) {
  const url = URL.createObjectURL(new Blob([dati], { type: tipo }));
  const a = document.createElement('a');
  a.href = url; a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Il PDF è la scheda come la si vede nell'app; pdf-lib si carica solo adesso
export async function scaricaPdf(bozza: Bozza, ritratto?: string): Promise<string | null> {
  try {
    const { pdfDellaScheda } = await import('../esporta/prepara-pdf');
    scarica(await pdfDellaScheda(bozza, ritratto) as BlobPart, 'application/pdf', nomeFile(bozza).replace(/\.json$/, '.pdf'));
    return null;
  } catch (e) { console.error('PDF', e); return `Non sono riuscito a creare il PDF. Motivo: ${motivo(e)}`; }
}

// Il link contiene tutta la scheda: chi lo apre la vede, senza toccare il suo personaggio
export async function mandaLink(bozza: Bozza, elementi?: Elementi, canale?: string): Promise<string | null> {
  const url = await creaLink(bozza, location.href, elementi, canale);
  try {
    if (navigator.share) { await navigator.share({ title: bozza.nome || 'Scheda', url }); return null; }
    await navigator.clipboard.writeText(url);
    return 'Link copiato: incollalo nel messaggio al master.';
  } catch { return null; }   // condivisione annullata
}

export function scaricaCopia(bozza: Bozza, ritratto?: string, elementi?: Elementi) {
  scarica(esportaJSON(bozza, ritratto, elementi), 'application/json', nomeFile(bozza));
}

// Per Foundry VTT (22/11): file JSON da importare con «Import Data». I dati del sistema D&D5e si caricano solo adesso.
export async function scaricaFoundry(bozza: Bozza): Promise<string> {
  try {
    const { fileFoundry } = await import('../esporta/foundry');
    const { nome, testo, avvisi } = await fileFoundry(bozza);
    scarica(testo, 'application/json', nome);
    // 23/11, scelta di Patrizio (strada 3): la prova su un Foundry vero non c'è stata, e lo si dice
    const base = 'In Foundry (sistema D&D5e 6.x): crea un personaggio vuoto, tasto destro su di lui nella barra degli attori, «Import Data», scegli questo file. ' +
      'Esportazione non ancora provata su un Foundry vero: dopo l\'importazione controlla caratteristiche, PF, CA, competenze e incantesimi con la scheda dell\'app.';
    return avvisi.length ? `${base} Attenzione: ${avvisi.length} elementi non sono dell'SRD e sono arrivati come semplici oggetti, controllali.` : base;
  } catch (e) {
    // 23/11: il motivo vero, per capire cosa non va (prima si leggeva solo «Riprova»)
    console.error('Foundry', e);
    return `Non sono riuscito a creare il file per Foundry. Motivo: ${motivo(e)}`;
  }
}
