// Personaggi pronti (idea 12, decisa da Patrizio il 23/11/2026): uno per classe, distinti dai personaggi di prova.
// Solo contenuti SRD 5.2; serie standard consigliata per la classe (p. 21) e bonus del background sulle caratteristiche
// principali; nomi e frasi nostri, con il tono DomusDraconis. Nascono al livello del tavolo (1-5): dal 2° in poi le
// scelte di ogni livello si fanno come in «Sali di livello», con le preferenze scritte qui sotto e i PF fissi.
import { DATI } from '../regole';
import type { Dati } from '../regole/dati';
import { SERIE_PER_CLASSE } from '../regole/dati/base';
import type { Car, Id } from '../regole/tipi';
import { bozzaNuova, riempi, type Scelte } from './nuovo-livello';
import { bozzaVuota, type Bozza } from './percorso';

export interface Predefinito {
  id: Id;
  nome: string;
  frase: string;                                  // l'idea, in una frase
  classe: Id; specie: Id; background: Id;
  bonus: Partial<Record<Car, number>>;            // bonus del background (+2 e +1)
  allineamento: Id;
  scelte: Record<Id, Id[]>;                       // scelte del 1° livello
  preparati?: Record<Id, Id[]>;
  libro?: Id[];
  ruolo: NonNullable<Bozza['ruolo']>;
  livelli: Record<number, Scelte>;                // preferenze per le tendine di «Sali di livello», dal 2° al 5°
}

const asi = (a: Car, b: Car): Scelte => ({ 'scelta:talento-4': ['ability-score-improvement'], 'scelta:ability-score-improvement.aumento': [a, b] });

