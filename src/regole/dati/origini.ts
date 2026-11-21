// Background (p. 83) e talenti (pp. 87-88) dell'SRD 5.2.
import type { Background, Talento } from '../tipi';
import { TUTTE_LE_ABILITA } from './base';

export const BACKGROUND: Record<string, Background> = {
  acolyte: {
    id: 'acolyte', nome: 'Accolito', nomeEn: 'Acolyte', srd: { pagina: 83 },
    caratteristiche: ['INT', 'SAG', 'CAR'],
    talento: { talento: 'magic-initiate', parametri: { 'magic-initiate.lista': 'cleric' } },
    abilita: ['insight', 'religion'], strumento: 'calligraphers-supplies',
    equipaggiamento: {
      A: { oggetti: [{ oggetto: 'calligraphers-supplies', quantita: 1 }, { oggetto: 'book-prayers', quantita: 1 }, { oggetto: 'holy-symbol', quantita: 1 }, { oggetto: 'parchment', quantita: 10 }, { oggetto: 'robe', quantita: 1 }], mo: 8 },
      B: { oggetti: [], mo: 50 },
    },
  },
  criminal: {
    id: 'criminal', nome: 'Criminale', nomeEn: 'Criminal', srd: { pagina: 83 },
    caratteristiche: ['DES', 'COS', 'INT'],
    talento: { talento: 'alert' },
    abilita: ['sleight-of-hand', 'stealth'], strumento: 'thieves-tools',
    equipaggiamento: {
      A: { oggetti: [{ oggetto: 'dagger', quantita: 2 }, { oggetto: 'thieves-tools', quantita: 1 }, { oggetto: 'crowbar', quantita: 1 }, { oggetto: 'pouch', quantita: 2 }, { oggetto: 'travelers-clothes', quantita: 1 }], mo: 16 },
      B: { oggetti: [], mo: 50 },
    },
  },
  sage: {
    id: 'sage', nome: 'Sapiente', nomeEn: 'Sage', srd: { pagina: 83 },
    caratteristiche: ['COS', 'INT', 'SAG'],
    talento: { talento: 'magic-initiate', parametri: { 'magic-initiate.lista': 'wizard' } },
    abilita: ['arcana', 'history'], strumento: 'calligraphers-supplies',
    equipaggiamento: {
      A: { oggetti: [{ oggetto: 'quarterstaff', quantita: 1 }, { oggetto: 'calligraphers-supplies', quantita: 1 }, { oggetto: 'book-history', quantita: 1 }, { oggetto: 'parchment', quantita: 8 }, { oggetto: 'robe', quantita: 1 }], mo: 8 },
      B: { oggetti: [], mo: 50 },
    },
  },
  soldier: {
    id: 'soldier', nome: 'Soldato', nomeEn: 'Soldier', srd: { pagina: 83 },
    caratteristiche: ['FOR', 'DES', 'COS'],
    talento: { talento: 'savage-attacker' },
    abilita: ['athletics', 'intimidation'],
    // Un tipo di gioco (p. 83); varianti: dadi, scacchi dei draghi, carte, tre draghi (p. 94)
    strumento: { id: 'soldier.gioco', tipo: 'strumento', quantita: 1, opzioni: ['dice', 'dragonchess', 'playing-cards', 'three-dragon-ante'], srd: { pagina: 83 } },
    equipaggiamento: {
      A: { oggetti: [{ oggetto: 'spear', quantita: 1 }, { oggetto: 'shortbow', quantita: 1 }, { oggetto: 'arrows', quantita: 20 }, { oggetto: 'gaming-set', quantita: 1 }, { oggetto: 'healers-kit', quantita: 1 }, { oggetto: 'quiver', quantita: 1 }, { oggetto: 'travelers-clothes', quantita: 1 }], mo: 14 },
      B: { oggetti: [], mo: 50 },
    },
  },
};

