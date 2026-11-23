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
  'mask-of-many-faces': [{ tipo: 'nota', testo: 'Maschera dei molti volti: lanci Camuffare se stessi senza slot (SRD p. 73)' }],
  'misty-visions': [{ tipo: 'nota', testo: 'Visioni velate: lanci Immagine silenziosa senza slot (SRD p. 73)' }],
  // Le altre del 2° livello (aggiunte il 23/11 con il 5°: «tutte quelle dell'SRD fino al 5° livello»)
  'otherworldly-leap': [{ tipo: 'nota', testo: 'Balzo ultraterreno: lanci Salto su te stesso senza slot (SRD p. 74)' }],
  'repelling-blast': [{ tipo: 'nota', testo: 'Deflagrazione respingente: quando colpisci una creatura Grande o più piccola con un trucchetto da warlock che fa danni, puoi spingerla di 3 m (SRD p. 74)' }],
  'lessons-of-the-first-ones': [
    { tipo: 'scelta', scelta: { id: 'lessons-of-the-first-ones.talento', tipo: 'talento', quantita: 1, filtro: { categoriaTalento: 'origine' }, srd: { pagina: 73 } } },
    { tipo: 'talento', talento: { daScelta: 'lessons-of-the-first-ones.talento' } }],
};
// Suppliche con un patto come requisito (p. 73-74)
export const REQUISITO_SUPPLICA: Record<string, string> = { 'eldritch-smite': 'pact-of-the-blade', 'thirsting-blade': 'pact-of-the-blade', 'investment-of-the-chain-master': 'pact-of-the-chain' };

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

// ───────── 3° livello (23/11/2026): sottoclassi dell'SRD, una per classe ─────────
// Valori attesi approvati da Patrizio il 23/11 (file «Valori attesi 3° livello»). Le capacità di sottoclasse hanno «sottoclasse» nel nome.
const nota = (testo: string): Effetto => ({ tipo: 'nota', testo });
const sempre = (id: string, nome: string, classe: string, lista: string, car: 'SAG' | 'CAR' | 'INT', ids: string[], pagina: number, extra: Partial<ConcessioneMagia> = {}): Effetto => ({
  tipo: 'magia', concessione: { id, nome, fonte: { tipo: 'classe', id: classe }, lista, caratteristica: car, semprePreparati: ids, puoUsareSlot: true, slot: 'normali', srd: { pagina }, ...extra } });
