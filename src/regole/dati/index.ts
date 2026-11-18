import type { Background, Classe, Incantesimo, Oggetto, Specie, Talento } from '../tipi';
import { OGGETTI } from './oggetti';
import { CORREZIONI_INCANTESIMI } from './dadi-incantesimi';
import { CLASSI } from './classi';

import incantesimi from './incantesimi.json';
import { BACKGROUND, TALENTI } from './origini';
import { SPECIE } from './specie';

export interface Dati {
  classi: Record<string, Classe>;
  specie: Record<string, Specie>;
  background: Record<string, Background>;
  talenti: Record<string, Talento>;
  incantesimi: Record<string, Incantesimo>;
  oggetti: Record<string, Oggetto>;
}

export const DATI: Dati = {
  classi: CLASSI,
  specie: SPECIE,
  background: BACKGROUND,
  talenti: TALENTI,
  incantesimi: Object.fromEntries((incantesimi as Incantesimo[]).map((i) => [i.id, { ...i, ...CORREZIONI_INCANTESIMI[i.id] }])),
  oggetti: OGGETTI,
};

export const NOME_LISTA: Record<string, string> = {
  bard: 'Bardo', cleric: 'Chierico', druid: 'Druido', paladin: 'Paladino', ranger: 'Ranger',
  sorcerer: 'Stregone', warlock: 'Warlock', wizard: 'Mago',
};
