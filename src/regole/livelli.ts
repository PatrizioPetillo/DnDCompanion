// Aumento di livello (23/11): fin dove arrivano i dati delle classi. Si alza una tappa alla volta (sezione 12 ter del contesto).
export const LIVELLO_MASSIMO = 4;
// Punti ferita dal 2° livello (SRD p. 23): valore fisso, tiro del dado vita, o a scelta del giocatore. La decide il master nel tavolo.
export type RegolaPf = 'fisso' | 'tiro' | 'scelta';
export const NOME_REGOLA_PF: Record<RegolaPf, string> = { fisso: 'Valore fisso', tiro: 'Tiro del dado vita', scelta: 'A scelta del giocatore' };
