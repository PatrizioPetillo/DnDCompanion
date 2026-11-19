// Le guide della Home (richieste di Patrizio, 19/11): la magia, il combattimento con i tiri, le condizioni con i riposi.
// Testi scritti da noi, in parole semplici, dalle regole dell'SRD 5.2; accanto a ogni capitolo la pagina.
// Pagine verificate il 19/11 sul file dell'SRD (il numero prima del testo è l'intestazione della pagina).
// Esempi (rivisti il 19/11): chi legge non conosce i personaggi di prova, quindi ogni esempio dice chi è
// (classe, livello, i numeri che servono) e porta il calcolo per intero.

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
        id: 'trucchetti', titolo: 'Trucchetti e incantesimi', pagina: 'SRD p. 77, 104',
        righe: [
          'Ogni incantesimo ha un livello da 0 a 9: più è alto, più è potente. Quelli di livello 0 sono i trucchetti.',
          'I trucchetti si lanciano senza consumare niente, quante volte vuoi: sono la magia «di tutti i giorni» del personaggio, spesso il suo attacco principale.',
          'Gli incantesimi dal 1° livello in su consumano uno slot (capitolo successivo).',
          'Il numero di trucchetti che conosci lo dà la tua classe; talenti e specie possono aggiungerne altri.',
        ],
        esempio: 'Un mago di 1° livello conosce 3 trucchetti. Se tra questi c\'è Dardo di fuoco, può lanciarlo in ogni turno del combattimento (1d10 danni da fuoco) senza mai esaurirlo.',
      },
      {
        id: 'slot', titolo: 'Gli slot', pagina: 'SRD p. 77, 104',
        righe: [
          'Uno slot è una «carica» di energia magica. Ogni classe incantatrice ha una tabella che dice quanti slot ha di ogni livello.',
          'Per lanciare un incantesimo di 1° livello o più spendi uno slot del suo livello o di un livello più alto.',
          'Lo slot non è l\'incantesimo: con gli stessi slot puoi lanciare incantesimi diversi, o lo stesso più volte.',
          'Gli slot spesi tornano tutti dopo un riposo lungo (il warlock fa eccezione: vedi l\'ultimo capitolo).',
          'Nella scheda gli slot sono pallini: tocchi un pallino quando lo spendi.',
        ],
        esempio: 'Un mago di 1° livello ha 2 slot di 1°. In un combattimento lancia Scudo e poi Dardo incantato: ha speso entrambi gli slot, e fino al prossimo riposo lungo può usare solo i trucchetti.',
      },
      {
        id: 'slot-alto', titolo: 'Lanciare con uno slot più alto', pagina: 'SRD p. 104-105',
        righe: [
          'Puoi spendere uno slot più alto del necessario: per quel lancio l\'incantesimo diventa di quel livello.',
          'Molti incantesimi diventano più forti: lo dice la loro scheda, alla voce «con uno slot superiore». Se la voce non c\'è, lo slot più alto non cambia niente.',
          'Al 1° livello hai solo slot di 1°, quindi la regola conta dal 3° livello in poi.',
        ],
        esempio: 'Dardo incantato crea 3 dardi da 1d4 + 1 danni da forza, più 1 dardo per ogni livello dello slot sopra il 1°. Un mago di 3° livello (4 slot di 1° e 2 di 2°) che lo lancia con uno slot di 2° crea 4 dardi.',
      },
      {
        id: 'preparati', titolo: 'Preparati e libro del mago', pagina: 'SRD p. 77-78, 104',
        righe: [
          'Gli incantesimi di 1° livello o più si lanciano solo se sono preparati: è l\'elenco degli incantesimi «pronti all\'uso». La tabella della classe dice quanti.',
          'Gli incantesimi sempre preparati (dati da un talento, dalla specie o da una capacità) non contano in quel numero.',
          'Il mago è diverso: scrive i suoi incantesimi in un libro e prepara solo una parte di quelli scritti.',
          'Al 1° livello il libro contiene 6 incantesimi di 1° e il mago ne prepara 4. Il numero non dipende dall\'Intelligenza: il modificatore conta solo per la CD e l\'attacco.',
          'Salendo di livello il mago aggiunge 2 incantesimi al libro, e può copiarne altri che trova (pergamene, libri di altri maghi).',
        ],
        esempio: 'Un mago umano di 1° livello con il background Accolito ha 6 incantesimi nel libro e ne prepara 4: Armatura magica, Scudo, Caduta morbida e Trova famiglio. In più ha Parola guaritrice dal talento Iniziato alla magia: è sempre preparata e non occupa uno dei 4 posti.',
      },
      {
        id: 'cambio', titolo: 'Quando si cambiano i preparati', pagina: 'SRD p. 104',
        righe: [
          'Mago: dopo un riposo lungo può cambiarli tutti, scegliendo tra quelli scritti nel libro.',
          'Chierico e druido: dopo un riposo lungo possono cambiarli tutti, scegliendo dall\'intera lista della classe.',
          'Paladino e ranger: dopo un riposo lungo possono cambiarne uno.',
          'Bardo, stregone e warlock: ne cambiano uno solo quando salgono di livello. Scegli con cura: li terrai a lungo.',
          'Nella scheda, dopo il «Riposo lungo», l\'app ti propone solo i cambi che la tua classe permette.',
        ],
        esempio: 'Un chierico di 1° livello prepara 4 incantesimi. Il gruppo sta per entrare in una cripta: dopo il riposo lungo può togliere Comando e preparare un incantesimo più utile contro i non morti, preso da tutta la lista del chierico.',
      },
      {
        id: 'un-slot', titolo: 'Un solo slot per turno', pagina: 'SRD p. 105',
        righe: [
          'In un turno puoi spendere un solo slot, anche se hai sia l\'azione sia l\'azione bonus a disposizione.',
          'I trucchetti non consumano slot: un trucchetto si può sempre aggiungere all\'incantesimo con lo slot.',
          'Gli incantesimi lanciati gratis (con un talento o come rituale) non consumano slot e non contano.',
        ],
        esempio: 'Un chierico di 1° livello lancia Parola guaritrice (azione bonus, uno slot) su un compagno a terra. Nello stesso turno non può lanciare anche Cura ferite, che vuole un altro slot; può però usare l\'azione per un trucchetto come Fiamma sacra.',
      },
      {
        id: 'cd', titolo: 'CD e attacco degli incantesimi', pagina: 'SRD p. 106',
        righe: [
          'Ogni classe usa una caratteristica da incantatore: Intelligenza per il mago; Saggezza per chierico, druido e ranger; Carisma per bardo, paladino, stregone e warlock.',
          'CD degli incantesimi = 8 + bonus di competenza + modificatore della caratteristica da incantatore. Il bersaglio fa un tiro salvezza: se non arriva alla CD, subisce l\'effetto pieno.',
          'Attacco con incantesimo = bonus di competenza + modificatore della caratteristica. Lo aggiungi al d20 quando l\'incantesimo chiede un tiro per colpire contro la CA.',
          'La scheda di ogni incantesimo dice quale dei due usa. Nella scheda del personaggio tocca il numero per vedere la somma.',
        ],
        esempio: 'Un mago di 1° livello con Intelligenza 17 (modificatore +3) e competenza +2 ha CD 8 + 2 + 3 = 13 e attacco 2 + 3 = +5. Con Dardo di fuoco tira 1d20 + 5 contro la CA del nemico; con Sonno è il nemico a tirare, e deve fare almeno 13.',
      },
      {
        id: 'concentrazione', titolo: 'Concentrazione', pagina: 'SRD p. 179',
        righe: [
          'Alcuni incantesimi durano solo finché resti concentrato: lo dice la loro durata («Concentrazione, fino a 1 minuto»). Puoi tenerne attivo uno solo alla volta.',
          'Finisce se lanci un altro incantesimo a concentrazione, se diventi incapacitato o se muori. Puoi anche interromperla quando vuoi, senza usare azioni.',
          'Se subisci danni fai subito un tiro salvezza su Costituzione per non perderla. La CD è 10, oppure la metà dei danni se è più alta, fino a un massimo di 30.',
          'Se subisci danni da più fonti, fai un tiro per ognuna.',
        ],
        esempio: 'Una chierica di 1° livello mantiene Benedizione sui compagni. Un orco la colpisce per 14 danni: metà è 7, meno di 10, quindi tira su Costituzione contro CD 10. Se invece i danni fossero 26, la CD sarebbe 13.',
      },
      {
        id: 'rituali', titolo: 'Rituali', pagina: 'SRD p. 78, 104',
        righe: [
          'Gli incantesimi con l\'etichetta «rituale» si possono lanciare come rituale: ci vogliono 10 minuti in più del normale, ma non consumano slot.',
          'Di solito devi averlo preparato. Il mago fa eccezione: lo lancia leggendo dal libro anche se non è tra i preparati (Adepto dei rituali).',
          'Va bene fuori dal combattimento, quando il tempo non manca. I materiali con un costo servono lo stesso.',
        ],
        esempio: 'Un mago di 1° livello ha Trova famiglio nel libro. Come rituale ci mette 1 ora e 10 minuti e non spende slot. L\'incenso da 10 mo però si consuma comunque: deve averlo nello zaino.',
      },
      {
        id: 'componenti', titolo: 'Componenti V, S, M', pagina: 'SRD p. 105-106',
        righe: [
          'V (verbale): parole da pronunciare ad alta voce. Non funziona se sei imbavagliato o in una zona di silenzio magico.',
          'S (somatica): gesti con almeno una mano libera.',
          'M (materiale): un oggetto, indicato tra parentesi. La borsa per componenti, o il focus della tua classe (bacchetta, simbolo sacro…), sostituisce i materiali senza costo e quelli che non si consumano.',
          'I materiali con un costo vanno comprati; se l\'incantesimo dice che «li consuma», ne serve uno nuovo per ogni lancio. Nella scheda li trovi nello zaino, con il conteggio.',
          'Senza una componente, l\'incantesimo non si può lanciare.',
        ],
        esempio: 'Identificare richiede una perla da 100 mo: il focus non la sostituisce, ma l\'incantesimo non la consuma, quindi basta comprarla una volta. Sonno chiede un pizzico di sabbia: basta la borsa per componenti.',
      },
      {
        id: 'senza-slot', titolo: 'Lanciare senza slot', pagina: 'SRD p. 87, 104',
        righe: [
          'Oltre ai trucchetti e ai rituali, alcuni talenti e specie danno un incantesimo da lanciare gratis, di solito una volta per riposo lungo.',
          'Iniziato alla magia dà 2 trucchetti e un incantesimo di 1° sempre preparato: lo lanci gratis una volta per riposo lungo, e se hai slot puoi lanciarlo anche con quelli.',
          'Anche pergamene e alcuni oggetti magici lanciano incantesimi senza slot.',
        ],
        esempio: 'Un mago con il talento Iniziato alla magia (chierico) ha Parola guaritrice: la prima volta la lancia gratis; dopo, fino al riposo lungo, deve spendere uno dei suoi slot.',
      },
      {
        id: 'patto', titolo: 'Il warlock e gli slot del patto', pagina: 'SRD p. 70-71',
        righe: [
          'Il warlock ha pochi slot, tutti dello stesso livello, che sale insieme al personaggio.',
          'Li recupera con un riposo breve, non solo con quello lungo: conviene fare spesso un\'ora di pausa.',
        ],
        esempio: 'Un warlock di 1° livello ha 1 solo slot di 1°. Lo spende per Sortilegio nel primo combattimento; dopo un riposo breve lo ha di nuovo.',
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
            'Quando l\'esito è incerto si tira 1d20. Ci sono tre tipi di tiro: prova di caratteristica (riuscire in qualcosa), tiro salvezza (resistere a un pericolo), tiro per colpire (attaccare).',
            'Al risultato aggiungi il modificatore della caratteristica che serve e, se sei competente, il bonus di competenza (+2 dal 1° al 4° livello).',
            'Se raggiungi il numero da battere ce la fai: la CD (classe difficoltà) per prove e tiri salvezza, la CA (classe armatura) del bersaglio per i tiri per colpire.',
            'CD tipiche: 10 facile, 15 media, 20 difficile.',
          ],
          esempio: 'Un ladro con Destrezza 16 (+3) e competenza in Furtività (+2) vuole nascondersi: tira 1d20 + 5 contro CD 15. Con un 11 sul dado fa 16: ce la fa.',
        },
        {
          id: 'colpire', titolo: 'Tiri per colpire, 20 e 1', pagina: 'SRD p. 7',
          righe: [
            'Con le armi da mischia usi la Forza, con quelle a distanza la Destrezza. Con le armi accurate (pugnale, stocco…) scegli la migliore delle due.',
            'Aggiungi la competenza solo se sei addestrato in quell\'arma: lo dice la tua classe.',
            'Un 20 sul dado colpisce sempre, qualunque sia la CA, ed è un colpo critico.',
            'Un 1 sul dado manca sempre, qualunque sia il bonus.',
          ],
          esempio: 'Una guerriera con Forza 16 (+3) attacca con la spada lunga, in cui è addestrata: tira 1d20 + 5. Contro un nemico con CA 15 le serve almeno 10 sul dado.',
        },
        {
          id: 'vantaggio', titolo: 'Vantaggio e svantaggio', pagina: 'SRD p. 7-8',
          righe: [
            'Vantaggio: tiri due d20 e tieni il più alto. Svantaggio: tiri due d20 e tieni il più basso.',
            'Nascono dalla situazione: un nemico prono vicino a te, un bersaglio che non ti vede, una condizione, un incantesimo.',
            'Non si sommano: anche con tre motivi di vantaggio tiri solo due dadi.',
            'Se hai sia vantaggio sia svantaggio si annullano, qualunque sia il numero di motivi: tiri un solo d20.',
          ],
          esempio: 'Un barbaro attacca un nemico prono accanto a lui (vantaggio), ma è avvelenato (svantaggio): si annullano e tira un d20 solo.',
        },
        {
          id: 'ispirazione', titolo: 'Ispirazione eroica', pagina: 'SRD p. 8',
          righe: [
            'Te la dà il master, di solito per una bella giocata o un momento di interpretazione, oppure una regola: l\'umano inizia ogni giornata con l\'Ispirazione eroica.',
            'Spendila subito dopo un tiro per ritirare un dado qualsiasi (anche di danno): devi tenere il nuovo risultato.',
            'Ne puoi avere una sola. Se ne ricevi un\'altra mentre ce l\'hai, puoi darla a un compagno che non ce l\'ha.',
          ],
          esempio: 'Una umana fallisce un tiro salvezza con un 3 sul dado: spende l\'Ispirazione eroica, ritira e ottiene 14.',
        },
      ],
    },
    {
      titolo: 'Il tuo turno',
      capitoli: [
        {
          id: 'iniziativa', titolo: 'Iniziativa e round', pagina: 'SRD p. 13',
          righe: [
            'Quando inizia il combattimento tutti tirano l\'iniziativa: 1d20 + modificatore di Destrezza (più la competenza se hai il talento Allerta).',
            'Si agisce dal punteggio più alto al più basso, e l\'ordine resta uguale per tutto il combattimento.',
            'Un round dura circa 6 secondi: in un round ognuno fa il suo turno.',
            'Chi è sorpreso (non si aspettava lo scontro) tira l\'iniziativa con svantaggio.',
          ],
          esempio: 'Un mago con Destrezza 12 (+1) e il talento Allerta (+2) tira l\'iniziativa con 1d20 + 3.',
        },
        {
          id: 'turno', titolo: 'Cosa fai nel tuo turno', pagina: 'SRD p. 13-14',
          righe: [
            'Ti muovi fino alla tua velocità e fai un\'azione, nell\'ordine che vuoi. Puoi anche dividere il movimento: un po\' prima e un po\' dopo l\'azione.',
            'Se una capacità o un incantesimo te lo permette, puoi fare anche un\'azione bonus.',
            'Parlare brevemente e fare gesti è gratis. Puoi usare un oggetto gratis (aprire una porta, estrarre un\'arma); per un secondo oggetto serve l\'azione Utilizzo.',
            'Buttarti a terra (prono) è gratis; rialzarti costa metà della velocità.',
            'Puoi anche non fare niente: se sei indeciso, Schivata o Prepararsi sono scelte sicure.',
          ],
          esempio: 'Un guerriero con velocità 9 metri avanza di 3 metri, estrae la spada (gratis), attacca con l\'azione e poi si sposta di altri 6 metri.',
        },
        {
          id: 'azioni', titolo: 'Le azioni', pagina: 'SRD p. 9-10',
          righe: [
            'Attacco: un attacco con un\'arma o un colpo senz\'armi (alcune classi, salendo di livello, ne fanno di più).',
            'Magia: lanci un incantesimo che richiede un\'azione, usi un oggetto magico o una capacità magica.',
            'Scatto: per il resto del turno hai movimento extra pari alla tua velocità.',
            'Disimpegno: per il resto del turno il tuo movimento non provoca attacchi di opportunità.',
            'Schivata: fino al tuo prossimo turno chi ti attacca ha svantaggio e hai vantaggio ai tiri salvezza su Destrezza.',
            'Aiuto: dai vantaggio a un alleato nella prossima prova (con un\'abilità in cui sei competente) o nel prossimo attacco contro un nemico entro 1,5 m da te; oppure presti soccorso a chi è a 0 PF.',
            'Nascondersi: prova di Destrezza (Furtività), vedi il capitolo dedicato.',
            'Influenza: prova di Carisma (Inganno, Intimidire, Intrattenere, Persuasione) o di Saggezza (Addestrare animali) per cambiare l\'atteggiamento di una creatura.',
            'Ricerca: prova di Saggezza (Intuizione, Medicina, Percezione, Sopravvivenza). Studio: prova di Intelligenza (Arcano, Storia, Indagare, Natura, Religione).',
            'Prepararsi: scegli un\'azione e cosa la fa scattare («se la porta si apre, lancio Dardo di fuoco»); la fai con la reazione prima del tuo prossimo turno.',
            'Utilizzo: usi un oggetto non magico (una pozione, una corda, una leva).',
            'Puoi anche inventare: il master dice se si può fare e che tiro serve.',
          ],
        },
        {
          id: 'bonus-reazione', titolo: 'Azione bonus e reazione', pagina: 'SRD p. 10',
          righe: [
            'Azione bonus: esiste solo se una capacità, un incantesimo o una regola la prevede. Una per turno.',
            'Reazione: una risposta immediata a qualcosa che succede, anche nel turno di un altro (l\'esempio più comune è l\'attacco di opportunità). Dopo averla usata non ne hai un\'altra fino all\'inizio del tuo turno.',
          ],
          esempio: 'Un mago di 1° livello con CA 11 viene colpito da un attacco che totalizza 14. Usa la reazione per lanciare Scudo: la sua CA sale a 16 fino al suo prossimo turno, quindi quell\'attacco manca.',
        },
        {
          id: 'opportunita', titolo: 'Attacco di opportunità', pagina: 'SRD p. 15',
          righe: [
            'Quando una creatura che vedi esce dalla tua portata (di solito 1,5 m), puoi usare la reazione per un attacco in mischia contro di lei, appena prima che esca.',
            'Vale anche per te: se ti allontani da un nemico che ti è accanto, lui può attaccarti.',
            'Per evitarlo usa l\'azione Disimpegno. Non lo provochi neanche se ti teletrasporti o se qualcosa ti sposta senza che usi il tuo movimento.',
          ],
          esempio: 'Una maga è accanto a un goblin e vuole allontanarsi per lanciare un incantesimo. Se si sposta e basta, il goblin può attaccarla; se usa Disimpegno, si allontana al sicuro ma ha speso l\'azione del turno.',
        },
        {
          id: 'critico', titolo: 'Colpo critico', pagina: 'SRD p. 16',
          righe: [
            'Con un 20 sul dado per colpire, tiri due volte tutti i dadi di danno dell\'attacco e li sommi; il modificatore si aggiunge una volta sola.',
            'Raddoppiano anche i dadi extra, come l\'Attacco furtivo del ladro.',
          ],
          esempio: 'Un ladro di 1° livello con Destrezza 16 (+3) colpisce con un pugnale e Attacco furtivo: di solito fa 1d4 + 1d6 + 3. Con un critico fa 2d4 + 2d6 + 3.',
        },
        {
          id: 'nascondersi', titolo: 'Nascondersi', pagina: 'SRD p. 183',
          righe: [
            'Serve una prova di Destrezza (Furtività) con CD 15, mentre sei pesantemente oscurato (buio, nebbia fitta) o dietro tre quarti di copertura o copertura totale, e fuori dalla vista dei nemici.',
            'Se riesci sei invisibile finché resti nascosto: hai vantaggio ad attaccare e chi ti attacca ha svantaggio. Il tuo risultato diventa la CD per trovarti con una prova di Saggezza (Percezione).',
            'Smetti di essere nascosto se fai un rumore più forte di un sussurro, se ti trovano, se fai un tiro per colpire o se lanci un incantesimo con componente verbale.',
          ],
          esempio: 'Un ladro si nasconde dietro una colonna e ottiene 18. Al turno dopo attacca con vantaggio; colpisca o manchi, a quel punto non è più nascosto.',
        },
      ],
    },
    {
      titolo: 'A 0 punti ferita',
      capitoli: [
        {
          id: 'zero', titolo: 'Cadere a 0 PF', pagina: 'SRD p. 17',
          righe: [
            'I PF non scendono sotto 0. A 0 PF cadi privo di sensi, finché non recuperi almeno 1 PF.',
            'Danno massiccio: se il danno che avanza oltre lo 0 è pari o superiore ai tuoi PF massimi, muori subito.',
            'I mostri, di solito, a 0 PF muoiono e basta.',
          ],
          esempio: 'Un mago di 1° livello ha 7 PF massimi. Ne ha 3 e subisce 10 danni: arriva a 0 e ne avanzano 7, pari ai suoi PF massimi, quindi muore. Se i danni fossero stati 9, ne avanzerebbero 6: cadrebbe privo di sensi.',
        },
        {
          id: 'morte', titolo: 'Tiri salvezza contro la morte', pagina: 'SRD p. 17-18',
          righe: [
            'All\'inizio di ogni tuo turno a 0 PF tiri 1d20, senza modificatori: 10 o più è un successo, sotto 10 un fallimento.',
            'Con 3 successi diventi stabile; con 3 fallimenti muori. Non serve che siano di fila.',
            'Un 1 sul dado conta come due fallimenti; un 20 ti riporta subito a 1 PF.',
            'Se subisci danni a 0 PF è un fallimento (due se è un colpo critico).',
            'Qualsiasi cura azzera il conto e ti rimette in piedi. Nella scheda trovi i pallini per segnarli.',
          ],
          esempio: 'Una chierica a 0 PF tira 12 (successo), poi 4 (fallimento), poi 15 (successo), poi 11 (terzo successo): è stabile. Se un compagno le avesse lanciato Parola guaritrice prima, si sarebbe rialzata subito.',
        },
        {
          id: 'stabile', titolo: 'Stabilizzare un compagno', pagina: 'SRD p. 18',
          righe: [
            'Con l\'azione Aiuto e una prova di Saggezza (Medicina) con CD 10 stabilizzi una creatura a 0 PF. Una cura fa di più: la riporta sopra 0 PF e la rimette in piedi.',
            'Stabile: non tira più contro la morte ma resta priva di sensi. Se subisce danni, ricomincia a tirare.',
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
          'Non vedi: fallisci automaticamente le prove che richiedono la vista (leggere, cercare con lo sguardo).',
          'Chi ti attacca ha vantaggio; tu attacchi con svantaggio.',
          'Ti succede, per esempio, nel buio totale senza scurovisione.'] },
        { id: 'affascinato', titolo: 'Affascinato', pagina: 'SRD p. 178', righe: [
          'Non puoi attaccare chi ti ha affascinato né colpirlo con incantesimi o capacità dannosi.',
          'Lui ha vantaggio nelle prove per interagire socialmente con te (convincerti, ingannarti).'] },
        { id: 'afferrato', titolo: 'Afferrato', pagina: 'SRD p. 182', righe: [
          'La tua velocità è 0 e non può aumentare. Attacchi con svantaggio chiunque non sia chi ti afferra.',
          'Chi ti afferra può trascinarti con sé (si muove più lentamente).',
          'Per liberarti usi l\'azione: prova di Forza (Atletica) o di Destrezza (Acrobazia) contro la CD della presa.'] },
        { id: 'assordato', titolo: 'Assordato', pagina: 'SRD p. 181', righe: [
          'Non senti: fallisci automaticamente le prove che richiedono l\'udito.'] },
        { id: 'avvelenato', titolo: 'Avvelenato', pagina: 'SRD p. 186', righe: [
          'Svantaggio ai tiri per colpire e alle prove di caratteristica (non ai tiri salvezza).'] },
        { id: 'incapacitato', titolo: 'Incapacitato', pagina: 'SRD p. 184', righe: [
          'Non puoi fare azioni, azioni bonus né reazioni, e non puoi parlare.',
          'Perdi la concentrazione sull\'incantesimo che stavi mantenendo.',
          'Se lo sei quando si tira l\'iniziativa, la tiri con svantaggio.',
          'Fa parte di altre condizioni: paralizzato, pietrificato, privo di sensi, stordito.'] },
        { id: 'indebolimento', titolo: 'Indebolimento', pagina: 'SRD p. 181', righe: [
          'Si accumula a livelli, da 1 a 6: a 6 livelli muori.',
          'Ogni tiro di d20 (prove, tiri per colpire, tiri salvezza) perde 2 per ogni livello.',
          'La velocità cala di 1,5 m per ogni livello.',
          'Ogni riposo lungo toglie 1 livello.',
          'Esempio: con 2 livelli tiri il d20 con −4 e ti muovi di 3 metri in meno.'] },
        { id: 'invisibile', titolo: 'Invisibile', pagina: 'SRD p. 184', righe: [
          'Chi ti attacca ha svantaggio; tu attacchi con vantaggio. Non vale contro chi riesce comunque a vederti.',
          'Gli effetti che richiedono di vederti non funzionano su di te.',
          'Hai vantaggio all\'iniziativa.'] },
        { id: 'paralizzato', titolo: 'Paralizzato', pagina: 'SRD p. 186', righe: [
          'Sei incapacitato e la tua velocità è 0.',
          'Fallisci automaticamente i tiri salvezza su Forza e Destrezza. Chi ti attacca ha vantaggio.',
          'Ogni colpo da qualcuno entro 1,5 m da te è un colpo critico.'] },
        { id: 'pietrificato', titolo: 'Pietrificato', pagina: 'SRD p. 186', righe: [
          'Diventi una statua insieme a quello che indossi e porti (tranne gli oggetti magici). Sei incapacitato, velocità 0.',
          'Fallisci i tiri salvezza su Forza e Destrezza; chi ti attacca ha vantaggio.',
          'Hai resistenza a tutti i danni e sei immune al veleno.'] },
        { id: 'privo-di-sensi', titolo: 'Privo di sensi', pagina: 'SRD p. 191', righe: [
          'Sei incapacitato e prono, e lasci cadere quello che tieni in mano. Velocità 0.',
          'Fallisci i tiri salvezza su Forza e Destrezza; chi ti attacca ha vantaggio.',
          'Ogni colpo da entro 1,5 m è un colpo critico. Quando ti riprendi resti prono.',
          'È la condizione di chi scende a 0 PF o dorme.'] },
        { id: 'prono', titolo: 'Prono', pagina: 'SRD p. 186', righe: [
          'Sei a terra: puoi solo strisciare, oppure spendere metà della velocità per rialzarti.',
          'Attacchi con svantaggio.',
          'Chi ti attacca da entro 1,5 m ha vantaggio; da più lontano ha svantaggio. Buttarsi a terra protegge dalle frecce, non dalle spade.'] },
        { id: 'spaventato', titolo: 'Spaventato', pagina: 'SRD p. 182', righe: [
          'Svantaggio alle prove e ai tiri per colpire finché vedi la fonte della paura.',
          'Non puoi avvicinarti volontariamente a lei.'] },
        { id: 'stordito', titolo: 'Stordito', pagina: 'SRD p. 189', righe: [
          'Sei incapacitato.',
          'Fallisci automaticamente i tiri salvezza su Forza e Destrezza; chi ti attacca ha vantaggio.'] },
        { id: 'trattenuto', titolo: 'Trattenuto', pagina: 'SRD p. 187', righe: [
          'La tua velocità è 0. Chi ti attacca ha vantaggio; tu attacchi con svantaggio.',
          'Hai svantaggio ai tiri salvezza su Destrezza.',
          'Succede, per esempio, se sei preso in una rete o in una ragnatela.'] },
      ],
    },
    {
      titolo: 'I riposi',
      capitoli: [
        {
          id: 'riposo-breve', titolo: 'Riposo breve', pagina: 'SRD p. 187',
          righe: [
            'Dura 1 ora, senza fare niente di faticoso: leggere, parlare, mangiare, fare la guardia. Serve avere almeno 1 PF.',
            'Puoi spendere dadi vita (ne hai uno per livello, del tipo della tua classe): per ognuno tiri il dado e aggiungi il modificatore di Costituzione, minimo 1 PF. Decidi dopo ogni tiro se spenderne un altro.',
            'Tornano le capacità «per riposo breve», per esempio gli slot del warlock.',
            'Si interrompe se si tira l\'iniziativa, se lanci un incantesimo che non è un trucchetto o se subisci danni: in quel caso non recuperi niente.',
          ],
          esempio: 'Un guerriero di 1° livello (dado vita d10, Costituzione +2) ha 1 dado vita. Lo spende, tira 6 e recupera 6 + 2 = 8 PF. I dadi vita spesi tornano con il riposo lungo.',
        },
        {
          id: 'riposo-lungo', titolo: 'Riposo lungo', pagina: 'SRD p. 185',
          righe: [
            'Dura almeno 8 ore: dormi almeno 6 ore e fai al massimo 2 ore di attività leggere (leggere, parlare, mangiare, fare la guardia). Mentre dormi sei privo di sensi. Serve avere almeno 1 PF.',
            'Alla fine recuperi tutti i PF e tutti i dadi vita spesi, e tutti gli slot. Le caratteristiche ridotte tornano normali, l\'indebolimento cala di 1 livello e tornano le capacità «per riposo lungo».',
            'Si interrompe se si tira l\'iniziativa, se lanci un incantesimo che non è un trucchetto, se subisci danni o dopo 1 ora di cammino o di sforzo fisico.',
            'Se avevi già riposato almeno 1 ora, ottieni i benefici di un riposo breve. Puoi riprendere subito: ogni interruzione aggiunge 1 ora.',
            'Tra la fine di un riposo lungo e l\'inizio del successivo devono passare almeno 16 ore.',
          ],
          esempio: 'Il gruppo si accampa e fa i turni di guardia: chi monta la guardia per 2 ore e dorme le altre 6 completa comunque il riposo lungo.',
        },
        {
          id: 'trance', titolo: 'Senza dormire: la trance degli elfi', pagina: 'SRD p. 85',
          righe: [
            'Di regola il riposo lungo richiede di dormire almeno 6 ore.',
            'Gli elfi non hanno bisogno di dormire, e la magia non può addormentarli.',
            'Completano un riposo lungo in 4 ore di meditazione, restando coscienti.',
          ],
          esempio: 'In un accampamento un\'elfa può fare la guardia mentre gli altri dormono, e dopo 4 ore di trance ha finito il suo riposo lungo.',
        },
      ],
    },
  ],
};

export const GUIDE = [GUIDA_MAGIA, GUIDA_COMBATTIMENTO, GUIDA_CONDIZIONI];
