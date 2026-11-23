// Le 12 classi dell'SRD 5.2: il 1° livello e, dal 23/11, il 2° (aumento di livello, in fondo al file).
import type { Classe, ConcessioneMagia, Effetto, Feature, Scelta } from '../tipi';
import { ARMI, LINGUE_RARE, LINGUE_STANDARD, STRUMENTI_ARTIGIANO, STRUMENTI_MUSICALI, TUTTE_LE_ABILITA } from './base';

const abilita = (id: string, quantita: number, opzioni: string[], pagina: number): Scelta =>
  ({ id: `${id}.abilita`, tipo: 'abilita', quantita, opzioni, srd: { pagina } });
// Padronanza d'armi: quali armi si possono scegliere dipende dalla classe (p. 29, 48, 54, 58, 62)
type FiltroArmi = 'tutte' | 'mischia' | 'ladro';
const armiAmmesse = (f: FiltroArmi) => Object.entries(ARMI).filter(([, a]) =>
  f === 'tutte' || (f === 'mischia' && a.tipo === 'mischia')
  || (f === 'ladro' && (a.categoria === 'semplice' || a.proprieta.includes('accurata') || a.proprieta.includes('leggera')))).map(([id]) => id);
const maestriaArmi = (id: string, quantita: number, pagina: number, filtro: FiltroArmi = 'tutte'): Effetto =>
  ({ tipo: 'scelta', scelta: { id: `${id}.maestria-armi`, tipo: 'maestriaArma', quantita, opzioni: armiAmmesse(filtro), srd: { pagina } } });
const slot1 = { 1: [2] };

