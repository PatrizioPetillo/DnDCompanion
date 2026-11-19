// Le guide della Home (richieste di Patrizio, 19/11): la magia, il combattimento con i tiri, le condizioni con i riposi.
// Testi scritti da noi, in parole semplici, dalle regole dell'SRD 5.2; accanto a ogni capitolo la pagina.
// Pagine verificate il 19/11 sul file dell'SRD (il numero prima del testo è l'intestazione della pagina).

export interface Capitolo {
  id: string;
  titolo: string;
  righe: string[];
  esempio?: string;
  pagina: string;          // «SRD p. 104»
}

export interface Guida {
  id: 'magia' | 'combattimento' | 'condizioni';
  titolo: string;
  sottotitolo: string;
  sezioni: { titolo?: string; capitoli: Capitolo[] }[];
}

export const GUIDA_MAGIA: Guida = {
  id: 'magia',
  titolo: 'Guida alla magia',
  sottotitolo: 'Slot, preparati, CD, concentrazione: cosa sono e come si usano.',
  sezioni: [{
    capitoli: [
      {
        id: 'trucchetti', titolo: 'Trucchetti e incantesimi', pagina: 'SRD p. 104',
        righe: [
          'Ogni incantesimo ha un livello da 0 a 9. Quelli di livello 0 sono i trucchetti.',
          'I trucchetti si lanciano senza slot, quante volte vuoi.',
          'Gli incantesimi dal 1° livello in su consumano uno slot.',
        ],
      },
      {
        id: 'slot', titolo: 'Gli slot', pagina: 'SRD p. 104',
        righe: [
          'Uno slot è la «carica» che spendi per lanciare un incantesimo di 1° livello o più. Ogni classe ne ha un certo numero per livello.',
          'Per lanciare un incantesimo spendi uno slot del suo livello o di un livello più alto.',
          'Gli slot spesi tornano tutti con un riposo lungo.',
        ],
        esempio: 'Travis ha 2 slot di 1°. Lancia Scudo: ne spende uno e gliene resta uno fino al prossimo riposo lungo.',
      },
      {
        id: 'slot-alto', titolo: 'Lanciare con uno slot più alto', pagina: 'SRD p. 104-105',
        righe: [
          'Se usi uno slot più alto, l\'incantesimo diventa di quel livello per quel lancio.',
          'Alcuni incantesimi diventano più forti: lo dice la loro scheda, alla voce «con uno slot superiore».',
        ],
      },
      {
        id: 'preparati', titolo: 'Preparati e libro del mago', pagina: 'SRD p. 78, 104',
        righe: [
          'Puoi lanciare solo gli incantesimi che hai preparato. La tua classe dice quanti.',
          'Gli incantesimi «sempre preparati» (da talenti, specie o capacità) non contano in quel numero.',
          'Il mago ha un libro: al livello 1 contiene 6 incantesimi di 1° e ne prepara 4.',
          'Il libro non dipende dall\'Intelligenza: il modificatore conta solo per la CD e l\'attacco.',
        ],
      },
      {
        id: 'cambio', titolo: 'Quando si cambiano i preparati', pagina: 'SRD p. 104',
        righe: [
          'Mago, chierico e druido: tutti, dopo un riposo lungo.',
          'Paladino e ranger: uno, dopo un riposo lungo.',
          'Bardo, stregone e warlock: uno, solo quando salgono di livello.',
        ],
      },
      {
        id: 'un-slot', titolo: 'Un solo slot per turno', pagina: 'SRD p. 105',
        righe: [
          'In un turno puoi spendere un solo slot.',
          'Quindi non puoi lanciare un incantesimo con uno slot come azione e un altro con uno slot come azione bonus nello stesso turno.',
          'I trucchetti non consumano slot: quelli si possono aggiungere.',
        ],
      },
      {
        id: 'cd', titolo: 'CD e attacco', pagina: 'SRD p. 106',
        righe: [
          'CD = 8 + bonus di competenza + modificatore della caratteristica da incantatore. È il numero che il bersaglio deve raggiungere con il suo tiro salvezza.',
          'Attacco = bonus di competenza + modificatore della caratteristica. Lo aggiungi al d20 quando l\'incantesimo chiede un tiro per colpire.',
          'Nella scheda tocca il numero per vedere la somma.',
        ],
        esempio: 'Travis: CD 8 + 2 + 3 (Intelligenza) = 13; attacco 2 + 3 = +5.',
      },
      {
        id: 'concentrazione', titolo: 'Concentrazione', pagina: 'SRD p. 179',
        righe: [
          'Alcuni incantesimi durano solo finché ti concentri. Puoi tenerne attivo uno alla volta.',
          'Finisce se lanci un altro incantesimo a concentrazione, se diventi incapacitato o muori.',
          'Se subisci danni fai un tiro salvezza su Costituzione: CD 10, oppure metà dei danni se è di più (massimo 30).',
          'Puoi interromperla quando vuoi, senza usare azioni.',
        ],
      },
      {
        id: 'rituali', titolo: 'Rituali', pagina: 'SRD p. 78, 104',
        righe: [
          'Un incantesimo con l\'etichetta «rituale» si può lanciare come rituale: ci mette 10 minuti in più ma non consuma slot.',
          'Devi averlo preparato. Eccezione: il mago lo lancia leggendo dal libro anche se non è preparato (Adepto dei rituali).',
        ],
      },
      {
        id: 'componenti', titolo: 'Componenti V, S, M', pagina: 'SRD p. 105-106',
        righe: [
          'V: parole da pronunciare (impossibile se sei imbavagliato o nel silenzio magico). S: gesti con almeno una mano. M: un materiale.',
          'La borsa per componenti, o il focus della tua classe, sostituisce i materiali senza costo e che non si consumano.',
          'I materiali con un costo vanno comprati, e alcuni si consumano lanciando: li trovi nello zaino.',
          'Senza una componente l\'incantesimo non si può lanciare.',
        ],
      },
      {
        id: 'senza-slot', titolo: 'Lanciare senza slot', pagina: 'SRD p. 87, 104',
        righe: [
          'Oltre ai trucchetti e ai rituali, alcuni talenti e specie danno un lancio gratuito.',
          'Esempio: Iniziato alla magia dà un incantesimo di 1° sempre preparato, gratis una volta per riposo lungo, e lanciabile anche con gli slot.',
          'Anche le pergamene e alcuni oggetti magici lanciano senza slot.',
        ],
      },
      {
        id: 'patto', titolo: 'Il warlock e gli slot del patto', pagina: 'SRD p. 71',
        righe: [
          'Il warlock ha pochi slot, tutti dello stesso livello.',
          'Tornano con un riposo breve, non solo con quello lungo.',
        ],
      },
    ],
  }],
};