const TERRE: Record<string, { nome: string; trucchetto: string; incantesimi: string[] }> = {
  arid: { nome: 'Arida', trucchetto: 'fire-bolt', incantesimi: ['blur', 'burning-hands'] },
  polar: { nome: 'Polare', trucchetto: 'ray-of-frost', incantesimi: ['fog-cloud', 'hold-person'] },
  temperate: { nome: 'Temperata', trucchetto: 'shocking-grasp', incantesimi: ['misty-step', 'sleep'] },
  tropical: { nome: 'Tropicale', trucchetto: 'acid-splash', incantesimi: ['ray-of-sickness', 'web'] },
};
const LIVELLO_3: Record<string, Feature[]> = {
  barbarian: [
    { id: 'primal-knowledge', nome: 'Conoscenza primordiale', nomeEn: 'Primal Knowledge', livello: 3, srd: { pagina: 29 }, effetti: [
      { tipo: 'scelta', scelta: { id: 'barbarian.conoscenza', tipo: 'abilita', quantita: 1, opzioni: ['animal-handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'], srd: { pagina: 29 } } },
      nota('Con l\'Ira attiva, le prove di Acrobazia, Intimidire, Percezione, Furtività e Sopravvivenza si possono fare con la Forza (SRD p. 29)')] },
    { id: 'frenzy', nome: 'Frenesia (Cammino del berserker)', nomeEn: 'Frenzy', livello: 3, srd: { pagina: 30 }, effetti: [
      nota('Con Attacco irruento e Ira attiva: il primo bersaglio colpito nel turno con un attacco di Forza subisce tanti d6 in più quanto il bonus ai danni dell\'Ira (SRD p. 30)')] },
  ],
  bard: [
    { id: 'bonus-proficiencies', nome: 'Competenze bonus (Collegio della sapienza)', nomeEn: 'Bonus Proficiencies', livello: 3, srd: { pagina: 35 }, effetti: [
      { tipo: 'scelta', scelta: { id: 'bard.competenze-bonus', tipo: 'abilita', quantita: 3, srd: { pagina: 35 } } }] },
    { id: 'cutting-words', nome: 'Parole taglienti (Collegio della sapienza)', nomeEn: 'Cutting Words', livello: 3, srd: { pagina: 35 }, effetti: [
      nota('Reazione, spendendo un\'Ispirazione bardica: sottrai il dado al tiro di danni, alla prova o al tiro per colpire riuscito di una creatura entro 18 m (SRD p. 35)')] },
  ],
  cleric: [
    { id: 'disciple-of-life', nome: 'Discepolo della vita (Dominio della vita)', nomeEn: 'Disciple of Life', livello: 3, srd: { pagina: 40 }, effetti: [
      nota('Un incantesimo lanciato con uno slot che fa recuperare PF ne fa recuperare 2 + il livello dello slot in più (SRD p. 40)')] },
    { id: 'life-domain-spells', nome: 'Incantesimi del Dominio della vita', nomeEn: 'Life Domain Spells', livello: 3, srd: { pagina: 40 }, effetti: [
      sempre('life-domain', 'Classe: Dominio della vita', 'cleric', 'cleric', 'SAG', ['aid', 'bless', 'cure-wounds', 'lesser-restoration'], 40)] },
    { id: 'preserve-life', nome: 'Preservare vita (Dominio della vita)', nomeEn: 'Preserve Life', livello: 3, srd: { pagina: 40 }, effetti: [
      nota('Un uso di Incanalare divinità: 5 PF per livello da chierico, divisi tra creature sanguinanti entro 9 m, fino a metà dei loro PF massimi (SRD p. 40)')] },
  ],
  druid: [
    { id: 'circle-of-the-land-spells', nome: 'Incantesimi del Circolo della terra', nomeEn: 'Circle of the Land Spells', livello: 3, srd: { pagina: 46 }, effetti: [
      { tipo: 'opzioni', scelta: { id: 'druid.terra', tipo: 'opzione', quantita: 1, opzioni: Object.keys(TERRE), srd: { pagina: 46 } },
        effetti: Object.fromEntries(Object.entries(TERRE).map(([k, t]) => [k, [sempre('circle-of-the-land', `Classe: Circolo della terra (${t.nome.toLowerCase()})`, 'druid', 'druid', 'SAG', t.incantesimi, 46, { trucchettiFissi: [t.trucchetto] })]])) }] },
    { id: 'lands-aid', nome: 'Ausilio dalla terra (Circolo della terra)', nomeEn: 'Land\'s Aid', livello: 3, srd: { pagina: 46 }, effetti: [
      nota('Un uso di Forma selvatica: sfera di 3 m entro 18 m, TS su Costituzione contro la CD degli incantesimi, 2d6 necrotici (metà se riesce); una creatura recupera 2d6 PF (SRD p. 46)')] },
  ],
  fighter: [
    { id: 'improved-critical', nome: 'Critico migliorato (Campione)', nomeEn: 'Improved Critical', livello: 3, srd: { pagina: 49 }, effetti: [
      { tipo: 'valoreClasse', id: 'critico', nome: 'Colpo critico con', valore: '19-20', srd: { pagina: 49 } }] },
    { id: 'remarkable-athlete', nome: 'Atleta straordinario (Campione)', nomeEn: 'Remarkable Athlete', livello: 3, srd: { pagina: 49 }, effetti: [
      nota('Vantaggio all\'iniziativa e alle prove di Forza (Atletica); dopo un colpo critico ti muovi di metà velocità senza attacchi di opportunità (SRD p. 49)')] },
  ],
  monk: [
    { id: 'deflect-attacks', nome: 'Devia attacchi', nomeEn: 'Deflect Attacks', livello: 3, srd: { pagina: 51 }, effetti: [
      nota('Reazione, se ti colpisce un attacco con danni contundenti, perforanti o taglienti: riduci i danni di 1d10 + Destrezza + livello da monaco; a 0, con 1 punto concentrazione rimandi il colpo (SRD p. 51)')] },
    { id: 'open-hand-technique', nome: 'Tecnica della mano aperta', nomeEn: 'Open Hand Technique', livello: 3, srd: { pagina: 52 }, effetti: [
      nota('Con Raffica di colpi, a ogni colpo: niente attacchi di opportunità, spinta di 4,5 m (TS su Forza) o prono (TS su Destrezza) (SRD p. 52)')] },
  ],
  paladin: [
    { id: 'paladin-channel-divinity', nome: 'Incanalare divinità', nomeEn: 'Channel Divinity', livello: 3, srd: { pagina: 54 }, effetti: [
      { tipo: 'risorsa', risorsa: { id: 'paladin-channel-divinity', nome: 'Incanalare divinità', usi: 2, dettaglio: 'Senso divino o Arma consacrata; CD degli incantesimi',
        recupero: [{ riposo: 'breve', quanti: 1 }, { riposo: 'lungo', quanti: 'tutti' }], srd: { pagina: 54 } } }] },
    { id: 'oath-of-devotion-spells', nome: 'Incantesimi del Giuramento di devozione', nomeEn: 'Oath of Devotion Spells', livello: 3, srd: { pagina: 56 }, effetti: [
      sempre('oath-of-devotion', 'Classe: Giuramento di devozione', 'paladin', 'paladin', 'CAR', ['protection-from-evil-and-good', 'shield-of-faith'], 56)] },
    { id: 'sacred-weapon', nome: 'Arma consacrata (Giuramento di devozione)', nomeEn: 'Sacred Weapon', livello: 3, srd: { pagina: 56 }, effetti: [
      nota('Un uso di Incanalare divinità con l\'azione Attacco: per 10 minuti + Carisma (minimo +1) ai tiri per colpire con l\'arma da mischia impugnata, danni anche radiosi, luce (SRD p. 56)')] },
  ],
  ranger: [
    { id: 'hunters-lore', nome: 'Sapienza del cacciatore', nomeEn: 'Hunter\'s Lore', livello: 3, srd: { pagina: 61 }, effetti: [
      nota('Sul bersaglio del Marchio del cacciatore conosci immunità, resistenze e vulnerabilità (SRD p. 61)')] },
    { id: 'hunters-prey', nome: 'Preda del cacciatore', nomeEn: 'Hunter\'s Prey', livello: 3, srd: { pagina: 61 }, effetti: [
      { tipo: 'opzioni', scelta: { id: 'ranger.preda', tipo: 'opzione', quantita: 1, opzioni: ['colossus-slayer', 'horde-breaker'], srd: { pagina: 61 } }, effetti: {
        'colossus-slayer': [nota('Uccisore di colossi: +1d8 danni, una volta per turno, a chi non ha tutti i PF; si cambia a ogni riposo (SRD p. 61)')],
        'horde-breaker': [nota('Fendente contro orde: una volta per turno un altro attacco con la stessa arma a una creatura diversa entro 1,5 m dal bersaglio; si cambia a ogni riposo (SRD p. 61)')],
      } }] },
  ],
  rogue: [
    { id: 'steady-aim', nome: 'Mira ferma', nomeEn: 'Steady Aim', livello: 3, srd: { pagina: 62 }, effetti: [
      nota('Azione bonus: vantaggio al prossimo attacco del turno se non ti sei mosso; poi velocità 0 fino a fine turno (SRD p. 62)'),
      { tipo: 'valoreClasse', id: 'sneak-attack', nome: 'Attacco furtivo', valore: '2d6', srd: { pagina: 62 } }] },
    { id: 'fast-hands', nome: 'Mani veloci (Ladro)', nomeEn: 'Fast Hands', livello: 3, srd: { pagina: 64 }, effetti: [
      nota('Azione bonus: Rapidità di mano (serrature, trappole, borseggio) o Usare un oggetto (SRD p. 64)')] },
    { id: 'second-story-work', nome: 'Lavoro al secondo piano (Ladro)', nomeEn: 'Second-Story Work', livello: 3, srd: { pagina: 64 }, effetti: [
      nota('Velocità di scalata pari alla velocità; la distanza del salto con la Destrezza (SRD p. 64)')] },
  ],
  sorcerer: [
    { id: 'draconic-resilience', nome: 'Resilienza draconica (Stregoneria draconica)', nomeEn: 'Draconic Resilience', livello: 3, srd: { pagina: 69 }, effetti: [
      { tipo: 'pfMassimi', perLivello: 1, etichetta: 'Resilienza draconica' },
      { tipo: 'formulaCA', formula: { id: 'resilienza-draconica', nome: 'Resilienza draconica', base: 10, caratteristiche: ['DES', 'CAR'], richiede: 'nessunaArmatura', srd: { pagina: 69 } } }] },
    { id: 'draconic-spells', nome: 'Incantesimi draconici', nomeEn: 'Draconic Spells', livello: 3, srd: { pagina: 70 }, effetti: [
      sempre('draconic-spells', 'Classe: Stregoneria draconica', 'sorcerer', 'sorcerer', 'CAR', ['alter-self', 'chromatic-orb', 'command', 'dragons-breath'], 70)] },
  ],
  warlock: [
    { id: 'dark-ones-blessing', nome: 'Benedizione dell\'oscuro (Patrono immondo)', nomeEn: 'Dark One\'s Blessing', livello: 3, srd: { pagina: 76 }, effetti: [
      nota('Quando un nemico va a 0 PF (per mano tua, o di altri entro 3 m), ottieni PF temporanei pari a Carisma + livello da warlock, minimo 1 (SRD p. 76)')] },
    { id: 'fiend-spells', nome: 'Incantesimi del Patrono immondo', nomeEn: 'Fiend Spells', livello: 3, srd: { pagina: 76 }, effetti: [
      sempre('fiend-spells', 'Classe: Patrono immondo', 'warlock', 'warlock', 'CAR', ['burning-hands', 'command', 'scorching-ray', 'suggestion'], 76, { slot: 'patto' })] },
  ],
  wizard: [
    { id: 'evocation-savant', nome: 'Invocatore sapiente', nomeEn: 'Evocation Savant', livello: 3, srd: { pagina: 82 }, effetti: [
      { tipo: 'libroExtra', quanti: 2, etichetta: 'Invocatore sapiente: 2 incantesimi di invocazione fino al 2° livello, gratis' }] },
    { id: 'potent-cantrip', nome: 'Trucchetto potente (Invocatore)', nomeEn: 'Potent Cantrip', livello: 3, srd: { pagina: 82 }, effetti: [
      nota('Se il bersaglio evita un tuo trucchetto che fa danni (attacco mancato o TS riuscito) subisce comunque metà danni, senza altri effetti (SRD p. 82)')] },
  ],
};

