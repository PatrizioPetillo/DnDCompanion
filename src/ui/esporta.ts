// Esportazione della scheda, dal menu (spostata lì dal fondo del Riepilogo il 19/11, richiesta di Patrizio).
import { esportaJSON, nomeFile } from '../creazione/riepilogo';
import { creaLink } from '../esporta/link';   // già nel pezzo principale (lo usano App e Tavoli): import normale
import type { Bozza } from '../creazione/percorso';
import type { Elementi } from '../creazione/personalizzati';

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
  } catch { return 'Non sono riuscito a creare il PDF. Riprova.'; }
}

// Il link contiene tutta la scheda: chi lo apre la vede, senza toccare il suo personaggio
export async function mandaLink(bozza: Bozza, elementi?: Elementi): Promise<string | null> {
  const url = await creaLink(bozza, location.href, elementi);
  try {
    if (navigator.share) { await navigator.share({ title: bozza.nome || 'Scheda', url }); return null; }
    await navigator.clipboard.writeText(url);
    return 'Link copiato: incollalo nel messaggio al master.';
  } catch { return null; }   // condivisione annullata
}

export function scaricaCopia(bozza: Bozza, ritratto?: string, elementi?: Elementi) {
  scarica(esportaJSON(bozza, ritratto, elementi), 'application/json', nomeFile(bozza));
}