export const TALENTI: Record<string, Talento> = {
  alert: {
    id: 'alert', nome: 'Allerta', nomeEn: 'Alert', srd: { pagina: 87 }, categoria: 'origine', ripetibile: false,
    effetti: [{ tipo: 'iniziativa', aggiungiCompetenza: true, etichetta: 'Allerta' },
      { tipo: 'nota', testo: 'Scambio di iniziativa con un alleato consenziente (SRD p. 87)' }],
  },
  'magic-initiate': {
    id: 'magic-initiate', nome: 'Iniziato alla magia', nomeEn: 'Magic Initiate', srd: { pagina: 87 }, categoria: 'origine',
    ripetibile: { condizione: 'listaDiversa' },
    effetti: [
      { tipo: 'scelta', scelta: { id: 'magic-initiate.lista', tipo: 'listaIncantesimi', quantita: 1, opzioni: ['cleric', 'druid', 'wizard'], srd: { pagina: 87 } } },
      { tipo: 'scelta', scelta: { id: 'magic-initiate.caratteristica', tipo: 'caratteristica', quantita: 1, opzioni: ['INT', 'SAG', 'CAR'], srd: { pagina: 87 } } },
      { tipo: 'scelta', scelta: { id: 'magic-initiate.trucchetti', tipo: 'trucchetto', quantita: 2, filtro: { lista: { daScelta: 'magic-initiate.lista' }, livello: 0 }, srd: { pagina: 87 } } },
      { tipo: 'scelta', scelta: { id: 'magic-initiate.incantesimo1', tipo: 'incantesimo', quantita: 1, filtro: { lista: { daScelta: 'magic-initiate.lista' }, livello: 1 }, srd: { pagina: 87 } } },
      { tipo: 'magia', concessione: {
        id: 'magic-initiate', nome: 'Talento: Iniziato alla magia', fonte: { tipo: 'talento', id: 'magic-initiate' },
        lista: { daScelta: 'magic-initiate.lista' }, caratteristica: { daScelta: 'magic-initiate.caratteristica' },
        trucchetti: { quantita: 2, scelta: 'magic-initiate.trucchetti' },
        incantesimiScelti: { scelta: 'magic-initiate.incantesimo1' },
        lanciGratuiti: { incantesimi: 'scelti', usi: 1, recupero: 'lungo' },
        puoUsareSlot: true,
        cambio: { quando: 'livello', quanti: 1, srd: { pagina: 87 } },
        srd: { pagina: 87 } } },
    ],
  },
  'savage-attacker': {
    id: 'savage-attacker', nome: 'Aggressore selvaggio', nomeEn: 'Savage Attacker', srd: { pagina: 87 }, categoria: 'origine', ripetibile: false,
    effetti: [{ tipo: 'nota', testo: 'Una volta per turno tiri due volte i dadi dei danni dell\'arma e scegli (SRD p. 87)' }],
  },
  skilled: {
    id: 'skilled', nome: 'Abile', nomeEn: 'Skilled', srd: { pagina: 87 }, categoria: 'origine', ripetibile: {},
    effetti: [{ tipo: 'scelta', scelta: { id: 'skilled.competenze', tipo: 'abilita', quantita: 3, opzioni: TUTTE_LE_ABILITA, srd: { pagina: 87 } } }],
  },
  'ability-score-improvement': {
    id: 'ability-score-improvement', nome: 'Aumento dei punteggi di caratteristica', nomeEn: 'Ability Score Improvement', srd: { pagina: 87 },
    categoria: 'generale', prerequisito: { livello: 4 }, ripetibile: {}, effetti: [],
  },
  grappler: {
    id: 'grappler', nome: 'Lottatore', nomeEn: 'Grappler', srd: { pagina: 87 }, categoria: 'generale', prerequisito: { livello: 4 }, ripetibile: false, effetti: [],
  },
  archery: {
    id: 'archery', nome: 'Tiro', nomeEn: 'Archery', srd: { pagina: 87 }, categoria: 'stileCombattimento', prerequisito: { feature: 'fighting-style' }, ripetibile: false,
    effetti: [{ tipo: 'nota', testo: '+2 ai tiri per colpire con armi a distanza' }],
  },
  defense: {
    id: 'defense', nome: 'Difesa', nomeEn: 'Defense', srd: { pagina: 88 }, categoria: 'stileCombattimento', prerequisito: { feature: 'fighting-style' }, ripetibile: false,
    effetti: [{ tipo: 'bonusCA', valore: 1, condizione: 'conArmatura', etichetta: 'Difesa' }],
  },
  'great-weapon-fighting': {
    id: 'great-weapon-fighting', nome: 'Combattere con armi possenti', nomeEn: 'Great Weapon Fighting', srd: { pagina: 88 }, categoria: 'stileCombattimento', prerequisito: { feature: 'fighting-style' }, ripetibile: false,
    effetti: [{ tipo: 'nota', testo: 'Con armi a due mani o versatili impugnate a due mani, gli 1 e 2 sui dadi dei danni contano come 3' }],
  },
  'two-weapon-fighting': {
    id: 'two-weapon-fighting', nome: 'Combattere con due armi', nomeEn: 'Two-Weapon Fighting', srd: { pagina: 88 }, categoria: 'stileCombattimento', prerequisito: { feature: 'fighting-style' }, ripetibile: false,
    effetti: [{ tipo: 'nota', testo: 'Aggiungi il modificatore ai danni dell\'attacco extra con l\'arma leggera' }],
  },
};
// I 7 doni epici (p. 88) richiedono il livello 19: arrivano con i livelli oltre il primo (sezione 7).
