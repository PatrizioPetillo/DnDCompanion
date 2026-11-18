// Le 12 classi dell'SRD 5.2, solo il livello 1 (versione 1: sezione 7 del contesto).
import type { Classe, Effetto, Scelta } from '../tipi';
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
      { id: 'barbarian-weapon-mastery', nome: 'Padronanza delle armi', nomeEn: 'Weapon Mastery', livello: 1, srd: { pagina: 29 }, effetti: [maestriaArmi('barbarian', 2, 29, 'mischia')] },
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
      { id: 'fighter-weapon-mastery', nome: 'Padronanza delle armi', nomeEn: 'Weapon Mastery', livello: 1, srd: { pagina: 48 }, effetti: [maestriaArmi('fighter', 3, 48)] },
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
      { id: 'paladin-weapon-mastery', nome: 'Padronanza delle armi', nomeEn: 'Weapon Mastery', livello: 1, srd: { pagina: 54 }, effetti: [maestriaArmi('paladin', 2, 54)] },
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
      { id: 'ranger-weapon-mastery', nome: 'Padronanza delle armi', nomeEn: 'Weapon Mastery', livello: 1, srd: { pagina: 58 }, effetti: [maestriaArmi('ranger', 2, 58)] },
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
            { id: 'thieves-cant', nome: 'Gergo dei ladri', nomeEn: 'Thieves’ Cant', livello: 1, srd: { pagina: 62 }, effetti: [
        { tipo: 'lingua', ids: ['thieves-cant'] },
        { tipo: 'scelta', scelta: { id: 'rogue.lingua', tipo: 'lingua', quantita: 1, opzioni: Object.keys({ ...LINGUE_STANDARD, ...LINGUE_RARE }).filter((l) => l !== 'thieves-cant'), srd: { pagina: 62 } } },
      ] },
      { id: 'rogue-weapon-mastery', nome: 'Padronanza delle armi', nomeEn: 'Weapon Mastery', livello: 1, srd: { pagina: 62 }, effetti: [maestriaArmi('rogue', 2, 62, 'ladro')] },
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
        // Versione 1: solo le suppliche senza prerequisiti che il test usa; le altre arrivano con il passo «creazione».
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
      { id: 'ritual-adept', nome: 'Rituali', nomeEn: 'Ritual Adept', livello: 1, srd: { pagina: 78 }, effetti: [
        { tipo: 'nota', testo: 'Puoi lanciare come rituale qualsiasi incantesimo rituale del tuo libro, anche se non è preparato (SRD p. 78)' },
      ] },
      { id: 'arcane-recovery', nome: 'Recupero arcano', nomeEn: 'Arcane Recovery', livello: 1, srd: { pagina: 78 }, effetti: [
        { tipo: 'risorsa', risorsa: { id: 'arcane-recovery', nome: 'Recupero arcano', usi: 1, dettaglio: 'dopo un riposo breve recuperi slot per un totale di 1 livello',
          recupero: [{ riposo: 'lungo', quanti: 'tutti' }], srd: { pagina: 78 } } },
      ] },
    ],
  },
};