export const PREDEFINITI: Predefinito[] = [
  {
    id: 'brannoc', nome: 'Brannoc Spaccapietra', classe: 'barbarian', specie: 'goliath', background: 'soldier', allineamento: 'chaotic-good',
    frase: 'Ha lasciato le cime per inseguire la tempesta che gli ha portato via il clan; quando la rabbia sale, la sente ancora tuonare.',
    bonus: { FOR: 2, COS: 1 },
    scelte: { 'goliath.antenato': ['stones-endurance'], 'origine.lingue': ['giant', 'dwarvish'], 'barbarian.abilita': ['perception', 'survival'],
      'barbarian.maestria-armi': ['greataxe', 'handaxe'], 'soldier.gioco': ['dice'] },
    ruolo: { aspetto: 'Pelle grigia come ardesia, segnata da linee scure; più alto di chiunque nella stanza.', trattoVisibile: 'Parla poco e sottovoce, come chi ha paura di svegliare qualcosa.',
      oggetto: 'Una scheggia di pietra del suo villaggio, legata al collo con un laccio di cuoio.', segreto: 'Non sa se la tempesta l\'abbia mandata qualcuno.' },
    livelli: { 3: { 'scelta:barbarian.conoscenza': ['intimidation'] }, 4: { ...asi('FOR', 'COS'), 'scelta:barbarian.padronanza-4': ['javelin'] } },
  },
  {
    id: 'serafina', nome: 'Serafina Vetrolume', classe: 'bard', specie: 'tiefling', background: 'acolyte', allineamento: 'chaotic-good',
    frase: 'Cantava gli inni del tempio, finché non scoprì che le canzoni proibite piacevano di più a chi ascoltava.',
    bonus: { CAR: 2, INT: 1 },
    scelte: { 'tiefling.eredita': ['infernal'], 'tiefling.caratteristica': ['CAR'], 'origine.lingue': ['elvish', 'halfling'],
      'bard.abilita': ['performance', 'persuasion', 'deception'], 'bard.strumenti': ['lute', 'lyre', 'flute'], 'bard.equip.strumento': ['lute'],
      'bard.trucchetti': ['vicious-mockery', 'minor-illusion'],
      'magic-initiate.caratteristica': ['CAR'], 'magic-initiate.trucchetti': ['light', 'spare-the-dying'], 'magic-initiate.incantesimo1': ['bless'] },
    preparati: { bard: ['healing-word', 'charm-person', 'dissonant-whispers', 'sleep'] },
    ruolo: { aspetto: 'Corna sottili ornate di anelli d\'ottone, occhi d\'oro fuso, la veste del tempio tagliata e ricucita in colori vivaci.',
      trattoVisibile: 'Accorda il liuto ogni volta che è nervosa.', oggetto: 'Un libro di inni con le pagine riscritte a margine, in rima.',
      segreto: 'Una delle canzoni proibite parla di lei, ed è stata scritta prima che nascesse.' },
    livelli: { 2: { 'scelta:bard.maestria': ['performance', 'persuasion'], 'preparati:bard': ['faerie-fire'] },
      3: { 'scelta:bard.competenze-bonus': ['history', 'stealth', 'sleight-of-hand'], 'preparati:bard': ['shatter'] },
      4: { ...asi('CAR', 'DES'), 'trucchetti:bard.trucchetti': ['mage-hand'], 'preparati:bard': ['invisibility'] },
      5: { 'preparati:bard': ['hypnotic-pattern', 'dispel-magic'] } },
  },
  {
    id: 'edda', nome: 'Edda Cuordiroccia', classe: 'cleric', specie: 'dwarf', background: 'acolyte', allineamento: 'lawful-good',
    frase: 'Custode di un santuario scavato nella montagna: porta la luce dove le gallerie hanno dimenticato il sole.',
    bonus: { SAG: 2, CAR: 1 },
    scelte: { 'origine.lingue': ['dwarvish', 'giant'], 'cleric.abilita': ['medicine', 'persuasion'], 'cleric.ordine-divino': ['protector'],
      'cleric.trucchetti': ['guidance', 'sacred-flame', 'thaumaturgy'],
      'magic-initiate.caratteristica': ['SAG'], 'magic-initiate.trucchetti': ['light', 'spare-the-dying'], 'magic-initiate.incantesimo1': ['sanctuary'] },
    // niente Benedizione né Cura ferite: dal 3° livello li dà il Dominio della vita, sempre preparati
    preparati: { cleric: ['healing-word', 'guiding-bolt', 'shield-of-faith', 'detect-magic'] },
    ruolo: { aspetto: 'Treccia color rame raccolta sotto l\'elmo, mani da minatore, una lanterna sempre accesa alla cintura.',
      trattoVisibile: 'Benedice ogni porta prima di attraversarla.', oggetto: 'Il simbolo sacro del santuario, intagliato in una pietra che brilla al buio.',
      segreto: 'Il santuario è stato chiuso dall\'interno, e lei non sa da chi.' },
    livelli: { 2: { 'preparati:cleric': ['command'] }, 3: { 'preparati:cleric': ['spiritual-weapon'] },
      4: { ...asi('SAG', 'COS'), 'trucchetti:cleric.trucchetti': ['resistance'], 'preparati:cleric': ['prayer-of-healing'] },
      5: { 'preparati:cleric': ['spirit-guardians', 'dispel-magic'] } },
  },
  {
    id: 'ilvaren', nome: 'Ilvaren Foglianera', classe: 'druid', specie: 'elf', background: 'sage', allineamento: 'neutral',
    frase: 'Ha letto ogni erbario della biblioteca; poi ha capito che il bosco ne racconta di più, e non usa l\'inchiostro.',
    bonus: { SAG: 2, COS: 1 },
    scelte: { 'elf.lignaggio': ['wood-elf'], 'elf.caratteristica': ['SAG'], 'elf.sensi-acuti': ['perception'], 'origine.lingue': ['elvish', 'gnomish'],
      'druid.abilita': ['nature', 'medicine'], 'druid.ordine-primordiale': ['warden'], 'druid.trucchetti': ['produce-flame', 'guidance'],
      'magic-initiate.caratteristica': ['SAG'], 'magic-initiate.trucchetti': ['mage-hand', 'minor-illusion'], 'magic-initiate.incantesimo1': ['shield'] },
    preparati: { druid: ['healing-word', 'entangle', 'goodberry', 'thunderwave'] },
    ruolo: { aspetto: 'Capelli neri intrecciati di foglie secche, dita macchiate di linfa, un mantello che odora di muschio.',
      trattoVisibile: 'Annota il nome di ogni pianta che incontra, anche quando c\'è da combattere.', oggetto: 'Un erbario rilegato in corteccia, con una pagina sempre vuota.',
      segreto: 'Un albero della foresta pronuncia il suo nome quando lei dorme.' },
    livelli: { 2: { 'scelta:druid.forme': ['wolf', 'riding-horse', 'spider', 'cat'], 'preparati:druid': ['faerie-fire'] },
      3: { 'scelta:druid.terra': ['temperate'], 'preparati:druid': ['moonbeam'] },
      4: { ...asi('SAG', 'COS'), 'scelta:druid.forme-4': ['black-bear', 'ape'], 'trucchetti:druid.trucchetti': ['shillelagh'], 'preparati:druid': ['barkskin'] },
      5: { 'preparati:druid': ['call-lightning', 'conjure-animals'] } },
  },
  {
    id: 'marzio', nome: 'Marzio Ferrante', classe: 'fighter', specie: 'human', background: 'soldier', allineamento: 'lawful-neutral',
    frase: 'Veterano di una guerra che nessuno ricorda più: tiene la lama affilata per abitudine e la parola data per orgoglio.',
    bonus: { FOR: 2, COS: 1 },
    scelte: { 'origine.lingue': ['dwarvish', 'orc'], 'human.abile': ['perception'], 'human.versatile': ['alert'], 'fighter.abilita': ['acrobatics', 'survival'],
      'fighter.stile': ['great-weapon-fighting'], 'fighter.maestria-armi': ['greatsword', 'flail', 'javelin'], 'soldier.gioco': ['dragonchess'] },
    ruolo: { aspetto: 'Brizzolato, una cicatrice che gli taglia il sopracciglio, la cotta di maglia lucidata ogni sera.',
      trattoVisibile: 'Conta i passi quando cammina, come in marcia.', oggetto: 'La medaglia di un reggimento sciolto, con il nastro consumato.',
      segreto: 'Il generale che servì vive ancora, sotto un altro nome.' },
    livelli: { 4: { ...asi('FOR', 'COS'), 'scelta:fighter.padronanza-4': ['longsword'] } },
  },
  {
    id: 'ushra', nome: 'Ushra la Silenziosa', classe: 'monk', specie: 'orc', background: 'criminal', allineamento: 'neutral-good',
    frase: 'Rubava per fame; un vecchio maestro le insegnò che anche la fame si può domare, e che un pugno chiuso è una preghiera.',
    bonus: { DES: 2, COS: 1 },
    scelte: { 'origine.lingue': ['orc', 'giant'], 'monk.abilita': ['acrobatics', 'insight'], 'monk.strumento': ['flute'] },
    ruolo: { aspetto: 'Zanne limate e testa rasata, il corpo sottile coperto di bende di lino.', trattoVisibile: 'Non fa rumore quando entra in una stanza: se ne accorgono tutti dopo.',
      oggetto: 'Il flauto di canna del suo maestro, che non ha mai imparato a suonare bene.', segreto: 'Deve ancora restituire l\'ultima cosa che ha rubato.' },
    livelli: { 4: asi('DES', 'SAG') },
  },
  {
    id: 'vharok', nome: 'Vharok Scagliadoro', classe: 'paladin', specie: 'dragonborn', background: 'soldier', allineamento: 'lawful-good',
    frase: 'Ha giurato davanti alle ceneri del suo villaggio: nessun altro brucerà, finché lui resta in piedi.',
    bonus: { FOR: 2, COS: 1 },
    scelte: { 'dragonborn.antenato': ['gold'], 'origine.lingue': ['draconic', 'dwarvish'], 'paladin.abilita': ['insight', 'persuasion'],
      'paladin.maestria-armi': ['longsword', 'javelin'], 'soldier.gioco': ['three-dragon-ante'] },
    preparati: { paladin: ['bless', 'cure-wounds'] },
    ruolo: { aspetto: 'Scaglie d\'oro brunito, un corno spezzato, il mantello cremisi bruciato sull\'orlo.', trattoVisibile: 'Recita il suo giuramento a mezza voce prima di ogni battaglia.',
      oggetto: 'Un pugno di cenere in un sacchetto di cuoio, cucito al tabarro.', segreto: 'Il fuoco che distrusse il villaggio aveva il colore del suo soffio.' },
    livelli: { 2: { 'scelta:paladin.stile': ['defense'], 'preparati:paladin': ['divine-favor'] }, 3: { 'preparati:paladin': ['heroism'] },
      4: { ...asi('FOR', 'CAR'), 'preparati:paladin': ['command'] }, 5: { 'preparati:paladin': ['magic-weapon'] } },
  },
  {
    id: 'tamsin', nome: 'Tamsin Erbalunga', classe: 'ranger', specie: 'halfling', background: 'soldier', allineamento: 'neutral-good',
    frase: 'Conosce ogni sentiero tra le paludi e il confine: chi la segue arriva sempre, anche se non sempre per la strada più breve.',
    bonus: { DES: 2, COS: 1 },
    scelte: { 'origine.lingue': ['halfling', 'elvish'], 'ranger.abilita': ['perception', 'stealth', 'survival'], 'ranger.maestria-armi': ['longbow', 'shortsword'],
      'soldier.gioco': ['playing-cards'] },
    preparati: { ranger: ['cure-wounds', 'ensnaring-strike'] },
    ruolo: { aspetto: 'Riccioli castani sotto un cappuccio verde fango, piedi scalzi e callosi, un arco lungo più alto di lei.',
      trattoVisibile: 'Mastica sempre un filo d\'erba.', oggetto: 'Una mappa delle paludi disegnata a mano, piena di correzioni.',
      segreto: 'Nella palude c\'è un sentiero che non segna mai.' },
    livelli: { 2: { 'scelta:ranger.maestria': ['perception'], 'scelta:ranger.lingue': ['dwarvish', 'gnomish'], 'scelta:ranger.stile': ['archery'], 'preparati:ranger': ['fog-cloud'] },
      3: { 'scelta:ranger.preda': ['colossus-slayer'], 'preparati:ranger': ['goodberry'] },
      4: { ...asi('DES', 'SAG'), 'preparati:ranger': ['longstrider'] }, 5: { 'preparati:ranger': ['pass-without-trace'] } },
  },
  {
    id: 'nyssa', nome: 'Nyssa Ombrafonda', classe: 'rogue', specie: 'elf', background: 'criminal', allineamento: 'chaotic-neutral',
    frase: 'Le serrature le parlano, le persone un po\' meno; ma lei ascolta tutti, e non dimentica niente.',
    bonus: { DES: 2, INT: 1 },
    scelte: { 'elf.lignaggio': ['drow'], 'elf.caratteristica': ['INT'], 'elf.sensi-acuti': ['perception'], 'origine.lingue': ['dwarvish', 'goblin'],
      'rogue.abilita': ['acrobatics', 'deception', 'investigation', 'insight'], 'rogue.maestria': ['stealth', 'sleight-of-hand'], 'rogue.lingua': ['halfling'],
      'rogue.maestria-armi': ['dagger', 'shortsword'] },
    ruolo: { aspetto: 'Pelle color ossidiana, capelli bianchi corti, occhi che riflettono la luce come quelli di un gatto.',
      trattoVisibile: 'Fa girare una moneta tra le dita senza guardarla.', oggetto: 'Un mazzo di grimaldelli avvolto in un fazzoletto di seta.',
      segreto: 'Ha aperto una porta che nessuno doveva aprire, e qualcosa l\'ha vista.' },
    livelli: { 4: asi('DES', 'INT') },
  },
  {
    id: 'livia', nome: 'Livia Brace', classe: 'sorcerer', specie: 'human', background: 'acolyte', allineamento: 'neutral-good',
    frase: 'Le fiamme le sono nate in mano il giorno della sua iniziazione: i sacerdoti lo chiamano miracolo, lei non ne è così sicura.',
    bonus: { CAR: 2, SAG: 1 },
    scelte: { 'origine.lingue': ['draconic', 'elvish'], 'human.abile': ['perception'], 'human.versatile': ['alert'], 'sorcerer.abilita': ['arcana', 'persuasion'],
      'sorcerer.trucchetti': ['fire-bolt', 'sorcerous-burst', 'prestidigitation', 'light'],
      'magic-initiate.caratteristica': ['CAR'], 'magic-initiate.trucchetti': ['guidance', 'spare-the-dying'], 'magic-initiate.incantesimo1': ['cure-wounds'] },
    preparati: { sorcerer: ['burning-hands', 'shield'] },
    ruolo: { aspetto: 'Capelli rossi che sembrano muoversi da soli, mani fasciate per nascondere le bruciature, la veste bianca del tempio annerita sui polsini.',
      trattoVisibile: 'Le candele si accendono quando passa, e lei finge di non notarlo.', oggetto: 'Il velo dell\'iniziazione, bruciato a metà.',
      segreto: 'Di notte sogna un drago che la chiama «figlia».' },
    livelli: { 2: { 'scelta:sorcerer.metamagia': ['quickened-spell', 'twinned-spell'], 'preparati:sorcerer': ['magic-missile', 'thunderwave'] },   // Globo cromatico arriva dal 3° con la Stregoneria draconica
      3: { 'preparati:sorcerer': ['misty-step', 'scorching-ray'] },
      4: { ...asi('CAR', 'COS'), 'trucchetti:sorcerer.trucchetti': ['mage-hand'], 'preparati:sorcerer': ['shatter'] },
      5: { 'preparati:sorcerer': ['fireball', 'haste'] } },
  },
  {
    id: 'fenwick', nome: 'Fenwick Ceneretto', classe: 'warlock', specie: 'gnome', background: 'acolyte', allineamento: 'chaotic-neutral',
    frase: 'Cercava la voce degli dèi nei libri del tempio. Gli ha risposto qualcun altro, e ha una calligrafia elegantissima.',
    bonus: { CAR: 2, INT: 1 },
    scelte: { 'gnome.lignaggio': ['forest-gnome'], 'gnome.caratteristica': ['CAR'], 'origine.lingue': ['gnomish', 'goblin'], 'warlock.abilita': ['arcana', 'deception'],
      'warlock.suppliche': ['pact-of-the-chain'], 'warlock.trucchetti': ['eldritch-blast', 'prestidigitation'],
      'magic-initiate.caratteristica': ['CAR'], 'magic-initiate.trucchetti': ['guidance', 'light'], 'magic-initiate.incantesimo1': ['bless'] },
    preparati: { warlock: ['hex', 'charm-person'] },
    ruolo: { aspetto: 'Piccolo anche per uno gnomo, occhialetti tondi affumicati, inchiostro viola sulle dita e sulla punta del naso.',
      trattoVisibile: 'Risponde a domande che nessuno ha fatto ad alta voce.', oggetto: 'Un contratto firmato con una penna che non ha mai avuto inchiostro.',
      segreto: 'Il suo famiglio gli ha detto il nome vero del patrono. Lui ha fatto finta di non sentire.' },
    livelli: { 2: { 'scelta:warlock.suppliche-2': ['agonizing-blast', 'devils-sight'], 'preparati:warlock': ['hellish-rebuke'] },
      3: { 'preparati:warlock': ['misty-step'] },
      4: { ...asi('CAR', 'COS'), 'trucchetti:warlock.trucchetti': ['mage-hand'], 'preparati:warlock': ['hold-person'] },
      5: { 'scelta:warlock.suppliche-5': ['investment-of-the-chain-master', 'one-with-shadows'], 'preparati:warlock': ['counterspell'] } },
  },
  {
    id: 'elarion', nome: 'Elarion Vespertilio', classe: 'wizard', specie: 'elf', background: 'sage', allineamento: 'lawful-neutral',
    frase: 'Ha copiato a mano mille pagine proibite: ne ricorda ogni parola, e qualche parola, a volte, ricorda lui.',
    bonus: { INT: 2, COS: 1 },
    scelte: { 'elf.lignaggio': ['high-elf'], 'elf.caratteristica': ['INT'], 'elf.sensi-acuti': ['perception'], 'origine.lingue': ['elvish', 'draconic'],
      'wizard.abilita': ['investigation', 'insight'], 'wizard.trucchetti': ['fire-bolt', 'mage-hand', 'light'],
      'magic-initiate.caratteristica': ['INT'], 'magic-initiate.trucchetti': ['minor-illusion', 'shocking-grasp'], 'magic-initiate.incantesimo1': ['alarm'] },   // Individuazione del magico arriva dal 3° con l'alto elfo
    libro: ['mage-armor', 'shield', 'magic-missile', 'sleep', 'burning-hands', 'feather-fall'],
    preparati: { wizard: ['mage-armor', 'shield', 'magic-missile', 'sleep'] },
    ruolo: { aspetto: 'Alto e pallido, capelli argentati legati con un nastro d\'inchiostro, occhiali con una lente sola.',
      trattoVisibile: 'Corregge a mezza voce la pronuncia degli altri.', oggetto: 'Un libro degli incantesimi chiuso da una fibbia che nessun altro sa aprire.',
      segreto: 'Una delle pagine copiate non era vuota quando l\'ha comprata, e ora lo è.' },
    livelli: { 2: { 'scelta:wizard.studioso': ['arcana'], libro: ['thunderwave', 'ice-knife'], 'preparati:wizard': ['thunderwave'] },
      3: { libro: ['scorching-ray', 'shatter', 'misty-step', 'web'], 'preparati:wizard': ['scorching-ray'] },
      4: { ...asi('INT', 'COS'), 'trucchetti:wizard.trucchetti': ['ray-of-frost'], libro: ['invisibility', 'hold-person'], 'preparati:wizard': ['shatter'] },
      5: { libro: ['fireball', 'counterspell', 'haste'], 'preparati:wizard': ['fireball', 'counterspell'] } },
  },
];