export const GUIDA_COMBATTIMENTO: Guida = {
  id: 'combattimento',
  titolo: 'Combattimento e tiri',
  sottotitolo: 'Cosa puoi fare nel tuo turno, come si tira il d20, cosa succede a 0 PF.',
  sezioni: [
    {
      titolo: 'I tiri del d20',
      capitoli: [
        {
          id: 'tiro', titolo: 'Come funziona un tiro', pagina: 'SRD p. 6',
          righe: [
            'Prove di caratteristica, tiri salvezza e tiri per colpire funzionano allo stesso modo.',
            'Tiri 1d20 e aggiungi il modificatore della caratteristica, più il bonus di competenza se sei competente (in quell\'abilità, tiro salvezza o arma).',
            'Se raggiungi il numero da battere ce la fai: la CD per prove e tiri salvezza, la CA per i tiri per colpire.',
          ],
        },
        {
          id: 'colpire', titolo: 'Tiri per colpire, 20 e 1', pagina: 'SRD p. 7',
          righe: [
            'In mischia usi la Forza, a distanza la Destrezza; con le armi accurate scegli la migliore. Gli incantesimi usano la caratteristica da incantatore.',
            'Un 20 sul dado colpisce sempre ed è un colpo critico.',
            'Un 1 sul dado manca sempre.',
          ],
        },
        {
          id: 'vantaggio', titolo: 'Vantaggio e svantaggio', pagina: 'SRD p. 7-8',
          righe: [
            'Con vantaggio tiri due d20 e tieni il più alto; con svantaggio tieni il più basso.',
            'Non si sommano: anche con tre motivi di vantaggio tiri solo due dadi.',
            'Se hai sia vantaggio sia svantaggio si annullano, qualunque sia il numero di motivi: tiri un solo d20.',
          ],
        },
        {
          id: 'ispirazione', titolo: 'Ispirazione eroica', pagina: 'SRD p. 8',
          righe: [
            'Te la dà il master (di solito per una bella giocata) o una regola: l\'umano ce l\'ha ogni giorno.',
            'Spendila subito dopo un tiro per ritirare un dado qualsiasi: devi tenere il nuovo risultato.',
            'Ne puoi avere solo una. Se ne ricevi un\'altra puoi darla a un compagno che non ce l\'ha.',
          ],
        },
      ],
    },
    {
      titolo: 'Il tuo turno',
      capitoli: [
        {
          id: 'iniziativa', titolo: 'Iniziativa e round', pagina: 'SRD p. 13',
          righe: [
            'All\'inizio tutti tirano l\'iniziativa: una prova di Destrezza. Si agisce dal punteggio più alto al più basso, sempre nello stesso ordine.',
            'Un round dura circa 6 secondi: ognuno fa il suo turno.',
            'Chi è sorpreso tira l\'iniziativa con svantaggio.',
          ],
        },
        {
          id: 'turno', titolo: 'Cosa fai nel tuo turno', pagina: 'SRD p. 13-14',
          righe: [
            'Ti muovi fino alla tua velocità e fai un\'azione, nell\'ordine che vuoi. Puoi anche dividere il movimento: un po\' prima e un po\' dopo l\'azione.',
            'Se una capacità o un incantesimo te lo permette, anche un\'azione bonus.',
            'Parlare brevemente e fare gesti è gratis. Puoi usare un oggetto gratis (aprire una porta, estrarre un\'arma); per un secondo oggetto serve l\'azione Utilizzo.',
            'Buttarti a terra (prono) è gratis.',
          ],
        },
        {
          id: 'azioni', titolo: 'Le azioni', pagina: 'SRD p. 9-10',
          righe: [
            'Attacco: con un\'arma o un colpo senz\'armi.',
            'Magia: lanci un incantesimo, usi un oggetto o una capacità magica.',
            'Scatto: per il resto del turno ti muovi del doppio.',
            'Disimpegno: il tuo movimento non provoca attacchi di opportunità.',
            'Schivata: fino al tuo prossimo turno chi ti attacca ha svantaggio e hai vantaggio ai tiri salvezza su Destrezza.',
            'Aiuto: dai vantaggio a un alleato nella prossima prova o nel prossimo attacco, oppure presti soccorso.',
            'Nascondersi: prova di Destrezza (Furtività).',
            'Influenza: prova di Carisma o di Saggezza (Addestrare animali) per cambiare l\'atteggiamento di una creatura.',
            'Ricerca: prova di Saggezza (Intuizione, Medicina, Percezione, Sopravvivenza). Studio: prova di Intelligenza (Arcano, Storia, Indagare, Natura, Religione).',
            'Prepararsi: decidi un\'azione e cosa la fa scattare; la fai con la reazione prima del tuo prossimo turno.',
            'Utilizzo: usi un oggetto non magico.',
            'Puoi anche inventare: il master dice se si può fare e che tiro serve.',
          ],
        },
        {
          id: 'bonus-reazione', titolo: 'Azione bonus e reazione', pagina: 'SRD p. 10',
          righe: [
            'Azione bonus: solo se una capacità, un incantesimo o una regola la prevede. Una per turno.',
            'Reazione: una risposta immediata a qualcosa che succede, anche nel turno di un altro. Dopo averla usata non ne hai un\'altra fino all\'inizio del tuo turno.',
          ],
          esempio: 'Travis lancia Scudo come reazione quando un nemico lo colpisce.',
        },
        {
          id: 'opportunita', titolo: 'Attacco di opportunità', pagina: 'SRD p. 15',
          righe: [
            'Quando una creatura che vedi esce dalla tua portata, puoi usare la reazione per un attacco in mischia contro di lei, appena prima che esca.',
            'Vale anche per te: se ti allontani da un nemico, lui può attaccarti. Per evitarlo usa l\'azione Disimpegno.',
            'Non lo provochi se ti teletrasporti o se qualcosa ti sposta senza che usi il tuo movimento.',
          ],
        },
        {
          id: 'critico', titolo: 'Colpo critico', pagina: 'SRD p. 16',
          righe: [
            'Tiri due volte tutti i dadi di danno dell\'attacco e li sommi, poi aggiungi il modificatore una volta sola.',
            'Vale anche per i dadi extra, come l\'Attacco furtivo del ladro.',
          ],
          esempio: 'Pugnale: 2d4 invece di 1d4, + il modificatore.',
        },
        {
          id: 'nascondersi', titolo: 'Nascondersi', pagina: 'SRD p. 183',
          righe: [
            'Serve una prova di Destrezza (Furtività) con CD 15, mentre sei pesantemente oscurato o dietro tre quarti di copertura o copertura totale, e fuori dalla vista dei nemici.',
            'Se riesci sei invisibile finché resti nascosto; il tuo risultato è la CD per trovarti.',
            'Smetti di essere nascosto se fai rumore, se ti trovano, se attacchi o se lanci un incantesimo con componente verbale.',
          ],
        },
      ],
    },
    {
      titolo: 'A 0 punti ferita',
      capitoli: [
        {
          id: 'zero', titolo: 'Cadere a 0 PF', pagina: 'SRD p. 17',
          righe: [
            'A 0 PF cadi privo di sensi, finché non recuperi almeno 1 PF.',
            'Danno massiccio: se il danno che avanza oltre lo 0 è pari o superiore ai tuoi PF massimi, muori subito.',
          ],
          esempio: 'PF massimi 7, ne hai 3 e subisci 10 danni: arrivi a 0 e ne avanzano 7, quindi muori.',
        },
        {
          id: 'morte', titolo: 'Tiri salvezza contro la morte', pagina: 'SRD p. 17-18',
          righe: [
            'All\'inizio di ogni tuo turno a 0 PF tiri 1d20, senza modificatori: 10 o più è un successo, sotto 10 un fallimento.',
            'Con 3 successi diventi stabile; con 3 fallimenti muori. Non serve che siano di fila.',
            'Un 1 conta come due fallimenti; un 20 ti riporta a 1 PF.',
            'Se subisci danni a 0 PF è un fallimento (due se è un colpo critico).',
            'Qualsiasi cura azzera il conto. Nella scheda trovi i pallini per segnarli.',
          ],
        },
        {
          id: 'stabile', titolo: 'Stabilizzare un compagno', pagina: 'SRD p. 18',
          righe: [
            'Con l\'azione Aiuto e una prova di Saggezza (Medicina) con CD 10 stabilizzi una creatura a 0 PF.',
            'Stabile: non tira più contro la morte ma resta priva di sensi. Se subisce danni ricomincia a tirare.',
            'Senza cure, una creatura stabile torna a 1 PF dopo 1d4 ore.',
          ],
        },
      ],
    },
  ],
};

