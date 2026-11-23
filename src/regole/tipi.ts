// Tipi del modello dei dati (approvato il 17/11/2026, file del progetto «modello/schema.ts»).
// Aggiunte rispetto allo schema approvato, nate scrivendo il motore: Effetto 'bonusAbilita',
// 'cdSpeciale', 'cdCondizionale', 'formulaCA'; Oggetto/Armatura; equipaggiamento con le opzioni.

export type Car = 'FOR' | 'DES' | 'COS' | 'INT' | 'SAG' | 'CAR';
export const CARATTERISTICHE: Car[] = ['FOR', 'DES', 'COS', 'INT', 'SAG', 'CAR'];
export type Id = string;
export type Riposo = 'breve' | 'lungo';

export interface RifSRD { pagina: number }

export interface Elemento {
  id: Id;
  nome: string;
  nomeEn: string;
  srd?: RifSRD;
  personalizzato?: boolean;
}

// ───────────── Scelte ─────────────
export type TipoScelta =
  | 'abilita' | 'strumento' | 'talento' | 'caratteristica' | 'listaIncantesimi'
  | 'trucchetto' | 'incantesimo' | 'opzione' | 'maestriaArma' | 'maestria' | 'lingua';

export interface FiltroIncantesimi { lista: Id | { daScelta: Id }; livello: number }

export interface Scelta {
  id: Id;
  tipo: TipoScelta;
  quantita: number;
  opzioni?: Id[];
  filtro?: FiltroIncantesimi | { categoriaTalento: CategoriaTalento };
  srd: RifSRD;
}

// ───────────── Valori che si spiegano ─────────────
export type Valore =
  | number
  | { mod: Car; minimo?: number }
  | { competenza: true }
  | { perLivello: number }
  | { tabella: Id };

export interface Termine { etichetta: string; valore: number }
export interface Numero { totale: number; termini: Termine[] }

// ───────────── Effetti ─────────────
export type Effetto =
  | { tipo: 'competenza'; categoria: 'abilita' | 'ts' | 'armi' | 'armature' | 'strumento'; ids: Id[] }
  | { tipo: 'maestria'; abilita: { daScelta: Id } }
  | { tipo: 'scelta'; scelta: Scelta }
  | { tipo: 'talento'; talento: Id | { daScelta: Id }; parametri?: Record<Id, Id> }
  | { tipo: 'pfMassimi'; perLivello: number; etichetta: string }
  | { tipo: 'formulaCA'; formula: FormulaCA }
  | { tipo: 'bonusCA'; valore: number; condizione: 'conArmatura'; etichetta: string }
  | { tipo: 'iniziativa'; aggiungiCompetenza: true; etichetta: string }
  | { tipo: 'velocita'; valore: number }
  | { tipo: 'resistenza'; danno: Id }
  | { tipo: 'bonusAbilita'; abilita: Id[]; valore: Valore; etichetta: string }
  | { tipo: 'risorsa'; risorsa: Risorsa }
  | { tipo: 'cdSpeciale'; id: Id; nome: string; caratteristica: Car; srd: RifSRD }
  | { tipo: 'magia'; concessione: ConcessioneMagia }
  | { tipo: 'trucchettiExtra'; concessione: Id; quantita: number; etichetta: string }
  | { tipo: 'opzioni'; scelta: Scelta; effetti: Record<Id, Effetto[]> }   // Ordine divino, suppliche…
  | { tipo: 'valoreClasse'; id: Id; nome: string; valore: string; srd: RifSRD }  // 1d6, +2…
  | { tipo: 'lingua'; ids: Id[] }
  | { tipo: 'nota'; testo: string };

export interface FormulaCA {
  id: Id;
  nome: string;
  base: number;
  caratteristiche: Car[];
  richiede: 'nessunaArmatura' | 'nessunaArmaturaNoScudo';
  srd: RifSRD;
}