// Il personaggio pronto al livello scelto, già salvato (si gioca subito; «Riapri la creazione» per cambiarlo)
export function creaPredefinito(p: Predefinito, livello = 1, ora = new Date(), d: Dati = DATI, tavolo?: Bozza['tavolo']): Bozza {
  const s = SERIE_PER_CLASSE[p.classe];
  let b: Bozza = {
    ...bozzaVuota(), nome: p.nome, idea: p.frase, allineamento: p.allineamento, ruolo: p.ruolo,
    classe: p.classe, specie: p.specie, background: p.background, bonusBackground: p.bonus,
    punteggi: { metodo: 'serieStandard', base: { FOR: s[0], DES: s[1], COS: s[2], INT: s[3], SAG: s[4], CAR: s[5] } },
    scelte: { ...p.scelte }, incantesimi: { preparati: { ...(p.preparati ?? {}) }, ...(p.libro ? { libro: [...p.libro] } : {}) },
    equipaggiamento: { classe: 'A', background: 'A' }, conclusoIl: ora.toISOString(), ...(tavolo ? { tavolo } : {}),
  };
  for (let n = 2; n <= livello; n++) b = bozzaNuova(b, riempi(b, p.livelli[n] ?? {}, d), null);
  return b;
}

// Quelli che un tavolo ammette (classi, specie e background non esclusi; la serie standard tra i metodi)
export function predefinitiPer(tavolo: Bozza['tavolo'] | undefined): Predefinito[] {
  if (!tavolo) return PREDEFINITI;
  const fuori = new Set(tavolo.fonti.escludi ?? []);
  return PREDEFINITI.filter((p) => !fuori.has(p.classe) && !fuori.has(p.specie) && !fuori.has(p.background) && tavolo.metodiPunteggi.includes('serieStandard'));
}

