// Opzioni per le tendine (stile Character Keep): le non valide restano visibili ma spente, con il motivo.
import { LINGUE_RARE, LINGUE_STANDARD } from '../regole/dati/base';
import type { Id, Lignaggio } from '../regole/tipi';

export interface Opzione { id: Id; nome: string; disattivata: boolean; motivo?: string }

// Le 2 lingue dell'origine (p. 20): il Comune si conosce già; le rare solo con il permesso del master.
export function opzioniLingua(lingue: Id[], indice: number, giaConosciute: Id[] = []): { standard: Opzione[]; rare: Opzione[] } {
  const altra = lingue.filter((_, i) => i !== indice);
  const voce = ([id, nome]: [string, string]): Opzione => {
    const motivo = altra.includes(id) ? 'già scelta' : giaConosciute.includes(id) ? 'la conosci già' : undefined;
    return { id, nome, disattivata: !!motivo, ...(motivo ? { motivo } : {}) };
  };
  return { standard: Object.entries(LINGUE_STANDARD).map(voce), rare: Object.entries(LINGUE_RARE).map(voce) };
}

// Antenato del dragonide: «Drago rosso · fuoco» (il danno decide soffio e resistenza, p. 84)
export function etichettaLignaggio(o: Lignaggio): string {
  const danno = o.effetti.find((e) => e.tipo === 'resistenza');
  return danno && 'danno' in danno ? `${o.nome} · ${danno.danno}` : o.nome;
}