// ───────── 4° livello (23/11/2026): Aumento dei punteggi o un altro talento ─────────
// Valori attesi approvati da Patrizio il 23/11 (file «Valori attesi 4° livello»). Si sceglie un talento di qualsiasi categoria
// con i requisiti (p. 87), oppure «un altro talento» scritto a mano (fuori dall'SRD, non calcolato, con avviso: scelta di Patrizio).
export const TALENTO_LIBERO = 'talento-libero';
const aumento4 = (pagina: number): Feature => ({ id: 'ability-score-improvement-4', nome: 'Aumento dei punteggi di caratteristica', nomeEn: 'Ability Score Improvement', livello: 4, srd: { pagina }, effetti: [
  { tipo: 'scelta', scelta: { id: 'talento-4', tipo: 'talento', quantita: 1, srd: { pagina: 87 } } },
  { tipo: 'talento', talento: { daScelta: 'talento-4' } }] });
const padronanza4 = (classe: string, pagina: number): Feature[] => {
  const l1 = CLASSI[classe].features.flatMap((f) => f.effetti).find((e) => e.tipo === 'scelta' && e.scelta.tipo === 'maestriaArma');
  const opzioni = l1 && l1.tipo === 'scelta' ? l1.scelta.opzioni : undefined;
  return [{ id: `${classe}-weapon-mastery-4`, nome: 'Padronanza d\'armi', nomeEn: 'Weapon Mastery', livello: 4, srd: { pagina }, effetti: [
    { tipo: 'scelta', scelta: { id: `${classe}.padronanza-4`, tipo: 'maestriaArma', quantita: 1, ...(opzioni ? { opzioni } : {}), srd: { pagina } } }] }];
};
// Forme del 4° livello: GS fino a 1/2, senza volo (tabella Beast Shapes, p. 42)
export const FORME_SELVATICHE_GS_1_2 = [...FORME_SELVATICHE_GS_1_4, 'giant-goat', 'warhorse', 'giant-seahorse', 'crocodile', 'ape', 'black-bear', 'reef-shark'];
const LIVELLO_4: Record<string, () => Feature[]> = {
  barbarian: () => [aumento4(29), ...padronanza4('barbarian', 28)],
  bard: () => [aumento4(32)], cleric: () => [aumento4(37)], paladin: () => [aumento4(54)], ranger: () => [aumento4(59)],
  rogue: () => [aumento4(62)], sorcerer: () => [aumento4(66)], warlock: () => [aumento4(72)], wizard: () => [aumento4(78)],
  druid: () => [aumento4(43), { id: 'wild-shape-4', nome: 'Forma selvatica: forme', nomeEn: 'Wild Shape', livello: 4, srd: { pagina: 42 }, effetti: [
    { tipo: 'scelta', scelta: { id: 'druid.forme-4', tipo: 'opzione', quantita: 2, opzioni: FORME_SELVATICHE_GS_1_2, srd: { pagina: 42 } } },
    nota('Al 4° livello: 6 forme conosciute, GS fino a 1/2, senza volo (SRD p. 42)')] }],
  fighter: () => [aumento4(48), ...padronanza4('fighter', 47)],
  monk: () => [aumento4(51), { id: 'slow-fall', nome: 'Caduta lenta', nomeEn: 'Slow Fall', livello: 4, srd: { pagina: 51 }, effetti: [
    nota('Reazione quando cadi: riduci i danni della caduta di 5 volte il tuo livello da monaco (SRD p. 51)')] }],
};

