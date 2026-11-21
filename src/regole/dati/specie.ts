// Le 9 specie dell'SRD 5.2 (pp. 84-86), livello 1.
import type { ConcessioneMagia, Effetto, Lignaggio, Specie } from '../tipi';
import { TUTTE_LE_ABILITA } from './base';
import { metri } from '../misure';

const scuro = (piedi: number): Effetto => ({ tipo: 'nota', testo: `Scurovisione ${metri(piedi)}` });
const carScelta = (id: string, pagina: number): Effetto =>
  ({ tipo: 'scelta', scelta: { id, tipo: 'caratteristica', quantita: 1, opzioni: ['INT', 'SAG', 'CAR'], srd: { pagina } } });

const magiaSpecie = (id: string, nome: string, specie: string, sceltaCar: string, pagina: number,
  extra: Partial<ConcessioneMagia>): Effetto => ({ tipo: 'magia', concessione: {
    id, nome, fonte: { tipo: 'specie', id: specie }, caratteristica: { daScelta: sceltaCar },
    puoUsareSlot: false, srd: { pagina }, ...extra } });

const ANTENATI: [string, string, string][] = [
  ['black', 'Nero', 'acido'], ['blue', 'Blu', 'fulmine'], ['brass', 'Ottone', 'fuoco'], ['bronze', 'Bronzo', 'fulmine'],
  ['copper', 'Rame', 'acido'], ['gold', 'Oro', 'fuoco'], ['green', 'Verde', 'veleno'], ['red', 'Rosso', 'fuoco'],
  ['silver', 'Argento', 'freddo'], ['white', 'Bianco', 'freddo'],
];

const tieflingLegacy = (id: string, nome: string, nomeEn: string, danno: string, trucchetto: string): Lignaggio => ({
  id, nome, nomeEn, srd: { pagina: 86 }, effetti: [
    { tipo: 'resistenza', danno },
    magiaSpecie('tiefling', `Specie: Tiefling (${nome.toLowerCase()})`, 'tiefling', 'tiefling.caratteristica', 86,
      { trucchettiFissi: [trucchetto, 'thaumaturgy'] }),   // Presenza ultraterrena: Taumaturgia con la stessa caratteristica
  ] });