export interface Risorsa {
  id: Id;
  nome: string;
  usi: Valore;
  recupero: { riposo: Riposo; quanti: 'tutti' | number }[];
  dettaglio?: string;
  srd: RifSRD;
}

// ───────────── Magia ─────────────
export interface CambioIncantesimi { quando: 'riposoLungo' | 'livello'; quanti: 'tutti' | number; srd: RifSRD }

export interface ConcessioneMagia {
  id: Id;
  nome: string;                                   // etichetta della fonte: «Classe: Mago»
  fonte: { tipo: 'classe' | 'talento' | 'specie' | 'background'; id: Id };
  lista?: Id | { daScelta: Id };
  caratteristica: Car | { daScelta: Id };
  trucchetti?: { quantita: Valore; scelta?: Id };  // scelta = id della Scelta dei trucchetti
  trucchettiFissi?: Id[];
  incantesimiScelti?: { scelta: Id; soloRituali?: boolean };  // incantesimi di 1° scelti e sempre preparati (Iniziato; rituali del Patto del tomo)
  semprePreparati?: Id[];
  preparati?: { numero: Valore; da: 'lista' | 'libro' };
  lanciGratuiti?: { incantesimi: Id[] | 'scelti'; usi: Valore; recupero: Riposo };
  puoUsareSlot: boolean;
  slot?: 'normali' | 'patto';
  cambio?: CambioIncantesimi;
  cambioTrucchetti?: CambioIncantesimi;
  libro?: { iniziali: number };
  cdCondizionali?: { etichetta: string; bonus: number; srd: RifSRD }[];
  srd: RifSRD;
}

export interface Incantesimo extends Elemento {
  livello: number;
  scuola: string;
  liste: Id[];
  tempo: { tipo: 'azione' | 'azioneBonus' | 'reazione' | 'minuti' | 'ore'; testo: string };
  rituale: boolean;
  gittata: string;
  componenti: { V: boolean; S: boolean; M?: { testo: string; costoMo?: number; consumato: boolean } };
  durata: string;
  concentrazione: boolean;
  // Dall'SRD 5.2.1 in italiano (strumenti/aggiungi-italiano.py). Il testo completo è in incantesimi-testi.json.
  it?: { tempo: string; gittata: string; componenti: string; durata: string };
  tiro?: { tipo: 'attacco' } | { tipo: 'ts'; car: Car };
  danni?: string[];
}

// ───────────── Equipaggiamento ─────────────
export type CategoriaArmatura = 'leggera' | 'media' | 'pesante' | 'scudo';
export type TipoFocus = 'arcano' | 'druidico' | 'sacro' | 'strumentoMusicale' | 'componenti';
export type CategoriaOggetto = 'arma' | 'armatura' | 'focus' | 'dotazione' | 'strumento' | 'oggetto';
export interface Oggetto extends Elemento {
  armatura?: { categoria: CategoriaArmatura; base: number; maxDes?: number | null; forza?: number; svantaggioFurtivita?: boolean };
  costoMo?: number;                               // prezzo di 1 unità (le frecce si comprano a 20: 0,05 mo l'una)
  categoria?: CategoriaOggetto;                   // per il negozio
  arma?: Id;                                      // l'oggetto si usa come quest'arma (il bastone del focus è anche un bastone ferrato, p. 96)
  focus?: TipoFocus;                              // focus da incantatore (p. 96-97) o borsa per componenti
  contenuto?: { oggetto: Id; quantita: number }[]; // dotazioni (p. 95-98)
  daScelta?: Id;                                  // oggetto «a scelta»: diventa quello scelto in questa Scelta
  opzioni?: Id[];                                 // se la scelta si fa al passo Equipaggiamento (lo strumento del bardo)
}
export interface Pacchetto { oggetti: { oggetto: Id; quantita: number }[]; mo: number }

