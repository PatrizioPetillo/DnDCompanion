# Le tabelle degli incantesimi dell'SRD 5.2.1 italiano (pagine 121-201), trascritte dalle righe in GillSans del PDF
# e controllate sull'immagine della pagina (23/11). Nel testo il segnaposto «[[tabelle]]» dice dove vanno.
import json

def righe_numerate(testo):
    # «1 Rosso. Tiro…» / «2–6 Il bersaglio…»: la prima parola è il numero, il resto la descrizione
    out = []
    for r in testo.strip().split('\n'):
        n, _, d = r.strip().partition(' ')
        out.append([n, d])
    return out

T = {
  'confusion': [{'colonne': ['1d10', 'Comportamento per il turno'], 'righe': righe_numerate('''
1 Il bersaglio non effettua alcuna azione e usa tutto il suo movimento per muoversi, tirando 1d4 per la direzione: 1, nord; 2, est; 3, sud; o 4, ovest.
2–6 Il bersaglio non si muove e non effettua azioni.
7–8 Il bersaglio non si muove ed effettua l'azione di Attacco per eseguire un attacco in mischia contro una creatura casuale entro portata. Se nessuna creatura si trova entro la sua portata, il bersaglio non effettua azioni.
9–10 Il bersaglio sceglie il comportamento.''')}],
  'control-weather': [
    {'titolo': 'Precipitazioni', 'colonne': ['Grado', 'Condizione'], 'righe': righe_numerate('''
1 Sereno
2 Poco nuvoloso
3 Nuvoloso o nebbia
4 Pioggia, grandine o neve
5 Pioggia torrenziale, grandinata violenta o tormenta''')},
    {'titolo': 'Temperatura', 'colonne': ['Grado', 'Condizione'], 'righe': righe_numerate('''
1 Torrido
2 Caldo
3 Temperato
4 Fresco
5 Freddo
6 Gelido''')},
    {'titolo': 'Vento', 'colonne': ['Grado', 'Condizione'], 'righe': righe_numerate('''
1 Calmo
2 Vento moderato
3 Vento forte
4 Burrasca
5 Tempesta''')}],
  'creation': [{'titolo': 'Materiali', 'colonne': ['Materiale', 'Durata'], 'righe': [
    ['Materia vegetale', '24 ore'], ['Pietra o cristallo', '12 ore'], ['Metalli preziosi', '1 ora'],
    ['Gemme', '10 minuti'], ['Adamantio o mithral', '1 minuto']]}],
  'divine-word': [{'titolo': 'Effetti della parola divina', 'colonne': ['Punti ferita', 'Effetto'], 'righe': righe_numerate('''
0–20 Il bersaglio muore.
21–30 Il bersaglio è accecato, assordato e stordito per 1 ora.
31–40 Il bersaglio è accecato e assordato per 10 minuti.
41–50 Il bersaglio è assordato per 1 minuto.''')}],
  'augury': [{'titolo': 'Presagi', 'colonne': ['Presagio', 'Con risultati...'], 'righe': [
    ['Ventura', 'Positivi'], ['Sventura', 'Negativi'], ['Ventura e sventura', 'Positivi e negativi'], ['Indifferenza', 'Né positivi né negativi']]}],
  'reincarnate': [{'colonne': ['1d10', 'Specie'], 'righe': righe_numerate('''
1 Il personaggio tira di nuovo
2 Dragonide
3 Elfo
4 Gnomo
5 Goliath
6 Halfling
7 Nano
8 Orchesco
9 Tiefling
10 Umano''')}],
  'scrying': [
    {'colonne': ["L'incantatore conosce il bersaglio in maniera...", 'Modificatore al tiro salvezza'], 'righe': [
      ['Indiretta (ha sentito parlare del bersaglio)', '+5'], ['Diretta (ha incontrato il bersaglio)', '+0'],
      ['Approfondita (conosce bene il bersaglio)', '−5']]},
    {'colonne': ["L'oggetto del bersaglio che l'incantatore possiede è...", 'Modificatore al tiro salvezza'], 'righe': [
      ['Immagine o altra raffigurazione', '−2'], ['Abito o altro oggetto personale', '−4'],
      ['Parte del corpo, ciocca di capelli o pezzo di unghia', '−10']]}],
  'prismatic-spray': [{'titolo': 'Raggi prismatici', 'colonne': ['1d8', 'Raggio'], 'righe': righe_numerate('''
1 Rosso. Tiro salvezza fallito: 12d6 danni da fuoco. Tiro salvezza superato: la metà dei danni.
2 Arancione. Tiro salvezza fallito: 12d6 danni da acido. Tiro salvezza superato: la metà dei danni.
3 Giallo. Tiro salvezza fallito: 12d6 danni da fulmine. Tiro salvezza superato: la metà dei danni.
4 Verde. Tiro salvezza fallito: 12d6 danni da veleno. Tiro salvezza superato: la metà dei danni.
5 Blu. Tiro salvezza fallito: 12d6 danni da freddo. Tiro salvezza superato: la metà dei danni.
6 Indaco. Tiro salvezza fallito: il bersaglio è trattenuto ed effettua un tiro salvezza su Costituzione alla fine di ogni suo turno. Se lo supera per tre volte, pone fine alla condizione. Se fallisce per tre volte, resta pietrificato finché non viene liberato da un effetto come quello dell'incantesimo ristorare superiore. Non è necessario che i tiri superati o falliti siano consecutivi: si tiene semplicemente il conto di entrambi finché il bersaglio non ne accumula tre di un certo tipo.
7 Viola. Tiro salvezza fallito: il bersaglio è accecato ed effettua un tiro salvezza su Saggezza all'inizio del turno successivo dell'incantatore. Se lo supera, non è più accecato. Se lo fallisce, non è più accecato e viene teletrasportato su un altro piano di esistenza (a scelta del GM).
8 Speciale. Il bersaglio viene colpito da due raggi. Si tira altre due volte, rilanciando i dadi se il risultato ottenuto è 8.''')}],
  'prismatic-wall': [{'titolo': 'Strati prismatici', 'colonne': ['Ordine', 'Effetti'], 'righe': righe_numerate('''
1 Rosso. Tiro salvezza fallito: 12d6 danni da fuoco. Tiro salvezza superato: la metà dei danni. Effetti aggiuntivi: gli attacchi a distanza non magici non possono attraversare questo strato, che viene distrutto se subisce almeno 25 danni da freddo.
2 Arancione. Tiro salvezza fallito: 12d6 danni da acido. Tiro salvezza superato: la metà dei danni. Effetti aggiuntivi: gli attacchi a distanza magici non possono attraversare questo strato, che viene distrutto da un vento forte (come quello creato da folata di vento).
3 Giallo. Tiro salvezza fallito: 12d6 danni da fulmine. Tiro salvezza superato: la metà dei danni. Effetti aggiuntivi: questo strato viene distrutto se subisce almeno 60 danni da forza.
4 Verde. Tiro salvezza fallito: 12d6 danni da veleno. Tiro salvezza superato: la metà dei danni. Effetti aggiuntivi: un incantesimo passapareti o un altro incantesimo di livello pari o superiore che è in grado di aprire un portale su una superficie solida, distrugge questo strato.
5 Blu. Tiro salvezza fallito: 12d6 danni da freddo. Tiro salvezza superato: la metà dei danni. Effetti aggiuntivi: questo strato viene distrutto se subisce almeno 25 danni da fuoco.
6 Indaco. Tiro salvezza fallito: il bersaglio è trattenuto ed effettua un tiro salvezza su Costituzione alla fine di ogni suo turno. Se lo supera per tre volte, pone fine alla condizione. Se fallisce per tre volte, resta pietrificato finché non viene liberato da un effetto come quello dell'incantesimo ristorare superiore. Non è necessario che i tiri superati o falliti siano consecutivi: si tiene semplicemente il conto di entrambi finché il bersaglio non ne accumula tre di un certo tipo. Effetti aggiuntivi: non è possibile lanciare incantesimi attraverso questo strato, che viene distrutto dalla luce intensa emanata dall'incantesimo luce diurna.
7 Viola. Tiro salvezza fallito: il bersaglio è accecato ed effettua un tiro salvezza su Saggezza all'inizio del turno successivo dell'incantatore. Se lo supera, non è più accecato. Se lo fallisce, non è più accecato e viene teletrasportato su un altro piano di esistenza (a scelta del GM). Effetti aggiuntivi: questo strato viene distrutto da dissolvi magie.''')}],
  'teleport': [{'titolo': 'Risultato del teletrasporto', 'colonne': ['Familiarità', 'Errore', 'Area simile', 'Fuori bersaglio', 'Sul bersaglio'], 'righe': [
    ['Cerchio permanente', '—', '—', '—', '01–00'], ['Oggetto collegato', '—', '—', '—', '01–00'],
    ['Molto familiare', '01–05', '06–13', '14–24', '25–00'], ['Visto occasionalmente', '01–33', '34–43', '44–53', '54–00'],
    ['Visto una volta o descritto', '01–43', '44–53', '54–73', '74–00'], ['Falsa destinazione', '01–50', '51–00', '—', '—']]}],
}
if __name__ == '__main__':
    import sys
    json.dump(T, open(sys.argv[1], 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(len(T), 'incantesimi con tabelle')