export const SPECIE: Record<string, Specie> = {
  dragonborn: {
    id: 'dragonborn', nome: 'Dragonide', nomeEn: 'Dragonborn', srd: { pagina: 84 }, taglie: ['media'], velocita: 30,
    lignaggi: { scelta: 'dragonborn.antenato', srd: { pagina: 84 }, opzioni: ANTENATI.map(([id, nome, danno]) => ({
      id, nome: `Drago ${nome.toLowerCase()}`, nomeEn: `${id} dragon`, srd: { pagina: 84 }, effetti: [{ tipo: 'resistenza', danno } as Effetto],
    })) },
    tratti: [
      { id: 'breath-weapon', nome: 'Soffio', nomeEn: 'Breath Weapon', livello: 1, srd: { pagina: 84 }, effetti: [
        { tipo: 'cdSpeciale', id: 'breath-weapon', nome: 'Specie: Soffio', caratteristica: 'COS', srd: { pagina: 84 } },
        { tipo: 'risorsa', risorsa: { id: 'breath-weapon', nome: 'Soffio', usi: { competenza: true }, dettaglio: '1d10, TS di Destrezza',
          recupero: [{ riposo: 'lungo', quanti: 'tutti' }], srd: { pagina: 84 } } },
      ] },
      { id: 'dragonborn-darkvision', nome: 'Scurovisione', nomeEn: 'Darkvision', livello: 1, srd: { pagina: 84 }, effetti: [scuro(60)] },
    ],
  },

  dwarf: {
    id: 'dwarf', nome: 'Nano', nomeEn: 'Dwarf', srd: { pagina: 84 }, taglie: ['media'], velocita: 30,
    tratti: [
      { id: 'dwarf-darkvision', nome: 'Scurovisione', nomeEn: 'Darkvision', livello: 1, srd: { pagina: 84 }, effetti: [scuro(120)] },
      { id: 'dwarven-resilience', nome: 'Resilienza nanica', nomeEn: 'Dwarven Resilience', livello: 1, srd: { pagina: 84 }, effetti: [{ tipo: 'resistenza', danno: 'veleno' }] },
      { id: 'dwarven-toughness', nome: 'Robustezza nanica', nomeEn: 'Dwarven Toughness', livello: 1, srd: { pagina: 84 }, effetti: [
        { tipo: 'pfMassimi', perLivello: 1, etichetta: 'Robustezza nanica' }] },
      { id: 'stonecunning', nome: 'Esperto minatore', nomeEn: 'Stonecunning', livello: 1, srd: { pagina: 84 }, effetti: [
        { tipo: 'risorsa', risorsa: { id: 'stonecunning', nome: 'Esperto minatore', usi: { competenza: true }, dettaglio: `Percezione tellurica ${metri(60)} per 10 minuti`,
          recupero: [{ riposo: 'lungo', quanti: 'tutti' }], srd: { pagina: 84 } } }] },
    ],
  },

  elf: {
    id: 'elf', nome: 'Elfo', nomeEn: 'Elf', srd: { pagina: 84 }, taglie: ['media'], velocita: 30,
    lignaggi: { scelta: 'elf.lignaggio', srd: { pagina: 85 }, opzioni: [
      { id: 'drow', nome: 'Drow', nomeEn: 'Drow', srd: { pagina: 85 }, effetti: [
        { tipo: 'nota', testo: `Scurovisione ${metri(120)}` },
        magiaSpecie('elf', 'Specie: Elfo (drow)', 'elf', 'elf.caratteristica', 85, { trucchettiFissi: ['dancing-lights'] }) ] },
      { id: 'high-elf', nome: 'Elfo alto', nomeEn: 'High Elf', srd: { pagina: 85 }, effetti: [
        magiaSpecie('elf', 'Specie: Alto elfo', 'elf', 'elf.caratteristica', 85, { trucchettiFissi: ['prestidigitation'],
          cambioTrucchetti: { quando: 'riposoLungo', quanti: 1, srd: { pagina: 85 } } }) ] },
      { id: 'wood-elf', nome: 'Elfo dei boschi', nomeEn: 'Wood Elf', srd: { pagina: 85 }, effetti: [
        { tipo: 'velocita', valore: 35 },
        magiaSpecie('elf', 'Specie: Elfo dei boschi', 'elf', 'elf.caratteristica', 85, { trucchettiFissi: ['druidcraft'] }) ] },
    ] },
    tratti: [
      { id: 'elf-darkvision', nome: 'Scurovisione', nomeEn: 'Darkvision', livello: 1, srd: { pagina: 84 }, effetti: [scuro(60)] },
      { id: 'elven-lineage', nome: 'Lignaggio elfico', nomeEn: 'Elven Lineage', livello: 1, srd: { pagina: 84 }, effetti: [carScelta('elf.caratteristica', 85)] },
      { id: 'fey-ancestry', nome: 'Retaggio fatato', nomeEn: 'Fey Ancestry', livello: 1, srd: { pagina: 85 }, effetti: [{ tipo: 'nota', testo: 'Vantaggio ai TS contro la condizione Affascinato' }] },
      { id: 'keen-senses', nome: 'Sensi acuti', nomeEn: 'Keen Senses', livello: 1, srd: { pagina: 85 }, effetti: [
        { tipo: 'scelta', scelta: { id: 'elf.sensi-acuti', tipo: 'abilita', quantita: 1, opzioni: ['insight', 'perception', 'survival'], srd: { pagina: 85 } } }] },
      { id: 'trance', nome: 'Trance', nomeEn: 'Trance', livello: 1, srd: { pagina: 85 }, effetti: [{ tipo: 'nota', testo: 'Riposo lungo in 4 ore; la magia non ti addormenta' }] },
    ],
  },

  gnome: {
    id: 'gnome', nome: 'Gnomo', nomeEn: 'Gnome', srd: { pagina: 85 }, taglie: ['piccola'], velocita: 30,
    lignaggi: { scelta: 'gnome.lignaggio', srd: { pagina: 85 }, opzioni: [
      { id: 'forest-gnome', nome: 'Gnomo delle foreste', nomeEn: 'Forest Gnome', srd: { pagina: 85 }, effetti: [
        magiaSpecie('gnome', 'Specie: Gnomo dei boschi', 'gnome', 'gnome.caratteristica', 85, {
          trucchettiFissi: ['minor-illusion'], semprePreparati: ['speak-with-animals'], puoUsareSlot: true,
          lanciGratuiti: { incantesimi: ['speak-with-animals'], usi: { competenza: true }, recupero: 'lungo' } }) ] },
      { id: 'rock-gnome', nome: 'Gnomo delle rocce', nomeEn: 'Rock Gnome', srd: { pagina: 85 }, effetti: [
        magiaSpecie('gnome', 'Specie: Gnomo delle rocce', 'gnome', 'gnome.caratteristica', 85, { trucchettiFissi: ['mending', 'prestidigitation'] }) ] },
    ] },
    tratti: [
      { id: 'gnome-darkvision', nome: 'Scurovisione', nomeEn: 'Darkvision', livello: 1, srd: { pagina: 85 }, effetti: [scuro(60)] },
      { id: 'gnomish-cunning', nome: 'Astuzia gnomesca', nomeEn: 'Gnomish Cunning', livello: 1, srd: { pagina: 85 }, effetti: [{ tipo: 'nota', testo: 'Vantaggio ai TS di INT, SAG e CAR' }] },
      { id: 'gnomish-lineage', nome: 'Lignaggio gnomesco', nomeEn: 'Gnomish Lineage', livello: 1, srd: { pagina: 85 }, effetti: [carScelta('gnome.caratteristica', 85)] },
    ],
  },

  goliath: {
    id: 'goliath', nome: 'Goliath', nomeEn: 'Goliath', srd: { pagina: 85 }, taglie: ['media'], velocita: 35,
    lignaggi: { scelta: 'goliath.antenato', srd: { pagina: 85 }, opzioni: [
      ['clouds-jaunt', 'Salta-nuvole', "Cloud's Jaunt"], ['fires-burn', 'Fuoco bruciante', "Fire's Burn"],
      ['frosts-chill', 'Brivido gelante', "Frost's Chill"], ['hills-tumble', 'Forza della collina', "Hill's Tumble"],
      ['stones-endurance', 'Resistenza della pietra', "Stone's Endurance"], ['storms-thunder', 'Tuono tempestoso', "Storm's Thunder"],
    ].map(([id, nome, nomeEn]) => ({ id, nome, nomeEn, srd: { pagina: 85 }, effetti: [
      { tipo: 'risorsa', risorsa: { id: 'giant-ancestry', nome: `Discendenza gigantica: ${nome}`, usi: { competenza: true },
        recupero: [{ riposo: 'lungo', quanti: 'tutti' }], srd: { pagina: 85 } } } as Effetto] })) },
    tratti: [
      { id: 'powerful-build', nome: 'Costituzione robusta', nomeEn: 'Powerful Build', livello: 1, srd: { pagina: 86 }, effetti: [{ tipo: 'nota', testo: 'Vantaggio per liberarsi da Afferrato; conti come una taglia più grande per il carico' }] },
    ],
  },

  halfling: {
    id: 'halfling', nome: 'Halfling', nomeEn: 'Halfling', srd: { pagina: 86 }, taglie: ['piccola'], velocita: 30,
    tratti: [
      { id: 'brave', nome: 'Coraggioso', nomeEn: 'Brave', livello: 1, srd: { pagina: 86 }, effetti: [{ tipo: 'nota', testo: 'Vantaggio ai TS contro Spaventato' }] },
      { id: 'halfling-nimbleness', nome: 'Agilità halfling', nomeEn: 'Halfling Nimbleness', livello: 1, srd: { pagina: 86 }, effetti: [{ tipo: 'nota', testo: 'Attraversi lo spazio delle creature più grandi di una taglia' }] },
      { id: 'luck', nome: 'Fortuna', nomeEn: 'Luck', livello: 1, srd: { pagina: 86 }, effetti: [{ tipo: 'nota', testo: 'Se tiri 1 sul d20 di una Prova d20, ritiri e usi il nuovo risultato' }] },
      { id: 'naturally-stealthy', nome: 'Furtività innata', nomeEn: 'Naturally Stealthy', livello: 1, srd: { pagina: 86 }, effetti: [{ tipo: 'nota', testo: 'Puoi Nasconderti dietro una creatura più grande di una taglia' }] },
    ],
  },

  human: {
    id: 'human', nome: 'Umano', nomeEn: 'Human', srd: { pagina: 86 }, taglie: ['media', 'piccola'], velocita: 30,
    tratti: [
      { id: 'resourceful', nome: 'Intraprendente', nomeEn: 'Resourceful', livello: 1, srd: { pagina: 86 }, effetti: [{ tipo: 'nota', testo: 'Ottieni Ispirazione eroica dopo ogni riposo lungo' }] },
      { id: 'skillful', nome: 'Pluriabilità', nomeEn: 'Skillful', livello: 1, srd: { pagina: 86 }, effetti: [
        { tipo: 'scelta', scelta: { id: 'human.abile', tipo: 'abilita', quantita: 1, opzioni: TUTTE_LE_ABILITA, srd: { pagina: 86 } } }] },
      { id: 'versatile', nome: 'Versatile', nomeEn: 'Versatile', livello: 1, srd: { pagina: 86 }, effetti: [
        { tipo: 'scelta', scelta: { id: 'human.versatile', tipo: 'talento', quantita: 1, filtro: { categoriaTalento: 'origine' }, srd: { pagina: 86 } } },
        { tipo: 'talento', talento: { daScelta: 'human.versatile' } }] },
    ],
  },

  orc: {
    id: 'orc', nome: 'Orco', nomeEn: 'Orc', srd: { pagina: 86 }, taglie: ['media'], velocita: 30,
    tratti: [
      { id: 'adrenaline-rush', nome: 'Scarica di adrenalina', nomeEn: 'Adrenaline Rush', livello: 1, srd: { pagina: 86 }, effetti: [
        { tipo: 'risorsa', risorsa: { id: 'adrenaline-rush', nome: 'Scarica di adrenalina', usi: { competenza: true }, dettaglio: 'Scatto come Azione bonus + PF temporanei pari alla competenza',
          recupero: [{ riposo: 'breve', quanti: 'tutti' }, { riposo: 'lungo', quanti: 'tutti' }], srd: { pagina: 86 } } }] },
      { id: 'orc-darkvision', nome: 'Scurovisione', nomeEn: 'Darkvision', livello: 1, srd: { pagina: 86 }, effetti: [scuro(120)] },
      { id: 'relentless-endurance', nome: 'Resistenza implacabile', nomeEn: 'Relentless Endurance', livello: 1, srd: { pagina: 86 }, effetti: [
        { tipo: 'risorsa', risorsa: { id: 'relentless-endurance', nome: 'Resistenza implacabile', usi: 1, dettaglio: 'scendi a 1 PF invece che a 0',
          recupero: [{ riposo: 'lungo', quanti: 'tutti' }], srd: { pagina: 86 } } }] },
    ],
  },

  tiefling: {
    id: 'tiefling', nome: 'Tiefling', nomeEn: 'Tiefling', srd: { pagina: 86 }, taglie: ['media', 'piccola'], velocita: 30,
    lignaggi: { scelta: 'tiefling.eredita', srd: { pagina: 86 }, opzioni: [
      tieflingLegacy('abyssal', 'Abissale', 'Abyssal', 'veleno', 'poison-spray'),
      tieflingLegacy('chthonic', 'Ctonio', 'Chthonic', 'necrotico', 'chill-touch'),
      tieflingLegacy('infernal', 'Infernale', 'Infernal', 'fuoco', 'fire-bolt'),
    ] },
    tratti: [
      { id: 'tiefling-darkvision', nome: 'Scurovisione', nomeEn: 'Darkvision', livello: 1, srd: { pagina: 86 }, effetti: [scuro(60)] },
      { id: 'fiendish-legacy', nome: 'Retaggio immondo', nomeEn: 'Fiendish Legacy', livello: 1, srd: { pagina: 86 }, effetti: [carScelta('tiefling.caratteristica', 86)] },
    ],
  },
};