// ───────────── Classi, specie, background, talenti ─────────────
// Armi: semplici, da guerra, oppure solo le da guerra leggere (monaco) o accurate o leggere (ladro)
export type AddestramentoArmi = 'semplici' | 'marziali' | 'marzialiLeggere' | 'marzialiAccurateOLeggere';
export interface Feature extends Elemento { livello: number; effetti: Effetto[] }

export interface Classe extends Elemento {
  dadoVita: 6 | 8 | 10 | 12;
  tiriSalvezza: [Car, Car];
  abilita: Scelta;
  addestramentoArmature: CategoriaArmatura[];
  addestramentoArmi: AddestramentoArmi[];
  equipaggiamento: Record<string, Pacchetto>;     // 'A', 'B' (e 'C' per il guerriero)
  slot?: Record<number, number[]>;                // livello → slot per livello d'incantesimo [1°, 2°, …]
  patto?: Record<number, { numero: number; livello: number }>;
  features: Feature[];
}

export interface Lignaggio extends Elemento { effetti: Effetto[] }
export interface Specie extends Elemento {
  taglie: ('piccola' | 'media')[];
  velocita: number;
  tratti: Feature[];
  lignaggi?: { scelta: Id; opzioni: Lignaggio[]; srd: RifSRD };
  // Solo per le specie personalizzate (inserite dall'utente dal suo manuale, sezione 4):
  rimando?: string;
  descrizione?: string;
  modulo?: unknown;                                         // il modulo com'è stato compilato, per riaprirlo
}

export interface Background extends Elemento {
  caratteristiche: [Car, Car, Car];
  talento: { talento: Id; parametri?: Record<Id, Id> };   // talento vuoto ('') quando c'è talentoLibero
  // Solo per i background personalizzati (inseriti dall'utente dal suo manuale, sezione 4):
  talentoLibero?: { nome: string; nota: string };          // un talento che non è nell'SRD: nome e una riga, senza calcolo
  rimando?: string;                                         // «Manuale del Giocatore 2024, p. …»
  descrizione?: string;                                     // una riga scritta dall'utente
  abilita: [Id, Id];
  strumento: Id | Scelta;
  equipaggiamento: Record<'A' | 'B', Pacchetto>;
}

export type CategoriaTalento = 'origine' | 'generale' | 'stileCombattimento' | 'donoEpico';
export interface Talento extends Elemento {
  categoria: CategoriaTalento;
  prerequisito?: { livello?: number; feature?: Id };
  ripetibile: false | { condizione?: 'listaDiversa' };
  effetti: Effetto[];
}

// ───────────── Tavolo e personaggio ─────────────
// Eccezioni che il master concede in anticipo (scelta di Patrizio, 18/11): i loro avvisi risultano già accettati
// 'componenti-non-consumate' (23/11, regola della casa scelta da Patrizio): le componenti con costo che non si consumano non servono
export type EccezioneTavolo = 'lingue-rare' | 'allineamenti-malvagi' | 'talenti-fuori-srd' | 'componenti-non-consumate';
export type MetodoPunteggi = 'pointBuy27' | 'serieStandard' | 'tiri';
// Elementi personalizzati (dal manuale di chi li inserisce, sezione 4): viaggiano con il tavolo e con la scheda
export interface ElementiPersonalizzati { background: Record<Id, Background>; specie?: Record<Id, Specie> }

export interface Tavolo {
  schema: 1;
  nome: string;
  regole: 'srd-5.2';
  livello: 1;
  metodiPunteggi: MetodoPunteggi[];
  fonti: { srd: true; escludi?: Id[] };              // classi, specie, background dell'SRD non ammessi
  elementi?: ElementiPersonalizzati;                 // quelli del master: per il tavolo sono ammessi
  eccezioni?: EccezioneTavolo[];
  note?: string;
  // Tavolo collegato (23/11): id e chiave viaggiano nel link (i giocatori mandano la scheda cifrata);
  // il segreto per leggerle lo ha solo il master e non esce mai dal suo telefono
  canale?: { id: string; chiave: string; segreto?: string };
}