// Tabelle delle classi fino al 3° livello: incantesimi preparati, slot, patto (p. 31, 36, 41, 53, 57, 64, 71, 77)
const PREPARATI: Record<string, number[]> = { bard: [4, 5, 6, 7, 9], cleric: [4, 5, 6, 7, 9], druid: [4, 5, 6, 7, 9], paladin: [2, 3, 4, 5, 6], ranger: [2, 3, 4, 5, 6], sorcerer: [2, 4, 6, 7, 9], warlock: [2, 3, 4, 5, 6], wizard: [4, 5, 6, 7, 9] };
// Trucchetti conosciuti per livello (tabelle delle classi)
const TRUCCHETTI: Record<string, number[]> = { bard: [2, 2, 2, 3, 3], cleric: [3, 3, 3, 4, 4], druid: [2, 2, 2, 3, 3], sorcerer: [4, 4, 4, 5, 5], warlock: [2, 2, 2, 3, 3], wizard: [3, 3, 3, 4, 4] };
// ───────── 5° livello (23/11/2026): valori attesi approvati da Patrizio (file «Valori attesi 5° livello») ─────────
const attaccoExtra = (pagina: number): Feature => ({ id: 'extra-attack', nome: 'Attacco extra', nomeEn: 'Extra Attack', livello: 5, srd: { pagina }, effetti: [
  { tipo: 'valoreClasse', id: 'attacchi', nome: 'Attacchi con l\'azione Attacco', valore: '2', srd: { pagina } }] });
