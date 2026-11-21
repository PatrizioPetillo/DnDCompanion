// Testi delle schede di classe (passo 2). Scritti per l'app, non copiati da manuali.
// «Caratteristiche principali» e dado vita vengono dall'SRD 5.2 (tabelle «Core … Traits», pagina accanto).
// La difficoltà per chi inizia è un giudizio: DA APPROVARE da Patrizio.
export type Difficolta = 'facile' | 'media' | 'impegnativa';

export const SCHEDE_CLASSE: Record<string, { alTavolo: string; principali: string; difficolta: Difficolta; pagina: number }> = {
  barbarian: { alTavolo: 'Sta in prima linea e picchia forte. Con l\'Ira resiste ai colpi delle armi.', principali: 'Forza', difficolta: 'facile', pagina: 28 },
  bard: { alTavolo: 'Incantatore che sostiene il gruppo: ispira, cura e parla per tutti.', principali: 'Carisma', difficolta: 'media', pagina: 31 },
  cleric: { alTavolo: 'Incantatore divino: cura e protegge, e regge anche il corpo a corpo.', principali: 'Saggezza', difficolta: 'media', pagina: 36 },
  druid: { alTavolo: 'Incantatore della natura. Dal livello 2 si trasforma in animale.', principali: 'Saggezza', difficolta: 'impegnativa', pagina: 41 },
  fighter: { alTavolo: 'Esperto di armi e armature. Semplice da giocare, solido in ogni situazione.', principali: 'Forza o Destrezza', difficolta: 'facile', pagina: 47 },
  monk: { alTavolo: 'Combatte senza armatura, veloce e agile, anche a mani nude.', principali: 'Destrezza e Saggezza', difficolta: 'media', pagina: 49 },
  paladin: { alTavolo: 'Guerriero sacro in armatura pesante. Cura con le mani e lancia incantesimi divini.', principali: 'Forza e Carisma', difficolta: 'facile', pagina: 53 },
  ranger: { alTavolo: 'Esploratore e arciere. Segue le tracce e marchia la preda con la magia.', principali: 'Destrezza e Saggezza', difficolta: 'media', pagina: 57 },
  rogue: { alTavolo: 'Furtivo e preciso: colpisce dove fa più male. Esperto di serrature e trappole.', principali: 'Destrezza', difficolta: 'facile', pagina: 61 },
  sorcerer: { alTavolo: 'La magia ce l\'ha nel sangue: pochi incantesimi, lanciati con potenza.', principali: 'Carisma', difficolta: 'media', pagina: 64 },
  warlock: { alTavolo: 'Ha un patto con un\'entità potente. Pochi slot, che tornano con il riposo breve.', principali: 'Carisma', difficolta: 'impegnativa', pagina: 70 },
  wizard: { alTavolo: 'Studia la magia sui libri: un incantesimo per ogni problema, ma fragile in combattimento.', principali: 'Intelligenza', difficolta: 'impegnativa', pagina: 77 },
};

// Nomi degli strumenti dei background (p. 83) e dei giochi (p. 94). Nomi italiani da verificare con il manuale.
export const NOMI_STRUMENTI: Record<string, string> = {
  'calligraphers-supplies': 'Scorte da calligrafo',
  'thieves-tools': 'Arnesi da scasso',
  dice: 'Dadi',
  dragonchess: 'Scacchi dei draghi',
  'playing-cards': 'Carte da gioco',
  'three-dragon-ante': 'Tre draghi al buio',
};

// Nomi leggibili delle scelte tolte quando si cambia classe o background (i test usano gli id interni).
const PARTI: Record<string, string> = {
  abilita: 'le abilità della classe', trucchetti: 'i trucchetti', incantesimo1: 'l\'incantesimo di 1°',
  caratteristica: 'la caratteristica da incantatore', gioco: 'il gioco', strumenti: 'gli strumenti', strumento: 'lo strumento',
  'maestria-armi': 'la padronanza delle armi', maestria: 'la maestria', lingua: 'la lingua', stile: 'lo stile di combattimento',
  'ordine-divino': 'l\'ordine divino', versatile: 'il talento di Versatile', abile: 'l\'abilità di Pluriabilità', competenze: 'le 3 abilità',
  'sensi-acuti': 'l\'abilità di Sensi acuti', lignaggio: 'la stirpe', eredita: 'l\'eredità', antenato: 'l\'antenato', 'ordine-primordiale': 'l\'ordine primordiale', suppliche: 'la supplica occulta',
};
export function descriviTolte(tolte: string[], nomi: Record<string, string>): string {
  return tolte.map((t) => {
    const [chi, parte] = t.split('.');
    if (!parte) return t.replace(/\(.*\)/, '').trim();
    const cosa = PARTI[parte] ?? parte;
    return chi === 'magic-initiate' ? `${cosa} di Iniziato alla magia` : nomi[chi] ? `${cosa} (${nomi[chi]})` : cosa;
  }).join(', ');
}