export const GUIDA_CONDIZIONI: Guida = {
  id: 'condizioni',
  titolo: 'Condizioni e riposi',
  sottotitolo: 'Cosa ti succede quando sei prono, afferrato, spaventato… e cosa recuperi riposando.',
  sezioni: [
    {
      titolo: 'Le condizioni',
      capitoli: [
        { id: 'accecato', titolo: 'Accecato', pagina: 'SRD p. 177', righe: [
          'Non vedi: fallisci le prove che richiedono la vista.',
          'Chi ti attacca ha vantaggio; tu attacchi con svantaggio.'] },
        { id: 'affascinato', titolo: 'Affascinato', pagina: 'SRD p. 178', righe: [
          'Non puoi attaccare chi ti ha affascinato né colpirlo con effetti dannosi.',
          'Lui ha vantaggio nelle prove per interagire socialmente con te.'] },
        { id: 'afferrato', titolo: 'Afferrato', pagina: 'SRD p. 182', righe: [
          'Velocità 0. Attacchi con svantaggio chiunque non sia chi ti afferra.',
          'Chi ti afferra può trascinarti.',
          'Per liberarti: azione, prova di Forza (Atletica) o Destrezza (Acrobazia) contro la CD della presa.'] },
        { id: 'assordato', titolo: 'Assordato', pagina: 'SRD p. 181', righe: [
          'Non senti: fallisci le prove che richiedono l\'udito.'] },
        { id: 'avvelenato', titolo: 'Avvelenato', pagina: 'SRD p. 186', righe: [
          'Svantaggio ai tiri per colpire e alle prove di caratteristica.'] },
        { id: 'incapacitato', titolo: 'Incapacitato', pagina: 'SRD p. 184', righe: [
          'Niente azioni, azioni bonus né reazioni. Non puoi parlare.',
          'Perdi la concentrazione.',
          'Se lo sei quando si tira l\'iniziativa, la tiri con svantaggio.'] },
        { id: 'indebolimento', titolo: 'Indebolimento', pagina: 'SRD p. 181', righe: [
          'Si accumula a livelli: a 6 livelli muori.',
          'Ogni tiro di d20 (prove, tiri per colpire, tiri salvezza) perde 2 per livello.',
          'La velocità cala di 1,5 m per livello.',
          'Ogni riposo lungo toglie 1 livello.'] },
        { id: 'invisibile', titolo: 'Invisibile', pagina: 'SRD p. 184', righe: [
          'Chi ti attacca ha svantaggio; tu attacchi con vantaggio (non contro chi riesce a vederti).',
          'Gli effetti che richiedono di vederti non funzionano.',
          'Vantaggio all\'iniziativa.'] },
        { id: 'paralizzato', titolo: 'Paralizzato', pagina: 'SRD p. 186', righe: [
          'Sei incapacitato e la velocità è 0.',
          'Fallisci i tiri salvezza su Forza e Destrezza. Chi ti attacca ha vantaggio.',
          'Un colpo da entro 1,5 m è sempre un critico.'] },
        { id: 'pietrificato', titolo: 'Pietrificato', pagina: 'SRD p. 186', righe: [
          'Diventi pietra con quello che porti (gli oggetti non magici). Incapacitato, velocità 0.',
          'Fallisci i tiri salvezza su Forza e Destrezza; chi ti attacca ha vantaggio.',
          'Resistenza a tutti i danni, immune al veleno.'] },
        { id: 'privo-di-sensi', titolo: 'Privo di sensi', pagina: 'SRD p. 191', righe: [
          'Sei incapacitato e prono, lasci cadere quello che tieni. Velocità 0.',
          'Fallisci i tiri salvezza su Forza e Destrezza; chi ti attacca ha vantaggio.',
          'Un colpo da entro 1,5 m è sempre un critico. Quando ti riprendi resti prono.'] },
        { id: 'prono', titolo: 'Prono', pagina: 'SRD p. 186', righe: [
          'Puoi solo strisciare, oppure spendere metà della velocità per rialzarti.',
          'Attacchi con svantaggio.',
          'Chi ti attacca da entro 1,5 m ha vantaggio; da più lontano ha svantaggio.'] },
        { id: 'spaventato', titolo: 'Spaventato', pagina: 'SRD p. 182', righe: [
          'Svantaggio a prove e tiri per colpire finché vedi la fonte della paura.',
          'Non puoi avvicinarti volontariamente a lei.'] },
        { id: 'stordito', titolo: 'Stordito', pagina: 'SRD p. 189', righe: [
          'Sei incapacitato.',
          'Fallisci i tiri salvezza su Forza e Destrezza; chi ti attacca ha vantaggio.'] },
        { id: 'trattenuto', titolo: 'Trattenuto', pagina: 'SRD p. 187', righe: [
          'Velocità 0. Chi ti attacca ha vantaggio; tu attacchi con svantaggio.',
          'Svantaggio ai tiri salvezza su Destrezza.'] },
      ],
    },
    {
      titolo: 'I riposi',
      capitoli: [
        {
          id: 'riposo-breve', titolo: 'Riposo breve', pagina: 'SRD p. 187',
          righe: [
            '1 ora senza fare niente di faticoso: leggere, parlare, mangiare, fare la guardia. Serve almeno 1 PF.',
            'Puoi spendere dadi vita: per ognuno tiri il dado e aggiungi la Costituzione (almeno 1 PF). Decidi dopo ogni tiro se spenderne un altro.',
            'Tornano le capacità «per riposo breve» (per esempio gli slot del warlock).',
            'Si interrompe se si tira l\'iniziativa, se lanci un incantesimo che non è un trucchetto o se subisci danni: in quel caso non recuperi niente.',
          ],
        },
        {
          id: 'riposo-lungo', titolo: 'Riposo lungo', pagina: 'SRD p. 185',
          righe: [
            'Almeno 8 ore: dormi almeno 6 ore e fai al massimo 2 ore di attività leggere. Mentre dormi sei privo di sensi. Serve almeno 1 PF.',
            'Recuperi tutti i PF e tutti i dadi vita spesi, tutti gli slot; le caratteristiche ridotte tornano normali; l\'indebolimento cala di 1; tornano le capacità «per riposo lungo».',
            'Si interrompe se si tira l\'iniziativa, se lanci un incantesimo che non è un trucchetto, se subisci danni o dopo 1 ora di cammino o sforzo fisico.',
            'Se avevi già riposato almeno 1 ora, ottieni i benefici di un riposo breve. Puoi riprendere subito: ogni interruzione aggiunge 1 ora.',
            'Tra due riposi lunghi devono passare almeno 16 ore.',
          ],
        },
        {
          id: 'trance', titolo: 'Senza dormire: la trance degli elfi', pagina: 'SRD p. 85',
          righe: [
            'Di regola il riposo lungo richiede di dormire almeno 6 ore.',
            'Gli elfi non hanno bisogno di dormire: completano un riposo lungo in 4 ore di meditazione, restando coscienti, e la magia non può addormentarli.',
          ],
        },
      ],
    },
  ],
};

export const GUIDE = [GUIDA_MAGIA, GUIDA_COMBATTIMENTO, GUIDA_CONDIZIONI];