const SUPPLICHE_5 = (): Record<string, Effetto[]> => {
  const l1 = CLASSI.warlock.features.flatMap((f) => f.effetti).find((e) => e.tipo === 'opzioni' && e.scelta.id === 'warlock.suppliche');
  const patti = l1 && l1.tipo === 'opzioni' ? Object.fromEntries(Object.entries(l1.effetti).filter(([k]) => k.startsWith('pact-of'))) : {};
  const { 'armor-of-shadows': ombre, 'eldritch-mind': mente, ...altre2 } = SUPPLICHE_2;
  return { 'armor-of-shadows': ombre, 'eldritch-mind': mente, ...patti, ...altre2,
    'ascendant-step': [nota('Passo ascendente: lanci Levitazione su te stesso senza slot (SRD p. 72)')],
    'gaze-of-two-minds': [nota('Sguardo delle due menti: con un\'Azione bonus tocchi una creatura consenziente e percepisci con i suoi sensi fino alla fine del tuo turno successivo; puoi lanciare incantesimi dal suo spazio (SRD p. 73)')],
    'gift-of-the-depths': [nota('Dono degli abissi: respiri sott\'acqua e nuoti alla tua velocità; lanci Respirare sott\'acqua senza slot una volta per riposo lungo (SRD p. 73)')],
    'master-of-myriad-forms': [nota('Maestro di mille forme: lanci Alterare se stessi senza slot (SRD p. 74)')],
    'one-with-shadows': [nota('Tutt\'uno con le ombre: nella luce fioca o al buio lanci Invisibilità su te stesso senza slot (SRD p. 74)')],
    'eldritch-smite': [nota('Punizione occulta: una volta per turno, colpendo con l\'arma del patto, spendi uno slot del patto per 1d8 danni da forza più 1d8 per livello dello slot; puoi buttare a terra un bersaglio Enorme o più piccolo (SRD p. 73)')],
    'thirsting-blade': [nota('Lama assetata: Attacco extra con l\'arma del patto (2 attacchi con l\'azione Attacco) (SRD p. 74)')],
    'investment-of-the-chain-master': [nota('Investitura del Signore delle Catene: il famiglio vola o nuota a 12 m, attacca con la tua Azione bonus, può fare danni necrotici o radiosi, usa la tua CD; con una Reazione gli dai resistenza ai danni (SRD p. 73)')],
  };
};
const LIVELLO_5: Record<string, () => Feature[]> = {
  barbarian: () => [attaccoExtra(29), { id: 'fast-movement', nome: 'Movimento veloce', nomeEn: 'Fast Movement', livello: 5, srd: { pagina: 29 }, effetti: [
    { tipo: 'velocitaSenzaPesante', valore: 10, etichetta: 'Movimento veloce' }] }],
  bard: () => [{ id: 'font-of-inspiration', nome: 'Fonte di ispirazione', nomeEn: 'Font of Inspiration', livello: 5, srd: { pagina: 33 }, effetti: [
    nota('Recuperi tutta l\'Ispirazione bardica anche con un riposo breve; puoi spendere uno slot (senza azione) per recuperarne un uso (SRD p. 33)')] }],
  cleric: () => [{ id: 'sear-undead', nome: 'Bruciare i non morti', nomeEn: 'Sear Undead', livello: 5, srd: { pagina: 37 }, effetti: [
    nota('Quando usi Scacciare non morti tiri tanti d8 quanto il tuo modificatore di Saggezza (minimo 1): i non morti che falliscono il tiro salvezza subiscono quei danni radiosi (SRD p. 37)')] }],
  druid: () => [{ id: 'wild-resurgence', nome: 'Rinascita selvatica', nomeEn: 'Wild Resurgence', livello: 5, srd: { pagina: 43 }, effetti: [
    nota('Senza usi di Forma selvatica, una volta per turno ne recuperi uno spendendo uno slot; puoi spendere un uso per avere uno slot di 1° livello, una volta per riposo lungo (SRD p. 43)')] }],
  fighter: () => [attaccoExtra(48), { id: 'tactical-shift', nome: 'Spostamento tattico', nomeEn: 'Tactical Shift', livello: 5, srd: { pagina: 48 }, effetti: [
    nota('Quando usi Recuperare energie con un\'Azione bonus, ti muovi fino a metà velocità senza provocare attacchi di opportunità (SRD p. 48)')] }],
  monk: () => [attaccoExtra(51), { id: 'stunning-strike', nome: 'Colpo stordente', nomeEn: 'Stunning Strike', livello: 5, srd: { pagina: 51 }, effetti: [
    { tipo: 'valoreClasse', id: 'martial-arts-die', nome: 'Dado delle Arti marziali', valore: '1d8', srd: { pagina: 50 } },
    nota('Una volta per turno, colpendo con un\'arma da monaco o un colpo senz\'armi, spendi 1 punto: TS su Costituzione contro la CD della concentrazione o stordito fino al tuo turno successivo; se riesce, velocità dimezzata e vantaggio al prossimo attacco contro di lui (SRD p. 51)')] }],
  paladin: () => [attaccoExtra(54), { id: 'faithful-steed', nome: 'Fido destriero', nomeEn: 'Faithful Steed', livello: 5, srd: { pagina: 54 }, effetti: [
    { tipo: 'magia', concessione: { id: 'faithful-steed', nome: 'Classe: Fido destriero', fonte: { tipo: 'classe', id: 'paladin' }, lista: 'paladin', caratteristica: 'CAR',
      semprePreparati: ['find-steed'], lanciGratuiti: { incantesimi: ['find-steed'], usi: 1, recupero: 'lungo' }, puoUsareSlot: true, slot: 'normali', srd: { pagina: 54 } } }] }],
  ranger: () => [attaccoExtra(59)],
  rogue: () => [
    { id: 'cunning-strike', nome: 'Colpo astuto', nomeEn: 'Cunning Strike', livello: 5, srd: { pagina: 62 }, effetti: [
      { tipo: 'valoreClasse', id: 'sneak-attack', nome: 'Attacco furtivo', valore: '3d6', srd: { pagina: 62 } },
      { tipo: 'cdSpeciale', id: 'cunning-strike', nome: 'Classe: Colpo astuto', caratteristica: 'DES', srd: { pagina: 62 } },
      nota('Rinunci a dadi dell\'Attacco furtivo per un effetto: Veleno (1d6, TS su Costituzione o avvelenato 1 minuto; servono le sostanze da avvelenatore), Inciampo (1d6, TS su Destrezza o prono, bersaglio Grande o più piccolo), Ritirata (1d6, ti muovi di metà velocità senza attacchi di opportunità) (SRD p. 62)')] },
    { id: 'uncanny-dodge', nome: 'Schivata prodigiosa', nomeEn: 'Uncanny Dodge', livello: 5, srd: { pagina: 63 }, effetti: [
      nota('Reazione quando un attaccante che vedi ti colpisce: dimezzi i danni dell\'attacco (SRD p. 63)')] }],
  sorcerer: () => [{ id: 'sorcerous-restoration', nome: 'Ripristino stregonesco', nomeEn: 'Sorcerous Restoration', livello: 5, srd: { pagina: 66 }, effetti: [
    nota('Finito un riposo breve recuperi punti stregoneria fino a metà del livello da stregone (2 al 5°), una volta per riposo lungo (SRD p. 66)')] }],
  warlock: () => [{ id: 'eldritch-invocations-5', nome: 'Suppliche occulte', nomeEn: 'Eldritch Invocations', livello: 5, srd: { pagina: 70 }, effetti: [
    { tipo: 'opzioni', scelta: { id: 'warlock.suppliche-5', tipo: 'opzione', quantita: 2, opzioni: Object.keys(SUPPLICHE_5()), srd: { pagina: 72 } }, effetti: SUPPLICHE_5() }] }],
  wizard: () => [
    { id: 'memorize-spell', nome: 'Memorizzare incantesimi', nomeEn: 'Memorize Spell', livello: 5, srd: { pagina: 78 }, effetti: [
      nota('Finito un riposo breve puoi cambiare un incantesimo preparato di 1° livello o più con un altro del libro (SRD p. 78)')] },
    { id: 'evocation-savant-5', nome: 'Invocatore sapiente', nomeEn: 'Evocation Savant', livello: 5, srd: { pagina: 82 }, effetti: [
      { tipo: 'libroExtra', quanti: 1, etichetta: 'Invocatore sapiente: un\'invocazione del nuovo livello di slot' }] }],
};
// Livello da warlock che serve per ogni supplica (p. 72-74). Tutte le tendine delle suppliche accettano tutte le suppliche:
// il livello lo controlla il motore, così salendo di livello se ne può cambiare una con una di livello più alto (p. 71)
export const LIVELLO_SUPPLICA: Record<string, number> = {
  'armor-of-shadows': 1, 'eldritch-mind': 1, 'pact-of-the-chain': 1, 'pact-of-the-blade': 1, 'pact-of-the-tome': 1,
  'agonizing-blast': 2, 'devils-sight': 2, 'eldritch-spear': 2, 'fiendish-vigor': 2, 'mask-of-many-faces': 2, 'misty-visions': 2,
  'otherworldly-leap': 2, 'repelling-blast': 2, 'lessons-of-the-first-ones': 2,
  'ascendant-step': 5, 'gaze-of-two-minds': 5, 'gift-of-the-depths': 5, 'master-of-myriad-forms': 5, 'one-with-shadows': 5,
  'eldritch-smite': 5, 'thirsting-blade': 5, 'investment-of-the-chain-master': 5,
};