export interface Personaggio {
  schema: 1;
  idea?: string;
  nome: string;
  tavolo?: Tavolo;
  livello: 1;
  classe: Id;
  sottoclasse?: Id;
  specie: Id;
  background: Id;
  punteggi: { metodo: MetodoPunteggi; base: Record<Car, number> };
  bonusBackground: Partial<Record<Car, number>>;
  scelte: Record<Id, Id[]>;
  incantesimi: { libro?: Id[]; preparati: Record<Id, Id[]> };
  // extra = acquisti con le monete (p. 23); un oggetto fuori dal negozio ha id «personalizzato:…», nome e prezzo scritti a mano
  equipaggiamento: { classe: string; background: 'A' | 'B'; extra?: { oggetto: Id; quantita: number; nome?: string; costoMo?: number }[] };
  avvisiAccettati: Id[];
  allineamento?: Id;
  ruolo?: { aspetto?: string; trattoVisibile?: string; oggetto?: string; segreto?: string; storia?: string };   // storia: 19/11
  // Data in cui il giocatore ha salvato il personaggio (19/11): da lì le scelte della creazione restano bloccate
  conclusoIl?: string;
  // Cosa indossa e impugna (21/11). Senza scelta: l'armatura migliore che ha e lo scudo se ce l'ha.
  // attivi: incantesimi che cambiano la CA mentre durano (Armatura magica); finiscono con il riposo lungo.
  equip?: { armatura?: Id | 'nessuna'; scudo?: boolean; attivi?: Id[] };
  // Oggetti magici dati dal master (21/11): bonus solo se sintonizzati quando serve (massimo 3, SRD p. 102-103)
  oggettiMagici?: OggettoMagicoPosseduto[];
  // Monete ricevute (+) o spese (−) durante il gioco, anche dal bottino del master (21/11)
  movimenti?: MovimentoMonete[];
}

export interface OggettoMagicoPosseduto {
  uid: string;
  id: Id;                                   // un id di OGGETTI_MAGICI, oppure 'personalizzato'
  variante?: string;                        // '+1', 'hill', 'greater'…
  base?: Id;                                // l'arma (ARMI) o l'armatura (oggetti) per gli oggetti «a scelta»
  sintonizzato?: boolean;
  cariche?: number;                         // cariche rimaste
  caricheNote?: boolean;
  ultimoTiro?: number;                      // il d20 tirato spendendo l'ultima carica (bacchetta di dardi incantati), 22/11                    // le rimaste si sanno con Identificare o con la sintonia (SRD p. 206)
  quantita?: number;                        // pozioni, pergamene, munizioni
  nota?: string;                            // per la pergamena: quale incantesimo; o altro
  // Oggetto di un altro manuale o dell'SRD non in elenco: nome e bonus li scrive il giocatore
  personalizzato?: { nome: string; sintonia: boolean; riga?: string; descrizione?: string; cariche?: number; bonus: BonusMagici };
  // Oggetto del master da identificare (21/11): finché è velato non dà bonus e cosa fa resta cifrato
  velato?: Velo;
  aspetto?: string;                         // come appare: resta anche dopo l'identificazione
  identificatoIl?: string;                  // ISO
}
export interface MovimentoMonete { id: string; mo: number; nota?: string; il: string }
export interface BonusMagici { ca?: number; ts?: number; attaccoIncantesimi?: number; cdIncantesimi?: number }
// Cosa viaggia cifrato nel link dell'oggetto: diventa «personalizzato» quando il master sblocca
export interface OggettoSvelato { nome: string; sintonia: boolean; riga?: string; descrizione?: string; cariche?: number; bonus: BonusMagici }
export interface Velo { sblocco: string; apparente: string; aspetto?: string; tavolo?: string; iv: string; cifrato: string }

// ───────────── Risultato del motore ─────────────
export type LivelloAvviso = 'errore' | 'attenzione' | 'info';
export interface Avviso { id: Id; livello: LivelloAvviso; messaggio: string; srd?: RifSRD; accettato?: boolean }