export const CLASSI: Record<string, Classe> = {
  barbarian: {
    id: 'barbarian', nome: 'Barbaro', nomeEn: 'Barbarian', srd: { pagina: 28 },
    dadoVita: 12, tiriSalvezza: ['FOR', 'COS'],
    abilita: abilita('barbarian', 2, ['animal-handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'], 28),
    addestramentoArmature: ['leggera', 'media', 'scudo'],
    addestramentoArmi: ['semplici', 'marziali'],
    equipaggiamento: {
      A: { oggetti: [{ oggetto: 'greataxe', quantita: 1 }, { oggetto: 'handaxe', quantita: 4 }, { oggetto: 'explorers-pack', quantita: 1 }], mo: 15 },
      B: { oggetti: [], mo: 75 },
    },
    features: [
      { id: 'rage', nome: 'Ira', nomeEn: 'Rage', livello: 1, srd: { pagina: 28 }, effetti: [
        { tipo: 'risorsa', risorsa: { id: 'rage', nome: 'Ira', usi: 2, dettaglio: 'danni dell\'Ira +2; non con armatura pesante',
          recupero: [{ riposo: 'breve', quanti: 1 }, { riposo: 'lungo', quanti: 'tutti' }], srd: { pagina: 28 } } },
        { tipo: 'valoreClasse', id: 'rage-damage', nome: 'Danni dell\'Ira', valore: '+2', srd: { pagina: 28 } },
      ] },
      { id: 'barbarian-unarmored-defense', nome: 'Difesa senza armatura', nomeEn: 'Unarmored Defense', livello: 1, srd: { pagina: 29 }, effetti: [
        { tipo: 'formulaCA', formula: { id: 'difesa-senza-armatura-barbaro', nome: 'Difesa senza armatura', base: 10, caratteristiche: ['DES', 'COS'], richiede: 'nessunaArmatura', srd: { pagina: 29 } } },
      ] },
      { id: 'barbarian-weapon-mastery', nome: 'Padronanza d\'armi', nomeEn: 'Weapon Mastery', livello: 1, srd: { pagina: 29 }, effetti: [maestriaArmi('barbarian', 2, 29, 'mischia')] },
    ],
  },

  bard: {
    id: 'bard', nome: 'Bardo', nomeEn: 'Bard', srd: { pagina: 31 },
    dadoVita: 8, tiriSalvezza: ['DES', 'CAR'],
    abilita: abilita('bard', 3, TUTTE_LE_ABILITA, 31),
    addestramentoArmature: ['leggera'],
    addestramentoArmi: ['semplici'],
    equipaggiamento: {
      A: { oggetti: [{ oggetto: 'leather-armor', quantita: 1 }, { oggetto: 'dagger', quantita: 2 }, { oggetto: 'musical-instrument', quantita: 1 }, { oggetto: 'entertainers-pack', quantita: 1 }], mo: 19 },
      B: { oggetti: [], mo: 90 },
    },
    slot: slot1,
    features: [
      { id: 'bardic-inspiration', nome: 'Ispirazione bardica', nomeEn: 'Bardic Inspiration', livello: 1, srd: { pagina: 31 }, effetti: [
        { tipo: 'risorsa', risorsa: { id: 'bardic-inspiration', nome: 'Ispirazione bardica', usi: { mod: 'CAR', minimo: 1 }, dettaglio: 'd6',
          recupero: [{ riposo: 'lungo', quanti: 'tutti' }], srd: { pagina: 32 } } },
      ] },
      { id: 'bard-spellcasting', nome: 'Incantesimi', nomeEn: 'Spellcasting', livello: 1, srd: { pagina: 32 }, effetti: [
        { tipo: 'scelta', scelta: { id: 'bard.strumenti', tipo: 'strumento', quantita: 3, opzioni: Object.keys(STRUMENTI_MUSICALI), srd: { pagina: 31 } } },
        { tipo: 'magia', concessione: {
          id: 'bard', nome: 'Classe: Bardo', fonte: { tipo: 'classe', id: 'bard' }, lista: 'bard', caratteristica: 'CAR',
          trucchetti: { quantita: 2, scelta: 'bard.trucchetti' }, preparati: { numero: 4, da: 'lista' },
          puoUsareSlot: true, slot: 'normali',
          cambio: { quando: 'livello', quanti: 1, srd: { pagina: 32 } }, cambioTrucchetti: { quando: 'livello', quanti: 1, srd: { pagina: 32 } },
          srd: { pagina: 32 } } },
      ] },
    ],
  },

  cleric: {
    id: 'cleric', nome: 'Chierico', nomeEn: 'Cleric', srd: { pagina: 36 },
    dadoVita: 8, tiriSalvezza: ['SAG', 'CAR'],
    abilita: abilita('cleric', 2, ['history', 'insight', 'medicine', 'persuasion', 'religion'], 36),
    addestramentoArmature: ['leggera', 'media', 'scudo'],
    addestramentoArmi: ['semplici'],
    equipaggiamento: {
      A: { oggetti: [{ oggetto: 'chain-shirt', quantita: 1 }, { oggetto: 'shield', quantita: 1 }, { oggetto: 'mace', quantita: 1 }, { oggetto: 'holy-symbol', quantita: 1 }, { oggetto: 'priests-pack', quantita: 1 }], mo: 7 },
      B: { oggetti: [], mo: 110 },
    },
    slot: slot1,
    features: [
      { id: 'cleric-spellcasting', nome: 'Incantesimi', nomeEn: 'Spellcasting', livello: 1, srd: { pagina: 36 }, effetti: [
        { tipo: 'magia', concessione: {
          id: 'cleric', nome: 'Classe: Chierico', fonte: { tipo: 'classe', id: 'cleric' }, lista: 'cleric', caratteristica: 'SAG',
          trucchetti: { quantita: 3, scelta: 'cleric.trucchetti' }, preparati: { numero: 4, da: 'lista' },
          puoUsareSlot: true, slot: 'normali',
          cambio: { quando: 'riposoLungo', quanti: 'tutti', srd: { pagina: 37 } }, cambioTrucchetti: { quando: 'livello', quanti: 1, srd: { pagina: 36 } },
          srd: { pagina: 36 } } },
      ] },
      { id: 'divine-order', nome: 'Ordine divino', nomeEn: 'Divine Order', livello: 1, srd: { pagina: 37 }, effetti: [
        { tipo: 'opzioni', scelta: { id: 'cleric.ordine-divino', tipo: 'opzione', quantita: 1, opzioni: ['protector', 'thaumaturge'], srd: { pagina: 37 } }, effetti: {
          protector: [
            { tipo: 'competenza', categoria: 'armi', ids: ['marziali'] },
            { tipo: 'competenza', categoria: 'armature', ids: ['pesante'] },
          ],
          thaumaturge: [
            { tipo: 'trucchettiExtra', concessione: 'cleric', quantita: 1, etichetta: 'Taumaturgo' },
            { tipo: 'bonusAbilita', abilita: ['arcana', 'religion'], valore: { mod: 'SAG', minimo: 1 }, etichetta: 'Taumaturgo' },
          ],
        } },
      ] },
    ],
  },

  druid: {
    id: 'druid', nome: 'Druido', nomeEn: 'Druid', srd: { pagina: 41 },
    dadoVita: 8, tiriSalvezza: ['INT', 'SAG'],
    abilita: abilita('druid', 2, ['animal-handling', 'arcana', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'], 41),
    addestramentoArmature: ['leggera', 'scudo'],
    addestramentoArmi: ['semplici'],
    equipaggiamento: {
      A: { oggetti: [{ oggetto: 'leather-armor', quantita: 1 }, { oggetto: 'shield', quantita: 1 }, { oggetto: 'sickle', quantita: 1 }, { oggetto: 'druidic-focus-quarterstaff', quantita: 1 }, { oggetto: 'explorers-pack', quantita: 1 }, { oggetto: 'herbalism-kit', quantita: 1 }], mo: 9 },
      B: { oggetti: [], mo: 50 },
    },
    slot: slot1,
    features: [
      { id: 'druid-spellcasting', nome: 'Incantesimi', nomeEn: 'Spellcasting', livello: 1, srd: { pagina: 41 }, effetti: [
        { tipo: 'competenza', categoria: 'strumento', ids: ['herbalism-kit'] },
        { tipo: 'magia', concessione: {
          id: 'druid', nome: 'Classe: Druido', fonte: { tipo: 'classe', id: 'druid' }, lista: 'druid', caratteristica: 'SAG',
          trucchetti: { quantita: 2, scelta: 'druid.trucchetti' }, preparati: { numero: 4, da: 'lista' },
          semprePreparati: ['speak-with-animals'],   // Druidico, p. 42
          puoUsareSlot: true, slot: 'normali',
          cambio: { quando: 'riposoLungo', quanti: 'tutti', srd: { pagina: 42 } }, cambioTrucchetti: { quando: 'livello', quanti: 1, srd: { pagina: 42 } },
          srd: { pagina: 41 } } },
      ] },
      { id: 'druidic', nome: 'Druidico', nomeEn: 'Druidic', livello: 1, srd: { pagina: 42 }, effetti: [
        { tipo: 'lingua', ids: ['druidic'] },
        { tipo: 'nota', testo: 'Conosci il Druidico; Parlare con gli animali sempre preparato (SRD p. 42)' },
      ] },
      { id: 'primal-order', nome: 'Ordine primordiale', nomeEn: 'Primal Order', livello: 1, srd: { pagina: 42 }, effetti: [
        { tipo: 'opzioni', scelta: { id: 'druid.ordine-primordiale', tipo: 'opzione', quantita: 1, opzioni: ['magician', 'warden'], srd: { pagina: 42 } }, effetti: {
          magician: [
            { tipo: 'trucchettiExtra', concessione: 'druid', quantita: 1, etichetta: 'Mago (Ordine primordiale)' },
            { tipo: 'bonusAbilita', abilita: ['arcana', 'nature'], valore: { mod: 'SAG', minimo: 1 }, etichetta: 'Mago (Ordine primordiale)' },
          ],
          warden: [
            { tipo: 'competenza', categoria: 'armi', ids: ['marziali'] },
            { tipo: 'competenza', categoria: 'armature', ids: ['media'] },
          ],
        } },
      ] },
    ],
  },

  fighter: {
    id: 'fighter', nome: 'Guerriero', nomeEn: 'Fighter', srd: { pagina: 47 },
    dadoVita: 10, tiriSalvezza: ['FOR', 'COS'],
    abilita: abilita('fighter', 2, ['acrobatics', 'animal-handling', 'athletics', 'history', 'insight', 'intimidation', 'persuasion', 'perception', 'survival'], 47),
    addestramentoArmature: ['leggera', 'media', 'pesante', 'scudo'],
    addestramentoArmi: ['semplici', 'marziali'],
    equipaggiamento: {
      A: { oggetti: [{ oggetto: 'chain-mail', quantita: 1 }, { oggetto: 'greatsword', quantita: 1 }, { oggetto: 'flail', quantita: 1 }, { oggetto: 'javelin', quantita: 8 }, { oggetto: 'dungeoneers-pack', quantita: 1 }], mo: 4 },
      B: { oggetti: [{ oggetto: 'studded-leather-armor', quantita: 1 }, { oggetto: 'scimitar', quantita: 1 }, { oggetto: 'shortsword', quantita: 1 }, { oggetto: 'longbow', quantita: 1 }, { oggetto: 'arrows', quantita: 20 }, { oggetto: 'quiver', quantita: 1 }, { oggetto: 'dungeoneers-pack', quantita: 1 }], mo: 11 },
      C: { oggetti: [], mo: 155 },
    },
    features: [
      { id: 'fighting-style', nome: 'Stile di combattimento', nomeEn: 'Fighting Style', livello: 1, srd: { pagina: 47 }, effetti: [
        { tipo: 'scelta', scelta: { id: 'fighter.stile', tipo: 'talento', quantita: 1, filtro: { categoriaTalento: 'stileCombattimento' }, srd: { pagina: 47 } } },
        { tipo: 'talento', talento: { daScelta: 'fighter.stile' } },
      ] },
      { id: 'second-wind', nome: 'Recuperare energie', nomeEn: 'Second Wind', livello: 1, srd: { pagina: 48 }, effetti: [
        { tipo: 'risorsa', risorsa: { id: 'second-wind', nome: 'Recuperare energie', usi: 2, dettaglio: '1d10 + livello da guerriero',
          recupero: [{ riposo: 'breve', quanti: 1 }, { riposo: 'lungo', quanti: 'tutti' }], srd: { pagina: 48 } } },
      ] },
      { id: 'fighter-weapon-mastery', nome: 'Padronanza d\'armi', nomeEn: 'Weapon Mastery', livello: 1, srd: { pagina: 48 }, effetti: [maestriaArmi('fighter', 3, 48)] },
    ],
  },

  monk: {
    id: 'monk', nome: 'Monaco', nomeEn: 'Monk', srd: { pagina: 49 },
    dadoVita: 8, tiriSalvezza: ['FOR', 'DES'],
    abilita: abilita('monk', 2, ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'], 49),
    addestramentoArmature: [],
    addestramentoArmi: ['semplici', 'marzialiLeggere'],
    equipaggiamento: {
      A: { oggetti: [{ oggetto: 'spear', quantita: 1 }, { oggetto: 'dagger', quantita: 5 }, { oggetto: 'artisans-tools-or-instrument', quantita: 1 }, { oggetto: 'explorers-pack', quantita: 1 }], mo: 11 },
      B: { oggetti: [], mo: 50 },
    },
    features: [
      { id: 'martial-arts', nome: 'Arti marziali', nomeEn: 'Martial Arts', livello: 1, srd: { pagina: 50 }, effetti: [
        { tipo: 'scelta', scelta: { id: 'monk.strumento', tipo: 'strumento', quantita: 1, opzioni: [...Object.keys(STRUMENTI_ARTIGIANO), ...Object.keys(STRUMENTI_MUSICALI)], srd: { pagina: 49 } } },
        { tipo: 'valoreClasse', id: 'martial-arts-die', nome: 'Dado delle Arti marziali', valore: '1d6', srd: { pagina: 50 } },
      ] },
      { id: 'monk-unarmored-defense', nome: 'Difesa senza armatura', nomeEn: 'Unarmored Defense', livello: 1, srd: { pagina: 50 }, effetti: [
        { tipo: 'formulaCA', formula: { id: 'difesa-senza-armatura-monaco', nome: 'Difesa senza armatura', base: 10, caratteristiche: ['DES', 'SAG'], richiede: 'nessunaArmaturaNoScudo', srd: { pagina: 50 } } },
      ] },
    ],
  },

  paladin: {
    id: 'paladin', nome: 'Paladino', nomeEn: 'Paladin', srd: { pagina: 53 },
    dadoVita: 10, tiriSalvezza: ['SAG', 'CAR'],
    abilita: abilita('paladin', 2, ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'], 53),
    addestramentoArmature: ['leggera', 'media', 'pesante', 'scudo'],
    addestramentoArmi: ['semplici', 'marziali'],
    equipaggiamento: {
      A: { oggetti: [{ oggetto: 'chain-mail', quantita: 1 }, { oggetto: 'shield', quantita: 1 }, { oggetto: 'longsword', quantita: 1 }, { oggetto: 'javelin', quantita: 6 }, { oggetto: 'holy-symbol', quantita: 1 }, { oggetto: 'priests-pack', quantita: 1 }], mo: 9 },
      B: { oggetti: [], mo: 150 },
    },
    slot: slot1,
    features: [
      { id: 'lay-on-hands', nome: 'Imposizione delle mani', nomeEn: 'Lay On Hands', livello: 1, srd: { pagina: 53 }, effetti: [
        { tipo: 'risorsa', risorsa: { id: 'lay-on-hands', nome: 'Imposizione delle mani (riserva di PF)', usi: { perLivello: 5 },
          recupero: [{ riposo: 'lungo', quanti: 'tutti' }], srd: { pagina: 53 } } },
      ] },
      { id: 'paladin-spellcasting', nome: 'Incantesimi', nomeEn: 'Spellcasting', livello: 1, srd: { pagina: 54 }, effetti: [
        { tipo: 'magia', concessione: {
          id: 'paladin', nome: 'Classe: Paladino', fonte: { tipo: 'classe', id: 'paladin' }, lista: 'paladin', caratteristica: 'CAR',
          preparati: { numero: 2, da: 'lista' }, puoUsareSlot: true, slot: 'normali',
          cambio: { quando: 'riposoLungo', quanti: 1, srd: { pagina: 54 } }, srd: { pagina: 54 } } },
      ] },
      { id: 'paladin-weapon-mastery', nome: 'Padronanza d\'armi', nomeEn: 'Weapon Mastery', livello: 1, srd: { pagina: 54 }, effetti: [maestriaArmi('paladin', 2, 54)] },
    ],
  },

  ranger: {
    id: 'ranger', nome: 'Ranger', nomeEn: 'Ranger', srd: { pagina: 57 },
    dadoVita: 10, tiriSalvezza: ['FOR', 'DES'],
    abilita: abilita('ranger', 3, ['animal-handling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'], 57),
    addestramentoArmature: ['leggera', 'media', 'scudo'],
    addestramentoArmi: ['semplici', 'marziali'],
    equipaggiamento: {
      A: { oggetti: [{ oggetto: 'studded-leather-armor', quantita: 1 }, { oggetto: 'scimitar', quantita: 1 }, { oggetto: 'shortsword', quantita: 1 }, { oggetto: 'longbow', quantita: 1 }, { oggetto: 'arrows', quantita: 20 }, { oggetto: 'quiver', quantita: 1 }, { oggetto: 'druidic-focus-mistletoe', quantita: 1 }, { oggetto: 'explorers-pack', quantita: 1 }], mo: 7 },
      B: { oggetti: [], mo: 150 },
    },
    slot: slot1,
    features: [
      { id: 'ranger-spellcasting', nome: 'Incantesimi', nomeEn: 'Spellcasting', livello: 1, srd: { pagina: 57 }, effetti: [
        { tipo: 'magia', concessione: {
          id: 'ranger', nome: 'Classe: Ranger', fonte: { tipo: 'classe', id: 'ranger' }, lista: 'ranger', caratteristica: 'SAG',
          preparati: { numero: 2, da: 'lista' },
          semprePreparati: ['hunters-mark'],
          lanciGratuiti: { incantesimi: ['hunters-mark'], usi: 2, recupero: 'lungo' },   // Nemico prescelto, p. 58
          puoUsareSlot: true, slot: 'normali',
          cambio: { quando: 'riposoLungo', quanti: 1, srd: { pagina: 58 } }, srd: { pagina: 57 } } },
      ] },
      { id: 'favored-enemy', nome: 'Nemico prescelto', nomeEn: 'Favored Enemy', livello: 1, srd: { pagina: 58 }, effetti: [
        { tipo: 'nota', testo: 'Marchio del cacciatore sempre preparato, 2 lanci senza slot per riposo lungo (SRD p. 58)' },
      ] },
      { id: 'ranger-weapon-mastery', nome: 'Padronanza d\'armi', nomeEn: 'Weapon Mastery', livello: 1, srd: { pagina: 58 }, effetti: [maestriaArmi('ranger', 2, 58)] },
    ],
  },

  rogue: {
    id: 'rogue', nome: 'Ladro', nomeEn: 'Rogue', srd: { pagina: 61 },
    dadoVita: 8, tiriSalvezza: ['DES', 'INT'],
    abilita: abilita('rogue', 4, ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'persuasion', 'sleight-of-hand', 'stealth'], 61),
    addestramentoArmature: ['leggera'],
    addestramentoArmi: ['semplici', 'marzialiAccurateOLeggere'],
    equipaggiamento: {
      A: { oggetti: [{ oggetto: 'leather-armor', quantita: 1 }, { oggetto: 'dagger', quantita: 2 }, { oggetto: 'shortsword', quantita: 1 }, { oggetto: 'shortbow', quantita: 1 }, { oggetto: 'arrows', quantita: 20 }, { oggetto: 'quiver', quantita: 1 }, { oggetto: 'thieves-tools', quantita: 1 }, { oggetto: 'burglars-pack', quantita: 1 }], mo: 8 },
      B: { oggetti: [], mo: 100 },
    },
    features: [
      { id: 'expertise', nome: 'Maestria', nomeEn: 'Expertise', livello: 1, srd: { pagina: 61 }, effetti: [
        { tipo: 'competenza', categoria: 'strumento', ids: ['thieves-tools'] },
        { tipo: 'scelta', scelta: { id: 'rogue.maestria', tipo: 'maestria', quantita: 2, srd: { pagina: 61 } } },
        { tipo: 'maestria', abilita: { daScelta: 'rogue.maestria' } },
      ] },
      { id: 'sneak-attack', nome: 'Attacco furtivo', nomeEn: 'Sneak Attack', livello: 1, srd: { pagina: 61 }, effetti: [
        { tipo: 'valoreClasse', id: 'sneak-attack', nome: 'Attacco furtivo', valore: '1d6', srd: { pagina: 62 } },
      ] },
      { id: 'thieves-cant', nome: 'Gergo ladresco', nomeEn: 'Thieves’ Cant', livello: 1, srd: { pagina: 62 }, effetti: [
        { tipo: 'lingua', ids: ['thieves-cant'] },
        { tipo: 'scelta', scelta: { id: 'rogue.lingua', tipo: 'lingua', quantita: 1, opzioni: Object.keys({ ...LINGUE_STANDARD, ...LINGUE_RARE }).filter((l) => l !== 'thieves-cant'), srd: { pagina: 62 } } },
      ] },
      { id: 'rogue-weapon-mastery', nome: 'Padronanza d\'armi', nomeEn: 'Weapon Mastery', livello: 1, srd: { pagina: 62 }, effetti: [maestriaArmi('rogue', 2, 62, 'ladro')] },
    ],
  },

  sorcerer: {
    id: 'sorcerer', nome: 'Stregone', nomeEn: 'Sorcerer', srd: { pagina: 64 },
    dadoVita: 6, tiriSalvezza: ['COS', 'CAR'],
    abilita: abilita('sorcerer', 2, ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'], 64),
    addestramentoArmature: [],
    addestramentoArmi: ['semplici'],
    equipaggiamento: {
      A: { oggetti: [{ oggetto: 'spear', quantita: 1 }, { oggetto: 'dagger', quantita: 2 }, { oggetto: 'arcane-focus-crystal', quantita: 1 }, { oggetto: 'dungeoneers-pack', quantita: 1 }], mo: 28 },
      B: { oggetti: [], mo: 50 },
    },
    slot: slot1,
    features: [
      { id: 'sorcerer-spellcasting', nome: 'Incantesimi', nomeEn: 'Spellcasting', livello: 1, srd: { pagina: 64 }, effetti: [
        { tipo: 'magia', concessione: {
          id: 'sorcerer', nome: 'Classe: Stregone', fonte: { tipo: 'classe', id: 'sorcerer' }, lista: 'sorcerer', caratteristica: 'CAR',
          trucchetti: { quantita: 4, scelta: 'sorcerer.trucchetti' }, preparati: { numero: 2, da: 'lista' },
          puoUsareSlot: true, slot: 'normali',
          cambio: { quando: 'livello', quanti: 1, srd: { pagina: 65 } }, cambioTrucchetti: { quando: 'livello', quanti: 1, srd: { pagina: 64 } },
          cdCondizionali: [{ etichetta: 'Stregoneria innata attiva', bonus: 1, srd: { pagina: 66 } }],
          srd: { pagina: 64 } } },
      ] },
      { id: 'innate-sorcery', nome: 'Stregoneria innata', nomeEn: 'Innate Sorcery', livello: 1, srd: { pagina: 65 }, effetti: [
        { tipo: 'risorsa', risorsa: { id: 'innate-sorcery', nome: 'Stregoneria innata', usi: 2, dettaglio: '1 minuto: +1 alla CD e vantaggio agli attacchi degli incantesimi da stregone',
          recupero: [{ riposo: 'lungo', quanti: 'tutti' }], srd: { pagina: 66 } } },
      ] },
    ],
  },

  warlock: {
    id: 'warlock', nome: 'Warlock', nomeEn: 'Warlock', srd: { pagina: 70 },
    dadoVita: 8, tiriSalvezza: ['SAG', 'CAR'],
    abilita: abilita('warlock', 2, ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'], 70),
    addestramentoArmature: ['leggera'],
    addestramentoArmi: ['semplici'],
    equipaggiamento: {
      A: { oggetti: [{ oggetto: 'leather-armor', quantita: 1 }, { oggetto: 'sickle', quantita: 1 }, { oggetto: 'dagger', quantita: 2 }, { oggetto: 'arcane-focus-orb', quantita: 1 }, { oggetto: 'book-occult-lore', quantita: 1 }, { oggetto: 'scholars-pack', quantita: 1 }], mo: 15 },
      B: { oggetti: [], mo: 100 },
    },
    patto: { 1: { numero: 1, livello: 1 } },
    features: [
      { id: 'eldritch-invocations', nome: 'Suppliche occulte', nomeEn: 'Eldritch Invocations', livello: 1, srd: { pagina: 70 }, effetti: [
        // Le suppliche senza prerequisiti di livello (p. 72-73): le uniche possibili al livello 1
        { tipo: 'opzioni', scelta: { id: 'warlock.suppliche', tipo: 'opzione', quantita: 1, opzioni: ['armor-of-shadows', 'eldritch-mind', 'pact-of-the-chain', 'pact-of-the-blade', 'pact-of-the-tome'], srd: { pagina: 70 } }, effetti: {
          'armor-of-shadows': [
            { tipo: 'formulaCA', formula: { id: 'armatura-magica', nome: 'Armatura magica (Armatura delle ombre)', base: 13, caratteristiche: ['DES'], richiede: 'nessunaArmatura', srd: { pagina: 72 } } },
            { tipo: 'nota', testo: 'Armatura delle ombre: Armatura magica su te stesso senza slot (SRD p. 72)' },
          ],
          'pact-of-the-chain': [{ tipo: 'nota', testo: 'Patto della catena: conosci Trova famiglio e lo lanci come azione Magia senza slot; forme speciali del famiglio (SRD p. 73)' }],
          'pact-of-the-blade': [{ tipo: 'nota', testo: 'Patto della lama: evochi un\'arma del patto (da mischia, semplice o da guerra) con cui hai competenza e che è il tuo focus; puoi usare il Carisma per attacco e danni (SRD p. 73)' }],
          'pact-of-the-tome': [
            { tipo: 'scelta', scelta: { id: 'warlock.tomo.trucchetti', tipo: 'trucchetto', quantita: 3, srd: { pagina: 73 } } },
            { tipo: 'scelta', scelta: { id: 'warlock.tomo.rituali', tipo: 'incantesimo', quantita: 2, srd: { pagina: 73 } } },
            { tipo: 'magia', concessione: {
              id: 'pact-of-the-tome', nome: 'Classe: Patto del tomo', fonte: { tipo: 'classe', id: 'warlock' }, caratteristica: 'CAR',
              trucchetti: { quantita: 3, scelta: 'warlock.tomo.trucchetti' }, incantesimiScelti: { scelta: 'warlock.tomo.rituali', soloRituali: true },
              puoUsareSlot: true, slot: 'patto', srd: { pagina: 73 },
            } },
          ],
          'eldritch-mind': [{ tipo: 'nota', testo: 'Mente occulta: vantaggio ai TS di Costituzione per mantenere la concentrazione (SRD p. 72)' }],
        } },
      ] },
      { id: 'pact-magic', nome: 'Magia del patto', nomeEn: 'Pact Magic', livello: 1, srd: { pagina: 71 }, effetti: [
        { tipo: 'magia', concessione: {
          id: 'warlock', nome: 'Classe: Warlock', fonte: { tipo: 'classe', id: 'warlock' }, lista: 'warlock', caratteristica: 'CAR',
          trucchetti: { quantita: 2, scelta: 'warlock.trucchetti' }, preparati: { numero: 2, da: 'lista' },
          puoUsareSlot: true, slot: 'patto',
          cambio: { quando: 'livello', quanti: 1, srd: { pagina: 72 } }, cambioTrucchetti: { quando: 'livello', quanti: 1, srd: { pagina: 71 } },
          srd: { pagina: 71 } } },
      ] },
    ],
  },

  wizard: {
    id: 'wizard', nome: 'Mago', nomeEn: 'Wizard', srd: { pagina: 77 },
    dadoVita: 6, tiriSalvezza: ['INT', 'SAG'],
    abilita: abilita('wizard', 2, ['arcana', 'history', 'insight', 'investigation', 'medicine', 'nature', 'religion'], 77),
    addestramentoArmature: [],
    addestramentoArmi: ['semplici'],
    equipaggiamento: {
      A: { oggetti: [{ oggetto: 'dagger', quantita: 2 }, { oggetto: 'arcane-focus-quarterstaff', quantita: 1 }, { oggetto: 'robe', quantita: 1 }, { oggetto: 'spellbook', quantita: 1 }, { oggetto: 'scholars-pack', quantita: 1 }], mo: 5 },
      B: { oggetti: [], mo: 55 },
    },
    slot: slot1,
    features: [
      { id: 'wizard-spellcasting', nome: 'Incantesimi', nomeEn: 'Spellcasting', livello: 1, srd: { pagina: 77 }, effetti: [
        { tipo: 'magia', concessione: {
          id: 'wizard', nome: 'Classe: Mago', fonte: { tipo: 'classe', id: 'wizard' }, lista: 'wizard', caratteristica: 'INT',
          trucchetti: { quantita: 3, scelta: 'wizard.trucchetti' }, preparati: { numero: 4, da: 'libro' }, libro: { iniziali: 6 },
          puoUsareSlot: true, slot: 'normali',
          cambio: { quando: 'riposoLungo', quanti: 'tutti', srd: { pagina: 78 } }, cambioTrucchetti: { quando: 'riposoLungo', quanti: 1, srd: { pagina: 77 } },
          srd: { pagina: 77 } } },
      ] },
      { id: 'ritual-adept', nome: 'Adepto dei rituali', nomeEn: 'Ritual Adept', livello: 1, srd: { pagina: 78 }, effetti: [
        { tipo: 'nota', testo: 'Puoi lanciare come rituale qualsiasi incantesimo rituale del tuo libro, anche se non è preparato (SRD p. 78)' },
      ] },
      { id: 'arcane-recovery', nome: 'Recupero arcano', nomeEn: 'Arcane Recovery', livello: 1, srd: { pagina: 78 }, effetti: [
        { tipo: 'risorsa', risorsa: { id: 'arcane-recovery', nome: 'Recupero arcano', usi: 1, dettaglio: 'dopo un riposo breve recuperi slot per un totale di 1 livello',
          recupero: [{ riposo: 'lungo', quanti: 'tutti' }], srd: { pagina: 78 } } },
      ] },
    ],
  },
};

// ───────── 2° livello (23/11/2026, aumento di livello: prima tappa) ─────────
// Dalle tabelle delle classi e dalle capacità «Level 2» dell'SRD 5.2; valori attesi approvati da Patrizio il 23/11.
// I numeri che crescono con il livello (preparati, slot, usi) sono in perLivelli: [1°, 2°]. Si allunga una tappa alla volta.

// Forme della Forma selvatica al 2° livello: bestie di GS massimo 1/4 senza velocità di volo (p. 42), dall'elenco dei mostri dell'SRD
export const FORME_SELVATICHE_GS_1_4 = ['elk', 'baboon', 'camel', 'goat', 'riding-horse', 'draft-horse', 'seahorse', 'boar', 'deer', 'weasel',
  'giant-weasel', 'cat', 'crab', 'giant-crab', 'hyena', 'lizard', 'giant-lizard', 'wolf', 'mastiff', 'giant-centipede', 'mule', 'panther',
  'piovra', 'piranha', 'pony', 'spider', 'giant-wolf-spider', 'frog', 'giant-frog', 'giant-fire-beetle', 'jackal', 'scorpion',
  'constrictor-snake', 'venomous-snake', 'giant-venomous-snake', 'badger', 'giant-badger', 'rat', 'giant-rat'];

const STILI = ['archery', 'defense', 'great-weapon-fighting', 'two-weapon-fighting'];
// Stile di combattimento di paladino e ranger (p. 54, 59): un talento di stile, o i 2 trucchetti di un'altra lista
const stileConTrucchetti = (classe: 'paladin' | 'ranger', opzione: string, nomeOpz: string, lista: 'cleric' | 'druid', car: 'CAR' | 'SAG', pagina: number): Effetto => ({
  tipo: 'opzioni', scelta: { id: `${classe}.stile`, tipo: 'opzione', quantita: 1, opzioni: [...STILI, opzione], srd: { pagina } },
  effetti: {
    ...Object.fromEntries(STILI.map((t) => [t, [{ tipo: 'talento', talento: t } as Effetto]])),
    [opzione]: [
      { tipo: 'scelta', scelta: { id: `${classe}.${opzione === 'blessed-warrior' ? 'guerriero-benedetto' : 'guerriero-druidico'}`, tipo: 'trucchetto', quantita: 2, srd: { pagina } } },
      { tipo: 'magia', concessione: {
        id: opzione, nome: `Classe: ${nomeOpz}`, fonte: { tipo: 'classe', id: classe }, lista, caratteristica: car,
        trucchetti: { quantita: 2, scelta: `${classe}.${opzione === 'blessed-warrior' ? 'guerriero-benedetto' : 'guerriero-druidico'}` },
        puoUsareSlot: false, cambioTrucchetti: { quando: 'livello', quanti: 1, srd: { pagina } }, srd: { pagina } } },
    ],
  },
});
const SUPPLICHE_2: Record<string, Effetto[]> = {
  'armor-of-shadows': [
    { tipo: 'formulaCA', formula: { id: 'armatura-magica', nome: 'Armatura magica (Armatura delle ombre)', base: 13, caratteristiche: ['DES'], richiede: 'nessunaArmatura', srd: { pagina: 72 } } },
    { tipo: 'nota', testo: 'Armatura delle ombre: Armatura magica su te stesso senza slot (SRD p. 72)' }],
  'eldritch-mind': [{ tipo: 'nota', testo: 'Mente occulta: vantaggio ai TS di Costituzione per mantenere la concentrazione (SRD p. 72)' }],
  'agonizing-blast': [{ tipo: 'bonusDanniTrucchetto', incantesimo: 'eldritch-blast', car: 'CAR', etichetta: 'Deflagrazione agonizzante (Carisma)' }],
  'devils-sight': [{ tipo: 'nota', testo: 'Vista del diavolo: vedi normalmente nella luce fioca e nell\'oscurità, anche magica, entro 36 m (SRD p. 72)' }],
  'eldritch-spear': [{ tipo: 'nota', testo: 'Lancia occulta: la gittata di Deflagrazione occulta aumenta di 9 m per livello da warlock (SRD p. 72)' }],
  'fiendish-vigor': [{ tipo: 'nota', testo: 'Vigore immondo: lanci Vita falsata su te stesso senza slot; i PF temporanei sono il massimo del dado (SRD p. 72)' }],
  'mask-of-many-faces': [{ tipo: 'nota', testo: 'Maschera dai molti volti: lanci Camuffare se stessi senza slot (SRD p. 73)' }],
  'misty-visions': [{ tipo: 'nota', testo: 'Visioni nebbiose: lanci Immagine silenziosa senza slot (SRD p. 73)' }],
};

const LIVELLO_2: Record<string, Feature[]> = {
  barbarian: [
    { id: 'danger-sense', nome: 'Percezione del pericolo', nomeEn: 'Danger Sense', livello: 2, srd: { pagina: 29 }, effetti: [{ tipo: 'nota', testo: 'Vantaggio ai tiri salvezza su Destrezza, se non sei incapacitato (SRD p. 29)' }] },
    { id: 'reckless-attack', nome: 'Attacco irruento', nomeEn: 'Reckless Attack', livello: 2, srd: { pagina: 29 }, effetti: [{ tipo: 'nota', testo: 'Al primo attacco del turno: vantaggio agli attacchi con la Forza fino al tuo turno successivo, ma chi ti attacca ha vantaggio (SRD p. 29)' }] },
  ],
  bard: [
    { id: 'bard-expertise', nome: 'Maestria', nomeEn: 'Expertise', livello: 2, srd: { pagina: 32 }, effetti: [
      { tipo: 'scelta', scelta: { id: 'bard.maestria', tipo: 'maestria', quantita: 2, srd: { pagina: 32 } } },
      { tipo: 'maestria', abilita: { daScelta: 'bard.maestria' } }] },
    { id: 'jack-of-all-trades', nome: 'Factotum', nomeEn: 'Jack of All Trades', livello: 2, srd: { pagina: 32 }, effetti: [{ tipo: 'mezzaCompetenzaAbilita', etichetta: 'Factotum (metà competenza)' }] },
  ],
  cleric: [
    { id: 'channel-divinity', nome: 'Incanalare divinità', nomeEn: 'Channel Divinity', livello: 2, srd: { pagina: 37 }, effetti: [
      { tipo: 'risorsa', risorsa: { id: 'channel-divinity', nome: 'Incanalare divinità', usi: 2, dettaglio: 'Scintilla divina o Scacciare non morti; CD degli incantesimi',
        recupero: [{ riposo: 'breve', quanti: 1 }, { riposo: 'lungo', quanti: 'tutti' }], srd: { pagina: 37 } } }] },
  ],
  druid: [
    { id: 'wild-shape', nome: 'Forma selvatica', nomeEn: 'Wild Shape', livello: 2, srd: { pagina: 42 }, effetti: [
      { tipo: 'risorsa', risorsa: { id: 'wild-shape', nome: 'Forma selvatica', usi: 2, dettaglio: 'azione bonus; 4 forme di GS fino a 1/4 senza volo; PF temporanei pari al livello da druido',
        recupero: [{ riposo: 'breve', quanti: 1 }, { riposo: 'lungo', quanti: 'tutti' }], srd: { pagina: 42 } } },
      { tipo: 'scelta', scelta: { id: 'druid.forme', tipo: 'opzione', quantita: 4, opzioni: FORME_SELVATICHE_GS_1_4, srd: { pagina: 42 } } }] },
    { id: 'wild-companion', nome: 'Compagno selvatico', nomeEn: 'Wild Companion', livello: 2, srd: { pagina: 43 }, effetti: [{ tipo: 'nota', testo: 'Con uno slot o un uso di Forma selvatica lanci Trova famiglio senza componenti materiali; il famiglio è un folletto e sparisce al riposo lungo (SRD p. 43)' }] },
  ],
  fighter: [
    { id: 'action-surge', nome: 'Azione impetuosa', nomeEn: 'Action Surge', livello: 2, srd: { pagina: 48 }, effetti: [
      { tipo: 'risorsa', risorsa: { id: 'action-surge', nome: 'Azione impetuosa', usi: 1, dettaglio: 'un\'azione in più nel tuo turno, non Magia',
        recupero: [{ riposo: 'breve', quanti: 'tutti' }, { riposo: 'lungo', quanti: 'tutti' }], srd: { pagina: 48 } } }] },
    { id: 'tactical-mind', nome: 'Mente tattica', nomeEn: 'Tactical Mind', livello: 2, srd: { pagina: 48 }, effetti: [{ tipo: 'nota', testo: 'Se fallisci una prova di caratteristica puoi spendere un uso di Recuperare energie per aggiungere 1d10; se fallisci comunque, l\'uso non si spende (SRD p. 48)' }] },
  ],
  monk: [
    { id: 'monks-focus', nome: 'Concentrazione da monaco', nomeEn: 'Monk\'s Focus', livello: 2, srd: { pagina: 50 }, effetti: [
      { tipo: 'risorsa', risorsa: { id: 'focus', nome: 'Punti concentrazione', usi: { perLivelli: [0, 2] }, dettaglio: 'Raffica di colpi, Difesa paziente, Passo del vento',
        recupero: [{ riposo: 'breve', quanti: 'tutti' }, { riposo: 'lungo', quanti: 'tutti' }], srd: { pagina: 50 } } },
      { tipo: 'cdSpeciale', id: 'monk-focus', nome: 'Classe: Concentrazione da monaco', caratteristica: 'SAG', srd: { pagina: 50 } }] },
    { id: 'unarmored-movement', nome: 'Movimento senza armatura', nomeEn: 'Unarmored Movement', livello: 2, srd: { pagina: 51 }, effetti: [{ tipo: 'velocitaSenzaArmatura', valore: 10, etichetta: 'Movimento senza armatura' }] },
    { id: 'uncanny-metabolism', nome: 'Metabolismo straordinario', nomeEn: 'Uncanny Metabolism', livello: 2, srd: { pagina: 51 }, effetti: [
      { tipo: 'risorsa', risorsa: { id: 'uncanny-metabolism', nome: 'Metabolismo straordinario', usi: 1, dettaglio: 'tirando l\'iniziativa: tutti i punti concentrazione e PF pari al dado di Arti marziali + livello da monaco',
        recupero: [{ riposo: 'lungo', quanti: 'tutti' }], srd: { pagina: 51 } } }] },
  ],
  paladin: [
    { id: 'paladin-fighting-style', nome: 'Stile di combattimento', nomeEn: 'Fighting Style', livello: 2, srd: { pagina: 54 }, effetti: [stileConTrucchetti('paladin', 'blessed-warrior', 'Guerriero benedetto', 'cleric', 'CAR', 54)] },
    { id: 'paladins-smite', nome: 'Punizione del paladino', nomeEn: 'Paladin\'s Smite', livello: 2, srd: { pagina: 54 }, effetti: [
      { tipo: 'magia', concessione: {
        id: 'paladins-smite', nome: 'Classe: Punizione del paladino', fonte: { tipo: 'classe', id: 'paladin' }, lista: 'paladin', caratteristica: 'CAR',
        semprePreparati: ['divine-smite'], lanciGratuiti: { incantesimi: ['divine-smite'], usi: 1, recupero: 'lungo' }, puoUsareSlot: true, slot: 'normali', srd: { pagina: 54 } } }] },
  ],
  ranger: [
    { id: 'deft-explorer', nome: 'Esploratore esperto', nomeEn: 'Deft Explorer', livello: 2, srd: { pagina: 59 }, effetti: [
      { tipo: 'scelta', scelta: { id: 'ranger.maestria', tipo: 'maestria', quantita: 1, srd: { pagina: 59 } } },
      { tipo: 'maestria', abilita: { daScelta: 'ranger.maestria' } },
      { tipo: 'scelta', scelta: { id: 'ranger.lingue', tipo: 'lingua', quantita: 2, opzioni: Object.keys(LINGUE_STANDARD), srd: { pagina: 59 } } }] },
    { id: 'ranger-fighting-style', nome: 'Stile di combattimento', nomeEn: 'Fighting Style', livello: 2, srd: { pagina: 59 }, effetti: [stileConTrucchetti('ranger', 'druidic-warrior', 'Guerriero druidico', 'druid', 'SAG', 59)] },
  ],
  rogue: [
    { id: 'cunning-action', nome: 'Azione scaltra', nomeEn: 'Cunning Action', livello: 2, srd: { pagina: 62 }, effetti: [{ tipo: 'nota', testo: 'Scatto, Disimpegno o Nascondersi come azione bonus (SRD p. 62)' }] },
  ],
  sorcerer: [
    { id: 'font-of-magic', nome: 'Fonte di magia', nomeEn: 'Font of Magic', livello: 2, srd: { pagina: 66 }, effetti: [
      { tipo: 'risorsa', risorsa: { id: 'sorcery-points', nome: 'Punti stregoneria', usi: { perLivelli: [0, 2] }, dettaglio: 'uno slot di 1° costa 2 punti (azione bonus); uno slot speso dà punti pari al suo livello',
        recupero: [{ riposo: 'lungo', quanti: 'tutti' }], srd: { pagina: 66 } } }] },
    { id: 'metamagic', nome: 'Metamagia', nomeEn: 'Metamagic', livello: 2, srd: { pagina: 66 }, effetti: [
      { tipo: 'scelta', scelta: { id: 'sorcerer.metamagia', tipo: 'opzione', quantita: 2, srd: { pagina: 66 },
        opzioni: ['careful-spell', 'distant-spell', 'empowered-spell', 'extended-spell', 'heightened-spell', 'quickened-spell', 'seeking-spell', 'subtle-spell', 'transmuted-spell', 'twinned-spell'] } }] },
  ],
  warlock: [
    { id: 'eldritch-invocations-2', nome: 'Suppliche occulte', nomeEn: 'Eldritch Invocations', livello: 2, srd: { pagina: 70 }, effetti: [
      { tipo: 'opzioni', scelta: { id: 'warlock.suppliche-2', tipo: 'opzione', quantita: 2, opzioni: Object.keys(SUPPLICHE_2), srd: { pagina: 72 } }, effetti: SUPPLICHE_2 }] },
    { id: 'magical-cunning', nome: 'Scaltrezza magica', nomeEn: 'Magical Cunning', livello: 2, srd: { pagina: 72 }, effetti: [
      { tipo: 'risorsa', risorsa: { id: 'magical-cunning', nome: 'Scaltrezza magica', usi: 1, dettaglio: 'rito di 1 minuto: recuperi slot del patto fino alla metà del massimo, per eccesso',
        recupero: [{ riposo: 'lungo', quanti: 'tutti' }], srd: { pagina: 72 } } }] },
  ],
  wizard: [
    { id: 'scholar', nome: 'Studioso', nomeEn: 'Scholar', livello: 2, srd: { pagina: 78 }, effetti: [
      { tipo: 'scelta', scelta: { id: 'wizard.studioso', tipo: 'maestria', quantita: 1, opzioni: ['arcana', 'history', 'investigation', 'medicine', 'nature', 'religion'], srd: { pagina: 78 } } },
      { tipo: 'maestria', abilita: { daScelta: 'wizard.studioso' } }] },
  ],
};

// Tabelle delle classi al 2° livello: incantesimi preparati, slot, patto (p. 31, 36, 41, 53, 57, 64, 71, 77)
const PREPARATI: Record<string, number[]> = { bard: [4, 5], cleric: [4, 5], druid: [4, 5], paladin: [2, 3], ranger: [2, 3], sorcerer: [2, 4], warlock: [2, 3], wizard: [4, 5] };
const SLOT: Record<string, Record<number, number[]>> = {
  bard: { 1: [2], 2: [3] }, cleric: { 1: [2], 2: [3] }, druid: { 1: [2], 2: [3] }, sorcerer: { 1: [2], 2: [3] }, wizard: { 1: [2], 2: [3] },
  paladin: { 1: [2], 2: [2] }, ranger: { 1: [2], 2: [2] },
};
for (const [id, c] of Object.entries(CLASSI)) {
  c.features.push(...(LIVELLO_2[id] ?? []));
  if (SLOT[id]) c.slot = SLOT[id];
  for (const f of c.features) for (const e of f.effetti) if (e.tipo === 'magia' && e.concessione.fonte.tipo === 'classe' && e.concessione.id === id) {
    const conc: ConcessioneMagia = e.concessione;
    if (conc.preparati && PREPARATI[id]) conc.preparati = { ...conc.preparati, numero: { perLivelli: PREPARATI[id] } };
    if (conc.libro) conc.libro = { ...conc.libro, perLivello: 2 };
  }
}
CLASSI.warlock.patto = { 1: { numero: 1, livello: 1 }, 2: { numero: 2, livello: 1 } };