// Incantesimi di sottoclasse del 5° livello (p. 40, 46, 56, 69, 76)
const SOTTOCLASSE_5: Record<string, string[]> = { 'life-domain': ['mass-healing-word', 'revivify'], 'oath-of-devotion': ['aid', 'zone-of-truth'],
  'draconic-spells': ['fear', 'fly'], 'fiend-spells': ['fireball', 'stinking-cloud'] };
const TERRE_5: Record<string, string> = { arid: 'fireball', polar: 'sleet-storm', temperate: 'lightning-bolt', tropical: 'stinking-cloud' };

const SLOT: Record<string, Record<number, number[]>> = {
  bard: { 1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2] }, cleric: { 1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2] }, druid: { 1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2] },
  sorcerer: { 1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2] }, wizard: { 1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2] },
  paladin: { 1: [2], 2: [2], 3: [3], 4: [3], 5: [4, 2] }, ranger: { 1: [2], 2: [2], 3: [3], 4: [3], 5: [4, 2] },
};
for (const [id, c] of Object.entries(CLASSI)) {
  c.features.push(...(LIVELLO_2[id] ?? []), ...(LIVELLO_3[id] ?? []), ...(LIVELLO_4[id]?.() ?? []), ...(LIVELLO_5[id]?.() ?? []));
  for (const f of c.features) for (const e of f.effetti) {
    if (e.tipo === 'opzioni' && e.scelta.id.startsWith('warlock.suppliche')) { const tutte = SUPPLICHE_5(); e.effetti = tutte; e.scelta = { ...e.scelta, opzioni: Object.keys(tutte) }; }
    if (e.tipo === 'magia' && SOTTOCLASSE_5[e.concessione.id]) e.concessione.semprePreparatiDal = { 5: SOTTOCLASSE_5[e.concessione.id] };
    if (e.tipo === 'opzioni' && e.scelta.id === 'druid.terra') for (const [terra, eff] of Object.entries(e.effetti)) for (const x of eff)
      if (x.tipo === 'magia') x.concessione.semprePreparatiDal = { 5: [TERRE_5[terra]] };
    // Nemico prescelto: Marchio del cacciatore gratis 2 volte, 3 dal 5° livello (tabella p. 57)
    if (e.tipo === 'magia' && e.concessione.lanciGratuiti && e.concessione.semprePreparati?.includes('hunters-mark')) e.concessione.lanciGratuiti.usi = { perLivelli: [2, 2, 2, 2, 3] };
    if (e.tipo === 'risorsa' && e.risorsa.id === 'bardic-inspiration')
      e.risorsa.dal = { 5: { dettaglio: 'd8', recupero: [{ riposo: 'breve', quanti: 'tutti' }, { riposo: 'lungo', quanti: 'tutti' }] } };   // Fonte di ispirazione (p. 33)
    if (e.tipo === 'risorsa' && e.risorsa.id === 'wild-shape')
      e.risorsa.dal = { 4: { dettaglio: 'azione bonus; 6 forme di GS fino a 1/2 senza volo; PF temporanei pari al livello da druido' } };
  }
  if (SLOT[id]) c.slot = SLOT[id];
  for (const f of c.features) for (const e of f.effetti) if (e.tipo === 'magia' && e.concessione.fonte.tipo === 'classe' && e.concessione.id === id) {
    const conc: ConcessioneMagia = e.concessione;
    if (conc.preparati && PREPARATI[id]) conc.preparati = { ...conc.preparati, numero: { perLivelli: PREPARATI[id] } };
    if (conc.libro) conc.libro = { ...conc.libro, perLivello: 2 };
    if (conc.trucchetti && TRUCCHETTI[id]) conc.trucchetti = { ...conc.trucchetti, quantita: { perLivelli: TRUCCHETTI[id] } };
  }
}
CLASSI.warlock.patto = { 1: { numero: 1, livello: 1 }, 2: { numero: 2, livello: 1 }, 3: { numero: 2, livello: 2 }, 4: { numero: 2, livello: 2 }, 5: { numero: 2, livello: 3 } };
// Usi che crescono con il livello (tabelle p. 28, 49, 64): Ira, punti concentrazione, punti stregoneria
for (const f of [...CLASSI.barbarian.features, ...CLASSI.monk.features, ...CLASSI.sorcerer.features, ...CLASSI.fighter.features]) for (const e of f.effetti) if (e.tipo === 'risorsa') {
  if (e.risorsa.id === 'rage') e.risorsa.usi = { perLivelli: [2, 2, 3] };
  if (e.risorsa.id === 'focus') e.risorsa.usi = { perLivelli: [0, 2, 3, 4, 5] };
  if (e.risorsa.id === 'sorcery-points') e.risorsa.usi = { perLivelli: [0, 2, 3, 4, 5] };
  if (e.risorsa.id === 'second-wind') e.risorsa.usi = { perLivelli: [2, 2, 2, 3, 3] };
  if (e.risorsa.id === 'rage') e.risorsa.usi = { perLivelli: [2, 2, 3, 3, 3] };
}