export interface MagiaCalcolata {
  id: Id;
  nome: string;
  caratteristica: Car | null;
  cd: Numero | null;
  attacco: Numero | null;
  cdCondizionali: { etichetta: string; totale: number }[];
  trucchetti: { attesi: number; scelti: Id[]; fissi?: Id[] };   // fissi: quelli dati, non scelti (già dentro scelti)
  semprePreparati: Id[];
  preparati: { limite: number; scelti: Id[] } | null;
  lanciGratuiti: { incantesimi: Id[]; usi: number; recupero: Riposo } | null;
  slot: 'normali' | 'patto' | 'qualsiasi' | null;
  cambio?: CambioIncantesimi;
  cambioTrucchetti?: CambioIncantesimi;
  // Per la schermata della magia: da dove si sceglie e dove si salva
  fonte: ConcessioneMagia['fonte'];
  lista: Id | null;
  scelte: { trucchetti?: Id; incantesimi?: Id; caratteristica?: Id };   // id delle Scelte (in Personaggio.scelte)
  libro: { iniziali: number; scelti: Id[] } | null;
  preparatiDa: 'lista' | 'libro' | null;
  livelloMax: number;                               // livello più alto lanciabile (1 al livello 1)
  incantesimiQuanti: number;                        // quanti incantesimi di 1° si scelgono (Iniziato 1, Patto del tomo 2)
  soloRituali: boolean;
}

export interface Attacco {
  id: Id;                                         // id dell'arma, 'unarmed-strike' per il colpo senz'armi
  nome: string;
  quantita: number;
  caratteristica: Car;
  competente: boolean;
  colpire: Numero;
  danni: { dadi: string; dadiDueMani?: string; mod: number; tipo: string; testo: string; testoDueMani?: string };
  padronanza: string | null;                      // solo se l'arma è tra quelle scelte con Padronanza d'armi
  gittata?: [number, number];                     // in piedi; l'interfaccia mostra i metri
  proprieta: string[];
  note: string[];
}

export interface VoceInventario {
  oggetto: Id;
  nome: string;
  quantita: number;
  fonti: string[];                                // «Classe (A)», «Background (A)», «Acquisto»
  contenuto?: { nome: string; quantita: number }[];
}

export interface Scheda {
  punteggi: Record<Car, Numero>;
  modificatori: Record<Car, number>;
  competenza: number;
  pf: Numero;
  iniziativa: Numero;
  // migliore: la CA più alta possibile; attuale: quella con ciò che indossa e gli incantesimi attivi (21/11)
  ca: { formule: { id: Id; nome: string; valore: Numero; incantesimo?: boolean }[]; migliore: Id; attuale: Id; indossata: Id | null; scudo: boolean };
  tiriSalvezza: Record<Car, { totale: number; competente: boolean }>;
  abilita: Record<Id, { totale: number; competente: boolean; maestria: boolean; fonti: string[]; svantaggio?: string }>;
  percezionePassiva: number;
  velocita: number;
  resistenze: Id[];
  talenti: Id[];
  magia: MagiaCalcolata[];
  cdSpeciali: { id: Id; nome: string; cd: Numero }[];
  slot: { normali: number[]; patto: { numero: number; livello: number } | null };
  risorse: { id: Id; nome: string; usi: number; recupero: Risorsa['recupero']; dettaglio?: string }[];
  valoriClasse: Record<Id, string>;
  lingue: Id[];
  attacchi: Attacco[];
  addestramentoArmi: string[];                    // semplici, marziali… (classe + capacità): per il negozio
  addestramentoArmature: string[];                // leggera, media, pesante, scudo (classe + capacità)
  strumenti: Id[];                                // competenze negli strumenti (background, classe, scelte)
  inventario: VoceInventario[];
  monete: Numero;                                 // monete d'oro: classe + background − acquisti
  avvisi: Avviso[];
}
